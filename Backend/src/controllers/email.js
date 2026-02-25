// ไฟล์: backend/src/controllers/email.js
const { google } = require('googleapis');
const prisma = require('../config/prisma');
const { oauth2Client } = require('../config/google');

exports.getEmails = async (req, res) => {
  try {
    const { pageToken, pageSize = 10 } = req.query;
    const userId = req.user.id; // ได้มาจาก JWT Token

    // 1. ดึงข้อมูล User จาก Database เพื่อเอา Refresh Token
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user || !user.refreshToken) {
      return res.status(401).json({ error: 'ไม่พบการเชื่อมต่อกับ Google กรุณาล็อกอินใหม่' });
    }

    // 2. ตั้งค่า Token ให้กับ Google API Client
    oauth2Client.setCredentials({
      refresh_token: user.refreshToken,
      access_token: user.accessToken, // ถึง Access Token จะหมดอายุ googleapis จะใช้ Refresh Token ขอใหม่ให้อัตโนมัติ
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // 3. ดึงรายการ ID ของอีเมล (ได้มาแค่ ID กับ ThreadID)
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      maxResults: parseInt(pageSize),
      pageToken: pageToken,
      // q: '-category:promotions -category:social' // สามารถใส่ Query กรองพวกเมลโฆษณาทิ้งได้
    });

    const messages = listRes.data.messages || [];
    const nextPageToken = listRes.data.nextPageToken;

    // 4. วนลูปนำ ID ไปดึงรายละเอียดของแต่ละอีเมล (ใช้ Promise.all เพื่อให้ดึงพร้อมกัน 10 ฉบับ จะได้เร็วขึ้น)
    const emailDetailsPromises = messages.map(async (msg) => {
      const msgRes = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id,
        format: 'metadata', // ดึงแค่ Metadata (พวก Header) เพราะหน้า List เราไม่ได้ใช้ Body เต็มๆ
        metadataHeaders: ['Subject', 'From', 'Date'],
      });

      const data = msgRes.data;
      const headers = data.payload.headers;

      // แกะข้อมูล Header
      const subject = headers.find((h) => h.name === 'Subject')?.value || '(ไม่มีหัวข้อ)';
      const from = headers.find((h) => h.name === 'From')?.value || '(ไม่ทราบผู้ส่ง)';
      const date = headers.find((h) => h.name === 'Date')?.value || new Date(parseInt(data.internalDate)).toISOString();

      // เช็คสถานะการอ่านและป้ายกำกับ (Labels)
      const labels = data.labelIds || [];
      const isRead = !labels.includes('UNREAD');
      
      let status = '';
      if (labels.includes('SENT')) status = 'Sent';
      else if (labels.includes('DRAFT')) status = 'Draft';

      return {
        id: data.id,
        threadId: data.threadId,
        snippet: data.snippet,
        isRead,
        from,
        subject,
        date,
        status,
      };
    });

    const items = await Promise.all(emailDetailsPromises);

    // 5. ส่งกลับไปให้ Frontend ในรูปแบบที่ต้องการ
    res.json({
      items,
      nextPageToken,
      hasMore: !!nextPageToken,
    });

  } catch (error) {
    console.error('Error fetching emails from Google:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงอีเมล' });
  }
};