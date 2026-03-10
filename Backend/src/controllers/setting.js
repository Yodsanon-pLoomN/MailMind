const prisma = require('../config/prisma');
const { encrypt } = require('../utils/encryption');
const geminiService = require('../services/ai/gemini');
const openaiService = require('../services/ai/openai');
const claudeService = require('../services/ai/claude');
const openrouterService = require('../services/ai/openrouter'); // 👈 เพิ่มบรรทัดนี้

// 1. ดึงการตั้งค่าทั้งหมด (และเช็คว่ามี Key ค่ายไหนบ้าง)
exports.getSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // หา Setting ถ้าไม่มีให้สร้างใหม่ (upsert) ป้องกัน Error กรณีเปิดหน้าต่างนี้ครั้งแรก
    const setting = await prisma.userSetting.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    // หา API Keys ว่ามีของค่ายไหนบ้าง (ดึงมาแค่ชื่อ provider ห้ามดึง key ออกไปเด็ดขาด!)
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      select: { provider: true },
    });

    // แปลงให้อยู่ในรูปแบบ { gemini: true, openai: false, claude: true }
    const configuredKeys = {
      gemini: keys.some(k => k.provider === 'gemini'),
      openai: keys.some(k => k.provider === 'openai'),
      claude: keys.some(k => k.provider === 'claude'),
      openrouter: keys.some(k => k.provider === 'openrouter'),
    };

    res.json({ setting, configuredKeys });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการตั้งค่าได้' });
  }
};

// 2. อัปเดตการตั้งค่าทั่วไป (ทุกช่องในหน้า Frontend)
exports.updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // รับค่าทุกอย่างมาจาก Frontend (✨ เพิ่มฟิลด์ใหม่ทั้งหมดที่นี่)
    const { 
      isAutoReplyActive, // สวิตช์เปิด-ปิด AI
      defaultModel, 
      theme, 
      startTime, 
      endTime, 
      workDays, 
      timezone, 
      firstName,         // ข้อมูลส่วนตัวสำหรับ AI
      lastName,
      gender,
      title, 
      position,
      signature,
      tone 
    } = req.body;

    const setting = await prisma.userSetting.update({
      where: { userId },
      data: { 
        isAutoReplyActive, // อัปเดตสถานะ Cron
        defaultModel, 
        theme, 
        startTime, 
        endTime, 
        workDays, 
        timezone, 
        firstName,         // อัปเดตข้อมูลส่วนตัว
        lastName,
        gender,
        title, 
        position,
        signature,
        tone 
      },
    });

    res.json({ setting });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'ไม่สามารถบันทึกการตั้งค่าได้' });
  }
};

// 3. บันทึก/อัปเดต API Key
exports.saveApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'กรุณาส่ง provider และ apiKey ให้ครบถ้วน' });
    }

    // 🔒 นำ API Key ที่ส่งมาเข้าฟังก์ชันเข้ารหัส (AES-256-GCM) ทันที
    const encryptedData = encrypt(apiKey);

    if (!encryptedData) {
      return res.status(500).json({ error: 'กระบวนการเข้ารหัสล้มเหลว' });
    }

    // ใช้ Upsert: ถ้าเคยมีของค่ายนี้แล้วให้อัปเดต ถ้ายังไม่มีให้สร้างใหม่
    await prisma.apiKey.upsert({
      where: {
        userId_provider: { userId, provider },
      },
      update: {
        encryptedKey: encryptedData.encryptedKey,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
      },
      create: {
        userId,
        provider,
        encryptedKey: encryptedData.encryptedKey,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
      },
    });

    res.json({ message: `บันทึก API Key ของ ${provider} สำเร็จเรียบร้อย` });
  } catch (error) {
    console.error('Error saving API Key:', error);
    res.status(500).json({ error: 'ไม่สามารถบันทึก API Key ได้' });
  }
};

// 4. ลบ API Key
exports.deleteApiKey = async (req, res) => {
  try {
    const userId = req.user.id;
    const { provider } = req.params;

    await prisma.apiKey.delete({
      where: {
        userId_provider: { userId, provider },
      },
    });

    res.json({ message: `ลบ API Key ของ ${provider} สำเร็จ` });
  } catch (error) {
    res.json({ message: 'ไม่มี API Key นี้ในระบบอยู่แล้ว' });
  }
};

// 5. ทดสอบ API Key
exports.testApiKey = async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'กรุณาส่ง provider และ apiKey ให้ครบถ้วน' });
    }

    if (provider === 'gemini') {
      await geminiService.testKey(apiKey);
    } else if (provider === 'openai') {
      await openaiService.testKey(apiKey);
    } else if (provider === 'claude') {
      await claudeService.testKey(apiKey);
    } else if (provider === 'openrouter') {
      await openrouterService.testKey(apiKey);
    } else {
      return res.status(400).json({ error: 'ไม่รู้จัก Provider นี้' });
    }

    return res.json({ message: `✅ API Key ของ ${provider.toUpperCase()} ใช้งานได้ปกติ` });

  } catch (error) {
    console.error(`Error testing ${req.body.provider} API Key:`, error);
    res.status(400).json({ error: error.message || 'API Key ไม่ถูกต้อง' });
  }
};

// 6. [เพิ่มใหม่] ฟังก์ชันสำหรับ Toggle สวิตช์เปิด-ปิด Cron Job โดยเฉพาะ
// (เผื่อ Frontend อยากยิงเปลี่ยนแค่ค่าเดียวโดยไม่ต้องส่งข้อมูลมาทั้งฟอร์ม)
exports.toggleCronActive = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isAutoReplyActive } = req.body;

    if (typeof isAutoReplyActive !== 'boolean') {
      return res.status(400).json({ error: 'ค่า isAutoReplyActive ต้องเป็น Boolean' });
    }

    const setting = await prisma.userSetting.update({
      where: { userId },
      data: { isAutoReplyActive },
      select: { isAutoReplyActive: true } // ดึงกลับไปแค่ค่าที่อัปเดต
    });

    res.json({ 
      success: true, 
      isAutoReplyActive: setting.isAutoReplyActive,
      message: setting.isAutoReplyActive ? 'เปิดการทำงาน AI แล้ว' : 'หยุดการทำงาน AI ชั่วคราว'
    });
  } catch (error) {
    console.error('Error toggling cron active state:', error);
    res.status(500).json({ error: 'ไม่สามารถเปลี่ยนสถานะผู้ช่วย AI ได้' });
  }
};