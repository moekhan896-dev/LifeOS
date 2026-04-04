'use client'

import { useCallback, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

export function OnboardingVoiceFab({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<{ stop: () => void } | null>(null)

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setRecording(false)
  }, [])

  const start = useCallback(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        start: () => void
        stop: () => void
        continuous: boolean
        interimResults: boolean
        lang: string
        onresult: (e: unknown) => void
        onend: () => void
        onerror: () => void
      }
      webkitSpeechRecognition?: new () => {
        start: () => void
        stop: () => void
        continuous: boolean
        interimResults: boolean
        lang: string
        onresult: (e: unknown) => void
        onend: () => void
        onerror: () => void
      }
    }
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!SR) {
      toast.error('Voice input needs a browser with Web Speech API (e.g. Chrome).')
      return
    }
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (e: unknown) => {
      const ev = e as { results: ArrayLike<{ 0: { transcript: string } }> }
      const len = 'length' in ev.results ? (ev.results as { length: number }).length : 0
      const t = Array.from({ length: len }, (_, i) => ev.results[i]?.[0]?.transcript ?? '').join('')
      setTranscript(t)
    }
    recognition.onend = () => setRecording(false)
    recognition.onerror = () => {
      setRecording(false)
      toast.error('Could not access the microphone')
    }
    recognitionRef.current = recognition
    setTranscript('')
    recognition.start()
    setRecording(true)
  }, [])

  const toggle = () => {
    if (recording) {
      stop()
      if (transcript.trim()) {
        setProcessing(true)
        window.setTimeout(() => {
          onTranscript(transcript.trim())
          setProcessing(false)
          setTranscript('')
          toast.success('Captured voice input')
        }, 200)
      }
      return
    }
    start()
  }

  return (
    <>
      <AnimatePresence>
        {(recording || processing) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="card-floating fixed bottom-[5.5rem] right-4 z-[100] max-w-[min(100vw-2rem,320px)] rounded-[16px] p-4 md:bottom-8 md:right-8"
          >
            <p className="label text-[var(--accent)]">{processing ? 'Applying…' : 'Listening…'}</p>
            <p className="mt-2 text-[17px] text-[rgba(255,255,255,0.85)]">{transcript || 'Speak now…'}</p>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        aria-label="Voice input"
        onClick={toggle}
        whileHover={{ filter: 'brightness(1.08)' }}
        whileTap={{ scale: 0.97 }}
        className={`fixed bottom-4 right-4 z-[100] flex h-14 w-14 min-h-[44px] min-w-[44px] items-center justify-center rounded-full shadow-lg md:bottom-8 md:right-8 ${
          recording ? 'bg-[var(--negative)]' : 'bg-[var(--accent)]'
        }`}
        style={{
          boxShadow: recording ? '0 4px 24px rgba(255, 69, 58, 0.35)' : '0 4px 24px rgba(10, 132, 255, 0.35)',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      </motion.button>
    </>
  )
}
