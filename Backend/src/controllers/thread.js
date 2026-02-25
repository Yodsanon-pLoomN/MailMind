const { google } = require('googleapis');
const prisma = require('../config/prisma');
const { oauth2Client } = require('../config/google');

// ฟังก์ชันแกะ Base64 เพื่ออ่านข้อความในอีเมล
const decodeBase64 = (data) => {
  if (!data) return '';
  const buff = Buffer.from(data, 'base64');
  return buff.toString('utf-8');
};

// ฟังก์ชันหาเนื้อหาจาก Payload โดยเน้น HTML ก่อน
const getEmailBody = (payload) => {
  let htmlBody = '';
  let textBody = '';

  const extract = (part) => {
    // เก็บ HTML ถ้าเจอ
    if (part.mimeType === 'text/html' && part.body?.data) {
      htmlBody += decodeBase64(part.body.data);
    } 
    // เก็บ Text เผื่อไว้กรณีอีเมลไม่มี HTML
    else if (part.mimeType === 'text/plain' && part.body?.data) {
      textBody += decodeBase64(part.body.data);
    } 
    // วนลูปเข้าไปค้นหาข้างในต่อ (สำหรับอีเมลที่มีไฟล์แนบหลายชั้น)
    else if (part.parts) {
      part.parts.forEach(extract);
    }
  };

  if (payload.parts) {
    payload.parts.forEach(extract);
  } else if (payload.body && payload.body.data) {
    if (payload.mimeType === 'text/html') htmlBody = decodeBase64(payload.body.data);
    else textBody = decodeBase64(payload.body.data);
  }

  // ส่ง HTML กลับไป ถ้าไม่มีก็ใช้ Text ธรรมดา
  return htmlBody || textBody || '';
};

exports.getThread = async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) {
      return res.status(401).json({ error: 'ไม่พบการเชื่อมต่อกับ Google' });
    }

    oauth2Client.setCredentials({
      refresh_token: user.refreshToken,
      access_token: user.accessToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // ดึงข้อมูลทั้ง Thread แบบ Full
    const threadRes = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'full'
    });

    const messages = threadRes.data.messages || [];

    // แปลงข้อมูลให้ตรงกับ Type ที่ Frontend ต้องการ
    const items = messages.map(msg => {
      const headers = msg.payload.headers;
      const subject = headers.find((h) => h.name === 'Subject')?.value || '(ไม่มีหัวข้อ)';
      const from = headers.find((h) => h.name === 'From')?.value || '(ไม่ทราบผู้ส่ง)';
      const date = headers.find((h) => h.name === 'Date')?.value || new Date(parseInt(msg.internalDate)).toISOString();
      
      const labels = msg.labelIds || [];
      const isRead = !labels.includes('UNREAD');

      const body = getEmailBody(msg.payload);

      return {
        id: msg.id,
        threadId: msg.threadId,
        from,
        subject,
        date,
        internalDate: msg.internalDate,
        snippet: msg.snippet,
        isRead,
        body
      };
    });

    res.json({ items });

  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลอีเมล' });
  }
};