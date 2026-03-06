const Anthropic = require('@anthropic-ai/sdk');

exports.testKey = async (apiKey) => {
  try {
    const anthropic = new Anthropic({ apiKey });
    // ส่งข้อความสั้นๆ ไปเทสต์ (ใช้ haiku เพราะเร็วและถูกสุด)
    await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'Reply OK' }]
    });
    return true;
  } catch (error) {
    throw new Error(error.message || 'API Key ของ Claude ไม่ถูกต้อง');
  }
};