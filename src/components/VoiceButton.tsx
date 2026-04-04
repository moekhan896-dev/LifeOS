'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/store'
import { XP_VALUES } from '@/lib/constants'

const BAR_DURATIONS = [0.3, 0.45, 0.35, 0.5, 0.6]

export default function VoiceButton() {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
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
      const currentTranscript = transcript
      if (currentTranscript) {
        setProcessing(true)
        setTimeout(() => {
          processTranscript(currentTranscript)
          setProcessing(false)
          setTranscript('')
        }, 300)
      } else {
        setTranscript('')
      }
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
      {/* Recording Panel */}
      <AnimatePresence>
        {(recording || processing) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-[5.5rem] right-5 z-[60] glass border border-[var(--color-border)] rounded-[14px] p-4 w-[300px] shadow-xl"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: processing ? 'var(--color-cyan)' : '#f43f5e' }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="label text-[11px] text-[var(--color-text-mid)]">
                {processing ? 'Processing...' : 'Listening...'}
              </span>
            </div>

            {/* Sound Wave Visualizer */}
            {!processing && (
              <div className="flex items-center justify-center gap-1.5 h-8 mb-3">
                {BAR_DURATIONS.map((dur, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-gradient-to-t from-emerald-500 to-cyan-400"
                    animate={{ height: [8, 28, 8] }}
                    transition={{
                      duration: dur,
                      repeat: Infinity,
                      repeatType: 'reverse',
                      delay: i * 0.08,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Transcript */}
            {transcript && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[13px] text-[var(--color-text)] leading-relaxed"
              >
                {transcript}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mic Button */}
      <motion.button
        onClick={toggleRecording}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={{
          width: recording ? 56 : 52,
          height: recording ? 56 : 52,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`fixed bottom-5 right-5 z-[60] rounded-full flex items-center justify-center shadow-lg ${
          recording
            ? 'bg-gradient-to-br from-rose-500 to-red-500'
            : 'bg-gradient-to-br from-emerald-500 to-cyan-400'
        }`}
        style={{
          boxShadow: recording
            ? '0 4px 20px rgba(244,63,94,0.4)'
            : '0 4px 20px rgba(16,185,129,0.3)',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </motion.button>
    </>
  )
}
