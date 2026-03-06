'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, MapPin, Send, Trash2 } from 'lucide-react'
import MessageCard from './MessageCard'
import type { ThreadMessage } from '@/lib/type'
import type { Draft } from './DraftList'

export default function DraftDialog({
  open,
  onOpenChange,
  draft,
  onUpdateDraft,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  draft: Draft
  onUpdateDraft: (id: string, newStatus: string) => void
}) {
  const [messages, setMessages] = React.useState<ThreadMessage[]>([])
  const [editingText, setEditingText] = React.useState(draft.draftReply)
  const [actionLoading, setActionLoading] = React.useState<string | null>(null)

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

  React.useEffect(() => {
    if (!open || !draft.threadId) return
    const controller = new AbortController()
    const loadThread = async () => {
      try {
        const token = localStorage.getItem('app_token')
        const res = await fetch(`${API_BASE}/api/threads/${draft.threadId}`, {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          signal: controller.signal,
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (!controller.signal.aborted) setMessages(data.items ?? [])
      } catch (e) {}
    }
    loadThread()
    return () => controller.abort()
  }, [open, draft.threadId, API_BASE])

  const handleAction = async (action: "send" | "reject") => {
    setActionLoading(action);
    try {
      const token = localStorage.getItem("app_token");
      const res = await fetch(`${API_BASE}/api/drafts/${draft.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: action === "send" ? JSON.stringify({ editedReply: editingText }) : undefined,
      });

      if (res.ok) {
        onUpdateDraft(draft.id, action === 'send' ? 'APPROVED' : 'REJECTED');
        onOpenChange(false);
      } else {
        alert("เกิดข้อผิดพลาดในการดำเนินการ");
      }
    } catch (error) {
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setActionLoading(null);
    }
  };

  const main = messages.find((m) => m.id === draft.messageId) ?? (messages.length ? messages[messages.length - 1] : undefined)
  const rest = messages.filter((m) => m.id !== main?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:max-w-4xl p-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        
        <DialogHeader className="shrink-0 px-6 pt-5 pb-3 border-b bg-muted/30">
          <DialogTitle className="text-lg font-semibold line-clamp-2 min-h-7">
            Re: {draft.subject || '\u00A0'} 
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground min-h-4 flex flex-wrap items-center gap-4 mt-1">
            {draft.suggestedDate && (
              <span className="flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md">
                <Calendar className="w-3 h-3" />
                {new Date(draft.suggestedDate).toLocaleString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50/50">
          <div className="p-6 space-y-6">
            {main && <MessageCard message={main} isMain={true} />}
            {rest.length > 0 && (
              <div className="pt-2 space-y-4">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2">ข้อความอื่นๆ ในเธรด</div>
                {rest.map((m) => <MessageCard key={m.id} message={m} />)}
              </div>
            )}
          </div>

          {draft.status === 'PENDING' ? (
            <div className="border-t bg-white p-6 space-y-4 shadow-inner mt-4">
              <div className="flex items-center justify-between text-sm font-semibold text-blue-700">
                <span>ร่างข้อความตอบกลับโดย AI (แก้ไขได้)</span>
              </div>
              <Textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="min-h-[150px] font-sans text-base leading-relaxed bg-slate-50 p-4"
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" className="text-red-600 border-red-200" onClick={() => handleAction("reject")} disabled={!!actionLoading}>
                  <Trash2 className="w-4 h-4 mr-2" /> ลบทิ้ง
                </Button>
                <Button className="bg-blue-600 text-white" onClick={() => handleAction("send")} disabled={!!actionLoading || !editingText.trim()}>
                  {actionLoading === "send" ? "กำลังประมวลผล..." : <><Send className="w-4 h-4 mr-2" /> อนุมัติ & ส่ง</>}
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-t bg-gray-100 p-6 text-center shadow-inner mt-4">
              <p className={`font-medium ${draft.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>
                {draft.status === 'APPROVED' ? 'คุณอนุมัติและส่งอีเมลฉบับนี้ไปแล้ว' : 'คุณยกเลิกการตอบกลับอีเมลฉบับนี้ไปแล้ว'}
              </p>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}