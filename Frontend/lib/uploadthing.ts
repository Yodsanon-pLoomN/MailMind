import { generateUploadButton, generateUploadDropzone } from "@uploadthing/react"
import type { FileRouter } from "uploadthing/types"

type OurFileRouter = {
  emailAttachment: FileRouter[string]
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"

export const UploadButton = generateUploadButton<OurFileRouter>({
  url: `${API_BASE}/api/uploadthing`,
})

export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
  url: `${API_BASE}/api/uploadthing`,
})