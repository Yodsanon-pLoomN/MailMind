// app/api/email/check/[messageId]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(
  req: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const email = await prisma.email.findUnique({
      where: { messageId: params.messageId },
    })

    if (!email) return NextResponse.json({ exists: false })

    return NextResponse.json({
      exists: true,
      isAppointment: email.isAppointment,
      replyText: email.replyText,
    })
  } catch (e: any) {
    console.error('GET /api/email/check error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
