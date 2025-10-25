"use client"

import { motion, AnimatePresence } from "framer-motion"

interface UnreadBadgeProps {
  count: number
}

export default function UnreadBadge({ count }: UnreadBadgeProps) {
  // Only show if count is greater than 0
  if (!count || count <= 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        className="relative"
      >
        <motion.div
          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-green-600 px-1.5 text-xs font-bold text-white shadow-lg ring-2 ring-gray-900"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(34, 197, 94, 0.7)",
              "0 0 0 4px rgba(34, 197, 94, 0)",
              "0 0 0 0 rgba(34, 197, 94, 0)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <motion.span
            key={count}
            initial={{ scale: 1.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {count > 99 ? "99+" : count}
          </motion.span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
