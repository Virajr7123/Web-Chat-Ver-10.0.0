"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Mail,
  Lock,
  User,
  AlertCircle,
  X,
  UserX,
  AlertTriangle,
  Sparkles,
  MessageCircle,
  CheckCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { validateEmailOnServer } from "@/lib/email-validation"

// Strict email validation utility
const validateEmailExists = async (email: string): Promise<{ isValid: boolean; message: string }> => {
  try {
    // Basic format validation first
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(email)) {
      return { isValid: false, message: "Invalid email format" }
    }

    const domain = email.split("@")[1].toLowerCase()
    const localPart = email.split("@")[0]

    // Check local part length and validity
    if (localPart.length < 1 || localPart.length > 64) {
      return { isValid: false, message: "Email address is invalid" }
    }

    // Block obviously fake domains
    const fakeDomains = [
      "test.com",
      "example.com",
      "fake.com",
      "dummy.com",
      "invalid.com",
      "notreal.com",
      "fakemail.com",
      "nomail.com",
      "xxx.com",
      "yyy.com",
      "zzz.com",
      "abc.com",
      "123.com",
      "asdf.com",
      "qwerty.com",
      "temp.com",
      "trash.com",
      "junk.com",
    ]

    // Block disposable/temporary email domains
    const disposableDomains = [
      "10minutemail.com",
      "tempmail.org",
      "guerrillamail.com",
      "mailinator.com",
      "yopmail.com",
      "temp-mail.org",
      "throwaway.email",
      "getnada.com",
      "maildrop.cc",
      "sharklasers.com",
      "guerrillamailblock.com",
      "pokemail.net",
      "spam4.me",
      "bccto.me",
      "chacuo.net",
      "dispostable.com",
      "fakeinbox.com",
      "tempail.com",
      "10minutemail.net",
      "20minutemail.com",
      "emailondeck.com",
      "getairmail.com",
      "harakirimail.com",
      "jetable.org",
      "mytrashmail.com",
      "neverbox.com",
      "sogetthis.com",
      "spamherald.com",
      "spamhole.com",
      "tempemail.com",
      "trashmail.org",
      "wegwerfmail.de",
      "zehnminutenmail.de",
    ]

    if (fakeDomains.includes(domain) || disposableDomains.includes(domain)) {
      return { isValid: false, message: "This email domain is not allowed" }
    }

    // Only allow well-known, legitimate email providers
    const trustedDomains = [
      // Major providers
      "gmail.com",
      "googlemail.com",
      "yahoo.com",
      "yahoo.co.uk",
      "yahoo.ca",
      "yahoo.com.au",
      "hotmail.com",
      "hotmail.co.uk",
      "hotmail.fr",
      "outlook.com",
      "outlook.fr",
      "live.com",
      "live.co.uk",
      "live.fr",
      "msn.com",
      "aol.com",
      "aol.co.uk",
      "icloud.com",
      "me.com",
      "mac.com",

      // Business/Professional
      "protonmail.com",
      "proton.me",
      "tutanota.com",
      "zoho.com",
      "fastmail.com",
      "hey.com",
      "mail.com",
      "gmx.com",
      "gmx.de",
      "web.de",
      "yandex.com",
      "yandex.ru",
      "mail.ru",
      "rambler.ru",

      // Regional providers
      "rediffmail.com",
      "indiatimes.com",
      "sify.com",
      "vsnl.com",
      "naver.com",
      "daum.net",
      "hanmail.net",
      "qq.com",
      "163.com",
      "126.com",
      "sina.com",
      "sohu.com",
      "orange.fr",
      "laposte.net",
      "free.fr",
      "wanadoo.fr",
      "t-online.de",
      "arcor.de",
      "freenet.de",
      "libero.it",
      "virgilio.it",
      "tiscali.it",
      "terra.com.br",
      "uol.com.br",
      "globo.com",
      "ig.com.br",
      "bol.com.br",
    ]

    // Check if domain is in trusted list
    if (trustedDomains.includes(domain)) {
      return { isValid: true, message: "Email verified successfully" }
    }

    // For domains not in trusted list, do additional validation
    // Check if it looks like a legitimate business domain
    const domainParts = domain.split(".")

    // Must have at least 2 parts (domain.tld)
    if (domainParts.length < 2) {
      return { isValid: false, message: "Invalid email domain" }
    }

    // Check TLD validity
    const tld = domainParts[domainParts.length - 1]
    const validTlds = [
      "com",
      "org",
      "net",
      "edu",
      "gov",
      "mil",
      "int",
      "co",
      "io",
      "ai",
      "app",
      "dev",
      "tech",
      "info",
      "biz",
      "name",
      "pro",
      "mobi",
      "tel",
      "travel",
      "uk",
      "us",
      "ca",
      "au",
      "de",
      "fr",
      "it",
      "es",
      "nl",
      "be",
      "ch",
      "at",
      "se",
      "no",
      "dk",
      "fi",
      "pl",
      "cz",
      "hu",
      "ro",
      "bg",
      "hr",
      "si",
      "sk",
      "ru",
      "ua",
      "by",
      "kz",
      "uz",
      "kg",
      "tj",
      "tm",
      "jp",
      "kr",
      "cn",
      "hk",
      "tw",
      "sg",
      "my",
      "th",
      "vn",
      "ph",
      "id",
      "in",
      "pk",
      "bd",
      "lk",
      "np",
      "br",
      "ar",
      "cl",
      "co",
      "pe",
      "ve",
      "mx",
      "cr",
      "za",
      "ng",
      "ke",
      "gh",
      "eg",
      "ma",
      "tn",
      "dz",
    ]

    if (!validTlds.includes(tld)) {
      return { isValid: false, message: "Email domain extension is not recognized" }
    }

    // Check domain name validity
    const domainName = domainParts[domainParts.length - 2]
    if (domainName.length < 2 || domainName.length > 63) {
      return { isValid: false, message: "Invalid email domain" }
    }

    // Block domains that look suspicious
    const suspiciousPatterns = [
      /^[0-9]+$/, // All numbers
      /^[a-z]{1,2}$/, // Too short
      /test|fake|dummy|temp|trash|spam|junk|invalid/i,
      /^(a+|b+|c+|x+|y+|z+)$/i, // Repeated characters
    ]

    if (suspiciousPatterns.some((pattern) => pattern.test(domainName))) {
      return { isValid: false, message: "Email domain appears to be invalid" }
    }

    const apiValidation = await validateEmailOnServer(email)
    if (!apiValidation.isValid) {
      return apiValidation
    }

    // For unknown domains, be more restrictive
    // Only allow if it looks like a legitimate business domain
    if (domainParts.length >= 2 && domainName.length >= 3) {
      // Additional check: domain should not contain suspicious patterns
      if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(domainName)) {
        return { isValid: false, message: "Email domain format is invalid" }
      }

      // For now, be strict and only allow known domains
      return { isValid: false, message: "Please use a recognized email provider (Gmail, Yahoo, Outlook, etc.)" }
    }

    return { isValid: false, message: "Email domain is not recognized" }
  } catch (error) {
    console.error("Email validation error:", error)
    // Default to invalid when validation fails
    return { isValid: false, message: "Could not validate email address" }
  }
}

