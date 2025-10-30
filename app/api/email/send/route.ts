// app/api/email/send/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGoogleOAuthClientForUser } from '@/lib/gmail'
import { google } from 'googleapis'

export const runtime = 'nodejs'

// 🧩 encode หัวข้อไทยเป็น RFC 2047
function encodeSubjectUtf8(subject: string) {
  const b64 = Buffer.from(subject, 'utf-8').toString('base64')
  return `=?UTF-8?B?${b64}?=`
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const userId = session.user.id

    const { messageId, replyText } = await req.json()
    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 })
    }

    // 🔹 1) ดึงข้อมูลเมลจากฐานข้อมูล
    const email = await prisma.email.findUnique({
      where: { messageId },
      select: {
        messageId: true,
        threadId: true,
        subject: true,
        from: true,
        replyText: true,
        startDateISO: true,
        endDateISO: true,
      },
    })

    if (!email) {
      return NextResponse.json({ error: 'Email not found in DB' }, { status: 404 })
    }

    const finalReplyText =
      replyText?.trim()?.length ? replyText.trim() : email.replyText || ''

    if (!finalReplyText) {
      return NextResponse.json({ error: 'Reply text is empty' }, { status: 400 })
    }

    // 🔹 2) สร้าง Gmail client
    const oauth2Client = await getGoogleOAuthClientForUser(userId)
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    // 🔹 3) ดึง header ของเมลต้นฉบับ
    const orig = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'To', 'Message-ID', 'References'],
    })

    const headers =
      orig.data.payload?.headers?.reduce<Record<string, string>>((acc, h) => {
        if (h.name && h.value) acc[h.name.toLowerCase()] = h.value
        return acc
      }, {}) ?? {}

    const origFrom = headers['from'] || email.from || ''
    const origSubject = headers['subject'] || email.subject || '(no subject)'
    const origMsgId = headers['message-id']
    const origRefs = headers['references']
    const threadId = email.threadId || orig.data.threadId || undefined

    // 🔹 4) เตรียมหัวข้อ Re: + encode ภาษาไทย
    const cleanSubject = origSubject.replace(/^Re:\s*/i, '')
    const replySubject = `Re: ${cleanSubject}`
    const encodedSubject = encodeSubjectUtf8(replySubject)

   // 🔹 Encode body เป็น Base64 แยกต่างหาก
const encodedBody = Buffer.from(finalReplyText, 'utf-8').toString('base64')

// 🔹 ปรับ header ให้ตรงกับ body
const lines = [
  `To: ${origFrom}`,
  `Subject: ${encodedSubject}`,
  origMsgId ? `In-Reply-To: ${origMsgId}` : '',
  origRefs
    ? `References: ${origRefs} ${origMsgId ?? ''}`
    : origMsgId
    ? `References: ${origMsgId}`
    : '',
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset="UTF-8"',
  'Content-Transfer-Encoding: base64',
  '',
  encodedBody, // 👈 ใช้ข้อความที่เข้ารหัสแล้ว
]

const raw = Buffer.from(lines.join('\r\n'), 'utf-8')
  .toString('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=+$/, '')


    // 🔹 6) ส่งอีเมลเข้า thread เดิม
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        threadId,
        raw,
      },
    })

    // 🔹 7) Mark ต้นฉบับว่าอ่านแล้ว
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: { removeLabelIds: ['UNREAD'] },
    })

    // 🔹 8) อัปเดตสถานะในฐานข้อมูล
    await prisma.email.update({
      where: { messageId },
      data: {
        replyText: finalReplyText,
        status: 'SENT',
        // ถ้ามีฟิลด์ isRead ใน model ก็ใส่เพิ่มได้เลย
        // isRead: true,
        updatedAt: new Date(),
      },
    })

    // 🔹 9) ถ้ามี startDateISO / endDateISO → สร้าง event ใน Calendar
    if (email.startDateISO && email.endDateISO) {
      try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

        const isAllDay =
          email.startDateISO.length === 10 && email.endDateISO.length === 10

        const eventBody: any = {
          summary: email.subject || '(MailMind appointment)',
          description: email.from || 'Appointment from email',
        }

        if (isAllDay) {
          eventBody.start = { date: email.startDateISO }
          eventBody.end = { date: email.endDateISO }
        } else {
          eventBody.start = { dateTime: email.startDateISO }
          eventBody.end = { dateTime: email.endDateISO }
        }

        await calendar.events.insert({
          calendarId: 'primary',
          requestBody: eventBody,
        })
      } catch (err) {
        console.error('❌ Calendar create error:', err)
      }
    }


    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('send email error:', e)
    return NextResponse.json({ error: e.message || 'Failed to send email' }, { status: 500 })
  }
}




