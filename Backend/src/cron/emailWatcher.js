const cron = require('node-cron');
const { google } = require('googleapis');
const prisma = require('../config/prisma');
const { oauth2Client } = require('../config/google');
const geminiService = require('../services/ai/gemini');
const { decrypt } = require('../utils/encryption');

const getEmailText = (payload) => {
  let text = '';
  if (!payload) return text;
  
  if (payload.parts) {
    payload.parts.forEach(part => {
      if (part.mimeType === 'text/plain' && part.body.data) {
        text += Buffer.from(part.body.data, 'base64').toString('utf8');
      } else if (part.parts) {
        text += getEmailText(part); 
      }
    });
  } else if (payload.body && payload.body.data) {
    text = Buffer.from(payload.body.data, 'base64').toString('utf8');
  }
  return text;
};

const checkNewEmails = async () => {
  console.log("[CRON] Checking for new emails...");
  try {
    const users = await prisma.user.findMany({
      where: { refreshToken: { not: null } },
      include: { setting: true, apiKeys: true }
    });

    for (const user of users) {
      try {
        if (!user.setting) continue;

        oauth2Client.setCredentials({ 
          refresh_token: user.refreshToken, 
          access_token: user.accessToken 
        });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const lastSyncDate = user.setting.lastEmailSync || new Date(Date.now() - 60 * 60 * 1000);
        const lastSyncUnix = Math.floor(lastSyncDate.getTime() / 1000);

        const res = await gmail.users.messages.list({ 
          userId: 'me', 
          q: `newer:${lastSyncUnix}`, 
          maxResults: 10 
        });
        
        const messages = res.data.messages || [];
        
        if (messages.length === 0) {
          await prisma.userSetting.update({
            where: { userId: user.id },
            data: { lastEmailSync: new Date() }
          });
          continue; 
        }

        console.log(`\n[INFO] Found ${messages.length} new emails for User: ${user.email}`);

        for (const msg of messages) {
          const existingDraft = await prisma.draft.findUnique({ where: { messageId: msg.id } });
          if (existingDraft) {
            console.log(`[SKIP] Email ID: ${msg.id} already drafted. Skipping...`);
            continue;
          }

          const mailDetail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
          const text = getEmailText(mailDetail.data.payload);
          const headers = mailDetail.data.payload.headers;
          const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || "No Subject";
          
          console.log(`[EMAIL] Checking subject: "${subject}"`);

          const keywords = ["นัด", "ประชุม", "meeting", "zoom", "เวลา", "วันที่", "appointment", "schedule", "ว่างไหม", "เที่ยว"];
          const hasKeyword = keywords.some(kw => text.toLowerCase().includes(kw));

          if (hasKeyword) {
            const geminiKeyObj = user.apiKeys.find(k => k.provider === 'gemini');
            if (!geminiKeyObj) {
              console.log(`[ERROR] User does not have a saved Gemini API Key`);
              continue;
            }
            
            const realApiKey = decrypt(geminiKeyObj.encryptedKey, geminiKeyObj.iv, geminiKeyObj.authTag);
            
            // ส่งให้ AI วิเคราะห์
            const aiResult = await geminiService.extractAppointment(realApiKey, text);
            console.log("[AI] Extraction Result:", aiResult);
            
            // เช็คแค่ว่าเป็นนัดหมายก็พอ ไม่บังคับว่าต้องมี Date
            if (aiResult.isAppointment) {
              console.log(`[SUCCESS] Confirmed appointment request. Date: ${aiResult.date || 'Not specified'}`);

              let existingEvents = [];
              let eventDate = null;

              // เช็คปฏิทินเฉพาะตอนที่ AI หาวันที่เจอเท่านั้น
              if (aiResult.date) {
                eventDate = new Date(aiResult.date);
                const timeMin = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000).toISOString();
                const timeMax = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString();

                try {
                  const calRes = await calendar.events.list({
                    calendarId: 'primary', timeMin, timeMax, singleEvents: true, orderBy: 'startTime'
                  });

                  existingEvents = calRes.data.items.map(e => ({
                    summary: e.summary,
                    start: e.start.dateTime || e.start.date,
                    end: e.end.dateTime || e.end.date
                  }));
                } catch (err) {
                  console.error("[ERROR] Calendar Error:", err.message);
                }
              }

              console.log(`[PROCESS] Generating draft reply...`);
              const draftResult = await geminiService.draftReplyWithCalendar(
                realApiKey, text, aiResult, existingEvents, user.setting.tone || "formal"
              );

              if (draftResult.draftMessage) {
                await prisma.draft.create({
                  data: {
                    userId: user.id,
                    messageId: msg.id,
                    threadId: mailDetail.data.threadId,
                    subject: subject,
                    suggestedDate: eventDate, // ถ้าหาวันที่ไม่เจอ จะถูกบันทึกเป็น null ใน DB
                    location: aiResult.location,
                    draftReply: draftResult.draftMessage,
                    status: "PENDING"
                  }
                });
                console.log(`[SUCCESS] Draft saved to database successfully.`);
              }
            } else {
               console.log(`[INFO] AI determined it's not an appointment. Skipping...`);
            }
          } else {
             console.log(`[SKIP] No appointment keywords found. Skipping...`);
          }
        } 

        await prisma.userSetting.update({
          where: { userId: user.id },
          data: { lastEmailSync: new Date() }
        });

      } catch (userError) {
        console.error(`[ERROR] User processing failed for ${user.email}:`, userError.message);
      }
    } 

  } catch (error) {
    console.error("[CRON ERROR] System failure:", error);
  }
};

const startCron = () => {
  cron.schedule('*/1 * * * *', checkNewEmails); 
  console.log("[SYSTEM] Email Watcher Cron Job started (Runs every 1 minute)");
};

module.exports = { startCron };