"use client"

import { useState, useRef, useEffect } from "react"
import { File, Download, ImageIcon, Music, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import VoiceMessagePlayer from "./voice-message-player"

interface MessageFilePreviewProps {
  fileUrl: string
  fileType: string
  fileName: string
}

export default function MessageFilePreview({ fileUrl, fileType, fileName }: MessageFilePreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const imageRef = useRef<HTMLImageElement>(null)

  // Use this effect to handle image loading
  useEffect(() => {
    if (fileType === "image" && imageRef.current) {
      // If the image is already loaded (from cache)
      if (imageRef.current.complete) {
        setIsLoading(false)
        setImageLoaded(true)
      }
    }
  }, [fileType])

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFileIcon = () => {
    switch (fileType) {
      case "image":
        return <ImageIcon className="h-5 w-5 text-blue-400" />
      case "video":
        return <Video className="h-5 w-5 text-purple-400" />
      case "audio":
        return <Music className="h-5 w-5 text-green-400" />
      default:
        return <File className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <div className="mb-2 max-w-xs overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
      {fileType === "image" ? (
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-400 border-t-white"></div>
            </div>
          )}
          <img
            ref={imageRef}
            src={fileUrl || "/placeholder.svg"}
            alt={fileName}
            className="max-h-60 w-full object-contain"
            onLoad={() => {
              setIsLoading(false)
              setImageLoaded(true)
            }}
            onError={() => {
              setIsLoading(false)
              setImageLoaded(true)
            }}
            style={{ display: imageLoaded ? "block" : "none" }}
          />
          {/* Placeholder while image is loading */}
          {!imageLoaded && (
            <div className="flex h-40 w-full items-center justify-center bg-gray-900/30">
              <ImageIcon className="h-8 w-8 text-gray-500" />
            </div>
          )}
        </div>
      ) : fileType === "video" ? (
        <video controls className="max-h-60 w-full" onLoadedData={() => setIsLoading(false)}>
          <source src={fileUrl} />
          Your browser does not support the video tag.
        </video>
      ) : fileType === "audio" ? (
        <VoiceMessagePlayer audioUrl={fileUrl} fileName={fileName} />
      ) : null}

      <div className="flex items-center justify-between p-2">
        <div className="flex items-center space-x-2 overflow-hidden">
          {getFileIcon()}
          <span className="truncate text-sm">{fileName}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={handleDownload}>
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
