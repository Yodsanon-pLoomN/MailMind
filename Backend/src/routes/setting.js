const express = require('express');
const router = express.Router();

// นำเข้า Middleware สำหรับเช็คว่าล็อกอินแล้วหรือยัง (ใช้ตัวเดียวกับหน้าอีเมล/ปฏิทิน)
const { verifyToken } = require('../middlewares/auth');

// นำเข้าฟังก์ชันทั้งหมดจาก Controller
const { 
  getSettings, 
  updateSettings, 
  saveApiKey, 
  deleteApiKey,
  testApiKey
} = require('../controllers/setting');

// --- กำหนด Routes ---

// GET /api/settings : ดึงการตั้งค่าทั้งหมด
router.get('/', verifyToken, getSettings);

// PUT /api/settings : บันทึกการตั้งค่าทั่วไป (เวลา, วันทำงาน, โมเดล AI)
router.put('/', verifyToken, updateSettings);

// POST /api/settings/key : บันทึก API Key (เข้ารหัสลง DB)
router.post('/key', verifyToken, saveApiKey);

// DELETE /api/settings/key/:provider : ลบ API Key (เผื่ออนาคตทำปุ่มลบ)
router.delete('/key/:provider', verifyToken, deleteApiKey);
router.post('/test-key', verifyToken, testApiKey);
module.exports = router;