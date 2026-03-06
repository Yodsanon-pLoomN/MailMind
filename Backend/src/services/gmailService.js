// backend/src/services/gmailService.js

exports.getOriginalEmailMetadata = async (gmail, messageId) => {
  const originalMsg = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'metadata',
    metadataHeaders: ['From', 'Message-ID', 'References', 'Subject']
  });

  const headers = originalMsg.data.payload.headers;
  const fromEmail = headers.find(h => h.name.toLowerCase() === 'from')?.value || '';
  const originalMessageId = headers.find(h => h.name.toLowerCase() === 'message-id')?.value || '';
  const originalReferences = headers.find(h => h.name.toLowerCase() === 'references')?.value || '';
  const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';

  const emailRegex = /<([^>]+)>/;
  const match = fromEmail.match(emailRegex);
  const cleanEmail = match ? match[1] : fromEmail.trim();

  return { fromEmail, cleanEmail, originalMessageId, originalReferences, subject };
};

exports.sendEmailReply = async (gmail, draft, metadata, editedReply) => {
  const replySubject = metadata.subject.toLowerCase().startsWith('re:') 
    ? metadata.subject 
    : `Re: ${metadata.subject || draft.subject}`;

  const emailLines = [
    `To: ${metadata.fromEmail}`,
    `Subject: =?utf-8?B?${Buffer.from(replySubject).toString('base64')}?=`,
    `In-Reply-To: ${metadata.originalMessageId}`,
    `References: ${metadata.originalReferences} ${metadata.originalMessageId}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    ``,
    editedReply || draft.draftReply
  ];

  const rawEmail = emailLines.join('\n');
  const encodedEmail = Buffer.from(rawEmail).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encodedEmail, threadId: draft.threadId }
  });
};