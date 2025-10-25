"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { UserX, Mail, AlertTriangle, X } from "lucide-react"

interface AccountTerminatedModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToSignup: () => void
}

export default function AccountTerminatedModal({ isOpen, onClose, onSwitchToSignup }: AccountTerminatedModalProps) {
  const handleContactAdmin = () => {
    const subject = encodeURIComponent("Account Termination Appeal - Urgent")
    const body = encodeURIComponent(`Dear Administrator (Viraj Sawant),

I am writing to appeal the termination of my account. I believe this action may have been taken in error or I would like to understand the reasons behind this decision.

My account details:
- Email: [Your email here]
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
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card className="relative overflow-hidden border-red-800 bg-gradient-to-br from-red-950 via-gray-900 to-black text-white shadow-2xl">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 rounded-full p-1 text-gray-400 hover:bg-red-900/30 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <CardHeader className="text-center pb-4">
                {/* Animated warning icon */}
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-2xl font-bold text-red-400 mb-2"
                >
                  Account Terminated
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
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
                  transition={{ delay: 0.4 }}
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
                      If you believe this action was taken in error or would like to appeal this decision, please
                      contact the administrator or create a new account.
                    </p>
                  </div>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={handleContactAdmin}
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
                      onSwitchToSignup()
                      onClose()
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
                  transition={{ delay: 0.8 }}
                  className="text-center"
                >
                  <p className="text-xs text-gray-500">
                    This action was taken to maintain platform security and community standards.
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
