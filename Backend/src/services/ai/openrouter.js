const { OpenAI } = require("openai");
const { buildExtractionPrompt, buildDraftPrompt } = require('./prompts');

exports.testKey = async (apiKey) => {
  try {
    const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey });
    const response = await openai.chat.completions.create({
      model: "stepfun/step-3.5-flash:free", 
      messages: [{ role: "user", content: "hi" }],
    });
    if (response?.choices?.length > 0) return true;
    throw new Error("Invalid response from OpenRouter");
  } catch (error) {
    throw new Error(error.message || "Invalid OpenRouter API Key");
  }
};

exports.extractAppointment = async (apiKey, emailText) => {
  try {
    const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey });
    const today = new Date().toLocaleDateString('th-TH', { dateStyle: 'full' });
    const prompt = buildExtractionPrompt(emailText, today);

    const response = await openai.chat.completions.create({
      model: "stepfun/step-3.5-flash:free",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenRouter Extraction Error:", error);
    return { isAppointment: false };
  }
};

exports.draftReplyWithCalendar = async (apiKey, emailText, extractedData, existingEvents, userSetting) => {
  try {
    const openai = new OpenAI({ baseURL: "https://openrouter.ai/api/v1", apiKey });

    let pronoun = "ฉัน"; let politeParticle = "ครับ/ค่ะ";
    if (userSetting?.gender === "MALE") { pronoun = "ผม"; politeParticle = "ครับ"; } 
    else if (userSetting?.gender === "FEMALE") { pronoun = "ดิฉัน"; politeParticle = "ค่ะ"; }

    const tone = userSetting?.tone === 'casual' ? 'casual and friendly' : 'formal and polite';
    const fullName = `${userSetting?.firstName || ""} ${userSetting?.lastName || ""}`.trim();
    const position = userSetting?.position ? `\n${userSetting.position}` : "";
    const signatureText = userSetting?.signature || "ขอแสดงความนับถือ";
    const fullSignature = `\n\n${signatureText}\n${fullName}${position}`;

    const prompt = buildDraftPrompt(pronoun, politeParticle, tone, extractedData, emailText, existingEvents, fullSignature);

    const response = await openai.chat.completions.create({
      model: userSetting?.defaultModel || "stepfun/step-3.5-flash:free", 
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const cleanText = response.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("OpenRouter Draft Error:", error);
    return { actionType: "PENDING", reasoning: "Error generating draft", draftMessage: "" };
  }
};