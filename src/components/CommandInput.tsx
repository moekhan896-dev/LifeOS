'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import { TAGS, XP_VALUES } from '@/lib/constants'
import { applyTaskDollarEstimateAfterCreate } from '@/lib/task-dollar-client'
import type { Priority } from '@/stores/store'

const BAR_DURATIONS = [0.3, 0.45, 0.35, 0.5, 0.6]

export default function CommandInput() {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const router = useRouter()
  const { addTask, businesses, addIdea, addVoiceMemo } = useStore()

  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)

  const processTranscript = useCallback(
    (text: string) => {
      const lower = text.toLowerCase().trim()
      if (!lower) return

      addVoiceMemo(text)

      if (lower.startsWith('add task') || lower.startsWith('new task')) {
        const taskText = text.replace(/^(add|new)\s+task:?\s*/i, '').trim()
        const bizId = businesses[0]?.id
        if (taskText && bizId) {
          const tid = addTask({ businessId: bizId, text: taskText, tag: '', priority: 'med', done: false, xpValue: XP_VALUES.med })
          void applyTaskDollarEstimateAfterCreate(tid, taskText)
          toast.success(`Task created: "${taskText}"`)
        } else if (taskText && !bizId) {
          toast.error('Add a business first, then create tasks.')
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
        const bizId = businesses[0]?.id
        if (bizId) {
          const tid = addTask({ businessId: bizId, text, tag: '', priority: 'med', done: false, xpValue: XP_VALUES.med })
          void applyTaskDollarEstimateAfterCreate(tid, text)
          toast.success(`Task created from voice: "${text}"`)
        } else {
          toast.error('Add a business first.')
        }
      }
    },
    [addTask, addIdea, addVoiceMemo, router, businesses]
  )

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = value.trim()
    if (!text) return

    if (text.startsWith('?') || text.toLowerCase().startsWith('ask ')) {
      const query = text.startsWith('?') ? text.slice(1).trim() : text.slice(4).trim()
      router.push(`/ai?q=${encodeURIComponent(query)}`)
      setValue('')
      return
    }

    let priority: Priority = 'med'
    let businessId = businesses[0]?.id ?? ''
    let tag = ''

    const lower = text.toLowerCase()

    if (lower.includes('!crit') || lower.includes('critical')) priority = 'crit'
    else if (lower.includes('!high') || lower.includes('urgent')) priority = 'high'
    else if (lower.includes('!low')) priority = 'low'

    for (const b of businesses) {
      if (lower.includes(b.id) || lower.includes(b.name.toLowerCase())) {
        businessId = b.id
        break
      }
    }

    for (const t of TAGS) {
      if (lower.includes(`#${t.toLowerCase()}`) || lower.includes(t.toLowerCase())) {
        tag = t
        break
      }
    }

    const cleaned = text.replace(/!(crit|high|med|low)/gi, '').replace(/#\w+/g, '').trim()
    if (!businessId) {
      toast.error('Add a business first, then add tasks.')
      setValue('')
      return
    }

    const tid = addTask({
      businessId,
      text: cleaned,
      tag,
      priority,
      done: false,
      xpValue: XP_VALUES[priority],
    })
    void applyTaskDollarEstimateAfterCreate(tid, cleaned)

    toast.success('Task added')
    setValue('')
  }

  return (
    <>
      <AnimatePresence>
        {(recording || processing) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="card-floating fixed bottom-[5.75rem] left-4 right-4 z-[45] mx-auto max-w-[640px] p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <motion.div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: processing ? 'var(--info)' : 'var(--negative)' }}
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="label text-[11px] text-[var(--text-secondary)]">
                {processing ? 'Processing…' : 'Listening…'}
              </span>
            </div>

            {!processing && (
              <div className="mb-3 flex h-8 items-center justify-center gap-1.5">
                {BAR_DURATIONS.map((dur, i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-[var(--accent)]"
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

            {transcript && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[17px] leading-relaxed text-[var(--text-primary)]">
                {transcript}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="fixed bottom-0 left-0 right-0 z-30 mx-4 mb-4">
        <motion.div
          className="glass mx-auto flex max-w-[640px] items-center gap-3 rounded-2xl p-3"
          animate={{
            boxShadow: focused
              ? '0 12px 40px color-mix(in srgb, var(--text-primary) 18%, transparent), 0 0 0 1px color-mix(in srgb, var(--accent) 25%, transparent)'
              : '0 8px 24px color-mix(in srgb, var(--text-primary) 12%, transparent)',
          }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            onClick={toggleRecording}
            aria-label={recording ? 'Stop recording' : 'Voice input'}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent)] transition-colors hover:bg-[var(--accent-hover)]"
            style={{ backgroundColor: recording ? 'var(--negative)' : undefined }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>

          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Quick update or ask AI..."
            className="min-h-[44px] flex-1 bg-transparent text-[17px] text-[var(--text)] outline-none placeholder:text-[var(--text-tertiary)]"
          />

          <kbd className="data flex-shrink-0 rounded-lg bg-[var(--surface2)] px-1.5 py-0.5 text-[10px] text-[var(--text-dim)]">&crarr;</kbd>
        </motion.div>
      </form>
    </>
  )
}
