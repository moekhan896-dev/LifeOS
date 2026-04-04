'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  useStore,
  getIdealEarnedByNow,
  getArtEarnedToday,
  getLeftOnTable,
  IDEAL_ART_DAILY,
  type Task,
  type HealthLog,
} from '@/stores/store'
import { Drawer } from 'vaul'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

// ═══ Helpers ═══
const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 0 })
const pct = (a: number, b: number) => (b > 0 ? Math.min(Math.round((a / b) * 100), 100) : 0)

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'absence'

function getTimeOfDay(
  hour: number,
  tasks: Task[],
  healthHistory: HealthLog[],
): TimeOfDay {
  // check for 2+ day absence
  const todayStr = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const hasRecentTaskCompletion = tasks.some(
    (t) =>
      t.done &&
      t.completedAt &&
      (t.completedAt.startsWith(todayStr) || t.completedAt.startsWith(yesterday)),
  )
  const hasRecentHealth = healthHistory.some(
    (h) => h.date === todayStr || h.date === yesterday,
  )
  if (!hasRecentTaskCompletion && !hasRecentHealth && tasks.length > 0) {
    // Find the last activity date
    const lastCompletion = tasks
      .filter((t) => t.done && t.completedAt)
      .sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1))[0]
    const lastDate = lastCompletion?.completedAt?.split('T')[0]
    if (lastDate) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastDate).getTime()) / 86400000,
      )
      if (daysSince >= 2) return 'absence'
    }
  }

  if (hour < 12) return 'morning'
  if (hour < 20) return 'afternoon'
  return 'evening'
}

// ═══ Stagger animation ═══
const stagger = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const },
})

// ═══ Float-up "+$X" animation ═══
function FloatUp({ value, trigger }: { value: number; trigger: number }) {
  return (
    <AnimatePresence>
      {trigger > 0 && (
        <motion.span
          key={trigger}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -30 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 text-sm font-bold text-emerald-400 glow-emerald"
        >
          +${fmt(value)}
        </motion.span>
      )}
    </AnimatePresence>
  )
}

