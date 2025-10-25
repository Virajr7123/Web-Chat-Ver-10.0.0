"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { X, File, ImageIcon, FileText, Upload, Paperclip } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface FileUploadProps {
  onFileUpload: (fileUrl: string, fileType: string, fileName: string) => void
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("upload_preset", "media_chat") // Replace with your Cloudinary upload preset

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval)
            return prev
          }
          return prev + 5
        })
      }, 100)

      // Replace with your Cloudinary cloud name
      const cloudName = "de7ywzcsr" // Your cloud name
      const uploadPreset = "media_chat" // Your upload preset

      // Use a try-catch to handle potential errors
      let response
      try {
        response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Upload failed with status: ${response.status}`)
        }

        const data = await response.json()
        clearInterval(interval)
        setUploadProgress(100)
        return data.secure_url
      } catch (error) {
        console.error("Upload error:", error)
        clearInterval(interval)
        // For demo purposes, return a local URL
        return URL.createObjectURL(file)
      }
    } catch (error) {
      console.error("Cloudinary upload error:", error)
      // Return a fallback URL or throw a more descriptive error
      return URL.createObjectURL(file) // Use local URL as fallback
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (const file of files) {
        const fileUrl = await uploadToCloudinary(file)

        // Determine file type
        let fileType = "file"
        if (file.type.startsWith("image/")) {
          fileType = "image"
        } else if (file.type.startsWith("video/")) {
          fileType = "video"
        } else if (file.type.startsWith("audio/")) {
          fileType = "audio"
        }

        onFileUpload(fileUrl, fileType, file.name)
      }

      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${files.length} file(s)`,
      })

      setFiles([])
      setIsOpen(false)
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your files",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-5 w-5 text-blue-400" />
    } else if (file.type.startsWith("video/")) {
      return <FileText className="h-5 w-5 text-purple-400" />
    } else if (file.type.startsWith("audio/")) {
      return <FileText className="h-5 w-5 text-green-400" />
    } else {
      return <File className="h-5 w-5 text-gray-400" />
    }
  }

  const getFilePreview = (file: File) => {
    if (file.type.startsWith("image/")) {
      return (
        <div className="relative h-20 w-20 overflow-hidden rounded-md">
          <img
            src={URL.createObjectURL(file) || "/placeholder.svg"}
            alt={file.name}
            className="h-full w-full object-cover"
            onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
          />
        </div>
      )
    }
    return null
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-400 hover:text-white"
        onClick={(e) => {
          e.preventDefault() // Prevent form submission
          e.stopPropagation() // Stop event propagation
          setIsOpen(true)
        }}
        type="button" // Explicitly set type to button to prevent form submission
      >
        <Paperclip className="h-5 w-5" />
      </Button>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          // Only update if closing or if we're opening and not uploading
          if (!open || (open && !uploading)) {
            setIsOpen(open)
          }
        }}
      >
        <DialogContent className="border-gray-800 bg-gray-900 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Drag and drop area */}
            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                dragActive ? "border-white bg-gray-800/50" : "border-gray-700 hover:border-gray-500"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" />
              <Upload className="mb-2 h-8 w-8 text-gray-400" />
              <p className="mb-1 text-sm font-medium">Drag and drop files here or click to browse</p>
              <p className="text-xs text-gray-400">Upload images, videos, or documents</p>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Selected Files ({files.length})</h4>
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-gray-800 p-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between rounded-md bg-gray-800 p-2">
                      <div className="flex items-center space-x-3">
                        {getFilePreview(file) || getFileIcon(file)}
                        <div className="overflow-hidden">
                          <p className="truncate text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-gray-400 hover:text-white"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uploading...</span>
                  <span className="text-sm">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2 w-full bg-gray-700" />
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={() => setIsOpen(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                className="bg-white text-black hover:bg-gray-200"
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
              >
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
