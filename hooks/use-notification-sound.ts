"use client"

import { useCallback } from "react"

export function useNotificationSound() {
  // Removed all sound functionality
  const playNotificationSound = useCallback(() => {
    // No sound - completely removed
  }, [])

  return {
    playNotificationSound,
  }
}
