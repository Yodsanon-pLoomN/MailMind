// app/assistant/page.tsx
'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export default function AssistantPage() {
  // ฟอร์มของเมล
  const [to, setTo] = React.useState('')
  const [subject, setSubject] = React.useState('ขอเลื่อนนัดหมายการประชุม')
  const [tone, setTone] = React.useState<'formal' | 'informal'>('formal')
  const [lang, setLang] = React.useState<'th' | 'en'>('th')
  const [prompt, setPrompt] = React.useState(
    'ลูกค้าขอเลื่อนนัดจาก 31 ต.ค. ไป 1 พ.ย. ช่วงบ่าย ช่วยตอบกลับแบบสุภาพและยืนยันเวลาให้หน่อย',
  )
  const [body, setBody] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [sending, setSending] = React.useState(false)
  const [sendResult, setSendResult] = React.useState<string | null>(null)

  // mock generate
  const handleGenerate = async () => {
    setLoading(true)
    setSendResult(null)

    // ตรงนี้ปกติคุณจะเรียก /api/assistant หรือ /api/generate-email
    // ผมทำ mock ให้ก่อน
    const formalTH = `เรียนคุณผู้รับ

ตามที่ได้แจ้งขอเลื่อนนัดจากวันที่ 31 ตุลาคม เป็นวันที่ 1 พฤศจิกายน ช่วงบ่าย ทางเราสามารถปรับตารางให้ได้เรียบร้อยแล้ว
หากต้องการเปลี่ยนแปลงเวลาอีกครั้ง หรือต้องการประชุมออนไลน์แทน สามารถแจ้งได้ทันทีครับ

ขอแสดงความนับถือ
MailMind Assistant
`
    const informalTH = `สวัสดีครับ 🙏
เรื่องเลื่อนนัดจาก 31 ต.ค. ไป 1 พ.ย. บ่าย จัดให้ได้เลยครับ 👍
ถ้าอยากเปลี่ยนเป็นเวลาอื่น หรือจะคุยออนไลน์ก็แจ้งได้เลยครับ

ขอบคุณครับ
MailMind
`

    const formalEN = `Dear Sir/Madam,

Regarding your request to reschedule from 31 October to 1 November in the afternoon, we have updated the appointment accordingly.
If you would like to adjust the time again or prefer an online meeting, please feel free to let us know.

Best regards,
MailMind Assistant
`
    const informalEN = `Hi there 👋
Got your request to move the meeting from Oct 31 to Nov 1 (afternoon) — that's okay!
If you need another time or want to do it online, just tell me 🙂

Thanks!
MailMind
`

    setTimeout(() => {
      let content = ''
      if (lang === 'th') {
        content = tone === 'formal' ? formalTH : informalTH
      } else {
        content = tone === 'formal' ? formalEN : informalEN
      }
      // ถ้ามี subject แล้ว แทรกรายละเอียดลงข้อความนิดหน่อย
      if (subject) {
        content = content.replace('เลื่อนนัด', `เลื่อนนัด (${subject})`)
      }
      setBody(content)
      setLoading(false)
    }, 500)
  }

  // mock send (ตอนนี้ยังไม่ส่งจริง)
  const handleSend = async () => {
    setSendResult(null)
    if (!to) {
      setSendResult('กรุณากรอกอีเมลปลายทางก่อน')
      return
    }
    if (!body.trim()) {
      setSendResult('ยังไม่มีข้อความอีเมล กด Generate ก่อน')
      return
    }

    setSending(true)
    try {
      // TODO: ถ้าคุณจะส่งจริง ให้ทำ route ใหม่ เช่น /api/email/compose
      // const res = await fetch('/api/email/compose', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ to, subject, body }),
      // })
      // if (!res.ok) throw new Error('Failed to send')

      // mock ส่งสำเร็จ
      setTimeout(() => {
        setSendResult('ส่ง (mock) สำเร็จแล้ว ✅')
        setSending(false)
      }, 400)
    } catch (e: any) {
      setSendResult(e.message || 'ส่งไม่สำเร็จ')
      setSending(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-4">
      
        <div className="space-y-5">
          {/* To / Subject / Tone / Lang */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="someone@example.com"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="หัวข้ออีเมล"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as any)}>
                <SelectTrigger id="tone">
                  <SelectValue placeholder="เลือกโทนภาษา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="informal">Informal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="lang">Language</Label>
              <Select value={lang} onValueChange={(v) => setLang(v as any)}>
                <SelectTrigger id="lang">
                  <SelectValue placeholder="เลือกภาษา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="th">Thai</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prompt (what AI should write) */}
          <div className="space-y-1">
            <Label htmlFor="prompt">อธิบายให้ AI ฟัง</Label>
            <Textarea
              id="prompt"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="เช่น ตอบกลับลูกค้า ขอเลื่อนนัด พูดสุภาพ เวลาที่ว่างคือ 13.00-15.00 น."
            />
            <p className="text-xs text-muted-foreground">
              ระบบจะใช้ข้อความนี้ไป generate เนื้อหาอีเมลให้
            </p>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate from AI'
              )}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setBody('')
                setSendResult(null)
              }}
            >
              Clear
            </Button>
          </div>

          {/* Body (generated) */}
          <div className="space-y-1">
            <Label htmlFor="body">Email body</Label>
            <Textarea
              id="body"
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="นี่คือเนื้อหาอีเมลที่ระบบจะส่ง..."
              className={cn('font-mono text-sm', body ? '' : 'text-muted-foreground')}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSend} disabled={sending}>
              {sending ? 'Sending...' : 'Send (mock)'}
            </Button>
            {sendResult && (
              <p
                className={cn(
                  'text-sm',
                  sendResult.includes('สำเร็จ') ? 'text-emerald-600' : 'text-red-600',
                )}
              >
                {sendResult}
              </p>
            )}
          </div>
        </div>
    </div>
  )
}
