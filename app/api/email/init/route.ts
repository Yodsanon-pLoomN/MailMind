// app/api/email/init/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

    const { messageId, subject, snippet, from, threadId, startDateISO, endDateISO } =
      await req.json()

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 })
    }

    const email = await prisma.email.upsert({
      where: { messageId },
      create: {
        messageId,
        userId: session.user.id,
        subject,
        threadId,
        from,
        // ถ้าใช้แบบ DateTime:
        // startDate: startDateISO ? new Date(startDateISO) : null,
        // endDate: endDateISO ? new Date(endDateISO) : null,
        // ถ้าใช้แบบ string:
        startDateISO,
        endDateISO,
        isAppointment: null,
        replyText: null,
        status: 'DRAFT',
      },
      update: {
        // อัปเดต metadata ได้ เผื่อ n8n ส่งมาใหม่
        subject,
        threadId,
        from,
        startDateISO,
        endDateISO,
      },
    })

    return NextResponse.json({ ok: true, email })
  } catch (e: any) {
    console.error('POST /api/email/init error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
