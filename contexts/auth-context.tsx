"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth"
import { ref, set, get, onValue, update, onDisconnect, serverTimestamp } from "firebase/database"
import { database } from "@/lib/firebase"

export interface UserProfile {
  uid: string
  name: string
  email: string
  avatar?: string
  about?: string
  gender?: string
  createdAt: number
  lastSeen?: number
  isOnline?: boolean
}

interface AuthContextType {
  currentUser: User | null
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  isAccountTerminated: boolean
  login: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  updateUserProfile: (profile: UserProfile) => void
  clearTerminatedStatus: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAccountTerminated, setIsAccountTerminated] = useState(false)
  const auth = getAuth()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.email)
      setCurrentUser(user)

      if (user) {
        try {
          // Get user profile from database
          const userRef = ref(database, `users/${user.uid}`)
          const snapshot = await get(userRef)

          if (snapshot.exists()) {
            const profileData = snapshot.val()
            console.log("User profile loaded:", profileData)
            setUserProfile(profileData)
          } else {
            // Create a basic profile if it doesn't exist
            const newProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || user.email?.split("@")[0] || "User",
              email: user.email || "",
              avatar: user.photoURL || "",
              createdAt: Date.now(),
              lastSeen: Date.now(),
              isOnline: true,
            }

            await set(userRef, newProfile)
            setUserProfile(newProfile)
            console.log("New user profile created:", newProfile)
          }

          // Set user as online and set up disconnect handler
          const userStatusRef = ref(database, `users/${user.uid}`)

          // When user disconnects, update status to offline and record last seen time
          const onDisconnectRef = onDisconnect(userStatusRef)
          await onDisconnectRef.update({
            isOnline: false,
            lastSeen: serverTimestamp(),
          })

          // Set user as online
          await update(userStatusRef, {
            isOnline: true,
            lastSeen: serverTimestamp(),
          })

          // Listen for profile changes
          onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
              setUserProfile(snapshot.val())
            }
          })
        } catch (err) {
          console.error("Error fetching user profile:", err)
          setError("Failed to load user profile")
        }
      } else {
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [auth])

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    setIsAccountTerminated(false)

    try {
      console.log("🔐 Attempting login for:", email)
      await signInWithEmailAndPassword(auth, email, password)
      console.log("✅ Login successful")
    } catch (err: any) {
      console.log("❌ Login failed with error:", err)
      console.log("❌ Error code:", err.code)
      console.log("❌ Error message:", err.message)

      // Check for disabled account - MULTIPLE DETECTION METHODS
      const errorCode = err.code || ""
      const errorMessage = err.message || ""

      console.log("🔍 Checking if account is disabled...")
      console.log("🔍 Error code check:", errorCode === "auth/user-disabled")
      console.log("🔍 Error message includes 'user-disabled':", errorMessage.includes("user-disabled"))

      if (errorCode === "auth/user-disabled" || errorMessage.includes("user-disabled")) {
        console.log("🚨🚨🚨 ACCOUNT IS DISABLED - SETTING TERMINATED STATUS 🚨🚨🚨")
        setIsAccountTerminated(true)
        setError("ACCOUNT_TERMINATED")

        // Create a special error to throw
        const terminatedError = new Error("Account has been terminated by administrator")
        terminatedError.name = "ACCOUNT_TERMINATED"
        throw terminatedError
      }

      setError(err.message || "Failed to login")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true)
    setError(null)

    try {
      console.log("Attempting signup for:", email)
      const result = await createUserWithEmailAndPassword(auth, email, password)

      // Update display name
      await updateProfile(result.user, {
        displayName: name,
      })

      // Create user profile in database
      const userRef = ref(database, `users/${result.user.uid}`)
      const newProfile: UserProfile = {
        uid: result.user.uid,
        name: name,
        email: email,
        avatar: "",
        about: "",
        createdAt: Date.now(),
        lastSeen: Date.now(),
        isOnline: true,
      }

      await set(userRef, newProfile)
      console.log("Signup successful, profile created")
    } catch (err: any) {
      console.error("Registration error:", err)
      setError(err.message || "Failed to register")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    setError(null)

    try {
      // Set user as offline before logging out
      if (currentUser) {
        const userRef = ref(database, `users/${currentUser.uid}`)
        await update(userRef, {
          isOnline: false,
          lastSeen: Date.now(),
        })
      }

      await signOut(auth)
      console.log("Logout successful")
    } catch (err: any) {
      console.error("Logout error:", err)
      setError(err.message || "Failed to logout")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateUserProfile = (profile: UserProfile) => {
    setUserProfile(profile)
  }

  const clearTerminatedStatus = () => {
    setIsAccountTerminated(false)
    setError(null)
  }

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    isAccountTerminated,
    login,
    signUp,
    logout,
    updateUserProfile,
    clearTerminatedStatus,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
