"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  Send,
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  Settings,
  LogOut,
  User,
  X,
  ReplyIcon,
  Users,
  Crown,
  Archive,
  ChevronDown,
  Mic,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useChat } from "@/contexts/chat-context"
import { useTheme } from "@/contexts/theme-context"
import { ref, set, get, onValue, query, orderByChild, equalTo, push, update } from "firebase/database"
import { database } from "@/lib/firebase"
import { formatDistanceToNow } from "date-fns"
import ContactProfileDrawer from "./contact-profile-drawer"
import UserProfileDrawer from "./user-profile-drawer"
import FileUpload from "./file-upload"
import MessageFilePreview from "./message-file-preview"
import DragDropZone from "./drag-drop-zone"
import MessageReactions from "./message-reactions"
import TypingIndicator from "./typing-indicator"
import UnreadBadge from "./unread-badge"
import GroupCreationModal from "./group-creation-modal"
import GroupProfileDrawer from "./group-profile-drawer"
import ChatContextMenu from "./chat-context-menu"
import VoiceRecorder from "./voice-recorder"
import MessageContextMenu from "./message-context-menu"
import { useWebRTC } from '@/hooks/use-webrtc'
import VideoCallModal from './video-call-modal'

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

interface Message {
  id: string
  text: string
  senderUid: string
  receiverUid?: string
  groupId?: string
  timestamp: number
  status: string
  sender: "user" | "contact"
  senderName?: string
  isTemp?: boolean
  fileUrl?: string
  fileType?: string
  fileName?: string
  replyToId?: string
  replyToText?: string
  reactions?: { [emoji: string]: { users: string[]; userNames: { [uid: string]: string } } }
  isDeleted?: boolean
  duration?: number
}

