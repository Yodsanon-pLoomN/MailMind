require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth.route');
const userRoutes = require('./src/routes/user.route');
const emailRoutes = require('./src/routes/email.route');
const calendarRoutes = require('./src/routes/calendar.route');
const settingRoutes = require('./src/routes/setting.route');
const draftRoutes = require('./src/routes/draft.route');
const summaryRoutes = require('./src/routes/summary.route');
const { startCron } = require('./src/cron/emailWatcher');


const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/threads', emailRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/drafts', draftRoutes);
app.use('/api/summary', summaryRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);

  startCron();
});
