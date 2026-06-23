const { oauth2Client, SCOPES } = require('../config/google');
const authService = require('../services/auth.service'); // 👈 ดึง Service มาใช้งาน

// ฟังก์ชันนี้เป็นเรื่องของการส่ง URL ให้ User เลยอยู่ใน Controller ได้เลย
exports.googleLogin = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });
  res.redirect(url);
};

exports.googleCallback = async (req, res) => {
  const { code } = req.query;

  // ตรวจสอบข้อมูลเบื้องต้น (Validation)
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/?error=missing_code`);
  }

  try {
    // 🌟 โยน Code ให้ Service ไปจัดการกระบวนการทั้งหมดที่เหลือ
    const userToken = await authService.processGoogleCallback(code);

    // รับผลลัพธ์มาแล้ว ก็ทำหน้าที่ของ Controller คือ Redirect กลับหน้าเว็บ
    res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${userToken}`);
    
  } catch (error) {
    console.error('OAuth Error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/?error=auth_failed`);
  }
};