'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  onEmailUpdate, // 👈 callback สำหรับอัปเดต list ข้างนอก
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  threadId: string
  mainId?: string
  onEmailUpdate?: (id: string, patch: any) => void
}) {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [messages, setMessages] = React.useState<ThreadMessage[]>([])

  const [draftLoading, setDraftLoading] = React.useState(false)
  const [sendLoading, setSendLoading] = React.useState(false)
  const [sendError, setSendError] = React.useState<string | null>(null)

  const [isAppointment, setIsAppointment] = React.useState<boolean | null>(null)
  const [reply, setReply] = React.useState('')

  // โหลดเธรดจาก API
  React.useEffect(() => {
    if (!open || !threadId) return
    const controller = new AbortController()

    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/threads/${threadId}`, {
          signal: controller.signal,
          cache: 'no-store',
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.error || 'Failed to load thread')
        }
        const data = await res.json()
        setMessages(data.items ?? [])
      } catch (e: any) {
        if (e?.name !== 'AbortError') setError(e.message)
      } finally {
        setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [open, threadId])

  // main msg = อันที่คลิก / หรืออันล่าสุด
  const main =
    messages.find((m) => m.id === mainId) ??
    (messages.length ? messages[messages.length - 1] : undefined)
  const rest = messages.filter((m) => m.id !== main?.id)

  // เมื่อเปิด dialog แล้ว มี main แล้ว → เช็คใน DB ก่อนว่ามี record แล้วมั้ย
  React.useEffect(() => {
    if (!open || !main?.id) return
    const controller = new AbortController()

    ;(async () => {
      try {
        // 1) เช็คก่อน
        const checkRes = await fetch(`/api/email/check/${main.id}`, {
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!checkRes.ok) throw new Error('check failed')
        const check = await checkRes.json()

        if (check.exists) {
          // ✅ เคยเปิดแล้ว
          setIsAppointment(check.isAppointment)
          setReply(check.replyText || '')

          // อัปเดต list ว่าอ่านแล้ว
          onEmailUpdate?.(main.id, {
            isRead: true,
            status: check.status ?? 'DRAFT',
          })

          // ถ้ายังไม่ได้ process นัดหมายเลย (isAppointment === null) → ยิงหา n8n อีกรอบ
          if (check.isAppointment === null) {
            await callDraft(main)
          }
        } else {
          // ❌ ยังไม่เคยเปิด → init + draft
          await initAndDraft(main)
        }
      } catch (e) {
        console.error('check/init error', e)
      }
    })()

    return () => controller.abort()
  }, [open, main?.id])

  // init record + call n8n
  async function initAndDraft(m: ThreadMessage) {
    // สร้าง record ใน DB ก่อน
    await fetch('/api/email/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId: m.id,
        subject: m.subject,
        snippet: m.snippet,
        from: m.from,
        threadId: m.threadId,
      }),
    })

    // เรียก n8n ให้สร้าง draft
    const data = await callDraft(m)

    // แจ้ง list ว่าตอนนี้อีเมลนี้มี draft แล้ว + อ่านแล้ว
    onEmailUpdate?.(m.id, {
      status: 'DRAFT',
      isRead: true,
    })

    return data
  }

  // เรียก n8n เพื่อสร้าง draft / detect นัดหมาย
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'n8n draft failed')
      }

      const data = await res.json()

      const appointment = data?.email?.isAppointment ?? data?.isAppointment ?? null
      setIsAppointment(appointment)

      if (appointment === true) {
        // ถ้า response มี reply เลย → ใช้เลย
        if (data?.email?.replyText) {
          setReply(data.email.replyText)
        } else {
          // ถ้าไม่มี → ดึงจาก DB อีกรอบ
          const rr = await fetch(`/api/email/${m.id}`, { cache: 'no-store' })
          if (rr.ok) {
            const jj = await rr.json()
            setReply(jj?.email?.replyText || '')
          }
        }
      } else {
        // ไม่ใช่นัดหมาย → ช่องว่างให้พิมพ์เอง
        setReply('')
      }

      return data
    } catch (e) {
      console.error('draft error', e)
    } finally {
      setDraftLoading(false)
    }
  }

  // ส่งเมลจริง
  async function handleSend() {
    if (!main) return
    try {
      setSendLoading(true)
      setSendError(null)

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: main.id, replyText: reply }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'send failed')
      }

      // ✅ แจ้ง parent
      onEmailUpdate?.(main.id, {
        status: 'SENT',
        isRead: true,
      })

      onOpenChange(false)
    } catch (e: any) {
      setSendError(e.message)
    } finally {
      setSendLoading(false)
    }
  }

  const fmtDate = (x: string) => {
    const epoch = Number(x)
    const d = Number.isFinite(epoch) && epoch > 0 ? new Date(epoch) : new Date(x)
    try {
      return d.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
    } catch {
      return x
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:max-w-4xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-muted/30">
          <DialogTitle className="text-lg font-semibold line-clamp-2">
            {main?.subject || 'Conversation'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {messages.length} message{messages.length !== 1 && 's'}
            {isAppointment === true && ' • Detected appointment'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading conversation...</div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        ) : (
          <ScrollArea className="max-h-[80vh]">
            {main && (
              <div className="p-6 space-y-6">
                {/* header main msg */}
                <div className="flex justify-between items-start">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!main.isRead && <Badge>New</Badge>}
                      <h2 className="font-semibold text-base break-words">{main.from}</h2>
                    </div>
                    <p className="text-sm text-muted-foreground">{fmtDate(main.internalDate || main.date)}</p>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* main body */}
                <div
                  className={cn(
                    'text-[15px] leading-7 whitespace-pre-wrap rounded-md border p-4 bg-muted/10',
                    'overflow-x-auto break-words'
                  )}
                  style={{ overflowWrap: 'anywhere' }}
                >
                  {main.body?.trim() || main.snippet}
                </div>

                <Separator className="my-6" />

                {/* reply */}
                <div className="space-y-2">
                  <Label htmlFor="reply" className="text-sm">
                    {isAppointment === true ? 'Suggested reply' : 'Reply'}
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
                    <Button onClick={handleSend} disabled={sendLoading || draftLoading}>
                      {sendLoading ? 'Sending...' : 'Send'}
                    </Button>
                    {draftLoading && (
                      <span className="text-xs text-muted-foreground">Preparing draft…</span>
                    )}
                    {sendError && (
                      <span className="text-xs text-red-600">{sendError}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* other messages */}
            {rest.length > 0 && (
              <div className="px-6 pb-6 space-y-4">
                <Separator className="my-2" />
                {rest.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg border bg-muted/10 hover:bg-muted/20 transition-colors p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {!m.isRead && (
                            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                          )}
                          <span className="text-sm font-medium break-words">{m.from}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 break-words">
                          {fmtDate(m.internalDate || m.date)}
                        </p>
                      </div>
                    </div>
                    <div
                      className="mt-3 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap overflow-x-auto break-words"
                      style={{ overflowWrap: 'anywhere' }}
                    >
                      {m.body?.trim() || m.snippet}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {messages.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No messages found in this thread.
              </div>
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
