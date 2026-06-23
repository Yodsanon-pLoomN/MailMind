// DraftDialog.tsx - Improved version
'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Send, Trash2, Paperclip, X, FileText, Image, File } from 'lucide-react'
import MessageCard from './MessageCard'
import type { ThreadMessage } from '@/lib/type'
import type { Draft } from './DraftList'
import { cn } from '@/lib/utils'

interface AttachmentFile {
  url: string
  name: string
  size: number
  type: string
}

// ✅ Helper: แสดง icon ตามประเภทไฟล์
function AttachmentIcon({ type }: { type: string }) {
  if (type.startsWith('image/')) return <Image className="w-3 h-3 text-blue-500" />
  if (type === 'application/pdf') return <FileText className="w-3 h-3 text-red-500" />
  return <File className="w-3 h-3 text-slate-500" />
}

// ✅ Helper: แปลง bytes เป็น KB/MB
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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
  const [actionLoading, setActionLoading] = React.useState<'send' | 'reject' | null>(null)
  const [attachments, setAttachments] = React.useState<AttachmentFile[]>([])
  // ✅ Track upload state เพื่อ disable ปุ่มส่งขณะอัปโหลด
  const [isUploading, setIsUploading] = React.useState(false)

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

  React.useEffect(() => {
    if (open) {
      setEditingText(draft.draftReply)
      setAttachments([])
      setActionLoading(null)
    }
  }, [open, draft])

  React.useEffect(() => {
    if (!open || !draft.threadId) return
    const controller = new AbortController()

    const loadThread = async () => {
      try {
        const token = localStorage.getItem('app_token')
        const res = await fetch(`${API_BASE}/api/threads/${draft.threadId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!controller.signal.aborted) setMessages(data.items ?? [])
      } catch (e) {
        if (e instanceof Error && e.name !== 'AbortError') {
          console.error('Failed to load thread:', e)
        }
      }
    }

    loadThread()
    return () => controller.abort()
  }, [open, draft.threadId, API_BASE])

  const handleAction = async (action: 'send' | 'reject') => {
    setActionLoading(action)
    try {
      const token = localStorage.getItem('app_token')
      const res = await fetch(`${API_BASE}/api/drafts/${draft.id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: action === 'send'
          ? JSON.stringify({ editedReply: editingText, attachments })
          : undefined,
      })

      if (res.ok) {
        onUpdateDraft(draft.id, action === 'send' ? 'APPROVED' : 'REJECTED')
        onOpenChange(false)
      } else {
        const err = await res.json().catch(() => ({ error: 'เกิดข้อผิดพลาด' }))
        alert(err.error || 'เกิดข้อผิดพลาดในการดำเนินการ')
      }
    } catch {
      alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setActionLoading(null)
    }
  }

  const removeAttachment = (fileUrl: string) => {
    setAttachments(prev => prev.filter(a => a.url !== fileUrl))
  }

  const main = messages.find(m => m.id === draft.messageId) ?? messages.at(-1)
  const rest = messages.filter(m => m.id !== main?.id)
  const isSendDisabled = !!actionLoading || isUploading || !editingText.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-4xl p-0 overflow-hidden rounded-2xl flex flex-col max-h-[95vh] sm:max-h-[90vh]">

        {/* Header */}
        <DialogHeader className="shrink-0 px-6 pt-5 pb-3 border-b bg-muted/30">
          <DialogTitle className="text-lg font-semibold line-clamp-2">
            Re: {draft.subject || 'ไม่มีหัวข้อ'}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-4 mt-1">
            {draft.suggestedDate && (
              <span className="flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md">
                <Calendar className="w-3 h-3" />
                {new Date(draft.suggestedDate).toLocaleString('th-TH', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                })} น.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50/50">
          <div className="p-6 space-y-6">
            {main && <MessageCard message={main} isMain={true} />}
            {rest.length > 0 && (
              <div className="pt-2 space-y-4">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2">
                  Conversation Thread
                </div>
                {rest.map(m => <MessageCard key={m.id} message={m} />)}
              </div>
            )}
          </div>

          {/* Footer: Reply area or Status */}
          {draft.status === 'PENDING' ? (
            <div className="sticky bottom-0 border-t bg-white p-6 space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-blue-700">AI Assistant Draft</span>
                
               
              </div>

              <Textarea
                value={editingText}
                onChange={e => setEditingText(e.target.value)}
                className="min-h-[180px] font-sans text-base leading-relaxed bg-slate-50 p-4 border-slate-200 focus:bg-white transition-colors"
                placeholder="พิมพ์ข้อความตอบกลับที่นี่..."
              />

              {/* ✅ Attachment list พร้อม icon + ขนาดไฟล์ */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-1">
                  {attachments.map((file, idx) => (
                    <div
                      key={`${file.url}-${idx}`}
                      className="flex items-center gap-2 bg-slate-100/80 hover:bg-slate-100 px-3 py-1.5 rounded-full text-xs border border-slate-200 transition-colors group"
                    >
                      <AttachmentIcon type={file.type} />
                      <span className="max-w-[150px] truncate font-medium text-slate-700">
                        {file.name}
                      </span>
                      <span className="text-slate-400 shrink-0">
                        {formatFileSize(file.size)}
                      </span>
                      <button
                        onClick={() => removeAttachment(file.url)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-0.5 opacity-0 group-hover:opacity-100"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleAction('reject')}
                  disabled={!!actionLoading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {actionLoading === 'reject' ? 'กำลังลบ...' : 'ลบทิ้ง'}
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                  onClick={() => handleAction('send')}
                  disabled={isSendDisabled}
                  title={isUploading ? 'รอให้การอัปโหลดเสร็จสิ้น' : undefined}
                >
                  {actionLoading === 'send' ? (
                    'กำลังส่ง...'
                  ) : (
                    <><Send className="w-4 h-4 mr-2" />อนุมัติและส่งเมล</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-t bg-gray-50 p-10 text-center mt-4">
              <div className={cn(
                "inline-flex items-center px-4 py-2 rounded-full text-sm font-bold mb-2",
                draft.status === 'APPROVED' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {draft.status === 'APPROVED' ? '✓ SENT' : '✕ REJECTED'}
              </div>
              <p className="text-muted-foreground text-sm">
                {draft.status === 'APPROVED'
                  ? 'อีเมลฉบับนี้ถูกส่งไปยังผู้รับเรียบร้อยแล้ว'
                  : 'คุณได้ทำการยกเลิกดราฟฉบับนี้แล้ว'}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}