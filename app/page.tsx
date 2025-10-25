"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import AuthScreen from "@/components/auth-screen"
import ChatInterface from "@/components/chat-interface"
import LoadingScreen from "@/components/loading-screen"
import DebugUnread from "@/components/debug-unread"

export default function Home() {
  const { currentUser, userProfile, loading } = useAuth()

  // Set background color for the entire app
  useEffect(() => {
    document.body.style.backgroundColor = "black"
    return () => {
      document.body.style.backgroundColor = ""
    }
  }, [])

  console.log("App state:", {
    currentUser: currentUser?.email,
    userProfile: userProfile?.name,
    loading,
  })

  if (loading) {
    return <LoadingScreen />
  }

  if (!currentUser || !userProfile) {
    return <AuthScreen />
  }

  return (
    <>
      <ChatInterface />
      <DebugUnread />
    </>
  )
}
