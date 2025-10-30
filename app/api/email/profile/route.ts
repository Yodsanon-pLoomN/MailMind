import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getGoogleOAuthClientForUser } from '@/lib/gmail'
import { google } from 'googleapis'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const oauth2Client = await getGoogleOAuthClientForUser(session.user.id)
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    const res = await gmail.users.getProfile({ userId: 'me' })
    return NextResponse.json({
      emailAddress: res.data.emailAddress,
      messagesTotal: res.data.messagesTotal,
      threadsTotal: res.data.threadsTotal,
      historyId: res.data.historyId,
    })
  } catch (e: any) {
    console.error('Gmail profile fetch error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
