const { google } = require('googleapis');
const prisma = require('../config/prisma');
const { oauth2Client } = require('../config/google');
const { decrypt } = require('../utils/encryption');

// ดึง AI Services
const geminiService = require('./ai/gemini');
const openaiService = require('./ai/openai');
const claudeService = require('./ai/claude');
const openrouterService = require('./ai/openrouter');
const intelsphereService = require('./ai/intelsphere');

// ดึง Google Services (สมมติว่าคุณมี 2 ไฟล์นี้อยู่แล้วตามที่คอมเมนต์ไว้)
const gmailService = require('./gmail.service'); 
const calendarService = require('./calendar.service');

// Helper: แกะข้อความอีเมล
const getEmailText = (payload) => {
  let text = '';
  if (!payload) return text;
  if (payload.parts) {
    payload.parts.forEach(part => {
      if (part.mimeType === 'text/plain' && part.body.data) {
        text += Buffer.from(part.body.data, 'base64').toString('utf8');
      } else if (part.parts) { text += getEmailText(part); }
    });
  } else if (payload.body && payload.body.data) {
    text = Buffer.from(payload.body.data, 'base64').toString('utf8');
  }
  return text;
};

exports.generateDraft = async (userId, threadId) => {
  // 1. ดึงข้อมูลและตรวจสอบ
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { setting: true, apiKeys: true }
  });

  if (!user.apiKeys || user.apiKeys.length === 0) {
    throw new Error('กรุณาตั้งค่า API Key ของ AI ก่อนใช้งาน');
  }

  const targetProvider = user.setting?.defaultProvider || 'gemini';
  const targetModel = user.setting?.defaultModel || 'gemini-2.5-flash';
  const activeKeyObj = user.apiKeys.find(key => key.provider === targetProvider);

  if (!activeKeyObj) {
    throw new Error(`คุณเลือกใช้ค่าย ${targetProvider.toUpperCase()} แต่ยังไม่ได้ตั้งค่า API Key สำหรับค่ายนี้`);
  }

  const realApiKey = decrypt(activeKeyObj.encryptedKey, activeKeyObj.iv, activeKeyObj.authTag);
  
  // 2. เลือกค่าย AI
  let activeAiService;
  if (targetProvider === 'gemini') activeAiService = geminiService;
  else if (targetProvider === 'openai') activeAiService = openaiService;
  else if (targetProvider === 'claude') activeAiService = claudeService;
  else if (targetProvider === 'openrouter') activeAiService = openrouterService;
  else if (targetProvider === 'intelsphere') activeAiService = intelsphereService;
  else throw new Error('ไม่พบผู้ให้บริการ AI ที่ระบุ');

  // 3. ดึงอีเมล
  oauth2Client.setCredentials({ refresh_token: user.refreshToken, access_token: user.accessToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const threadDetail = await gmail.users.threads.get({ userId: 'me', id: threadId });
  let fullThreadText = "";
  threadDetail.data.messages.forEach((tMsg) => {
    const tText = getEmailText(tMsg.payload);
    const headers = tMsg.payload.headers;
    const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown';
    fullThreadText += `\n--- Email From: ${fromHeader} ---\n${tText.trim()}\n`;
  });
    console.log(`\n[AI] 🤖 Generating draft using Provider: ${targetProvider.toUpperCase()} | Model: ${targetModel}\n`);
  // 4. สั่ง AI วิเคราะห์
  const aiResult = await activeAiService.extractAppointment(realApiKey, fullThreadText, targetModel);

  // 5. ดึงข้อมูล Calendar
  let existingEvents = [];
  if (aiResult.isAppointment && aiResult.date) {
    const eventDate = new Date(aiResult.date);
    const timeMin = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString();
    try {
      const calRes = await calendar.events.list({
        calendarId: 'primary', timeMin, timeMax, singleEvents: true, orderBy: 'startTime'
      });
      existingEvents = calRes.data.items.map(e => ({
        summary: e.summary, start: e.start.dateTime || e.start.date, end: e.end.dateTime || e.end.date
      }));
    } catch (err) { console.error("Calendar Fetch Error:", err.message); }
  }

  // 6. ร่างอีเมล
  const draftResult = await activeAiService.draftReplyWithCalendar(
    realApiKey, fullThreadText, aiResult, existingEvents, user.setting, targetModel
  );

  return {
    isAppointment: aiResult.isAppointment,
    draftReply: draftResult.draftMessage || ''
  };
};

exports.approveAndSend = async (userId, draftId, editedReply) => {
  const draft = await prisma.draft.findUnique({ where: { id: draftId, userId } });
  if (!draft) throw new Error("ไม่พบ Draft นี้");

  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    include: { setting: true }
  });
  
  oauth2Client.setCredentials({ refresh_token: user.refreshToken, access_token: user.accessToken });
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const metadata = await gmailService.getOriginalEmailMetadata(gmail, draft.messageId);
  await gmailService.sendEmailReply(gmail, draft, metadata, editedReply);

  try {
    await calendarService.addEventToCalendar(
      calendar, 
      draft, 
      metadata, 
      user.setting?.timezone,
      oauth2Client,
      user.email
    );
  } catch (calError) {
    console.error("❌ Calendar Insert Error:", calError.message);
  }

  await prisma.draft.update({
    where: { id: draftId },
    data: { status: 'APPROVED', draftReply: editedReply || draft.draftReply }
  });

  return { message: "ส่งอีเมลและบันทึกลงปฏิทินเรียบร้อยแล้ว!" };
};

exports.getUserDrafts = async (userId) => {
  return await prisma.draft.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};

exports.rejectDraft = async (userId, draftId) => {
  await prisma.draft.update({
    where: { id: draftId, userId },
    data: { status: 'REJECTED' }
  });
  return { message: "ยกเลิก Draft เรียบร้อย" };
};