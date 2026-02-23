import { type ClassValue } from "clsx"; 
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn helper: รวม className ให้สะอาด (รองรับ Tailwind override) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  internalDate: string;
  isRead: boolean;
  body?: string;
  status?: string;         // ✅ เพิ่มได้ เผื่อให้หน้า thread ใช้
}

export interface PaginatedEmails {
  items: EmailMessage[];
  nextPageToken?: string;
  prevPageToken?: string;
}

export interface Email {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;
  status?: string;         // ✅ เพิ่มตรงนี้
}

export interface EmailItemProps {
  email: {
    id: string;
    threadId: string;
    from: string;
    subject: string;
    snippet: string;
    date: string;
    isRead: boolean;
    status?: string;       // ✅ เพิ่มตรงนี้ด้วย
  };
}

export type ThreadMessage = {
  id: string
  threadId: string
  from: string
  subject: string
  date: string
  internalDate: string
  snippet: string
  isRead: boolean
  startDateISO?: string
  endDateISO?: string
  body?: string
  status?: string          // ✅ อันนี้คุณเพิ่มแล้ว ใช้ได้
}
