const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const { oauth2Client, SCOPES } = require('../config/google');
const prisma = require('../config/prisma');

exports.googleLogin = (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // บังคับให้ขอ Refresh Token
    prompt: 'consent',      // ถามสิทธิ์ทุกครั้ง
    scope: SCOPES,
  });
  res.redirect(url);
};

exports.googleCallback = async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data: userInfo } = await oauth2.userinfo.get();

    // บันทึกหรืออัปเดตลง Prisma
    const user = await prisma.user.upsert({
      where: { email: userInfo.email },
      update: {
        name: userInfo.name,
        picture: userInfo.picture,
        accessToken: tokens.access_token,
        ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
      },
      create: {
        googleId: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
    });

    // สร้าง JWT ของระบบเราเองด้วย ID จาก DB ของเรา
    const userToken = jwt.sign(
      { id: user.id, email: user.email, name: user.name, picture: user.picture },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.redirect(`${process.env.FRONTEND_URL}/login-success?token=${userToken}`);
  } catch (error) {
    console.error('OAuth Error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/?error=auth_failed`);
  }
};