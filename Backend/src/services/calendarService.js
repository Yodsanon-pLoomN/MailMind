// backend/src/services/calendarService.js

exports.addEventToCalendar = async (calendar, draft, metadata, userTimezone) => {
  if (!draft.suggestedDate) return;

  const startTime = new Date(draft.suggestedDate);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // ตั้งค่าเริ่มต้นให้ประชุม 1 ชั่วโมง

  // แปลง Timezone
  let timeZone = 'Asia/Bangkok';
  if (userTimezone === 'asia-tokyo') timeZone = 'Asia/Tokyo';
  else if (userTimezone === 'europe-london') timeZone = 'Europe/London';

  // ยิง API สร้าง Event
  await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: 'all', // ส่งอีเมลเชิญผู้ร่วมประชุมอัตโนมัติ
    requestBody: {
      summary: draft.subject ? `[นัดหมาย] ${draft.subject}` : 'นัดหมายจาก Mailmind',
      location: draft.location || '',
      description: `นัดหมายนี้ถูกสร้างอัตโนมัติจากระบบ Mailmind AI\n\nอีเมลที่เกี่ยวข้อง: ${metadata.subject}`,
      start: { dateTime: startTime.toISOString(), timeZone },
      end: { dateTime: endTime.toISOString(), timeZone },
      attendees: metadata.cleanEmail ? [{ email: metadata.cleanEmail }] : [],
    }
  });
};