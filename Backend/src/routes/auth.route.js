const express = require('express');
const router = express.Router();
const { googleLogin, googleCallback } = require('../controllers/auth.controller');

router.get('/google', googleLogin);
router.get('/google/callback', googleCallback);

module.exports = router;