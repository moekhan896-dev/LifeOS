'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : any

export default function VoiceMic() {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)

  const {
    tasks,
    toggleTask,
    togglePrayer,
    addTask,
    updateHealth,
    addIdea,
    addVoiceMemo,
  } = useStore()

  const processTranscript = useCallback(
    (text: string) => {
      const lower = text.toLowerCase().trim()
      if (!lower) return

      // "I sent 200 cold emails" or "done with cold email"
      if (
        lower.includes('cold email') ||
        lower.includes('cold emails')
      ) {
        const task = tasks.find(
          (t) =>
            !t.done &&
            (t.text.toLowerCase().includes('cold email') ||
              t.tag.toLowerCase() === 'outbound')
        )
        if (task) {
          toggleTask(task.id)
          toast.success(`+$${task.dollarValue}`)
          return
        }
      }

      // "I prayed dhuhr"
      const prayerMatch = lower.match(
        /(?:prayed|done with|completed|finished)\s+(fajr|dhuhr|asr|maghrib|isha)/
      )
      if (prayerMatch) {
        const prayer = prayerMatch[1] as keyof ReturnType<
          typeof useStore.getState
        >['todayHealth']['prayers']
        togglePrayer(prayer)
        toast.success(`\u{1F932} ${prayer.charAt(0).toUpperCase() + prayer.slice(1)} logged`)
        return
      }

      // "add task: ..."
      const addTaskMatch = lower.match(/add task[:\s]+(.+)/i)
      if (addTaskMatch) {
        addTask({
          businessId: '',
          text: addTaskMatch[1].trim(),
          tag: 'VOICE',
          priority: 'med',
          done: false,
          dollarValue: 0,
          xpValue: 10,
        })
        toast.success('Task added')
        return
      }

      // "I woke up at 7" / "woke up at 7:30"
      const wakeMatch = lower.match(/woke up at (\d{1,2})(?::(\d{2}))?/)
      if (wakeMatch) {
        const h = wakeMatch[1].padStart(2, '0')
        const m = wakeMatch[2] || '00'
        updateHealth({ wakeTime: `${h}:${m}` })
        toast.success(`Wake time: ${h}:${m}`)
        return
      }

      // "went to the gym"
      if (
        lower.includes('went to the gym') ||
        lower.includes('hit the gym') ||
        lower.includes('gym done') ||
        lower.includes('worked out')
      ) {
        updateHealth({ gym: true })
        toast.success('\u{1F4AA} Gym logged')
        return
      }

      // "new idea: ..."
      const ideaMatch = lower.match(/(?:new idea|idea)[:\s]+(.+)/i)
      if (ideaMatch) {
        addIdea(ideaMatch[1].trim(), 'voice')
        toast.success('\u{1F4A1} Idea saved')
        return
      }

      // Fallback: voice memo
      addVoiceMemo(text)
      toast.success('Voice memo saved')
    },
    [tasks, toggleTask, togglePrayer, addTask, updateHealth, addIdea, addVoiceMemo]
  )

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null

    if (!SpeechRecognitionAPI) {
      toast.error('Speech recognition not supported in this browser')
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      const result = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join('')
      setTranscript(result)
    }

    recognition.onend = () => {
      setListening(false)
      const finalTranscript = recognitionRef.current ? transcript : ''
      if (finalTranscript) {
        processTranscript(finalTranscript)
      }
      setTranscript('')
      recognitionRef.current = null
    }

    recognition.onerror = () => {
      setListening(false)
      setTranscript('')
      recognitionRef.current = null
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [processTranscript, transcript])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  // Process transcript on stop via effect to capture latest value
  const lastTranscriptRef = useRef('')
  useEffect(() => {
    lastTranscriptRef.current = transcript
  }, [transcript])

  const handleTap = useCallback(() => {
    if (listening) {
      const finalText = lastTranscriptRef.current
      recognitionRef.current?.stop()
      recognitionRef.current = null
      setListening(false)
      if (finalText) {
        processTranscript(finalText)
      }
      setTranscript('')
    } else {
      startListening()
    }
  }, [listening, startListening, processTranscript])

  return (
    <>
      {/* Listening panel */}
      <AnimatePresence>
        {listening && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const }}
            className="fixed bottom-[7.5rem] right-4 z-50 w-64 rounded-2xl border border-white/[0.06] bg-[rgba(14,17,24,0.9)] p-4 shadow-xl backdrop-blur-xl"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
              </span>
              <span className="text-xs font-medium text-rose-400">Listening...</span>
            </div>

            {/* Waveform bars */}
            <div className="mb-2 flex items-center gap-[3px]">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full bg-emerald-500/60"
                  animate={{
                    height: [4, 12 + Math.random() * 10, 4],
                  }}
                  transition={{
                    duration: 0.6 + Math.random() * 0.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.05,
                  }}
                />
              ))}
            </div>

            {transcript && (
              <p className="text-xs leading-relaxed text-white/70">{transcript}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic button */}
      <motion.button
        onClick={handleTap}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-shadow ${
          listening
            ? 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/30'
            : 'bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-emerald-500/30'
        }`}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </motion.button>
    </>
  )
}
