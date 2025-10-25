"use client"

import type React from "react"

import { useState } from "react"
import { Upload } from "lucide-react"

interface DragDropZoneProps {
  onFileDrop: (files: File[]) => void
  children: React.ReactNode
}

export default function DragDropZone({ onFileDrop, children }: DragDropZoneProps) {
  const [dragActive, setDragActive] = useState(false)

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

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      onFileDrop(droppedFiles)
    }
  }

  return (
    <div
      className="relative h-full w-full flex flex-col"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {children}

      {/* Overlay that appears when dragging */}
      {dragActive && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <Upload className="mb-4 h-12 w-12 text-white" />
          <p className="text-xl font-medium text-white">Drop files to send</p>
        </div>
      )}
    </div>
  )
}
