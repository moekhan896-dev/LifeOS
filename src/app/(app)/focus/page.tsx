'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const cardAnim = (delay: number) => ({
  initial: { opacity: 0, y: 12 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay, duration: 0.35 },
})

const DURATIONS = [25, 50, 90]

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FocusPage() {
  const { focusSessions, addFocusSession, updateFocusSession, tasks, projects, goals } = useStore()

  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(50)
  const [timeLeft, setTimeLeft] = useState(50 * 60)
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [distractions, setDistractions] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showRating, setShowRating] = useState(false)
  const [rating, setRating] = useState(3)
  const [sessionNotes, setSessionNotes] = useState('')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const incompleteTasks = tasks.filter(t => !t.done)
  const todayStr = new Date().toISOString().split('T')[0]
  const todaySessions = focusSessions.filter(s => s.startedAt.startsWith(todayStr))
  const totalFocusToday = todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0)
  const avgQuality = todaySessions.filter(s => s.quality).length > 0
    ? Math.round(todaySessions.filter(s => s.quality).reduce((sum, s) => sum + (s.quality || 0), 0) / todaySessions.filter(s => s.quality).length)
    : 0

  // Timer effect
  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            handleSessionEnd()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isActive, isPaused])

  const startSession = () => {
    const now = new Date().toISOString()
    const task = tasks.find(t => t.id === selectedTaskId)
    addFocusSession({
      taskId: selectedTaskId || undefined,
      projectId: task?.projectId || undefined,
      startedAt: now,
      duration: duration,
      distractions: 0,
    })
    // Get the ID of the session we just added
    const sessions = useStore.getState().focusSessions
    const newSession = sessions[sessions.length - 1]
    setSessionId(newSession?.id || null)
    setTimeLeft(duration * 60)
    setDistractions(0)
    setIsActive(true)
    setIsPaused(false)
    toast.success(`Focus session started — ${duration} minutes`)
  }

  const handleSessionEnd = () => {
    setIsActive(false)
    setIsPaused(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    setShowRating(true)
    toast.success('Session complete!')
  }

  const endSessionEarly = () => {
    const elapsed = duration * 60 - timeLeft
    const elapsedMin = Math.round(elapsed / 60)
    if (sessionId) {
      updateFocusSession(sessionId, { endedAt: new Date().toISOString(), duration: elapsedMin, distractions })
    }
    handleSessionEnd()
  }

  const submitRating = () => {
    if (sessionId) {
      updateFocusSession(sessionId, { quality: rating, notes: sessionNotes, endedAt: new Date().toISOString(), distractions })
    }
    setShowRating(false)
    setSessionId(null)
    setSessionNotes('')
    setRating(3)
    toast.success('Session rated')
  }

  const completeTask = () => {
    if (selectedTaskId) {
      const { toggleTask } = useStore.getState()
      toggleTask(selectedTaskId)
      toast.success('Task completed!')
    }
    endSessionEarly()
  }

  const selectedTask = tasks.find(t => t.id === selectedTaskId)
  const linkedProject = selectedTask?.projectId ? projects.find(p => p.id === selectedTask.projectId) : null
  const linkedGoal = linkedProject?.goalId ? goals.find(g => g.id === linkedProject.goalId) : null

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div {...cardAnim(0)}>
          <h1 className="text-[22px] font-bold text-[var(--text)]">Focus Mode</h1>
          <p className="text-[13px] text-[var(--text-dim)] mt-1">Deep work. One task. No distractions.</p>
        </motion.div>

        {/* Rating Modal */}
        <AnimatePresence>
          {showRating && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 space-y-4">
              <h3 className="text-[16px] font-semibold text-[var(--text)] text-center">Rate this session</h3>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map(q => (
                  <button key={q} onClick={() => setRating(q)} className={`w-12 h-12 rounded-[10px] text-[16px] font-bold border transition-colors ${rating === q ? 'border-[var(--accent)] text-black bg-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-dim)]'}`}>
                    {q}
                  </button>
                ))}
              </div>
              <textarea placeholder="Session notes (optional)" value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-[8px] bg-[var(--surface2)] border border-[var(--border)] text-[13px] text-[var(--text)] outline-none resize-none" />
              <button onClick={submitRating} className="w-full px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-[var(--accent)] text-black">Save & Close</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Session */}
        {isActive && !showRating && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center space-y-6">
            {/* Timer */}
            <div>
              <p className="text-[48px] font-mono font-bold text-[var(--accent)] tracking-wider">
                {formatTimer(timeLeft)}
              </p>
              <p className="text-[12px] text-[var(--text-dim)] mt-2">{isPaused ? 'PAUSED' : 'FOCUSING'}</p>
            </div>

            {/* Context chain */}
            {selectedTask && (
              <div className="space-y-1">
                <p className="text-[14px] font-semibold text-[var(--text)]">{selectedTask.text}</p>
                {linkedProject && <p className="text-[12px] text-[var(--text-dim)]">Project: {linkedProject.name}</p>}
                {linkedGoal && <p className="text-[12px] text-[var(--text-dim)]">Goal: {linkedGoal.title}</p>}
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center gap-3">
              <button onClick={() => setIsPaused(!isPaused)} className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface2)] transition-colors">
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button onClick={completeTask} className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold bg-[var(--accent)] text-black hover:opacity-90 transition-opacity">
                Complete Task
              </button>
              <button onClick={endSessionEarly} className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold border border-[var(--rose)] text-[var(--rose)] hover:bg-[var(--rose)]/10 transition-colors">
                End Session
              </button>
            </div>

            {/* Distraction counter */}
            <div className="pt-2">
              <button onClick={() => { setDistractions(d => d + 1); toast('Distraction logged', { icon: '😤' }) }} className="px-4 py-2 rounded-[8px] text-[11px] font-semibold text-[var(--text-dim)] border border-[var(--border)] hover:border-[var(--rose)] transition-colors">
                +1 Distraction {distractions > 0 && `(${distractions})`}
              </button>
            </div>
          </motion.div>
        )}

        {/* Idle State */}
        {!isActive && !showRating && (
          <motion.div {...cardAnim(0.05)} className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] p-6 space-y-5">
            <h3 className="text-[16px] font-semibold text-[var(--text)] text-center">Start Focus Session</h3>

            {/* Task selector */}
            <div>
              <label className="text-[11px] text-[var(--text-dim)] mb-1.5 block">What are you working on?</label>
              <select value={selectedTaskId} onChange={e => setSelectedTaskId(e.target.value)} className="w-full px-3 py-2.5 rounded-[8px] bg-[var(--surface2)] border border-[var(--border)] text-[13px] text-[var(--text)] outline-none">
                <option value="">Select a task (optional)</option>
                {incompleteTasks.map(t => (
                  <option key={t.id} value={t.id}>{t.text}</option>
                ))}
              </select>
            </div>

            {/* Duration selector */}
            <div>
              <label className="text-[11px] text-[var(--text-dim)] mb-1.5 block">Duration</label>
              <div className="flex gap-2">
                {DURATIONS.map(d => (
                  <button key={d} onClick={() => { setDuration(d); setTimeLeft(d * 60) }} className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-semibold border transition-colors ${duration === d ? 'border-[var(--accent)] text-black bg-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-dim)]'}`}>
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            <button onClick={startSession} className="w-full px-4 py-3 rounded-[10px] text-[14px] font-bold bg-[var(--accent)] text-black hover:opacity-90 transition-opacity">
              Start Focus
            </button>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="text-center">
                <p className="data text-[20px] font-bold text-[var(--accent)]">{todaySessions.length}/4</p>
                <p className="text-[11px] text-[var(--text-dim)]">Sessions today</p>
              </div>
              <div className="text-center">
                <p className="data text-[20px] font-bold text-[var(--text)]">{totalFocusToday}m</p>
                <p className="text-[11px] text-[var(--text-dim)]">Focus time</p>
              </div>
              <div className="text-center">
                <p className="data text-[20px] font-bold text-[var(--text)]">{avgQuality || '—'}/5</p>
                <p className="text-[11px] text-[var(--text-dim)]">Avg quality</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Session History */}
        {todaySessions.length > 0 && !isActive && !showRating && (
          <motion.div {...cardAnim(0.15)} className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 space-y-3">
            <h3 className="text-[14px] font-semibold text-[var(--text)]">Today&apos;s Sessions</h3>
            <div className="space-y-2">
              {todaySessions.map((s, i) => {
                const task = s.taskId ? tasks.find(t => t.id === s.taskId) : null
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--surface2)] border border-[var(--border)]">
                    <div className="flex-1">
                      <p className="text-[13px] text-[var(--text)] font-medium">{task?.text || 'Untitled session'}</p>
                      <p className="text-[11px] text-[var(--text-dim)]">{s.duration}min{s.distractions > 0 ? ` · ${s.distractions} distractions` : ''}</p>
                    </div>
                    {s.quality && (
                      <span className="data text-[13px] font-bold" style={{ color: s.quality >= 4 ? 'var(--accent)' : s.quality >= 3 ? 'var(--amber)' : 'var(--rose)' }}>
                        {s.quality}/5
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
