"use client"

import { useState } from "react"
import BlurText from "./blur-text"
import { motion } from "framer-motion"

interface IntroScreenProps {
  onAnimationComplete: () => void
}

export default function IntroScreen({ onAnimationComplete }: IntroScreenProps) {
  const [animationDone, setAnimationDone] = useState(false)

  const handleAnimationComplete = () => {
    setAnimationDone(true)
    setTimeout(() => {
      onAnimationComplete()
    }, 1000)
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <motion.div
        className="text-center"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <BlurText
          text="CHIT CHAT !"
          delay={150}
          animateBy="letters"
          direction="top"
          onAnimationComplete={handleAnimationComplete}
          className="text-5xl font-bold tracking-wider md:text-7xl"
        />

        {animationDone && (
          <motion.p
            className="mt-4 text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Connect with friends instantly
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}
