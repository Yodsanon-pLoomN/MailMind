'use client'

import * as React from 'react'
import { addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, format } from 'date-fns'
import { th } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type CalendarEvent = {
  id: string
  summary: string
  start: string | null
  end: string | null
  location?: string
  htmlLink?: string
}

export default function FullCalendar() {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date())
  const [events, setEvents] = React.useState<CalendarEvent[]>([])
  const [loading, setLoading] = React.useState(false)

  // โหลด event จาก /api/calendar ตอน mount
  React.useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/calendar', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok) {
          setEvents(data.items || [])
        } else {
          console.warn('calendar error', data)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const today = new Date()

  const nextMonth = () => setCurrentMonth((m) => addMonths(m, 1))
  const prevMonth = () => setCurrentMonth((m) => subMonths(m, 1))
  const goToday = () => {
    const now = new Date()
    setCurrentMonth(now)
    setSelectedDate(now)
  }

  // สร้าง grid ของเดือนนี้
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const weekStart = startOfWeek(monthStart, { weekStartsOn: 1 }) // จันทร์
  const weekEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const rows: React.JSX.Element[] = []
  let days: React.JSX.Element[] = []
  let day = weekStart
  let formattedDate = ''

  while (day <= weekEnd) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, 'd', { locale: th })
      const cloneDay = day
      const hasEvent = events.some((ev) => isSameDay(new Date(ev.start || ev.end || ''), cloneDay))

      days.push(
        <div
          key={day.toISOString()}
          onClick={() => setSelectedDate(cloneDay)}
          className={cn(
            'min-h-20 border bg-background/50 p-2 cursor-pointer transition hover:bg-muted/60 flex flex-col gap-1',
            !isSameMonth(day, monthStart) && 'bg-muted/30 text-muted-foreground',
            isSameDay(day, selectedDate) && 'ring-2 ring-primary ring-offset-2',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'text-sm',
                isSameDay(day, today) && 'font-semibold text-primary'
              )}
            >
              {formattedDate}
            </span>
            {hasEvent ? (
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            ) : null}
          </div>

          {/* แสดงอีเวนต์ 1-2 อันแรกของวันนั้น */}
          <div className="flex flex-col gap-1">
            {events
              .filter((ev) => {
                const d = ev.start ? new Date(ev.start) : ev.end ? new Date(ev.end) : null
                return d ? isSameDay(d, cloneDay) : false
              })
              .slice(0, 2)
              .map((ev) => (
                <div
                  key={ev.id}
                  className="truncate rounded bg-emerald-50 text-emerald-700 px-1.5 py-0.5 text-[10px] font-medium"
                >
                  {ev.summary}
                </div>
              ))}
          </div>
        </div>
      )
      day = addDays(day, 1)
    }
    rows.push(
      <div className="grid grid-cols-7" key={day.toISOString()}>
        {days}
      </div>
    )
    days = []
  }

  // events ของวันที่เลือก
  const selectedEvents = events.filter((ev) => {
    const d = ev.start ? new Date(ev.start) : ev.end ? new Date(ev.end) : null
    return d ? isSameDay(d, selectedDate) : false
  })

  const fmtDateTime = (x: string | null) => {
    if (!x) return ''
    const d = new Date(x)
    return d.toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
      {/* ซ้าย: calendar */}
      <Card className="p-4 lg:p-6">
        <div className="flex flex-col gap-4">
          {/* header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold leading-tight">
                {format(currentMonth, 'MMMM yyyy', { locale: th })}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth}>
                ←
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                →
              </Button>
              <Button onClick={goToday} variant="default">
                Today
              </Button>
            </div>
          </div>

          {/* weekday header */}
          <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-sky-600">Sat</div>
            <div className="text-rose-600">Sun</div>
          </div>

          {/* calendar grid */}
          <div className="grid gap-0">
            {rows}
          </div>

          {loading && (
            <p className="text-xs text-muted-foreground">กำลังโหลดเหตุการณ์จาก Google…</p>
          )}
        </div>
      </Card>

      {/* ขวา: event list ของวันนั้น */}
      <Card className="p-4 lg:p-6 flex flex-col gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Events on</p>
          <h3 className="text-lg font-semibold">
            {format(selectedDate, 'd MMMM yyyy', { locale: th })}
          </h3>
        </div>
        <Separator />

        {selectedEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">ไม่มีนัดหมายวันนี้</p>
        ) : (
          <div className="space-y-3">
            {selectedEvents.map((ev) => (
              <div key={ev.id} className="rounded-lg border bg-muted/30 p-3 space-y-1">
                <p className="font-medium text-sm">{ev.summary}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtDateTime(ev.start)} – {fmtDateTime(ev.end)}
                </p>
                {ev.location ? (
                  <p className="text-xs text-muted-foreground">📍 {ev.location}</p>
                ) : null}
                {ev.htmlLink ? (
                  <a
                    href={ev.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    เปิดใน Google Calendar
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
