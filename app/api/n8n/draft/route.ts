// app/api/n8n/draft/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { messageId, subject, snippet, from } = await req.json()
    const userId = session.user.id

    if (!messageId || !subject)
      return NextResponse.json({ error: 'messageId and subject required' }, { status: 400 })

    // 🔹 ยิงไปที่ n8n webhook ให้ทำการวิเคราะห์และอัปเดต DB เอง
    const webhook = process.env.N8N_DRAFT_WEBHOOK_URL
    if (!webhook) throw new Error('N8N_DRAFT_WEBHOOK_URL is not set')

    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: messageId,
        subject,
        snippet,
        from,
        userId, // เผื่อให้ n8n ใช้ด้วย
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`n8n error: ${res.status} ${text}`)
    }

    // 🔹 รอให้ n8n ทำงานเสร็จ แล้วค่อยดึงค่าจริงจากฐานกลับมา

    const email = await prisma.email.findUnique({
      where: { messageId },
      select: {
        messageId: true,
        isAppointment: true,
        replyText: true,
        status: true,
        updatedAt: true,
      },
    })

    if (!email) {
      // ถ้า n8n ยังไม่เขียนจริง ให้สร้างใหม่แบบ fallback
      const created = await prisma.email.create({
        data: {
          messageId,
          userId,
          isAppointment: null,
          replyText: null,
          status: 'DRAFT',
        },
      })
      return NextResponse.json({ email: created, note: 'created fallback' })
    }

    // ✅ ถ้ามีแล้ว ส่งคืนข้อมูลจริงที่ n8n เขียนไว้ใน DB
    return NextResponse.json({ email })
  } catch (e: any) {
    console.error('Error in /api/n8n/draft:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
