// backend/src/routes/draft.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');

const { 
  getDrafts,
  generateDraftOnDemand, 
  rejectDraft,
  approveAndSendDraft 
} = require('../controllers/draft');

// ดึงรายการ Draft ที่รอดำเนินการ
router.get('/', verifyToken, getDrafts);

// สั่ง AI สร้างร่างคำตอบ (On-Demand)
router.post('/generate', verifyToken, generateDraftOnDemand);

// ยกเลิก Draft (Reject)
router.post('/:id/reject', verifyToken, rejectDraft);

// อนุมัติและส่งอีเมล (Approve & Send)
router.post('/:id/send', verifyToken, approveAndSendDraft);

module.exports = router;