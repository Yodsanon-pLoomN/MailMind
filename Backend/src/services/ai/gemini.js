const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildExtractionPrompt, buildDraftPrompt } = require('./prompts');

const MODEL_NAME = "gemini-2.5-flash"; 

exports.testKey = async (apiKey) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    await model.generateContent("Reply OK");
    return true;
  } catch (error) {
    throw new Error(error.message || 'Invalid Gemini API Key');
  }
};

exports.extractAppointment = async (apiKey, emailText) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
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

exports.draftReplyWithCalendar = async (apiKey, emailText, extractedData, existingEvents, userSetting) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    let pronoun = "ฉัน"; let politeParticle = "ครับ/ค่ะ";
    if (userSetting?.gender === "MALE") { pronoun = "ผม"; politeParticle = "ครับ"; } 
    else if (userSetting?.gender === "FEMALE") { pronoun = "ดิฉัน"; politeParticle = "ค่ะ"; }

    const tone = userSetting?.tone === 'casual' ? 'casual and friendly' : 'formal and polite';
    const fullName = `${userSetting?.firstName || ""} ${userSetting?.lastName || ""}`.trim();
    const position = userSetting?.position ? `\n${userSetting.position}` : "";
    const signatureText = userSetting?.signature || "ขอแสดงความนับถือ";
    const fullSignature = `\n\n${signatureText}\n${fullName}${position}`;

    const prompt = buildDraftPrompt(pronoun, politeParticle, tone, extractedData, emailText, existingEvents, fullSignature);

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Draft Error:", error);
    return { actionType: "PENDING", reasoning: "Error generating draft", draftMessage: "" };
  }
};