// ไฟล์: backend/src/routes/email.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { getEmails } = require('../controllers/email');

// ต้องแนบ JWT Token มาด้วยถึงจะดึงเมลได้
router.get('/', verifyToken, getEmails);

module.exports = router;