// Floating particles component
const FloatingParticles = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          transition={{
            duration: Math.random() * 20 + 10,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

// Interactive animated background with cursor following
const AnimatedBackground = ({
  isHovering,
  mouseX,
  mouseY,
}: { isHovering: boolean; mouseX: number; mouseY: number }) => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"
        animate={{
          background: [
            "linear-gradient(45deg, #000000, #1a1a1a, #000000)",
            "linear-gradient(135deg, #000000, #2a2a2a, #000000)",
            "linear-gradient(225deg, #000000, #1a1a1a, #000000)",
            "linear-gradient(315deg, #000000, #2a2a2a, #000000)",
          ],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      {/* First light orb - follows cursor when hovering outside */}
      <motion.div
        className="absolute w-96 h-96 bg-white/5 rounded-full blur-3xl"
        animate={
          isHovering
            ? {
                x: mouseX - 192, // Center the orb on cursor (96*2 = 192)
                y: mouseY - 192,
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.7, 0.3],
              }
            : {
                x: [window.innerWidth * 0.25 - 192, window.innerWidth * 0.75 - 192, window.innerWidth * 0.25 - 192],
                y: [window.innerHeight * 0.25 - 192, window.innerHeight * 0.25 - 192, window.innerHeight * 0.25 - 192],
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }
        }
        transition={
          isHovering
            ? {
                type: "spring",
                stiffness: 150,
                damping: 20,
                scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                opacity: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
              }
            : {
                duration: 6,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }
        }
      />

      {/* Second light orb - counter-follows cursor for dynamic effect */}
      <motion.div
        className="absolute w-80 h-80 bg-gray-500/10 rounded-full blur-3xl"
        animate={
          isHovering
            ? {
                x: window.innerWidth - mouseX - 160, // Opposite side effect
                y: window.innerHeight - mouseY - 160,
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.6, 0.2],
              }
            : {
                x: [window.innerWidth * 0.75 - 160, window.innerWidth * 0.25 - 160, window.innerWidth * 0.75 - 160],
                y: [window.innerHeight * 0.75 - 160, window.innerHeight * 0.75 - 160, window.innerHeight * 0.75 - 160],
                scale: [1.2, 1, 1.2],
                opacity: [0.2, 0.4, 0.2],
              }
        }
        transition={
          isHovering
            ? {
                type: "spring",
                stiffness: 100,
                damping: 25,
                scale: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                opacity: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
              }
            : {
                duration: 8,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 2,
              }
        }
      />

      {/* Additional cursor-reactive light */}
      {isHovering && (
        <motion.div
          className="absolute w-32 h-32 bg-white/10 rounded-full blur-2xl"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            x: mouseX - 64,
            y: mouseY - 64,
            opacity: [0, 0.8, 0],
            scale: [0.5, 1.5, 0.5],
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 30,
            opacity: { duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
            scale: { duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
          }}
        />
      )}
    </div>
  )
}

