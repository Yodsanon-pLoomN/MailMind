require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const emailRoutes = require('./src/routes/email');
const threadRoutes = require('./src/routes/thread');
const calendarRoutes = require('./src/routes/calendar');
const settingRoutes = require('./src/routes/setting');
const draftRoutes = require('./src/routes/draft');
const { startCron } = require('./src/cron/emailWatcher');



const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/drafts', draftRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);

  startCron();
});