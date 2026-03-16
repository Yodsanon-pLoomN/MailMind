const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildExtractionPrompt, buildDraftPrompt } = require('./prompts');

exports.testKey = async (apiKey, modelName) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName || "gemini-2.5-flash" });
    await model.generateContent("Reply OK");
    return true;
  } catch (error) {
    throw new Error(error.message || 'Invalid Gemini API Key');
  }
};

exports.extractAppointment = async (apiKey, emailText, modelName) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName || "gemini-2.5-flash" });
    const today = new Date().toLocaleDateString('th-TH', { dateStyle: 'full' });
    const prompt = buildExtractionPrompt(emailText, today);

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return { isAppointment: false };
  }
};

exports.draftReplyWithCalendar = async (apiKey, emailText, extractedData, existingEvents, userSetting, modelName) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName || "gemini-2.5-flash" });

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

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Draft Error:", error);
    return { actionType: "PENDING", reasoning: "Error generating draft", draftMessage: "" };
  }
};