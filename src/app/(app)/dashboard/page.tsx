'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { useStore, getClientNet, getAgencyTotals, getDailyScore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

/* ── Constants ── */

const PRAYER_TIMES: Record<string, string> = {
  fajr: '5:47', dhuhr: '1:15', asr: '4:48', maghrib: '7:52', isha: '9:15',
}

const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const

const MOTIVATIONAL_LINES = [
  "Let's build something today.",
  "Your competitors are sleeping.",
  "Focus beats talent when talent doesn't focus.",
  "One task at a time.",
  "Revenue solves everything.",
]

const SALAH_QUOTES = [
  "Your dad hasn't missed in 20 years.",
  "Consistency is worship.",
  "Fajr is the hardest and the most rewarding.",
  "The masjid is 10 minutes away.",
]

const COST_OF_INACTION = [
  { label: 'Sleeping til noon', amount: 2100 },
  { label: 'Phone scrolling', amount: 0 },
  { label: 'No cold email', amount: 4000 },
  { label: 'No GMB SEO', amount: 7000 },
]

const STREAK_META: Record<string, { label: string; emoji: string; color: string }> = {
  prayer: { label: 'Prayer', emoji: '🕌', color: 'var(--gold)' },
  gym: { label: 'Gym', emoji: '🏋️', color: 'var(--accent)' },
  sleep: { label: 'Sleep', emoji: '😴', color: 'var(--cyan)' },
  no_gamble: { label: 'No Gambling', emoji: '🚫', color: 'var(--purple)' },
  cold_email: { label: 'Cold Email', emoji: '📧', color: 'var(--rose)' },
}

const PRIORITY_BORDER: Record<string, string> = {
  crit: 'var(--rose)', high: 'var(--amber)', med: 'var(--blue)', low: 'var(--border)',
}

const GMB_TOP_BORDER: Record<string, string> = {
  strong: 'var(--accent)', medium: 'var(--amber)', new: 'var(--blue)',
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
  return Math.floor((now.getTime() - start.getTime()) / 86400000)
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

const sparkData = (base: number, variance: number) =>
  Array.from({ length: 7 }, (_, i) => ({ v: base + Math.sin(i * 1.2) * variance + i * variance * 0.1 }))

const flatSparkData = () => Array.from({ length: 7 }, () => ({ v: 0 }))

/* ── Animation helpers ── */

const cardAnim = (delay: number) => ({
  initial: { opacity: 0, y: 12 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay, duration: 0.35 },
})

/* ── Custom Tooltip ── */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[8px] border border-[var(--border)] p-2" style={{ background: 'var(--bg)' }}>
      <p className="text-[10px] text-[var(--text-dim)] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="data text-[11px] font-semibold" style={{ color: p.color }}>
          {p.dataKey}: ${Math.round(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  )
}

/* ── Circular Progress Ring ── */

function ProgressRing({ value, max, size, color }: { value: number; max: number; size: number; color: string }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface2)" strokeWidth={3} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ duration: 1, delay: 0.3 }}
      />
    </svg>
  )
}

/* ── Main ── */

