"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Edit, Mail, Clock, MessageSquareX, Check, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useChat } from "@/contexts/chat-context"
import { ref, update, remove } from "firebase/database"
import { database } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"

interface ContactProfileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contact: any
}

export default function ContactProfileDrawer({ open, onOpenChange, contact }: ContactProfileDrawerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [newName, setNewName] = useState("")
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { currentUser } = useAuth()
  const { messages, setSelectedContact } = useChat()
  const { toast } = useToast()

  if (!contact) return null

  const formatLastSeen = (timestamp: number) => {
    if (!timestamp) return "Never online"

    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (error) {
      return "Unknown"
    }
  }

  const handleEditClick = () => {
    setNewName(contact.name)
    setIsEditing(true)
  }

  const handleSaveName = async () => {
    if (!currentUser || !newName.trim()) return

    setIsSaving(true)
    try {
      // Update the contact name in Firebase
      const contactRef = ref(database, `contacts/${currentUser.uid}/${contact.uid}`)
      await update(contactRef, {
        name: newName.trim(),
      })

      toast({
        title: "Name updated",
        description: "Contact name has been updated successfully",
      })

      setIsEditing(false)
    } catch (error) {
      console.error("Error updating contact name:", error)
      toast({
        title: "Error",
        description: "Failed to update contact name",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setNewName("")
  }

  const getChatId = (uid1: string, uid2: string): string => {
    return uid1 > uid2 ? `${uid1}-${uid2}` : `${uid2}-${uid1}`
  }

  const handleClearMessages = async () => {
    if (!currentUser || !contact) return

    setIsClearing(true)
    try {
      const chatId = getChatId(currentUser.uid, contact.uid)
      const messagesRef = ref(database, `messages/${chatId}`)

      // Remove all messages for this chat
      await remove(messagesRef)

      // Update last message in contacts to empty
      const contactRef = ref(database, `contacts/${currentUser.uid}/${contact.uid}`)
      await update(contactRef, {
        lastMessage: "",
        timestamp: 0,
      })

      // Also update for the other user
      const otherContactRef = ref(database, `contacts/${contact.uid}/${currentUser.uid}`)
      await update(otherContactRef, {
        lastMessage: "",
        timestamp: 0,
      })

      toast({
        title: "Messages cleared",
        description: "All messages have been cleared successfully",
      })

      setShowClearDialog(false)
      onOpenChange(false)

      // Optionally close the chat if it's currently open
      setSelectedContact(null)
    } catch (error) {
      console.error("Error clearing messages:", error)
      toast({
        title: "Error",
        description: "Failed to clear messages",
        variant: "destructive",
      })
    } finally {
      setIsClearing(false)
    }
  }

  const currentMessages = messages[contact.id] || []
  const messageCount = currentMessages.length

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="border-border bg-card text-card-foreground sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-card-foreground">Contact Info</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col items-center space-y-6">
            {/* Profile Picture */}
            <Avatar className="h-32 w-32 border-4 border-border">
              <AvatarImage src={contact.avatar || "/placeholder.svg?height=128&width=128"} alt={contact.name} />
              <AvatarFallback className="bg-muted text-muted-foreground text-3xl">
                {contact.name ? contact.name.charAt(0).toUpperCase() : "?"}
              </AvatarFallback>
            </Avatar>

            {/* Name Section */}
            <div className="flex w-full items-center justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <div className="flex items-center space-x-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="border-border bg-input text-foreground"
                      placeholder="Enter name"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveName()
                        } else if (e.key === "Escape") {
                          handleCancelEdit()
                        }
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSaveName}
                      disabled={!newName.trim() || isSaving}
                      className="text-primary hover:text-primary/80"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCancelEdit}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-medium text-card-foreground">{contact.name}</h3>
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <div
                        className={`h-2 w-2 rounded-full ${contact.isOnline ? "bg-primary" : "bg-muted-foreground"}`}
                      ></div>
                      <span>{contact.isOnline ? "Online" : "Offline"}</span>
                    </div>
                  </>
                )}
              </div>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEditClick}
                  className="text-muted-foreground hover:text-card-foreground"
                >
                  <Edit className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* Email */}
            <div className="flex w-full items-center space-x-3 rounded-lg bg-muted p-4">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-card-foreground">Email</p>
                <p className="text-muted-foreground">{contact.email}</p>
              </div>
            </div>

            {/* Last Seen */}
            <div className="flex w-full items-center space-x-3 rounded-lg bg-muted p-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-card-foreground">Last seen</p>
                <p className="text-muted-foreground">{formatLastSeen(contact.lastSeen)}</p>
              </div>
            </div>

            {/* Clear Messages */}
            <div className="flex w-full items-center space-x-3 rounded-lg bg-muted p-4">
              <MessageSquareX className="h-5 w-5 text-destructive" />
              <div className="flex-1">
                <p className="text-sm font-medium text-card-foreground">Clear Messages</p>
                <p className="text-xs text-muted-foreground">
                  {messageCount > 0 ? `${messageCount} messages` : "No messages"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowClearDialog(true)}
                className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                disabled={messageCount === 0}
              >
                Clear
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Clear Messages Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="border-border bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Clear Messages</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to clear all messages with {contact.name}? This will delete all messages but keep
              the contact in your list. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              className="border-border text-muted-foreground hover:bg-muted"
              disabled={isClearing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearMessages}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isClearing}
            >
              {isClearing ? "Clearing..." : "Clear Messages"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
