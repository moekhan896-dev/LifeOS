'use client'

import { useState, useEffect, useMemo } from 'react'
import { useStore, type ScheduleBlock } from '@/stores/store'

const TYPE_COLORS: Record<ScheduleBlock['type'], string> = {
  prayer: '#eab308',
  work: '#3b82f6',
  health: '#22c55e',
  personal: '#a855f7',
  meal: '#f59e0b',
}

const TYPE_BG: Record<ScheduleBlock['type'], string> = {
  prayer: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
  work: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  health: 'bg-green-500/15 border-green-500/30 text-green-400',
  personal: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
  meal: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
}

const DEFAULT_BLOCKS: ScheduleBlock[] = [
  { time: '05:47', title: 'Fajr', type: 'prayer', duration: 15, completed: false },
  { time: '09:00', title: 'Work Block 1', type: 'work', duration: 180, completed: false },
  { time: '13:15', title: 'Dhuhr', type: 'prayer', duration: 15, completed: false },
  { time: '13:30', title: 'Lunch', type: 'meal', duration: 30, completed: false },
  { time: '14:00', title: 'Work Block 2', type: 'work', duration: 180, completed: false },
  { time: '16:48', title: 'Asr', type: 'prayer', duration: 15, completed: false },
  { time: '17:30', title: 'Gym', type: 'health', duration: 75, completed: false },
  { time: '19:52', title: 'Maghrib', type: 'prayer', duration: 15, completed: false },
  { time: '20:30', title: 'Dinner', type: 'meal', duration: 30, completed: false },
  { time: '21:15', title: 'Isha', type: 'prayer', duration: 15, completed: false },
  { time: '22:00', title: 'Wind Down', type: 'personal', duration: 60, completed: false },
]

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5) // 5 AM to 11 PM
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 12) return `${hour === 0 ? 12 : 12} ${hour < 12 ? 'AM' : 'PM'}`
  return `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`
}

export default function SchedulePage() {
  const { todaySchedule, setSchedule, toggleScheduleBlock } = useStore()
  const [view, setView] = useState<'today' | 'week'>('today')
  const [now, setNow] = useState(new Date())
  const [toast, setToast] = useState('')
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setAnimateIn(true))
  }, [])

  // Load defaults if empty
  useEffect(() => {
    if (todaySchedule.length === 0) {
      setSchedule(DEFAULT_BLOCKS)
    }
  }, [todaySchedule.length, setSchedule])

  // Update clock every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const completedCount = todaySchedule.filter((b) => b.completed).length

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  // Position block on timeline
  const getBlockStyle = (block: ScheduleBlock) => {
    const startMin = timeToMinutes(block.time)
    const timelineStart = 5 * 60 // 5 AM
    const timelineEnd = 23 * 60 // 11 PM
    const totalMinutes = timelineEnd - timelineStart
    const top = ((startMin - timelineStart) / totalMinutes) * 100
    const height = (block.duration / totalMinutes) * 100
    return { top: `${top}%`, height: `${Math.max(height, 1.5)}%` }
  }

  return (
    <div className={`p-6 max-w-5xl mx-auto space-y-6 transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="label text-2xl tracking-widest">SCHEDULE</h1>
          <p className="text-[var(--text-dim)] text-xs mt-1">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} &middot; {completedCount}/{todaySchedule.length} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-hidden">
            {(['today', 'week'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-xs font-semibold tracking-wider transition-all ${
                  view === v ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'text-[var(--text-dim)] hover:text-[var(--text)]'
                }`}
              >
                {v === 'today' ? 'TODAY' : 'WEEK'}
              </button>
            ))}
          </div>
          <button
            onClick={() => showToast('AI schedule generation coming soon')}
            className="px-4 py-2 text-xs bg-[var(--accent)] text-[var(--bg)] rounded-[10px] font-semibold hover:brightness-110 transition-all"
          >
            Generate Schedule
          </button>
        </div>
      </div>

      {/* Today View */}
      {view === 'today' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
          <div className="relative" style={{ height: '900px' }}>
            {/* Hour lines */}
            {HOURS.map((hour) => {
              const pct = ((hour - 5) / 18) * 100
              return (
                <div key={hour} className="absolute left-0 right-0 flex items-start" style={{ top: `${pct}%` }}>
                  <span className="text-[10px] text-[var(--text-dim)] w-14 -mt-1.5 text-right pr-3 select-none">{formatHour(hour)}</span>
                  <div className="flex-1 border-t border-[var(--border)]/50" />
                </div>
              )
            })}

            {/* Current time indicator */}
            {currentMinutes >= 300 && currentMinutes <= 1380 && (
              <div
                className="absolute left-14 right-0 flex items-center z-20 pointer-events-none"
                style={{ top: `${((currentMinutes - 300) / 1080) * 100}%` }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5" />
                <div className="flex-1 border-t-2 border-rose-500" />
              </div>
            )}

            {/* Schedule blocks */}
            <div className="absolute left-16 right-2 top-0 bottom-0">
              {todaySchedule.map((block, i) => {
                const style = getBlockStyle(block)
                const typeClass = TYPE_BG[block.type]
                return (
                  <button
                    key={i}
                    onClick={() => toggleScheduleBlock(i)}
                    className={`absolute left-0 right-0 rounded-lg border px-3 py-1.5 text-left transition-all hover:brightness-110 ${typeClass} ${
                      block.completed ? 'opacity-50' : ''
                    }`}
                    style={{ top: style.top, height: style.height, minHeight: '28px' }}
                  >
                    <div className={`text-xs font-semibold ${block.completed ? 'line-through' : ''}`}>
                      {block.title}
                    </div>
                    <div className="text-[10px] opacity-70">
                      {block.time} &middot; {block.duration}min
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Week View */}
      {view === 'week' && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, di) => {
              const isToday = di === (now.getDay() + 6) % 7
              return (
                <div key={day} className="space-y-1.5">
                  <div className={`text-center text-[11px] font-semibold tracking-wider py-1.5 rounded-lg ${
                    isToday ? 'bg-[var(--accent)]/15 text-[var(--accent)]' : 'text-[var(--text-dim)]'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {todaySchedule.map((block, bi) => (
                      <div
                        key={bi}
                        className={`rounded-md border px-2 py-1 text-[10px] ${TYPE_BG[block.type]} ${
                          isToday && block.completed ? 'opacity-50 line-through' : ''
                        }`}
                      >
                        <span className="font-semibold">{block.time}</span>
                        <span className="ml-1 opacity-80">{block.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 justify-center">
        {(Object.entries(TYPE_COLORS) as [ScheduleBlock['type'], string][]).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] text-[var(--text-dim)] capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--surface)] border border-[var(--border)] rounded-[10px] px-5 py-3 text-sm text-[var(--text)] shadow-xl z-50 animate-in">
          {toast}
        </div>
      )}
    </div>
  )
}
