const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { getEvents } = require('../controllers/calendar');

router.get('/', verifyToken, getEvents);

module.exports = router;