export default function DashboardPage() {
  const {
    businesses, clients, tasks, insights, todayHealth, streaks, gmbProfiles,
    addTask, toggleTask, togglePrayer, incomeTarget, targetDate, revenueEntries, expenseEntries,
    userName,
  } = useStore()
  const [newTaskText, setNewTaskText] = useState('')
  const [chartRange, setChartRange] = useState<'week' | 'month'>('month')

  const dayOfYear = getDayOfYear()
  const motiveLine = MOTIVATIONAL_LINES[dayOfYear % MOTIVATIONAL_LINES.length]
  const salahQuote = SALAH_QUOTES[dayOfYear % SALAH_QUOTES.length]
  const todayStr = new Date().toISOString().split('T')[0]
  const tasksDoneToday = tasks.filter(t => t.done && t.completedAt?.startsWith(todayStr)).length
  const prayersDone = Object.values(todayHealth.prayers).filter(Boolean).length

  const priorityOrder: Record<string, number> = { crit: 0, high: 1, med: 2, low: 3 }
  const incompleteTasks = [...tasks].filter(t => !t.done).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
  const theOneThing = incompleteTasks[0]

  // ── Real data from store ──
  const agencyTotals = getAgencyTotals(clients)
  const plumbingBiz = businesses.find(b => b.name.toLowerCase().includes('plumb'))
  const plumbingRevenue = plumbingBiz?.monthlyRevenue || 0
  const airbnbBiz = businesses.find(b => b.name.toLowerCase().includes('airbnb'))
  const airbnbRevenue = airbnbBiz?.monthlyRevenue || 0
  const totalExpenses = expenseEntries.filter(e => e.recurring).reduce((s, e) => s + e.amount, 0)
  const netTakeHome = agencyTotals.net + plumbingRevenue + airbnbRevenue - totalExpenses
  const maxClientNet = clients.length > 0 ? Math.max(...clients.filter(c => c.active).map(c => getClientNet(c))) : 0
  const totalGmbCalls = gmbProfiles.reduce((s, g) => s + g.callsPerMonth, 0)
  const dailyScore = getDailyScore(todayHealth, tasksDoneToday)

  // ── Income target ──
  function daysUntilTarget() {
    if (!targetDate) return 0
    return Math.max(0, Math.ceil((new Date(targetDate).getTime() - new Date().getTime()) / 86400000))
  }
  const remaining = daysUntilTarget()
  const currentIncome = agencyTotals.net + plumbingRevenue + airbnbRevenue
  const progressPercent = incomeTarget > 0 ? Math.min(100, (currentIncome / incomeTarget) * 100) : 0

  // ── Revenue chart data from revenueEntries ──
  const hasRevenueData = revenueEntries.length > 0
  const revenueData = hasRevenueData
    ? (() => {
        const last30 = Array.from({ length: 30 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - 29 + i)
          const ds = d.toISOString().split('T')[0]
          const agencyRev = revenueEntries.filter(r => r.date === ds && clients.some(c => c.businessId === r.businessId)).reduce((s, r) => s + r.amount, 0)
          const plumbRev = revenueEntries.filter(r => r.date === ds && r.businessId === plumbingBiz?.id).reduce((s, r) => s + r.amount, 0)
          return { day: `D${i + 1}`, agency: agencyRev, plumbing: plumbRev }
        })
        return last30
      })()
    : Array.from({ length: 30 }, (_, i) => ({ day: `D${i + 1}`, agency: 0, plumbing: 0 }))

  const coiTotal = COST_OF_INACTION.reduce((s, c) => s + c.amount, 0)

  const activeInsights = insights
    .filter(i => !i.snoozedUntil || new Date(i.snoozedUntil) < new Date())
    .slice(0, 6)

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskText.trim()) return
    addTask({ businessId: 'agency', text: newTaskText.trim(), tag: '', priority: 'med', done: false, xpValue: 20 })
    setNewTaskText('')
    toast.success('Task added')
  }

  const chartData = chartRange === 'week' ? revenueData.slice(-7) : revenueData

  return (
    <PageTransition>
      <div className="pb-24">

        {/* ── 1. STICKY TOP BAR ── */}
        <motion.div
          className="glass sticky top-0 z-30 -mx-4 px-4 py-3 mb-4"
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 600 }} className="text-[var(--text)]">
                {getGreeting()}, {userName || 'Art'}
              </h1>
              <p className="text-[12px] text-[var(--text-mid)] italic mt-0.5">{motiveLine}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                {PRAYER_KEYS.map(p => (
                  <div key={p} className="rounded-full transition-colors duration-300" style={{
                    width: 8, height: 8,
                    borderColor: 'var(--gold)',
                    borderWidth: 2,
                    borderStyle: 'solid',
                    backgroundColor: todayHealth.prayers[p] ? 'var(--gold)' : 'transparent',
                  }} />
                ))}
              </div>
              <span className="data text-[12px] text-[var(--text-dim)]">{formatDate()}</span>
            </div>
          </div>
        </motion.div>

        {/* ── BENTO GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16 }} className="max-md:!flex max-md:!flex-col max-md:!gap-4">

          {/* ── 2. THE ONE THING ── */}
          <motion.div className="gradient-border" style={{ gridColumn: 'span 12' }} {...cardAnim(0.05)}>
            <div className="bg-[var(--surface)] rounded-[14px] p-6 text-center">
              <span className="label text-[var(--accent)] text-[10px] uppercase tracking-wider font-semibold">THE ONE THING</span>
              <p className="text-[12px] text-[var(--text-mid)] mt-1">If you do only one thing today, do this.</p>
              {theOneThing ? (
                <p className="text-[20px] font-semibold text-[var(--text)] mt-3">{theOneThing.text}</p>
              ) : (
                <div>
                  <p className="text-[20px] font-semibold text-[var(--text)] mt-3">Your plate is clear.</p>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <Link href="/ai" className="text-[12px] text-[var(--accent)] hover:underline">Ask AI what to focus on &rarr;</Link>
                    <Link href="/tasks" className="text-[12px] text-[var(--text-mid)] hover:underline">Add a task &rarr;</Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── 3. FOUR METRIC CARDS ── */}
          {([
            {
              label: 'NET TAKE-HOME',
              value: `$${netTakeHome > 0 ? Math.round(netTakeHome).toLocaleString() : '0'}`,
              sub: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              color: 'var(--accent)',
              emoji: '💰',
              data: revenueEntries.length > 0 ? sparkData(netTakeHome, netTakeHome * 0.05) : flatSparkData(),
              hasData: netTakeHome > 0,
            },
            {
              label: 'AGENCY MRR',
              value: `$${agencyTotals.net > 0 ? Math.round(agencyTotals.net).toLocaleString() : '0'}`,
              sub: `${agencyTotals.count} client${agencyTotals.count !== 1 ? 's' : ''} active`,
              color: 'var(--cyan)',
              emoji: '⬡',
              data: clients.length > 0 ? sparkData(agencyTotals.net, agencyTotals.net * 0.04) : flatSparkData(),
              hasData: clients.length > 0,
            },
            {
              label: 'PLUMBING REV',
              value: plumbingRevenue > 0 ? `$${(plumbingRevenue / 1000).toFixed(0)}K` : '$0',
              sub: `${gmbProfiles.length} GMB profile${gmbProfiles.length !== 1 ? 's' : ''}`,
              color: 'var(--amber)',
              emoji: '🔧',
              data: plumbingRevenue > 0 ? sparkData(plumbingRevenue, plumbingRevenue * 0.1) : flatSparkData(),
              hasData: plumbingRevenue > 0,
            },
          ] as const).map((m, i) => (
            <motion.div
              key={m.label}
              className="card rounded-[16px] p-5"
              style={{ gridColumn: 'span 3' }}
              {...cardAnim(0.08 + i * 0.04)}
              whileHover={{ y: -3, scale: 1.01 }}
            >
              <div className="flex items-start justify-between">
                <span className="label text-[10px] uppercase tracking-wider text-[var(--text-dim)]" style={{ fontFamily: 'var(--font-mono, monospace)' }}>{m.label}</span>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px]" style={{ background: `color-mix(in srgb, ${m.color} 20%, transparent)` }}>{m.emoji}</div>
              </div>
              <div className="data mt-2" style={{ fontSize: 36, fontWeight: 700, color: m.color }}>{m.value}</div>
              <p className="text-[12px] text-[var(--text-mid)]">{m.sub}</p>
              <div className="mt-2">
                {m.hasData ? (
                  <ResponsiveContainer width={120} height={40}>
                    <AreaChart data={m.data}>
                      <defs>
                        <linearGradient id={`spark-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={m.color} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="v" stroke={m.color} strokeWidth={1.5} fill={`url(#spark-${i})`} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[40px] flex items-center">
                    <span className="text-[10px] text-[var(--text-dim)] italic">Start tracking</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Daily Score card with ring */}
          <motion.div className="card rounded-[16px] p-5" style={{ gridColumn: 'span 3' }} {...cardAnim(0.2)} whileHover={{ y: -3, scale: 1.01 }}>
            <div className="flex items-start justify-between">
              <span className="label text-[10px] uppercase tracking-wider text-[var(--text-dim)]" style={{ fontFamily: 'var(--font-mono, monospace)' }}>DAILY SCORE</span>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px]" style={{ background: 'color-mix(in srgb, var(--accent) 20%, transparent)' }}>⚡</div>
            </div>
            <div className="data mt-2" style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent)' }}>{dailyScore}<span className="text-[16px] text-[var(--text-dim)]">/100</span></div>
            <p className="text-[12px] text-[var(--text-mid)]">{dailyScore >= 80 ? 'Unstoppable.' : dailyScore >= 50 ? 'Building momentum.' : 'Get moving.'}</p>
            <div className="mt-2 flex justify-center relative">
              <ProgressRing value={dailyScore} max={100} size={40} color="var(--accent)" />
              <span className="absolute inset-0 flex items-center justify-center data text-[10px] font-bold text-[var(--text)]">{dailyScore}</span>
            </div>
          </motion.div>

          {/* ── 4. REVENUE CHART ── */}
          <motion.div className="card rounded-[16px] p-5" style={{ gridColumn: 'span 5', gridRow: 'span 2' }} {...cardAnim(0.22)}>
            <div className="flex items-center justify-between mb-3">
              <span className="label text-[10px] uppercase tracking-wider text-[var(--text-dim)]">REVENUE TREND</span>
              <div className="flex gap-1">
                {(['week', 'month'] as const).map(r => (
                  <button key={r} onClick={() => setChartRange(r)}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors"
                    style={{
                      background: chartRange === r ? 'var(--accent)' : 'var(--surface2)',
                      color: chartRange === r ? 'var(--bg)' : 'var(--text-dim)',
                    }}
                  >{r.charAt(0).toUpperCase() + r.slice(1)}</button>
                ))}
              </div>
            </div>
            {hasRevenueData ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="agencyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="plumbingGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--amber)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--amber)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="agency" stroke="var(--cyan)" strokeWidth={2} fill="url(#agencyGrad)" />
                  <Area type="monotone" dataKey="plumbing" stroke="var(--amber)" strokeWidth={2} fill="url(#plumbingGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[220px]">
                <div className="text-center">
                  <p className="text-[12px] text-[var(--text-dim)]">No revenue entries yet.</p>
                  <Link href="/financials" className="text-[11px] text-[var(--accent)] hover:underline mt-1 inline-block">Start tracking on Financials &rarr;</Link>
                </div>
              </div>
            )}
          </motion.div>

          {/* ── 5. PRAYER TRACKER ── */}
          <motion.div
            className="card-sacred rounded-[16px] p-5"
            style={{ gridColumn: 'span 4', background: 'linear-gradient(135deg, color-mix(in srgb, var(--gold) 5%, var(--surface)), var(--surface))' }}
            {...cardAnim(0.25)}
          >
            <span className="label text-[10px] uppercase tracking-wider font-semibold text-[var(--gold)]">SALAH</span>
            <div className="flex gap-2 mt-3">
              {PRAYER_KEYS.map(p => {
                const done = todayHealth.prayers[p]
                return (
                  <motion.button key={p} onClick={() => { togglePrayer(p); if (!done) toast.success(`${p.charAt(0).toUpperCase() + p.slice(1)} logged`) }}
                    className="flex-1 rounded-[10px] py-2 px-1 text-center transition-all border"
                    style={{
                      background: done ? 'color-mix(in srgb, var(--gold) 15%, transparent)' : 'var(--surface2)',
                      borderColor: 'var(--gold)',
                      borderWidth: 1,
                      color: done ? 'var(--gold)' : 'var(--text-mid)',
                      boxShadow: done ? '0 0 12px color-mix(in srgb, var(--gold) 20%, transparent)' : 'none',
                    }}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-[11px] font-semibold">{done ? '✓' : p.charAt(0).toUpperCase() + p.slice(1)}</div>
                    <div className="text-[9px] mt-0.5 opacity-60">{PRAYER_TIMES[p]}</div>
                  </motion.button>
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="relative">
                <ProgressRing value={prayersDone} max={5} size={40} color="var(--gold)" />
                <span className="absolute inset-0 flex items-center justify-center data text-[10px] font-bold text-[var(--gold)]">{prayersDone}/5</span>
              </div>
              <div className="text-right">
                <div className="data text-[14px] font-bold text-[var(--gold)]">{streaks.find(s => s.habit === 'prayer')?.currentStreak || 0} day streak</div>
              </div>
            </div>
            <p className="text-[11px] text-[var(--gold)] italic text-center mt-3 opacity-70">&ldquo;{salahQuote}&rdquo;</p>
          </motion.div>

          {/* ── 6. STREAKS GRID ── */}
          <motion.div className="card rounded-[16px] p-4" style={{ gridColumn: 'span 3' }} {...cardAnim(0.28)}>
            <span className="label text-[10px] uppercase tracking-wider text-[var(--text-dim)]">STREAKS</span>
            <div className="mt-3 space-y-3">
              {streaks.map(s => {
                const meta = STREAK_META[s.habit] || { label: s.habit, emoji: '🔥', color: 'var(--text-mid)' }
                return (
                  <div key={s.habit} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px]">{meta.emoji}</span>
                      <span className="text-[12px] text-[var(--text-mid)]">{meta.label}</span>
                    </div>
                    <div className="text-right">
                      <motion.span
                        className="data text-[20px] font-bold block leading-none"
                        style={{ color: s.currentStreak === 0 ? 'var(--rose)' : meta.color }}
                        animate={s.currentStreak === 0 ? { opacity: [0.6, 1, 0.6] } : {}}
                        transition={s.currentStreak === 0 ? { duration: 2, repeat: Infinity } : {}}
                      >{s.currentStreak}</motion.span>
                      <span className="text-[9px] text-[var(--text-dim)]">days</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* ── 7. COST OF INACTION ── */}
          <motion.div
            className="card-urgent rounded-[16px] p-5"
            style={{ gridColumn: 'span 4', background: 'linear-gradient(135deg, color-mix(in srgb, var(--rose) 5%, var(--surface)), var(--surface))' }}
            {...cardAnim(0.3)}
          >
            <span className="label text-[10px] uppercase tracking-wider font-semibold text-[var(--rose)]">COST OF INACTION</span>
            <div className="mt-3 space-y-2">
              {COST_OF_INACTION.map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[12px] text-[var(--text-mid)]">{item.label}</span>
                  <span className="data text-[14px] font-semibold text-[var(--rose)]">
                    {item.amount > 0 ? `-$${item.amount.toLocaleString()}/mo` : '$0'}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--rose)]/20 mt-3 pt-3 flex items-center justify-between">
              <span className="label text-[10px] text-[var(--text-dim)]">TOTAL LOST</span>
              <span className="data text-[var(--rose)] font-bold" style={{ fontSize: 28 }}>-${coiTotal.toLocaleString()}/mo</span>
            </div>
            <Link href="/ai" className="text-[11px] text-[var(--rose)] hover:underline mt-2 inline-block opacity-70">How to reduce this &rarr;</Link>
          </motion.div>

          {/* ── 8. DAYS REMAINING ── */}
          <motion.div className="card rounded-[16px] p-5" style={{ gridColumn: 'span 4' }} {...cardAnim(0.32)}>
            <div className="gradient-text data" style={{ fontSize: 48, fontWeight: 700 }}>{remaining || '—'}</div>
            <p className="text-[14px] text-[var(--text-mid)]">
              {targetDate ? `days to $${(incomeTarget / 1000).toFixed(0)}K/mo` : 'Set a target date in Settings'}
            </p>
            <div className="mt-4">
              <div className="w-full h-2 rounded-full bg-[var(--surface2)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, var(--accent), var(--cyan))' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, delay: 0.4 }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="data text-[10px] text-[var(--text-dim)]">${currentIncome > 0 ? `${(currentIncome / 1000).toFixed(0)}K` : '0'}</span>
                <span className="data text-[10px] text-[var(--text-dim)]">${(incomeTarget / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </motion.div>

          {/* ── 9. TODAY'S TASKS ── */}
          <motion.div className="card rounded-[16px] p-5" style={{ gridColumn: 'span 4', gridRow: 'span 2' }} {...cardAnim(0.34)}>
            <div className="flex items-center justify-between mb-3">
              <span className="label text-[10px] uppercase tracking-wider text-[var(--text-dim)]">TODAY&apos;S TASKS</span>
              <span className="data text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                {tasksDoneToday}/{tasks.length}
              </span>
            </div>
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
              {incompleteTasks.length > 0 ? incompleteTasks.slice(0, 12).map(task => (
                <motion.div key={task.id} className="flex items-center gap-2 py-1.5 px-2 rounded-[8px] hover:bg-[var(--surface2)] transition-colors"
                  style={{ borderLeft: `3px solid ${PRIORITY_BORDER[task.priority] || 'var(--border)'}` }}
                >
                  <motion.button
                    onClick={() => { toggleTask(task.id); toast.success('+XP earned') }}
                    className="w-4 h-4 rounded-[4px] border-2 flex-shrink-0 flex items-center justify-center"
                    style={{ borderColor: PRIORITY_BORDER[task.priority] }}
                    whileTap={{ scale: 0.85 }}
                  />
                  <span className="text-[12px] text-[var(--text)] truncate">{task.text}</span>
                  {task.tag && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--surface2)] text-[var(--text-dim)] flex-shrink-0">{task.tag}</span>}
                </motion.div>
              )) : (
                <div className="text-center py-6">
                  <p className="text-[12px] text-[var(--text-dim)]">Your plate is clear. Add a task or ask the AI.</p>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <Link href="/tasks" className="text-[11px] text-[var(--accent)] hover:underline">Tasks &rarr;</Link>
                    <Link href="/ai" className="text-[11px] text-[var(--accent)] hover:underline">Ask AI &rarr;</Link>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleAddTask} className="mt-3">
              <input type="text" value={newTaskText} onChange={e => setNewTaskText(e.target.value)}
                placeholder="+ Add a task..."
                className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-[10px] px-3 py-2 text-[12px] text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)] transition-colors"
              />
            </form>
          </motion.div>

          {/* ── 10. CLIENT TABLE ── */}
          <motion.div className="card rounded-[16px] p-5 overflow-x-auto" style={{ gridColumn: 'span 6' }} {...cardAnim(0.36)}>
            <div className="flex items-center justify-between mb-3">
              <span className="label text-[10px] uppercase tracking-wider text-[var(--text-dim)]">CLIENT REVENUE</span>
              <span className="data text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                ${Math.round(agencyTotals.net).toLocaleString()}/mo
              </span>
            </div>
            {clients.filter(c => c.active).length > 0 ? (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    {['Client', 'Gross', 'Ad Spend', 'Net'].map(h => (
                      <th key={h} className="label text-[10px] text-[var(--text-dim)] text-left px-2 py-1.5 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clients.filter(c => c.active).map((c, i) => {
                    const net = getClientNet(c)
                    return (
                      <motion.tr key={c.id} className="border-b border-[var(--border)] last:border-0 cursor-default"
                        whileHover={{ backgroundColor: 'var(--surface2)' }}
                      >
                        <td className="px-2 py-1.5 text-[var(--text)] font-medium">
                          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{
                            backgroundColor: i === 0 ? 'var(--accent)' : 'var(--text-dim)',
                          }} />
                          {c.name}
                        </td>
                        <td className="data px-2 py-1.5 text-[var(--text-mid)]">${c.grossMonthly.toLocaleString()}</td>
                        <td className="data px-2 py-1.5 text-[var(--text-mid)]">{c.adSpend > 0 ? `$${c.adSpend.toLocaleString()}` : '—'}</td>
                        <td className="data px-2 py-1.5 text-[var(--accent)] font-semibold relative">
                          <div className="absolute inset-0 rounded-r-[4px] opacity-10" style={{ width: `${maxClientNet > 0 ? (net / maxClientNet) * 100 : 0}%`, background: 'var(--accent)' }} />
                          <span className="relative">${Math.round(net).toLocaleString()}</span>
                        </td>
                      </motion.tr>
                    )
                  })}
                  <tr className="bg-[var(--surface2)]">
                    <td className="px-2 py-1.5 font-bold text-[var(--text)]">TOTAL</td>
                    <td className="data px-2 py-1.5 font-bold text-[var(--text)]">${Math.round(agencyTotals.gross).toLocaleString()}</td>
                    <td className="data px-2 py-1.5 font-bold text-[var(--text)]">${Math.round(agencyTotals.adSpend).toLocaleString()}</td>
                    <td className="data px-2 py-1.5 font-bold text-[var(--accent)]">${Math.round(agencyTotals.net).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <div className="text-center py-8">
                <p className="text-[12px] text-[var(--text-dim)]">No clients yet. Add them on the Agency page.</p>
                <Link href="/business/agency" className="text-[11px] text-[var(--accent)] hover:underline mt-1 inline-block">Go to Agency &rarr;</Link>
              </div>
            )}
          </motion.div>

          {/* ── 11. PLUMBING GMB GRID ── */}
          <motion.div className="card rounded-[16px] p-5" style={{ gridColumn: 'span 6' }} {...cardAnim(0.38)}>
            <div className="flex items-center justify-between mb-3">
              <span className="label text-[10px] uppercase tracking-wider text-[var(--text-dim)]">PLUMBING GMBS</span>
              <span className="data text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in srgb, var(--cyan) 15%, transparent)', color: 'var(--cyan)' }}>
                {totalGmbCalls} calls/mo
              </span>
            </div>
            {gmbProfiles.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {gmbProfiles.map(g => (
                  <motion.div key={g.id} className="bg-[var(--surface2)] rounded-[12px] p-3 relative overflow-hidden"
                    whileHover={{ y: -2, scale: 1.02 }}
                    style={{ borderTop: `3px solid ${GMB_TOP_BORDER[g.status] || 'var(--border)'}` }}
                  >
                    <div className="text-[13px] font-semibold text-[var(--text)]">{g.city}</div>
                    <div className="mt-1.5 space-y-0.5 text-[11px] text-[var(--text-mid)]">
                      <div>⭐ {g.reviewCount}</div>
                      <div>📞 {g.callsPerMonth}/mo</div>
                    </div>
                    <span className="data text-[10px] font-bold mt-1.5 inline-block px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--text-dim)]">{g.ranking}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[12px] text-[var(--text-dim)]">No GMB profiles yet. Add them on the Plumbing page.</p>
                <Link href="/business/plumbing" className="text-[11px] text-[var(--accent)] hover:underline mt-1 inline-block">Go to Plumbing &rarr;</Link>
              </div>
            )}
          </motion.div>

          {/* ── 12. INSIGHTS ROW ── */}
          <motion.div style={{ gridColumn: 'span 12' }} {...cardAnim(0.4)}>
            <div className="flex items-center justify-between mb-2">
              <span className="label text-[10px] uppercase tracking-wider text-[var(--text-dim)]">INSIGHTS</span>
              <Link href="/ai" className="text-[11px] text-[var(--accent)] hover:underline">View all &rarr;</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {activeInsights.length > 0 ? activeInsights.map(ins => {
                const borderColor = ins.type === 'revenue' ? 'var(--accent)' : ins.type === 'risk' ? 'var(--rose)' : 'var(--blue)'
                return (
                  <motion.div key={ins.id} className="card p-4 flex-shrink-0 rounded-[12px]"
                    style={{ minWidth: 300, maxWidth: 340, borderLeft: `3px solid ${borderColor}` }}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex gap-2 mb-1">
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: `color-mix(in srgb, ${borderColor} 15%, transparent)`, color: borderColor }}>{ins.type}</span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--surface2)] text-[var(--text-dim)]">{ins.priority}</span>
                    </div>
                    <p className="text-[14px] font-semibold text-[var(--text)]">{ins.title}</p>
                    <p className="text-[12px] text-[var(--text-mid)] mt-1 line-clamp-2">{ins.body}</p>
                    <div className="flex gap-2 mt-2 opacity-0 hover:opacity-100 transition-opacity">
                      <button className="text-[14px]" onClick={() => toast.success('Noted')}>👍</button>
                      <button className="text-[14px]" onClick={() => toast('Dismissed')}>👎</button>
                    </div>
                  </motion.div>
                )
              }) : (
                <div className="card p-5 rounded-[12px] text-center w-full">
                  <p className="text-[12px] text-[var(--text-dim)]">Connect your AI key in Settings to enable daily insights.</p>
                  <Link href="/settings" className="text-[11px] text-[var(--accent)] hover:underline mt-1 inline-block">Settings &rarr;</Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── 13. COMMAND INPUT ── */}
          <motion.div style={{ gridColumn: 'span 12' }} {...cardAnim(0.42)}>
            <div className="glass rounded-[16px] p-3 flex items-center gap-3">
              <button className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--accent), var(--cyan))' }}>
                <span className="text-[14px]">🎤</span>
              </button>
              <input type="text" placeholder="Quick update or ask AI..."
                className="flex-1 bg-transparent text-[13px] text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none"
              />
              <span className="text-[11px] text-[var(--text-dim)] flex-shrink-0">↵</span>
            </div>
          </motion.div>

        </div>{/* end bento grid */}
      </div>
    </PageTransition>
  )
}
