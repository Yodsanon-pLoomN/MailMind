const cron = require('node-cron');
const { google } = require('googleapis');
const prisma = require('../config/prisma');
const { oauth2Client } = require('../config/google');
const geminiService = require('../services/ai/gemini');
const { decrypt } = require('../utils/encryption');

// ฟังก์ชันดึง Text ออกจาก Email
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

// ฟังก์ชันหลักสำหรับดึงอีเมล
const checkNewEmails = async () => {
  console.log("⏳ [CRON] Checking for new emails...");
  try {
    const users = await prisma.user.findMany({
      where: { refreshToken: { not: null } },
      include: { setting: true, apiKeys: true }
    });

    // ลูปเช็คทีละ User
    for (const user of users) {
      try { // 🛡️ ใส่ try...catch ครอบระดับ User (ถ้าคนนี้ Error จะได้ไม่พากันพังทั้งระบบ)
        if (!user.setting) continue;

        // เซ็ต Token ของ User คนนี้เพื่อคุยกับ Google API
        oauth2Client.setCredentials({ 
          refresh_token: user.refreshToken, 
          access_token: user.accessToken 
        });
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        
        // 🌟 ดึงเวลา Sync ล่าสุดจาก Database (ถ้าไม่มีให้ย้อนหลัง 1 ชั่วโมง)
        const lastSyncDate = user.setting.lastEmailSync || new Date(Date.now() - 60 * 60 * 1000);
        const lastSyncUnix = Math.floor(lastSyncDate.getTime() / 1000);

        // 🌟 ค้นหาเฉพาะอีเมลที่เข้ามา "ใหม่กว่า" เวลาที่เคย Sync
        const res = await gmail.users.messages.list({ 
          userId: 'me', 
          q: `newer:${lastSyncUnix}`, 
          maxResults: 10 
        });
        
        const messages = res.data.messages || [];
        
        // ถ้าไม่มีเมลใหม่เลย ให้อัปเดตเวลา Sync เป็นปัจจุบัน แล้วข้ามไปคนต่อไปเลย
        if (messages.length === 0) {
          await prisma.userSetting.update({
            where: { userId: user.id },
            data: { lastEmailSync: new Date() }
          });
          continue; 
        }

        console.log(`\n📥 พบอีเมลใหม่ ${messages.length} ฉบับ ของ User: ${user.email}`);

        // ลูปอ่านอีเมลแต่ละฉบับที่เพิ่งเข้ามาใหม่
        for (const msg of messages) {
          // ด่านที่ 1: เช็คว่าเมลนี้เคยอ่านและดราฟต์ไว้หรือยัง (กันซ้ำ)
          const existingDraft = await prisma.draft.findUnique({ where: { messageId: msg.id } });
          if (existingDraft) {
            console.log(`⏭️ เมล ID: ${msg.id} เคยดราฟต์ไปแล้ว ข้าม...`);
            continue;
          }

          const mailDetail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'full' });
          const text = getEmailText(mailDetail.data.payload);
          const headers = mailDetail.data.payload.headers;
          const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || "No Subject";
          
          console.log(`📧 ตรวจสอบเมลหัวข้อ: "${subject}"`);

          // ด่านที่ 2: กรองคำคีย์เวิร์ด
          const keywords = ["นัด", "ประชุม", "meeting", "zoom", "เวลา", "วันที่", "appointment", "schedule", "ว่างไหม"];
          const hasKeyword = keywords.some(kw => text.toLowerCase().includes(kw));

          if (hasKeyword) {
            const geminiKeyObj = user.apiKeys.find(k => k.provider === 'gemini');
            if (!geminiKeyObj) {
              console.log(`❌ ผู้ใช้นี้ยังไม่ได้เซฟ API Key ของ Gemini ไว้`);
              continue;
            }
            
            // ถอดรหัส API Key เพื่อเอาไปใช้งาน
            const realApiKey = decrypt(geminiKeyObj.encryptedKey, geminiKeyObj.iv, geminiKeyObj.authTag);
            
            // 🤖 สเตป 1: ส่งให้ AI วิเคราะห์ว่าใช่นัดหมายไหม
            const aiResult = await geminiService.extractAppointment(realApiKey, text);
            
            if (aiResult.isAppointment && aiResult.date) {
              console.log(`🎯 AI ยืนยันว่าใช่นัดหมาย! วันที่: ${aiResult.date}`);

              // 📅 สเตป 2: เช็คคิวปฏิทิน (+/- 2 ชั่วโมงจากเวลานัด)
              const eventDate = new Date(aiResult.date);
              const timeMin = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000).toISOString();
              const timeMax = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString();

              const calRes = await calendar.events.list({
                calendarId: 'primary', timeMin, timeMax, singleEvents: true, orderBy: 'startTime'
              });

              const existingEvents = calRes.data.items.map(e => ({
                summary: e.summary,
                start: e.start.dateTime || e.start.date,
                end: e.end.dateTime || e.end.date
              }));

              // ✍️ สเตป 3: ส่งข้อมูลให้ AI ร่างข้อความตอบกลับ
              const draftResult = await geminiService.draftReplyWithCalendar(
                realApiKey, text, aiResult, existingEvents, user.setting.tone || "formal"
              );

              // 💾 สเตป 4: บันทึก Draft ลง Database
              if (draftResult.draftMessage) {
                await prisma.draft.create({
                  data: {
                    userId: user.id,
                    messageId: msg.id,
                    threadId: mailDetail.data.threadId,
                    subject: subject,
                    suggestedDate: eventDate,
                    location: aiResult.location,
                    draftReply: draftResult.draftMessage,
                    status: "PENDING"
                  }
                });
                console.log(`🎉 ดราฟต์เสร็จสมบูรณ์! บันทึกลงฐานข้อมูลแล้ว`);
              }
            } else {
               console.log(`ℹ️ AI บอกว่าไม่ใช่เมลนัดหมาย ข้าม...`);
            }
          } else {
             console.log(`⏭️ ไม่มีคีย์เวิร์ดเกี่ยวกับการนัดหมาย ข้าม...`);
          }
        } // สิ้นสุดลูป messages

        // 🌟 อัปเดตเวลาเช็คเมลล่าสุดของ User คนนี้เมื่อทำงานทุกอย่างเสร็จสิ้น
        await prisma.userSetting.update({
          where: { userId: user.id },
          data: { lastEmailSync: new Date() }
        });

      } catch (userError) {
        // 🛡️ ถ้า User คนนี้มีปัญหา (เช่น Token หมดอายุ) ก็จะมาร่วงที่ตรงนี้ แต่คนอื่นยังทำงานต่อได้
        console.error(`❌ เกิดข้อผิดพลาดกับ User ${user.email}:`, userError.message);
      }
    } // สิ้นสุดลูป users

  } catch (error) {
    console.error("❌ [CRON] ระบบรวมขัดข้อง:", error);
  }
};

const startCron = () => {
  // รันทุกๆ 2 นาที (ปรับเปลี่ยนรอบเวลาได้ตามต้องการ)
  cron.schedule('*/2 * * * *', checkNewEmails); 
  console.log("🕰️ Email Watcher Cron Job started (Runs every 2 minutes)");
};

module.exports = { startCron };