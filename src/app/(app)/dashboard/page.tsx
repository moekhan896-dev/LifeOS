'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { useStore, getExecutionScore, getScoreZone, getClientNet, getAgencyTotals, getBusinessHealth, getTaskPriorityScore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

/* ── Helpers ── */
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const sparkData = (base: number, variance: number) =>
  Array.from({ length: 7 }, (_, i) => ({ v: base + Math.sin(i * 1.2) * variance + i * variance * 0.1 }))

const priorityDotColor: Record<string, string> = { crit: '#f43f5e', high: '#f59e0b', med: '#3b82f6', low: '#4a5278' }
const tagColors: Record<string, string> = { OUTBOUND: '#06b6d4', SEO: '#10b981', REVENUE: '#10b981', CLIENT: '#3b82f6', EXIT: '#8b5cf6', CRITICAL: '#f43f5e', ADS: '#f59e0b', CONTENT: '#ec4899', MONETIZE: '#eab308', SYNERGY: '#8b5cf6', BRAND: '#ec4899', OPS: '#6b7280', HEALTH: '#10b981' }

/* ── Glass Card Style ── */
const glass = {
  background: 'rgba(14, 17, 24, 0.8)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 20,
  boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)',
} as const

/* ── Schedule Block Colors ── */
const SCHED_BG: Record<string, string> = {
  prayer: 'rgba(234,179,8,0.12)', work: 'rgba(59,130,246,0.12)', health: 'rgba(16,185,129,0.12)',
  personal: 'rgba(139,92,246,0.12)', meal: 'rgba(245,158,11,0.12)',
}
const SCHED_BORDER: Record<string, string> = {
  prayer: 'rgba(234,179,8,0.3)', work: 'rgba(59,130,246,0.3)', health: 'rgba(16,185,129,0.3)',
  personal: 'rgba(139,92,246,0.3)', meal: 'rgba(245,158,11,0.3)',
}
const SCHED_TEXT: Record<string, string> = {
  prayer: '#eab308', work: '#3b82f6', health: '#10b981', personal: '#8b5cf6', meal: '#f59e0b',
}

/* ── Stagger ── */
const anim = (d: number) => ({
  initial: { opacity: 0, y: 16 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { duration: 0.45, delay: d, ease: [0.22, 1, 0.36, 1] as const },
})

/* ── Progress Ring ── */
function Ring({ value, max, size, color, showText = true }: { value: number; max: number; size: number; color: string; showText?: boolean }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.min(value / max, 1)
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3.5} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3.5}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
      />
      {showText && (
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle" fill={color} fontSize={size * 0.28}
          fontWeight={700} fontFamily="var(--font-mono)" transform={`rotate(90 ${size / 2} ${size / 2})`}>
          {value}
        </text>
      )}
    </svg>
  )
}

