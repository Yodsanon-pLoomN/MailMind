import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { messageId, subject, snippet, from } = await req.json()
    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 })
    }

    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const email = await prisma.email.upsert({
      where: { messageId },
      create: {
        messageId,
        userId,
        isAppointment: null, // ✅ เริ่มเป็น null
        replyText: null,
        status: 'DRAFT',
      },
      update: {
        status: 'DRAFT',
      },
    })

    return NextResponse.json({ ok: true, email })
  } catch (e: any) {
    console.error('POST /api/email/init error:', e)
    return NextResponse.json({ error: e.message || 'Failed to init email' }, { status: 500 })
  }
}
