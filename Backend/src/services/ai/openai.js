const { OpenAI } = require('openai');

exports.testKey = async (apiKey) => {
  try {
    const openai = new OpenAI({ apiKey });
    await openai.models.list(); 
    return true;
  } catch (error) {
    throw new Error(error.message || 'API Key ของ OpenAI ไม่ถูกต้อง');
  }
};

exports.extractAppointment = async (apiKey, emailText) => {
  try {
    const openai = new OpenAI({ apiKey });
    const prompt = `
      You are an executive assistant. Read the following email and determine if it contains an appointment or scheduling request.
      Email content:
      """
      ${emailText}
      """
      
      Output ONLY a valid JSON object. Do not include markdown code blocks.
      {
        "isAppointment": boolean,
        "title": string or null,
        "date": "ISO 8601 string or null",
        "location": string or null
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" } // บังคับ OpenAI คืนค่า JSON เสมอ
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI Extraction Error:", error);
    return { isAppointment: false };
  }
};

exports.draftReplyWithCalendar = async (apiKey, emailText, extractedData, existingEvents, userSetting) => {
  try {
    const openai = new OpenAI({ apiKey });

    let pronoun = "ฉัน"; let politeParticle = "ครับ/ค่ะ";
    if (userSetting?.gender === "MALE") { pronoun = "ผม"; politeParticle = "ครับ"; } 
    else if (userSetting?.gender === "FEMALE") { pronoun = "ดิฉัน"; politeParticle = "ค่ะ"; }

    const firstName = userSetting?.firstName || "";
    const lastName = userSetting?.lastName || "";
    const position = userSetting?.position ? `\n${userSetting.position}` : "";
    const signatureText = userSetting?.signature ? userSetting.signature : "ขอแสดงความนับถือ";
    const fullSignature = `\n\n${signatureText}\n${firstName} ${lastName}`.trim() + `${position}`;

    const prompt = `
      You are a smart personal assistant drafting an email reply on behalf of the user.
      User Profile Context:
      - Pronoun: ${pronoun}
      - Polite particle: ${politeParticle}
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
      1. Check the date. If "NOT SPECIFIED", actionType: "RESCHEDULE".
      2. If specified, check for time conflicts. No conflict = "ACCEPT". Conflict = "RESCHEDULE" (and propose new time).
      3. Draft the email IN THAI using pronoun "${pronoun}" and ending with "${politeParticle}".
      4. MUST append this exact signature at the end:
      ${fullSignature}
      
      Output ONLY a valid JSON object.
      {
        "actionType": "ACCEPT or RESCHEDULE",
        "reasoning": "Your reasoning in Thai",
        "draftMessage": "The final email in Thai including signature"
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI Draft Error:", error);
    return { actionType: "PENDING", reasoning: "Error generating draft", draftMessage: "" };
  }
};