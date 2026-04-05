'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HealthLog, Task } from '@/stores/store'

const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const

export interface ScoreDetailDrawerContentProps {
  todayStr: string
  executionScore: number
  tasks: Task[]
  todayHealth: HealthLog
  tasksDoneToday: number
  tasksCommitted: number
  todayFocusSessions: number
  trackPrayers: boolean
  healthHistory: HealthLog[]
  xp: number
  level: number
  togglePrayer?: (p: (typeof PRAYER_KEYS)[number]) => void
  toggleTask?: (id: string) => void
}

type EarnedRow = {
  id: string
  category: 'Task' | 'Prayer' | 'Habit' | 'Focus'
  description: string
  points: number
  time: string
  href?: string
}

type RemainingRow = {
  id: string
  category: string
  description: string
  points: number
  action: 'prayer' | 'gym' | 'meal' | 'sleep' | 'energy' | 'focus' | 'task'
  key?: string
}

export default function ScoreDetailDrawerContent(p: ScoreDetailDrawerContentProps) {
  const router = useRouter()
  const [explainOpen, setExplainOpen] = useState(false)

  const prayerEnabled = p.trackPrayers

  const commitmentPtsEarned =
    p.tasksCommitted > 0
      ? Math.round((p.tasksDoneToday / p.tasksCommitted) * (prayerEnabled ? 35 : 43.75))
      : 0

  const tasksDone = useMemo(
    () => p.tasks.filter((t) => t.done && t.completedAt?.startsWith(p.todayStr)),
    [p.tasks, p.todayStr]
  )

  const earnedRows: EarnedRow[] = useMemo(() => {
    const rows: EarnedRow[] = []
    const perTask =
      p.tasksDoneToday > 0 ? commitmentPtsEarned / p.tasksDoneToday : 0

    for (const t of tasksDone) {
      rows.push({
        id: `task-${t.id}`,
        category: 'Task',
        description: t.text.slice(0, 80),
        points: Math.round(perTask * 10) / 10,
        time: t.completedAt ? new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
        href: `/tasks?highlight=${encodeURIComponent(t.id)}`,
      })
    }

    if (prayerEnabled) {
      for (const key of PRAYER_KEYS) {
        if (p.todayHealth.prayers[key]) {
          rows.push({
            id: `prayer-${key}`,
            category: 'Prayer',
            description: `${key} prayer`,
            points: 4,
            time: p.todayStr,
          })
        }
      }
    }

    if (p.todayHealth.gym) {
      rows.push({
        id: 'gym',
        category: 'Habit',
        description: 'Gym / workout',
        points: prayerEnabled ? 10 : 12.5,
        time: p.todayStr,
        href: '/health',
      })
    }
    if (p.todayHealth.mealQuality === 'good') {
      rows.push({
        id: 'meal',
        category: 'Habit',
        description: 'Meal quality: good',
        points: prayerEnabled ? 5 : 6.25,
        time: p.todayStr,
        href: '/health',
      })
    }
    if (p.todayHealth.energyDrinks < 2) {
      rows.push({
        id: 'energy',
        category: 'Habit',
        description: 'Energy drinks under limit',
        points: prayerEnabled ? 5 : 6.25,
        time: p.todayStr,
        href: '/health',
      })
    }
    if (p.todayHealth.sleepTime && p.todayHealth.wakeTime) {
      rows.push({
        id: 'sleep',
        category: 'Habit',
        description: 'Sleep / wake logged',
        points: prayerEnabled ? 5 : 6.25,
        time: p.todayStr,
        href: '/health',
      })
    }

    const fs = Math.min(prayerEnabled ? 20 : 25, p.todayFocusSessions * (prayerEnabled ? 5 : 6.25))
    if (fs > 0) {
      rows.push({
        id: 'focus',
        category: 'Focus',
        description: `${p.todayFocusSessions} focus session(s)`,
        points: Math.round(fs * 10) / 10,
        time: p.todayStr,
        href: '/focus',
      })
    }

    return rows
  }, [
    tasksDone,
    p.todayHealth,
    p.todayFocusSessions,
    prayerEnabled,
    commitmentPtsEarned,
    p.tasksDoneToday,
    p.todayStr,
  ])

  const remainingRows: RemainingRow[] = useMemo(() => {
    const rows: RemainingRow[] = []
    if (prayerEnabled) {
      for (const key of PRAYER_KEYS) {
        if (!p.todayHealth.prayers[key]) {
          rows.push({
            id: `rem-prayer-${key}`,
            category: 'Prayer',
            description: `Pray ${key}`,
            points: 4,
            action: 'prayer',
            key,
          })
        }
      }
    }
    if (!p.todayHealth.gym) {
      rows.push({ id: 'rem-gym', category: 'Habit', description: 'Log gym', points: prayerEnabled ? 10 : 12.5, action: 'gym' })
    }
    if (p.todayHealth.mealQuality !== 'good') {
      rows.push({
        id: 'rem-meal',
        category: 'Habit',
        description: 'Good meal quality',
        points: prayerEnabled ? 5 : 6.25,
        action: 'meal',
      })
    }
    if (p.todayHealth.energyDrinks >= 2) {
      rows.push({
        id: 'rem-ed',
        category: 'Habit',
        description: 'Reduce energy drinks (<2)',
        points: prayerEnabled ? 5 : 6.25,
        action: 'energy',
      })
    }
    if (!p.todayHealth.sleepTime || !p.todayHealth.wakeTime) {
      rows.push({
        id: 'rem-sleep',
        category: 'Habit',
        description: 'Log sleep & wake',
        points: prayerEnabled ? 5 : 6.25,
        action: 'sleep',
      })
    }
    const maxF = prayerEnabled ? 20 : 25
    const curF = Math.min(maxF, p.todayFocusSessions * (prayerEnabled ? 5 : 6.25))
    if (curF < maxF) {
      rows.push({
        id: 'rem-focus',
        category: 'Focus',
        description: 'More focus sessions',
        points: Math.round((maxF - curF) * 10) / 10,
        action: 'focus',
      })
    }
    const openTasks = p.tasks.filter((t) => !t.done)
    for (const t of openTasks.slice(0, 6)) {
      rows.push({
        id: `rem-task-${t.id}`,
        category: 'Task',
        description: t.text.slice(0, 60),
        points: Math.round((35 / Math.max(p.tasksCommitted, 1)) * 10) / 10,
        action: 'task',
      })
    }
    return rows
  }, [p.todayHealth, prayerEnabled, p.todayFocusSessions, p.tasks, p.tasksCommitted])

  const dollarLines = useMemo(() => {
    const doneToday = p.tasks.filter((t) => t.done && t.completedAt?.startsWith(p.todayStr) && t.dollarValue)
    const open = p.tasks.filter((t) => !t.done && t.dollarValue)
    let earned = 0
    for (const t of doneToday) {
      earned += (t.dollarValue ?? 0) / 30
    }
    let left = 0
    for (const t of open) {
      left += (t.dollarValue ?? 0) / 30
    }
    const ideal = earned + left
    return { earned, left, ideal }
  }, [p.tasks, p.todayStr])

  const trend7 = useMemo(() => {
    const days = [...p.healthHistory]
      .filter((h) => h.date && typeof h.dailyScore === 'number')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7)
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days.map((h) => ({
      day: h.date.slice(5),
      label: labels[new Date(h.date + 'T12:00:00').getDay()] ?? h.date,
      score: h.dailyScore,
      date: h.date,
    }))
  }, [p.healthHistory])

  const avg7 =
    trend7.length > 0 ? trend7.reduce((s, d) => s + d.score, 0) / trend7.length : 0

  const records = useMemo(() => {
    const scored = [...p.healthHistory].filter((h) => typeof h.dailyScore === 'number' && h.date)
    let bestDay = { date: '—', score: 0, summary: '—' }
    for (const h of scored) {
      if (h.dailyScore > bestDay.score) {
        bestDay = {
          date: h.date,
          score: h.dailyScore,
          summary: `${Object.values(h.prayers).filter(Boolean).length}/5 prayers logged`,
        }
      }
    }
    let bestWeekAvg = 0
    if (scored.length >= 7) {
      const sorted = scored.sort((a, b) => a.date.localeCompare(b.date))
      for (let i = 0; i <= sorted.length - 7; i++) {
        const slice = sorted.slice(i, i + 7)
        const a = slice.reduce((s, x) => s + x.dailyScore, 0) / 7
        if (a > bestWeekAvg) bestWeekAvg = a
      }
    }
    let streak = 0
    const byDate = [...scored].sort((a, b) => b.date.localeCompare(a.date))
    for (let i = 0; i < byDate.length - 1; i++) {
      if (byDate[i].dailyScore > byDate[i + 1].dailyScore) streak++
      else break
    }
    const totalPoints = (p.level - 1) * 100 + p.xp
    return { bestDay, bestWeekAvg, streak, totalPoints }
  }, [p.healthHistory, p.xp, p.level])

  const idealPoints = 100
  const earnedPoints = p.executionScore

  return (
    <div className="space-y-6 pb-6">
      <div>
        <p className="text-[13px] font-semibold text-[var(--text-secondary)] mb-2">Points earned today</p>
        <div className="space-y-1">
          {earnedRows.length === 0 ? (
            <p className="text-[13px] text-[var(--text-tertiary)]">Nothing logged yet — complete a task or habit.</p>
          ) : (
            earnedRows.map((row, i) => (
              <motion.button
                key={row.id}
                type="button"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => row.href && router.push(row.href)}
                className="flex w-full items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 px-3 py-2 text-left hover:bg-[var(--bg-secondary)]"
              >
                <span className="text-[var(--positive)]">✓</span>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-medium uppercase text-[var(--text-tertiary)]">{row.category}</span>
                  <p className="text-[14px] text-[var(--text-primary)]">{row.description}</p>
                  <p className="text-[11px] text-[var(--text-tertiary)]">{row.time}</p>
                </div>
                <span className="font-mono text-[14px] text-[var(--text-primary)]">{row.points.toFixed(1)}</span>
              </motion.button>
            ))
          )}
        </div>
      </div>

      <div>
        <p className="text-[13px] font-semibold text-[var(--text-secondary)] mb-2">Points remaining</p>
        <div className="space-y-1">
          {remainingRows.slice(0, 12).map((row, i) => (
            <motion.button
              key={row.id}
              type="button"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => {
                if (row.action === 'prayer' && row.key && p.togglePrayer) {
                  p.togglePrayer(row.key as (typeof PRAYER_KEYS)[number])
                } else if (row.action === 'task' && row.id.startsWith('rem-task-') && p.toggleTask) {
                  const id = row.id.replace('rem-task-', '')
                  p.toggleTask(id)
                } else {
                  router.push('/health')
                }
              }}
              className="flex w-full items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/20 px-3 py-2 text-left"
            >
              <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[var(--text-tertiary)]" />
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium uppercase text-[var(--text-tertiary)]">{row.category}</span>
                <p className="text-[14px] text-[var(--text-primary)]">{row.description}</p>
              </div>
              <span className="font-mono text-[14px] text-[var(--text-tertiary)]">{row.points.toFixed(1)}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/30 p-4">
        <p className="text-[13px] font-semibold text-[var(--text-secondary)] mb-3">Dollar equivalent (AI-estimated)</p>
        <p className="font-mono text-[15px] text-[var(--positive)]">Earned today: ~${Math.round(dollarLines.earned).toLocaleString()}</p>
        <p className="mt-1 font-mono text-[15px] text-[var(--negative)]">Left on table: ~${Math.round(dollarLines.left).toLocaleString()}</p>
        <p className="mt-1 font-mono text-[14px] text-[var(--text-tertiary)]">Ideal day value: ~${Math.round(dollarLines.ideal).toLocaleString()}</p>
        <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
          These values are AI-estimated from task dollar values (monthly/30).
          <button
            type="button"
            className="ml-1 inline text-[var(--accent)]"
            aria-expanded={explainOpen}
            onClick={() => setExplainOpen(!explainOpen)}
          >
            [?]
          </button>
        </p>
        {explainOpen && (
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            Daily rate ≈ task dollar value ÷ 30. Earned sums completed tasks today; left on table sums open tasks with
            estimates; ideal is both.
          </p>
        )}
      </div>

      <div>
        <p className="text-[13px] font-semibold text-[var(--text-secondary)] mb-2">7-day trend</p>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend7}>
              <defs>
                <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-[12px] shadow-lg">
                      <p className="font-mono text-[var(--accent)]">{payload[0].payload.date}</p>
                      <p>Score: {payload[0].value}</p>
                    </div>
                  ) : null
                }
              />
              <ReferenceLine y={avg7} stroke="var(--accent)" strokeDasharray="4 4" strokeOpacity={0.4} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#scoreFill)"
                dot={(props: { cx?: number; cy?: number; payload?: { date?: string } }) => {
                  const { cx, cy, payload } = props
                  if (cx == null || cy == null) return null
                  const r = payload?.date === p.todayStr ? 6 : 3
                  return <circle cx={cx} cy={cy} r={r} fill="var(--accent)" />
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="text-[13px] font-semibold text-[var(--text-secondary)] mb-2">Personal records</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] p-3">
            <p className="text-[11px] text-[var(--text-tertiary)]">Best day</p>
            <p className="font-mono text-[18px] text-[var(--text-primary)]">{records.bestDay.score}</p>
            <p className="text-[12px] text-[var(--text-secondary)]">{records.bestDay.date}</p>
            <p className="text-[11px] text-[var(--text-dim)]">{records.bestDay.summary}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-3">
            <p className="text-[11px] text-[var(--text-tertiary)]">Best week avg</p>
            <p className="font-mono text-[18px] text-[var(--text-primary)]">{records.bestWeekAvg.toFixed(1)}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-3">
            <p className="text-[11px] text-[var(--text-tertiary)]">Improving streak (days)</p>
            <p className="font-mono text-[18px] text-[var(--text-primary)]">{records.streak}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-3">
            <p className="text-[11px] text-[var(--text-tertiary)]">Total XP (all-time)</p>
            <p className="font-mono text-[18px] text-[var(--text-primary)]">{records.totalPoints}</p>
          </div>
        </div>
      </div>

      <p className="text-center font-mono text-[13px] text-[var(--text-tertiary)]">
        {earnedPoints} / {idealPoints} vs ideal
      </p>
      <Link href="/ai?q=How+does+execution+scoring+work" className="block text-center text-[13px] text-[var(--accent)]">
        See how scoring works →
      </Link>
    </div>
  )
}
