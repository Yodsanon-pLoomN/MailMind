// backend/src/routes/draft.js
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { verifyToken } = require('../middlewares/auth');
const { google } = require('googleapis');
const { oauth2Client } = require('../config/google');

// ✅ นำเข้า Service ที่แยกหมวดหมู่ชัดเจน
const gmailService = require('../services/gmailService');
const calendarService = require('../services/calendarService');
const { addAttachmentsToDraft } = require('../controllers/draft');
// ดึงรายการ Draft ที่รอดำเนินการ
router.get('/', verifyToken, async (req, res) => {
  try {
    const drafts = await prisma.draft.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(drafts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ยกเลิก Draft (Reject)
router.post('/:id/reject', verifyToken, async (req, res) => {
  try {
    await prisma.draft.update({
      where: { id: req.params.id, userId: req.user.id },
      data: { status: 'REJECTED' }
    });
    res.json({ message: "ยกเลิก Draft เรียบร้อย" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// อนุมัติและส่งอีเมล (Approve & Send)
router.post('/:id/send', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { editedReply } = req.body; 

    // 1. ดึงข้อมูล Draft จาก Database
    const draft = await prisma.draft.findUnique({ where: { id, userId: req.user.id } });
    if (!draft) return res.status(404).json({ error: "ไม่พบ Draft นี้" });

    const user = await prisma.user.findUnique({ 
      where: { id: req.user.id },
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
});


router.post('/attachments', verifyToken, addAttachmentsToDraft);

module.exports = router;