export default function ChatInterface() {
  const { currentUser, userProfile, logout } = useAuth()
  const { currentTheme } = useTheme()
  const {
    selectedContact,
    setSelectedContact,
    messages,
    setMessages,
    sendMessage,
    addReaction,
    deleteMessage,
    contacts,
    setContacts,
    typingUsers,
    startTyping,
    stopTyping,
  } = useChat()
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAddContact, setShowAddContact] = useState(false)
  const [newContactEmail, setNewContactEmail] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const [showContactProfile, setShowContactProfile] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Message | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [activeTab, setActiveTab] = useState<"chats" | "groups">("chats")
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [showGroupCreation, setShowGroupCreation] = useState(false)
  const [showGroupProfile, setShowGroupProfile] = useState(false)
  const [groupMessages, setGroupMessages] = useState<{ [groupId: string]: Message[] }>({})
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    message: Message | null
  }>({
    visible: false,
    x: 0,
    y: 0,
    message: null,
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const { toast } = useToast()

  const isUrlUpdatingRef = useRef(false)
  const currentContactIdRef = useRef<string | null>(null)

  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [initialViewportHeight, setInitialViewportHeight] = useState(0)

  const [swipeState, setSwipeState] = useState<{
    messageId: string | null
    startX: number
    currentX: number
    isActive: boolean
  }>({
    messageId: null,
    startX: 0,
    currentX: 0,
    isActive: false,
  })
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)

  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ x: 0, y: 0 })

  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false)

  const [chatContextMenu, setChatContextMenu] = useState<{
    visible: boolean
    x: number
    y: number
    contact: Contact | null
    group: Group | null
  }>({
    visible: false,
    x: 0,
    y: 0,
    contact: null,
    group: null,
  })
  const [pinnedChats, setPinnedChats] = useState<Set<string>>(new Set())
  const [archivedChats, setArchivedChats] = useState<Set<string>>(new Set())
  const [showArchivedChats, setShowArchivedChats] = useState(false)
  
  const { makeCall, answerCall, hangUp, localStream, remoteStream, callStatus, incomingCall, isMuted, toggleMute, isSharingScreen, startScreenShare, stopScreenShare, devices } = useWebRTC(selectedContact?.uid || null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showEmojiPicker) return
      const target = event.target as HTMLElement
      if (!target.closest(".emoji-picker") && !target.closest("[data-emoji-trigger]")) {
        setShowEmojiPicker(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [showEmojiPicker])

  const totalUnreadChats = contacts
    .filter((contact) => !archivedChats.has(contact.id))
    .reduce((total, contact) => total + (contact.unread || 0), 0)
  const totalUnreadGroups = groups
    .filter((group) => !archivedChats.has(group.id))
    .reduce((total, group) => total + (group.unread || 0), 0)

  const archivedUnreadChats = contacts
    .filter((contact) => archivedChats.has(contact.id))
    .reduce((total, contact) => total + (contact.unread || 0), 0)
  const archivedUnreadGroups = groups
    .filter((group) => archivedChats.has(group.id))
    .reduce((total, group) => total + (group.unread || 0), 0)
  const totalArchivedUnread = archivedUnreadChats + archivedUnreadGroups

  useEffect(() => {
    if ((selectedContact || selectedGroup) && messageInputRef.current) {
      setTimeout(() => {
        messageInputRef.current?.focus()
      }, 100)
    }
  }, [selectedContact, selectedGroup])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && (selectedContact || selectedGroup)) {
        setSelectedContact(null)
        setSelectedGroup(null)
        const newUrl = window.location.pathname
        window.history.pushState({}, "", newUrl)
        document.title = "Chit Chat"
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedContact, selectedGroup, setSelectedContact])

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const urlParams = new URLSearchParams(window.location.search)
      const chatId = urlParams.get("chat")
      const groupId = urlParams.get("group")

      if (chatId && contacts.length > 0) {
        const contact = contacts.find((c) => c.id === chatId)
        if (contact && currentContactIdRef.current !== chatId) {
          setSelectedContact(contact)
          setSelectedGroup(null)
          currentContactIdRef.current = chatId
        }
      } else if (groupId && groups.length > 0) {
        const group = groups.find((g) => g.id === groupId)
        if (group) {
          setSelectedGroup(group)
          setSelectedContact(null)
          currentContactIdRef.current = groupId
        }
      } else if (currentContactIdRef.current !== null) {
        setSelectedContact(null)
        setSelectedGroup(null)
        currentContactIdRef.current = null
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [contacts, groups, setSelectedContact])

  useEffect(() => {
    if (isUrlUpdatingRef.current) return

    if (selectedContact) {
      if (currentContactIdRef.current !== selectedContact.id) {
        isUrlUpdatingRef.current = true
        currentContactIdRef.current = selectedContact.id

        const newUrl = `${window.location.pathname}?chat=${selectedContact.id}`
        window.history.pushState({ chatId: selectedContact.id }, "", newUrl)
        document.title = `Chat with ${selectedContact.name} - Chit Chat`

        setTimeout(() => {
          isUrlUpdatingRef.current = false
        }, 0)
      }
    } else if (selectedGroup) {
      if (currentContactIdRef.current !== selectedGroup.id) {
        isUrlUpdatingRef.current = true
        currentContactIdRef.current = selectedGroup.id

        const newUrl = `${window.location.pathname}?group=${selectedGroup.id}`
        window.history.pushState({ groupId: selectedGroup.id }, "", newUrl)
        document.title = `${selectedGroup.name} - Chit Chat`

        setTimeout(() => {
          isUrlUpdatingRef.current = false
        }, 0)
      }
    } else if (currentContactIdRef.current !== null) {
      isUrlUpdatingRef.current = true
      currentContactIdRef.current = null

      const newUrl = window.location.pathname
      if (window.location.search) {
        window.history.pushState({}, "", newUrl)
      }
      document.title = "Chit Chat"

      setTimeout(() => {
        isUrlUpdatingRef.current = false
      }, 0)
    }
  }, [selectedContact, selectedGroup])

  const handleBackNavigation = useCallback(() => {
    if (selectedContact || selectedGroup) {
      setSelectedContact(null)
      setSelectedGroup(null)
      const newUrl = window.location.pathname
      window.history.pushState({}, "", newUrl)
      document.title = "Chit Chat"
    }
  }, [selectedContact, selectedGroup, setSelectedContact])

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (!isMobile) return

    const initHeight = window.innerHeight
    setInitialViewportHeight(initHeight)
    setViewportHeight(initHeight)

    let keyboardTimeout: NodeJS.Timeout
    let resizeTimeout: NodeJS.Timeout
    let isAdjusting = false

    const handleViewportChange = () => {
      if (isAdjusting) return

      const viewport = window.visualViewport
      if (!viewport) return

      const currentHeight = viewport.height
      const heightDiff = initialViewportHeight - currentHeight
      const isKeyboardOpen = heightDiff > 150

      setViewportHeight(currentHeight)
      setKeyboardHeight(heightDiff)
      setIsKeyboardVisible(isKeyboardOpen)

      if (keyboardTimeout) clearTimeout(keyboardTimeout)

      keyboardTimeout = setTimeout(() => {
        if (isAdjusting) return
        isAdjusting = true

        requestAnimationFrame(() => {
          const chatContainer = chatContainerRef.current
          const inputContainer = inputContainerRef.current
          const chatHeader = document.querySelector("[data-chat-header]") as HTMLElement

          if (!chatContainer || !inputContainer) {
            isAdjusting = false
            return
          }

          const headerHeight = chatHeader?.offsetHeight || 73
          const inputHeight = inputContainer.offsetHeight
          const replyHeight = document.querySelector(".reply-preview")?.clientHeight || 0

          if (isKeyboardOpen) {
            const availableHeight = currentHeight - headerHeight - inputHeight - replyHeight - 10
            const transitionStyle = "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)"

            chatContainer.style.transition = transitionStyle
            chatContainer.style.height = `${Math.max(availableHeight, 200)}px`
            chatContainer.style.maxHeight = `${availableHeight}px`
            chatContainer.style.overflowY = "auto"
            chatContainer.style.paddingBottom = "8px"

            inputContainer.style.transition = transitionStyle
            inputContainer.style.position = "fixed"
            inputContainer.style.bottom = "0"
            inputContainer.style.left = "0"
            inputContainer.style.right = "0"
            inputContainer.style.zIndex = "1000"
            inputContainer.style.backgroundColor = "hsl(var(--card))"
            inputContainer.style.borderTop = "1px solid hsl(var(--border))"
            inputContainer.style.boxShadow = "0 -4px 12px rgba(0, 0, 0, 0.1)"

            if (chatHeader) {
              chatHeader.style.transition = transitionStyle
              chatHeader.style.position = "fixed"
              chatHeader.style.top = "0"
              chatHeader.style.left = "0"
              chatHeader.style.right = "0"
              chatHeader.style.zIndex = "999"
              chatHeader.style.backgroundColor = "hsl(var(--card))"
              chatHeader.style.borderBottom = "1px solid hsl(var(--border))"
              chatHeader.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)"
            }

            chatContainer.style.paddingTop = `${headerHeight + 10}px`
            chatContainer.style.marginTop = "0"

            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end",
              })
            }, 350)
          } else {
            const resetTransition = "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)"

            chatContainer.style.transition = resetTransition
            chatContainer.style.height = ""
            chatContainer.style.maxHeight = ""
            chatContainer.style.overflowY = ""
            chatContainer.style.paddingBottom = ""
            chatContainer.style.paddingTop = ""
            chatContainer.style.marginTop = ""

            inputContainer.style.transition = resetTransition
            inputContainer.style.position = ""
            inputContainer.style.bottom = ""
            inputContainer.style.left = ""
            inputContainer.style.right = ""
            inputContainer.style.zIndex = ""
            inputContainer.style.backgroundColor = ""
            inputContainer.style.borderTop = ""
            inputContainer.style.boxShadow = ""

            if (chatHeader) {
              chatHeader.style.transition = resetTransition
              chatHeader.style.position = ""
              chatHeader.style.top = ""
              chatHeader.style.left = ""
              chatHeader.style.right = ""
              chatHeader.style.zIndex = ""
              chatHeader.style.backgroundColor = ""
              chatHeader.style.borderBottom = ""
              chatHeader.style.boxShadow = ""
            }

            setTimeout(() => {
              if (chatContainer) {
                chatContainer.style.height = "auto"
                chatContainer.style.minHeight = "100%"
                chatContainer.style.display = "flex"
                chatContainer.style.flexDirection = "column"
              }
            }, 300)
          }

          isAdjusting = false
        })
      }, 50)
    }

    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)

      resizeTimeout = setTimeout(() => {
        const newHeight = window.innerHeight
        setInitialViewportHeight(newHeight)
        setViewportHeight(newHeight)

        if (!isKeyboardVisible) {
          const chatContainer = chatContainerRef.current
          const inputContainer = inputContainerRef.current
          const chatHeader = document.querySelector("[data-chat-header]") as HTMLElement

          if (chatContainer) {
            chatContainer.style.height = ""
            chatContainer.style.maxHeight = ""
            chatContainer.style.paddingTop = ""
            chatContainer.style.marginTop = ""
            chatContainer.style.minHeight = "100%"
          }

          if (inputContainer) {
            inputContainer.style.position = ""
            inputContainer.style.bottom = ""
            inputContainer.style.left = ""
            inputContainer.style.right = ""
            inputContainer.style.zIndex = ""
          }

          if (chatHeader) {
            chatHeader.style.position = ""
            chatHeader.style.top = ""
            chatHeader.style.left = ""
            chatHeader.style.right = ""
            chatHeader.style.zIndex = ""
          }
        }
      }, 100)
    }

    const handleInputFocus = () => {
      setTimeout(() => {
        if (messageInputRef.current && isKeyboardVisible) {
          messageInputRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          })
        }
      }, 400)
    }

    const handleInputBlur = () => {
      setTimeout(() => {
        if (!isKeyboardVisible) {
          const chatContainer = chatContainerRef.current
          const inputContainer = inputContainerRef.current
          const chatHeader = document.querySelector("[data-chat-header]") as HTMLElement

          if (chatContainer) {
            chatContainer.style.height = ""
            chatContainer.style.maxHeight = ""
            chatContainer.style.paddingTop = ""
            chatContainer.style.marginTop = ""
            chatContainer.style.minHeight = "100%"
          }

          if (inputContainer) {
            inputContainer.style.position = ""
            inputContainer.style.bottom = ""
            inputContainer.style.zIndex = ""
          }

          if (chatHeader) {
            chatHeader.style.position = ""
            chatHeader.style.top = ""
            chatHeader.style.zIndex = ""
          }
        }
      }, 200)
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportChange, { passive: true })
    }

    window.addEventListener("resize", handleResize, { passive: true })

    const messageInput = messageInputRef.current
    if (messageInput) {
      messageInput.addEventListener("focus", handleInputFocus, { passive: true })
      messageInput.addEventListener("blur", handleInputBlur, { passive: true })
    }

    return () => {
      if (keyboardTimeout) clearTimeout(keyboardTimeout)
      if (resizeTimeout) clearTimeout(resizeTimeout)

      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportChange)
      }

      window.removeEventListener("resize", handleResize)

      if (messageInput) {
        messageInput.removeEventListener("focus", handleInputFocus)
        messageInput.removeEventListener("blur", handleInputBlur)
      }
    }
  }, [isMobile, initialViewportHeight, isKeyboardVisible])

  useEffect(() => {
    if (!currentUser) return

    const groupsRef = ref(database, "groups")
    const unsubscribe = onValue(groupsRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setGroups([])
        return
      }

      try {
        const groupsData = snapshot.val()
        const groupsList = await Promise.all(
          Object.keys(groupsData)
            .map(async (groupId) => {
              const groupData = groupsData[groupId]
              if (groupData.members && groupData.members[currentUser.uid]) {
                const groupUnreadRef = ref(database, `groupUnread/${groupId}/${currentUser.uid}`)
                const unreadSnapshot = await get(groupUnreadRef)
                const unreadCount = unreadSnapshot.exists() ? unreadSnapshot.val().count || 0 : 0

                return {
                  id: groupId,
                  ...groupData,
                  unread: unreadCount,
                }
              }
              return null
            })
            .filter(Boolean),
        )

        const validGroups = (await Promise.all(groupsList)).filter(Boolean) as Group[]
        validGroups.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        setGroups(validGroups)
      } catch (error) {
        console.error("Error loading groups:", error)
        toast({
          title: "Error",
          description: "Failed to load groups",
          variant: "destructive",
        })
      }
    })

    return () => unsubscribe()
  }, [currentUser, toast])

  useEffect(() => {
    if (!currentUser) return

    const contactsRef = ref(database, `contacts/${currentUser.uid}`)
    const unsubscribe = onValue(contactsRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setContacts([])
        return
      }

      try {
        const contactsData = snapshot.val()
        const contactsList = await Promise.all(
          Object.keys(contactsData).map(async (contactUid) => {
            const contactData = contactsData[contactUid]
            const userRef = ref(database, `users/${contactUid}`)
            const userSnapshot = await get(userRef)

            if (userSnapshot.exists()) {
              const userData = userSnapshot.val()
              const unreadCount = Math.max(0, contactData.unread || 0)

              return {
                id: contactUid,
                uid: contactUid,
                name: contactData.name || userData.name || userData.email?.split("@")[0] || "Unknown",
                email: userData.email || "",
                avatar: userData.avatar || "",
                lastMessage: contactData.lastMessage || "",
                timestamp: contactData.timestamp || 0,
                unread: unreadCount,
                isOnline: userData.isOnline || false,
                lastSeen: userData.lastSeen || 0,
              }
            }
            return null
          }),
        )

        const validContacts = contactsList.filter(Boolean) as Contact[]
        validContacts.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        setContacts(validContacts)
      } catch (error) {
        console.error("Error loading contacts:", error)
        toast({
          title: "Error",
          description: "Failed to load contacts",
          variant: "destructive",
        })
      }
    })

    return () => unsubscribe()
  }, [currentUser, setContacts, toast])

  useEffect(() => {
    if (!currentUser || !selectedContact) return

    const chatRef = ref(database, `chats/${currentUser.uid}/${selectedContact.uid}`)
    const unsubscribe = onValue(chatRef, (snapshot) => {
      if (!snapshot.exists()) {
        setMessages((prevMessages) => ({ ...prevMessages, [selectedContact.id]: [] }))
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

        messagesList.sort((a, b) => a.timestamp - b.timestamp)
        setMessages((prevMessages) => ({ ...prevMessages, [selectedContact.id]: messagesList }))
      } catch (err) {
        console.error("Error loading messages:", err)
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        })
      }
    })

    const markAsRead = async () => {
      try {
        const unreadRef = query(
          ref(database, `chats/${currentUser.uid}/${selectedContact.uid}`),
          orderByChild("status"),
          equalTo("unread"),
        )
        const unreadSnapshot = await get(unreadRef)

        if (unreadSnapshot.exists()) {
          const updates: { [key: string]: any } = {}
          unreadSnapshot.forEach((childSnapshot) => {
            updates[`${childSnapshot.key}/status`] = "delivered"
          })

          await update(ref(database, `chats/${currentUser.uid}/${selectedContact.uid}`), updates)
        }

        const contactRef = ref(database, `contacts/${currentUser.uid}/${selectedContact.id}`)
        await update(contactRef, { unread: 0 })

        setContacts((prevContacts) =>
          prevContacts.map((contact) => {
            if (contact.id === selectedContact.id) {
              return { ...contact, unread: 0 }
            }
            return contact
          }),
        )
      } catch (err) {
        console.error("Error marking messages as read:", err)
        toast({
          title: "Error",
          description: "Failed to mark messages as read",
          variant: "destructive",
        })
      }
    }

    markAsRead()

    return () => unsubscribe()
  }, [currentUser, selectedContact, toast, setMessages, setContacts])

  useEffect(() => {
    if (!currentUser || !selectedGroup) return

    const groupMessagesRef = ref(database, `groupMessages/${selectedGroup.id}`)
    const unsubscribe = onValue(groupMessagesRef, async (snapshot) => {
      if (!snapshot.exists()) {
        setGroupMessages((prev) => ({ ...prev, [selectedGroup.id]: [] }))
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

        messagesList.sort((a, b) => a.timestamp - b.timestamp)
        setGroupMessages((prev) => ({ ...prev, [selectedGroup.id]: messagesList }))

        const groupUnreadRef = ref(database, `groupUnread/${selectedGroup.id}/${currentUser.uid}`)
        await set(groupUnreadRef, { count: 0, lastRead: Date.now() })

        setGroups((prevGroups) =>
          prevGroups.map((group) => {
            if (group.id === selectedGroup.id) {
              return { ...group, unread: 0 }
            }
            return group
          }),
        )
      } catch (err) {
        console.error("Error loading group messages:", err)
        toast({
          title: "Error",
          description: "Failed to load group messages",
          variant: "destructive",
        })
      }
    })

    return () => unsubscribe()
  }, [currentUser, selectedGroup, toast])

  useEffect(() => {
    if (isMobile && (selectedContact || selectedGroup)) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        })
      }, 100)
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, groupMessages, selectedContact, selectedGroup, isMobile])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      setNewMessage(value)

      if (selectedContact && value.trim()) {
        startTyping(selectedContact.uid)

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current)
        }

        typingTimeoutRef.current = setTimeout(() => {
          if (selectedContact) {
            stopTyping(selectedContact.uid)
          }
        }, 800)
      } else if (selectedContact) {
        stopTyping(selectedContact.uid)
      }
    },
    [selectedContact, startTyping, stopTyping],
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, message: Message) => {
      if (!isMobile || message.isDeleted) return

      if (document.activeElement === messageInputRef.current) return

      const touch = e.touches[0]
      setSwipeState({
        messageId: message.id,
        startX: touch.clientX,
        currentX: touch.clientX,
        isActive: true,
      })

      e.preventDefault()
    },
    [isMobile],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent, message: Message) => {
      if (!isMobile || !swipeState.isActive || swipeState.messageId !== message.id) return

      if (document.activeElement === messageInputRef.current) return

      const touch = e.touches[0]
      const deltaX = touch.clientX - swipeState.startX

      if (deltaX > 0 && deltaX <= 120) {
        setSwipeState((prev) => ({
          ...prev,
          currentX: touch.clientX,
        }))

        e.preventDefault()
      }
    },
    [isMobile, swipeState.isActive, swipeState.messageId, swipeState.startX],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent, message: Message) => {
      if (!isMobile || !swipeState.isActive || swipeState.messageId !== message.id) return

      const deltaX = swipeState.currentX - swipeState.startX

      if (deltaX > 60) {
        setReplyingTo(message)

        if ("vibrate" in navigator) {
          navigator.vibrate([50])
        }

        setTimeout(() => {
          messageInputRef.current?.focus()
        }, 100)
      }

      setSwipeState({
        messageId: null,
        startX: 0,
        currentX: 0,
        isActive: false,
      })
    },
    [isMobile, swipeState],
  )

  const getSwipeTransform = useCallback(
    (messageId: string) => {
      if (!isMobile || swipeState.messageId !== messageId || !swipeState.isActive) return ""

      const deltaX = Math.max(0, Math.min(swipeState.currentX - swipeState.startX, 120))
      return `translateX(${deltaX}px)`
    },
    [isMobile, swipeState],
  )

  const getSwipeOpacity = useCallback(
    (messageId: string) => {
      if (!isMobile || swipeState.messageId !== messageId || !swipeState.isActive) return 0

      const deltaX = Math.max(0, Math.min(swipeState.currentX - swipeState.startX, 120))
      return Math.min(deltaX / 60, 1)
    },
    [isMobile, swipeState],
  )

  const getReplyIndicatorScale = useCallback(
    (messageId: string) => {
      if (!isMobile || swipeState.messageId !== messageId || !swipeState.isActive) return 0

      const deltaX = Math.max(0, Math.min(swipeState.currentX - swipeState.startX, 120))
      return Math.min(deltaX / 80, 1)
    },
    [isMobile, swipeState],
  )

  const handleMessageAction = (message: Message) => {
    setReplyingTo(message)
    messageInputRef.current?.focus()
  }

  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newMessage.trim() && !replyingTo) return
      if ((!selectedContact && !selectedGroup) || isSending) return

      const messageText = newMessage.trim()
      setNewMessage("")
      setIsSending(true)

      if (isMobile && messageInputRef.current) {
        messageInputRef.current.focus()
      }

      try {
        if (selectedGroup) {
          const groupMessagesRef = ref(database, `groupMessages/${selectedGroup.id}`)
          const newMessageRef = push(groupMessagesRef)

          const message = {
            text: messageText,
            senderUid: currentUser!.uid,
            senderName: userProfile?.name || currentUser!.email?.split("@")[0] || "Unknown",
            groupId: selectedGroup.id,
            timestamp: {
              ".sv": "timestamp",
            },
            clientTimestamp: Date.now(),
            status: "sent",
            reactions: {},
          }

          if (replyingTo) {
            message.replyToId = replyingTo.id
            message.replyToText = replyingTo.text
          }

          await set(newMessageRef, message)

          const groupRef = ref(database, `groups/${selectedGroup.id}`)
          await update(groupRef, {
            lastMessage: messageText,
            timestamp: {
              ".sv": "timestamp",
            },
          })

          const groupMembers = Object.keys(selectedGroup.members)
          const unreadPromises = groupMembers
            .filter((memberId) => memberId !== currentUser!.uid)
            .map(async (memberId) => {
              const memberUnreadRef = ref(database, `groupUnread/${selectedGroup.id}/${memberId}`)
              const currentUnreadSnapshot = await get(memberUnreadRef)
              const currentCount = currentUnreadSnapshot.exists() ? currentUnreadSnapshot.val().count || 0 : 0

              return set(memberUnreadRef, {
                count: currentCount + 1,
                lastMessage: messageText,
                timestamp: Date.now(),
              })
            })

          await Promise.all(unreadPromises)
        } else if (selectedContact) {
          await sendMessage(messageText, replyingTo?.id, undefined, undefined, undefined)
          if (selectedContact) {
            stopTyping(selectedContact.uid)
          }
        }

        setReplyingTo(null)

        if (isMobile && messageInputRef.current) {
          requestAnimationFrame(() => {
            if (messageInputRef.current) {
              messageInputRef.current.focus()
            }
          })
        } else {
          setTimeout(() => {
            messageInputRef.current?.focus()
          }, 50)
        }
      } catch (error) {
        console.error("Failed to send message:", error)
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        })
        setNewMessage(messageText)
      } finally {
        setIsSending(false)
      }
    },
    [
      newMessage,
      selectedContact,
      selectedGroup,
      sendMessage,
      replyingTo,
      isSending,
      toast,
      stopTyping,
      currentUser,
      userProfile,
      database,
      isMobile,
    ],
  )

  const handleAddContact = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!newContactEmail.trim() || !currentUser) return

    try {
      const usersRef = ref(database, "users")
      const userQuery = query(usersRef, orderByChild("email"), equalTo(newContactEmail.trim()))
      const snapshot = await get(userQuery)

      if (!snapshot.exists()) {
        toast({
          title: "User not found",
          description: "No user found with this email address",
          variant: "destructive",
        })
        return
      }

      const userData = Object.values(snapshot.val())[0] as any
      const contactUid = userData.uid

      if (contactUid === currentUser.uid) {
        toast({
          title: "Invalid contact",
          description: "You cannot add yourself as a contact",
          variant: "destructive",
        })
        return
      }

      const existingContactRef = ref(database, `contacts/${currentUser.uid}/${contactUid}`)
      const existingSnapshot = await get(existingContactRef)

      if (existingSnapshot.exists()) {
        toast({
          title: "Contact exists",
          description: "This contact is already in your list",
        })
        return
      }

      await set(existingContactRef, {
        name: userData.name || userData.email?.split("@")[0] || "Unknown",
        email: userData.email,
        addedAt: Date.now(),
        lastMessage: "",
        timestamp: 0,
        unread: 0,
      })

      const reverseContactRef = ref(database, `contacts/${contactUid}/${currentUser.uid}`)
      await set(reverseContactRef, {
        name: userProfile?.name || currentUser.email?.split("@")[0] || "Unknown",
        email: currentUser.email,
        addedAt: Date.now(),
        lastMessage: "",
        timestamp: 0,
        unread: 0,
      })

      toast({
        title: "Contact added",
        description: `${userData.name || userData.email} has been added to your contacts`,
      })

      setNewContactEmail("")
      setShowAddContact(false)
    } catch (error) {
      console.error("Error adding contact:", error)
      toast({
        title: "Error",
        description: "Failed to add contact. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (fileUrl: string, fileType: string, fileName: string) => {
    if (!selectedContact && !selectedGroup) return

    try {
      if (selectedGroup) {
        const groupMessagesRef = ref(database, `groupMessages/${selectedGroup.id}`)
        const newMessageRef = push(groupMessagesRef)

        const message = {
          text: "",
          senderUid: currentUser!.uid,
          senderName: userProfile?.name || currentUser!.email?.split("@")[0] || "Unknown",
          groupId: selectedGroup.id,
          timestamp: {
            ".sv": "timestamp",
          },
          clientTimestamp: Date.now(),
          status: "sent",
          fileUrl,
          fileType,
          fileName,
          reactions: {},
        }

        await set(newMessageRef, message)

        const groupRef = ref(database, `groups/${selectedGroup.id}`)
        await update(groupRef, {
          lastMessage: `📎 ${fileName}`,
          timestamp: {
            ".sv": "timestamp",
          },
        })

        const groupMembers = Object.keys(selectedGroup.members)
        const unreadPromises = groupMembers
          .filter((memberId) => memberId !== currentUser!.uid)
          .map(async (memberId) => {
            const memberUnreadRef = ref(database, `groupUnread/${selectedGroup.id}/${memberId}`)
            const currentUnreadSnapshot = await get(memberUnreadRef)
            const currentCount = currentUnreadSnapshot.exists() ? currentUnreadSnapshot.val().count || 0 : 0

            return set(memberUnreadRef, {
              count: currentCount + 1,
              lastMessage: `📎 ${fileName}`,
              timestamp: Date.now(),
            })
          })

        await Promise.all(unreadPromises)
      } else {
        await sendMessage("", undefined, fileUrl, fileType, fileName)
      }

      toast({
        title: "File sent",
        description: "Your file has been sent successfully",
      })
    } catch (error) {
      console.error("Failed to send file:", error)
      toast({
        title: "Error",
        description: "Failed to send file. Please try again.",
      })
    }
  }

  const handleFileDrop = (files: File[]) => {
    console.log("Files dropped:", files)
  }

  const handleDeleteMessage = async (message: Message) => {
    if (!selectedContact && !selectedGroup) return

    try {
      if (selectedGroup) {
        const messageRef = ref(database, `groupMessages/${selectedGroup.id}/${message.id}`)
        await update(messageRef, {
          text: "",
          fileUrl: "",
          fileType: "",
          fileName: "",
          isDeleted: true,
          deletedAt: Date.now(),
          deletedBy: currentUser!.uid,
        })
      } else if (selectedContact) {
        await deleteMessage(message.id, selectedContact.uid)
      }

      toast({
        title: "Message deleted",
        description: "Your message has been deleted",
      })
    } catch (error) {
      console.error("Failed to delete message:", error)
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
      })
    }
  }

  const handleMessageContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      message,
    })
  }

  const handleCopyMessage = (message: Message) => {
    if (message.text) {
      navigator.clipboard.writeText(message.text)
      toast({
        title: "Copied",
        description: "Message copied to clipboard",
      })
    }
  }

  const handleReaction = async (message: Message, emoji: string) => {
    if (!selectedContact && !selectedGroup) return

    try {
      if (selectedGroup) {
        const messageRef = ref(database, `groupMessages/${selectedGroup.id}/${message.id}`)
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

        const userIndex = reactions[emoji].users.indexOf(currentUser!.uid)

        if (userIndex > -1) {
          reactions[emoji].users.splice(userIndex, 1)
          delete reactions[emoji].userNames[currentUser!.uid]

          if (reactions[emoji].users.length === 0) {
            delete reactions[emoji]
          }
        } else {
          reactions[emoji].users.push(currentUser!.uid)
          reactions[emoji].userNames[currentUser!.uid] = userProfile?.name || "Unknown"
        }

        await update(messageRef, { reactions })
      } else if (selectedContact) {
        await addReaction(message.id, emoji, selectedContact.uid)
      }
    } catch (error) {
      console.error("Failed to add reaction:", error)
      toast({
        title: "Error",
        description: "Failed to add reaction. Please try again.",
      })
    }
  }

  const handleReactionClick = async (messageId: string, emoji: string) => {
    if (!selectedContact && !selectedGroup) return

    try {
      if (selectedGroup) {
        const messageRef = ref(database, `groupMessages/${selectedGroup.id}/${messageId}`)
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

        const userIndex = reactions[emoji].users.indexOf(currentUser!.uid)

        if (userIndex > -1) {
          reactions[emoji].users.splice(userIndex, 1)
          delete reactions[emoji].userNames[currentUser!.uid]

          if (reactions[emoji].users.length === 0) {
            delete reactions[emoji]
          }
        } else {
          reactions[emoji].users.push(currentUser!.uid)
          reactions[emoji].userNames[currentUser!.uid] = userProfile?.name || "Unknown"
        }

        await update(messageRef, { reactions })
      } else if (selectedContact) {
        await addReaction(messageId, emoji, selectedContact.uid)
      }
    } catch (error) {
      console.error("Failed to toggle reaction:", error)
      toast({
        title: "Error",
        description: "Failed to toggle reaction. Please try again.",
      })
    }
  }

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredGroups = groups.filter((group) => group.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const currentMessages = selectedContact
    ? messages[selectedContact.id] || []
    : selectedGroup
      ? groupMessages[selectedGroup.id] || []
      : []

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString()
    }
  }

  const getGroupAvatar = (group: Group) => {
    if (group.avatar) return group.avatar

    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
    ]
    const colorIndex = group.name.charCodeAt(0) % colors.length
    return colors[colorIndex]
  }

  const getMessageBubbleStyle = (sender: "user" | "contact", isDeleted = false) => {
    if (isDeleted) {
      const deletedBg = currentTheme.colors.muted ? `hsl(${currentTheme.colors.muted})` : "hsl(var(--muted))"
      const deletedText = currentTheme.colors.mutedForeground
        ? `hsl(${currentTheme.colors.mutedForeground})`
        : `hsl(var(--muted-foreground))`
      return `italic border border-opacity-50`
    }

    const baseClasses = "relative transition-all duration-300 ease-in-out"
    const outlineClasses = "ring-2 ring-offset-2 ring-offset-transparent"

    if (currentTheme.colors.messageSent && currentTheme.colors.messageReceived) {
      const ringColor =
        sender === "user" ? currentTheme.colors.primary || "220 100% 50%" : currentTheme.colors.accent || "210 100% 50%"

      return `${baseClasses} ${outlineClasses} hover:ring-[hsl(${ringColor})] hover:shadow-lg hover:shadow-[hsl(${ringColor})/20%]`
    }

    return sender === "user"
      ? `${baseClasses} bg-white text-black ${outlineClasses} hover:ring-blue-500 hover:shadow-lg hover:shadow-blue-500/20`
      : `${baseClasses} bg-gray-800 text-white ${outlineClasses} hover:ring-blue-400 hover:shadow-lg hover:shadow-blue-400/20`
  }

  const getTabStyles = (isActive: boolean) => {
    const baseClasses = "transition-all duration-200 ease-in-out relative"

    if (isActive) {
      const activeColor = currentTheme.colors.primary ? `hsl(${currentTheme.colors.primary})` : "hsl(var(--primary))"
      const activeBg = currentTheme.colors.accent ? `hsl(${currentTheme.colors.accent}/20%)` : "hsl(var(--accent)/20%)"

      return `${baseClasses} font-semibold border-b-2 border-[${activeColor}] bg-[${activeBg}] text-[${activeColor}]`
    }

    return `${baseClasses} hover:bg-[hsl(var(--accent)/10%)] text-[hsl(var(--muted-foreground))]`
  }

  const handleChatContextMenu = (e: React.MouseEvent, contact?: Contact, group?: Group) => {
    e.preventDefault()
    setChatContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      contact: contact || null,
      group: group || null,
    })
  }

  const handlePinChat = async (chatId: string, isGroup = false) => {
    if (!currentUser) return

    try {
      const newPinnedChats = new Set(pinnedChats)
      const isPinned = pinnedChats.has(chatId)

      if (isPinned) {
        newPinnedChats.delete(chatId)
      } else {
        newPinnedChats.add(chatId)
      }

      setPinnedChats(newPinnedChats)

      const pinnedRef = ref(database, `pinnedChats/${currentUser.uid}`)
      await set(pinnedRef, Array.from(newPinnedChats))

      toast({
        title: isPinned ? "Chat unpinned" : "Chat pinned",
        description: isPinned ? "Chat has been unpinned" : "Chat has been pinned to top",
      })
    } catch (error) {
      console.error("Error pinning chat:", error)
      toast({
        title: "Error",
        description: "Failed to pin/unpin chat",
        variant: "destructive",
      })
    }

    setChatContextMenu({ visible: false, x: 0, y: 0, contact: null, group: null })
  }

  const handleArchiveChat = async (chatId: string, isGroup = false) => {
    if (!currentUser) return

    try {
      const newArchivedChats = new Set(archivedChats)
      const isArchived = archivedChats.has(chatId)

      if (isArchived) {
        newArchivedChats.delete(chatId)
      } else {
        newArchivedChats.add(chatId)
        const newPinnedChats = new Set(pinnedChats)
        newPinnedChats.delete(chatId)
        setPinnedChats(newPinnedChats)

        const pinnedRef = ref(database, `pinnedChats/${currentUser.uid}`)
        await set(pinnedRef, Array.from(newPinnedChats))
      }

      setArchivedChats(newArchivedChats)

      const archivedRef = ref(database, `archivedChats/${currentUser.uid}`)
      await set(archivedRef, Array.from(newArchivedChats))

      if (isArchived && (selectedContact?.id === chatId || selectedGroup?.id === chatId)) {
        setSelectedContact(null)
        setSelectedGroup(null)
      }

      if (isArchived && newArchivedChats.size === 0 && showArchivedChats) {
        setShowArchivedChats(false)
      }

      toast({
        title: isArchived ? "Chat unarchived" : "Chat archived",
        description: isArchived ? "Chat moved back to main list" : "Chat moved to archived",
      })
    } catch (error) {
      console.error("Error archiving chat:", error)
      toast({
        title: "Error",
        description: "Failed to archive/unarchive chat",
        variant: "destructive",
      })
    }

    setChatContextMenu({ visible: false, x: 0, y: 0, contact: null, group: null })
  }

  const handleDeleteChat = async (chatId: string, isGroup = false) => {
    if (!currentUser) return

    try {
      if (isGroup) {
        const newPinnedChats = new Set(pinnedChats)
        const newArchivedChats = new Set(archivedChats)
        newPinnedChats.delete(chatId)
        newArchivedChats.delete(chatId)
        setPinnedChats(newPinnedChats)
        setArchivedChats(newArchivedChats)

        if (selectedGroup?.id === chatId) {
          setSelectedGroup(null)
        }
      } else {
        const chatRef = ref(database, `chats/${currentUser.uid}/${chatId}`)
        await set(chatRef, null)

        const contactRef = ref(database, `contacts/${currentUser.uid}/${chatId}`)
        await update(contactRef, {
          lastMessage: "",
          timestamp: 0,
          unread: 0,
        })

        const newPinnedChats = new Set(pinnedChats)
        const newArchivedChats = new Set(archivedChats)
        newPinnedChats.delete(chatId)
        newArchivedChats.delete(chatId)
        setPinnedChats(newPinnedChats)
        setArchivedChats(newArchivedChats)

        if (selectedContact?.id === chatId) {
          setSelectedContact(null)
        }
      }

      toast({
        title: "Chat deleted",
        description: "Chat has been deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting chat:", error)
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      })
    }

    setChatContextMenu({ visible: false, x: 0, y: 0, contact: null, group: null })
  }

  const getVisibleContacts = () => {
    if (showArchivedChats) {
      return filteredContacts.filter((contact) => archivedChats.has(contact.id))
    }
    return filteredContacts.filter((contact) => !archivedChats.has(contact.id))
  }

  const getVisibleGroups = () => {
    if (showArchivedChats) {
      return filteredGroups.filter((group) => archivedChats.has(group.id))
    }
    return filteredGroups.filter((group) => !archivedChats.has(group.id))
  }

  const sortedContacts = [...getVisibleContacts()].sort((a, b) => {
    if (showArchivedChats) {
      return (b.timestamp || 0) - (a.timestamp || 0)
    }

    const aIsPinned = pinnedChats.has(a.id)
    const bIsPinned = pinnedChats.has(b.id)

    if (aIsPinned && !bIsPinned) return -1
    if (!aIsPinned && bIsPinned) return 1

    return (b.timestamp || 0) - (a.timestamp || 0)
  })

  const sortedGroups = [...getVisibleGroups()].sort((a, b) => {
    if (showArchivedChats) {
      return (b.timestamp || 0) - (a.timestamp || 0)
    }

    const aIsPinned = pinnedChats.has(a.id)
    const bIsPinned = pinnedChats.has(b.id)

    if (aIsPinned && !bIsPinned) return -1
    if (!aIsPinned && bIsPinned) return 1

    return (b.timestamp || 0) - (a.timestamp || 0)
  })

  useEffect(() => {
    if (!currentUser) return

    const pinnedRef = ref(database, `pinnedChats/${currentUser.uid}`)
    const archivedRef = ref(database, `archivedChats/${currentUser.uid}`)

    const unsubscribePinned = onValue(pinnedRef, (snapshot) => {
      if (snapshot.exists()) {
        const pinnedArray = snapshot.val()
        setPinnedChats(new Set(Array.isArray(pinnedArray) ? pinnedArray : []))
      } else {
        setPinnedChats(new Set())
      }
    })

    const unsubscribeArchived = onValue(archivedRef, (snapshot) => {
      if (snapshot.exists()) {
        const archivedArray = snapshot.val()
        setArchivedChats(new Set(Array.isArray(archivedArray) ? archivedArray : []))
      } else {
        setArchivedChats(new Set())
      }
    })

    return () => {
      unsubscribePinned()
      unsubscribeArchived()
    }
  }, [currentUser])

  useEffect(() => {
    if (showArchivedChats && archivedChats.size === 0) {
      setShowArchivedChats(false)
    }
  }, [showArchivedChats, archivedChats.size])

  const handleVoiceMessage = async (audioBlob: Blob, duration: number) => {
    if (!selectedContact && !selectedGroup) return

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64Audio = reader.result as string

        if (selectedGroup) {
          const groupMessagesRef = ref(database, `groupMessages/${selectedGroup.id}`)
          const newMessageRef = push(groupMessagesRef)

          const message = {
            text: "",
            senderUid: currentUser!.uid,
            senderName: userProfile?.name || currentUser!.email?.split("@")[0] || "Unknown",
            groupId: selectedGroup.id,
            timestamp: {
              ".sv": "timestamp",
            },
            clientTimestamp: Date.now(),
            status: "sent",
            fileUrl: base64Audio,
            fileType: "audio",
            fileName: `voice-message-${Date.now()}.webm`,
            duration: duration,
            reactions: {},
          }

          await set(newMessageRef, message)

          const groupRef = ref(database, `groups/${selectedGroup.id}`)
          await update(groupRef, {
            lastMessage: "🎤 Voice message",
            timestamp: {
              ".sv": "timestamp",
            },
          })

          const groupMembers = Object.keys(selectedGroup.members)
          const unreadPromises = groupMembers
            .filter((memberId) => memberId !== currentUser!.uid)
            .map(async (memberId) => {
              const memberUnreadRef = ref(database, `groupUnread/${selectedGroup.id}/${memberId}`)
              const currentUnreadSnapshot = await get(memberUnreadRef)
              const currentCount = currentUnreadSnapshot.exists() ? currentUnreadSnapshot.val().count || 0 : 0

              return set(memberUnreadRef, {
                count: currentCount + 1,
                lastMessage: "🎤 Voice message",
                timestamp: Date.now(),
              })
            })

          await Promise.all(unreadPromises)
        } else if (selectedContact) {
          await sendMessage("", undefined, base64Audio, "audio", `voice-message-${Date.now()}.webm`)
        }

        setShowVoiceRecorder(false)
        toast({
          title: "Voice message sent",
          description: "Your voice message has been sent successfully",
        })
      }

      reader.readAsDataURL(audioBlob)
    } catch (error) {
      console.error("Failed to send voice message:", error)
      toast({
        title: "Error",
        description: "Failed to send voice message. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleMarkAsRead = async (chatId: string, isGroup = false) => {
    if (!currentUser) return

    try {
      if (isGroup) {
        const groupUnreadRef = ref(database, `groupUnread/${chatId}/${currentUser.uid}`)
        await set(groupUnreadRef, { count: 0, lastRead: Date.now() })

        setGroups((prevGroups) =>
          prevGroups.map((group) => {
            if (group.id === chatId) {
              return { ...group, unread: 0 }
            }
            return group
          }),
        )
      } else {
        const contactRef = ref(database, `contacts/${currentUser.uid}/${chatId}`)
        await update(contactRef, { unread: 0 })

        setContacts((prevContacts) =>
          prevContacts.map((contact) => {
            if (contact.id === chatId) {
              return { ...contact, unread: 0 }
            }
            return contact
          }),
        )
      }

      toast({
        title: "Marked as read",
        description: "Messages have been marked as read",
      })
    } catch (error) {
      console.error("Error marking as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark messages as read",
        variant: "destructive",
      })
    }

    setChatContextMenu({ visible: false, x: 0, y: 0, contact: null, group: null })
  }

  return (
    <DragDropZone onFileDrop={handleFileDrop}>
      <div className="flex h-screen bg-background text-foreground">
        <div
          className={`${
            isMobile ? (selectedContact || selectedGroup ? "hidden" : "flex w-full") : "flex w-[420px]"
          } flex-col border-r border-border bg-card h-screen overflow-hidden text-foreground`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-card">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 cursor-pointer" onClick={() => setShowUserProfile(true)}>
                <AvatarImage src={userProfile?.avatar || "/placeholder.svg?height=40&width=40"} />
                <AvatarFallback className="bg-muted">
                  {userProfile?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-foreground truncate">{userProfile?.name || "User"}</h2>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
            <div className="flex space-x-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => (activeTab === "chats" ? setShowAddContact(true) : setShowGroupCreation(true))}
              >
                <Plus className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={() => setShowUserProfile(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-accent"
                onClick={logout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "chats" | "groups")}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="grid w-full grid-cols-2 bg-muted border-b border-border p-1">
              <button
                className={`${getTabStyles(activeTab === "chats")} flex items-center justify-center gap-2 px-4 py-3 rounded-md relative`}
                onClick={() => setActiveTab("chats")}
              >
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">Chats</span>
                {totalUnreadChats > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <UnreadBadge count={totalUnreadChats} />
                  </div>
                )}
                {activeTab === "chats" && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-current"
                    layoutId="activeTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
              <button
                className={`${getTabStyles(activeTab === "groups")} flex items-center justify-center gap-2 px-4 py-3 rounded-md relative`}
                onClick={() => setActiveTab("groups")}
              >
                <Users className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">Groups</span>
                {totalUnreadGroups > 0 && (
                  <div className="absolute -top-1 -right-1">
                    <UnreadBadge count={totalUnreadGroups} />
                  </div>
                )}
                {activeTab === "groups" && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-current"
                    layoutId="activeTab"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            </div>

            <div className="p-4 bg-card flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={`Search ${activeTab}...`}
                  className="border-border bg-background pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {archivedChats.size > 0 && (
              <div className="px-4 pb-2">
                <motion.button
                  className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-200"
                  onClick={() => setShowArchivedChats(!showArchivedChats)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400">
                      <Archive className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-foreground">
                        {showArchivedChats ? "Back to Chats" : "Archived"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {archivedChats.size} archived {archivedChats.size === 1 ? "chat" : "chats"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {totalArchivedUnread > 0 && !showArchivedChats && <UnreadBadge count={totalArchivedUnread} />}
                    <motion.div
                      animate={{ rotate: showArchivedChats ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    >
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </motion.div>
                  </div>
                </motion.button>
              </div>
            )}

            <TabsContent value="chats" className="flex-1 mt-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-1 p-2">
                  <AnimatePresence mode="popLayout">
                    {sortedContacts.length > 0 ? (
                      sortedContacts.map((contact) => (
                        <motion.div
                          key={contact.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{
                            layout: { type: "spring", stiffness: 400, damping: 30 },
                            opacity: { duration: 0.2 },
                            y: { duration: 0.2 },
                          }}
                          className={`flex cursor-pointer items-center space-x-3 rounded-lg p-3 transition-all duration-200 relative
${
  selectedContact?.id === contact.id
    ? "bg-primary/20 dark:bg-primary/30 border border-primary/50 shadow-sm shadow-primary/20"
    : "hover:bg-accent/30"
}`}
                          onClick={() => {
                            setSelectedContact(contact)
                            setSelectedGroup(null)
                          }}
                          onContextMenu={(e) => handleChatContextMenu(e, contact)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {!showArchivedChats && pinnedChats.has(contact.id) && (
                            <div className="absolute top-1 right-1 text-yellow-500">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 3a2 2 0 00-2 2v1.5h16V5a2 2 0 00-2-2H4z" />
                                <path
                                  fillRule="evenodd"
                                  d="M18 8.5H2V10a2 2 0 002 2h14a2 2 0 002-2V8.5zM4 13a2 2 0 00-2 2v1.5h16V15a2 2 0 00-2-2H4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}

                          {showArchivedChats && (
                            <div className="absolute top-1 right-1 text-orange-500">
                              <Archive className="h-3 w-3" />
                            </div>
                          )}

                          <div className="relative flex-shrink-0">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={contact.avatar || "/placeholder.svg?height=48&width=48"} />
                              <AvatarFallback className="bg-muted">
                                {contact.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {contact.isOnline && (
                              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-green-500"></div>
                            )}
                          </div>
                          <div className="flex-1 overflow-hidden min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium truncate text-foreground">{contact.name}</h3>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <span className="text-xs text-muted-foreground">
                                  {contact.timestamp ? formatTime(contact.timestamp) : ""}
                                </span>
                                {contact.unread && contact.unread > 0 && <UnreadBadge count={contact.unread} />}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground truncate">
                                {typingUsers[contact.id] ? (
                                  <motion.span
                                    className="text-green-400"
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                                  >
                                    typing...
                                  </motion.span>
                                ) : (
                                  contact.lastMessage || "No messages yet"
                                )}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        {showArchivedChats ? (
                          <>
                            <Archive className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-foreground">No archived contacts</p>
                            <p className="text-sm text-muted-foreground mt-1">Archived chats will appear here</p>
                          </>
                        ) : (
                          <>
                            <User className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-foreground">No contacts found</p>
                            <p className="text-sm text-muted-foreground mt-1">Add some contacts to start chatting</p>
                          </>
                        )}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="groups" className="flex-1 mt-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="space-y-1 p-2">
                  <AnimatePresence mode="popLayout">
                    {sortedGroups.length > 0 ? (
                      sortedGroups.map((group) => (
                        <motion.div
                          key={group.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{
                            layout: { type: "spring", stiffness: 400, damping: 30 },
                            opacity: { duration: 0.2 },
                            y: { duration: 0.2 },
                          }}
                          className={`flex cursor-pointer items-center space-x-3 rounded-lg p-3 transition-all duration-200 relative
${
  selectedGroup?.id === group.id
    ? "bg-primary/20 dark:bg-primary/30 border border-primary/50 shadow-sm shadow-primary/20"
    : "hover:bg-accent/30"
}`}
                          onClick={() => {
                            setSelectedGroup(group)
                            setSelectedContact(null)
                          }}
                          onContextMenu={(e) => handleChatContextMenu(e, undefined, group)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {!showArchivedChats && pinnedChats.has(group.id) && (
                            <div className="absolute top-1 right-1 text-yellow-500">
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M4 3a2 2 0 00-2 2v1.5h16V5a2 2 0 00-2-2H4z" />
                                <path
                                  fillRule="evenodd"
                                  d="M18 8.5H2V10a2 2 0 002 2h14a2 2 0 002-2V8.5zM4 13a2 2 0 00-2 2v1.5h16V15a2 2 0 00-2-2H4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}

                          {showArchivedChats && (
                            <div className="absolute top-1 right-1 text-orange-500">
                              <Archive className="h-3 w-3" />
                            </div>
                          )}

                          <div className="relative flex-shrink-0">
                            <Avatar className="h-12 w-12">
                              {group.avatar ? (
                                <AvatarImage src={group.avatar || "/placeholder.svg"} />
                              ) : (
                                <AvatarFallback className={`${getGroupAvatar(group)} text-white`}>
                                  <Users className="h-6 w-6" />
                                </AvatarFallback>
                              )}
                            </Avatar>
                            {group.createdBy === currentUser?.uid && (
                              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-yellow-500 border-2 border-card flex items-center justify-center">
                                <Crown className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 overflow-hidden min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium truncate text-foreground">{group.name}</h3>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <span className="text-xs text-muted-foreground">
                                  {group.timestamp ? formatTime(group.timestamp) : ""}
                                </span>
                                {group.unread && group.unread > 0 && <UnreadBadge count={group.unread} />}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground truncate">
                                {group.lastMessage || "No messages yet"}
                              </p>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {Object.keys(group.members).length} members
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        {showArchivedChats ? (
                          <>
                            <Archive className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-foreground">No archived groups</p>
                            <p className="text-sm text-muted-foreground mt-1">Archived groups will appear here</p>
                          </>
                        ) : (
                          <>
                            <Users className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-foreground">No groups found</p>
                            <p className="text-sm text-muted-foreground mt-1">Create a group to start chatting</p>
                          </>
                        )}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Chat Area */}
        <div
          className={`${
            isMobile ? (selectedContact || selectedGroup ? "flex w-full" : "hidden") : "flex flex-1"
          } flex-col`}
        >
          {selectedContact || selectedGroup ? (
            <>
              {/* Chat Header */}
              <div
                data-chat-header
                className={`flex items-center justify-between border-b border-border bg-card p-4 transition-all duration-300 ${
                  isMobile ? "relative z-50" : ""
                }`}
              >
                <div className="flex items-center space-x-3">
                  {isMobile && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={handleBackNavigation}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <Avatar
                    className="h-10 w-10 cursor-pointer"
                    onClick={() => (selectedContact ? setShowContactProfile(true) : setShowGroupProfile(true))}
                  >
                    {selectedContact ? (
                      <>
                        <AvatarImage src={selectedContact.avatar || "/placeholder.svg?height=40&width=40"} />
                        <AvatarFallback className="bg-muted">
                          {selectedContact.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </>
                    ) : selectedGroup ? (
                      <>
                        {selectedGroup.avatar ? (
                          <AvatarImage src={selectedGroup.avatar || "/placeholder.svg"} />
                        ) : (
                          <AvatarFallback className={`${getGroupAvatar(selectedGroup)} text-white`}>
                            <Users className="h-5 w-5" />
                          </AvatarFallback>
                        )}
                      </>
                    ) : null}
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedContact?.name || selectedGroup?.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedContact ? (
                        typingUsers[selectedContact.id] ? (
                          <motion.span
                            className="text-green-400"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                          >
                            typing...
                          </motion.span>
                        ) : selectedContact.isOnline ? (
                          "Online"
                        ) : selectedContact.lastSeen ? (
                          `Last seen ${formatDistanceToNow(new Date(selectedContact.lastSeen), { addSuffix: true })}`
                        ) : (
                          "Offline"
                        )
                      ) : selectedGroup ? (
                        `${Object.keys(selectedGroup.members).length} members`
                      ) : null}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => makeCall(false)}>
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => makeCall(true)}>
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => (selectedContact ? setShowContactProfile(true) : setShowGroupProfile(true))}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <ScrollArea
                ref={chatContainerRef}
                className={`flex-1 p-4 transition-all duration-300 ${
                  isMobile && isKeyboardVisible ? "pb-2" : ""
                } ${isMobile ? "relative" : ""}`}
                style={{
                  backgroundColor: currentTheme.colors.chatBackground
                    ? `hsl(${currentTheme.colors.chatBackground})`
                    : undefined,
                  minHeight: isMobile ? "calc(100vh - 140px)" : undefined,
                }}
              >
                <div className="space-y-4">
                  <AnimatePresence>
                    {currentMessages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} relative`}
                      >
                        {isMobile && swipeState.messageId === message.id && swipeState.isActive && (
                          <motion.div
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2 text-primary z-10 pointer-events-none"
                            initial={{ opacity: 0, x: -30, scale: 0.8 }}
                            animate={{
                              opacity: getSwipeOpacity(message.id),
                              x: 0,
                              scale: getReplyIndicatorScale(message.id),
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          >
                            <div className="bg-primary/20 backdrop-blur-sm rounded-full p-2">
                              <ReplyIcon className="h-5 w-5" />
                            </div>
                            <span className="text-sm font-medium bg-primary/20 backdrop-blur-sm px-2 py-1 rounded-full">
                              Reply
                            </span>
                          </motion.div>
                        )}

                        <div
                          className={`flex items-end space-x-2 ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                          style={{
                            transform: getSwipeTransform(message.id),
                            transition:
                              swipeState.isActive && swipeState.messageId === message.id
                                ? "none"
                                : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        >
                          <motion.div
                            className={`max-w-xs rounded-lg px-4 py-2 ${getMessageBubbleStyle(
                              message.sender,
                              message.isDeleted,
                            )} ${message.isTemp ? "opacity-70" : ""} select-none`}
                            style={{
                              backgroundColor: message.isDeleted
                                ? currentTheme.colors.muted
                                  ? `hsl(${currentTheme.colors.muted})`
                                  : "hsl(var(--muted))"
                                : message.sender === "user"
                                  ? currentTheme.colors.messageSent
                                    ? `hsl(${currentTheme.colors.messageSent})`
                                    : "#ffffff"
                                  : currentTheme.colors.messageReceived
                                    ? `hsl(${currentTheme.colors.messageReceived})`
                                    : "#374151",
                              color: message.isDeleted
                                ? currentTheme.colors.mutedForeground
                                  ? `hsl(${currentTheme.colors.mutedForeground})`
                                  : "hsl(var(--muted-foreground))"
                                : message.sender === "user"
                                  ? currentTheme.colors.messageSentText
                                    ? `hsl(${currentTheme.colors.messageSentText})`
                                    : "#000000"
                                  : currentTheme.colors.messageReceivedText
                                    ? `hsl(${currentTheme.colors.messageReceivedText})`
                                    : "#ffffff",
                            }}
                            onContextMenu={!isMobile ? (e) => handleMessageContextMenu(e, message) : undefined}
                            onTouchStart={isMobile ? (e) => handleTouchStart(e, message) : undefined}
                            onTouchMove={isMobile ? (e) => handleTouchMove(e, message) : undefined}
                            onTouchEnd={isMobile ? (e) => handleTouchEnd(e, message) : undefined}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {selectedGroup && message.sender !== "user" && (
                              <p className="text-xs font-medium mb-1 opacity-70">{message.senderName}</p>
                            )}

                            {message.replyToId && message.replyToText && (
                              <div className="mb-2 p-2 rounded bg-black/10 border-l-2 border-current">
                                <p className="text-xs opacity-70 truncate">{message.replyToText}</p>
                              </div>
                            )}

                            {message.isDeleted ? (
                              <p
                                className="text-sm opacity-75"
                                style={{
                                  color: currentTheme.colors.mutedForeground
                                    ? `hsl(${currentTheme.colors.mutedForeground})`
                                    : "hsl(var(--muted-foreground))",
                                }}
                              >
                                🗑️ This message was deleted
                              </p>
                            ) : message.fileUrl ? (
                              <MessageFilePreview
                                fileUrl={message.fileUrl}
                                fileType={message.fileType || ""}
                                fileName={message.fileName || ""}
                              />
                            ) : (
                              <p className="text-sm break-words">{message.text}</p>
                            )}

                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                              {message.sender === "user" && (
                                <span className="text-xs opacity-70 ml-2">
                                  {message.status === "delivered" ? "✓✓" : message.status === "sent" ? "✓" : "⏳"}
                                </span>
                              )}
                            </div>

                            {message.reactions && Object.keys(message.reactions).length > 0 && (
                              <MessageReactions
                                reactions={message.reactions}
                                onReactionClick={(emoji) => handleReactionClick(message.id, emoji)}
                                currentUserId={currentUser?.uid || ""}
                              />
                            )}
                          </motion.div>

                          {isMobile && !message.isDeleted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-60 hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMessageContextMenu(e, message)
                              }}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {selectedContact && typingUsers[selectedContact.id] && (
                    <div className="flex justify-start">
                      <TypingIndicator contactName={selectedContact.name} />
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <AnimatePresence>
                {replyingTo && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="reply-preview border-t border-border bg-muted p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ReplyIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Replying to {replyingTo.sender === "user" ? "yourself" : replyingTo.senderName || "contact"}
                          </p>
                          <p className="text-sm truncate max-w-xs">{replyingTo.text}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setReplyingTo(null)}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                ref={inputContainerRef}
                className={`border-t border-border bg-card transition-all duration-300 ${
                  isMobile && isKeyboardVisible ? "shadow-lg border-t-2" : ""
                }`}
                style={{
                  padding: isMobile ? "12px 16px" : "16px",
                }}
              >
                <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                  <FileUpload onFileUpload={handleFileUpload} />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 mb-1"
                    onClick={() => setShowVoiceRecorder(true)}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    data-emoji-trigger
                    size="icon"
                    className="text-muted-foreground hover:text-foreground hover:bg-accent shrink-0 mb-1"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      setEmojiPickerPosition({
                        x: rect.left,
                        y: rect.top - 300,
                      })
                      setShowEmojiPicker(!showEmojiPicker)
                    }}
                  >
                    <span className="text-lg">😊</span>
                  </Button>

                  <div className="flex-1 relative">
                    <div className="relative bg-background border border-border rounded-full px-4 py-2 flex items-center">
                      <textarea
                        ref={messageInputRef}
                        value={newMessage}
                        onChange={handleInputChange}
                        placeholder="Type a message..."
                        className={`w-full resize-none bg-transparent text-sm focus:outline-none min-h-[24px] max-h-32 ${
                          isMobile ? "touch-manipulation" : ""
                        } placeholder:text-muted-foreground`}
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage(e)
                          }
                        }}
                        style={{
                          height: "auto",
                          lineHeight: "1.5",
                          paddingTop: "2px",
                          paddingBottom: "2px",
                        }}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="icon"
                    disabled={!newMessage.trim() || isSending}
                    className="shrink-0 rounded-full h-10 w-10 bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>

                {showEmojiPicker && (
                  <div
                    className="emoji-picker fixed z-[9999] bg-card border border-border rounded-lg shadow-lg p-4 max-h-64 overflow-y-auto"
                    style={{
                      left: `${Math.max(10, Math.min(emojiPickerPosition.x, window.innerWidth - 320))}px`,
                      top: `${Math.max(10, emojiPickerPosition.y)}px`,
                      width: "300px",
                    }}
                  >
                    <div className="grid grid-cols-8 gap-2">
                      {[
                        "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "😎", "🤓", "🧐", "😕", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "❤️", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤝", "🙏", "✍️", "🔥", "💯", "💢", "💥", "💫", "💦", "💨", "🕳️", "💬", "👁️‍🗨️", "🗨️", "🗯️", "💭", "💤", "🎉", "🎊",
                      ].map((emoji, index) => (
                        <button
                          key={index}
                          type="button"
                          className="p-2 hover:bg-accent rounded text-lg transition-colors"
                          onClick={() => {
                            setNewMessage((prev) => prev + emoji)
                            setShowEmojiPicker(false)
                            messageInputRef.current?.focus()
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <Button variant="outline" size="sm" onClick={() => setShowEmojiPicker(false)} className="w-full">
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-muted/20">
              <div className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Welcome to Chit Chat</h3>
                <p className="text-muted-foreground">Select a contact or group to start messaging</p>
              </div>
            </div>
          )}
        </div>

        <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
          <DialogContent className="border-border bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddContact} className="space-y-4">
              <Input
                placeholder="Enter email address"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                className="border-border bg-background"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddContact(false)}
                  className="border-border text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!newContactEmail.trim()}>
                  Add Contact
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <ContactProfileDrawer
          open={showContactProfile}
          onOpenChange={setShowContactProfile}
          contact={selectedContact}
        />

        <UserProfileDrawer open={showUserProfile} onOpenChange={setShowUserProfile} />

        <GroupProfileDrawer
          open={showGroupProfile}
          onOpenChange={setShowGroupProfile}
          group={selectedGroup}
          currentUser={currentUser}
          contacts={contacts}
        />

        <GroupCreationModal
          open={showGroupCreation}
          onOpenChange={setShowGroupCreation}
          contacts={contacts}
          currentUser={currentUser}
        />

        <VoiceRecorder
          isVisible={showVoiceRecorder}
          onSendVoice={handleVoiceMessage}
          onCancel={() => setShowVoiceRecorder(false)}
        />

        <MessageContextMenu
          visible={contextMenu.visible}
          x={contextMenu.x}
          y={contextMenu.y}
          message={contextMenu.message}
          onReply={(message) => {
            setReplyingTo(message)
            setContextMenu({ visible: false, x: 0, y: 0, message: null })
            messageInputRef.current?.focus()
          }}
          onDelete={handleDeleteMessage}
          onCopy={handleCopyMessage}
          onReact={handleReaction}
          onClose={() => setContextMenu({ visible: false, x: 0, y: 0, message: null })}
          currentUserId={currentUser?.uid}
          canDelete={true}
        />

        <ChatContextMenu
          visible={chatContextMenu.visible}
          x={chatContextMenu.x}
          y={chatContextMenu.y}
          contact={chatContextMenu.contact}
          group={chatContextMenu.group}
          onClose={() => setChatContextMenu({ visible: false, x: 0, y: 0, contact: null, group: null })}
          onPin={handlePinChat}
          onDelete={handleDeleteChat}
          onArchive={handleArchiveChat}
          onMarkAsRead={handleMarkAsRead}
          isPinned={(chatId: string) => pinnedChats.has(chatId)}
          isArchived={(chatId: string) => archivedChats.has(chatId)}
        />
        
        <AnimatePresence>
            {callStatus === 'receiving' && incomingCall && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="fixed bottom-6 right-6 z-[100] w-full max-w-sm"
                >
                    <Card className="border-primary/50 bg-card shadow-lg">
                        <CardHeader>
                            <CardTitle>Incoming Call...</CardTitle>
                            <CardDescription>
                                You have an incoming call from a contact.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-end space-x-2">
                            <Button onClick={answerCall} className="bg-green-600 hover:bg-green-700">Accept</Button>
                            <Button onClick={hangUp} variant="destructive">Decline</Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
        
        <AnimatePresence>
            {callStatus === 'calling' && (
                 <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.9 }}
                    className="fixed bottom-6 right-6 z-[100] w-full max-w-sm"
                >
                    <Card className="border-blue-500/50 bg-card shadow-lg">
                        <CardHeader>
                            <CardTitle>Calling {selectedContact?.name}...</CardTitle>
                            <CardDescription>
                                Waiting for them to pick up.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-end space-x-2">
                            <Button onClick={hangUp} variant="destructive">Cancel</Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>

        <VideoCallModal
            isOpen={callStatus === 'in-call'}
            localStream={localStream}
            remoteStream={remoteStream}
            onHangUp={hangUp}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            isSharingScreen={isSharingScreen}
            onStartScreenShare={startScreenShare}
            onStopScreenShare={stopScreenShare}
            devices={devices}
        />

      </div>
    </DragDropZone>
  )
}
