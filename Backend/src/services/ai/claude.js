const Anthropic = require('@anthropic-ai/sdk');
const { buildExtractionPrompt, buildDraftPrompt } = require('./prompts');

exports.testKey = async (apiKey) => {
  try {
    const anthropic = new Anthropic({ apiKey });
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

exports.extractAppointment = async (apiKey, emailText) => {
  try {
    const anthropic = new Anthropic({ apiKey });
    const today = new Date().toLocaleDateString('th-TH', { dateStyle: 'full' });
    const prompt = buildExtractionPrompt(emailText, today);

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    let text = response.content[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Claude Extraction Error:", error);
    return { isAppointment: false };
  }
};

exports.draftReplyWithCalendar = async (apiKey, emailText, extractedData, existingEvents, userSetting) => {
  try {
    const anthropic = new Anthropic({ apiKey });

    let pronoun = "ฉัน"; let politeParticle = "ครับ/ค่ะ";
    if (userSetting?.gender === "MALE") { pronoun = "ผม"; politeParticle = "ครับ"; } 
    else if (userSetting?.gender === "FEMALE") { pronoun = "ดิฉัน"; politeParticle = "ค่ะ"; }

    const tone = userSetting?.tone === 'casual' ? 'casual and friendly' : 'formal and polite';
    const fullName = `${userSetting?.firstName || ""} ${userSetting?.lastName || ""}`.trim();
    const position = userSetting?.position ? `\n${userSetting.position}` : "";
    const signatureText = userSetting?.signature || "ขอแสดงความนับถือ";
    const fullSignature = `\n\n${signatureText}\n${fullName}${position}`;

    const prompt = buildDraftPrompt(pronoun, politeParticle, tone, extractedData, emailText, existingEvents, fullSignature);

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    let text = response.content[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Claude Draft Error:", error);
    return { actionType: "PENDING", reasoning: "Error generating draft", draftMessage: "" };
  }
};