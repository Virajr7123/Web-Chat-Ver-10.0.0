"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"

interface Reaction {
  emoji: string
  users: string[]
  userNames: { [uid: string]: string }
}

interface MessageReactionsProps {
  reactions: { [emoji: string]: Reaction }
  onReactionClick: (emoji: string) => void
  currentUserId?: string
}

export default function MessageReactions({ reactions, onReactionClick, currentUserId }: MessageReactionsProps) {
  const { currentUser } = useAuth()

  // Use the passed currentUserId or fall back to currentUser
  const userId = currentUserId || currentUser?.uid

  if (!reactions || Object.keys(reactions).length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      <AnimatePresence>
        {Object.entries(reactions).map(([emoji, reaction]) => {
          const hasUserReacted = userId && reaction.users.includes(userId)
          const count = reaction.users.length

          if (count === 0) return null

          return (
            <motion.button
              key={emoji}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                hasUserReacted
                  ? "bg-blue-600/30 border border-blue-500/50 text-blue-300"
                  : "bg-gray-700/50 border border-gray-600/50 text-gray-300 hover:bg-gray-600/50"
              }`}
              onClick={() => onReactionClick(emoji)}
              title={`${reaction.users.map((uid) => reaction.userNames[uid] || "Unknown").join(", ")}`}
            >
              <span className="text-sm">{emoji}</span>
              <span className="font-medium">{count}</span>
            </motion.button>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
