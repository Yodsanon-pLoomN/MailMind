const { OpenAI } = require('openai');
const { buildExtractionPrompt, buildDraftPrompt } = require('./prompts');

exports.testKey = async (apiKey, modelName) => {
  try {
    const openai = new OpenAI({ baseURL: "https://gen.ai.kku.ac.th/api/v1", apiKey });
    const response = await openai.chat.completions.create({
      model: modelName || "gemini-2.5-flash-lite", // ใช้ตัวที่ส่งมา หรือตัวเริ่มต้น
      messages: [{ role: "user", content: "Reply OK" }],
    });
    if (response?.choices?.length > 0) return true;
    throw new Error("Invalid response from IntelSphere");
  } catch (error) {
    throw new Error(error.message || "Invalid IntelSphere API Key");
  }
};

exports.extractAppointment = async (apiKey, emailText, modelName) => {
  try {
    const openai = new OpenAI({ baseURL: "https://gen.ai.kku.ac.th/api/v1", apiKey });
    const today = new Date().toLocaleDateString('th-TH', { dateStyle: 'full' });
    const prompt = buildExtractionPrompt(emailText, today);

    const response = await openai.chat.completions.create({
      model: modelName || "gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }]
    });
    
    // เผื่อกรณี Model ส่ง ```json กลับมา
    const cleanText = response.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("IntelSphere Extraction Error:", error);
    return { isAppointment: false };
  }
};

exports.draftReplyWithCalendar = async (apiKey, emailText, extractedData, existingEvents, userSetting, modelName) => {
  try {
    const openai = new OpenAI({ baseURL: "https://gen.ai.kku.ac.th/api/v1", apiKey });

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
      model: modelName || "gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }]
    });

    const cleanText = response.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("IntelSphere Draft Error:", error);
    return { actionType: "PENDING", reasoning: "Error generating draft", draftMessage: "" };
  }
};