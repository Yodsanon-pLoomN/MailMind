// backend/src/routes/summary.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const summaryController = require('../controllers/summary.controller');

// รองรับ GET /api/summary?type=DAILY&force=true
router.get('/', verifyToken, summaryController.getOrCreateSummary);

module.exports = router;