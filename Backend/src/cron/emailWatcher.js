const cron = require('node-cron');
const { google } = require('googleapis');
const prisma = require('../config/prisma');
const { oauth2Client } = require('../config/google');
const geminiService = require('../services/ai/gemini'); 
const notificationService = require('../services/notification.service'); // 🌟 นำเข้า Notification Service
const { decrypt } = require('../utils/encryption');
const { APPOINTMENT_KEYWORDS } = require('../config/constants'); 

// ฟังก์ชันแกะข้อความอีเมล
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
        const userSetting = user.setting;

        oauth2Client.setCredentials({ 
          refresh_token: user.refreshToken, 
          access_token: user.accessToken 
        });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        const lastSyncDate = user.setting.lastEmailSync || new Date(Date.now() - 60 * 60 * 1000);
        const lastSyncUnix = Math.floor(lastSyncDate.getTime() / 1000);

        // ดึงเฉพาะอีเมลที่ยังไม่ได้อ่าน และไม่ใช่ตัวเราส่งเอง
        const res = await gmail.users.messages.list({ 
          userId: 'me', 
          q: `newer:${lastSyncUnix} is:unread -from:me`, 
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
          const latestText = getEmailText(mailDetail.data.payload);
          const headers = mailDetail.data.payload.headers;
          const threadId = mailDetail.data.threadId;

          // จัดการล้างคำว่า "Re: " ที่ซ้อนกันใน Subject
          let rawSubject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || "No Subject";
          let cleanSubject = rawSubject.replace(/^(re:\s*)+/gi, '').trim(); 
          let msgFrom = headers.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown';
          
          console.log(`[EMAIL] Checking subject: "${cleanSubject}"`);

          // ดักจับอีเมลแจ้งเตือนจาก Calendar หรือระบบอัตโนมัติ
          const isAutoReply = /รับคำเชิญ|ปฏิเสธคำเชิญ|accepted:|declined:|canceled:|invitation:|คำเชิญ:|ตอบรับแล้ว/i.test(cleanSubject);
          if (isAutoReply) {
              console.log(`[SKIP] Auto-generated calendar notification detected. Skipping...`);
              continue; 
          }

          // เช็ค Keyword จาก Dictionary กลาง
          const hasKeyword = APPOINTMENT_KEYWORDS.some(kw => latestText.toLowerCase().includes(kw));

          if (hasKeyword) {
            const geminiKeyObj = user.apiKeys.find(k => k.provider === 'gemini');
            if (!geminiKeyObj) {
              console.log(`[ERROR] User does not have a saved Gemini API Key`);
              continue;
            }
            
            const realApiKey = decrypt(geminiKeyObj.encryptedKey, geminiKeyObj.iv, geminiKeyObj.authTag);
            
            // ดึงประวัติการคุยทั้ง Thread
            console.log(`[INFO] Fetching thread context for threadId: ${threadId}`);
            const threadDetail = await gmail.users.threads.get({ userId: 'me', id: threadId });
            
            let fullThreadText = "";
            threadDetail.data.messages.forEach((tMsg) => {
              const tText = getEmailText(tMsg.payload);
              const tHeaders = tMsg.payload.headers;
              const fromHeader = tHeaders.find(h => h.name.toLowerCase() === 'from')?.value || 'Unknown';
              const dateHeader = tHeaders.find(h => h.name.toLowerCase() === 'date')?.value || '';
              
              fullThreadText += `\n--- Email From: ${fromHeader} | Date: ${dateHeader} ---\n${tText.trim()}\n`;
            });

            console.log(`[AI] Sending full thread context to AI...`);

            // AI ประเมินการนัดหมายและ Priority
            const aiResult = await geminiService.extractAppointment(realApiKey, fullThreadText);
            console.log("[AI] Extraction Result:", aiResult);
            
            if (aiResult.isAppointment) {
              console.log(`[SUCCESS] Confirmed appointment request. Date: ${aiResult.date || 'Not specified'}`);

              let existingEvents = [];
              let eventDate = null;

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
              
              // AI แต่งอีเมลและเช็คเวลาทำงาน
              const draftResult = await geminiService.draftReplyWithCalendar(
                realApiKey, fullThreadText, aiResult, existingEvents, userSetting
              );

              if (draftResult.draftMessage) {
                const finalSuggestedDate = (aiResult.isTimeSpecified === true && draftResult.actionType === 'ACCEPT') ? eventDate : null;

                // บันทึก Draft ลง Database
                await prisma.draft.create({
                  data: {
                    userId: user.id,
                    messageId: msg.id,
                    threadId: threadId,
                    subject: cleanSubject,
                    suggestedDate: finalSuggestedDate,
                    location: aiResult.location,
                    draftReply: draftResult.draftMessage,
                    status: "PENDING",
                    priority: aiResult.priority || "NORMAL"
                  }
                });
                console.log(`[SUCCESS] Draft saved. Priority: ${aiResult.priority || "NORMAL"}`);

                try {
                  await notificationService.sendPendingDraftNotification(
                    oauth2Client, 
                    user.email, 
                    {
                      from: msgFrom, 
                      subject: cleanSubject
                    },
                    finalSuggestedDate
                  );
                } catch (notiErr) {
                  console.error(`[ERROR] Failed to send notification email:`, notiErr.message);
                }
              }
            } else {
               console.log(`[INFO] AI determined it's not an appointment. Skipping...`);
            }
          } else {
             console.log(`[SKIP] No appointment keywords found in the latest message. Skipping...`);
          }
        } 

        // อัปเดตตาราง userSetting 
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
  cron.schedule('*/5 * * * *', checkNewEmails); 
  console.log("[SYSTEM] Email Watcher Cron Job started (Runs every 5 minutes)");
};

module.exports = { startCron };