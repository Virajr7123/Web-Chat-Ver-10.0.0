"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Camera, User, Bell, Palette } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ref, update, get } from "firebase/database"
import { database } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import ThemeSettings from "./theme-settings"

interface UserProfileDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function UserProfileDrawer({ open, onOpenChange }: UserProfileDrawerProps) {
  const { currentUser, userProfile, updateUserProfile } = useAuth()
  const [name, setName] = useState("")
  const [status, setStatus] = useState("")
  const [avatar, setAvatar] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const { toast } = useToast()

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "")
      setStatus(userProfile.status || "")
      setAvatar(userProfile.avatar || "")
    }
  }, [userProfile])

  const handleSaveProfile = async () => {
    if (!currentUser) return

    setIsLoading(true)
    try {
      const userRef = ref(database, `users/${currentUser.uid}`)
      await update(userRef, {
        name,
        status,
        avatar,
        updatedAt: Date.now(),
      })

      // Update contacts with new name
      const contactsRef = ref(database, "contacts")
      const contactsSnapshot = await get(contactsRef)
      if (contactsSnapshot.exists()) {
        const contactsData = contactsSnapshot.val()
        const updatePromises = []

        for (const userUid in contactsData) {
          if (contactsData[userUid][currentUser.uid]) {
            const contactRef = ref(database, `contacts/${userUid}/${currentUser.uid}`)
            updatePromises.push(update(contactRef, { name }))
          }
        }

        await Promise.all(updatePromises)
      }

      // Update local user profile
      updateUserProfile({ name, status, avatar })

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-background text-foreground border-border">
        <SheetHeader className="border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold">Settings</SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-100px)] mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted">
              <TabsTrigger
                value="profile"
                className="flex flex-col items-center py-3 px-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                <User className="h-4 w-4 mb-1" />
                <span className="text-xs font-medium">Profile</span>
              </TabsTrigger>
              <TabsTrigger
                value="notifications"
                className="flex flex-col items-center py-3 px-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                <Bell className="h-4 w-4 mb-1" />
                <span className="text-xs font-medium">Notifications</span>
              </TabsTrigger>
              <TabsTrigger
                value="theme"
                className="flex flex-col items-center py-3 px-2 data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                <Palette className="h-4 w-4 mb-1" />
                <span className="text-xs font-medium">Theme</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="profile" className="h-full mt-0">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={avatar || "/placeholder.svg?height=96&width=96"} />
                          <AvatarFallback className="text-2xl bg-muted">
                            {name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          size="icon"
                          className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                      <h3 className="mt-4 text-lg font-medium">{name || "User"}</h3>
                      <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="bg-muted border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Input
                          id="status"
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          placeholder="What's on your mind?"
                          className="bg-muted border-border"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="avatar">Avatar URL</Label>
                        <Input
                          id="avatar"
                          value={avatar}
                          onChange={(e) => setAvatar(e.target.value)}
                          placeholder="https://example.com/avatar.jpg"
                          className="bg-muted border-border"
                        />
                      </div>
                      <Button className="w-full" onClick={handleSaveProfile} disabled={isLoading}>
                        {isLoading ? "Saving..." : "Save Profile"}
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="notifications" className="h-full mt-0">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Message Notifications</h3>
                        <p className="text-sm text-muted-foreground">Get notified when you receive a message</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Group Notifications</h3>
                        <p className="text-sm text-muted-foreground">Get notified for group messages</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Sound</h3>
                        <p className="text-sm text-muted-foreground">Play sound for new messages</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Desktop Notifications</h3>
                        <p className="text-sm text-muted-foreground">Show notifications on desktop</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="theme" className="h-full mt-0">
                <ScrollArea className="h-full pr-4">
                  <ThemeSettings />
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
