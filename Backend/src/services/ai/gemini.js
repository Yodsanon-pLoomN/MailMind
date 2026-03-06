const { GoogleGenerativeAI } = require('@google/generative-ai');

// 🚀 อัปเดตชื่อโมเดลเป็นรุ่นใหม่ล่าสุดของ Google (รองรับ API Key ปีปัจจุบัน)
const MODEL_NAME = "gemini-2.5-flash"; // ถ้าตัวนี้ยังมีปัญหา สามารถเปลี่ยนเป็น "gemini-2.0-flash" ได้ครับ

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

    const prompt = `
      You are an executive assistant. Read the following email and determine if it contains an appointment or scheduling request.
      Email content:
      """
      ${emailText}
      """
      
      Output ONLY a valid JSON object with the following structure. Do not include markdown code blocks (like \`\`\`json).
      {
        "isAppointment": boolean (true if it's an appointment request, false otherwise),
        "title": string (short appointment title, null if none),
        "date": string (ISO 8601 date and time, e.g., "2026-03-10T14:00:00+07:00", null if time is not clearly specified),
        "location": string (location or meeting link, null if none)
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return { isAppointment: false };
  }
};

exports.draftReplyWithCalendar = async (apiKey, emailText, extractedData, existingEvents, tone = "formal") => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // หรือรุ่นที่คุณใช้

    const prompt = `
      You are a smart personal assistant. A user has received an email requesting an appointment.
      
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
      1. If the "Date" is "NOT SPECIFIED", draft a reply IN THAI asking the sender to propose a specific date and time for the appointment.
      2. If the "Date" is specified, check for time conflicts with existing schedule.
         - If accepting: Confirm the appointment time.
         - If conflict: Politely decline and propose an alternative time.
      3. Draft the reply email IN THAI LANGUAGE using a ${tone === 'formal' ? 'formal and polite' : 'casual and friendly'} tone.
      
      Output ONLY a valid JSON object. Do not include markdown blocks.
      {
        "reasoning": string (Your brief reasoning for this decision, written in Thai),
        "draftMessage": string (The drafted reply email in Thai)
      }
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Draft Error:", error);
    return { reasoning: "Error generating draft", draftMessage: "" };
  }
};