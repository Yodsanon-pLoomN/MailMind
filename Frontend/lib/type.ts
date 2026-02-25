// 👤 ข้อมูลผู้ใช้งานที่ได้จากการ Login
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture: string;
}

// 📧 ข้อมูลอีเมลสำหรับแสดงในหน้า List (หน้ารวม)
export interface Email {
  id: string;
  threadId: string;
  snippet: string;
  isRead: boolean;
  from: string;
  subject: string;
  date: string;
  status: string;
}

// 📦 ข้อมูล Response เวลาเรียก API ดึงรายการอีเมล
export interface EmailsResponse {
  items: Email[];
  nextPageToken?: string;
  hasMore: boolean;
}

// 💬 ข้อมูลอีเมลแบบเต็ม (สำหรับการเปิดดูด้านใน ThreadDialog)
export interface ThreadMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  date: string;
  internalDate: string;
  snippet: string;
  isRead: boolean;
  body?: string;
}