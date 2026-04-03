'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { toast } from 'sonner'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'
import MetricCard from '@/components/MetricCard'
import StreakCard from '@/components/StreakCard'
import PrayerBar from '@/components/PrayerBar'
import InsightCard from '@/components/InsightCard'
import TaskItem from '@/components/TaskItem'
import CommandInput from '@/components/CommandInput'
import { useStore } from '@/stores/store'
import { CLIENTS, GMB_PROFILES } from '@/lib/constants'

/* ── Constants ── */

const PRAYER_TIMES: Record<string, string> = {
  fajr: '5:47',
  dhuhr: '1:15',
  asr: '4:48',
  maghrib: '7:52',
  isha: '9:15',
}

const STREAK_META: Record<string, { label: string; icon: string }> = {
  prayer: { label: 'Prayer', icon: '🕌' },
  gym: { label: 'Gym', icon: '🏋️' },
  sleep: { label: 'Sleep Before 12am', icon: '😴' },
  no_gamble: { label: 'No Gambling', icon: '🚫' },
  cold_email: { label: 'Cold Email Active', icon: '📧' },
}

const COST_OF_INACTION = [
  { label: 'Sleeping until noon (missed calls × $700)', amount: 2100 },
  { label: 'Phone scrolling 5hrs × $0/hr earned', amount: 0 },
  { label: 'Not doing cold email (est 2 clients × $2K)', amount: 4000 },
  { label: 'Not SEO-ing GMBs (est 10 leads/mo × $700)', amount: 7000 },
]

const MOTIVATIONAL_LINES = [
  "Let's build something today.",
  "Your competitors are sleeping. You're not.",
  "Focus beats talent when talent doesn't focus.",
  "One task at a time. That's all it takes.",
  "Discipline is choosing between what you want now and what you want most.",
  "The gap between $15K and $50K is just execution.",
]

const SALAH_QUOTES = [
  "Your dad hasn't missed a prayer in 20 years.",
  "Salah is the first thing you'll be asked about.",
  "5 prayers, 5 anchors for your day.",
  "The masjid is 10 minutes away.",
]

const GMB_STATUS_STYLES: Record<string, string> = {
  strong: 'bg-[var(--accent)]/20 text-[var(--accent)]',
  medium: 'bg-[var(--amber)]/20 text-[var(--amber)]',
  new: 'bg-[var(--text-dim)]/20 text-[var(--text-dim)]',
}

