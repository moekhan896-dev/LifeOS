'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/store'
import { XP_VALUES } from '@/lib/constants'

export default function VoiceButton() {
  const [recording, setRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  const router = useRouter()
  const { addTask, addIdea, addVoiceMemo } = useStore()

  const processTranscript = useCallback((text: string) => {
    const lower = text.toLowerCase().trim()
    if (!lower) return

    addVoiceMemo(text)

    if (lower.startsWith('add task') || lower.startsWith('new task')) {
      const taskText = text.replace(/^(add|new)\s+task:?\s*/i, '').trim()
      if (taskText) {
        addTask({ businessId: 'agency', text: taskText, tag: '', priority: 'med', done: false, xpValue: XP_VALUES.med })
        toast.success(`Task created: "${taskText}"`)
      }
    } else if (lower.startsWith('new idea') || lower.startsWith('idea')) {
      const ideaText = text.replace(/^(new\s+)?idea:?\s*/i, '').trim()
      if (ideaText) {
        addIdea(ideaText, 'business')
        toast.success(`Idea saved: "${ideaText}"`)
      }
    } else if (lower.includes('open ai') || lower.includes('ask ai')) {
      router.push('/ai')
      toast('Opening AI Strategist')
    } else if (lower.includes('how am i doing')) {
      router.push('/health')
      toast('Opening Health & Deen')
    } else {
      addTask({ businessId: 'agency', text, tag: '', priority: 'med', done: false, xpValue: XP_VALUES.med })
      toast.success(`Task created from voice: "${text}"`)
    }
  }, [addTask, addIdea, addVoiceMemo, router])

  const toggleRecording = () => {
    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      if (transcript) processTranscript(transcript)
      setTranscript('')
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      setTranscript(t)
    }

    recognition.onend = () => {
      setRecording(false)
    }

    recognition.onerror = () => {
      setRecording(false)
      toast.error('Voice recognition failed')
    }

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
    setTranscript('')
  }

  return (
    <>
      <AnimatePresence>
        {recording && transcript && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-24 right-4 z-[60] glass border border-[var(--color-border)] rounded-[10px] px-4 py-3 max-w-[300px] shadow-xl"
          >
            <p className="text-[12px] text-[var(--color-text-mid)] mb-1 label">LISTENING...</p>
            <p className="text-[13px] text-[var(--color-text)]">{transcript}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={toggleRecording}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`fixed bottom-5 right-5 z-[60] w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
          recording
            ? 'bg-[var(--color-rose)] animate-pulse-ring'
            : 'bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]'
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={recording ? 'white' : 'var(--color-text-mid)'} strokeWidth="2" strokeLinecap="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </motion.button>
    </>
  )
}
