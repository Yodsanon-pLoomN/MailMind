// ไฟล์: backend/src/routes/email.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { getEmails } = require('../controllers/email.controller');
const { markAsRead } = require('../controllers/email.controller');
const { getThread } = require('../controllers/email.controller');
// ต้องแนบ JWT Token มาด้วยถึงจะดึงเมลได้
router.get('/', verifyToken, getEmails);
router.post('/mark-read', verifyToken, markAsRead);
router.get('/:threadId', verifyToken, getThread);
module.exports = router;