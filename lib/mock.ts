import {
  NavbarProps,
  EmailMessage,
  PaginatedEmails,
  ThreadMessage,
} from '@/lib/utils';

/* =========================
   Mock User (Navbar)
   ========================= */
export const mockUser: NavbarProps['user'] = {
  name: 'Yodsanon Duangkhai',
  email: 'yodsanondk@gmail.com',
  image: 'https://i.pravatar.cc/150?img=8',
};

/* =========================
   Mock Email List (Inbox)
   ========================= */
export const mockEmails: EmailMessage[] = [
  {
    id: 'email-001',
    threadId: 'thread-001',
    from: 'hr@mitrphol.com',
    subject: 'แจ้งนัดสัมภาษณ์ฝึกงาน',
    snippet: 'ขอเชิญนักศึกษาเข้าร่วมสัมภาษณ์ วันที่ 12 มีนาคม 2569',
    date: '12 Mar 2026',
    internalDate: '1700000000000',
    isRead: false,
    status: 'appointment',
  },
  {
    id: 'email-002',
    threadId: 'thread-002',
    from: 'noreply@google.com',
    subject: 'Security alert',
    snippet: 'New sign-in detected from Chrome on Windows',
    date: '10 Mar 2026',
    internalDate: '1699000000000',
    isRead: true,
    status: 'info',
  },
  {
    id: 'email-003',
    threadId: 'thread-003',
    from: 'gangbungkafae@gmail.com',
    subject: 'สรุปยอดขายประจำวัน',
    snippet: 'ยอดขายวันนี้รวม 12,450 บาท',
    date: '9 Mar 2026',
    internalDate: '1698800000000',
    isRead: true,
    status: 'report',
  },
];

/* =========================
   Mock Pagination
   ========================= */
export const mockPaginatedEmails: PaginatedEmails = {
  items: mockEmails,
  nextPageToken: 'NEXT_PAGE_TOKEN',
};

/* =========================
   Mock Thread (Conversation)
   ========================= */
export const mockThreadMessages: ThreadMessage[] = [
  {
    id: 'msg-001',
    threadId: 'thread-001',
    from: 'hr@mitrphol.com',
    subject: 'แจ้งนัดสัมภาษณ์ฝึกงาน',
    snippet: 'ขอเชิญสัมภาษณ์วันที่ 12 มีนาคม เวลา 10:00 น.',
    date: '12 Mar 2026',
    internalDate: '1700000000000',
    isRead: false,
    startDateISO: '2026-03-12T10:00:00+07:00',
    endDateISO: '2026-03-12T11:00:00+07:00',
    status: 'appointment',
    body: `
เรียน คุณยศนนท์

บริษัทขอเชิญท่านเข้าร่วมสัมภาษณ์ฝึกงาน
ในวันที่ 12 มีนาคม 2569 เวลา 10:00 – 11:00 น.
สถานที่: โรงงานน้ำตาลมิตรผล ภูเขียว

ขอแสดงความนับถือ
ฝ่ายทรัพยากรบุคคล
`,
  },
];
