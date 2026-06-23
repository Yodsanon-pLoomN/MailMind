const { OpenAI } = require('openai');
const { buildExtractionPrompt, buildDraftPrompt } = require('./prompts');

exports.testKey = async (apiKey, modelName) => {
  try {
    const openai = new OpenAI({ apiKey });
    // ทดสอบสร้างข้อความเพื่อเช็ค Model แทนการ List models เฉยๆ
    await openai.chat.completions.create({
      model: modelName || "gpt-4o-mini",
      messages: [{ role: "user", content: "Reply OK" }]
    });
    return true;
  } catch (error) {
    throw new Error(error.message || 'API Key ของ OpenAI ไม่ถูกต้อง');
  }
};

exports.extractAppointment = async (apiKey, emailText, modelName) => {
  try {
    const openai = new OpenAI({ apiKey });
    const today = new Date().toLocaleDateString('en-US', { dateStyle: 'full' });
    const prompt = buildExtractionPrompt(emailText, today);

    const response = await openai.chat.completions.create({
      model: modelName || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" } 
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI Extraction Error:", error);
    return { isAppointment: false };
  }
};

exports.draftReplyWithCalendar = async (apiKey, emailText, extractedData, existingEvents, userSetting, modelName) => {
  try {
    const openai = new OpenAI({ apiKey });

    let pronoun = "ฉัน"; let politeParticle = "ครับ/ค่ะ";
    if (userSetting?.gender === "MALE") { pronoun = "ผม"; politeParticle = "ครับ"; } 
    else if (userSetting?.gender === "FEMALE") { pronoun = "ดิฉัน"; politeParticle = "ค่ะ"; }

    const tone = userSetting?.tone === 'casual' ? 'casual and friendly' : 'formal and polite';
    const fullName = `${userSetting?.firstName || ""} ${userSetting?.lastName || ""}`.trim();
    const position = userSetting?.position ? `\n${userSetting.position}` : "";
    const signatureText = userSetting?.signature || "ขอแสดงความนับถือ";
    const fullSignature = `\n\n${signatureText}\n${fullName}${position}`;

    const startWork = userSetting?.workStartTime || "09:00";
    const endWork = userSetting?.workEndTime || "17:00";
    const workDays = userSetting?.workDays || "วันจันทร์ ถึง วันศุกร์";
    const workingHours = `${workDays}, เวลา ${startWork} น. - ${endWork} น.`;

    const prompt = buildDraftPrompt(pronoun, politeParticle, tone, extractedData, emailText, existingEvents, fullSignature, workingHours);

    const response = await openai.chat.completions.create({
      model: modelName || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI Draft Error:", error);
    return { actionType: "PENDING", reasoning: "Error generating draft", draftMessage: "" };
  }
};