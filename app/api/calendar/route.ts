// app/api/calendar/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getGoogleOAuthClientForUser } from '@/lib/gmail' // คุณมีไฟล์นี้แล้ว
import { google } from 'googleapis'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authClient = await getGoogleOAuthClientForUser(session.user.id)
    const calendar = google.calendar({ version: 'v3', auth: authClient })

    // ช่วงเวลาที่จะดึง: วันนี้ → +7 วัน
    const now = new Date()
    const weekAfter = new Date()
    weekAfter.setDate(now.getDate() + 7)

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: weekAfter.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 50,
    })

    const events = (res.data.items || []).map((ev) => {
      // start / end ใน calendar อาจมา 2 แบบ: date (all day) กับ dateTime
      const start = ev.start?.dateTime || ev.start?.date || null
      const end = ev.end?.dateTime || ev.end?.date || null

      return {
        id: ev.id,
        summary: ev.summary || '(no title)',
        description: ev.description || '',
        location: ev.location || '',
        start,
        end,
        htmlLink: ev.htmlLink,
        creator: ev.creator?.email,
        attendees: ev.attendees?.map((a) => ({
          email: a.email,
          displayName: a.displayName,
          responseStatus: a.responseStatus,
        })) || [],
      }
    })

    return NextResponse.json({ items: events })
  } catch (e: any) {
    console.error('calendar error', e)
    // กรณี user ยังไม่ได้ให้สิทธิ calendar เพิ่ม ให้แจ้งแบบนี้
    return NextResponse.json(
      {
        error: e.message || 'Failed to load calendar',
      },
      { status: 500 },
    )
  }
}
