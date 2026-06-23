// backend/src/config/constants.js

const AI_DICTIONARY = {
  APPOINTMENT_KEYWORDS: [
    "นัด", "ประชุม", "meeting", "zoom", "เวลา", "วันที่", 
    "appointment", "schedule", "ว่างไหม", "เที่ยว", 
    "ตกลง", "สะดวก", "โอเค", "ok", "ยืนยัน"
  ],

  PRIORITY_RULES: {
    HIGH: "คำที่แสดงความเร่งด่วน เช่น ด่วน, asap, ด่วนที่สุด, ฉุกเฉิน, เลื่อนด่วน, หรือมาจาก VIP (หัวหน้า, ผู้บริหาร, boss)",
    LOW: "อีเมลแจ้งเพื่อทราบ, แจ้งข่าวสาร (newsletter), ประชาสัมพันธ์ทั่วไป, หรือการทักทายที่ไม่ได้ระบุเนื้อหางานชัดเจน",
    NORMAL: "การขอนัดหมายทั่วไป, การอัปเดตงาน, หรืออีเมลที่ไม่มีคำแสดงความเร่งด่วน"
  },

  DEFAULT_WORKING_HOURS: {
    start: "09:00",
    end: "17:00",
    days: "วันจันทร์ ถึง วันศุกร์"
  }
};

module.exports = AI_DICTIONARY;