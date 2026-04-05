'use client'

import { useEffect, useRef, useState } from 'react'
import { Drawer } from 'vaul'
import { DRAWER_CONTENT_CLASS, DrawerDragHandle } from '@/components/ui/drawer-primitives'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import { getLocalSundayKey } from '@/lib/weekly-scorecard'

const PROMPT =
  'How was your day? What went well, what didn\'t, what will you do differently tomorrow?'

const DURATION_SEC = 120

export default function EveningVoiceReview() {
  const { addReflection, logEvent } = useStore()
  const [open, setOpen] = useState(false)
  const [recording, setRecording] = useState(false)
  const [remaining, setRemaining] = useState(DURATION_SEC)
  const [live, setLive] = useState('')
  const recRef = useRef<any>(null)
  const fullRef = useRef('')
  const savedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      savedRef.current = false
      return
    }
    setRemaining(DURATION_SEC)
    setLive('')
    fullRef.current = ''
  }, [open])

  useEffect(() => {
    if (!open || !recording) return
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          recRef.current?.stop()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [open, recording])

  const stopSession = (transcript: string) => {
    if (savedRef.current) return
    savedRef.current = true
    setRecording(false)
    const t = transcript.trim()
    if (t) {
      addReflection({
        weekStart: getLocalSundayKey(),
        worked: t.slice(0, 800),
        didnt: '',
        avoided: '',
        change: '',
        grateful: '',
        eveningVoiceTranscript: t,
        reflectionKind: 'evening_voice',
      })
      logEvent('voice_review_completed', { transcriptLength: t.length })
      toast.success('Voice review saved')
    } else {
      toast.message('No transcript captured.')
    }
    setOpen(false)
  }

  const start = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Speech recognition not available in this browser.')
      return
    }
    savedRef.current = false
    setOpen(true)
    setRecording(true)
    setRemaining(DURATION_SEC)
    setLive('')
    fullRef.current = ''

    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      fullRef.current = t
      setLive(t)
    }
    rec.onend = () => {
      setRecording(false)
      stopSession(fullRef.current)
    }
    rec.onerror = () => {
      setRecording(false)
      toast.error('Recording error')
      setOpen(false)
    }
    recRef.current = rec
    rec.start()
  }

  const stopEarly = () => {
    recRef.current?.stop()
  }

  if (typeof window === 'undefined') return null
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SR) return null

  return (
    <>
      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[110] bg-black/60" />
          <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-[120]`}>
            <DrawerDragHandle />
            <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)]">End-of-day review</Drawer.Title>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-secondary)]">{PROMPT}</p>
            <div className="mt-4 flex items-center justify-between text-[13px] text-[var(--text-dim)]">
              <span>Time remaining</span>
              <span className="data font-mono text-[var(--accent)]">
                {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
              </span>
            </div>
            <div className="mt-3 min-h-[100px] rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-3 text-[15px] text-[var(--text-primary)]">
              {live || (recording ? 'Listening…' : '…')}
            </div>
            <button
              type="button"
              className="mt-4 w-full rounded-xl border border-[var(--border)] py-3 text-[15px] font-medium text-[var(--text-primary)]"
              onClick={stopEarly}
            >
              Stop early &amp; save
            </button>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={start}
        className="mt-4 rounded-[14px] border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-4 py-2.5 text-[15px] font-semibold text-[var(--accent)]"
      >
        Start voice review →
      </motion.button>
    </>
  )
}
