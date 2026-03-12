// backend/src/services/ai/prompts.js

// 1. Prompt สำหรับสกัดข้อมูลนัดหมาย
// backend/src/services/ai/prompts.js
const { PRIORITY_RULES } = require('../../config/constants');

exports.buildExtractionPrompt = (emailText, today) => {
  return `
    You are an executive assistant. Read the following email thread and extract appointment details.
    Current Date Context: Today is ${today}. Use this to infer the correct year for incomplete dates.
    
    Email content:
    """
    ${emailText}
    """
    
    Evaluate the priority of this email based on the following dictionary rules:
    - HIGH Priority: ${PRIORITY_RULES.HIGH}
    - LOW Priority: ${PRIORITY_RULES.LOW}
    - NORMAL Priority: ${PRIORITY_RULES.NORMAL}
    
    Output ONLY a valid JSON object. Do not include markdown code blocks.
    {
      "isAppointment": boolean,
      "title": "string or null",
      "date": "ISO 8601 string or null",
      "isTimeSpecified": boolean,
      "location": "string or null",
      "priority": "HIGH" | "NORMAL" | "LOW"
    }
  `.trim();
};

// ... โค้ด buildDraftPrompt เหมือนเดิม ...
// (ตัว buildDraftPrompt ไม่ต้องแก้ครับ เพราะเราเช็ค Priority ในตอน Extract เท่านั้น)

// 2. Prompt สำหรับร่างอีเมลตอบกลับ
exports.buildDraftPrompt = (pronoun, politeParticle, tone, extractedData, emailText, existingEvents, fullSignature) => {
  return `
    You are an AI personal assistant drafting an email reply on behalf of the user.
    User Profile Context:
    - Pronoun to use for the user: ${pronoun}
    - Polite particle to end sentences: ${politeParticle}
    - Tone: ${tone}
    
    New Appointment Details:
    - Title: ${extractedData.title}
    - Date: ${extractedData.date || "NOT SPECIFIED"}
    - Did sender specify a specific time?: ${extractedData.isTimeSpecified ? "Yes" : "No"}
    - Location: ${extractedData.location || "NOT SPECIFIED"}
    
    Original Email:
    """
    ${emailText}
    """

    Existing schedule around requested time:
    ${JSON.stringify(existingEvents)}

    Your tasks:
    1. Analyze the appointment details:
       - If Date is "NOT SPECIFIED": Draft a reply asking for BOTH a specific date and time. (Action: "RESCHEDULE")
       - If Date is specified BUT "Did sender specify a specific time?" is "No": Draft a reply confirming the date and politely asking what TIME they are available on that day. (Action: "RESCHEDULE")
       - If both date and time are specified ("Yes"): Check for time conflicts. If no conflict, confirm it ("ACCEPT"). If conflict, propose a new time ("RESCHEDULE").
    2. Draft the email IN THAI. 
    3. MUST use the pronoun "${pronoun}" and end sentences with "${politeParticle}".
    4. MUST append the following exact signature at the end of the email:
    ${fullSignature}
    
    Output ONLY a valid JSON object. Do not include markdown blocks.
    {
      "actionType": "string (ACCEPT or RESCHEDULE)",
      "reasoning": "string (Your reasoning in Thai)",
      "draftMessage": "string (The final email in Thai, including the signature)"
    }
  `.trim();
};