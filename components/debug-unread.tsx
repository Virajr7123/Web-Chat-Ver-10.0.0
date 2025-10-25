"use client"

import { useEffect } from "react"
import { useChat } from "@/contexts/chat-context"
import { useAuth } from "@/contexts/auth-context"
import { ref, onValue } from "firebase/database"
import { database } from "@/lib/firebase"

// This is a hidden component to help debug unread counts
export default function DebugUnread() {
  const { currentUser } = useAuth()
  const { contacts } = useChat()

  useEffect(() => {
    if (!currentUser) return

    // Listen for changes to contacts to debug unread counts
    const contactsRef = ref(database, `contacts/${currentUser.uid}`)
    const unsubscribe = onValue(contactsRef, (snapshot) => {
      if (!snapshot.exists()) return

      const data = snapshot.val()
      console.log("Raw contacts data:", data)

      // Log unread counts for each contact
      Object.entries(data).forEach(([uid, contactData]: [string, any]) => {
        console.log(`Contact ${contactData.name || uid}: unread = ${contactData.unread || 0}`)
      })
    })

    return () => unsubscribe()
  }, [currentUser])

  // This component doesn't render anything visible
  return null
}
