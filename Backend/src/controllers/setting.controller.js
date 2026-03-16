const settingsService = require('../services/settings.service');

// 1. ดึงการตั้งค่าทั้งหมด
exports.getSettings = async (req, res) => {
  try {
    const result = await settingsService.getUserSettings(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลการตั้งค่าได้' });
  }
};

// 2. อัปเดตการตั้งค่าทั่วไป
exports.updateSettings = async (req, res) => {
  try {
    // โยนข้อมูลใน req.body ทั้งก้อนไปอัปเดตได้เลย
    const setting = await settingsService.updateUserSettings(req.user.id, req.body);
    res.json({ setting });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'ไม่สามารถบันทึกการตั้งค่าได้' });
  }
};

// 3. บันทึก/อัปเดต API Key
exports.saveApiKey = async (req, res) => {
  try {
    const { provider, apiKey } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'กรุณาส่ง provider และ apiKey ให้ครบถ้วน' });
    }

    const message = await settingsService.saveProviderApiKey(req.user.id, provider, apiKey);
    res.json({ message });

  } catch (error) {
    console.error('Error saving API Key:', error);
    res.status(500).json({ error: 'ไม่สามารถบันทึก API Key ได้' });
  }
};

// 4. ลบ API Key
exports.deleteApiKey = async (req, res) => {
  try {
    const message = await settingsService.deleteProviderApiKey(req.user.id, req.params.provider);
    res.json({ message });
  } catch (error) {
    // ถ้าไม่มีให้ลบ ก็บอกไปเลยว่าไม่มี
    res.json({ message: 'ไม่มี API Key นี้ในระบบอยู่แล้ว' });
  }
};

// 5. ทดสอบ API Key
exports.testApiKey = async (req, res) => {
  try {
    const { provider, apiKey, modelName } = req.body;

    if (!provider || !apiKey) {
      return res.status(400).json({ error: 'กรุณาส่ง provider และ apiKey ให้ครบถ้วน' });
    }

    const message = await settingsService.testProviderApiKey(provider, apiKey, modelName);
    return res.json({ message });

  } catch (error) {
    console.error(`Error testing ${req.body.provider} API Key:`, error.message);
    res.status(400).json({ error: error.message || 'API Key ไม่ถูกต้อง' });
  }
};

// 6. Toggle สวิตช์เปิด-ปิด Cron Job
exports.toggleCronActive = async (req, res) => {
  try {
    const { isAutoReplyActive } = req.body;

    if (typeof isAutoReplyActive !== 'boolean') {
      return res.status(400).json({ error: 'ค่า isAutoReplyActive ต้องเป็น Boolean' });
    }

    const setting = await settingsService.toggleAiStatus(req.user.id, isAutoReplyActive);

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

exports.checkSetupStatus = async (req, res) => {
  try {
    const hasKeys = await settingsService.checkUserHasAnyKey(req.user.id);
    res.json({ hasSetupKey: hasKeys });
  } catch (error) {
    console.error('Error checking setup status:', error);
    res.status(500).json({ error: 'ไม่สามารถตรวจสอบสถานะการตั้งค่าได้' });
  }
};

// ดึงรายชื่อโมเดลแบบไดนามิก
exports.getModelsList = async (req, res) => {
  try {
    const { provider, apiKey } = req.body;
    
    if (provider === 'openrouter') {
      const response = await fetch('https://openrouter.ai/api/v1/models');
      const data = await response.json();
      const models = data.data.map(m => ({ id: m.id, name: m.name })).sort((a,b) => a.name.localeCompare(b.name));
      return res.json({ models });
    }

    if (provider === 'openai' || provider === 'intelsphere') {
      if (!apiKey) throw new Error(`กรุณากรอก API Key ก่อนโหลดรายชื่อโมเดล`);
      
      const { OpenAI } = require('openai');
      let baseURL = undefined;
      if (provider === 'intelsphere') baseURL = "https://gen.ai.kku.ac.th/api/v1";

      const openai = new OpenAI({ apiKey, baseURL });
      const list = await openai.models.list();
      
      let models = list.data;
      
      if (provider === 'openai') {
        models = models.filter(m => m.id.startsWith('gpt') || m.id.startsWith('o1') || m.id.startsWith('o3'));
      }

      const formattedModels = models.map(m => ({ id: m.id, name: m.id })).sort((a,b) => a.id.localeCompare(b.id));
      return res.json({ models: formattedModels });
    }

    return res.json({ models: [] });

  } catch (error) {
    console.error("Fetch models error:", error);
    res.status(400).json({ error: error.message || 'ไม่สามารถดึงรายชื่อโมเดลได้' });
  }
};