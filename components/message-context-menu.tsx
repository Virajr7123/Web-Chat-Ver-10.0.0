"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Reply, Trash2, Copy } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🔥"]

interface MessageContextMenuProps {
  visible: boolean
  x: number
  y: number
  message: any
  onReply: (message: any) => void
  onDelete?: (message: any) => void
  onCopy?: (message: any) => void
  onReact?: (message: any, emoji: string) => void
  onClose: () => void
  currentUserId?: string
  canDelete?: boolean
}

export default function MessageContextMenu({
  visible,
  x,
  y,
  message,
  onReply,
  onDelete,
  onCopy,
  onReact,
  onClose,
  currentUserId,
  canDelete,
}: MessageContextMenuProps) {
  const { currentTheme } = useTheme()
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x, y })

  const handleEmojiReact = (emoji: string) => {
    if (onReact && message) {
      onReact(message, emoji)
    }
    onClose()
  }

  // Safe property access with fallbacks
  const isDeleted = message?.isDeleted || false
  const hasText = message?.text && typeof message.text === "string" && message.text.trim().length > 0
  const canDeleteMessage = canDelete && currentUserId && message?.senderUid === currentUserId && !isDeleted

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current && visible) {
      const rect = menuRef.current.getBoundingClientRect()
      const newPosition = { x, y }

      if (x + rect.width > window.innerWidth) {
        newPosition.x = window.innerWidth - rect.width - 10
      }

      if (y + rect.height > window.innerHeight) {
        newPosition.y = window.innerHeight - rect.height - 10
      }

      setPosition(newPosition)
    }
  }, [x, y, visible])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    if (visible) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscapeKey)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscapeKey)
    }
  }, [onClose, visible])

  // Don't render if not visible or no message
  if (!visible || !message) {
    return null
  }

  // Get theme-based styles for the context menu
  const getContextMenuStyles = () => {
    return {
      backgroundColor: currentTheme.colors.card ? `hsl(${currentTheme.colors.card})` : "hsl(var(--card))",
      borderColor: currentTheme.colors.border ? `hsl(${currentTheme.colors.border})` : "hsl(var(--border))",
      color: currentTheme.colors.cardForeground
        ? `hsl(${currentTheme.colors.cardForeground})`
        : "hsl(var(--card-foreground))",
    }
  }

  const getButtonHoverStyles = () => {
    return {
      backgroundColor: currentTheme.colors.accent ? `hsl(${currentTheme.colors.accent})` : "hsl(var(--accent))",
    }
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 rounded-lg border shadow-lg backdrop-blur-sm min-w-48"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        ...getContextMenuStyles(),
      }}
    >
      {/* Quick Emoji Reactions - only show if message is not deleted */}
      {!isDeleted && (
        <div className="flex flex-wrap gap-1 p-2 border-b" style={{ borderColor: getContextMenuStyles().borderColor }}>
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-all duration-200 hover:scale-110"
              style={{
                ":hover": getButtonHoverStyles(),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = getButtonHoverStyles().backgroundColor
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
              }}
              onClick={() => handleEmojiReact(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Menu Options */}
      <div className="flex flex-col space-y-1 p-1">
        {/* Reply option - only show if message is not deleted */}
        {!isDeleted && (
          <Button
            variant="ghost"
            size="sm"
            className="flex w-full items-center justify-start gap-2 px-3 py-1.5 text-sm transition-colors"
            style={{ color: getContextMenuStyles().color }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = getButtonHoverStyles().backgroundColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
            }}
            onClick={() => {
              if (message) {
                onReply(message)
              }
              onClose()
            }}
          >
            <Reply className="h-4 w-4" />
            Reply
          </Button>
        )}

        {/* Copy option - only show if message has text and is not deleted */}
        {onCopy && hasText && !isDeleted && (
          <Button
            variant="ghost"
            size="sm"
            className="flex w-full items-center justify-start gap-2 px-3 py-1.5 text-sm transition-colors"
            style={{ color: getContextMenuStyles().color }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = getButtonHoverStyles().backgroundColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
            }}
            onClick={() => {
              if (message) {
                onCopy(message)
              }
              onClose()
            }}
          >
            <Copy className="h-4 w-4" />
            Copy Text
          </Button>
        )}

        {/* Delete option - only show if user can delete */}
        {onDelete && canDeleteMessage && (
          <Button
            variant="ghost"
            size="sm"
            className="flex w-full items-center justify-start gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = getButtonHoverStyles().backgroundColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent"
            }}
            onClick={() => {
              if (message) {
                onDelete(message)
              }
              onClose()
            }}
          >
            <Trash2 className="h-4 w-4" />
            Delete Message
          </Button>
        )}
      </div>
    </div>
  )
}
