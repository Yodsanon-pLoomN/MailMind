const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/auth');

const { 
  getSettings, 
  updateSettings, 
  saveApiKey, 
  deleteApiKey,
  testApiKey,
  toggleCronActive
} = require('../controllers/setting');

router.get('/', verifyToken, getSettings);
router.put('/', verifyToken, updateSettings);
router.post('/key', verifyToken, saveApiKey);
router.delete('/key/:provider', verifyToken, deleteApiKey);
router.post('/test-key', verifyToken, testApiKey);
router.patch('/toggle-cron', verifyToken, toggleCronActive);

module.exports = router;