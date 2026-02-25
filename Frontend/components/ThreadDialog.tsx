'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import MessageCard from './MessageCard'
import type { ThreadMessage } from '@/lib/type'

export default function ThreadDialog({
  open,
  onOpenChange,
  threadId,
  mainId,
  onEmailUpdate,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  threadId: string
  mainId?: string
  onEmailUpdate?: (id: string, patch: Record<string, unknown>) => void
}) {
  const [error, setError] = React.useState<string | null>(null)
  const [messages, setMessages] = React.useState<ThreadMessage[]>([])

  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'

  React.useEffect(() => {
    // ถ้า Dialog ปิดอยู่ ไม่ต้องทำอะไร ปล่อยข้อมูลเก่าค้างไว้ให้แอนิเมชัน Fade out เนียนๆ
    if (!open || !threadId) return

    const controller = new AbortController()

    const loadThread = async () => {
      // ✅ เคลียร์ข้อความเก่าและ Error ทิ้งทันทีที่เริ่มเปิดอีเมลฉบับใหม่
      setMessages([]) 
      setError(null)
      
      try {
        const token = localStorage.getItem('app_token')
        const res = await fetch(`${API_BASE}/api/threads/${threadId}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          signal: controller.signal,
          cache: 'no-store',
        })
        
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          throw new Error(d.error || 'Failed to load thread')
        }
        
        const data = await res.json()

        // อัปเดตข้อมูลเมื่อโหลดเสร็จและยังไม่ได้กดปิด
        if (!controller.signal.aborted) {
          setMessages(data.items ?? [])
          
          if (mainId && onEmailUpdate) {
              onEmailUpdate(mainId, { isRead: true })
          }
        }
      } catch (e: unknown) {
        if (!controller.signal.aborted) {
          const errorMessage = e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการโหลดเนื้อหา'
          setError(errorMessage)
        }
      }
    }

    loadThread()

    return () => {
      controller.abort() // ยกเลิก API ทันทีที่กดกากบาท
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, threadId])

  const main = messages.find((m) => m.id === mainId) ?? (messages.length ? messages[messages.length - 1] : undefined)
  const rest = messages.filter((m) => m.id !== main?.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:max-w-4xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b bg-muted/30">
          <DialogTitle className="text-lg font-semibold line-clamp-2 min-h-7">
            {/* ✅ ใส่ Space ว่างไว้กัน Layout ยุบตัวตอนที่ข้อมูลยังไม่มา */}
            {main?.subject || '\u00A0'} 
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground min-h-4">
            {messages.length > 0 ? `${messages.length} ข้อความในการสนทนานี้` : ''}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="p-12 text-center text-sm text-red-600">{error}</div>
        ) : (
          /* ✅ ล็อกความสูงขั้นต่ำไว้ (min-h-[50vh]) เพื่อไม่ให้หน้าต่างแบนติดพื้นตอนไม่มีข้อมูล */
          <ScrollArea className="max-h-[80vh] min-h-[50vh] bg-gray-50/50">
            <div className="p-6 space-y-6">
              
              {main && <MessageCard message={main} isMain={true} />}
              
              {rest.length > 0 && (
                <div className="pt-2 space-y-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-2">
                    ข้อความอื่นๆ ในเธรด
                  </div>
                  {rest.map((m) => (
                    <MessageCard key={m.id} message={m} />
                  ))}
                </div>
              )}

            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}