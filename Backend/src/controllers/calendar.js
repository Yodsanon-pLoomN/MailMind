const { google } = require('googleapis');
const prisma = require('../config/prisma');
const { oauth2Client } = require('../config/google');

exports.getEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || !user.refreshToken) {
      return res.status(401).json({ error: 'ไม่พบการเชื่อมต่อกับ Google' });
    }

    oauth2Client.setCredentials({
      refresh_token: user.refreshToken,
      access_token: user.accessToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // ดึงปฏิทินย้อนหลัง 1 เดือน และล่วงหน้า 2 เดือน เพื่อให้ครอบคลุมการกดเลื่อนดู
    const timeMin = new Date();
    timeMin.setMonth(timeMin.getMonth() - 1);
    
    const timeMax = new Date();
    timeMax.setMonth(timeMax.getMonth() + 2);

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      maxResults: 2500, // ดึงสูงสุด
      singleEvents: true, // แตกกิจกรรมที่ทำซ้ำ (recurring) เป็นรายวันให้เลย
      orderBy: 'startTime',
    });

    const events = response.data.items.map(item => ({
      id: item.id,
      summary: item.summary || '(ไม่มีชื่อกิจกรรม)',
      start: item.start?.dateTime || item.start?.date || null,
      end: item.end?.dateTime || item.end?.date || null,
      location: item.location || '',
      htmlLink: item.htmlLink || ''
    }));

    res.json({ items: events });

  } catch (error) {
    console.error('Calendar error:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลปฏิทิน' });
  }
};