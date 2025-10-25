"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { Users, Check, Crown, ArrowRight, ArrowLeft } from "lucide-react"
import { ref, push, set } from "firebase/database"
import { database } from "@/lib/firebase"

interface Contact {
  id: string
  uid: string
  name: string
  email: string
  avatar?: string
}

interface GroupCreationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: Contact[]
  currentUser: any
  userProfile: any
}

export default function GroupCreationModal({
  open,
  onOpenChange,
  contacts,
  currentUser,
  userProfile,
}: GroupCreationModalProps) {
  const [step, setStep] = useState<"details" | "members">("details")
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const handleMemberToggle = (contactId: string) => {
    const newSelected = new Set(selectedMembers)
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId)
    } else {
      newSelected.add(contactId)
    }
    setSelectedMembers(newSelected)
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !currentUser) return

    setIsCreating(true)
    try {
      const groupsRef = ref(database, "groups")
      const newGroupRef = push(groupsRef)

      // Create members object with current user as admin
      const members: { [uid: string]: { name: string; role: "admin" | "member"; joinedAt: number } } = {
        [currentUser.uid]: {
          name: userProfile?.name || currentUser.email?.split("@")[0] || "Unknown",
          role: "admin",
          joinedAt: Date.now(),
        },
      }

      // Add selected members
      selectedMembers.forEach((contactId) => {
        const contact = contacts.find((c) => c.id === contactId)
        if (contact) {
          members[contactId] = {
            name: contact.name,
            role: "member",
            joinedAt: Date.now(),
          }
        }
      })

      const groupData = {
        name: groupName.trim(),
        description: groupDescription.trim() || "",
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        members,
        lastMessage: "",
        timestamp: Date.now(),
      }

      await set(newGroupRef, groupData)

      toast({
        title: "Group created",
        description: `${groupName} has been created successfully`,
      })

      // Reset form
      setGroupName("")
      setGroupDescription("")
      setSelectedMembers(new Set())
      setStep("details")
      onOpenChange(false)
    } catch (error) {
      console.error("Error creating group:", error)
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-gray-800 bg-gray-900 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-400" />
            <span>Create New Group</span>
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "details" ? (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6 py-4"
            >
              {/* Group Avatar Preview */}
              <div className="flex justify-center">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className={`${getGroupAvatar(groupName || "Group")} text-white text-2xl`}>
                    <Users className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Group Name */}
              <div className="space-y-2">
                <label htmlFor="groupName" className="text-sm font-medium">
                  Group Name *
                </label>
                <Input
                  id="groupName"
                  placeholder="Enter group name"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="border-gray-700 bg-gray-800"
                  maxLength={50}
                />
                <p className="text-xs text-gray-400">{groupName.length}/50 characters</p>
              </div>

              {/* Group Description */}
              <div className="space-y-2">
                <label htmlFor="groupDescription" className="text-sm font-medium">
                  Description (Optional)
                </label>
                <Textarea
                  id="groupDescription"
                  placeholder="What's this group about?"
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="border-gray-700 bg-gray-800 resize-none"
                  rows={3}
                  maxLength={200}
                />
                <p className="text-xs text-gray-400">{groupDescription.length}/200 characters</p>
              </div>

              {/* Admin Badge */}
              <div className="flex items-center space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <Crown className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-400">You will be the group admin</span>
              </div>

              {/* Next Button */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep("members")}
                  disabled={!groupName.trim()}
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="members"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6 py-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Add Members</h3>
                  <p className="text-sm text-gray-400">
                    {selectedMembers.size} of {contacts.length} contacts selected
                  </p>
                </div>
                <div className="text-sm text-gray-400">{selectedMembers.size + 1} total members</div>
              </div>

              {/* Current User (Admin) */}
              <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userProfile?.avatar || "/placeholder.svg?height=40&width=40"} />
                  <AvatarFallback className="bg-gray-700">
                    {userProfile?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{userProfile?.name || "You"}</p>
                  <p className="text-xs text-gray-400">Group Admin</p>
                </div>
                <Crown className="h-4 w-4 text-yellow-500" />
              </div>

              {/* Contacts List */}
              <ScrollArea className="h-64 overflow-y-auto">
                <div className="space-y-2 pr-2">
                  {contacts.length > 0 ? (
                    contacts.map((contact) => (
                      <motion.div
                        key={contact.id}
                        className={`flex cursor-pointer items-center space-x-3 rounded-lg p-3 transition-colors hover:bg-gray-800 ${
                          selectedMembers.has(contact.id) ? "bg-blue-600/20 border border-blue-500/30" : ""
                        }`}
                        onClick={() => handleMemberToggle(contact.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={contact.avatar || "/placeholder.svg?height=40&width=40"} />
                          <AvatarFallback className="bg-gray-700">
                            {contact.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{contact.name}</p>
                          <p className="text-xs text-gray-400">{contact.email}</p>
                        </div>
                        <div className="flex items-center">
                          {selectedMembers.has(contact.id) ? (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center"
                            >
                              <Check className="h-4 w-4 text-white" />
                            </motion.div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-gray-600" />
                          )}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Users className="h-12 w-12 text-gray-600 mb-4" />
                      <p className="text-gray-400">No contacts available</p>
                      <p className="text-sm text-gray-500 mt-1">Add some contacts first</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Action Buttons */}
              <div className="flex justify-between space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("details")}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleCreateGroup}
                  disabled={isCreating}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  {isCreating ? "Creating..." : "Create Group"}
                  <Users className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
