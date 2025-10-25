"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import { useState, useEffect } from "react"

export default function FirebaseSetupGuide() {
  const [dismissed, setDismissed] = useState(true)
  const [isSetupComplete, setIsSetupComplete] = useState(false)

  useEffect(() => {
    // Simulate checking if Firebase setup is complete (replace with actual logic)
    const checkSetup = async () => {
      // For now, just set it to true after a short delay
      setTimeout(() => {
        setIsSetupComplete(true)
      }, 2000)
    }

    checkSetup()
  }, [])

  if (dismissed) return null

  return (
    <Alert className="mx-4 mt-4 border-green-600 bg-green-950/30 text-green-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          {isSetupComplete ? <CheckCircle className="mt-1 h-4 w-4" /> : <XCircle className="mt-1 h-4 w-4" />}
          <div className="ml-2">
            <AlertTitle className="text-lg font-semibold">Firebase Setup Guide</AlertTitle>
            <AlertDescription className="mt-2">
              {isSetupComplete ? (
                <>
                  <p>Firebase setup is complete! You're ready to start chatting.</p>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-600/50 bg-transparent text-green-200 hover:bg-green-900/50"
                      onClick={() => setDismissed(true)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    It looks like Firebase is not properly configured. Please ensure you have set up your Firebase
                    project and configured the necessary rules.
                  </p>
                  <p className="mt-2">Refer to the documentation for detailed instructions on setting up Firebase.</p>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-600/50 bg-transparent text-green-200 hover:bg-green-900/50"
                      onClick={() => setDismissed(true)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </>
              )}
            </AlertDescription>
          </div>
        </div>
      </div>
    </Alert>
  )
}
