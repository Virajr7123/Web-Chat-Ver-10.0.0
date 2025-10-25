"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Play, Pause, Trash2, Send, Square } from "lucide-react"
import { useTheme } from "@/contexts/theme-context"

interface VoiceRecorderProps {
  onSendVoice: (audioBlob: Blob, duration: number) => void
  onCancel: () => void
  isVisible: boolean
}

export default function VoiceRecorder({ onSendVoice, onCancel, isVisible }: VoiceRecorderProps) {
  const { currentTheme } = useTheme()
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [hasRecording, setHasRecording] = useState(false)
  const [permissionError, setPermissionError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<Blob[]>([])

  // Cleanup function
  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    chunksRef.current = []
  }

  // Initialize recording
  const startRecording = async () => {
    try {
      setPermissionError(null)

      // Request microphone permission with better constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1,
        },
      })

      streamRef.current = stream
      chunksRef.current = []

      // Create MediaRecorder with better codec support
      const options = { mimeType: "audio/webm;codecs=opus" }
      let mediaRecorder: MediaRecorder

      try {
        mediaRecorder = new MediaRecorder(stream, options)
      } catch (e) {
        // Fallback for browsers that don't support webm/opus
        mediaRecorder = new MediaRecorder(stream)
      }

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        })
        setAudioBlob(blob)

        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
        setHasRecording(true)

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      setRecordingTime(0)

      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          setPermissionError("Microphone access denied. Please allow microphone access and try again.")
        } else if (error.name === "NotFoundError") {
          setPermissionError("No microphone found. Please connect a microphone and try again.")
        } else {
          setPermissionError("Error accessing microphone. Please check your microphone settings.")
        }
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setIsRecording(false)
    setIsPaused(false)
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.pause()
      setIsPaused(true)

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      mediaRecorderRef.current.resume()
      setIsPaused(false)

      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    }
  }

  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setHasRecording(false)
    setRecordingTime(0)
    setIsPlaying(false)
  }

  const sendRecording = () => {
    if (audioBlob) {
      onSendVoice(audioBlob, recordingTime)
      cleanup()
      setAudioBlob(null)
      setAudioUrl(null)
      setHasRecording(false)
      setRecordingTime(0)
      setIsPlaying(false)
    }
  }

  const handleCancel = () => {
    cleanup()
    deleteRecording()
    onCancel()
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  // Handle audio playback events
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current

      const handleEnded = () => setIsPlaying(false)
      const handlePause = () => setIsPlaying(false)

      audio.addEventListener("ended", handleEnded)
      audio.addEventListener("pause", handlePause)

      return () => {
        audio.removeEventListener("ended", handleEnded)
        audio.removeEventListener("pause", handlePause)
      }
    }
  }, [audioUrl])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border p-4 shadow-lg"
        style={{
          backgroundColor: currentTheme.colors.card ? `hsl(${currentTheme.colors.card})` : undefined,
          borderColor: currentTheme.colors.border ? `hsl(${currentTheme.colors.border})` : undefined,
        }}
      >
        {/* Audio element for playback */}
        {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

        {permissionError ? (
          <div className="text-center">
            <p className="text-red-500 text-sm mb-4">{permissionError}</p>
            <div className="flex justify-center space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setPermissionError(null)
                  startRecording()
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            {/* Recording Status */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                {isRecording && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                    className="w-3 h-3 bg-red-500 rounded-full"
                  />
                )}
                <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
              </div>

              <p className="text-sm text-muted-foreground">
                {!hasRecording && !isRecording && "Tap to start recording"}
                {isRecording && !isPaused && "Recording..."}
                {isRecording && isPaused && "Recording paused"}
                {hasRecording && !isRecording && "Recording ready to send"}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center space-x-4">
              {!hasRecording ? (
                <>
                  {/* Cancel Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCancel}
                    className="h-12 w-12 rounded-full bg-transparent"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>

                  {/* Record/Stop Button */}
                  {!isRecording ? (
                    <Button
                      size="icon"
                      onClick={startRecording}
                      className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
                    >
                      <Mic className="h-6 w-6 text-white" />
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      {/* Pause/Resume Button */}
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={isPaused ? resumeRecording : pauseRecording}
                        className="h-12 w-12 rounded-full bg-transparent"
                      >
                        {isPaused ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                      </Button>

                      {/* Stop Button */}
                      <Button
                        size="icon"
                        onClick={stopRecording}
                        className="h-16 w-16 rounded-full bg-gray-500 hover:bg-gray-600"
                      >
                        <Square className="h-6 w-6 text-white" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Delete Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={deleteRecording}
                    className="h-12 w-12 rounded-full text-red-500 hover:text-red-600 bg-transparent"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>

                  {/* Play/Pause Button */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={isPlaying ? pausePlayback : playRecording}
                    className="h-12 w-12 rounded-full bg-transparent"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  {/* Send Button */}
                  <Button
                    size="icon"
                    onClick={sendRecording}
                    className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600"
                  >
                    <Send className="h-6 w-6 text-white" />
                  </Button>
                </>
              )}
            </div>

            {/* Waveform Visualization (Simple) */}
            {isRecording && (
              <div className="flex items-center justify-center space-x-1 mt-4">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-primary rounded-full"
                    animate={{
                      height: [4, Math.random() * 20 + 4, 4],
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
