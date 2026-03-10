const { createUploadthing } = require("uploadthing/express")

const f = createUploadthing()

const ourFileRouter = {
  emailAttachment: f({ 
    image: { maxFileSize: "4MB", maxFileCount: 4 },
    pdf: { maxFileSize: "8MB", maxFileCount: 2 },
  })
    .onUploadComplete(async ({ file }) => {
      console.log("File URL:", file.url)
      return { uploadedBy: "AI-Assistant", url: file.url }
    }),
}

module.exports = { ourFileRouter }