const calendarService = require('../services/calendar.service');

exports.getEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 🌟 โยนงานหนักไปให้ Service จัดการ แล้วรอรับผลลัพธ์
    const events = await calendarService.getEventsForUser(userId);

    // ตอบกลับหน้าเว็บ
    res.json({ items: events });

  } catch (error) {
    console.error('Calendar error:', error.message);
    
    // ดักจับ Error ที่ส่งมาจาก Service ว่าใช่การหลุด Auth ไหม
    if (error.message === 'UNAUTHORIZED') {
      return res.status(401).json({ error: 'ไม่พบการเชื่อมต่อกับ Google' });
    }

    // ถ้าเป็น Error อื่นๆ เช่น เน็ตหลุด หรือ API Google ล่ม
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลปฏิทิน' });
  }
};