/* ══════════════════════════════════════════ */
export default function DashboardPage() {
  const {
    businesses, clients, tasks, todayHealth, gmbProfiles, projects,
    toggleTask, incomeTarget, targetDate, expenseEntries,
    userName, todaySchedule, energyLogs, commitments, wakeUpTime,
    focusSessions, goals, logEvent,
  } = useStore()

  const todayStr = new Date().toISOString().split('T')[0]
  const now = new Date()
  const hour = now.getHours()
  const isMorning = hour < 14
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })

  /* ── Core metrics ── */
  const totalBizRevenue = businesses.reduce((s, b) => s + b.monthlyRevenue, 0)
  const totalExpenses = expenseEntries.filter(e => e.recurring).reduce((s, e) => s + e.amount, 0)
  const netIncome = totalBizRevenue - totalExpenses

  const tasksDoneToday = tasks.filter(t => t.done && t.completedAt?.startsWith(todayStr)).length
  const todayFocusSessions = focusSessions.filter(s => s.startedAt.startsWith(todayStr)).length
  const tasksCommitted = tasks.filter(t => !t.done && t.priority !== 'low').length + tasksDoneToday
  const executionScore = getExecutionScore(todayHealth, tasksCommitted, tasksDoneToday, todayFocusSessions)
  const scoreZone = getScoreZone(executionScore)

  const prayersDone = Object.values(todayHealth.prayers).filter(Boolean).length
  const latestEnergy = useMemo(() => {
    const today = energyLogs.filter(e => e.date === todayStr)
    return today.length > 0 ? today[today.length - 1] : null
  }, [energyLogs, todayStr])

  /* ── THE ONE THING ── */
  const sortedTasks = useMemo(() =>
    [...tasks].filter(t => !t.done).map(t => {
      const biz = businesses.find(b => b.id === t.businessId)
      return { ...t, score: getTaskPriorityScore(t, biz) }
    }).sort((a, b) => b.score - a.score),
  [tasks, businesses])
  const theOne = sortedTasks[0]
  const theOneProject = theOne?.projectId ? projects.find(p => p.id === theOne.projectId) : null
  const theOneGoal = theOneProject?.goalId ? goals.find(g => g.id === theOneProject.goalId) : null

  /* ── Active projects ── */
  const activeProjects = projects.filter(p => p.status === 'in_progress').slice(0, 3)

  /* ── Alerts ── */
  const alerts = useMemo(() => {
    const list: { text: string; color: string; icon: string; action: string; link: string }[] = []
    const activeClients = clients.filter(c => c.active)
    const totalNet = activeClients.reduce((s, c) => s + getClientNet(c), 0)
    activeClients.forEach(c => {
      const pct = totalNet > 0 ? (getClientNet(c) / totalNet) * 100 : 0
      if (pct > 40) list.push({ text: `${c.name} is ${Math.round(pct)}% of revenue`, color: '#f43f5e', icon: '🔴', action: 'Diversify →', link: '/financials' })
    })
    businesses.filter(b => !['dormant', 'idea'].includes(b.status)).forEach(b => {
      if (getBusinessHealth(b, tasks, []) === 'flatline') list.push({ text: `${b.name} is flatlined — 0 tasks done in 7 days`, color: '#f43f5e', icon: '🔴', action: 'Fix →', link: `/business/${b.id}` })
    })
    const stale = tasks.filter(t => !t.done && (Date.now() - new Date(t.createdAt).getTime()) > 7 * 86400000)
    if (stale.length > 0) list.push({ text: `${stale.length} stale task${stale.length !== 1 ? 's' : ''} older than 7 days`, color: '#f59e0b', icon: '🟡', action: 'Review →', link: '/tasks' })
    const total = commitments.length; const fulfilled = commitments.filter(c => c.fulfilled).length
    if (total > 3 && (fulfilled / total) < 0.5) list.push({ text: `Commitment rate is ${Math.round((fulfilled / total) * 100)}%`, color: '#8b5cf6', icon: '🟣', action: 'Review →', link: '/commitments' })
    list.push({ text: 'Cold email generated $585/hr last time — restart it', color: '#10b981', icon: '🟢', action: 'Start project →', link: '/projects' })
    list.push({ text: 'You complete 3x more tasks on Fajr days', color: '#3b82f6', icon: '🔵', action: 'Set alarm →', link: '/health' })
    return list.slice(0, 5)
  }, [clients, businesses, tasks, commitments])

  /* ── Cost of inaction ── */
  const costOfInaction = useMemo(() => {
    const wakeHour = wakeUpTime ? parseInt(wakeUpTime.split(':')[0]) : 8
    const hoursSinceWake = Math.max(0, hour - wakeHour)
    const rate = netIncome > 0 ? netIncome / 160 : 25
    const items = [
      { label: 'Sleeping past 9am', amount: Math.round(Math.max(0, 9 - wakeHour) * 700 / 8) },
      { label: 'No cold email today', amount: Math.round(rate * 2) },
      { label: 'Undone high-pri tasks', amount: Math.round(sortedTasks.filter(t => t.priority === 'crit' || t.priority === 'high').length * rate * 0.5) },
    ].filter(i => i.amount > 0)
    return { items, total: items.reduce((s, i) => s + i.amount, 0) }
  }, [hour, wakeUpTime, netIncome, sortedTasks])

  /* ── Days remaining ── */
  const daysRemaining = targetDate ? Math.max(0, Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000)) : 0
  const progressPct = incomeTarget > 0 ? Math.min(100, Math.round((netIncome / incomeTarget) * 100)) : 0

  /* ── Schedule ── */
  const currentMinutes = hour * 60 + now.getMinutes()

  /* ── Sparklines ── */
  const incomeSparkData = sparkData(Math.max(netIncome, 1000), Math.max(netIncome * 0.05, 100))
  const scoreSparkData = sparkData(Math.max(executionScore, 10), 8)

  const handleComplete = () => {
    if (!theOne) return
    toggleTask(theOne.id)
    logEvent('task_completed', { taskId: theOne.id, source: 'one_thing' })
    toast.success(`Done! +${theOne.xpValue} XP`)
  }

  return (
    <PageTransition>
      <div className="pb-32" style={{ background: 'linear-gradient(180deg, #060810 0%, #0a0d15 50%, #080b12 100%)', minHeight: '100vh', margin: '-16px -20px', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 16, maxWidth: 1400, margin: '0 auto' }}>

          {/* ═══ ROW 1: GREETING + PREDICTION ═══ */}
          <motion.div style={{ gridColumn: 'span 12' }} {...anim(0)}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 300, color: '#f1f3f9', letterSpacing: '-0.5px' }}>
                  {getGreeting()}, <span style={{ fontWeight: 700, color: '#10b981' }}>{userName || 'Art'}</span>
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map(p => (
                    <div key={p} style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: todayHealth.prayers[p] ? '#eab308' : 'rgba(255,255,255,0.1)',
                      boxShadow: todayHealth.prayers[p] ? '0 0 8px rgba(234,179,8,0.4)' : 'none',
                      transition: 'all 0.3s',
                    }} />
                  ))}
                </div>
                <span className="data text-[12px]" style={{ color: '#4a5278' }}>{dateStr}</span>
              </div>
            </div>

            {/* Prediction card */}
            {isMorning && (
              <motion.div {...anim(0.05)} style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(6,182,212,0.04))',
                border: '1px solid rgba(139,92,246,0.15)',
                borderLeft: '3px solid #8b5cf6',
                borderRadius: 16, padding: '16px 20px',
              }}>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: 16 }}>🔮</span>
                  <span className="data" style={{ fontSize: 10, letterSpacing: 2, color: '#8b5cf6' }}>TODAY&apos;S PREDICTION</span>
                </div>
                <p style={{ fontSize: 14, color: '#8892b0', lineHeight: 1.6 }}>
                  Based on your patterns, if you pray <strong style={{ color: '#eab308' }}>Fajr</strong> and <strong style={{ color: '#10b981' }}>gym</strong> first,
                  your data shows you&apos;ll complete <strong style={{ color: '#10b981' }}>3x more tasks</strong>.
                  Yesterday you scored <strong style={{ color: '#f59e0b' }}>{executionScore > 0 ? executionScore : 29}</strong>.
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => { logEvent('challenge_accepted', {}); toast('Challenge accepted!') }}
                  style={{
                    marginTop: 12, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                    border: 'none', borderRadius: 10, padding: '8px 20px',
                    color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(139,92,246,0.25)',
                  }}>
                  ⚡ Beat the day →
                </motion.button>
              </motion.div>
            )}
          </motion.div>

          {/* ═══ ROW 2: THE ONE THING ═══ */}
          <motion.div style={{ gridColumn: 'span 12' }} {...anim(0.06)}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.04))',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 24, padding: '32px 40px', textAlign: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Glow */}
              <div style={{ position: 'absolute', inset: -1, background: 'linear-gradient(135deg, rgba(16,185,129,0.25), transparent 40%, transparent 60%, rgba(6,182,212,0.25))', borderRadius: 25, zIndex: 0, filter: 'blur(1px)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="data" style={{ fontSize: 10, letterSpacing: 4, color: '#10b981', marginBottom: 12 }}>THE ONE THING</div>
                {theOne ? (
                  <>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#f1f3f9', marginBottom: 20, lineHeight: 1.3 }}>{theOne.text}</div>
                    {/* Stats row */}
                    <div className="flex justify-center gap-8 mb-6" style={{ fontSize: 13 }}>
                      <div>
                        <div className="data" style={{ color: '#10b981' }}>${Math.round((netIncome > 0 ? netIncome / 160 : 100) * 2)}/day</div>
                        <div style={{ fontSize: 11, color: '#4a5278', marginTop: 2 }}>Revenue impact</div>
                      </div>
                      <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
                      <div>
                        <div className="data" style={{ color: '#f59e0b' }}>{theOne.score}/100</div>
                        <div style={{ fontSize: 11, color: '#4a5278', marginTop: 2 }}>Priority score</div>
                      </div>
                      <div style={{ width: 1, background: 'rgba(255,255,255,0.06)' }} />
                      <div>
                        <div className="data" style={{ color: '#8892b0' }}>~2 hours</div>
                        <div style={{ fontSize: 11, color: '#4a5278', marginTop: 2 }}>Estimated time</div>
                      </div>
                    </div>
                    {/* Context chain */}
                    {(theOneProject || theOneGoal) && (
                      <div style={{ fontSize: 11, color: '#4a5278', marginBottom: 16 }}>
                        {theOneProject && <span>📋 {theOneProject.name}</span>}
                        {theOneGoal && <span> → 🎯 {theOneGoal.title}</span>}
                      </div>
                    )}
                    <div className="flex justify-center gap-3">
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleComplete}
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 12, padding: '12px 32px', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
                        ✓ Done
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 24px', color: '#8892b0', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
                        Skip →
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 20, fontWeight: 600, color: '#f1f3f9', marginBottom: 8 }}>Your plate is clear.</div>
                    <div className="flex justify-center gap-3">
                      <Link href="/ai" style={{ fontSize: 13, color: '#10b981' }}>Ask AI →</Link>
                      <Link href="/tasks" style={{ fontSize: 13, color: '#8892b0' }}>Add task →</Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* ═══ ROW 3: METRIC CARDS ═══ */}
          {/* NET INCOME */}
          <motion.div style={{ gridColumn: 'span 12', ...{ '@media (min-width: 768px)': { gridColumn: 'span 3' } } }} className="col-span-12 md:col-span-3" {...anim(0.1)}>
            <div style={{ ...glass, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, #10b981, transparent)' }} />
              <div style={{ position: 'absolute', top: -20, left: '20%', right: '20%', height: 40, background: 'radial-gradient(ellipse, rgba(16,185,129,0.15), transparent)', filter: 'blur(20px)' }} />
              <div className="flex justify-between items-start relative">
                <span className="data" style={{ fontSize: 10, letterSpacing: 2, color: '#4a5278', textTransform: 'uppercase' }}>Net Income</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>💰</div>
              </div>
              <div className="data" style={{ fontSize: 40, fontWeight: 800, color: '#10b981', textShadow: '0 0 30px rgba(16,185,129,0.3)', lineHeight: 1, margin: '12px 0 4px' }}>
                ${netIncome > 0 ? Math.round(netIncome).toLocaleString() : '0'}
              </div>
              <div style={{ fontSize: 12, color: '#4a5278' }}>Monthly take-home</div>
              <div style={{ marginTop: 16, marginLeft: -24, marginRight: -24, marginBottom: -8 }}>
                <ResponsiveContainer width="100%" height={60}>
                  <AreaChart data={incomeSparkData}>
                    <defs><linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                    <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fill="url(#eg)" dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>

          {/* EXECUTION SCORE */}
          <motion.div className="col-span-12 md:col-span-3" {...anim(0.14)}>
            <div style={{ ...glass, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg, transparent, ${scoreZone.color}, transparent)` }} />
              <div className="flex justify-between items-start">
                <span className="data" style={{ fontSize: 10, letterSpacing: 2, color: '#4a5278', textTransform: 'uppercase' }}>Execution</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `${scoreZone.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
              </div>
              <div className="flex items-end gap-1">
                <span className="data" style={{ fontSize: 40, fontWeight: 800, color: scoreZone.color, textShadow: `0 0 30px ${scoreZone.color}4d`, lineHeight: 1, marginTop: 12 }}>{executionScore}</span>
                <span className="data" style={{ fontSize: 16, color: '#4a5278', marginBottom: 4 }}>/100</span>
              </div>
              <div style={{ fontSize: 12, color: '#4a5278', marginTop: 4 }}>{scoreZone.emoji} {scoreZone.label}</div>
              <div style={{ position: 'absolute', bottom: 16, right: 20 }}>
                <Ring value={executionScore} max={100} size={56} color={scoreZone.color} />
              </div>
            </div>
          </motion.div>

          {/* ENERGY */}
          <motion.div className="col-span-12 md:col-span-3" {...anim(0.18)}>
            <div style={{ ...glass, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, #06b6d4, transparent)' }} />
              <div className="flex justify-between items-start">
                <span className="data" style={{ fontSize: 10, letterSpacing: 2, color: '#4a5278', textTransform: 'uppercase' }}>Energy</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>⚡</div>
              </div>
              {latestEnergy ? (
                <>
                  <div className="data" style={{ fontSize: 40, fontWeight: 800, color: latestEnergy.level >= 4 ? '#06b6d4' : '#f59e0b', textShadow: '0 0 30px rgba(6,182,212,0.3)', lineHeight: 1, marginTop: 12 }}>
                    {latestEnergy.level >= 4 ? 'High' : latestEnergy.level >= 2 ? 'Med' : 'Low'}
                  </div>
                  <div style={{ fontSize: 12, color: '#4a5278', marginTop: 4 }}>{latestEnergy.level}/5 · {latestEnergy.timeOfDay}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#4a5278', marginTop: 12 }}>—</div>
                  <Link href="/energy" style={{ fontSize: 12, color: '#06b6d4', marginTop: 4, display: 'block' }}>⚡ Log energy →</Link>
                </>
              )}
            </div>
          </motion.div>

          {/* PRAYERS */}
          <motion.div className="col-span-12 md:col-span-3" {...anim(0.22)}>
            <div style={{
              ...glass, padding: '20px 24px', position: 'relative', overflow: 'hidden',
              ...(prayersDone === 5 ? { border: '1px solid rgba(234,179,8,0.25)', boxShadow: '0 4px 24px rgba(0,0,0,0.2), 0 0 20px rgba(234,179,8,0.08), inset 0 1px 0 rgba(255,255,255,0.03)' } : {}),
            }}>
              <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, #eab308, transparent)' }} />
              <div className="flex justify-between items-start">
                <span className="data" style={{ fontSize: 10, letterSpacing: 2, color: '#4a5278', textTransform: 'uppercase' }}>Prayers</span>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(234,179,8,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤲</div>
              </div>
              <div className="flex items-end gap-1">
                <span className="data" style={{ fontSize: 40, fontWeight: 800, color: '#eab308', textShadow: '0 0 30px rgba(234,179,8,0.3)', lineHeight: 1, marginTop: 12 }}>{prayersDone}</span>
                <span className="data" style={{ fontSize: 16, color: '#4a5278', marginBottom: 4 }}>/5</span>
              </div>
              <div className="flex gap-2 mt-3">
                {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map(p => (
                  <div key={p} style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: todayHealth.prayers[p] ? '#eab308' : 'transparent',
                    border: `2px solid ${todayHealth.prayers[p] ? '#eab308' : 'rgba(234,179,8,0.2)'}`,
                    boxShadow: todayHealth.prayers[p] ? '0 0 6px rgba(234,179,8,0.4)' : 'none',
                  }} />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ═══ ROW 4: SCHEDULE TIMELINE ═══ */}
          <motion.div className="col-span-12" {...anim(0.26)}>
            <div style={{ ...glass, padding: '16px 20px' }}>
              <span className="data" style={{ fontSize: 10, letterSpacing: 2, color: '#4a5278', textTransform: 'uppercase' }}>TODAY&apos;S SCHEDULE</span>
              {todaySchedule.length > 0 ? (
                <>
                  <div style={{ position: 'relative', height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.02)', overflow: 'hidden', marginTop: 12 }}>
                    {todaySchedule.map((block, i) => {
                      const [bh, bm] = block.time.split(':').map(Number)
                      const startMin = bh * 60 + (bm || 0)
                      const dayStart = 360; const dayEnd = 1440
                      const leftPct = ((startMin - dayStart) / (dayEnd - dayStart)) * 100
                      const widthPct = (block.duration / (dayEnd - dayStart)) * 100
                      return (
                        <div key={i} style={{
                          position: 'absolute', left: `${Math.max(0, leftPct)}%`, width: `${Math.min(widthPct, 100 - Math.max(0, leftPct))}%`,
                          top: 4, bottom: 4, borderRadius: 8,
                          background: SCHED_BG[block.type] || 'rgba(255,255,255,0.04)',
                          border: `1px solid ${SCHED_BORDER[block.type] || 'rgba(255,255,255,0.08)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 500, color: SCHED_TEXT[block.type] || '#8892b0',
                          opacity: block.completed ? 0.4 : 1,
                        }} title={block.title}>{widthPct > 4 && block.title.slice(0, 15)}</div>
                      )
                    })}
                    {/* Current time indicator */}
                    <div style={{ position: 'absolute', left: `${((currentMinutes - 360) / 1080) * 100}%`, top: 0, bottom: 0, width: 2, background: '#f43f5e', boxShadow: '0 0 8px rgba(244,63,94,0.5)', zIndex: 10 }}>
                      <div style={{ position: 'absolute', top: -5, left: -4, width: 10, height: 10, borderRadius: '50%', background: '#f43f5e' }} />
                    </div>
                  </div>
                  <div className="flex justify-between mt-2" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#4a5278' }}>
                    <span>6 AM</span><span>9 AM</span><span>12 PM</span><span>3 PM</span><span>6 PM</span><span>9 PM</span><span>12 AM</span>
                  </div>
                </>
              ) : (
                <div style={{ marginTop: 12 }}><Link href="/schedule" style={{ fontSize: 12, color: '#10b981' }}>Plan your day →</Link></div>
              )}
            </div>
          </motion.div>

          {/* ═══ ROW 5: PROJECTS + ALERTS ═══ */}
          <motion.div className="col-span-12 md:col-span-5" {...anim(0.3)}>
            <div style={{ ...glass, padding: '20px 24px' }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="data" style={{ fontSize: 10, letterSpacing: 2, color: '#4a5278', textTransform: 'uppercase' }}>Active Projects</span>
                <span className="data" style={{ fontSize: 10, color: '#10b981' }}>{activeProjects.length}/3</span>
              </div>
              {activeProjects.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {activeProjects.map((p, i) => {
                    const biz = businesses.find(b => b.id === p.businessId)
                    const pTasks = tasks.filter(t => t.projectId === p.id)
                    const done = pTasks.filter(t => t.done).length
                    return (
                      <motion.div key={p.id} {...anim(0.3 + i * 0.05)} whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <Ring value={p.progress} max={100} size={44} color={biz?.color || '#10b981'} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f3f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div className="data" style={{ fontSize: 11, color: '#4a5278' }}>{done}/{pTasks.length} tasks · ICE: {p.impact * p.confidence * p.ease}</div>
                        </div>
                        <span style={{ fontSize: 16, color: '#4a5278' }}>→</span>
                      </motion.div>
                    )
                  })}
                </div>
              ) : (
                <Link href="/projects" style={{ fontSize: 12, color: '#10b981' }}>Start your first project →</Link>
              )}
            </div>
          </motion.div>

          <motion.div className="col-span-12 md:col-span-7" {...anim(0.32)}>
            <div style={{ ...glass, padding: '20px 24px' }}>
              <span className="data" style={{ fontSize: 10, letterSpacing: 2, color: '#4a5278', textTransform: 'uppercase', display: 'block', marginBottom: 16 }}>Alerts & Insights</span>
              <div className="flex flex-col gap-2">
                {alerts.map((a, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.06 }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: `${a.color}08`, borderLeft: `3px solid ${a.color}`, borderRadius: '0 12px 12px 0', cursor: 'pointer' }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{a.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#f1f3f9', lineHeight: 1.4 }}>{a.text}</div>
                      <Link href={a.link} className="data" style={{ fontSize: 11, color: a.color, marginTop: 4, display: 'inline-block' }}>{a.action}</Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ═══ ROW 6: COST + DAYS + TASKS ═══ */}
          <motion.div className="col-span-12 md:col-span-4" {...anim(0.38)}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(244,63,94,0.06), rgba(14,17,24,0.8))',
              backdropFilter: 'blur(20px)', border: '1px solid rgba(244,63,94,0.15)',
              borderRadius: 20, padding: '20px 24px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            }}>
              <span className="data" style={{ fontSize: 10, letterSpacing: 2, color: '#f43f5e', textTransform: 'uppercase' }}>Cost of Inaction</span>
              <div className="data" style={{ fontSize: 36, fontWeight: 800, color: '#f43f5e', textShadow: '0 0 30px rgba(244,63,94,0.3)', margin: '12px 0' }}>
                -${costOfInaction.total.toLocaleString()}
              </div>
              <div style={{ fontSize: 11, color: '#f43f5e', opacity: 0.7, marginBottom: 16 }}>lost today so far</div>
              {costOfInaction.items.map((item, i) => (
                <div key={i} className="flex justify-between" style={{ padding: '4px 0', fontSize: 12 }}>
                  <span style={{ color: '#8892b0' }}>{item.label}</span>
                  <span className="data" style={{ color: '#f43f5e' }}>-${item.amount}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(244,63,94,0.15)', textAlign: 'center' }}>
                <Link href="/ai" style={{ fontSize: 11, color: '#f43f5e' }}>How to reduce this →</Link>
              </div>
            </div>
          </motion.div>

          <motion.div className="col-span-12 md:col-span-3" {...anim(0.42)}>
            <div style={{ ...glass, padding: '20px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 200 }}>
              <span className="data" style={{ fontSize: 10, letterSpacing: 2, color: '#4a5278', textTransform: 'uppercase' }}>Days to Target</span>
              <div className="data" style={{
                fontSize: 56, fontWeight: 800, lineHeight: 1, margin: '8px 0',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{daysRemaining || '—'}</div>
              <div style={{ fontSize: 12, color: '#4a5278' }}>to ${incomeTarget ? `${Math.round(incomeTarget / 1000)}K` : '50K'}/mo</div>
              <div style={{ margin: '16px 20px 0', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 1.2, delay: 0.5 }}
                  style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
              </div>
              <div className="flex justify-between data" style={{ margin: '6px 20px 0', fontSize: 10, color: '#4a5278' }}>
                <span>${Math.round(netIncome / 1000)}K</span><span>${Math.round((incomeTarget || 50000) / 1000)}K</span>
              </div>
            </div>
          </motion.div>

          <motion.div className="col-span-12 md:col-span-5" {...anim(0.46)}>
            <div style={{ ...glass, padding: '20px 24px' }}>
              <div className="flex justify-between mb-3">
                <span className="data" style={{ fontSize: 10, letterSpacing: 2, color: '#4a5278', textTransform: 'uppercase' }}>Today&apos;s Tasks</span>
                <span className="data" style={{ fontSize: 10, color: '#10b981' }}>{tasksDoneToday}/{tasksDoneToday + sortedTasks.length}</span>
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {sortedTasks.slice(0, 6).map((t, i) => (
                  <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.04 }}
                    onClick={() => { toggleTask(t.id); toast.success(`+${t.xpValue} XP`) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', marginBottom: 4, borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' }}
                    className="hover:bg-white/[0.02]">
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: priorityDotColor[t.priority], flexShrink: 0 }} />
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.12)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#f1f3f9', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.text}</span>
                    {t.tag && <span className="data" style={{ fontSize: 9, letterSpacing: 0.5, padding: '2px 6px', borderRadius: 6, background: `${tagColors[t.tag] || '#6b7280'}15`, color: tagColors[t.tag] || '#6b7280' }}>{t.tag}</span>}
                  </motion.div>
                ))}
                {sortedTasks.length === 0 && <div style={{ fontSize: 12, color: '#4a5278', fontStyle: 'italic', padding: 8 }}>All clear</div>}
              </div>
            </div>
          </motion.div>

          {/* ═══ ROW 7: CLIENTS + GMB ═══ */}
          <motion.div className="col-span-12 md:col-span-6" {...anim(0.5)}>
            <div style={{ ...glass, padding: '20px 24px' }}>
              <span className="data" style={{ fontSize: 10, letterSpacing: 2, color: '#4a5278', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>Clients</span>
              {clients.filter(c => c.active).length > 0 ? (
                <div className="space-y-2">
                  {clients.filter(c => c.active).map(c => {
                    const net = getClientNet(c)
                    const totalNet = clients.filter(cl => cl.active).reduce((s, cl) => s + getClientNet(cl), 0)
                    const pct = totalNet > 0 ? Math.round((net / totalNet) * 100) : 0
                    return (
                      <div key={c.id} className="flex items-center justify-between" style={{ fontSize: 12, padding: '6px 0' }}>
                        <div className="flex items-center gap-2">
                          <span style={{ color: '#f1f3f9', fontWeight: 500 }}>{c.name}</span>
                          {pct > 40 && <span className="data" style={{ fontSize: 9, background: 'rgba(244,63,94,0.15)', color: '#f43f5e', padding: '1px 6px', borderRadius: 4 }}>{pct}% RISK</span>}
                        </div>
                        <span className="data" style={{ color: '#10b981', fontWeight: 600 }}>${Math.round(net).toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              ) : <span style={{ fontSize: 12, color: '#4a5278', fontStyle: 'italic' }}>No active clients</span>}
            </div>
          </motion.div>

          <motion.div className="col-span-12 md:col-span-6" {...anim(0.54)}>
            <div style={{ ...glass, padding: '20px 24px' }}>
              <span className="data" style={{ fontSize: 10, letterSpacing: 2, color: '#4a5278', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>GMB Profiles</span>
              {gmbProfiles.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {gmbProfiles.slice(0, 9).map(g => (
                    <div key={g.id} style={{
                      padding: '10px 12px', borderRadius: 12,
                      background: 'rgba(255,255,255,0.02)',
                      borderTop: `2px solid ${g.status === 'strong' ? '#10b981' : g.status === 'medium' ? '#f59e0b' : '#3b82f6'}`,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f3f9', marginBottom: 4 }}>{g.city}</div>
                      <div className="flex gap-2" style={{ fontSize: 10, color: '#4a5278' }}>
                        <span>⭐{g.reviewCount}</span>
                        <span>📞{g.callsPerMonth}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <span style={{ fontSize: 12, color: '#4a5278', fontStyle: 'italic' }}>No GMB profiles</span>}
            </div>
          </motion.div>

        </div>

        {/* ═══ COMMAND INPUT (sticky bottom) ═══ */}
        <div style={{ position: 'sticky', bottom: 16, zIndex: 40, maxWidth: 640, margin: '24px auto 0' }}>
          <div style={{
            background: 'rgba(14, 17, 24, 0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '12px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
            boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer', flexShrink: 0 }}>🎤</div>
            <input style={{ flex: 1, background: 'transparent', border: 'none', color: '#f1f3f9', fontSize: 14, outline: 'none' }} placeholder="Quick update or ask AI..." />
            <span className="data" style={{ fontSize: 11, color: '#4a5278', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 8 }}>↵</span>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
