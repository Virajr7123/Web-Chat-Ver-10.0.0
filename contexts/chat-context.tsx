"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext, useCallback, useRef } from "react"
import { getDatabase, ref, push, set, onValue, update, remove, get } from "firebase/database"
import { useAuth } from "./auth-context"

interface Message {
  id: string
  text: string
  senderUid: string
  receiverUid: string
  timestamp: number
  status: string
  sender: "user" | "contact"
  isTemp?: boolean
  fileUrl?: string
  fileType?: string
  fileName?: string
  replyToId?: string
  replyToText?: string
  read?: boolean
  reactions?: { [emoji: string]: { users: string[]; userNames: { [uid: string]: string } } }
  isDeleted?: boolean
  deletedAt?: number
  deletedBy?: string
  originalText?: string
  originalFileUrl?: string
  originalFileType?: string
  originalFileName?: string
}

interface Contact {
  id: string
  name: string
  profilePic: string
  lastMessage: string
  time: string
  unread: number
}

interface ChatContextType {
  selectedContact: Contact | null
  setSelectedContact: (contact: Contact | null) => void
  messages: { [contactId: string]: Message[] }
  sendMessage: (
    text: string,
    replyToId?: string,
    fileUrl?: string,
    fileType?: string,
    fileName?: string,
  ) => Promise<void>
  addReaction: (messageId: string, emoji: string, contactId: string) => Promise<void>
  deleteMessage: (messageId: string, contactId: string) => Promise<void>
  contacts: Contact[]
  setContacts: (contacts: Contact[]) => void
  error: string | null
  setError: (error: string | null) => void
  pendingMessages: Message[]
  setPendingMessages: React.Dispatch<React.SetStateAction<Message[]>>
  typingUsers: { [contactId: string]: boolean }
  setTyping: (contactId: string, isTyping: boolean) => void
  startTyping: (contactId: string) => void
  stopTyping: (contactId: string) => void
  setMessages: React.Dispatch<React.SetStateAction<{ [contactId: string]: Message[] }>>
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider")
  }
  return context
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth()
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<{ [contactId: string]: Message[] }>({})
  const [contacts, setContacts] = useState<Contact[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pendingMessages, setPendingMessages] = useState<Message[]>([])
  const [typingUsers, setTypingUsers] = useState<{ [contactId: string]: boolean }>({})
  const lastMessageTimestampRef = useRef<{ [contactId: string]: number }>({})

  const database = getDatabase()
  const typingTimeoutRef = useRef<{ [contactId: string]: NodeJS.Timeout }>({})

  const getChatId = (uid1: string, uid2: string): string => {
    return uid1 > uid2 ? `${uid1}-${uid2}` : `${uid2}-${uid1}`
  }

  // Set up typing indicator listeners with better cleanup
  useEffect(() => {
    if (!currentUser) return

    const typingRef = ref(database, `typing`)
    const unsubscribe = onValue(typingRef, (snapshot) => {
      if (!snapshot.exists()) {
        setTypingUsers({})
        return
      }

      const typingData = snapshot.val()
      const newTypingUsers: { [contactId: string]: boolean } = {}

      Object.keys(typingData).forEach((chatId) => {
        const chatTyping = typingData[chatId]
        if (chatTyping) {
          Object.keys(chatTyping).forEach((userId) => {
            if (userId !== currentUser.uid && chatTyping[userId]) {
              // Find which contact this user is
              const contact = contacts.find((c) => c.id === userId)
              if (contact) {
                newTypingUsers[contact.id] = true
              }
            }
          })
        }
      })

      setTypingUsers(newTypingUsers)
    })

    return () => unsubscribe()
  }, [currentUser, database, contacts])

  const setTyping = useCallback(
    (contactId: string, isTyping: boolean) => {
      if (!currentUser) return

      const chatId = getChatId(currentUser.uid, contactId)
      const typingRef = ref(database, `typing/${chatId}/${currentUser.uid}`)

      if (isTyping) {
        set(typingRef, true)
      } else {
        remove(typingRef)
      }
    },
    [currentUser, database],
  )

  const startTyping = useCallback(
    (contactId: string) => {
      setTyping(contactId, true)

      // Clear existing timeout
      if (typingTimeoutRef.current[contactId]) {
        clearTimeout(typingTimeoutRef.current[contactId])
      }

      // Set new timeout to stop typing after 3 seconds
      typingTimeoutRef.current[contactId] = setTimeout(() => {
        setTyping(contactId, false)
        delete typingTimeoutRef.current[contactId]
      }, 3000)
    },
    [setTyping],
  )

  const stopTyping = useCallback(
    (contactId: string) => {
      setTyping(contactId, false)

      // Clear timeout
      if (typingTimeoutRef.current[contactId]) {
        clearTimeout(typingTimeoutRef.current[contactId])
        delete typingTimeoutRef.current[contactId]
      }
    },
    [setTyping],
  )

  // Enhanced message loading with proper unread tracking and delivery status
  useEffect(() => {
    if (!currentUser || !selectedContact) return

    const getChatId = (uid1: string, uid2: string): string => {
      return uid1 > uid2 ? `${uid1}-${uid2}` : `${uid2}-${uid1}`
    }

    const chatId = getChatId(currentUser.uid, selectedContact.id)
    const messagesRef = ref(database, `messages/${chatId}`)

    const unsubscribe = onValue(messagesRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setMessages((prev) => ({ ...prev, [selectedContact.id]: [] }))
        return
      }

      try {
        const messagesData = snapshot.val()
        const messagesList = Object.keys(messagesData).map((key) => {
          const msgData = messagesData[key]
          return {
            id: key,
            ...msgData,
            sender: msgData.senderUid === currentUser.uid ? "user" : "contact",
            timestamp: typeof msgData.timestamp === "number" ? msgData.timestamp : msgData.clientTimestamp || 0,
            reactions: msgData.reactions || {},
            isDeleted: msgData.isDeleted || false,
          }
        })

        // Sort by timestamp and update state
        messagesList.sort((a, b) => a.timestamp - b.timestamp)
        setMessages((prev) => ({ ...prev, [selectedContact.id]: messagesList }))

        // Mark messages as read when opening the chat AND update delivery status
        const unreadMessages = messagesList.filter((msg) => msg.senderUid !== currentUser.uid && !msg.read)

        if (unreadMessages.length > 0) {
          // Mark messages as read in Firebase
          const updates: { [key: string]: any } = {}
          unreadMessages.forEach((msg) => {
            updates[`messages/${chatId}/${msg.id}/read`] = true
            updates[`messages/${chatId}/${msg.id}/readAt`] = Date.now()
          })

          await update(ref(database), updates)

          // Update contact's unread count to 0
          const contactRef = ref(database, `contacts/${currentUser.uid}/${selectedContact.id}`)
          await update(contactRef, { unread: 0 })
        }

        // Update delivery status for sender's messages when receiver opens chat
        const senderMessages = messagesList.filter((msg) => msg.senderUid !== currentUser.uid && msg.status === "sent")
        if (senderMessages.length > 0) {
          const deliveryUpdates: { [key: string]: any } = {}
          senderMessages.forEach((msg) => {
            deliveryUpdates[`messages/${chatId}/${msg.id}/status`] = "delivered"
          })
          await update(ref(database), deliveryUpdates)
        }
      } catch (err) {
        console.error("Error loading messages:", err)
        setError("Failed to load messages")
      }
    })

    return () => unsubscribe()
  }, [currentUser, selectedContact, database])

  const sendMessage = useCallback(
    async (text: string, replyToId?: string, fileUrl?: string, fileType?: string, fileName?: string): Promise<void> => {
      if (!currentUser || !selectedContact) return

      const chatId = getChatId(currentUser.uid, selectedContact.id)
      const messagesRef = ref(database, `messages/${chatId}`)
      const newMessageRef = push(messagesRef)

      try {
        const message = {
          text,
          senderUid: currentUser.uid,
          receiverUid: selectedContact.id,
          timestamp: {
            ".sv": "timestamp",
          },
          clientTimestamp: Date.now(),
          status: "sent",
          fileUrl: fileUrl || null,
          fileType: fileType || null,
          fileName: fileName || null,
          replyToId: replyToId || null,
          replyToText: replyToId ? messages[selectedContact.id]?.find((m) => m.id === replyToId)?.text || null : null,
          reactions: {},
          read: false,
        }

        // Send message directly to Firebase - let the real-time listener handle UI updates
        await set(newMessageRef, message)

        // After sending message successfully, set up a listener for delivery status
        const deliveryRef = ref(database, `messageDelivery/${chatId}/${newMessageRef.key}`)

        // Listen for when the receiver marks this message as delivered
        const deliveryListener = onValue(deliveryRef, (snapshot) => {
          if (snapshot.exists() && snapshot.val().delivered) {
            // Update message status to delivered
            const messageRef = ref(database, `messages/${chatId}/${newMessageRef.key}`)
            update(messageRef, { status: "delivered" })
          }
        })

        // Clean up listener after a reasonable time
        setTimeout(() => deliveryListener(), 30000)

        // Update both users' contact lists with last message info
        const messageText = text || (fileName ? `📎 ${fileName}` : "File")
        const timestamp = Date.now()

        // Update sender's contact list
        const senderContactRef = ref(database, `contacts/${currentUser.uid}/${selectedContact.id}`)
        await update(senderContactRef, {
          lastMessage: messageText,
          timestamp,
        })

        // Update receiver's contact list and increment unread count
        const receiverContactRef = ref(database, `contacts/${selectedContact.id}/${currentUser.uid}`)
        const receiverContactSnapshot = await get(receiverContactRef)
        const currentUnread = receiverContactSnapshot.exists() ? receiverContactSnapshot.val().unread || 0 : 0

        await update(receiverContactRef, {
          lastMessage: messageText,
          timestamp,
          unread: currentUnread + 1,
        })
      } catch (error) {
        console.error("Failed to send message:", error)
        setError("Failed to send message")
        throw error
      }
    },
    [currentUser, selectedContact, database, messages],
  )

  const addReaction = useCallback(
    async (messageId: string, emoji: string, contactId: string): Promise<void> => {
      if (!currentUser) return

      try {
        const chatId = getChatId(currentUser.uid, contactId)
        const messageRef = ref(database, `messages/${chatId}/${messageId}`)
        const messageSnapshot = await get(messageRef)

        if (!messageSnapshot.exists()) return

        const messageData = messageSnapshot.val()
        const reactions = messageData.reactions || {}

        if (!reactions[emoji]) {
          reactions[emoji] = {
            users: [],
            userNames: {},
          }
        }

        const userIndex = reactions[emoji].users.indexOf(currentUser.uid)

        if (userIndex > -1) {
          // Remove reaction
          reactions[emoji].users.splice(userIndex, 1)
          delete reactions[emoji].userNames[currentUser.uid]

          // Remove emoji if no users
          if (reactions[emoji].users.length === 0) {
            delete reactions[emoji]
          }
        } else {
          // Add reaction
          reactions[emoji].users.push(currentUser.uid)
          reactions[emoji].userNames[currentUser.uid] = userProfile?.name || "Unknown"
        }

        await update(messageRef, { reactions })
      } catch (error) {
        console.error("Failed to add reaction:", error)
        setError("Failed to add reaction")
      }
    },
    [currentUser, database, userProfile],
  )

  const deleteMessage = useCallback(
    async (messageId: string, contactId: string): Promise<void> => {
      if (!currentUser) return

      try {
        const chatId = getChatId(currentUser.uid, contactId)
        const messageRef = ref(database, `messages/${chatId}/${messageId}`)

        // Get the original message data before deletion
        const messageSnapshot = await get(messageRef)
        if (!messageSnapshot.exists()) return

        const messageData = messageSnapshot.val()

        // Update message to mark as deleted while preserving original data
        await update(messageRef, {
          text: "",
          fileUrl: "",
          fileType: "",
          fileName: "",
          isDeleted: true,
          deletedAt: Date.now(),
          deletedBy: currentUser.uid,
          originalText: messageData.text || "",
          originalFileUrl: messageData.fileUrl || "",
          originalFileType: messageData.fileType || "",
          originalFileName: messageData.fileName || "",
        })
      } catch (error) {
        console.error("Failed to delete message:", error)
        setError("Failed to delete message")
      }
    },
    [currentUser, database],
  )

  // Cleanup typing timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(typingTimeoutRef.current).forEach((timeout) => {
        clearTimeout(timeout)
      })
    }
  }, [])

  const value: ChatContextType = {
    selectedContact,
    setSelectedContact,
    messages,
    sendMessage,
    addReaction,
    deleteMessage,
    contacts,
    setContacts,
    error,
    setError,
    pendingMessages,
    setPendingMessages,
    typingUsers,
    setTyping,
    startTyping,
    stopTyping,
    setMessages,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}
