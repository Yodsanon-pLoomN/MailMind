const summaryService = require('../services/summary.service');

exports.getOrCreateSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const type = (req.query.type || 'DAILY').toUpperCase();
    const isForce = req.query.force === 'true';

    // 🌟 โยนพารามิเตอร์ให้ Service จัดการ แล้วรอรับแค่ข้อความสรุปกลับมา
    const content = await summaryService.getOrGenerateSummary(userId, type, isForce);

    res.json({ content });

  } catch (error) {
    console.error("Summary Generation Error:", error.message);
    
    // ดักจับ Error ที่เป็นฝั่ง User (เช่น ลืมกรอก API Key)
    if (error.message.includes('กรุณาตั้งค่า') || error.message.includes('แต่ยังไม่ได้ตั้งค่า')) {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างสรุปตารางงาน' });
  }
};