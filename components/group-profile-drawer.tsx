"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Users, Crown, UserPlus, UserMinus, Edit3, Check, X, LogOut } from "lucide-react"
import { ref, update, remove } from "firebase/database"
import { database } from "@/lib/firebase"

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

interface Contact {
  id: string
  uid: string
  name: string
  email: string
  avatar?: string
}

interface GroupProfileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group | null
  currentUser: any
  contacts: Contact[]
}

export default function GroupProfileDrawer({
  open,
  onOpenChange,
  group,
  currentUser,
  contacts,
}: GroupProfileDrawerProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [showAddMembers, setShowAddMembers] = useState(false)
  const [selectedNewMembers, setSelectedNewMembers] = useState<Set<string>>(new Set())
  const [isAddingMembers, setIsAddingMembers] = useState(false)
  const { toast } = useToast()

  if (!group || !currentUser) return null

  const isAdmin = group.createdBy === currentUser.uid
  const membersList = Object.entries(group.members)

  // Get contacts that are not already in the group
  const availableContacts = contacts.filter((contact) => !group.members[contact.uid])

  const getGroupAvatar = (name: string) => {
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
    ]
    const colorIndex = name.charCodeAt(0) % colors.length
    return colors[colorIndex]
  }

  const handleSaveName = async () => {
    if (!editedName.trim() || !isAdmin) return

    try {
      const groupRef = ref(database, `groups/${group.id}`)
      await update(groupRef, { name: editedName.trim() })

      toast({
        title: "Group name updated",
        description: "The group name has been changed successfully",
      })

      setIsEditingName(false)
    } catch (error) {
      console.error("Error updating group name:", error)
      toast({
        title: "Error",
        description: "Failed to update group name",
        variant: "destructive",
      })
    }
  }

  const handleSaveDescription = async () => {
    if (!isAdmin) return

    try {
      const groupRef = ref(database, `groups/${group.id}`)
      await update(groupRef, { description: editedDescription.trim() })

      toast({
        title: "Description updated",
        description: "The group description has been changed successfully",
      })

      setIsEditingDescription(false)
    } catch (error) {
      console.error("Error updating group description:", error)
      toast({
        title: "Error",
        description: "Failed to update group description",
        variant: "destructive",
      })
    }
  }

  const handleRemoveMember = async (memberUid: string) => {
    if (!isAdmin || memberUid === currentUser.uid) return

    try {
      const groupRef = ref(database, `groups/${group.id}/members/${memberUid}`)
      await remove(groupRef)

      const memberName = group.members[memberUid]?.name || "Member"
      toast({
        title: "Member removed",
        description: `${memberName} has been removed from the group`,
      })
    } catch (error) {
      console.error("Error removing member:", error)
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      })
    }
  }

  const handleLeaveGroup = async () => {
    try {
      if (isAdmin) {
        // If admin is leaving, transfer ownership to another member or delete group
        const otherMembers = membersList.filter(([uid]) => uid !== currentUser.uid)

        if (otherMembers.length > 0) {
          // Transfer ownership to the first other member
          const newAdminUid = otherMembers[0][0]
          const groupRef = ref(database, `groups/${group.id}`)
          await update(groupRef, {
            createdBy: newAdminUid,
            [`members/${newAdminUid}/role`]: "admin",
          })

          // Remove current user
          const memberRef = ref(database, `groups/${group.id}/members/${currentUser.uid}`)
          await remove(memberRef)

          toast({
            title: "Left group",
            description: "You have left the group and transferred admin rights",
          })
        } else {
          // Delete the entire group if no other members
          const groupRef = ref(database, `groups/${group.id}`)
          await remove(groupRef)

          toast({
            title: "Group deleted",
            description: "The group has been deleted as you were the only member",
          })
        }
      } else {
        // Regular member leaving
        const memberRef = ref(database, `groups/${group.id}/members/${currentUser.uid}`)
        await remove(memberRef)

        toast({
          title: "Left group",
          description: "You have left the group",
        })
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Error leaving group:", error)
      toast({
        title: "Error",
        description: "Failed to leave group",
        variant: "destructive",
      })
    }
  }

  const handleMemberToggle = (contactId: string) => {
    const newSelected = new Set(selectedNewMembers)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedNewMembers(newSelected)
  }

  const handleAddMembers = async () => {
    if (selectedNewMembers.size === 0 || !isAdmin) return

    setIsAddingMembers(true)
    try {
      const updates: { [key: string]: any } = {}

      selectedNewMembers.forEach((contactId) => {
        const contact = contacts.find((c) => c.id === contactId)
        if (contact) {
          updates[`groups/${group.id}/members/${contactId}`] = {
            name: contact.name,
            role: "member",
            joinedAt: Date.now(),
          }
        }
      })

      await update(ref(database), updates)

      toast({
        title: "Members added",
        description: `${selectedNewMembers.size} member(s) have been added to the group`,
      })

      setSelectedNewMembers(new Set())
      setShowAddMembers(false)
    } catch (error) {
      console.error("Error adding members:", error)
      toast({
        title: "Error",
        description: "Failed to add members. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsAddingMembers(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md bg-card border-border text-card-foreground flex flex-col h-full">
          <SheetHeader className="space-y-4 flex-shrink-0">
            <SheetTitle className="text-card-foreground">Group Info</SheetTitle>

            {/* Group Avatar */}
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                {group.avatar ? (
                  <AvatarImage src={group.avatar || "/placeholder.svg"} />
                ) : (
                  <AvatarFallback className={`${getGroupAvatar(group.name)} text-white text-2xl`}>
                    <Users className="h-12 w-12" />
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
          </SheetHeader>

          <div className="flex-1 mt-6 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-6 pr-4">
                {/* Group Name */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-card-foreground">Group Name</label>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditedName(group.name)
                          setIsEditingName(true)
                        }}
                        className="text-muted-foreground hover:text-card-foreground"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {isEditingName ? (
                    <div className="flex space-x-2">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="border-border bg-input"
                        maxLength={50}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveName}
                        disabled={!editedName.trim()}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingName(false)}
                        className="border-border"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-card-foreground font-medium">{group.name}</p>
                  )}
                </div>

                {/* Group Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-card-foreground">Description</label>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditedDescription(group.description || "")
                          setIsEditingDescription(true)
                        }}
                        className="text-muted-foreground hover:text-card-foreground"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {isEditingDescription ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        className="border-border bg-input resize-none"
                        rows={3}
                        maxLength={200}
                        placeholder="Add a group description..."
                      />
                      <div className="flex space-x-2">
                        <Button size="sm" onClick={handleSaveDescription} className="bg-primary hover:bg-primary/90">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingDescription(false)}
                          className="border-border"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">{group.description || "No description"}</p>
                  )}
                </div>

                {/* Group Stats */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-card-foreground">{membersList.length}</p>
                    <p className="text-xs text-muted-foreground">Members</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-card-foreground">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Created</p>
                  </div>
                </div>

                {/* Members List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-card-foreground">Members ({membersList.length})</h3>
                    {isAdmin && availableContacts.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAddMembers(true)}
                        className="text-primary hover:text-primary/80"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {membersList.map(([uid, member]) => (
                      <motion.div
                        key={uid}
                        className="flex items-center space-x-3 p-3 bg-muted rounded-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={contacts.find((c) => c.uid === uid)?.avatar || "/placeholder.svg?height=40&width=40"}
                          />
                          <AvatarFallback className="bg-muted-foreground">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-card-foreground">
                            {member.name}
                            {uid === currentUser.uid && " (You)"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.role === "admin" ? "Admin" : "Member"}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {member.role === "admin" && <Crown className="h-4 w-4 text-yellow-500" />}
                          {isAdmin && uid !== currentUser.uid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(uid)}
                              className="text-destructive hover:text-destructive/80"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={handleLeaveGroup}
                    className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {isAdmin ? "Delete Group" : "Leave Group"}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Members Modal */}
      <Dialog open={showAddMembers} onOpenChange={setShowAddMembers}>
        <DialogContent className="border-border bg-card text-card-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-primary" />
              <span>Add Members to {group.name}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedNewMembers.size} of {availableContacts.length} contacts selected
              </p>
            </div>

            {availableContacts.length > 0 ? (
              <ScrollArea className="h-64 overflow-y-auto">
                <div className="space-y-2 pr-2">
                  {availableContacts.map((contact) => (
                    <motion.div
                      key={contact.id}
                      className={`flex cursor-pointer items-center space-x-3 rounded-lg p-3 transition-colors hover:bg-muted ${
                        selectedNewMembers.has(contact.id) ? "bg-primary/20 border border-primary/30" : ""
                      }`}
                      onClick={() => handleMemberToggle(contact.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={contact.avatar || "/placeholder.svg?height=40&width=40"} />
                        <AvatarFallback className="bg-muted-foreground">
                          {contact.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground">{contact.name}</p>
                        <p className="text-xs text-muted-foreground">{contact.email}</p>
                      </div>
                      <div className="flex items-center">
                        {selectedNewMembers.has(contact.id) ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="h-6 w-6 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </motion.div>
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-border" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No contacts available to add</p>
                <p className="text-sm text-muted-foreground/70 mt-1">All your contacts are already in this group</p>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddMembers(false)
                  setSelectedNewMembers(new Set())
                }}
                className="border-border text-muted-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMembers}
                disabled={selectedNewMembers.size === 0 || isAddingMembers}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isAddingMembers ? "Adding..." : `Add ${selectedNewMembers.size} Member(s)`}
                <UserPlus className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
