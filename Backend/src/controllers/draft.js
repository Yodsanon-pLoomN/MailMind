const { google } = require('googleapis');
const prisma = require('../config/prisma');
const { oauth2Client } = require('../config/google');
const { decrypt } = require('../utils/encryption');

// ดึง AI Services ทั้งหมดมาเตรียมไว้
const geminiService = require('../services/ai/gemini');
const openaiService = require('../services/ai/openai');
const claudeService = require('../services/ai/claude');
const openrouterService = require('../services/ai/openrouter');

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

exports.generateDraftOnDemand = async (req, res) => {
  try {
    const { messageId, threadId } = req.body;
    const userId = req.user.id;

    // 1. ดึง User และ API Keys
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { setting: true, apiKeys: true }
    });

    if (!user.apiKeys || user.apiKeys.length === 0) {
      return res.status(400).json({ error: 'กรุณาตั้งค่า API Key ของ AI ก่อนใช้งาน' });
    }

    // เลือกว่าจะใช้ค่ายไหน (ยึดตามค่ายแรกที่เจอใน DB หรือที่คุณเซตไว้)
    const activeKeyObj = user.apiKeys[0]; 
    const realApiKey = decrypt(activeKeyObj.encryptedKey, activeKeyObj.iv, activeKeyObj.authTag);
    
    // ชี้เป้าไปที่ Service ของค่ายนั้นๆ
    let activeAiService;
    if (activeKeyObj.provider === 'gemini') activeAiService = geminiService;
    else if (activeKeyObj.provider === 'openai') activeAiService = openaiService;
    else if (activeKeyObj.provider === 'claude') activeAiService = claudeService;
    else if (activeKeyObj.provider === 'openrouter') activeAiService = openrouterService;

    // 2. ตั้งค่า Google API
    oauth2Client.setCredentials({ refresh_token: user.refreshToken, access_token: user.accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // 3. ดึงประวัติแชททั้งหมด
    const threadDetail = await gmail.users.threads.get({ userId: 'me', id: threadId });
    let fullThreadText = "";
    threadDetail.data.messages.forEach((tMsg) => {
      const tText = getEmailText(tMsg.payload);
      const headers = tMsg.payload.headers;
      const fromHeader = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown';
      fullThreadText += `\n--- Email From: ${fromHeader} ---\n${tText.trim()}\n`;
    });

    // 4. สั่ง AI วิเคราะห์
    console.log(`[AI] Generating draft using ${activeKeyObj.provider.toUpperCase()}...`);
    const aiResult = await activeAiService.extractAppointment(realApiKey, fullThreadText);

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
      } catch (err) { console.error("Calendar Error:", err.message); }
    }

    // 5. สั่ง AI ร่างอีเมล
    const draftResult = await activeAiService.draftReplyWithCalendar(
      realApiKey, fullThreadText, aiResult, existingEvents, user.setting
    );

    // 6. ส่งกลับไปที่ Frontend
    res.json({
      isAppointment: aiResult.isAppointment,
      draftReply: draftResult.draftMessage || ''
    });

  } catch (error) {
    console.error('Draft Generation Error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการให้ AI สร้างข้อความร่าง' });
  }
};


exports.approveAndSendDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const { editedReply } = req.body; 
    const userId = req.user.id;

    // 1. ดึงข้อมูล Draft จาก Database
    const draft = await prisma.draft.findUnique({ where: { id, userId } });
    if (!draft) return res.status(404).json({ error: "ไม่พบ Draft นี้" });

    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { setting: true }
    });
    
    // 2. ตั้งค่า Google API Clients
    oauth2Client.setCredentials({ refresh_token: user.refreshToken, access_token: user.accessToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // 🚀 3. จัดการอีเมล (ผ่าน Gmail Service)
    const metadata = await gmailService.getOriginalEmailMetadata(gmail, draft.messageId);
    await gmailService.sendEmailReply(gmail, draft, metadata, editedReply);

    // 🚀 4. จัดการปฏิทิน (ผ่าน Calendar Service)
    try {
      await calendarService.addEventToCalendar(calendar, draft, metadata, user.setting?.timezone);
      console.log("📅 บันทึกลง Google Calendar สำเร็จ!");
    } catch (calError) {
      // ดัก Error ไว้ เพื่อให้แน่ใจว่าถึง Calendar พัง แต่เมลก็ถูกส่งออกไปแล้ว
      console.error("❌ Calendar Insert Error:", calError.message);
    }

    // 5. อัปเดตสถานะใน Database
    await prisma.draft.update({
      where: { id },
      data: { status: 'APPROVED', draftReply: editedReply || draft.draftReply }
    });

    res.json({ message: "ส่งอีเมลและบันทึกลงปฏิทินเรียบร้อยแล้ว!" });
  } catch (error) {
    console.error("Send Action Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// ดึงรายการ Draft ทั้งหมดของ User
exports.getDrafts = async (req, res) => {
  try {
    const userId = req.user.id;
    const drafts = await prisma.draft.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(drafts);
  } catch (error) {
    console.error("Get Drafts Error:", error);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูล Draft ได้" });
  }
};

// ยกเลิก Draft (Reject)
exports.rejectDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.draft.update({
      where: { id, userId },
      data: { status: 'REJECTED' }
    });

    res.json({ message: "ยกเลิก Draft เรียบร้อย" });
  } catch (error) {
    console.error("Reject Draft Error:", error);
    res.status(500).json({ error: "ไม่สามารถยกเลิก Draft ได้" });
  }
};