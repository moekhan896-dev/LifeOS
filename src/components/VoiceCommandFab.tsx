'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Drawer } from 'vaul'
import { useStore } from '@/stores/store'
import { XP_VALUES } from '@/lib/constants'
import { applyTaskDollarEstimateAfterCreate } from '@/lib/task-dollar-client'
import { parseVoiceCommand, findMatchingTasks, parseTimeToHHMM } from '@/lib/voice-command-parse'
import { resolveVoiceNavigation } from '@/lib/nav-pages'
import type { Task } from '@/stores/store'

/** PRD §20 — floating mic + §20.3 routing table */
export default function VoiceCommandFab() {
  const router = useRouter()
  const {
    addTask,
    businesses,
    addIdea,
    logEvent,
    toggleTask,
    tasks,
    updateHealth,
    updateStreak,
    setSchedule,
    todaySchedule,
    addKnowledge,
    todayHealth,
  } = useStore()
  const [recording, setRecording] = useState(false)
  const [text, setText] = useState('')
  const recognitionRef = useRef<any>(null)
  const lastTranscript = useRef('')

  const [disambigTasks, setDisambigTasks] = useState<Task[]>([])
  const [disambigQuery, setDisambigQuery] = useState('')

  const bizId = businesses[0]?.id

  const runParsed = useCallback(
    (raw: string) => {
      const parsed = parseVoiceCommand(raw)
      const log = (intent: string, success: boolean) =>
        logEvent('voice_command_used', { command: raw, parsedIntent: intent, success })

      const finishTask = (task: Task) => {
        if (!task.done) toggleTask(task.id)
        log('complete_task', true)
        toast.success(`Completed: ${task.text.slice(0, 80)}${task.text.length > 80 ? '…' : ''}`)
        setDisambigTasks([])
      }

      switch (parsed.kind) {
        case 'add_task': {
          if (!parsed.text || !bizId) {
            log('add_task', false)
            toast.error(bizId ? 'Say what to add.' : 'Add a business first.')
            return
          }
          const tid = addTask({
            businessId: bizId,
            text: parsed.text,
            tag: '',
            priority: 'med',
            done: false,
            xpValue: XP_VALUES.med,
          })
          void applyTaskDollarEstimateAfterCreate(tid, parsed.text)
          log('add_task', true)
          toast.success('Task added')
          return
        }
        case 'complete_task': {
          const matches = findMatchingTasks(parsed.query, tasks, 3)
          if (matches.length === 0) {
            log('complete_task', false)
            toast.error('No matching open task.')
            return
          }
          if (matches.length === 1) {
            finishTask(matches[0])
            return
          }
          setDisambigQuery(parsed.query)
          setDisambigTasks(matches)
          log('complete_task', true)
          return
        }
        case 'focus_prompt': {
          log('focus_prompt', true)
          router.push(`/ai?q=${encodeURIComponent("What should I focus on right now?")}`)
          return
        }
        case 'log_habit': {
          const r = parsed.raw.toLowerCase()
          if (r.includes('gym')) {
            updateHealth({ gym: true })
            updateStreak('gym', true)
            log('log_habit_gym', true)
            toast.success('Gym logged')
            return
          }
          if (r.includes('cold') || r.includes('email') || r.includes('outreach')) {
            updateStreak('cold_email', true)
            log('log_habit_cold_email', true)
            toast.success('Outreach habit logged')
            return
          }
          log('log_habit', false)
          toast.message('Say a known habit (e.g. gym, cold email).')
          return
        }
        case 'log_prayer': {
          const st = useStore.getState()
          if (!st.todayHealth.prayers[parsed.prayer]) st.togglePrayer(parsed.prayer)
          log('log_prayer', true)
          toast.success(`${parsed.prayer} logged`)
          return
        }
        case 'should_i':
        case 'can_afford': {
          log('navigate_decision_lab', true)
          router.push(`/decision-lab?q=${encodeURIComponent(parsed.query)}`)
          return
        }
        case 'search': {
          sessionStorage.setItem('cmdk-q', parsed.query)
          window.dispatchEvent(new Event('artos:open-command-palette'))
          log('search', true)
          toast.success('Search opened')
          return
        }
        case 'brain_dump': {
          addIdea(parsed.text, 'voice')
          log('add_idea', true)
          toast.success('Idea saved')
          return
        }
        case 'note': {
          addKnowledge({
            title: 'Voice note',
            source: 'voice',
            type: 'idea',
            takeaways: parsed.text,
          })
          log('add_knowledge', true)
          toast.success('Saved to Knowledge Vault')
          return
        }
        case 'schedule': {
          const hh = parseTimeToHHMM(parsed.timeRaw)
          if (!hh) {
            log('schedule', false)
            toast.error('Could not parse time — try "at 9:30 am".')
            return
          }
          setSchedule([
            ...todaySchedule,
            {
              time: hh,
              title: parsed.title || 'Block',
              type: 'personal',
              duration: 60,
              completed: false,
            },
          ])
          log('schedule', true)
          toast.success('Schedule block added')
          return
        }
        case 'navigate': {
          const href = resolveVoiceNavigation(parsed.pageQuery)
          if (!href) {
            log('navigate', false)
            toast.error('Unknown page — try "go to tasks".')
            return
          }
          router.push(href)
          log('navigate', true)
          return
        }
        case 'financial_summary': {
          router.push('/financials')
          log('financial_summary', true)
          return
        }
        case 'execution_score': {
          router.push('/insights')
          log('execution_score', true)
          return
        }
        case 'unrecognized': {
          log('navigate_ai_chat', true)
          router.push(`/ai?q=${encodeURIComponent(parsed.text)}`)
          return
        }
      }
    },
    [
      addTask,
      addIdea,
      addKnowledge,
      bizId,
      logEvent,
      router,
      setSchedule,
      tasks,
      todaySchedule,
      toggleTask,
      updateHealth,
      updateStreak,
    ]
  )

  const process = useCallback(
    (raw: string) => {
      runParsed(raw)
    },
    [runParsed]
  )

  const toggle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return
    if (recording) {
      recognitionRef.current?.stop()
      setRecording(false)
      return
    }
    const rec = new SpeechRecognition()
    rec.continuous = false
    rec.interimResults = true
    rec.lang = 'en-US'
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join('')
      lastTranscript.current = transcript
      setText(transcript)
    }
    rec.onend = () => {
      setRecording(false)
      const t = lastTranscript.current.trim()
      if (t) {
        process(t)
        lastTranscript.current = ''
        setText('')
      }
    }
    rec.onerror = () => {
      setRecording(false)
      toast.error('Voice capture failed')
    }
    recognitionRef.current = rec
    rec.start()
    setRecording(true)
    setText('')
  }

  if (typeof window === 'undefined') return null
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  if (!SpeechRecognition) return null

  return (
    <>
      <Drawer.Root open={disambigTasks.length > 0} onOpenChange={(o) => !o && setDisambigTasks([])}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[110] bg-black/60" />
          <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[120] max-h-[50vh] rounded-t-[20px] border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/10" />
            <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)]">Which task?</Drawer.Title>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
              “{disambigQuery}” matched more than one. Pick the right one.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {disambigTasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (!t.done) toggleTask(t.id)
                    toast.success('Task completed')
                    setDisambigTasks([])
                    logEvent('voice_command_used', {
                      command: disambigQuery,
                      parsedIntent: 'complete_task_disambiguated',
                      success: true,
                    })
                  }}
                  className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2 text-left text-[14px] text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  {t.text.slice(0, 72)}
                  {t.text.length > 72 ? '…' : ''}
                </button>
              ))}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      <AnimatePresence>
        {recording && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-[88px] right-6 z-[90] max-w-[min(90vw,320px)] rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]/95 p-3 text-[13px] text-[var(--text-secondary)] shadow-2xl backdrop-blur-[40px] md:bottom-24"
          >
            {text || 'Listening…'}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        aria-label="Voice command"
        whileTap={{ scale: 0.96 }}
        onClick={toggle}
        className="fixed bottom-6 right-6 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg md:bottom-8 md:right-8"
      >
        <span className="text-xl">{recording ? '■' : '🎤'}</span>
      </motion.button>
    </>
  )
}
