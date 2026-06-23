const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');

router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;