export default function AuthScreen() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")
  const loginFormRef = useRef<HTMLFormElement>(null)
  const signupFormRef = useRef<HTMLFormElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const { login, signUp, loading, isAccountTerminated, clearTerminatedStatus } = useAuth()
  const { toast } = useToast()

  // Mouse tracking states
  const [isDesktop, setIsDesktop] = useState(false)
  const [isHoveringOutside, setIsHoveringOutside] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [error, setError] = useState("")

  // Email validation states
  const [emailValidation, setEmailValidation] = useState<{
    isValidating: boolean
    isValid: boolean | null
    message: string
  }>({
    isValidating: false,
    isValid: null,
    message: "",
  })

  // Detect if device supports hover (desktop)
  useEffect(() => {
    const checkIfDesktop = () => {
      setIsDesktop(window.matchMedia("(hover: hover) and (pointer: fine)").matches)
    }

    checkIfDesktop()
    window.addEventListener("resize", checkIfDesktop)

    return () => window.removeEventListener("resize", checkIfDesktop)
  }, [])

  // Mouse tracking for desktop
  useEffect(() => {
    if (!isDesktop) return

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })

      // Check if mouse is outside the card
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        const isOutside =
          e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom

        setIsHoveringOutside(isOutside)
      }
    }

    const handleMouseLeave = () => {
      setIsHoveringOutside(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [isDesktop])

  // Email validation with debounce
  useEffect(() => {
    if (!signupEmail || activeTab !== "signup") {
      setEmailValidation({ isValidating: false, isValid: null, message: "" })
      return
    }

    const timeoutId = setTimeout(async () => {
      setEmailValidation({ isValidating: true, isValid: null, message: "Validating email..." })

      try {
        const validation = await validateEmailExists(signupEmail)
        setEmailValidation({
          isValidating: false,
          isValid: validation.isValid,
          message: validation.message,
        })
      } catch (error) {
        setEmailValidation({
          isValidating: false,
          isValid: false,
          message: "Could not validate email. Please use a recognized email provider.",
        })
      }
    }, 1000) // 1 second debounce

    return () => clearTimeout(timeoutId)
  }, [signupEmail, activeTab])

  // Watch for account termination status from auth context
  useEffect(() => {
    if (isAccountTerminated) {
      console.log("🚨 ACCOUNT TERMINATED STATUS DETECTED - MODAL SHOULD SHOW 🚨")
      toast({
        title: "Account Terminated",
        description: "Your account has been disabled by the administrator.",
        variant: "destructive",
      })
    }
  }, [isAccountTerminated, toast])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      console.log("🔐 Starting login process...")
      await login(loginEmail, loginPassword)
      console.log("✅ Login completed successfully")
    } catch (err: any) {
      console.error("❌ Login failed in component:", err)

      // Check if it's a termination error
      if (err.name === "ACCOUNT_TERMINATED") {
        console.log("🚨 TERMINATION ERROR CAUGHT IN COMPONENT 🚨")
        // The modal will show automatically because isAccountTerminated is now true
        return
      }

      setError(err.message || "Failed to login. Please check your credentials.")
      toast({
        title: "Login Failed",
        description: err.message || "Failed to login. Please check your credentials.",
        variant: "destructive",
      })
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate email first
    if (emailValidation.isValid === false) {
      setError(emailValidation.message)
      toast({
        title: "Invalid Email",
        description: emailValidation.message,
        variant: "destructive",
      })
      return
    }

    // If email is still being validated, wait
    if (emailValidation.isValidating) {
      setError("Please wait while we validate your email address")
      return
    }

    // If email validation is null (not validated yet), validate now
    if (emailValidation.isValid === null && signupEmail) {
      setError("Please wait for email validation to complete")
      try {
        const validation = await validateEmailExists(signupEmail)
        if (!validation.isValid) {
          setError(validation.message)
          toast({
            title: "Invalid Email",
            description: validation.message,
            variant: "destructive",
          })
          return
        }
      } catch (error) {
        setError("Could not validate email. Please use a recognized email provider.")
        return
      }
    }

    // Must have valid email to proceed
    if (emailValidation.isValid !== true) {
      setError("Please enter a valid email address from a recognized provider")
      return
    }

    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    try {
      console.log("Signup attempt:", signupEmail)
      await signUp(signupEmail, signupPassword, signupName)
      console.log("Signup successful")

      toast({
        title: "Account Created Successfully!",
        description: "Welcome to Chit Chat! You can now start chatting.",
        variant: "default",
      })
    } catch (err: any) {
      console.error("Signup error:", err)
      setError(err.message || "Failed to create account. Please try again.")
      toast({
        title: "Signup Failed",
        description: err.message || "Failed to create account. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCloseTerminatedModal = () => {
    console.log("🔄 Closing termination modal")
    clearTerminatedStatus()
  }

  return (
    <>
      <div className="fixed inset-0 flex items-center justify-center overflow-hidden">
        {/* Interactive Animated Background */}
        <AnimatedBackground
          isHovering={isDesktop && isHoveringOutside}
          mouseX={mousePosition.x}
          mouseY={mousePosition.y}
        />

        {/* Floating Particles */}
        <FloatingParticles />

        {/* Main Content - Centered and Constrained */}
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.46, 0.45, 0.94],
            staggerChildren: 0.1,
          }}
          className="relative z-10 w-full max-w-md mx-4 max-h-[95vh] flex flex-col"
        >
          {/* Enhanced glowing border effect that reacts to cursor */}
          <motion.div
            className="absolute inset-0 rounded-2xl blur-xl opacity-30"
            animate={
              isDesktop && isHoveringOutside
                ? {
                    background: [
                      "linear-gradient(45deg, rgba(255,255,255,0.2), rgba(156,163,175,0.2), rgba(255,255,255,0.2))",
                      "linear-gradient(135deg, rgba(255,255,255,0.3), rgba(156,163,175,0.3), rgba(255,255,255,0.3))",
                      "linear-gradient(225deg, rgba(255,255,255,0.2), rgba(156,163,175,0.2), rgba(255,255,255,0.2))",
                    ],
                  }
                : {
                    background: [
                      "linear-gradient(0deg, rgba(255,255,255,0.2), rgba(156,163,175,0.2), rgba(255,255,255,0.2))",
                      "linear-gradient(120deg, rgba(255,255,255,0.2), rgba(156,163,175,0.2), rgba(255,255,255,0.2))",
                      "linear-gradient(240deg, rgba(255,255,255,0.2), rgba(156,163,175,0.2), rgba(255,255,255,0.2))",
                    ],
                  }
            }
            transition={{
              duration: isDesktop && isHoveringOutside ? 2 : 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          <Card className="relative overflow-hidden border border-gray-700/50 bg-black/80 backdrop-blur-xl text-white shadow-2xl flex flex-col max-h-full">
            {/* Header - Fixed at top */}
            <CardHeader className="text-center relative flex-shrink-0 pb-4">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex items-center justify-center gap-3 mb-3"
              >
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    rotate: { duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                    scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                  }}
                  className="p-2 bg-gradient-to-br from-white/20 to-gray-500/20 rounded-full"
                >
                  <MessageCircle className="h-6 w-6 text-white" />
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent mb-2">
                  CHIT CHAT
                </CardTitle>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mb-3"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="space-y-1"
              >
                <CardDescription className="text-gray-300 text-base font-medium">
                  Connect • Chat • Create Memories
                </CardDescription>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="flex items-center justify-center gap-2 text-xs text-gray-400"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Made with ❤️ by Virajr7123</span>
                  <Sparkles className="h-3 w-3" />
                </motion.div>

                {/* Desktop interaction hint */}
                {isDesktop && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="text-xs text-gray-500 mt-2"
                  >
                    💡 Move your cursor outside to control the lights
                  </motion.div>
                )}
              </motion.div>
            </CardHeader>

            {/* Tabs and Content - Scrollable */}
            <div className="relative flex-1 flex flex-col min-h-0">
              {/* Tab Headers - Fixed */}
              <div className="grid grid-cols-2 border-b border-gray-700/50 relative flex-shrink-0">
                <motion.button
                  className={`relative py-3 text-center font-semibold transition-all duration-300 ${
                    activeTab === "login" ? "text-white" : "text-gray-400 hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("login")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Welcome Back
                  {activeTab === "login" && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-white/50 via-white to-white/50 rounded-full"
                      layoutId="activeTab"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
                <motion.button
                  className={`relative py-3 text-center font-semibold transition-all duration-300 ${
                    activeTab === "signup" ? "text-white" : "text-gray-400 hover:text-gray-300"
                  }`}
                  onClick={() => setActiveTab("signup")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Join Community
                  {activeTab === "signup" && (
                    <motion.div
                      className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-white/50 via-white to-white/50 rounded-full"
                      layoutId="activeTab"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              </div>

              {/* Error message - Fixed */}
              <AnimatePresence>
                {error && !isAccountTerminated && error !== "ACCOUNT_TERMINATED" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="mx-6 mt-3 flex items-center gap-3 rounded-lg bg-red-900/30 border border-red-700/50 p-3 text-sm text-red-300 backdrop-blur-sm flex-shrink-0"
                  >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden">
                <div className="relative">
                  <AnimatePresence mode="wait">
                    {activeTab === "login" ? (
                      <motion.div
                        key="login"
                        initial={{ x: -300, opacity: 0, rotateY: -90 }}
                        animate={{ x: 0, opacity: 1, rotateY: 0 }}
                        exit={{ x: -300, opacity: 0, rotateY: -90 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          opacity: { duration: 0.2 },
                        }}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <form ref={loginFormRef} onSubmit={handleLogin}>
                          <CardContent className="space-y-5 pt-6 px-6">
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="text-center mb-4"
                            >
                              <h3 className="text-lg font-semibold text-gray-200 mb-1">
                                Ready to continue your journey?
                              </h3>
                              <p className="text-gray-400 text-sm">Sign in to access your conversations</p>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                              className="space-y-2"
                            >
                              <Label htmlFor="email" className="text-gray-300 font-medium">
                                Email Address
                              </Label>
                              <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-white" />
                                <Input
                                  id="email"
                                  type="email"
                                  placeholder="Enter your email"
                                  className="border-gray-600 bg-gray-800/50 backdrop-blur-sm pl-10 h-11 text-white placeholder:text-gray-500 focus:border-white/50 focus:bg-gray-800/70 transition-all duration-300"
                                  value={loginEmail}
                                  onChange={(e) => setLoginEmail(e.target.value)}
                                  required
                                  disabled={loading}
                                />
                              </div>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                              className="space-y-2"
                            >
                              <Label htmlFor="password" className="text-gray-300 font-medium">
                                Password
                              </Label>
                              <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-white" />
                                <Input
                                  id="password"
                                  type="password"
                                  placeholder="Enter your password"
                                  className="border-gray-600 bg-gray-800/50 backdrop-blur-sm pl-10 h-11 text-white placeholder:text-gray-500 focus:border-white/50 focus:bg-gray-800/70 transition-all duration-300"
                                  value={loginPassword}
                                  onChange={(e) => setLoginPassword(e.target.value)}
                                  required
                                  disabled={loading}
                                />
                              </div>
                            </motion.div>
                          </CardContent>

                          <CardFooter className="px-6 pb-6">
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.4 }}
                              className="w-full"
                            >
                              <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-white to-gray-200 text-black font-semibold hover:from-gray-100 hover:to-white transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                              >
                                {loading ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                                  />
                                ) : (
                                  "Sign In to Continue"
                                )}
                              </Button>
                            </motion.div>
                          </CardFooter>
                        </form>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="signup"
                        initial={{ x: 300, opacity: 0, rotateY: 90 }}
                        animate={{ x: 0, opacity: 1, rotateY: 0 }}
                        exit={{ x: 300, opacity: 0, rotateY: 90 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          opacity: { duration: 0.2 },
                        }}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <form ref={signupFormRef} onSubmit={handleSignup}>
                          <CardContent className="space-y-4 pt-6 px-6">
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className="text-center mb-4"
                            >
                              <h3 className="text-lg font-semibold text-gray-200 mb-1">
                                Start your conversation journey
                              </h3>
                              <p className="text-gray-400 text-sm">
                                Use Gmail, Yahoo, Outlook or other trusted providers
                              </p>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 }}
                              className="space-y-2"
                            >
                              <Label htmlFor="name" className="text-gray-300 font-medium">
                                Full Name
                              </Label>
                              <div className="relative group">
                                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-white" />
                                <Input
                                  id="name"
                                  placeholder="Enter your full name"
                                  className="border-gray-600 bg-gray-800/50 backdrop-blur-sm pl-10 h-11 text-white placeholder:text-gray-500 focus:border-white/50 focus:bg-gray-800/70 transition-all duration-300"
                                  value={signupName}
                                  onChange={(e) => setSignupName(e.target.value)}
                                  required
                                  disabled={loading}
                                />
                              </div>
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 }}
                              className="space-y-2"
                            >
                              <Label htmlFor="signup-email" className="text-gray-300 font-medium">
                                Email Address
                              </Label>
                              <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-white" />
                                <Input
                                  id="signup-email"
                                  type="email"
                                  placeholder="Enter your email (Gmail, Yahoo, Outlook, etc.)"
                                  className={`border-gray-600 bg-gray-800/50 backdrop-blur-sm pl-10 pr-10 h-11 text-white placeholder:text-gray-500 focus:border-white/50 focus:bg-gray-800/70 transition-all duration-300 ${
                                    emailValidation.isValid === false
                                      ? "border-red-500/50"
                                      : emailValidation.isValid === true
                                        ? "border-green-500/50"
                                        : ""
                                  }`}
                                  value={signupEmail}
                                  onChange={(e) => setSignupEmail(e.target.value)}
                                  required
                                  disabled={loading}
                                />
                                {/* Email validation indicator */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  {emailValidation.isValidating && (
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                      className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full"
                                    />
                                  )}
                                  {emailValidation.isValid === true && (
                                    <CheckCircle className="h-4 w-4 text-green-400" />
                                  )}
                                  {emailValidation.isValid === false && (
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                  )}
                                </div>
                              </div>
                              {/* Email validation message */}
                              {emailValidation.message && (
                                <motion.p
                                  initial={{ opacity: 0, y: -5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`text-xs flex items-center gap-1 ${
                                    emailValidation.isValid === false
                                      ? "text-red-400"
                                      : emailValidation.isValid === true
                                        ? "text-green-400"
                                        : "text-gray-400"
                                  }`}
                                >
                                  {emailValidation.isValid === true && <CheckCircle className="h-3 w-3" />}
                                  {emailValidation.isValid === false && <AlertCircle className="h-3 w-3" />}
                                  {emailValidation.message}
                                </motion.p>
                              )}
                            </motion.div>

                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 }}
                              className="space-y-2"
                            >
                              <Label htmlFor="signup-password" className="text-gray-300 font-medium">
                                Password
                              </Label>
                              <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-white" />
                                <Input
                                  id="signup-password"
                                  type="password"
                                  placeholder="Create a secure password"
                                  className="border-gray-600 bg-gray-800/50 backdrop-blur-sm pl-10 h-11 text-white placeholder:text-gray-500 focus:border-white/50 focus:bg-gray-800/70 transition-all duration-300"
                                  value={signupPassword}
                                  onChange={(e) => setSignupPassword(e.target.value)}
                                  required
                                  disabled={loading}
                                />
                              </div>
                              <p className="text-xs text-gray-400 flex items-center gap-1">
                                <Lock className="h-3 w-3" />
                                Password must be at least 6 characters
                              </p>
                            </motion.div>
                          </CardContent>

                          <CardFooter className="px-6 pb-6">
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                              className="w-full"
                            >
                              <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-white to-gray-200 text-black font-semibold hover:from-gray-100 hover:to-white transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || emailValidation.isValidating || emailValidation.isValid !== true}
                              >
                                {loading ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full"
                                  />
                                ) : emailValidation.isValidating ? (
                                  "Validating Email..."
                                ) : emailValidation.isValid !== true ? (
                                  "Enter Valid Email First"
                                ) : (
                                  "Create Your Account"
                                )}
                              </Button>
                            </motion.div>
                          </CardFooter>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Enhanced Account Terminated Modal - Keep existing modal code unchanged */}
      {(isAccountTerminated || error === "ACCOUNT_TERMINATED") && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-md"
          >
            <Card className="relative overflow-hidden border-red-800 bg-gradient-to-br from-red-950 via-gray-900 to-black text-white shadow-2xl">
              {/* Close button */}
              <button
                onClick={handleCloseTerminatedModal}
                className="absolute right-4 top-4 z-10 rounded-full p-1 text-gray-400 hover:bg-red-900/30 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <CardHeader className="text-center pb-4">
                {/* Warning icon with pulsing animation */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                  }}
                  className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-600/20 border-2 border-red-500"
                >
                  <UserX className="h-10 w-10 text-red-400" />
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-red-400 mb-2"
                >
                  Account Terminated
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-2 text-yellow-400"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-medium">Administrative Action</span>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Main message */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="text-center space-y-4"
                >
                  <div className="bg-red-900/30 border border-red-800 rounded-lg p-4">
                    <p className="text-red-200 font-medium mb-2">
                      Your account has been terminated by the Administrator
                    </p>
                    <p className="text-red-300 text-sm">
                      <span className="font-semibold">Administrator:</span> Viraj Sawant
                    </p>
                    <p className="text-red-300 text-sm">
                      <span className="font-semibold">Reason:</span> Due to Personal Reasons
                    </p>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Create a new account or Mail the Administrator (sawantviraj976@gmail.com)
                    </p>
                  </div>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={() => {
                      const subject = encodeURIComponent("Account Termination Appeal - Urgent")
                      const body = encodeURIComponent(`Dear Administrator (Viraj Sawant),

I am writing to appeal the termination of my account. I believe this action may have been taken in error or I would like to understand the reasons behind this decision.

My account details:
- Email: ${loginEmail || "[Your email here]"}
- Date of termination notice: ${new Date().toLocaleDateString()}

I respectfully request:
1. A review of my account termination
2. Information about the specific reasons for termination
3. Possibility of account restoration if appropriate

I am committed to following all platform guidelines and would appreciate the opportunity to resolve any issues.

Thank you for your time and consideration.

Best regards,
[Your name]`)

                      window.open(`mailto:sawantviraj976@gmail.com?subject=${subject}&body=${body}`)
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 transition-all duration-200 hover:scale-[1.02]"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Administrator
                  </Button>

                  <div className="text-center text-xs text-gray-400">sawantviraj976@gmail.com</div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-gray-900 px-2 text-gray-400">or</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      console.log("Switching to signup and closing modal")
                      setActiveTab("signup")
                      handleCloseTerminatedModal()
                    }}
                    variant="outline"
                    className="w-full border-gray-600 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 transition-all duration-200 hover:scale-[1.02]"
                  >
                    Create New Account
                  </Button>
                </motion.div>

                {/* Footer note */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="text-center"
                >
                  <p className="text-xs text-gray-500">
                    This action was taken to maintain platform security and community standards.
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </>
  )
}
