// backend/src/services/ai/openrouter.js
const { OpenAI } = require("openai");

// 1. ฟังก์ชันสำหรับเทสต์ API Key (หน้า Settings)
exports.testKey = async (apiKey) => {
  try {
    // ใช้แพ็กเกจ OpenAI แต่ชี้ URL ไปที่ OpenRouter
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
    });

    const response = await openai.chat.completions.create({
      model: "stepfun/step-3.5-flash:free", 
      messages: [{ role: "user", content: "hi" }],
    });

    if (response && response.choices && response.choices.length > 0) {
      return true;
    }
    throw new Error("Invalid response from OpenRouter");

  } catch (error) {
    console.error("OpenRouter Test Error:", error);
    throw new Error(error.message || "Invalid OpenRouter API Key");
  }
};

// 2. ฟังก์ชันสำหรับร่างอีเมล (ใช้ใน Cron Job emailWatcher.js)
exports.draftReplyWithCalendar = async (apiKey, emailText, extractedData, existingEvents, userSetting) => {
  try {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
    });

    // จัดการคำสรรพนามและคำลงท้ายภาษาไทยตามเพศ
    let pronoun = "ฉัน";
    let politeParticle = "ครับ/ค่ะ";
    
    if (userSetting?.gender === "MALE") {
      pronoun = "ผม";
      politeParticle = "ครับ";
    } else if (userSetting?.gender === "FEMALE") {
      pronoun = "ดิฉัน";
      politeParticle = "ค่ะ";
    }

    // จัดการลายเซ็นท้ายอีเมล
    const firstName = userSetting?.firstName || "";
    const lastName = userSetting?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const position = userSetting?.position ? `\n${userSetting.position}` : "";
    const signatureText = userSetting?.signature ? userSetting.signature : "ขอแสดงความนับถือ";
    
    const fullSignature = `\n\n${signatureText}\n${fullName}${position}`;

    const prompt = `
      You are an AI personal assistant drafting an email reply on behalf of the user.
      
      User Profile Context:
      - Pronoun to use for the user: ${pronoun}
      - Polite particle to end sentences: ${politeParticle}
      - Tone: ${userSetting?.tone === 'casual' ? 'casual and friendly' : 'formal and polite'}
      
      New Appointment Details:
      - Title: ${extractedData.title}
      - Date: ${extractedData.date || "NOT SPECIFIED"}
      - Location: ${extractedData.location || "NOT SPECIFIED"}
      
      Original Email:
      """
      ${emailText}
      """

      Existing schedule around requested time:
      ${JSON.stringify(existingEvents)}

      Your tasks:
      1. Check the date. If "NOT SPECIFIED", draft a reply asking for a specific date/time. Action Type: "RESCHEDULE".
      2. If specified, check for time conflicts.
         - If NO conflict: Confirm the appointment. Action Type: "ACCEPT".
         - If conflict: Politely decline and propose an alternative time. Action Type: "RESCHEDULE".
      3. Draft the email IN THAI. 
      4. MUST use the pronoun "${pronoun}" and end sentences with "${politeParticle}".
      5. MUST append the following exact signature at the end of the email:
      ${fullSignature}
      
      Output ONLY a valid JSON object. Do not include markdown blocks.
      {
        "actionType": "string (ACCEPT or RESCHEDULE)",
        "reasoning": "string (Your reasoning in Thai)",
        "draftMessage": "string (The final email in Thai, including the signature)"
      }
    `;

    const response = await openai.chat.completions.create({
      model: userSetting?.defaultModel || "stepfun/step-3.5-flash:free", 
      messages: [{ role: "user", content: prompt }],
    });

    const textResult = response.choices[0].message.content;
    const cleanText = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);

  } catch (error) {
    console.error("AI Draft Error:", error);
    return { actionType: "PENDING", reasoning: "Error generating draft", draftMessage: "" };
  }
};