/* ── Helpers ── */

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getDayOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function daysUntilTarget() {
  const target = new Date('2026-10-01')
  const now = new Date()
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

function getScorePersonality(score: number) {
  if (score <= 30) return "Slow day. Tomorrow's a reset."
  if (score <= 60) return 'Building momentum. Keep pushing.'
  if (score <= 80) return "You're locked in today."
  return "Unstoppable. This is the Art that hits $50K."
}

/* ── Skeleton ── */

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[10px] bg-[var(--surface)] ${className}`} />
}

function SkeletonDashboard() {
  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-40" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}

/* ── Main ── */

export default function DashboardPage() {
  const { tasks, insights, todayHealth, streaks, addTask } = useStore()
  const [newTaskText, setNewTaskText] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 300)
    return () => clearTimeout(t)
  }, [])

  const dayOfYear = getDayOfYear()
  const motivationalLine = MOTIVATIONAL_LINES[dayOfYear % MOTIVATIONAL_LINES.length]
  const salahQuote = SALAH_QUOTES[dayOfYear % SALAH_QUOTES.length]

  const todayStr = new Date().toISOString().split('T')[0]
  const tasksDoneToday = tasks.filter(
    (t) => t.done && t.completedAt?.startsWith(todayStr)
  ).length
  const prayersDone = Object.values(todayHealth.prayers).filter(Boolean).length

  const priorityOrder: Record<string, number> = { crit: 0, high: 1, med: 2, low: 3 }
  const incompleteTasks = [...tasks]
    .filter((t) => !t.done)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  const theOneThing = incompleteTasks[0]

  const clientTotals = CLIENTS.reduce(
    (acc, c) => ({
      gross: acc.gross + c.gross,
      adSpend: acc.adSpend + c.adSpend,
      stripe: acc.stripe + c.stripe,
      net: acc.net + c.net,
    }),
    { gross: 0, adSpend: 0, stripe: 0, net: 0 }
  )

  const awsConcentration = ((CLIENTS[0].net / clientTotals.net) * 100).toFixed(0)
  const coiTotal = COST_OF_INACTION.reduce((s, c) => s + c.amount, 0)

  const activeInsights = insights
    .filter((i) => !i.snoozedUntil || new Date(i.snoozedUntil) < new Date())
    .slice(0, 5)

  // Daily score calculation
  const prayerScore = (prayersDone / 5) * 35
  const healthScore = (todayHealth.gym ? 15 : 0) + (todayHealth.energyDrinks === 0 ? 10 : 0)
  const productivityScore = Math.min(40, tasksDoneToday * 8)
  const dailyScore = Math.round(prayerScore + healthScore + productivityScore)

  const progressPercent = Math.min(100, (15000 / 50000) * 100)
  const remaining = daysUntilTarget()

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskText.trim()) return
    addTask({
      businessId: 'agency',
      text: newTaskText.trim(),
      tag: '',
      priority: 'med',
      done: false,
      xpValue: 20,
    })
    setNewTaskText('')
    toast.success('Task added')
  }

  return (
    <AnimatePresence mode="wait">
      {!loaded ? (
        <motion.div
          key="skeleton"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <SkeletonDashboard />
        </motion.div>
      ) : (
        <PageTransition key="dashboard">
          <div className="space-y-5 pb-24">

            {/* ── 1. Sticky Top Bar ── */}
            <motion.div
              className="glass sticky top-0 z-30 -mx-4 px-4 py-3"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-xl font-bold text-[var(--text)]">
                    {getGreeting()}, Art
                  </h1>
                  <p className="text-[12px] text-[var(--text-mid)] mt-0.5 italic">
                    {motivationalLine}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Mini Prayer Circles */}
                  <div className="flex items-center gap-1.5">
                    {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
                      <div
                        key={p}
                        className="w-3 h-3 rounded-full border-2 transition-colors duration-300"
                        style={{
                          borderColor: 'var(--gold)',
                          backgroundColor: todayHealth.prayers[p as keyof typeof todayHealth.prayers]
                            ? 'var(--gold)'
                            : 'transparent',
                        }}
                        title={p.charAt(0).toUpperCase() + p.slice(1)}
                      />
                    ))}
                  </div>
                  <span className="data text-xs text-[var(--text-dim)]">{formatDate()}</span>
                </div>
              </div>
            </motion.div>

            {/* ── 2. THE ONE THING ── */}
            <motion.div
              className="gradient-border-animated relative rounded-[14px] p-[2px] cursor-pointer group"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.4 }}
              whileHover={{ scale: 1.005 }}
            >
              <div className="bg-[var(--bg)] rounded-[12px] p-6 text-center">
                <span className="section-label text-[var(--accent)]">THE ONE THING</span>
                <p className="text-[12px] text-[var(--text-mid)] mt-1 mb-4">
                  If you do only one thing today, do this.
                </p>
                {theOneThing ? (
                  <p className="text-[18px] font-semibold text-white leading-relaxed">
                    {theOneThing.text}
                  </p>
                ) : (
                  <div>
                    <p className="text-[18px] font-semibold text-white leading-relaxed">
                      Your plate is clear. What should you focus on?
                    </p>
                    <Link
                      href="/ai"
                      className="inline-block mt-3 text-[12px] text-[var(--accent)] hover:underline"
                    >
                      Ask the AI Strategist →
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── 3. Metrics Strip ── */}
            <StaggerContainer
              className="gap-3"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
            >
              {[
                { label: 'NET TAKE-HOME', value: '$15,268', sub: 'March 2026', color: 'var(--accent)', icon: '💰' },
                { label: 'AGENCY NET MRR', value: '$15,269', sub: '6 clients', color: 'var(--accent)', icon: '⬡' },
                { label: 'PLUMBING REV', value: '~$18K', sub: '9 GMB profiles', color: 'var(--cyan)', icon: '🔧' },
                { label: 'TASKS DONE TODAY', value: tasksDoneToday, sub: `${incompleteTasks.length} remaining`, color: 'var(--blue)', icon: '✓' },
                { label: 'PRAYERS TODAY', value: `${prayersDone}/5`, sub: prayersDone === 5 ? 'All prayed' : `${5 - prayersDone} remaining`, color: 'var(--gold)', icon: '🕌' },
              ].map((m) => (
                <StaggerItem key={m.label}>
                  <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.15 }}>
                    <MetricCard {...m} />
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* ── 4. Streaks Row ── */}
            <StaggerContainer
              className="gap-3"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
            >
              {streaks.map((s) => {
                const meta = STREAK_META[s.habit] || { label: s.habit, icon: '🔥' }
                return (
                  <StaggerItem key={s.habit}>
                    <motion.div whileHover={{ scale: 1.03, y: -1 }} transition={{ duration: 0.15 }}>
                      <div className="relative">
                        <StreakCard habit={meta.label} streak={s.currentStreak} longest={s.longestStreak} icon={meta.icon} />
                        {s.currentStreak === 0 && (
                          <p className="text-[10px] text-[var(--text-dim)] text-center mt-1 italic">
                            Every streak starts at 1.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  </StaggerItem>
                )
              })}
            </StaggerContainer>

            {/* ── 5. Prayer Section + Score Section ── */}
            <StaggerContainer className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* LEFT: Prayer / Salah */}
              <StaggerItem>
                <motion.div
                  className="card card-sacred border border-[var(--gold)]/20 rounded-[10px] p-4"
                  style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--gold) 5%, var(--surface)), var(--surface))' }}
                  whileHover={{ borderColor: 'var(--gold)' }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="section-label text-[var(--gold)]">SALAH</span>
                  <div className="mt-3">
                    <PrayerBar times={PRAYER_TIMES} />
                  </div>
                  <p className="text-[11px] text-[var(--text-mid)] mt-3 italic text-center">
                    &ldquo;{salahQuote}&rdquo;
                  </p>
                  {prayersDone === 5 && (
                    <motion.div
                      className="mt-3 rounded-[8px] p-2 text-center text-[12px] font-semibold text-[var(--gold)]"
                      style={{
                        background: 'linear-gradient(90deg, transparent, color-mix(in srgb, var(--gold) 10%, transparent), transparent)',
                        backgroundSize: '200% 100%',
                      }}
                      animate={{ backgroundPosition: ['0% 50%', '200% 50%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    >
                      All 5 prayers complete. MashaAllah.
                    </motion.div>
                  )}
                </motion.div>
              </StaggerItem>

              {/* RIGHT: Daily Score + Cost of Inaction */}
              <StaggerItem className="space-y-4">
                {/* Daily Score */}
                <motion.div
                  className="card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4"
                  whileHover={{ borderColor: 'var(--border-glow)' }}
                  transition={{ duration: 0.15 }}
                >
                  <span className="section-label text-[var(--text-dim)]">DAILY SCORE</span>
                  <div className="gradient-text text-4xl font-bold mt-2">{dailyScore}</div>
                  <p className="text-[12px] text-[var(--text-mid)] mt-1">{getScorePersonality(dailyScore)}</p>
                  <div className="mt-3 space-y-1 text-[11px]">
                    <div className="flex justify-between text-[var(--text-dim)]">
                      <span>Prayer (35%)</span>
                      <span className="data text-[var(--gold)]">{Math.round(prayerScore)}/35</span>
                    </div>
                    <div className="flex justify-between text-[var(--text-dim)]">
                      <span>Health (25%)</span>
                      <span className="data text-[var(--cyan)]">{Math.round(healthScore)}/25</span>
                    </div>
                    <div className="flex justify-between text-[var(--text-dim)]">
                      <span>Productivity (40%)</span>
                      <span className="data text-[var(--accent)]">{Math.round(productivityScore)}/40</span>
                    </div>
                  </div>
                </motion.div>

                {/* Cost of Inaction */}
                <motion.div
                  className="card card-urgent border border-[var(--rose)]/20 rounded-[10px] p-4"
                  style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--rose) 5%, var(--surface)), var(--surface))' }}
                  whileHover={{ borderColor: 'var(--rose)' }}
                  transition={{ duration: 0.15 }}
                >
                  <span className="section-label text-[var(--rose)]">COST OF INACTION</span>
                  <div className="space-y-1.5 mt-3">
                    {COST_OF_INACTION.map((item) => (
                      <div key={item.label} className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-mid)]">{item.label}</span>
                        <span className="data font-semibold text-[var(--rose)]">
                          {item.amount > 0 ? `-$${item.amount.toLocaleString()}/mo` : '$0'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[var(--rose)]/20 flex items-center justify-between">
                    <span className="label text-[10px] text-[var(--text-dim)]">TOTAL LOST / MONTH</span>
                    <span className="data text-lg font-bold text-[var(--rose)]">-${coiTotal.toLocaleString()}/mo</span>
                  </div>
                </motion.div>
              </StaggerItem>
            </StaggerContainer>

            {/* ── 6. Insights + Tasks ── */}
            <StaggerContainer className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
              {/* LEFT: Proactive Insights */}
              <StaggerItem className="space-y-2">
                <h2 className="section-label text-[var(--text-dim)]">INSIGHTS</h2>
                {activeInsights.length > 0 ? (
                  activeInsights.map((insight) => (
                    <motion.div key={insight.id} whileHover={{ x: 2 }} transition={{ duration: 0.1 }}>
                      <InsightCard insight={insight} />
                    </motion.div>
                  ))
                ) : (
                  <div className="card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-5 text-center">
                    <p className="text-[12px] text-[var(--text-dim)]">
                      Insights generate at 6 AM daily. In the meantime, ask the AI what you&apos;re missing.
                    </p>
                    <Link href="/ai">
                      <motion.button
                        className="mt-3 px-4 py-2 rounded-[8px] text-[12px] font-semibold text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/10 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Open AI Strategist →
                      </motion.button>
                    </Link>
                  </div>
                )}
              </StaggerItem>

              {/* RIGHT: Today's Tasks */}
              <StaggerItem className="space-y-2">
                <h2 className="section-label text-[var(--text-dim)]">TODAY&apos;S PRIORITY</h2>
                {incompleteTasks.length > 0 ? (
                  incompleteTasks.slice(0, 8).map((task) => (
                    <motion.div key={task.id} whileHover={{ x: 2 }} transition={{ duration: 0.1 }}>
                      <TaskItem task={task} />
                    </motion.div>
                  ))
                ) : (
                  <div className="card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-5 text-center">
                    <p className="text-[12px] text-[var(--text-dim)]">
                      Your plate is clear. Ask the AI what to focus on, or add a task.
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-3">
                      <Link href="/ai">
                        <motion.button
                          className="px-3 py-1.5 rounded-[8px] text-[11px] text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/10 transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          🎤 Ask AI
                        </motion.button>
                      </Link>
                    </div>
                  </div>
                )}
                <form onSubmit={handleAddTask} className="mt-1">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="+ Add a task..."
                    className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[10px] px-3 py-2 text-[12px] text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none transition-all duration-200 focus:border-[var(--border-glow)]"
                  />
                </form>
              </StaggerItem>
            </StaggerContainer>

            {/* ── 7. Days of Execution Remaining ── */}
            <motion.div
              className="card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              whileHover={{ borderColor: 'var(--border-glow)' }}
            >
              <span className="section-label text-[var(--text-dim)]">DAYS OF EXECUTION REMAINING</span>
              <div className="flex items-end gap-4 mt-2">
                <span className="data text-4xl font-bold text-[var(--accent)]">{remaining}</span>
                <span className="text-[12px] text-[var(--text-mid)] pb-1">days to $50K/mo target</span>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[var(--text-dim)]">Current: <span className="data text-[var(--amber)] font-semibold">$15K/mo</span></span>
                  <span className="text-[var(--text-dim)]">Target: <span className="data text-[var(--accent)] font-semibold">$50K/mo</span></span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--border)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, var(--accent), var(--cyan))' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </motion.div>

            {/* ── 8. Client Financial Table ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              <h2 className="section-label text-[var(--text-dim)] mb-2">CLIENT FINANCIALS</h2>
              <div className="card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      {['Client', 'Gross/mo', 'Ad Spend', 'Stripe 3%', 'Net to Art', 'Service', 'Meeting Freq'].map((h) => (
                        <th key={h} className="label text-[10px] text-[var(--text-dim)] text-left px-3 py-2 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {CLIENTS.map((c, i) => (
                      <motion.tr
                        key={c.name}
                        className="border-b border-[var(--border)] last:border-0"
                        whileHover={{ backgroundColor: 'var(--surface2)' }}
                        transition={{ duration: 0.1 }}
                      >
                        <td className="px-3 py-2 text-[var(--text)] font-medium">
                          {c.name}
                          {i === 0 && (
                            <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--rose)]/15 text-[var(--rose)] border border-[var(--rose)]/30">
                              {awsConcentration}% CONCENTRATION RISK
                            </span>
                          )}
                        </td>
                        <td className="data px-3 py-2 text-[var(--text-mid)]">${c.gross.toLocaleString()}</td>
                        <td className="data px-3 py-2 text-[var(--text-mid)]">{c.adSpend > 0 ? `$${c.adSpend.toLocaleString()}` : '—'}</td>
                        <td className="data px-3 py-2 text-[var(--text-mid)]">${c.stripe.toLocaleString()}</td>
                        <td className="data px-3 py-2 text-[var(--accent)] font-semibold">${c.net.toLocaleString()}</td>
                        <td className="px-3 py-2 text-[var(--text-dim)]">{c.service}</td>
                        <td className="px-3 py-2 text-[var(--text-dim)]">{c.meeting}</td>
                      </motion.tr>
                    ))}
                    <tr className="bg-[var(--surface2)]">
                      <td className="px-3 py-2 text-[var(--text)] font-bold">TOTAL</td>
                      <td className="data px-3 py-2 text-[var(--text)] font-bold">${clientTotals.gross.toLocaleString()}</td>
                      <td className="data px-3 py-2 text-[var(--text)] font-bold">${clientTotals.adSpend.toLocaleString()}</td>
                      <td className="data px-3 py-2 text-[var(--text)] font-bold">${clientTotals.stripe.toLocaleString()}</td>
                      <td className="data px-3 py-2 text-[var(--accent)] font-bold">${clientTotals.net.toLocaleString()}</td>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* ── 9. Plumbing GMB Grid ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <h2 className="section-label text-[var(--text-dim)] mb-2">PLUMBING GMB PROFILES</h2>
              <StaggerContainer
                className="gap-3"
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
              >
                {GMB_PROFILES.map((g) => (
                  <StaggerItem key={g.city}>
                    <motion.div
                      className="card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3"
                      whileHover={{ borderColor: 'var(--border-glow)', scale: 1.015, y: -2 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[13px] font-semibold text-[var(--text)]">{g.city}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${GMB_STATUS_STYLES[g.status]}`}>
                          {g.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div>
                          <div className="data text-base font-bold text-[var(--text)]">{g.reviews}</div>
                          <div className="label text-[10px] text-[var(--text-dim)]">Reviews</div>
                        </div>
                        <div>
                          <div className="data text-base font-bold text-[var(--cyan)]">{g.calls}</div>
                          <div className="label text-[10px] text-[var(--text-dim)]">Calls/mo</div>
                        </div>
                        <div>
                          <div className="data text-base font-bold text-[var(--text-mid)]">{g.rank}</div>
                          <div className="label text-[10px] text-[var(--text-dim)]">Rank</div>
                        </div>
                      </div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </motion.div>

            {/* ── 10. Command Input ── */}
            <CommandInput />
          </div>
        </PageTransition>
      )}
    </AnimatePresence>
  )
}
