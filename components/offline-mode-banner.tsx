"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { WifiOff, X } from "lucide-react"

export default function OfflineModeBanner() {
  const [dismissed, setDismissed] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    // Check if we're having Firebase permission issues
    const checkFirebasePermission = async () => {
      try {
        // We'll set a timeout to avoid waiting too long
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout")), 3000)
        })

        // This is just a simple check that will fail if permissions are wrong
        const testFetch = fetch("https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo")

        await Promise.race([testFetch, timeoutPromise])
        setIsOffline(false)
      } catch (error) {
        console.log("Firebase permission check failed, assuming offline mode")
        setIsOffline(true)
      }
    }

    checkFirebasePermission()
  }, [])

  if (dismissed || !isOffline) return null

  return (
    <Alert className="mx-4 mt-4 border-blue-600 bg-blue-950/30 text-blue-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <WifiOff className="mt-1 h-4 w-4" />
          <div className="ml-2">
            <AlertTitle className="text-lg font-semibold">Limited Functionality Mode</AlertTitle>
            <AlertDescription className="mt-2">
              <p>
                The app is currently running with limited functionality due to Firebase permission issues. Some features
                like message history and contact synchronization may not work properly.
              </p>
              <p className="mt-2">
                You can still use basic features like adding contacts and sending messages, but they may not be saved
                permanently.
              </p>
              <div className="mt-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-600/50 bg-transparent text-blue-200 hover:bg-blue-900/50"
                  onClick={() => setDismissed(true)}
                >
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-200 hover:bg-blue-900/50"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  )
}
