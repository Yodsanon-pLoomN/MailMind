const { OpenAI } = require('openai');

exports.testKey = async (apiKey) => {
  try {
    const openai = new OpenAI({ apiKey });
    // ใช้คำสั่งขอดูรายชื่อ Model เบาๆ เพื่อเทสต์คีย์
    await openai.models.list(); 
    return true;
  } catch (error) {
    throw new Error(error.message || 'API Key ของ OpenAI ไม่ถูกต้อง');
  }
};