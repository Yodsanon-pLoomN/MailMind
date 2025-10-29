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
  isRead: boolean;   // <— NEW
  body?: string;     // <— NEW (เฉพาะหน้าอ่าน)
}

export interface PaginatedEmails {
  items: EmailMessage[];
  nextPageToken?: string;
  prevPageToken?: string;
}

export interface Email {
  id: string;
  threadId: string;          // <— add
  from: string;
  subject: string;
  snippet: string;
  date: string;
  isRead: boolean;           // <— add
}

export interface EmailItemProps {
  email: {
    id: string;
    threadId: string;
    from: string;
    subject: string;
    snippet: string;
    date: string;
    isRead: boolean; // <— NEW
  };
}