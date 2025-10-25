"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Pin, PinOff, Trash2, Archive, ArchiveRestore } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"

interface Contact {
  id: string
  uid: string
  name: string
  email: string
  avatar?: string
  lastMessage?: string
  timestamp?: number
  unread?: number
  isOnline?: boolean
  lastSeen?: number
}

interface Group {
  id: string
  name: string
  description?: string
  avatar?: string
  createdBy: string
  createdAt: number
  members: { [uid: string]: { name: string; role: "admin" | "member"; joinedAt: number } }
  lastMessage?: string
  timestamp?: number
  unread?: number
}

interface ChatContextMenuProps {
  visible: boolean
  x: number
  y: number
  contact: Contact | null
  group: Group | null
  onClose: () => void
  onPin: (chatId: string, isGroup?: boolean) => void
  onDelete: (chatId: string, isGroup?: boolean) => void
  onArchive: (chatId: string, isGroup?: boolean) => void
  onMarkAsRead: (chatId: string, isGroup?: boolean) => void
  isPinned: (chatId: string) => boolean
  isArchived: (chatId: string) => boolean
}

export default function ChatContextMenu({
  visible,
  x,
  y,
  contact,
  group,
  onClose,
  onPin,
  onDelete,
  onArchive,
  onMarkAsRead,
  isPinned,
  isArchived,
}: ChatContextMenuProps) {
  const { currentTheme } = useTheme()
  const menuRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x, y })

  const currentChat = contact || group
  const isGroup = !!group
  const chatId = currentChat?.id || ""
  const chatName = contact?.name || group?.name || ""
  const pinned = isPinned(chatId)
  const archived = isArchived(chatId)

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current && visible) {
      const rect = menuRef.current.getBoundingClientRect()
      const newPosition = { x, y }

      // Adjust horizontal position
      if (x + rect.width > window.innerWidth) {
        newPosition.x = window.innerWidth - rect.width - 10
      }
      if (newPosition.x < 10) {
        newPosition.x = 10
      }

      // Adjust vertical position
      if (y + rect.height > window.innerHeight) {
        newPosition.y = window.innerHeight - rect.height - 10
      }
      if (newPosition.y < 10) {
        newPosition.y = 10
      }

      setPosition(newPosition)
    }
  }, [x, y, visible])

  // Close menu when clicking outside or pressing escape
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

  if (!visible || !currentChat) {
    return null
  }

  // Get theme-based styles
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
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            duration: 0.15,
          }}
          className="fixed z-[9999] rounded-xl border shadow-2xl backdrop-blur-md min-w-48 overflow-hidden"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            ...getContextMenuStyles(),
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          }}
        >
          {/* Header with chat info */}
          <div
            className="px-4 py-3 border-b bg-gradient-to-r from-transparent to-primary/5"
            style={{ borderColor: getContextMenuStyles().borderColor }}
          >
            <p className="text-sm font-medium truncate" style={{ color: getContextMenuStyles().color }}>
              {chatName}
            </p>
            <p className="text-xs opacity-70">{isGroup ? "Group" : "Contact"}</p>
          </div>

          {/* Menu Options */}
          <div className="py-2">
            {/* Archive/Unarchive Option */}
            <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
              <Button
                variant="ghost"
                size="sm"
                className="flex w-full items-center justify-start gap-3 px-4 py-3 text-sm transition-all duration-200 hover:bg-transparent"
                style={{ color: getContextMenuStyles().color }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = getButtonHoverStyles().backgroundColor
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent"
                }}
                onClick={() => {
                  onArchive(chatId, isGroup)
                }}
              >
                <motion.div
                  animate={{ rotate: archived ? 0 : 0, scale: archived ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={`p-1.5 rounded-lg ${
                    archived
                      ? "bg-green-500/20 text-green-600 dark:text-green-400"
                      : "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                  }`}
                >
                  {archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </motion.div>
                <span className="font-medium">{archived ? "Unarchive chat" : "Archive chat"}</span>
              </Button>
            </motion.div>

            {/* Mark as Read Option - Only show if there are unread messages */}
            {!archived && (contact?.unread || group?.unread) && (contact?.unread > 0 || group?.unread > 0) && (
              <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex w-full items-center justify-start gap-3 px-4 py-3 text-sm transition-all duration-200 hover:bg-transparent"
                  style={{ color: getContextMenuStyles().color }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = getButtonHoverStyles().backgroundColor
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }}
                  onClick={() => {
                    onMarkAsRead(chatId, isGroup)
                  }}
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="p-1.5 rounded-lg bg-green-500/20 text-green-600 dark:text-green-400"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                  <span className="font-medium">Mark as read</span>
                </Button>
              </motion.div>
            )}

            {/* Pin/Unpin Option - Only show if not archived */}
            {!archived && (
              <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex w-full items-center justify-start gap-3 px-4 py-3 text-sm transition-all duration-200 hover:bg-transparent"
                  style={{ color: getContextMenuStyles().color }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = getButtonHoverStyles().backgroundColor
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent"
                  }}
                  onClick={() => {
                    onPin(chatId, isGroup)
                  }}
                >
                  <motion.div
                    animate={{ rotate: pinned ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className={`p-1.5 rounded-lg ${
                      pinned
                        ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                        : "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                    }`}
                  >
                    {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                  </motion.div>
                  <span className="font-medium">{pinned ? "Unpin chat" : "Pin chat"}</span>
                </Button>
              </motion.div>
            )}

            {/* Delete Option */}
            <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}>
              <Button
                variant="ghost"
                size="sm"
                className="flex w-full items-center justify-start gap-3 px-4 py-3 text-sm transition-all duration-200 hover:bg-transparent"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent"
                }}
                onClick={() => {
                  onDelete(chatId, isGroup)
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="p-1.5 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </motion.div>
                <span className="font-medium text-red-600 dark:text-red-400">Delete chat</span>
              </Button>
            </motion.div>
          </div>

          {/* Subtle bottom gradient */}
          <div className="h-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20"></div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
