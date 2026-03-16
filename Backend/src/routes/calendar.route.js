const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { getEvents } = require('../controllers/calendar.controller');

router.get('/', verifyToken, getEvents);

module.exports = router;