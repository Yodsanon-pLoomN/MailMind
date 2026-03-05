const prisma = require('../config/prisma');
const { encrypt } = require('../utils/encryption');

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
    // อิงตาม value ในหน้า Frontend UI ของคุณ
    const configuredKeys = {
      gemini: keys.some(k => k.provider === 'gemini'),
      openai: keys.some(k => k.provider === 'openai'),
      claude: keys.some(k => k.provider === 'claude'),
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
    
    // รับค่าทุกอย่างมาจาก Frontend
    const { 
      defaultModel, 
      theme, 
      startTime, 
      endTime, 
      workDays, 
      timezone, 
      title, 
      tone 
    } = req.body;

    const setting = await prisma.userSetting.update({
      where: { userId },
      data: { 
        defaultModel, 
        theme, 
        startTime, 
        endTime, 
        workDays, // Prisma รองรับการเซฟ Array of Strings อยู่แล้วถ้ากำหนดใน schema แบบ String[]
        timezone, 
        title, 
        tone 
      },
    });

    res.json({ setting });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'ไม่สามารถบันทึกการตั้งค่าได้' });
  }
};

// 3. บันทึก/อัปเดต API Key (ผ่านการเข้ารหัสก่อนเซฟลง Database)
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

// 4. ลบ API Key (เผื่ออนาคตคุณอยากทำปุ่ม "ลบ Key" ในหน้า Frontend)
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
    // ถ้า Delete แล้วหาไม่เจอ (Record to delete does not exist) เราจะไม่พ่น Error แค่บอกว่าไม่มี
    res.json({ message: 'ไม่มี API Key นี้ในระบบอยู่แล้ว' });
  }
};


// 5. ทดสอบ API Key (แบบเช็คแค่สิทธิ์การเข้าถึง ไม่ต้องเดาชื่อ Model)
exports.testApiKey = async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'กรุณาส่ง provider และ apiKey ให้ครบถ้วน' });
    }

    if (provider === 'gemini') {
      // 🚀 เปลี่ยนมาใช้วิธี GET ขอดูรายชื่อแทน (ถ้าคีย์ถูก มันจะตอบกลับเป็นลิสต์รายชื่อทันที)
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'API Key ของ Gemini ไม่ถูกต้องหรือหมดอายุ');
      }

      return res.json({ message: '✅ API Key ของ Gemini ใช้งานได้ปกติ' });
    } 
    
    // เผื่ออนาคตทำของค่ายอื่น
    else if (provider === 'openai' || provider === 'claude') {
      return res.status(501).json({ error: `ระบบทดสอบคีย์ของ ${provider} กำลังอยู่ในระหว่างการพัฒนา` });
    }

    return res.status(400).json({ error: 'ไม่รู้จัก Provider นี้' });

  } catch (error) {
    console.error('Error testing API Key:', error);
    res.status(400).json({ error: error.message || 'API Key ไม่ถูกต้อง' });
  }
};