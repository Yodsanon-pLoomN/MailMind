const prisma = require('../config/prisma');

// ฟังก์ชันสำหรับผูกไฟล์ที่อัปโหลดเข้ากับ Draft
exports.addAttachmentsToDraft = async (req, res) => {
  try {
    const { draftId, files } = req.body; // files จะเป็น Array ของ Object { url, name, size, type }

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "ไม่มีข้อมูลไฟล์" });
    }

    // บันทึกลงตาราง Attachment หลายรายการพร้อมกัน
    const attachments = await prisma.attachment.createMany({
      data: files.map((file) => ({
        draftId: draftId,
        fileUrl: file.url,
        fileName: file.name || "unnamed_file",
        fileType: file.type || "application/octet-stream",
        fileSize: file.size || 0,
      })),
    });

    res.json({ success: true, count: attachments.count });
  } catch (error) {
    console.error("Save Attachment Error:", error);
    res.status(500).json({ error: "ไม่สามารถบันทึกข้อมูลไฟล์แนบได้" });
  }
};