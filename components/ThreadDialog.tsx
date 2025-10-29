'use client'

import * as React from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type ThreadMessage = {
  id: string
  threadId: string
  from: string
  subject: string
  date: string
  internalDate: string
  snippet: string
  isRead: boolean
  body?: string
}

export default function ThreadDialog({
  open,
  onOpenChange,
  threadId,
  mainId,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  threadId: string
  mainId?: string
}) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [messages, setMessages] = React.useState<ThreadMessage[]>([])
  const [draftLoading, setDraftLoading] = React.useState(false)
  const [sendLoading, setSendLoading] = React.useState(false)
  const [sendError, setSendError] = React.useState<string | null>(null)
  const [isAppointment, setIsAppointment] = React.useState<boolean | null>(null)
  const [reply, setReply] = React.useState('')
  const [inited, setInited] = React.useState(false)

  const main =
    messages.find((m) => m.id === mainId) ??
    (messages.length ? messages[messages.length - 1] : undefined)
  const rest = messages.filter((m) => m.id !== main?.id)

  // โหลด thread จาก Gmail
  React.useEffect(() => {
    if (!open || !threadId) return
    const controller = new AbortController()
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/threads/${threadId}`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        const data = await res.json()
        setMessages(data.items ?? [])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
    return () => controller.abort()
  }, [open, threadId])

  // ✅ เมื่อเปิดเมล → เช็คใน DB ก่อน
  React.useEffect(() => {
    if (!open || !main?.id) return

    const controller = new AbortController()
    ;(async () => {
      try {
        const check = await fetch(`/api/email/check/${main.id}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!check.ok) throw new Error('check failed')
        const data = await check.json()

        if (data.exists) {
          // ✅ เคยมีแล้ว
          setInited(true)
          setIsAppointment(data.isAppointment)
          setReply(data.replyText || '')

          // ถ้าเคยบันทึกแต่ยังไม่มีการ detect นัดหมาย → ข้าม draft
          if (data.isAppointment === null) {
            console.log('record exists but not processed yet → running n8n...')
            await callDraft(main)
          }
        } else {
          // ❌ ยังไม่เคย → init ใหม่ + call n8n
          console.log('no record → init and call n8n...')
          await initAndDraft(main)
        }
      } catch (e) {
        console.error('check/init error', e)
      }
    })()

    return () => controller.abort()
  }, [open, main?.id])

  // ✅ ฟังก์ชัน init + call n8n
  async function initAndDraft(m: ThreadMessage) {
    await fetch('/api/email/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: m.id,
        subject: m.subject,
        snippet: m.snippet,
        from: m.from,
      }),
    })
    await callDraft(m)
  }

  // ✅ ฟังก์ชันเรียก n8n draft
  async function callDraft(m: ThreadMessage) {
    try {
      setDraftLoading(true)
      const res = await fetch('/api/n8n/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: m.id,
          subject: m.subject,
          snippet: m.snippet,
          from: m.from,
        }),
      })
      const data = await res.json()
      const appointment = data?.email?.isAppointment ?? data?.isAppointment ?? null
      setIsAppointment(appointment)

      // ✅ ถ้ามี replyText ใน response ใช้เลย
      if (appointment === true) {
        if (data?.email?.replyText) {
          setReply(data.email.replyText)
        } else {
          // ไม่มีใน response → fetch จาก DB
          const rr = await fetch(`/api/email/${m.id}`, { cache: 'no-store' })
          if (rr.ok) {
            const jj = await rr.json()
            setReply(jj?.email?.replyText || '')
          }
        }
      } else {
        setReply('')
      }
    } catch (e) {
      console.error('draft error', e)
    } finally {
      setDraftLoading(false)
    }
  }

  async function handleSend() {
    if (!main) return
    try {
      setSendLoading(true)
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: main.id, replyText: reply }),
      })
      if (!res.ok) throw new Error('send failed')
      onOpenChange(false)
    } catch (e: any) {
      setSendError(e.message)
    } finally {
      setSendLoading(false)
    }
  }

  const fmtDate = (x: string) => {
    const d = new Date(Number(x) || x)
    return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:max-w-4xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-muted/30">
          <DialogTitle className="text-lg font-semibold">
            {main?.subject || 'Conversation'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {messages.length} message{messages.length !== 1 && 's'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading conversation...</div>
        ) : (
          <ScrollArea className="max-h-[80vh]">
            {main && (
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {!main.isRead && <Badge>New</Badge>}
                      <h2 className="font-semibold text-base">{main.from}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {fmtDate(main.internalDate || main.date)}
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div
                  className={cn(
                    'text-[15px] leading-7 whitespace-pre-wrap rounded-md border p-4 bg-muted/10',
                    'overflow-x-auto wrap-break-word'
                  )}
                  style={{ overflowWrap: 'anywhere' }}
                >
                  {main.body?.trim() || main.snippet}
                </div>

                <Separator className="my-6" />

                {/* ✅ Reply Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="reply" className="text-sm">
                    {isAppointment === true
                      ? 'Suggested reply (auto-detected appointment)'
                      : 'Reply'}
                  </Label>
                  <Textarea
                    id="reply"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder={
                      isAppointment === true
                        ? 'Edit the suggested reply...'
                        : 'Type your reply...'
                    }
                    className="min-h-40"
                  />
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleSend}
                      disabled={sendLoading || draftLoading}
                    >
                      {sendLoading ? 'Sending...' : 'Send'}
                    </Button>
                    {draftLoading && (
                      <span className="text-xs text-muted-foreground">
                        Preparing draft…
                      </span>
                    )}
                    {sendError && (
                      <span className="text-xs text-red-600">{sendError}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
