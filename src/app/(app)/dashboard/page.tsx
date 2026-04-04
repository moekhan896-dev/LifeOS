'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'
import { useStore, getExecutionScore, getScoreZone, getClientNet, getAgencyTotals, getBusinessHealth, getTaskPriorityScore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import CommandInput from '@/components/CommandInput'

/* ── Helpers ── */

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const cardAnim = (delay: number) => ({
  initial: { opacity: 0, y: 12 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay, duration: 0.35 },
})

const sparkData = (base: number, variance: number) =>
  Array.from({ length: 7 }, (_, i) => ({ v: base + Math.sin(i * 1.2) * variance + i * variance * 0.1 }))

/* ── Progress Ring ── */

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

/* ── Schedule Block Colors ── */
const BLOCK_COLORS: Record<string, string> = {
  prayer: 'var(--gold)', work: 'var(--blue)', health: 'var(--accent)',
  personal: 'var(--purple)', meal: 'var(--amber)',
}

/* ── Main ── */

export default function DashboardPage() {
  const {
    businesses, clients, tasks, todayHealth, gmbProfiles, projects,
    toggleTask, incomeTarget, targetDate, revenueEntries, expenseEntries,
    userName, todaySchedule, energyLogs, commitments, wakeUpTime,
    focusSessions, goals, identityStatements, logEvent,
  } = useStore()

  const todayStr = new Date().toISOString().split('T')[0]
  const now = new Date()
  const hour = now.getHours()
  const isMorning = hour < 14

  // ── Core metrics ──
  const agencyTotals = getAgencyTotals(clients)
  const totalBizRevenue = businesses.reduce((s, b) => s + b.monthlyRevenue, 0)
  const totalExpenses = expenseEntries.filter(e => e.recurring).reduce((s, e) => s + e.amount, 0)
  const netIncome = totalBizRevenue - totalExpenses

  const tasksDoneToday = tasks.filter(t => t.done && t.completedAt?.startsWith(todayStr)).length
  const todayFocusSessions = focusSessions.filter(s => s.startedAt.startsWith(todayStr)).length
  const tasksCommitted = tasks.filter(t => t.createdAt.startsWith(todayStr) || (!t.done && t.priority !== 'low')).length
  const executionScore = getExecutionScore(todayHealth, tasksCommitted, tasksDoneToday, todayFocusSessions)
  const scoreZone = getScoreZone(executionScore)

  const prayersDone = Object.values(todayHealth.prayers).filter(Boolean).length

  const latestEnergy = useMemo(() => {
    const today = energyLogs.filter(e => e.date === todayStr)
    return today.length > 0 ? today[today.length - 1] : null
  }, [energyLogs, todayStr])

  // ── THE ONE THING (highest priority incomplete task) ──
  const sortedTasks = useMemo(() => {
    return [...tasks]
      .filter(t => !t.done)
      .map(t => {
        const biz = businesses.find(b => b.id === t.businessId)
        return { ...t, score: getTaskPriorityScore(t, biz) }
      })
      .sort((a, b) => b.score - a.score)
  }, [tasks, businesses])

  const theOneThing = sortedTasks[0]
  const theOneThingBiz = theOneThing ? businesses.find(b => b.id === theOneThing.businessId) : null
  const theOneThingProject = theOneThing?.projectId ? projects.find(p => p.id === theOneThing.projectId) : null
  const theOneThingGoal = theOneThingProject?.goalId ? goals.find(g => g.id === theOneThingProject.goalId) : null

  // ── Active projects ──
  const activeProjects = projects.filter(p => p.status === 'in_progress').slice(0, 3)

  // ── Alerts ──
  const alerts = useMemo(() => {
    const list: { text: string; color: string; type: string }[] = []
    // Concentration risk
    const activeClients = clients.filter(c => c.active)
    const totalNet = activeClients.reduce((s, c) => s + getClientNet(c), 0)
    activeClients.forEach(c => {
      const pct = totalNet > 0 ? (getClientNet(c) / totalNet) * 100 : 0
      if (pct > 40) list.push({ text: `${c.name} is ${Math.round(pct)}% of revenue — concentration risk`, color: 'var(--rose)', type: 'risk' })
    })
    // Business health
    businesses.filter(b => b.status !== 'dormant' && b.status !== 'idea').forEach(b => {
      const health = getBusinessHealth(b, tasks, revenueEntries)
      if (health === 'flatline') list.push({ text: `${b.name} is flatlined — 0 tasks done in 7 days`, color: 'var(--rose)', type: 'health' })
    })
    // Stale tasks
    const staleTasks = tasks.filter(t => !t.done && (Date.now() - new Date(t.createdAt).getTime()) > 7 * 86400000)
    if (staleTasks.length > 0) list.push({ text: `${staleTasks.length} stale task${staleTasks.length > 1 ? 's' : ''} older than 7 days`, color: 'var(--amber)', type: 'stale' })
    // Commitment rate
    const total = commitments.length
    const fulfilled = commitments.filter(c => c.fulfilled).length
    if (total > 0 && (fulfilled / total) < 0.5) list.push({ text: `Commitment rate is ${Math.round((fulfilled / total) * 100)}% — below 50%`, color: 'var(--amber)', type: 'commitment' })
    return list.slice(0, 5)
  }, [clients, businesses, tasks, revenueEntries, commitments])

  // ── Cost of inaction ──
  const costOfInaction = useMemo(() => {
    const wakeHour = wakeUpTime ? parseInt(wakeUpTime.split(':')[0]) : 8
    const hoursSinceWake = Math.max(0, hour - wakeHour)
    const critHighUndone = tasks.filter(t => !t.done && (t.priority === 'crit' || t.priority === 'high'))
    const estimatedHourlyRate = netIncome > 0 ? netIncome / 160 : 25
    const costPerTask = critHighUndone.map(t => {
      const weight = t.priority === 'crit' ? 1.5 : 1
      return { label: t.text.slice(0, 40), amount: Math.round(estimatedHourlyRate * weight * (hoursSinceWake / critHighUndone.length || 1)) }
    }).slice(0, 4)
    const total = costPerTask.reduce((s, c) => s + c.amount, 0)
    return { items: costPerTask, total }
  }, [tasks, netIncome, hour, wakeUpTime])

  // ── Days remaining ──
  const daysRemaining = targetDate ? Math.max(0, Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400000)) : 0

  // ── Yesterday's score (hardcoded for now) ──
  const yesterdayScore = 62

  // ── Sparkline for net income ──
  const incomeSparkData = netIncome > 0 ? sparkData(netIncome, netIncome * 0.05) : Array.from({ length: 7 }, () => ({ v: 0 }))

  // ── Schedule timeline ──
  const currentMinutes = hour * 60 + now.getMinutes()
  const scheduleStart = todaySchedule.length > 0 ? parseInt(todaySchedule[0].time.split(':')[0]) * 60 + parseInt(todaySchedule[0].time.split(':')[1] || '0') : 480
  const scheduleEnd = todaySchedule.length > 0
    ? Math.max(...todaySchedule.map(b => {
        const [h, m] = b.time.split(':').map(Number)
        return h * 60 + (m || 0) + b.duration
      }))
    : 1380

  return (
    <PageTransition>
      <div className="pb-32">
        <div className="grid grid-cols-12 gap-4">

          {/* ── ROW 0: PREDICTIVE MORNING BRIEFING ── */}
          {isMorning && (
            <motion.div className="col-span-12" {...cardAnim(0)}>
              <div className="rounded-[20px] p-6" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.04), rgba(16,185,129,0.02))', border: '1px solid rgba(139,92,246,0.12)' }}>
                <span className="text-[10px] font-mono uppercase tracking-[2px] font-semibold" style={{ color: 'var(--purple)' }}>🔮 TODAY&apos;S PREDICTION</span>
                <div className="mt-3 space-y-1.5">
                  <p className="text-[13px] text-[var(--text-mid)]">🕌 If you pray Fajr, there&apos;s a ~78% chance of 7+ tasks done</p>
                  <p className="text-[13px] text-[var(--text-mid)]">⚡ Your energy peaks 9-11pm based on recent patterns</p>
                  <p className="text-[13px] text-[var(--text-mid)]">📱 High chance of 3+ hours scrolling if you skip gym</p>
                </div>
                <div className="mt-4">
                  <p className="text-[12px] font-semibold text-[var(--text)]">⚡ TO BEAT THE PREDICTION:</p>
                  <ul className="mt-1.5 space-y-1">
                    <li className="text-[12px] text-[var(--text-mid)]">1. Pray Fajr on time</li>
                    <li className="text-[12px] text-[var(--text-mid)]">2. Hit the gym before 2pm</li>
                    <li className="text-[12px] text-[var(--text-mid)]">3. Complete THE ONE THING before anything else</li>
                  </ul>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-[11px] text-[var(--text-dim)]">Yesterday you scored {yesterdayScore}. Beat it today.</p>
                  <motion.button
                    onClick={() => {
                      logEvent('challenge_accepted', { date: todayStr })
                      toast.success('Challenge accepted! Let\'s go.')
                    }}
                    className="px-4 py-2 rounded-[10px] text-[12px] font-semibold"
                    style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--purple)' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🎯 CHALLENGE ACCEPTED →
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ROW 1: THE ONE THING ── */}
          <motion.div className="gradient-border col-span-12" {...cardAnim(0.04)}>
            <div className="bg-[#0e1018] rounded-[16px] p-6">
              <div className="text-center">
                <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--accent)] font-semibold">THE ONE THING</span>
                {theOneThing ? (
                  <>
                    <p className="text-[20px] font-semibold text-white mt-3">{theOneThing.text}</p>
                    {theOneThing.score && (
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--purple)' }}>
                        Score: {theOneThing.score}/100
                      </span>
                    )}
                    {(theOneThingProject || theOneThingGoal) && (
                      <p className="text-[11px] text-[var(--text-dim)] mt-2">
                        {theOneThingProject && <>📋 {theOneThingProject.name}</>}
                        {theOneThingGoal && <> → 🎯 {theOneThingGoal.title}</>}
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <motion.button
                        onClick={() => {
                          toggleTask(theOneThing.id)
                          toast.success('Done! Loading next task...')
                        }}
                        className="px-5 py-2.5 rounded-[10px] text-[13px] font-semibold"
                        style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ✓ Done
                      </motion.button>
                      <Link href="/tasks" className="text-[12px] text-[var(--text-dim)] hover:text-[var(--text-mid)] transition-colors">
                        Skip →
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[20px] font-semibold text-white mt-3">Your plate is clear.</p>
                    <div className="flex items-center justify-center gap-3 mt-2">
                      <Link href="/ai" className="text-[12px] text-[var(--accent)] hover:underline">Ask AI what to focus on →</Link>
                      <Link href="/tasks" className="text-[12px] text-[var(--text-mid)] hover:underline">Add a task →</Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── ROW 2: 4 METRIC CARDS ── */}
          {/* NET INCOME */}
          <motion.div className="card rounded-[16px] p-5 col-span-6 md:col-span-3" {...cardAnim(0.08)} whileHover={{ y: -3, scale: 1.01 }}>
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">NET INCOME</span>
            <div className="data mt-2" style={{ fontSize: 32, fontWeight: 700, color: 'var(--accent)' }}>
              ${netIncome > 0 ? Math.round(netIncome).toLocaleString() : '0'}
            </div>
            <p className="text-[11px] text-[var(--text-mid)]">{new Date().toLocaleDateString('en-US', { month: 'short' })} take-home</p>
            <div className="mt-2">
              {netIncome > 0 ? (
                <ResponsiveContainer width={100} height={32}>
                  <AreaChart data={incomeSparkData}>
                    <defs><linearGradient id="sparkIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient></defs>
                    <Area type="monotone" dataKey="v" stroke="var(--accent)" strokeWidth={1.5} fill="url(#sparkIncome)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <span className="text-[10px] text-[var(--text-dim)] italic">Start tracking</span>}
            </div>
          </motion.div>

          {/* EXECUTION SCORE */}
          <motion.div className="card rounded-[16px] p-5 col-span-6 md:col-span-3" {...cardAnim(0.12)} whileHover={{ y: -3, scale: 1.01 }}>
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">EXECUTION</span>
            <div className="data mt-2" style={{ fontSize: 32, fontWeight: 700, color: scoreZone.color }}>
              {executionScore}<span className="text-[14px] text-[var(--text-dim)]">/100</span>
            </div>
            <p className="text-[11px] text-[var(--text-mid)]">{scoreZone.emoji} {scoreZone.label}</p>
            <div className="mt-2 flex justify-center relative">
              <ProgressRing value={executionScore} max={100} size={40} color={scoreZone.color} />
              <span className="absolute inset-0 flex items-center justify-center data text-[10px] font-bold text-[var(--text)]">{executionScore}</span>
            </div>
          </motion.div>

          {/* ENERGY */}
          <motion.div className="card rounded-[16px] p-5 col-span-6 md:col-span-3" {...cardAnim(0.16)} whileHover={{ y: -3, scale: 1.01 }}>
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">ENERGY</span>
            <div className="data mt-2" style={{ fontSize: 32, fontWeight: 700, color: latestEnergy ? (latestEnergy.level >= 7 ? 'var(--accent)' : latestEnergy.level >= 4 ? 'var(--amber)' : 'var(--rose)') : 'var(--text-dim)' }}>
              {latestEnergy ? `${latestEnergy.level}/10` : '—'}
            </div>
            <p className="text-[11px] text-[var(--text-mid)]">⚡ {latestEnergy ? latestEnergy.timeOfDay : 'Not logged'}</p>
          </motion.div>

          {/* PRAYERS */}
          <motion.div className="card rounded-[16px] p-5 col-span-6 md:col-span-3" {...cardAnim(0.2)} whileHover={{ y: -3, scale: 1.01 }}>
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">PRAYERS</span>
            <div className="data mt-2" style={{ fontSize: 32, fontWeight: 700, color: 'var(--gold)' }}>
              {prayersDone}<span className="text-[14px] text-[var(--text-dim)]">/5</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map(p => (
                <div key={p} className="rounded-full" style={{
                  width: 8, height: 8,
                  border: '2px solid var(--gold)',
                  backgroundColor: todayHealth.prayers[p] ? 'var(--gold)' : 'transparent',
                }} />
              ))}
            </div>
          </motion.div>

          {/* ── ROW 3: SCHEDULE TIMELINE ── */}
          <motion.div className="card rounded-[16px] p-5 col-span-12" {...cardAnim(0.24)}>
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">TODAY&apos;S SCHEDULE</span>
            {todaySchedule.length > 0 ? (
              <div className="mt-3 relative h-10 rounded-[8px] overflow-hidden" style={{ background: 'var(--surface2)' }}>
                {todaySchedule.map((block, i) => {
                  const [bh, bm] = block.time.split(':').map(Number)
                  const startMin = bh * 60 + (bm || 0)
                  const leftPct = ((startMin - scheduleStart) / (scheduleEnd - scheduleStart)) * 100
                  const widthPct = (block.duration / (scheduleEnd - scheduleStart)) * 100
                  return (
                    <div
                      key={i}
                      className="absolute top-0 h-full flex items-center justify-center text-[9px] font-mono text-white/80 overflow-hidden"
                      style={{
                        left: `${Math.max(0, leftPct)}%`,
                        width: `${Math.min(widthPct, 100 - leftPct)}%`,
                        background: BLOCK_COLORS[block.type] || 'var(--blue)',
                        opacity: block.completed ? 0.4 : 0.85,
                      }}
                      title={`${block.title} (${block.time})`}
                    >
                      {widthPct > 5 && block.title.slice(0, 12)}
                    </div>
                  )
                })}
                {/* Current time indicator */}
                {currentMinutes >= scheduleStart && currentMinutes <= scheduleEnd && (
                  <div
                    className="absolute top-0 h-full w-[2px]"
                    style={{
                      left: `${((currentMinutes - scheduleStart) / (scheduleEnd - scheduleStart)) * 100}%`,
                      background: 'var(--rose)',
                      zIndex: 10,
                    }}
                  />
                )}
              </div>
            ) : (
              <div className="mt-3">
                <Link href="/schedule" className="text-[12px] text-[var(--accent)] hover:underline">Plan your day →</Link>
              </div>
            )}
          </motion.div>

          {/* ── ROW 4: ACTIVE PROJECTS + ALERTS ── */}
          <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-5" {...cardAnim(0.28)}>
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">ACTIVE PROJECTS</span>
            {activeProjects.length > 0 ? (
              <div className="mt-3 space-y-3">
                {activeProjects.map(p => {
                  const biz = businesses.find(b => b.id === p.businessId)
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <ProgressRing value={p.progress} max={100} size={40} color="var(--accent)" />
                        <span className="absolute inset-0 flex items-center justify-center data text-[9px] font-bold text-[var(--text)]">{p.progress}%</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[var(--text)] truncate">{p.name}</p>
                        {biz && <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: biz.color }} />}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="mt-3">
                <Link href="/projects" className="text-[12px] text-[var(--accent)] hover:underline">Start your first project →</Link>
              </div>
            )}
          </motion.div>

          <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-7" {...cardAnim(0.32)}>
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">ALERTS & INSIGHTS</span>
            {alerts.length > 0 ? (
              <div className="mt-3 space-y-2">
                {alerts.map((a, i) => (
                  <div key={i} className="rounded-[10px] px-3 py-2.5" style={{ borderLeft: `3px solid ${a.color}`, background: 'var(--surface2)' }}>
                    <p className="text-[12px] text-[var(--text-mid)]">{a.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[var(--text-dim)] mt-3 italic">All clear. Keep it up.</p>
            )}
          </motion.div>

          {/* ── ROW 5: COST OF INACTION + DAYS + TASKS ── */}
          <motion.div
            className="card-urgent rounded-[16px] p-5 col-span-12 md:col-span-5"
            style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--rose) 5%, var(--surface)), var(--surface))' }}
            {...cardAnim(0.36)}
          >
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--rose)]">COST OF INACTION</span>
            <div className="data mt-2" style={{ fontSize: 28, fontWeight: 700, color: 'var(--rose)' }}>
              ${costOfInaction.total.toLocaleString()}
            </div>
            <p className="text-[10px] text-[var(--text-dim)] mb-2">lost today if you don&apos;t act</p>
            <div className="space-y-1">
              {costOfInaction.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-mid)] truncate mr-2">{item.label}</span>
                  <span className="data text-[var(--rose)]">${item.amount}</span>
                </div>
              ))}
              {costOfInaction.items.length === 0 && (
                <p className="text-[11px] text-[var(--text-dim)] italic">No critical tasks pending</p>
              )}
            </div>
          </motion.div>

          <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-7" {...cardAnim(0.4)}>
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Days remaining */}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">DAYS TO TARGET</span>
                <div className="data mt-2" style={{ fontSize: 36, fontWeight: 700, color: 'var(--cyan)' }}>
                  {daysRemaining > 0 ? daysRemaining : '—'}
                </div>
                <p className="text-[11px] text-[var(--text-mid)]">{targetDate ? `Target: ${new Date(targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No target set'}</p>
                {incomeTarget > 0 && (
                  <p className="text-[10px] text-[var(--text-dim)] mt-1">${Math.round(incomeTarget).toLocaleString()}/mo goal</p>
                )}
              </div>
              {/* Today's tasks */}
              <div className="overflow-y-auto max-h-[200px]">
                <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">TODAY&apos;S TASKS</span>
                <div className="mt-2 space-y-1.5">
                  {sortedTasks.slice(0, 6).map(t => (
                    <div key={t.id} className="flex items-center gap-2">
                      <button
                        onClick={() => { toggleTask(t.id); toast.success('Done!') }}
                        className="flex-shrink-0 w-4 h-4 rounded-[4px] border transition-colors"
                        style={{ borderColor: t.priority === 'crit' ? 'var(--rose)' : t.priority === 'high' ? 'var(--amber)' : 'var(--border)' }}
                      />
                      <span className="text-[11px] text-[var(--text-mid)] truncate">{t.text}</span>
                    </div>
                  ))}
                  {sortedTasks.length === 0 && <p className="text-[11px] text-[var(--text-dim)] italic">No tasks</p>}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── ROW 6: CLIENT TABLE + GMB GRID ── */}
          <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-6" {...cardAnim(0.44)}>
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">CLIENTS</span>
            {clients.filter(c => c.active).length > 0 ? (
              <div className="mt-3 space-y-2">
                {clients.filter(c => c.active).slice(0, 6).map(c => (
                  <div key={c.id} className="flex items-center justify-between text-[12px]">
                    <span className="text-[var(--text)] font-medium truncate mr-2">{c.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="data text-[var(--accent)]">${Math.round(getClientNet(c)).toLocaleString()}</span>
                      <span className="text-[var(--text-dim)]">{c.serviceType}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[var(--text-dim)] mt-3 italic">No active clients</p>
            )}
          </motion.div>

          <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-6" {...cardAnim(0.48)}>
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">GMB PROFILES</span>
            {gmbProfiles.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {gmbProfiles.slice(0, 6).map(g => (
                  <div key={g.id} className="rounded-[10px] p-2.5" style={{
                    background: 'var(--surface2)',
                    borderTop: `2px solid ${g.status === 'strong' ? 'var(--accent)' : g.status === 'medium' ? 'var(--amber)' : 'var(--blue)'}`,
                  }}>
                    <p className="text-[12px] font-medium text-[var(--text)] truncate">{g.city}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-[var(--text-dim)]">⭐ {g.reviewCount}</span>
                      <span className="text-[10px] text-[var(--text-dim)]">📞 {g.callsPerMonth}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-[var(--text-dim)] mt-3 italic">No GMB profiles</p>
            )}
          </motion.div>

        </div>

        {/* ── ROW 7: QUICK CAPTURE (sticky bottom) ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4" style={{ background: 'linear-gradient(to top, var(--bg) 80%, transparent)' }}>
          <div className="max-w-4xl mx-auto">
            <CommandInput />
          </div>
        </div>

      </div>
    </PageTransition>
  )
}
