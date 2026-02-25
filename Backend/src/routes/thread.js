const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const { getThread } = require('../controllers/thread');

router.get('/:threadId', verifyToken, getThread);

module.exports = router;