// ═══ MAIN PAGE ═══
export default function HomePage() {
  const tasks = useStore((s) => s.tasks)
  const todayHealth = useStore((s) => s.todayHealth)
  const healthHistory = useStore((s) => s.healthHistory)
  const businesses = useStore((s) => s.businesses)
  const clients = useStore((s) => s.clients)
  const streaks = useStore((s) => s.streaks)
  const dailyScores = useStore((s) => s.dailyScores)
  const toggleTask = useStore((s) => s.toggleTask)
  const skipTask = useStore((s) => s.skipTask)
  const togglePrayer = useStore((s) => s.togglePrayer)
  const updateHealth = useStore((s) => s.updateHealth)
  const logEvent = useStore((s) => s.logEvent)

  const [heroTaskId, setHeroTaskId] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const [floatTrigger, setFloatTrigger] = useState(0)
  const [lastCompletedValue, setLastCompletedValue] = useState(0)
  const [hour, setHour] = useState(() => new Date().getHours())

  // Update hour every minute
  useEffect(() => {
    const iv = setInterval(() => setHour(new Date().getHours()), 60_000)
    return () => clearInterval(iv)
  }, [])

  // ═══ Computed ═══
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const artEarned = useMemo(
    () => getArtEarnedToday(tasks, todayHealth),
    [tasks, todayHealth],
  )
  const idealEarned = useMemo(() => getIdealEarnedByNow(), [hour])
  const leftOnTable = useMemo(() => getLeftOnTable(tasks), [tasks])

  const undoneTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.done)
        .sort((a, b) => b.dollarValue - a.dollarValue),
    [tasks],
  )

  const doneTodayTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.done && t.completedAt?.startsWith(todayStr),
      ),
    [tasks, todayStr],
  )

  const timeOfDay = useMemo(
    () => getTimeOfDay(hour, tasks, healthHistory),
    [hour, tasks, healthHistory],
  )

  const heroTask = useMemo(() => {
    if (heroTaskId) {
      const found = undoneTasks.find((t) => t.id === heroTaskId)
      if (found) return found
    }
    return undoneTasks[0] || null
  }, [heroTaskId, undoneTasks])

  const prayerCount = useMemo(
    () => Object.values(todayHealth.prayers).filter(Boolean).length,
    [todayHealth.prayers],
  )

  const bestDay = useMemo(() => {
    if (dailyScores.length === 0) return 0
    return Math.max(...dailyScores.map((d) => d.earned))
  }, [dailyScores])

  const longestStreak = useMemo(() => {
    if (streaks.length === 0) return { habit: 'none', current: 0, best: 0 }
    return streaks.reduce((max, s) => (s.current > max.current ? s : max), streaks[0])
  }, [streaks])

  const yesterdayScore = useMemo(() => {
    const y = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    return dailyScores.find((d) => d.date === y)
  }, [dailyScores])

  const todayPct = pct(artEarned, IDEAL_ART_DAILY.total)
  const yesterdayPct = yesterdayScore?.pct ?? 0

  // ═══ Actions ═══
  const handleComplete = useCallback(
    (task: Task) => {
      toggleTask(task.id)
      logEvent('task_completed', { taskId: task.id, dollarValue: task.dollarValue })
      toast.success(`+$${fmt(task.dollarValue)}`)
      setLastCompletedValue(task.dollarValue)
      setFloatTrigger((p) => p + 1)
      // If hero was completed, reset to next highest
      if (task.id === heroTask?.id) {
        setHeroTaskId(null)
      }
    },
    [toggleTask, logEvent, heroTask],
  )

  const handleSkip = useCallback(
    (taskId: string) => {
      skipTask(taskId)
      toast('Skipped', { description: 'Cost grows each day you delay.' })
    },
    [skipTask],
  )

  const makeHero = useCallback((taskId: string) => {
    setHeroTaskId(taskId)
    setShowOptions(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // ═══ Alert logic ═══
  const alerts = useMemo(() => {
    const list: { id: string; color: string; icon: string; text: string; action: string }[] = []
    // Client concentration
    const totalNet = clients.filter((c) => c.active).reduce((s, c) => s + c.grossMonthly - c.adSpend, 0)
    if (totalNet > 0) {
      const bigClient = clients.find(
        (c) => c.active && (c.grossMonthly - c.adSpend) / totalNet > 0.4,
      )
      if (bigClient) {
        list.push({
          id: 'concentration',
          color: 'rose',
          icon: '⚠️',
          text: `${bigClient.name} is ${Math.round(((bigClient.grossMonthly - bigClient.adSpend) / totalNet) * 100)}% of net. Diversify.`,
          action: 'View Empire',
        })
      }
    }
    // Avoidance
    const avoided = tasks.find((t) => !t.done && t.skippedCount > 3)
    if (avoided) {
      list.push({
        id: 'avoidance',
        color: 'amber',
        icon: '🫣',
        text: `"${avoided.text.slice(0, 40)}..." skipped ${avoided.skippedCount}x. You're avoiding this.`,
        action: 'Do it now',
      })
    }
    // Cold email
    list.push({
      id: 'cold_email',
      color: 'emerald',
      icon: '📧',
      text: 'Cold email: $585/hr. Last sent: never.',
      action: 'Start now',
    })
    // Prayer correlation
    list.push({
      id: 'prayer_corr',
      color: 'gold',
      icon: '🤲',
      text: 'Fajr + gym = 3x more tasks completed.',
      action: 'Set alarm',
    })
    return list
  }, [clients, tasks])

  // ═══ RENDER ═══
  return (
    <div className="relative min-h-screen pb-24" style={{ background: 'linear-gradient(180deg, #060810 0%, #0a0d15 50%, #080b12 100%)' }}>
      {/* ══════════ ZONE 1: LIVE TICKER ══════════ */}
      <TickerBar
        artEarned={artEarned}
        idealEarned={idealEarned}
        leftOnTable={leftOnTable}
        doneTodayTasks={doneTodayTasks}
        undoneTasks={undoneTasks}
        dailyScores={dailyScores}
        bestDay={bestDay}
        todayHealth={todayHealth}
      />

      <div className="space-y-5 px-4 pt-[72px]">
        {/* ══════════ ZONE 2: THE ACTION CARD ══════════ */}
        <AnimatePresence mode="wait">
          {timeOfDay === 'morning' && (
            <motion.div
              key="morning"
              {...stagger(1)}
              exit={{ opacity: 0, y: -10 }}
            >
              <MorningCard
                artEarned={artEarned}
                idealEarned={idealEarned}
                heroTask={heroTask}
                undoneTasks={undoneTasks}
                businesses={businesses}
                showOptions={showOptions}
                setShowOptions={setShowOptions}
                onComplete={handleComplete}
                onMakeHero={makeHero}
                floatTrigger={floatTrigger}
                lastCompletedValue={lastCompletedValue}
              />
            </motion.div>
          )}

          {timeOfDay === 'afternoon' && (
            <motion.div
              key="afternoon"
              {...stagger(1)}
              exit={{ opacity: 0, y: -10 }}
            >
              <AfternoonCard
                artEarned={artEarned}
                idealEarned={idealEarned}
                undoneTasks={undoneTasks}
                businesses={businesses}
                onComplete={handleComplete}
                onSkip={handleSkip}
              />
            </motion.div>
          )}

          {timeOfDay === 'evening' && (
            <motion.div
              key="evening"
              {...stagger(1)}
              exit={{ opacity: 0, y: -10 }}
            >
              <EveningCard
                artEarned={artEarned}
                idealEarned={IDEAL_ART_DAILY.total}
                doneTodayTasks={doneTodayTasks}
                undoneTasks={undoneTasks}
                todayPct={todayPct}
                yesterdayPct={yesterdayPct}
              />
            </motion.div>
          )}

          {timeOfDay === 'absence' && (
            <motion.div
              key="absence"
              {...stagger(1)}
              exit={{ opacity: 0, y: -10 }}
            >
              <AbsenceCard
                tasks={tasks}
                heroTask={heroTask}
                onComplete={handleComplete}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════ ZONE 3: THE PULSE ══════════ */}
        <motion.div {...stagger(6)} className="grid grid-cols-2 gap-3">
          <PrayerCard
            prayers={todayHealth.prayers}
            prayerCount={prayerCount}
            togglePrayer={togglePrayer}
            healthHistory={healthHistory}
          />
          <GymCard
            gymDone={todayHealth.gym}
            updateHealth={updateHealth}
            streaks={streaks}
          />
          <SleepCard
            wakeTime={todayHealth.wakeTime}
            bedTime={todayHealth.bedTime}
            updateHealth={updateHealth}
          />
          <StreakCard streaks={streaks} longestStreak={longestStreak} />
        </motion.div>

        {/* ══════════ ALERTS ══════════ */}
        {alerts.length > 0 && (
          <motion.div {...stagger(10)} className="space-y-2.5">
            {alerts.map((alert, i) => {
              const alertColor = alert.color === 'rose' ? '#f43f5e' : alert.color === 'amber' ? '#f59e0b' : alert.color === 'emerald' ? '#10b981' : '#eab308'
              return (
                <motion.div
                  key={alert.id}
                  {...stagger(11 + i)}
                  className="flex items-center gap-3 rounded-[16px] p-4 transition-all hover:-translate-y-[1px]"
                  style={{ background: 'rgba(14,17,24,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderLeftWidth: 3, borderLeftColor: alertColor, boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
                >
                  <span className="text-lg">{alert.icon}</span>
                  <p className="flex-1 text-xs leading-snug text-white/70">
                    {alert.text}
                  </p>
                  <button
                    onClick={() => toast(alert.action)}
                    className="shrink-0 rounded-[10px] px-3 py-1.5 text-[11px] font-semibold transition-all hover:brightness-110"
                    style={{ background: `${alertColor}15`, color: alertColor, border: `1px solid ${alertColor}30` }}
                  >
                    {alert.action}
                  </button>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* ══════════ COMMAND INPUT ══════════ */}
        <motion.div {...stagger(12)} className="mt-6">
          <div className="flex items-center gap-3 rounded-[16px] p-3" style={{ background: 'rgba(14,17,24,0.85)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 -4px 24px rgba(0,0,0,0.2)' }}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-white" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
              <span className="text-sm">🎤</span>
            </div>
            <input placeholder="Quick update or ask AI..." className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none" />
            <span className="data shrink-0 rounded-[8px] bg-white/[0.05] px-2.5 py-1 text-[10px] text-white/30">↵</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// ZONE 1 — LIVE TICKER
// ═══════════════════════════════════════════════════════
function TickerBar({
  artEarned,
  idealEarned,
  leftOnTable,
  doneTodayTasks,
  undoneTasks,
  dailyScores,
  bestDay,
  todayHealth,
}: {
  artEarned: number
  idealEarned: number
  leftOnTable: number
  doneTodayTasks: Task[]
  undoneTasks: Task[]
  dailyScores: { date: string; earned: number; idealEarned: number; pct: number }[]
  bestDay: number
  todayHealth: HealthLog
}) {
  const progressPct = pct(artEarned, idealEarned)
  const chartData = useMemo(
    () => dailyScores.slice(-7).map((d) => ({ date: d.date, score: d.earned })),
    [dailyScores],
  )

  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          className="fixed left-0 right-0 top-0 z-40 cursor-pointer border-b border-white/[0.04] bg-[rgba(6,8,16,0.85)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between px-4 py-2">
            <span className="data text-sm font-semibold text-emerald-400 glow-emerald">
              💰 ${fmt(artEarned)} earned
            </span>
            <span className="data text-[10px] text-white/40">
              {progressPct}% of Ideal
            </span>
            <span className="data text-sm font-semibold text-rose-400 glow-rose">
              📉 -${fmt(leftOnTable)} left
            </span>
          </div>
          <div className="px-4 pb-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                initial={{ width: '0%' }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              />
            </div>
            <p className="mt-1 text-center text-[10px] text-white/30">
              You: {progressPct}% of Ideal Art
            </p>
          </div>
        </motion.div>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[20px] border border-white/[0.06] bg-[rgba(14,17,24,0.95)] p-5 backdrop-blur-xl">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
          <Drawer.Title className="mb-4 text-center text-lg font-bold tracking-wide text-white">
            TODAY&apos;S BREAKDOWN
          </Drawer.Title>

          {/* Ideal vs You */}
          <div className="mb-4 flex items-center justify-between rounded-xl bg-white/[0.03] p-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Ideal Art by now</p>
              <p className="data text-xl font-bold text-white/60">${fmt(idealEarned)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-emerald-400/80">You</p>
              <p className="data text-xl font-bold text-emerald-400 glow-emerald">${fmt(artEarned)}</p>
            </div>
          </div>

          {/* Completed */}
          {doneTodayTasks.length > 0 && (
            <div className="mb-3">
              <p className="label mb-2">Completed</p>
              {doneTodayTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-emerald-400">✅ {t.text}</span>
                  <span className="data text-xs font-semibold text-emerald-400">+${fmt(t.dollarValue)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Incomplete high-value */}
          {undoneTasks.filter((t) => t.priority === 'crit' || t.priority === 'high').length > 0 && (
            <div className="mb-3">
              <p className="label mb-2">Left on table</p>
              {undoneTasks
                .filter((t) => t.priority === 'crit' || t.priority === 'high')
                .map((t) => (
                  <div key={t.id} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-rose-400">❌ {t.text}</span>
                    <span className="data text-xs font-semibold text-rose-400">-${fmt(t.dollarValue)}</span>
                  </div>
                ))}
            </div>
          )}

          {/* 7-day chart */}
          {chartData.length > 1 && (
            <div className="mb-3">
              <p className="label mb-2">Last 7 days</p>
              <div className="h-24 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="tickerGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#tickerGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {bestDay > 0 && (
            <p className="mb-2 text-center text-xs text-white/40">
              Your best day: <span className="data font-semibold text-emerald-400">${fmt(bestDay)}</span>
            </p>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

// ═══════════════════════════════════════════════════════
// ZONE 2 — MORNING CARD
// ═══════════════════════════════════════════════════════
function MorningCard({
  artEarned,
  idealEarned,
  heroTask,
  undoneTasks,
  businesses,
  showOptions,
  setShowOptions,
  onComplete,
  onMakeHero,
  floatTrigger,
  lastCompletedValue,
}: {
  artEarned: number
  idealEarned: number
  heroTask: Task | null
  undoneTasks: Task[]
  businesses: { id: string; name: string; color: string }[]
  showOptions: boolean
  setShowOptions: (v: boolean) => void
  onComplete: (t: Task) => void
  onMakeHero: (id: string) => void
  floatTrigger: number
  lastCompletedValue: number
}) {
  const bizColor = businesses.find((b) => b.id === heroTask?.businessId)?.color || '#10b981'

  return (
    <div className="relative">
      {/* Animated border glow */}
      <div className="absolute -inset-[1px] rounded-[21px] bg-gradient-to-br from-emerald-500/30 via-transparent to-cyan-500/20 opacity-60" />
      <div className="glass relative overflow-hidden rounded-[20px] p-8" style={{ border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 0 40px rgba(16,185,129,0.08), 0 4px 24px rgba(0,0,0,0.2)' }}>
        {/* Subtle animated gradient bg */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-cyan-500/[0.03]"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <h2 className="text-xl font-bold text-white">
              ☀️ GOOD MORNING, ART
            </h2>
            <div className="text-right">
              <p className="data text-[10px] text-white/40">
                Score: <span className="text-emerald-400">${fmt(artEarned)}</span> vs Ideal: ${fmt(idealEarned)}
              </p>
            </div>
          </div>

          {heroTask ? (
            <>
              {/* Hero task */}
              <p className="label mb-1.5 text-emerald-400/80">YOUR #1 RIGHT NOW:</p>
              <p className="mb-2 text-2xl font-semibold leading-tight text-white">
                {heroTask.text}
              </p>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="data text-sm font-semibold text-emerald-400 glow-emerald">
                  Worth: ${fmt(heroTask.dollarValue)} today
                </span>
                {heroTask.skippedCount > 0 && (
                  <span className="data text-xs text-rose-400">
                    Delayed {heroTask.skippedCount}d. Cost: ${fmt(heroTask.dollarValue * heroTask.skippedCount)}
                  </span>
                )}
              </div>

              {/* Voice CTA */}
              <div className="relative mb-3">
                <FloatUp value={lastCompletedValue} trigger={floatTrigger} />
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-base font-bold text-white shadow-lg shadow-emerald-500/20"
                >
                  🎤 I&apos;m starting this
                </motion.button>
              </div>

              {/* Secondary actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="text-xs text-white/40 underline decoration-white/10 underline-offset-2 transition-colors hover:text-white/60"
                >
                  {showOptions ? 'Hide options' : 'Show me other options'}
                </button>
                <button
                  onClick={() => onComplete(heroTask)}
                  className="rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-white/[0.1]"
                >
                  I already did this ✓
                </button>
              </div>
            </>
          ) : (
            <div className="py-6 text-center">
              <p className="text-lg font-semibold text-emerald-400 glow-emerald">
                All tasks complete! 🎉
              </p>
              <p className="mt-1 text-sm text-white/40">Ideal Art is proud.</p>
            </div>
          )}

          {/* Show other options */}
          <AnimatePresence>
            {showOptions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                className="overflow-hidden"
              >
                <div className="mt-4 max-h-60 space-y-1.5 overflow-y-auto rounded-xl bg-white/[0.03] p-3">
                  {undoneTasks.map((t) => {
                    const biz = businesses.find((b) => b.id === t.businessId)
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-white/[0.04]"
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: biz?.color || '#666' }}
                        />
                        <span className="flex-1 truncate text-sm text-white/70">
                          {t.text}
                        </span>
                        <span className="data shrink-0 text-xs text-emerald-400">
                          ${fmt(t.dollarValue)}
                        </span>
                        <button
                          onClick={() => onMakeHero(t.id)}
                          className="shrink-0 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/20"
                        >
                          Make #1
                        </button>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// ZONE 2 — AFTERNOON CARD
// ═══════════════════════════════════════════════════════
function AfternoonCard({
  artEarned,
  idealEarned,
  undoneTasks,
  businesses,
  onComplete,
  onSkip,
}: {
  artEarned: number
  idealEarned: number
  undoneTasks: Task[]
  businesses: { id: string; name: string; color: string }[]
  onComplete: (t: Task) => void
  onSkip: (id: string) => void
}) {
  return (
    <div className="glass overflow-hidden rounded-[20px] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-white">
          ⚡ {undoneTasks.length} ACTIONS LEFT TODAY
        </h2>
        <p className="data text-xs text-white/40">
          Score: <span className="text-emerald-400">${fmt(artEarned)}</span> / ${fmt(idealEarned)}
        </p>
      </div>

      <div className="space-y-2">
        {undoneTasks.map((task, i) => {
          const biz = businesses.find((b) => b.id === task.businessId)
          return (
            <motion.div
              key={task.id}
              {...stagger(i + 2)}
              className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.05]"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: biz?.color || '#666' }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white/80">
                  {task.text}
                </p>
              </div>
              <span className="data shrink-0 text-xs font-semibold text-emerald-400 glow-emerald">
                ${fmt(task.dollarValue)}
              </span>
              <button
                onClick={() => onComplete(task)}
                className="shrink-0 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                Done ✓
              </button>
              <button
                onClick={() => onSkip(task.id)}
                className="shrink-0 rounded-lg bg-white/[0.04] px-2 py-1 text-[10px] font-medium text-white/30 transition-colors hover:text-white/50"
              >
                Skip
              </button>
            </motion.div>
          )
        })}
      </div>

      {undoneTasks.length === 0 && (
        <div className="py-6 text-center">
          <p className="text-lg font-semibold text-emerald-400 glow-emerald">
            All done! 🎉
          </p>
        </div>
      )}

      <div className="mt-4 text-center">
        <Link
          href="/command"
          className="text-xs text-white/40 underline decoration-white/10 underline-offset-2 transition-colors hover:text-white/60"
        >
          Ready to wrap up? End my day →
        </Link>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// ZONE 2 — EVENING CARD
// ═══════════════════════════════════════════════════════
function EveningCard({
  artEarned,
  idealEarned,
  doneTodayTasks,
  undoneTasks,
  todayPct,
  yesterdayPct,
}: {
  artEarned: number
  idealEarned: number
  doneTodayTasks: Task[]
  undoneTasks: Task[]
  todayPct: number
  yesterdayPct: number
}) {
  const progressPct = pct(artEarned, idealEarned)

  return (
    <div className="glass overflow-hidden rounded-[20px] p-5">
      <h2 className="mb-4 text-center text-base font-bold tracking-wide text-white">
        🏁 TODAY&apos;S SCORE
      </h2>

      {/* Big score */}
      <div className="mb-4 flex items-end justify-center gap-6">
        <div className="text-center">
          <p className="data text-[48px] font-extrabold text-emerald-400 glow-emerald">
            ${fmt(artEarned)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-white/40">You</p>
        </div>
        <div className="mb-1 text-xl text-white/20">vs</div>
        <div className="text-center">
          <p className="data text-[40px] font-extrabold text-white/30 opacity-40">
            ${fmt(idealEarned)}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-white/40">Ideal Art</p>
        </div>
      </div>

      {/* Progress arc */}
      <div className="flex justify-center my-3">
        <svg width="120" height="65" viewBox="0 0 120 65">
          <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" strokeLinecap="round" />
          <motion.path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#10b981" strokeWidth="6" strokeLinecap="round"
            strokeDasharray="157" initial={{ strokeDashoffset: 157 }}
            animate={{ strokeDashoffset: 157 * (1 - progressPct / 100) }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] as const }} />
          <text x="60" y="55" textAnchor="middle" fill="#10b981" fontSize="14" fontWeight="700" fontFamily="var(--font-mono)">{progressPct}%</text>
        </svg>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
            initial={{ width: '0%' }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] as const }}
          />
        </div>
        <p className="mt-1 text-center text-[10px] text-white/30">{progressPct}%</p>
      </div>

      {/* Won */}
      {doneTodayTasks.length > 0 && (
        <div className="mb-3">
          <p className="label mb-1.5">✅ Won:</p>
          {doneTodayTasks.map((t) => (
            <div key={t.id} className="mb-1.5 flex items-center justify-between rounded-xl p-2.5" style={{ background: 'rgba(16,185,129,0.04)', borderLeft: '3px solid rgba(16,185,129,0.4)', backdropFilter: 'blur(8px)' }}>
              <span className="text-xs text-emerald-300/80">{t.text}</span>
              <span className="data text-[11px] font-semibold text-emerald-400 glow-emerald">+${fmt(t.dollarValue)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Lost */}
      {undoneTasks.filter((t) => t.priority === 'crit' || t.priority === 'high').length > 0 && (
        <div className="mb-3">
          <p className="label mb-1.5">❌ Lost:</p>
          {undoneTasks
            .filter((t) => t.priority === 'crit' || t.priority === 'high')
            .map((t) => (
              <div key={t.id} className="mb-1.5 flex items-center justify-between rounded-xl p-2.5" style={{ background: 'rgba(244,63,94,0.04)', borderLeft: '3px solid rgba(244,63,94,0.4)', backdropFilter: 'blur(8px)' }}>
                <span className="text-xs text-rose-300/80">{t.text}</span>
                <span className="data text-[11px] font-semibold text-rose-400 glow-rose">-${fmt(t.dollarValue)}</span>
              </div>
            ))}
        </div>
      )}

      {/* Day comparison */}
      <p className="mb-4 text-center text-xs text-white/30">
        Yesterday: {yesterdayPct}% → Today: {todayPct}%
      </p>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 rounded-xl bg-white/[0.05] py-2.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/[0.08]">
          Set Fajr alarm (5:47)
        </button>
        <button className="flex-1 rounded-xl bg-white/[0.05] py-2.5 text-xs font-medium text-white/50 transition-colors hover:bg-white/[0.08]">
          🎤 Voice review
        </button>
        <Link
          href="/command"
          className="flex flex-1 items-center justify-center rounded-xl bg-emerald-500/10 py-2.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
        >
          Plan tomorrow →
        </Link>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// ZONE 2 — ABSENCE CARD
// ═══════════════════════════════════════════════════════
function AbsenceCard({
  tasks,
  heroTask,
  onComplete,
}: {
  tasks: Task[]
  heroTask: Task | null
  onComplete: (t: Task) => void
}) {
  const daysSince = useMemo(() => {
    const lastCompletion = tasks
      .filter((t) => t.done && t.completedAt)
      .sort((a, b) => (b.completedAt! > a.completedAt! ? 1 : -1))[0]
    if (!lastCompletion?.completedAt) return 3
    return Math.floor(
      (Date.now() - new Date(lastCompletion.completedAt).getTime()) / 86400000,
    )
  }, [tasks])

  const missedEarning = daysSince * IDEAL_ART_DAILY.total
  const monthlyProjection = IDEAL_ART_DAILY.total * 30

  return (
    <div className="relative">
      <div className="absolute -inset-[1px] rounded-[21px] bg-gradient-to-br from-rose-500/20 via-transparent to-rose-500/10 opacity-60" />
      <div className="glass relative overflow-hidden rounded-[20px] p-5">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.06] via-transparent to-transparent" />
        <div className="relative">
          <h2 className="mb-3 text-lg font-bold text-rose-400 glow-rose">
            WHILE YOU WERE GONE ({daysSince} days):
          </h2>
          <div className="mb-3 space-y-1.5">
            <p className="text-sm text-white/60">
              Ideal Art earned:{' '}
              <span className="data font-semibold text-white/80">${fmt(missedEarning)}</span>
            </p>
            <p className="text-sm text-white/60">
              You earned:{' '}
              <span className="data font-semibold text-rose-400">$0</span>
            </p>
            <p className="text-sm text-white/60">
              If you had stayed consistent:{' '}
              <span className="data font-semibold text-emerald-400">
                you&apos;d be at ${fmt(monthlyProjection)}/mo
              </span>
            </p>
          </div>

          <div className="mb-4 rounded-xl bg-white/[0.04] p-3">
            <p className="text-sm text-white/40">But today is a new day. Your #1:</p>
            <p className="mt-1 text-base font-semibold text-white">
              {heroTask?.text || 'Set your first task'}
            </p>
          </div>

          {heroTask && (
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onComplete(heroTask)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-base font-bold text-white shadow-lg shadow-emerald-500/20"
            >
              Let&apos;s go →
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// ZONE 3 — PRAYER CARD
// ═══════════════════════════════════════════════════════
function PrayerCard({
  prayers,
  prayerCount,
  togglePrayer,
  healthHistory,
}: {
  prayers: HealthLog['prayers']
  prayerCount: number
  togglePrayer: (p: keyof HealthLog['prayers']) => void
  healthHistory: HealthLog[]
}) {
  const prayerTimes: { key: keyof HealthLog['prayers']; label: string; time: string }[] = [
    { key: 'fajr', label: 'Fajr', time: '5:47' },
    { key: 'dhuhr', label: 'Dhuhr', time: '1:15' },
    { key: 'asr', label: 'Asr', time: '4:48' },
    { key: 'maghrib', label: 'Maghrib', time: '7:52' },
    { key: 'isha', label: 'Isha', time: '9:15' },
  ]

  // Mini heatmap: last 30 days
  const heatmapDots = useMemo(() => {
    const dots: { date: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().split('T')[0]
      const log = healthHistory.find((h) => h.date === d)
      const count = log
        ? Object.values(log.prayers).filter(Boolean).length
        : 0
      dots.push({ date: d, count })
    }
    return dots
  }, [healthHistory])

  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <motion.div
          {...stagger(7)}
          className={`cursor-pointer rounded-[16px] p-4 transition-all ${
            prayerCount === 5
              ? 'border-yellow-500/30 bg-yellow-500/[0.08]'
              : prayerCount > 0
                ? 'bg-yellow-500/[0.03]'
                : ''
          }`}
          style={{ background: 'rgba(14,17,24,0.7)', backdropFilter: 'blur(16px)', border: prayerCount > 0 ? '1px solid rgba(234,179,8,0.2)' : '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)' }}
        >
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-yellow-400 glow-gold">
              🤲 {prayerCount}/5
            </span>
          </div>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/30">Prayers</p>
        </motion.div>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[20px] border border-white/[0.06] bg-[rgba(14,17,24,0.95)] p-5 backdrop-blur-xl">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
          <Drawer.Title className="mb-4 text-center text-lg font-bold text-white">
            🤲 Prayers — {prayerCount}/5
          </Drawer.Title>

          <div className="mb-4 space-y-2">
            {prayerTimes.map((p) => (
              <button
                key={p.key}
                onClick={() => togglePrayer(p.key)}
                className={`flex w-full items-center justify-between rounded-xl p-3 transition-all ${
                  prayers[p.key]
                    ? 'bg-yellow-500/15 text-yellow-400'
                    : 'bg-white/[0.04] text-white/50'
                }`}
              >
                <span className="text-sm font-medium">{p.label}</span>
                <span className="data text-xs">{p.time}</span>
                <span className="text-lg">{prayers[p.key] ? '✅' : '⬜'}</span>
              </button>
            ))}
          </div>

          {/* 30-day heatmap */}
          <div>
            <p className="label mb-2">Last 30 days</p>
            <div className="flex flex-wrap gap-1">
              {heatmapDots.map((dot) => (
                <div
                  key={dot.date}
                  title={`${dot.date}: ${dot.count}/5`}
                  className="h-3 w-3 rounded-sm"
                  style={{
                    backgroundColor:
                      dot.count === 0
                        ? 'rgba(255,255,255,0.04)'
                        : dot.count <= 2
                          ? 'rgba(234,179,8,0.2)'
                          : dot.count <= 4
                            ? 'rgba(234,179,8,0.5)'
                            : 'rgba(234,179,8,0.9)',
                  }}
                />
              ))}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

// ═══════════════════════════════════════════════════════
// ZONE 3 — GYM CARD
// ═══════════════════════════════════════════════════════
function GymCard({
  gymDone,
  updateHealth,
  streaks,
}: {
  gymDone: boolean
  updateHealth: (u: Partial<HealthLog>) => void
  streaks: { habit: string; current: number; best: number }[]
}) {
  const [gymType, setGymType] = useState('')
  const [gymDuration, setGymDuration] = useState('')
  const gymStreak = streaks.find((s) => s.habit === 'gym')

  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <motion.div
          {...stagger(7)}
          className={`cursor-pointer rounded-[16px] p-4 transition-all ${
            gymDone ? 'border-emerald-500/30 bg-emerald-500/[0.05]' : ''
          }`}
          style={{ background: 'rgba(14,17,24,0.7)', backdropFilter: 'blur(16px)', border: gymDone ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)' }}
        >
          <p className="text-2xl font-bold">
            {gymDone ? (
              <span className="text-emerald-400 glow-emerald">💪 Done ✓</span>
            ) : (
              <span className="text-rose-400 glow-rose">💪 Skip</span>
            )}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/30">Gym</p>
        </motion.div>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[20px] border border-white/[0.06] bg-[rgba(14,17,24,0.95)] p-5 backdrop-blur-xl">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
          <Drawer.Title className="mb-4 text-center text-lg font-bold text-white">
            💪 Did you work out today?
          </Drawer.Title>

          <div className="mb-4 flex gap-2">
            <button
              onClick={() => {
                updateHealth({ gym: true })
                toast.success('Gym logged!')
              }}
              className="flex-1 rounded-xl bg-emerald-500/15 py-3 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/25"
            >
              Yes ✓
            </button>
            <button
              onClick={() => toast('Keep going, you got this.')}
              className="flex-1 rounded-xl bg-white/[0.05] py-3 text-sm font-medium text-white/40 transition-colors hover:bg-white/[0.08]"
            >
              Not yet
            </button>
            <button
              onClick={() => {
                updateHealth({ gym: false })
                toast('Skipped gym today.')
              }}
              className="flex-1 rounded-xl bg-rose-500/10 py-3 text-sm font-medium text-rose-400/70 transition-colors hover:bg-rose-500/15"
            >
              Skipping
            </button>
          </div>

          {/* Quick inputs */}
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              placeholder="Type (push, pull, legs...)"
              value={gymType}
              onChange={(e) => setGymType(e.target.value)}
              onBlur={() => {
                if (gymType) updateHealth({ gymType })
              }}
              className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Duration (min)"
              value={gymDuration}
              onChange={(e) => setGymDuration(e.target.value)}
              onBlur={() => {
                const n = parseInt(gymDuration)
                if (!isNaN(n)) updateHealth({ gymDuration: n })
              }}
              className="w-28 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/20 focus:border-emerald-500/30 focus:outline-none"
            />
          </div>

          {gymStreak && (
            <p className="text-center text-xs text-white/30">
              Streak: {gymStreak.current} days (best: {gymStreak.best})
            </p>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

// ═══════════════════════════════════════════════════════
// ZONE 3 — SLEEP CARD
// ═══════════════════════════════════════════════════════
function SleepCard({
  wakeTime,
  bedTime,
  updateHealth,
}: {
  wakeTime?: string
  bedTime?: string
  updateHealth: (u: Partial<HealthLog>) => void
}) {
  const [wakeInput, setWakeInput] = useState(wakeTime || '')
  const [bedInput, setBedInput] = useState(bedTime || '')

  const wakeHour = wakeTime ? parseInt(wakeTime.split(':')[0]) : null
  const sleepColor =
    wakeHour === null
      ? 'text-white/30'
      : wakeHour < 8
        ? 'text-emerald-400 glow-emerald'
        : wakeHour < 11
          ? 'text-amber-400 glow-gold'
          : 'text-rose-400 glow-rose'

  // Compute hours slept
  const hoursSlept = useMemo(() => {
    if (!wakeTime || !bedTime) return null
    const [wh, wm] = wakeTime.split(':').map(Number)
    const [bh, bm] = bedTime.split(':').map(Number)
    let wakeMins = wh * 60 + wm
    let bedMins = bh * 60 + bm
    if (wakeMins < bedMins) wakeMins += 24 * 60
    return ((wakeMins - bedMins) / 60).toFixed(1)
  }, [wakeTime, bedTime])

  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <motion.div {...stagger(7)} className="cursor-pointer rounded-[16px] p-4" style={{ background: 'rgba(14,17,24,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
          <p className={`text-2xl font-bold ${sleepColor}`}>
            😴 {wakeTime ? `${wakeTime.replace(/^0/, '')}am` : '—'}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/30">Wake time</p>
        </motion.div>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[20px] border border-white/[0.06] bg-[rgba(14,17,24,0.95)] p-5 backdrop-blur-xl">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
          <Drawer.Title className="mb-4 text-center text-lg font-bold text-white">
            😴 Sleep Log
          </Drawer.Title>

          <div className="mb-4 space-y-3">
            <div>
              <label className="label mb-1 block">Wake time</label>
              <input
                type="time"
                value={wakeInput}
                onChange={(e) => {
                  setWakeInput(e.target.value)
                  updateHealth({ wakeTime: e.target.value })
                }}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-white focus:border-emerald-500/30 focus:outline-none"
              />
            </div>
            <div>
              <label className="label mb-1 block">Bed time</label>
              <input
                type="time"
                value={bedInput}
                onChange={(e) => {
                  setBedInput(e.target.value)
                  updateHealth({ bedTime: e.target.value })
                }}
                className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm text-white focus:border-emerald-500/30 focus:outline-none"
              />
            </div>
          </div>

          {hoursSlept && (
            <p className="mb-2 text-center text-sm text-white/50">
              Hours slept: <span className="data font-semibold text-white">{hoursSlept}h</span>
            </p>
          )}

          <p className="text-center text-xs text-white/30">
            Ideal Art wakes at 5:47.
          </p>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

// ═══════════════════════════════════════════════════════
// ZONE 3 — STREAK CARD
// ═══════════════════════════════════════════════════════
function StreakCard({
  streaks,
  longestStreak,
}: {
  streaks: { habit: string; current: number; best: number }[]
  longestStreak: { habit: string; current: number; best: number }
}) {
  const habitIcons: Record<string, string> = {
    prayer: '🤲',
    gym: '💪',
    sleep: '😴',
    no_gamble: '🚫',
    cold_email: '📧',
  }

  return (
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <motion.div {...stagger(7)} className="cursor-pointer rounded-[16px] p-4" style={{ background: 'rgba(14,17,24,0.7)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
          <p className="text-2xl font-bold text-amber-400 glow-gold">
            🔥 Day {longestStreak.current}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/30">
            {longestStreak.habit.replace('_', ' ')} streak
          </p>
        </motion.div>
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[20px] border border-white/[0.06] bg-[rgba(14,17,24,0.95)] p-5 backdrop-blur-xl">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
          <Drawer.Title className="mb-4 text-center text-lg font-bold text-white">
            🔥 All Streaks
          </Drawer.Title>

          <div className="space-y-2.5">
            {streaks.map((s) => (
              <div
                key={s.habit}
                className="flex items-center justify-between rounded-xl bg-white/[0.04] p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{habitIcons[s.habit] || '📊'}</span>
                  <span className="text-sm font-medium capitalize text-white/70">
                    {s.habit.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="data text-sm font-bold text-amber-400">{s.current}</p>
                    <p className="text-[9px] text-white/30">current</p>
                  </div>
                  <div className="text-right">
                    <p className="data text-sm font-semibold text-white/40">{s.best}</p>
                    <p className="text-[9px] text-white/30">best</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
