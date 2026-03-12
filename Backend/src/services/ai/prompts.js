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

// 🌟 เพิ่ม workingHours เข้ามาเป็น Parameter
exports.buildDraftPrompt = (pronoun, politeParticle, tone, extractedData, emailText, existingEvents, fullSignature, workingHours) => {
  return `
    You are an AI personal assistant drafting an email reply on behalf of the user.
    User Profile Context:
    - Pronoun to use for the user: ${pronoun}
    - Polite particle to end sentences: ${politeParticle}
    - Tone: ${tone}
    - User's Working Hours: ${workingHours} 
    
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

    Your tasks & Scheduling Logic (CRITICAL):
    1. Analyze the appointment details:
       - If Date is "NOT SPECIFIED": Draft a reply asking for BOTH a specific date and time. (Action: "RESCHEDULE")
       - If Date is specified BUT "Did sender specify a specific time?" is "No": Draft a reply confirming the date and politely asking what TIME they are available strictly WITHIN the Working Hours. (Action: "RESCHEDULE")
       - If both date and time are specified ("Yes"):
           * Rule A: Check if the requested time is OUTSIDE the User's Working Hours (e.g., weekends, late night). If outside, politely decline and propose a time strictly WITHIN Working Hours. (Action: "RESCHEDULE")
           * Rule B: Check for time conflicts in Existing schedule. If conflict, propose a new time WITHIN Working Hours. (Action: "RESCHEDULE")
           * Rule C: If the time is WITHIN Working Hours AND there is NO conflict, confirm it. (Action: "ACCEPT")
    2. Draft the email IN THAI. 
    3. MUST use the pronoun "${pronoun}" and end sentences with "${politeParticle}".
    4. MUST append the following exact signature at the end of the email:
    ${fullSignature}
    
    Output ONLY a valid JSON object. Do not include markdown blocks.
    {
      "actionType": "string (ACCEPT or RESCHEDULE)",
      "reasoning": "string (Your reasoning in Thai, explaining if it was outside working hours, conflicted, or accepted)",
      "draftMessage": "string (The final email in Thai, including the signature)"
    }
  `.trim();
};


// backend/src/services/ai/prompts.js

// backend/src/services/ai/prompts.js

exports.buildScheduleSummaryPrompt = (events, type, dateContext) => {
  // กำหนดหัวข้อตามประเภทที่เลือก
  const titleMap = {
    'DAILY': 'สิ่งที่ต้องทำในวันนี้',
    'WEEKLY': 'สิ่งที่ต้องทำในสัปดาห์นี้',
    'MONTHLY': 'สิ่งที่ต้องทำในเดือนนี้'
  };
  
  const title = titleMap[type] || 'สิ่งที่ต้องทำในช่วงเวลานี้';

  return `
    You are an executive AI assistant. Summarize the user's schedule based on the provided events.
    Current Date Context: ${dateContext}
    
    Events (JSON):
    ${JSON.stringify(events, null, 2)}
    
    STRICT OUTPUT RULES:
    1. Start the response with exactly this markdown header: "# ${title}"
    2. Write the entire response in THAI.
    3. NO emojis, NO icons, and NO introductory text (like "นี่คือสรุปของคุณ").
    4. Use standard bullet points (-) for the list of tasks or events.
    5. Group related events and mention specific times clearly.
    6. If there are no events, say: "- ไม่มีกิจกรรมที่บันทึกไว้"
    7. Focus only on what needs to be done and the schedule flow.

    Example Output Structure:
    # สิ่งที่ต้องทำในวันนี้
    - 09:00 น. ประชุมทีมงาน
    - 13:00 น. พบลูกค้าที่บริษัท
    - ช่วงบ่ายคุณมีเวลาว่างสำหรับเคลียร์งานส่วนตัว
  `.trim();
};