'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Drawer } from 'vaul'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { DRAWER_CONTENT_CLASS, DrawerDragHandle } from '@/components/ui/drawer-primitives'
import type { FocusSession, Priority } from '@/stores/store'

const PRI_ORDER: Record<Priority, number> = { crit: 0, high: 1, med: 2, low: 3 }
const DURATION_CHIPS = [25, 45, 60, 90] as const

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatSessionWhen(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

/** 120px outer ring — SVG viewBox 100 100, r=40 */
function TimerRing({ progress }: { progress: number }) {
  const r = 40
  const c = 2 * Math.PI * r
  const off = c * (1 - Math.min(1, Math.max(0, progress)))
  return (
    <svg width={120} height={120} viewBox="0 0 100 100" className="shrink-0">
      <circle cx={50} cy={50} r={r} fill="none" stroke="var(--surface2)" strokeWidth={8} />
      <circle
        cx={50}
        cy={50}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform="rotate(-90 50 50)"
        className="transition-[stroke-dashoffset] duration-1000 ease-linear"
      />
    </svg>
  )
}

export default function FocusPage() {
  const { focusSessions, addFocusSession, updateFocusSession, tasks, projects, addXp } = useStore()

  const [configOpen, setConfigOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)

  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [durationMin, setDurationMin] = useState(25)
  const [customMin, setCustomMin] = useState('')

  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [plannedSeconds, setPlannedSeconds] = useState(25 * 60)
  const [distractions, setDistractions] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const [quality, setQuality] = useState(3)
  const [sessionNotes, setSessionNotes] = useState('')

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const sortedTasks = useMemo(() => {
    return tasks
      .filter((t) => !t.done)
      .sort((a, b) => PRI_ORDER[a.priority] - PRI_ORDER[b.priority])
  }, [tasks])

  const filteredProjects = useMemo(() => {
    if (!selectedTaskId) return projects
    const t = tasks.find((x) => x.id === selectedTaskId)
    if (t?.projectId) return projects.filter((p) => p.id === t.projectId)
    return projects
  }, [projects, tasks, selectedTaskId])

  const selectedTask = tasks.find((t) => t.id === selectedTaskId)
  const effectiveProjectId = selectedTask?.projectId || selectedProjectId || undefined

  const endSession = useCallback(() => {
    setIsActive(false)
    setIsPaused(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setCompleteOpen(true)
  }, [])

  useEffect(() => {
    if (!isActive || isPaused || timeLeft <= 0) return
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          endSession()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isActive, isPaused, endSession])

  const applyDurationChip = (m: number) => {
    setDurationMin(m)
    setCustomMin('')
    setTimeLeft(m * 60)
    setPlannedSeconds(m * 60)
  }

  const selectCustomChip = () => {
    setCustomMin((c) => {
      if (c.trim()) {
        setTimeLeft(durationMin * 60)
        setPlannedSeconds(durationMin * 60)
        return ''
      }
      setTimeLeft(45 * 60)
      setPlannedSeconds(45 * 60)
      return '45'
    })
  }

  const openConfigAndPrime = () => {
    const m = customMin.trim() ? Math.min(240, Math.max(1, parseInt(customMin, 10) || durationMin)) : durationMin
    setDurationMin(m)
    setTimeLeft(m * 60)
    setPlannedSeconds(m * 60)
    setConfigOpen(true)
  }

  const startSession = () => {
    const m = customMin.trim() ? Math.min(240, Math.max(1, parseInt(customMin, 10) || durationMin)) : durationMin
    const secs = m * 60
    const now = new Date().toISOString()
    addFocusSession({
      taskId: selectedTaskId || undefined,
      projectId: effectiveProjectId,
      startedAt: now,
      duration: m,
      distractions: 0,
    })
    const sessions = useStore.getState().focusSessions
    const newSession = sessions[sessions.length - 1]
    setSessionId(newSession?.id ?? null)
    setTimeLeft(secs)
    setPlannedSeconds(secs)
    setDistractions(0)
    setIsActive(true)
    setIsPaused(false)
    setConfigOpen(false)
    toast.success(`Focus session — ${m} min`)
  }

  const saveCompletedSession = () => {
    if (!sessionId) {
      setCompleteOpen(false)
      setSessionNotes('')
      setQuality(3)
      return
    }
    const elapsedMin = Math.max(1, Math.round((plannedSeconds - Math.min(plannedSeconds, timeLeft)) / 60))
    updateFocusSession(sessionId, {
      quality,
      notes: sessionNotes.trim() || undefined,
      endedAt: new Date().toISOString(),
      distractions,
      duration: elapsedMin,
    })
    const day = new Date().toISOString().split('T')[0]
    const already = useStore.getState().focusSessions.filter(
      (s) => s.startedAt.startsWith(day) && s.quality != null && s.id !== sessionId
    ).length
    if (already < 4) addXp(5)
    setCompleteOpen(false)
    setSessionId(null)
    setSessionNotes('')
    setQuality(3)
    toast.success('Session saved')
  }

  const ringProgress = plannedSeconds > 0 ? timeLeft / plannedSeconds : 0

  const history = useMemo(() => {
    return [...focusSessions].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
  }, [focusSessions])

  const empty = history.length === 0 && !isActive

  return (
    <PageTransition>
      <div className="mx-auto max-w-lg space-y-6 pb-24">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--text)]">Focus Sessions</h1>
          <p className="mt-1 text-[13px] text-[var(--text-dim)]">Deep work, tracked.</p>
        </div>

        {history.length > 0 && !isActive && (
          <button
            type="button"
            onClick={openConfigAndPrime}
            className="w-full rounded-[14px] bg-[var(--accent)] py-3.5 text-[15px] font-semibold text-black"
          >
            Start Focus Session
          </button>
        )}

        <Drawer.Root open={configOpen} onOpenChange={setConfigOpen}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-[80] bg-black/50" />
            <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-[90]`}>
              <DrawerDragHandle />
              <Drawer.Title className="text-lg font-semibold text-[var(--text)]">Configure session</Drawer.Title>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] text-[var(--text-dim)]">Task (priority order)</label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => {
                      setSelectedTaskId(e.target.value)
                      setSelectedProjectId('')
                    }}
                    className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-[13px] text-[var(--text)]"
                  >
                    <option value="">Optional — pick a task</option>
                    {sortedTasks.map((t) => (
                      <option key={t.id} value={t.id}>
                        [{t.priority}] {t.text.slice(0, 80)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] text-[var(--text-dim)]">Project (optional)</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    disabled={!!selectedTask?.projectId}
                    className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-[13px] text-[var(--text)] disabled:opacity-50"
                  >
                    <option value="">None</option>
                    {filteredProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] text-[var(--text-dim)]">Duration</label>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_CHIPS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => applyDurationChip(d)}
                        className={`rounded-[10px] px-3 py-2 text-[13px] font-semibold ${
                          durationMin === d && !customMin.trim()
                            ? 'bg-[var(--accent)] text-black'
                            : 'border border-[var(--border)] text-[var(--text-secondary)]'
                        }`}
                      >
                        {d} min
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={selectCustomChip}
                      className={`rounded-[10px] px-3 py-2 text-[13px] font-semibold ${
                        customMin.trim() ? 'bg-[var(--accent)] text-black' : 'border border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >
                      Custom
                    </button>
                  </div>
                  {customMin.trim() !== '' && (
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={customMin}
                      onChange={(e) => {
                        setCustomMin(e.target.value)
                        const m = Math.min(240, Math.max(1, parseInt(e.target.value, 10) || 1))
                        setTimeLeft(m * 60)
                        setPlannedSeconds(m * 60)
                      }}
                      className="mt-2 w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[13px]"
                      placeholder="Minutes"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={startSession}
                  className="w-full rounded-[12px] bg-[var(--accent)] py-3 text-[15px] font-semibold text-black"
                >
                  Start
                </button>
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card space-y-6 px-5 py-8 text-center"
            >
              {selectedTask && <p className="headline text-[17px] font-semibold text-[var(--text)]">{selectedTask.text}</p>}
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative flex h-[120px] w-[120px] items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TimerRing progress={ringProgress} />
                  </div>
                  <p className="relative z-10 font-mono text-[40px] font-bold leading-none tabular-nums text-[var(--accent)]">
                    {formatTimer(timeLeft)}
                  </p>
                </div>
                <p className="text-[12px] uppercase tracking-wider text-[var(--text-dim)]">{isPaused ? 'Paused' : 'Focusing'}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPaused((p) => !p)}
                  className="rounded-[10px] border border-[var(--border)] px-5 py-2.5 text-[13px] font-semibold text-[var(--text)]"
                >
                  {isPaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    endSession()
                  }}
                  className="text-[15px] font-medium text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  End Session
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDistractions((d) => {
                    const n = d + 1
                    if (sessionId) updateFocusSession(sessionId, { distractions: n })
                    return n
                  })
                  toast.message('Distraction logged')
                }}
                className="w-full text-[15px] text-[var(--text-secondary)]"
              >
                Distractions: {distractions}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <Drawer.Root open={completeOpen} onOpenChange={setCompleteOpen}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-[80] bg-black/50" />
            <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-[90]`}>
              <DrawerDragHandle />
              <Drawer.Title className="text-lg font-semibold text-[var(--text)]">Session complete</Drawer.Title>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Rate focus quality (1–5)</p>
              <input
                type="range"
                min={1}
                max={5}
                step={1}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="mt-4 w-full accent-[var(--accent)]"
              />
              <div className="mt-1 text-center font-mono text-[20px] text-[var(--text)]">{quality}</div>
              <textarea
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="Notes (optional)"
                rows={3}
                className="mt-4 w-full resize-none rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[13px] text-[var(--text)]"
              />
              <button
                type="button"
                onClick={saveCompletedSession}
                className="mt-4 w-full rounded-[12px] bg-[var(--accent)] py-3 text-[15px] font-semibold text-black"
              >
                Save Session
              </button>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        {history.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--text-dim)]">History</h2>
            <div className="space-y-2">
              {history.map((s) => {
                const t = s.taskId ? tasks.find((x) => x.id === s.taskId) : null
                return <HistoryRow key={s.id} s={s} taskLabel={t?.text ?? 'Session'} />
              })}
            </div>
          </div>
        )}

        {empty && (
          <div className="card px-5 py-8 text-center text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Focus sessions help you track deep work. Each session earns 5 execution points (up to 20/day).
            <button type="button" onClick={openConfigAndPrime} className="mt-4 block w-full text-[var(--accent)] font-medium">
              Start your first session →
            </button>
          </div>
        )}
      </div>
    </PageTransition>
  )
}

function HistoryRow({ s, taskLabel }: { s: FocusSession; taskLabel: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)]">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <div>
          <p className="text-[14px] font-medium text-[var(--text)]">{taskLabel}</p>
          <p className="text-[12px] text-[var(--text-dim)]">{formatSessionWhen(s.startedAt)}</p>
        </div>
        <div className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)]">
          <span>{s.duration ?? '—'} min</span>
          <span className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${s.quality && i <= (s.quality || 0) ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
              />
            ))}
          </span>
          <span className="text-[var(--text-dim)]">· {s.distractions} dist.</span>
        </div>
      </button>
      {open && s.notes && (
        <div className="border-t border-[var(--border)] px-4 py-2 text-[13px] text-[var(--text-secondary)]">{s.notes}</div>
      )}
    </div>
  )
}
