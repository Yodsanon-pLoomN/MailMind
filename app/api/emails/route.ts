// app/api/emails/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { listMessages } from '@/lib/gmail'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  pageToken: z.string().optional(),
  pageSize: z.coerce.number().min(1).max(50).default(10),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const params = querySchema.parse({
      pageToken: searchParams.get('pageToken') || undefined,
      pageSize: searchParams.get('pageSize') || 10,
    })

    // 1) ดึงจาก Gmail เหมือนเดิม
    const result = await listMessages(session.user.id, params.pageToken, params.pageSize)
    const gmailItems = result.items || []

    // ถ้าไม่มีเมลก็จบเลย
    if (gmailItems.length === 0) {
      return NextResponse.json({
        items: [],
        nextPageToken: result.nextPageToken,
        hasMore: !!result.nextPageToken,
      })
    }

    // 2) ดึง messageId ทั้งหมดจาก gmail เพื่อไปถาม DB
    //    สมมติว่า listMessages คืน id ของ gmail เป็น field `id`
    const messageIds = gmailItems.map((m: any) => m.id).filter(Boolean) as string[]

    // 3) ไปหาใน prisma.email ว่ามีอันไหนที่เราบันทึกไว้แล้ว
    const dbEmails = await prisma.email.findMany({
      where: {
        userId: session.user.id,
        messageId: {
          in: messageIds,
        },
      },
      select: {
        messageId: true,
        status: true,
        isAppointment: true,
        replyText: true,
      },
    })

    // ทำเป็น map ไว้ merge ง่าย ๆ
    const dbMap = new Map(dbEmails.map((e) => [e.messageId, e]))

    // 4) merge: ของ gmail + ของเรา
    const merged = gmailItems.map((item: any) => {
      const db = dbMap.get(item.id)

      return {
        // ของเดิมที่ gmail ส่ง
        id: item.id,
        threadId: item.threadId,
        from: item.from,
        subject: item.subject,
        snippet: item.snippet,
        date: item.date,
        isRead: item.isRead,

        // ของเราที่เพิ่มเข้ามา
        status: db?.status ?? null,
        isAppointment: db?.isAppointment ?? null,
        // ถ้าอยากให้หน้า list โชว์ icon ว่ามี draft ก็ส่งไปได้เลย
        hasReplyText: db?.replyText ? true : false,
      }
    })

    return NextResponse.json({
      items: merged,
      nextPageToken: result.nextPageToken,
      hasMore: !!result.nextPageToken,
    })
  } catch (error: any) {
    console.error('Error fetching emails:', error)

    if (error.code === 403) {
      return NextResponse.json(
        {
          error: 'Gmail API access denied. Please ensure the Gmail API is enabled.',
          details: error.message,
        },
        { status: 403 }
      )
    }

    if (error.code === 401) {
      return NextResponse.json(
        { error: 'Authentication failed. Please sign in again.' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch emails', details: error.message },
      { status: 500 }
    )
  }
}
