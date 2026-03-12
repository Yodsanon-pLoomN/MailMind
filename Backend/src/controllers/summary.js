const { google } = require('googleapis');
const prisma = require('../config/prisma');
const { oauth2Client } = require('../config/google');
const { decrypt } = require('../utils/encryption');
const { buildScheduleSummaryPrompt } = require('../services/ai/prompts');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { OpenAI } = require('openai');

// Helper ฟังก์ชันหาจุดเริ่มต้น-สิ้นสุดของเวลา (Reset เวลาให้เป็น 00:00 เสมอ)
const getTimeRange = (type) => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (type === 'DAILY') {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'WEEKLY') {
    const day = now.getDay() || 7; // จันทร์-อาทิตย์
    start.setDate(now.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (type === 'MONTHLY') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(now.getMonth() + 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  }
  return { timeMin: start, timeMax: end };
};

exports.getOrCreateSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const type = (req.query.type || 'DAILY').toUpperCase();
    
    // 🌟 จุดแก้ที่ 1: ตรวจสอบ force แบบเข้มงวด (สตริง "true" เท่านั้นถึงจะถือว่าเป็น true)
    const isForce = req.query.force === 'true';

    const { timeMin, timeMax } = getTimeRange(type);

    console.log(`[SUMMARY] Type: ${type} | Force: ${isForce}`);
    console.log(`[SUMMARY] Range: ${timeMin.toISOString()} TO ${timeMax.toISOString()}`);

    // 🌟 จุดแก้ที่ 2: ตรวจสอบ Database ก่อนเสมอถ้าไม่ได้สั่ง force=true
    if (!isForce) {
      const existingSummary = await prisma.summary.findFirst({
        where: {
          userId: userId,
          type: type,
          periodStart: timeMin, // เทียบแค่ตัวเริ่มต้นที่ถูกล้างเวลาแล้ว
        }
      });

      if (existingSummary) {
        console.log(`[SUMMARY] ✅ Found existing summary in DB. No AI call needed.`);
        return res.json({ content: existingSummary.content });
      }
    }

    console.log(`[SUMMARY] ✨ No cache found or forced. Calling AI...`);

    // 2. ดึงข้อมูล User และ API Key
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { apiKeys: true }
    });

    if (!user || !user.apiKeys || user.apiKeys.length === 0) {
      return res.status(400).json({ error: 'กรุณาตั้งค่า API Key ของ AI ก่อนใช้งาน' });
    }

    // 3. ดึง Google Calendar Events
    oauth2Client.setCredentials({ refresh_token: user.refreshToken, access_token: user.accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const calRes = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = (calRes.data.items || []).map(e => ({
      summary: e.summary,
      start: e.start.dateTime || e.start.date,
      end: e.end.dateTime || e.end.date
    }));

    // 4. สั่ง AI เขียนสรุป
    const activeKeyObj = user.apiKeys[0];
    const realApiKey = decrypt(activeKeyObj.encryptedKey, activeKeyObj.iv, activeKeyObj.authTag);
    const dateContext = `วันนี้คือ ${new Date().toLocaleDateString('th-TH', { dateStyle: 'full' })}`;
    const prompt = buildScheduleSummaryPrompt(events, type, dateContext);

    let summaryContent = '';

    if (activeKeyObj.provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(realApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      summaryContent = result.response.text();
    } else {
      const baseURL = activeKeyObj.provider === 'openrouter' ? "https://openrouter.ai/api/v1" : undefined;
      const modelName = activeKeyObj.provider === 'openrouter' ? "stepfun/step-3.5-flash:free" : "gpt-4o-mini";
      const openai = new OpenAI({ apiKey: realApiKey, baseURL });
      const response = await openai.chat.completions.create({
        model: modelName,
        messages: [{ role: "user", content: prompt }]
      });
      summaryContent = response.choices[0].message.content;
    }

    // 5. บันทึก/อัปเดตลง Database
    const savedSummary = await prisma.summary.upsert({
      where: {
        userId_type_periodStart_periodEnd: {
          userId,
          type: type,
          periodStart: timeMin,
          periodEnd: timeMax,
        }
      },
      update: {
        content: summaryContent,
        createdAt: new Date(),
      },
      create: {
        userId,
        type: type,
        periodStart: timeMin,
        periodEnd: timeMax,
        content: summaryContent,
      }
    });

    res.json({ content: savedSummary.content });

  } catch (error) {
    console.error("Summary Generation Error:", error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างสรุปตารางงาน' });
  }
};