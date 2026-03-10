// FileUploader.tsx - Improved version
'use client'

import { UploadButton } from '@/lib/uploadthing'
import { Paperclip, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

interface UploadedFile {
  url: string
  name: string
  size: number
  type: string
}

export default function FileUploader({
  onUploadSuccess,
}: {
  onUploadSuccess: (files: UploadedFile[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [lastUploadCount, setLastUploadCount] = useState(0)

  return (
    <div className="p-4 border-2 border-dashed rounded-xl bg-gray-50 flex flex-col items-center gap-2 transition-colors hover:border-blue-300 hover:bg-blue-50/30">
      <UploadButton
        endpoint="emailAttachment"
        onUploadBegin={() => {
          setUploading(true)
          setLastUploadCount(0)
        }}
        onClientUploadComplete={(res) => {
          setUploading(false)
          if (res) {
            setLastUploadCount(res.length)
            const files: UploadedFile[] = res.map(f => ({
              url: f.ufsUrl,
              name: f.name,
              size: f.size,
              type: f.type,
            }))
            onUploadSuccess(files)
          }
        }}
        onUploadError={(error: Error) => {
          setUploading(false)
          alert(`Upload failed: ${error.message}`)
        }}
        appearance={{
          button: "bg-white text-blue-600 border border-blue-200 text-sm px-5 h-9 hover:bg-blue-50 transition-all rounded-lg font-medium shadow-sm",
          allowedContent: "hidden",
        }}
        content={{
          button({ ready }) {
            if (uploading) return <>⏳ กำลังอัปโหลด...</>
            return <><Paperclip className="w-4 h-4 mr-2 inline" />{ready ? 'เลือกไฟล์' : 'กำลังเตรียม...'}</>
          },
        }}
      />

      {/* ✅ Feedback หลังอัปโหลดสำเร็จ */}
      {lastUploadCount > 0 && !uploading && (
        <p className="flex items-center gap-1 text-xs text-green-600 font-medium animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5" />
          อัปโหลด {lastUploadCount} ไฟล์สำเร็จแล้ว
        </p>
      )}

      <p className="text-xs text-gray-400 italic">รองรับไฟล์ภาพ, PDF (สูงสุด 8MB)</p>
    </div>
  )
}