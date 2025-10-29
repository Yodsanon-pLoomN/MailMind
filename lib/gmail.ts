import { google } from 'googleapis';
import { prisma } from '../lib/prisma';
import {PaginatedEmails,EmailMessage} from '@/lib/utils';



/**
 * Get OAuth2 client configured for a specific user
 */
export async function getGoogleOAuthClientForUser(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'google',
    },
  });

  if (!account || !account.access_token) {
    throw new Error('No Google account found for user');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  return oauth2Client;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(userId: string): Promise<void> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'google',
    },
  });

  if (!account || !account.refresh_token) {
    throw new Error('No refresh token available');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: account.refresh_token,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: credentials.access_token,
      expires_at: credentials.expiry_date
        ? Math.floor(credentials.expiry_date / 1000)
        : null,
    },
  });
}

/**
 * List messages from Gmail
 */
export async function listMessages(
  userId: string,
  pageToken?: string,
  pageSize: number = 10
): Promise<PaginatedEmails> {
  try {
    const auth = await getGoogleOAuthClientForUser(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: pageSize,
      pageToken,
      includeSpamTrash: false,
      labelIds: ['INBOX', 'CATEGORY_PERSONAL'], // Primary only
      q: 'category:primary -in:chats',          // reinforce Primary
    });

    const messages = response.data.messages || [];
    const emails: EmailMessage[] = [];

    for (const m of messages) {
      if (!m.id) continue;
      try {
        const details = await getMessage(userId, m.id);
        emails.push(details);
      } catch (err) {
        console.error(`Error fetching message ${m.id}:`, err);
      }
    }

    return {
      items: emails,
      nextPageToken: response.data.nextPageToken ?? undefined,
    };
  } catch (error: any) {
    if (error.code === 401) {
      await refreshAccessToken(userId);
      return listMessages(userId, pageToken, pageSize);
    }
    throw error;
  }
}

/**
 * Get a single message from Gmail
 */
export async function getMessage(userId: string, messageId: string): Promise<EmailMessage> {
  const auth = await getGoogleOAuthClientForUser(userId);
  const gmail = google.gmail({ version: 'v1', auth });

  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'metadata',
    metadataHeaders: ['From', 'Subject', 'Date'],
  });

  const headers = response.data.payload?.headers || [];
  const from = headers.find((h) => h.name === 'From')?.value || 'Unknown';
  const subject = headers.find((h) => h.name === 'Subject')?.value || '(No Subject)';
  const date = headers.find((h) => h.name === 'Date')?.value || '';

  const labelIds = response.data.labelIds || [];
  const isRead = !labelIds.includes('UNREAD');   // <— NEW

  return {
    id: response.data.id!,
    threadId: response.data.threadId!,
    from,
    subject,
    snippet: response.data.snippet || '',
    date,
    internalDate: response.data.internalDate || '',
    isRead,                                       // <— NEW
  };
}