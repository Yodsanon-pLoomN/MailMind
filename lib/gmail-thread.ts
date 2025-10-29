// lib/gmail-thread.ts
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { EmailMessage } from '@/lib/utils';

// ===== helpers =====
function decodeBase64Url(data?: string) {
  if (!data) return '';
  const buff = Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return buff.toString('utf-8');
}

function extractPlainText(payload?: gmail_v1.Schema$MessagePart): string {
  if (!payload) return '';
  // text/plain
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  // multipart/*
  if (payload.parts) {
    for (const part of payload.parts) {
      const t = extractPlainText(part);
      if (t) return t;
    }
  }
  return '';
}

async function getOAuth2(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: 'google' },
  });
  if (!account?.access_token) throw new Error('No Google account found');

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });
  return oauth2;
}

// ===== main =====
import type { gmail_v1 } from 'googleapis';

export async function getThread(userId: string, threadId: string) {
  const auth = await getOAuth2(userId);
  const gmail = google.gmail({ version: 'v1', auth });

  const res = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full', // เพื่ออ่านข้อความได้
  });

  const messages = (res.data.messages ?? []).map((m): EmailMessage => {
    const headers = m.payload?.headers ?? [];
    const from = headers.find(h => h.name === 'From')?.value ?? 'Unknown';
    const subject = headers.find(h => h.name === 'Subject')?.value ?? '(No Subject)';
    const date = headers.find(h => h.name === 'Date')?.value ?? '';
    const labelIds = m.labelIds ?? [];
    const isRead = !labelIds.includes('UNREAD');

    return {
      id: m.id!,
      threadId: m.threadId!,
      from,
      subject,
      date,
      snippet: m.snippet ?? '',
      internalDate: m.internalDate ?? '',
      isRead,
      // ข้อความตัวจริง (plain text)
      body: extractPlainText(m.payload),
    } as EmailMessage & { body: string };
  });

  // เรียงตามเวลา (เก่าก่อนใหม่)
  messages.sort((a, b) => Number(a.internalDate) - Number(b.internalDate));

  return messages;
}
