'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Drawer } from 'vaul'
import { AreaChart, Area, LineChart, Line, ResponsiveContainer } from 'recharts'
import { useStore, getExecutionScore, getScoreZone, getClientNet, getAgencyTotals, getBusinessHealth, getTaskPriorityScore, type Priority } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import CommandInput from '@/components/CommandInput'
import { XP_VALUES } from '@/lib/constants'

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

/* ── Prayer times ── */
const PRAYER_TIMES: Record<string, string> = {
  fajr: '5:47 AM', dhuhr: '1:15 PM', asr: '4:48 PM', maghrib: '7:52 PM', isha: '9:15 PM',
}

/* ── Main ── */

export default function DashboardPage() {
  const {
    businesses, clients, tasks, todayHealth, gmbProfiles, projects,
    toggleTask, incomeTarget, targetDate, revenueEntries, expenseEntries,
    userName, todaySchedule, energyLogs, commitments, wakeUpTime,
    focusSessions, goals, identityStatements, logEvent,
    addTask, addProject, togglePrayer, updateHealth, addEnergyLog, updateBusiness,
  } = useStore()

  const todayStr = new Date().toISOString().split('T')[0]
  const now = new Date()
  const hour = now.getHours()
  const isMorning = hour < 14

  /* ── Interactive state ── */
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskBiz, setNewTaskBiz] = useState(businesses[0]?.id || '')
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('med')
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null)
  const [quickTaskText, setQuickTaskText] = useState('')
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [newProjectBiz, setNewProjectBiz] = useState(businesses[0]?.id || '')

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

  // ── Trajectory data for drawer charts ──
  const trajectoryData = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      day: `D${i + 1}`,
      actual: i < 7 ? Math.round(netIncome * (0.85 + Math.random() * 0.3)) : undefined,
      projected: Math.round(netIncome * (1 + i * 0.02)),
    })), [netIncome])

  // ── Schedule timeline ──
  const currentMinutes = hour * 60 + now.getMinutes()
  const scheduleStart = todaySchedule.length > 0 ? parseInt(todaySchedule[0].time.split(':')[0]) * 60 + parseInt(todaySchedule[0].time.split(':')[1] || '0') : 480
  const scheduleEnd = todaySchedule.length > 0
    ? Math.max(...todaySchedule.map(b => {
        const [h, m] = b.time.split(':').map(Number)
        return h * 60 + (m || 0) + b.duration
      }))
    : 1380

  // ── Alert action helpers ──
  const getAlertAction = (alert: { type: string; text: string }) => {
    switch (alert.type) {
      case 'risk': return { href: `/ai?q=${encodeURIComponent('Analyze concentration risk: ' + alert.text)}`, label: 'Ask AI' }
      case 'health': return { action: () => { addTask({ businessId: businesses[0]?.id || '', text: `Fix: ${alert.text}`, tag: 'health', priority: 'high' as Priority, done: false, xpValue: XP_VALUES.high }); toast.success('Task created!') }, label: 'Create Task' }
      case 'stale': return { href: '/tasks', label: 'View Tasks' }
      case 'commitment': return { href: '/commitments', label: 'View' }
      default: return null
    }
  }

  return (
    <PageTransition>
      <div className="pb-32">
        <div className="grid grid-cols-12 gap-4">

          {/* ── ROW 0: PREDICTIVE MORNING BRIEFING ── */}
          {isMorning && (
            <motion.div className="col-span-12" {...cardAnim(0)}>
              <div className="rounded-[20px] p-6 cursor-pointer" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.04), rgba(16,185,129,0.02))', border: '1px solid rgba(139,92,246,0.12)' }}>
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
          <motion.div className="gradient-border col-span-12 cursor-pointer" {...cardAnim(0.04)}>
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
                          toast.success(`Done! +${theOneThing.xpValue} XP`)
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
                    {!showAddTask ? (
                      <div className="flex flex-col items-center gap-3 mt-4">
                        <motion.button onClick={() => setShowAddTask(true)} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          className="px-6 py-3 rounded-[12px] text-[14px] font-semibold text-white" style={{ background: 'linear-gradient(135deg,var(--accent),#059669)' }}>
                          + Add your first task
                        </motion.button>
                        <Link href="/ai" className="text-[12px] text-[var(--text-dim)]">Or ask AI what to focus on →</Link>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3 max-w-md mx-auto">
                        <input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="What needs to get done?"
                          className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-[12px] px-4 py-3 text-[14px] text-white placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)]/50" autoFocus />
                        <div className="flex gap-2">
                          <select value={newTaskBiz} onChange={e => setNewTaskBiz(e.target.value)} className="flex-1 bg-[var(--surface2)] border border-[var(--border)] rounded-[10px] px-3 py-2 text-[12px] text-white">
                            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                          <div className="flex gap-1">
                            {(['crit', 'high', 'med', 'low'] as const).map(p => (
                              <button key={p} onClick={() => setNewTaskPriority(p)} className={`px-2 py-1 rounded-[8px] text-[10px] font-mono uppercase ${newTaskPriority === p ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--surface2)] text-[var(--text-dim)]'}`}>{p}</button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <motion.button onClick={() => { if (newTaskText.trim()) { addTask({ businessId: newTaskBiz, text: newTaskText.trim(), tag: '', priority: newTaskPriority, done: false, xpValue: XP_VALUES[newTaskPriority] }); setNewTaskText(''); setShowAddTask(false); toast.success('Task added!') } }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            className="flex-1 py-2.5 rounded-[10px] text-[13px] font-semibold text-white" style={{ background: 'var(--accent)' }}>Add Task</motion.button>
                          <button onClick={() => setShowAddTask(false)} className="px-4 py-2.5 rounded-[10px] text-[12px] text-[var(--text-dim)]">Cancel</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>

          {/* ── ROW 2: 4 METRIC CARDS ── */}

          {/* NET INCOME */}
          <Drawer.Root>
            <Drawer.Trigger asChild>
              <motion.div className="card rounded-[16px] p-5 col-span-6 md:col-span-3 cursor-pointer" {...cardAnim(0.08)} whileHover={{ y: -3, scale: 1.01 }}>
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
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[#0e1018] p-5 max-h-[85vh] overflow-y-auto">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
                <Drawer.Title className="text-lg font-semibold text-white mb-4">Net Income Breakdown</Drawer.Title>

                {/* Trajectory chart */}
                <div className="mb-5 rounded-[12px] p-4" style={{ background: 'var(--surface2)' }}>
                  <p className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-3">14-Day Income Trajectory</p>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={trajectoryData}>
                      <Line type="monotone" dataKey="actual" stroke="var(--accent)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="projected" stroke="var(--text-dim)" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Per-business revenue */}
                <div className="space-y-3">
                  <p className="text-[12px] font-semibold text-[var(--text-mid)]">Revenue by Business</p>
                  {businesses.map(b => (
                    <div key={b.id} className="flex items-center justify-between rounded-[10px] p-3" style={{ background: 'var(--surface2)' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />
                        <span className="text-[13px] text-[var(--text)]">{b.name}</span>
                      </div>
                      <input
                        type="number"
                        defaultValue={b.monthlyRevenue}
                        onBlur={(e) => { const val = parseFloat(e.target.value); if (!isNaN(val)) { updateBusiness(b.id, { monthlyRevenue: val }); toast.success(`${b.name} revenue updated`) } }}
                        className="w-28 text-right bg-transparent border border-[var(--border)] rounded-[8px] px-2 py-1 text-[13px] data text-[var(--accent)] outline-none focus:border-[var(--accent)]/50"
                      />
                    </div>
                  ))}
                </div>

                {/* Expenses + Net */}
                <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--text-mid)]">Total Revenue</span>
                    <span className="data text-[var(--accent)]">${Math.round(totalBizRevenue).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--text-mid)]">Total Expenses</span>
                    <span className="data text-[var(--rose)]">-${Math.round(totalExpenses).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[14px] font-semibold pt-2 border-t border-white/[0.06]">
                    <span className="text-white">Net Income</span>
                    <span className="data" style={{ color: netIncome >= 0 ? 'var(--accent)' : 'var(--rose)' }}>${Math.round(netIncome).toLocaleString()}</span>
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          {/* EXECUTION SCORE */}
          <Drawer.Root>
            <Drawer.Trigger asChild>
              <motion.div className="card rounded-[16px] p-5 col-span-6 md:col-span-3 cursor-pointer" {...cardAnim(0.12)} whileHover={{ y: -3, scale: 1.01 }}>
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
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[#0e1018] p-5 max-h-[85vh] overflow-y-auto">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
                <Drawer.Title className="text-lg font-semibold text-white mb-4">Execution Score Breakdown</Drawer.Title>

                {/* Large ring */}
                <div className="flex justify-center mb-6 relative" style={{ width: 80, height: 80, margin: '0 auto 24px' }}>
                  <ProgressRing value={executionScore} max={100} size={80} color={scoreZone.color} />
                  <span className="absolute inset-0 flex items-center justify-center data text-[18px] font-bold text-white">{executionScore}</span>
                </div>

                {/* Score breakdown */}
                <div className="space-y-3">
                  {[
                    { label: 'Task Commitment', detail: `${tasksDoneToday}/${tasksCommitted} tasks done`, value: tasksCommitted > 0 ? Math.round((tasksDoneToday / tasksCommitted) * 35) : 0, max: 35, color: 'var(--accent)' },
                    { label: 'Prayer', detail: `${prayersDone}/5 prayers`, value: prayersDone * 4, max: 20, color: 'var(--gold)' },
                    { label: 'Gym', detail: todayHealth.gym ? 'Completed' : 'Not yet', value: todayHealth.gym ? 10 : 0, max: 10, color: 'var(--accent)' },
                    { label: 'Meal Quality', detail: todayHealth.mealQuality || 'Not logged', value: todayHealth.mealQuality === 'good' ? 5 : 0, max: 5, color: 'var(--blue)' },
                    { label: 'Energy Drinks', detail: `${todayHealth.energyDrinks} today`, value: todayHealth.energyDrinks < 2 ? 5 : 0, max: 5, color: todayHealth.energyDrinks < 2 ? 'var(--accent)' : 'var(--rose)' },
                    { label: 'Sleep Tracked', detail: todayHealth.sleepTime ? 'Yes' : 'No', value: (todayHealth.sleepTime && todayHealth.wakeTime) ? 5 : 0, max: 5, color: 'var(--purple)' },
                    { label: 'Focus Sessions', detail: `${todayFocusSessions} sessions`, value: Math.min(20, todayFocusSessions * 5), max: 20, color: 'var(--cyan)' },
                  ].map((item, i) => (
                    <div key={i} className="rounded-[10px] p-3" style={{ background: 'var(--surface2)' }}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[12px] text-[var(--text)]">{item.label}</span>
                        <span className="data text-[12px]" style={{ color: item.color }}>{item.value}/{item.max}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: item.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(item.value / item.max) * 100}%` }}
                          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                        />
                      </div>
                      <p className="text-[10px] text-[var(--text-dim)] mt-1">{item.detail}</p>
                    </div>
                  ))}
                </div>

                {/* Quick actions */}
                <div className="mt-4 flex gap-2">
                  <motion.button onClick={() => { updateHealth({ gym: !todayHealth.gym }); toast.success(todayHealth.gym ? 'Gym unchecked' : 'Gym checked! +10') }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="flex-1 py-2.5 rounded-[10px] text-[12px] font-semibold" style={{ background: todayHealth.gym ? 'var(--accent)' : 'var(--surface2)', color: todayHealth.gym ? 'white' : 'var(--text-mid)' }}>
                    {todayHealth.gym ? '✓ Gym Done' : 'Log Gym'}
                  </motion.button>
                  <Link href="/focus" className="flex-1 py-2.5 rounded-[10px] text-[12px] font-semibold text-center" style={{ background: 'var(--surface2)', color: 'var(--text-mid)' }}>
                    Start Focus Session
                  </Link>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          {/* ENERGY */}
          <Drawer.Root>
            <Drawer.Trigger asChild>
              <motion.div className="card rounded-[16px] p-5 col-span-6 md:col-span-3 cursor-pointer" {...cardAnim(0.16)} whileHover={{ y: -3, scale: 1.01 }}>
                <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">ENERGY</span>
                <div className="data mt-2" style={{ fontSize: 32, fontWeight: 700, color: latestEnergy ? (latestEnergy.level >= 7 ? 'var(--accent)' : latestEnergy.level >= 4 ? 'var(--amber)' : 'var(--rose)') : 'var(--text-dim)' }}>
                  {latestEnergy ? `${latestEnergy.level}/10` : '—'}
                </div>
                <p className="text-[11px] text-[var(--text-mid)]">⚡ {latestEnergy ? latestEnergy.timeOfDay : 'Not logged'}</p>
              </motion.div>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[#0e1018] p-5 max-h-[85vh] overflow-y-auto">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
                <Drawer.Title className="text-lg font-semibold text-white mb-4">Log Your Energy</Drawer.Title>

                <div className="space-y-5">
                  {(['morning', 'afternoon', 'evening'] as const).map(slot => {
                    const existing = energyLogs.find(e => e.date === todayStr && e.timeOfDay === slot)
                    return (
                      <div key={slot} className="rounded-[12px] p-4" style={{ background: 'var(--surface2)' }}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[13px] font-semibold text-[var(--text)] capitalize">{slot}</span>
                          {existing && <span className="text-[10px] font-mono text-[var(--accent)]">Logged: {existing.level}/10</span>}
                        </div>
                        <div className="flex gap-1.5">
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
                            <motion.button
                              key={level}
                              onClick={() => {
                                addEnergyLog({ date: todayStr, timeOfDay: slot, level })
                                toast.success(`${slot} energy: ${level}/10`)
                              }}
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              className="flex-1 py-2 rounded-[6px] text-[11px] font-mono font-bold transition-colors"
                              style={{
                                background: existing?.level === level ? (level >= 7 ? 'var(--accent)' : level >= 4 ? 'var(--amber)' : 'var(--rose)') : 'var(--surface)',
                                color: existing?.level === level ? 'white' : 'var(--text-dim)',
                                border: `1px solid ${existing?.level === level ? 'transparent' : 'var(--border)'}`,
                              }}
                            >
                              {level}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Today's energy history */}
                {energyLogs.filter(e => e.date === todayStr).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <p className="text-[11px] font-mono text-[var(--text-dim)] mb-2">TODAY&apos;S LOG</p>
                    <div className="flex gap-3">
                      {energyLogs.filter(e => e.date === todayStr).map((e, i) => (
                        <div key={i} className="text-center">
                          <div className="text-[18px] data font-bold" style={{ color: e.level >= 7 ? 'var(--accent)' : e.level >= 4 ? 'var(--amber)' : 'var(--rose)' }}>{e.level}</div>
                          <p className="text-[9px] text-[var(--text-dim)] capitalize">{e.timeOfDay}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          {/* PRAYERS */}
          <Drawer.Root>
            <Drawer.Trigger asChild>
              <motion.div className="card rounded-[16px] p-5 col-span-6 md:col-span-3 cursor-pointer" {...cardAnim(0.2)} whileHover={{ y: -3, scale: 1.01 }}>
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
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[#0e1018] p-5 max-h-[85vh] overflow-y-auto">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
                <Drawer.Title className="text-lg font-semibold text-white mb-4">Today&apos;s Prayers</Drawer.Title>

                <div className="flex items-center gap-2 mb-5">
                  <span className="data text-[24px] font-bold" style={{ color: 'var(--gold)' }}>{prayersDone}/5</span>
                  <span className="text-[12px] text-[var(--text-dim)]">completed today</span>
                </div>

                <div className="space-y-2.5">
                  {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map(prayer => (
                    <motion.button
                      key={prayer}
                      onClick={() => {
                        togglePrayer(prayer)
                        toast.success(todayHealth.prayers[prayer] ? `${prayer} unmarked` : `${prayer} prayed! +4 execution`)
                      }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full flex items-center justify-between rounded-[12px] p-4 transition-colors"
                      style={{
                        background: todayHealth.prayers[prayer] ? 'rgba(255,215,0,0.08)' : 'var(--surface2)',
                        border: `1px solid ${todayHealth.prayers[prayer] ? 'rgba(255,215,0,0.25)' : 'var(--border)'}`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{
                          background: todayHealth.prayers[prayer] ? 'var(--gold)' : 'transparent',
                          border: `2px solid var(--gold)`,
                        }}>
                          {todayHealth.prayers[prayer] && <span className="text-[10px] text-black font-bold">✓</span>}
                        </div>
                        <span className="text-[14px] font-semibold text-white capitalize">{prayer}</span>
                      </div>
                      <span className="text-[12px] text-[var(--text-dim)] font-mono">{PRAYER_TIMES[prayer]}</span>
                    </motion.button>
                  ))}
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          {/* ── ROW 3: SCHEDULE TIMELINE ── */}
          <Drawer.Root>
            <Drawer.Trigger asChild>
              <motion.div className="card rounded-[16px] p-5 col-span-12 cursor-pointer" {...cardAnim(0.24)} whileHover={{ y: -3, scale: 1.005 }}>
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
                    <span className="text-[12px] text-[var(--accent)]">Plan your day →</span>
                  </div>
                )}
              </motion.div>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[#0e1018] p-5 max-h-[85vh] overflow-y-auto">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
                <Drawer.Title className="text-lg font-semibold text-white mb-4">Today&apos;s Schedule</Drawer.Title>

                {todaySchedule.length > 0 ? (
                  <div className="space-y-2">
                    {todaySchedule.map((block, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-[12px] p-3" style={{ background: 'var(--surface2)', borderLeft: `3px solid ${BLOCK_COLORS[block.type] || 'var(--blue)'}`, opacity: block.completed ? 0.5 : 1 }}>
                        <div className="flex-shrink-0 text-[12px] font-mono text-[var(--text-dim)] w-14">{block.time}</div>
                        <div className="flex-1">
                          <p className={`text-[13px] font-medium ${block.completed ? 'line-through text-[var(--text-dim)]' : 'text-white'}`}>{block.title}</p>
                          <p className="text-[10px] text-[var(--text-dim)]">{block.duration}min · {block.type}</p>
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: BLOCK_COLORS[block.type] || 'var(--blue)' }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[var(--text-dim)] text-[13px] mb-3">No schedule blocks yet</p>
                    <Link href="/schedule" className="text-[13px] font-semibold" style={{ color: 'var(--accent)' }}>
                      Plan your day →
                    </Link>
                  </div>
                )}

                <div className="mt-4">
                  <Link href="/schedule" className="block w-full py-2.5 rounded-[10px] text-center text-[12px] font-semibold" style={{ background: 'var(--surface2)', color: 'var(--text-mid)' }}>
                    Edit Schedule →
                  </Link>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          {/* ── ROW 4: ACTIVE PROJECTS + ALERTS ── */}
          <Drawer.Root>
            <Drawer.Trigger asChild>
              <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-5 cursor-pointer" {...cardAnim(0.28)} whileHover={{ y: -3, scale: 1.01 }}>
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
                    <span className="text-[12px] text-[var(--accent)]">Start your first project →</span>
                  </div>
                )}
              </motion.div>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[#0e1018] p-5 max-h-[85vh] overflow-y-auto">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
                <Drawer.Title className="text-lg font-semibold text-white mb-4">
                  {activeProjects.length > 0 ? 'Active Projects' : 'Start a Project'}
                </Drawer.Title>

                {/* Existing projects */}
                {activeProjects.length > 0 && (
                  <div className="space-y-3 mb-5">
                    {activeProjects.map(p => {
                      const biz = businesses.find(b => b.id === p.businessId)
                      return (
                        <div key={p.id} className="rounded-[12px] p-4" style={{ background: 'var(--surface2)' }}>
                          <div className="flex items-center gap-3 mb-2">
                            <div className="relative flex-shrink-0">
                              <ProgressRing value={p.progress} max={100} size={44} color="var(--accent)" />
                              <span className="absolute inset-0 flex items-center justify-center data text-[10px] font-bold text-[var(--text)]">{p.progress}%</span>
                            </div>
                            <div>
                              <p className="text-[14px] font-semibold text-white">{p.name}</p>
                              {biz && <p className="text-[11px] text-[var(--text-dim)]">{biz.name}</p>}
                            </div>
                          </div>
                          {p.description && <p className="text-[12px] text-[var(--text-mid)]">{p.description}</p>}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Add project form */}
                <div className="border-t border-white/[0.06] pt-4">
                  <p className="text-[12px] font-semibold text-[var(--text-mid)] mb-3">Add New Project</p>
                  <div className="space-y-3">
                    <input
                      value={newProjectName}
                      onChange={e => setNewProjectName(e.target.value)}
                      placeholder="Project name"
                      className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-[10px] px-4 py-2.5 text-[13px] text-white placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)]/50"
                    />
                    <input
                      value={newProjectDesc}
                      onChange={e => setNewProjectDesc(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-[10px] px-4 py-2.5 text-[13px] text-white placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)]/50"
                    />
                    <select value={newProjectBiz} onChange={e => setNewProjectBiz(e.target.value)} className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-[12px] text-white">
                      <option value="">No business</option>
                      {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <motion.button
                      onClick={() => {
                        if (newProjectName.trim()) {
                          addProject({ name: newProjectName.trim(), description: newProjectDesc.trim(), businessId: newProjectBiz || undefined, impact: 5, confidence: 5, ease: 5, status: 'in_progress', progress: 0 })
                          setNewProjectName('')
                          setNewProjectDesc('')
                          toast.success('Project created!')
                        }
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-2.5 rounded-[10px] text-[13px] font-semibold text-white"
                      style={{ background: 'var(--accent)' }}
                    >
                      Create Project
                    </motion.button>
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          {/* ALERTS & INSIGHTS */}
          <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-7 cursor-pointer" {...cardAnim(0.32)} whileHover={{ y: -3, scale: 1.005 }}>
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">ALERTS & INSIGHTS</span>
            {alerts.length > 0 ? (
              <div className="mt-3 space-y-2">
                {alerts.map((a, i) => {
                  const action = getAlertAction(a)
                  return (
                    <div key={i}>
                      <motion.div
                        onClick={() => setExpandedAlert(expandedAlert === i ? null : i)}
                        className="rounded-[10px] px-3 py-2.5 cursor-pointer flex items-center justify-between"
                        style={{ borderLeft: `3px solid ${a.color}`, background: 'var(--surface2)' }}
                        whileHover={{ scale: 1.005 }}
                      >
                        <p className="text-[12px] text-[var(--text-mid)] flex-1">{a.text}</p>
                        {action && (
                          'href' in action ? (
                            <Link href={action.href!} onClick={e => e.stopPropagation()} className="flex-shrink-0 ml-2 px-2.5 py-1 rounded-[6px] text-[10px] font-semibold" style={{ background: `color-mix(in srgb, ${a.color} 15%, transparent)`, color: a.color }}>
                              {action.label}
                            </Link>
                          ) : (
                            <button onClick={e => { e.stopPropagation(); action.action!() }} className="flex-shrink-0 ml-2 px-2.5 py-1 rounded-[6px] text-[10px] font-semibold" style={{ background: `color-mix(in srgb, ${a.color} 15%, transparent)`, color: a.color }}>
                              {action.label}
                            </button>
                          )
                        )}
                      </motion.div>
                      <AnimatePresence>
                        {expandedAlert === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 py-2 text-[11px] text-[var(--text-dim)]">
                              {a.type === 'risk' && 'High client concentration puts your revenue at risk. Consider diversifying by acquiring new clients or increasing revenue from smaller accounts.'}
                              {a.type === 'health' && 'This business has had no task completions in the past week. Assign tasks or reconsider its priority.'}
                              {a.type === 'stale' && 'Stale tasks drag down your execution score. Review and either complete, reschedule, or delete them.'}
                              {a.type === 'commitment' && 'Low commitment fulfillment erodes trust. Review pending commitments and prioritize follow-through.'}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-[12px] text-[var(--text-dim)] mt-3 italic">All clear. Keep it up.</p>
            )}
          </motion.div>

          {/* ── ROW 5: COST OF INACTION + DAYS + TASKS ── */}
          <Drawer.Root>
            <Drawer.Trigger asChild>
              <motion.div
                className="card-urgent rounded-[16px] p-5 col-span-12 md:col-span-5 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--rose) 5%, var(--surface)), var(--surface))' }}
                {...cardAnim(0.36)}
                whileHover={{ y: -3, scale: 1.01 }}
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
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[#0e1018] p-5 max-h-[85vh] overflow-y-auto">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
                <Drawer.Title className="text-lg font-semibold text-white mb-4">Cost of Inaction</Drawer.Title>

                <div className="data text-[32px] font-bold mb-1" style={{ color: 'var(--rose)' }}>${costOfInaction.total.toLocaleString()}</div>
                <p className="text-[12px] text-[var(--text-dim)] mb-5">estimated opportunity cost today</p>

                <div className="space-y-2.5">
                  {costOfInaction.items.map((item, i) => (
                    <div key={i} className="rounded-[12px] p-4 flex items-center justify-between" style={{ background: 'var(--surface2)' }}>
                      <div className="flex-1 mr-3">
                        <p className="text-[13px] text-white">{item.label}</p>
                        <p className="text-[10px] text-[var(--text-dim)] mt-0.5">Every hour delayed compounds the cost</p>
                      </div>
                      <span className="data text-[16px] font-bold text-[var(--rose)]">${item.amount}</span>
                    </div>
                  ))}
                </div>

                {costOfInaction.items.length > 0 && (
                  <div className="mt-5">
                    <Link href={`/ai?q=${encodeURIComponent('Help me prioritize these critical tasks to minimize cost of inaction')}`}
                      className="block w-full py-3 rounded-[10px] text-center text-[13px] font-semibold"
                      style={{ background: 'rgba(244,63,94,0.12)', color: 'var(--rose)' }}>
                      How to fix → Ask AI
                    </Link>
                  </div>
                )}
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-7 cursor-pointer" {...cardAnim(0.4)} whileHover={{ y: -3, scale: 1.005 }}>
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Days remaining */}
              <Drawer.Root>
                <Drawer.Trigger asChild>
                  <div className="cursor-pointer">
                    <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">DAYS TO TARGET</span>
                    <div className="data mt-2" style={{ fontSize: 36, fontWeight: 700, color: 'var(--cyan)' }}>
                      {daysRemaining > 0 ? daysRemaining : '—'}
                    </div>
                    <p className="text-[11px] text-[var(--text-mid)]">{targetDate ? `Target: ${new Date(targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No target set'}</p>
                    {incomeTarget > 0 && (
                      <p className="text-[10px] text-[var(--text-dim)] mt-1">${Math.round(incomeTarget).toLocaleString()}/mo goal</p>
                    )}
                  </div>
                </Drawer.Trigger>
                <Drawer.Portal>
                  <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
                  <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[#0e1018] p-5 max-h-[85vh] overflow-y-auto">
                    <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
                    <Drawer.Title className="text-lg font-semibold text-white mb-4">Days to Target</Drawer.Title>

                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="rounded-[12px] p-4" style={{ background: 'var(--surface2)' }}>
                        <p className="text-[10px] font-mono text-[var(--text-dim)]">DAYS LEFT</p>
                        <p className="data text-[28px] font-bold" style={{ color: 'var(--cyan)' }}>{daysRemaining > 0 ? daysRemaining : '—'}</p>
                      </div>
                      <div className="rounded-[12px] p-4" style={{ background: 'var(--surface2)' }}>
                        <p className="text-[10px] font-mono text-[var(--text-dim)]">TARGET INCOME</p>
                        <p className="data text-[28px] font-bold" style={{ color: 'var(--accent)' }}>${incomeTarget > 0 ? Math.round(incomeTarget).toLocaleString() : '—'}</p>
                      </div>
                    </div>

                    {/* Progress */}
                    {incomeTarget > 0 && (
                      <div className="mb-5">
                        <div className="flex justify-between text-[12px] mb-2">
                          <span className="text-[var(--text-mid)]">Current: ${Math.round(netIncome).toLocaleString()}</span>
                          <span className="text-[var(--text-dim)]">{Math.round((netIncome / incomeTarget) * 100)}% of goal</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: 'var(--cyan)' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min((netIncome / incomeTarget) * 100, 100)}%` }}
                            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                          />
                        </div>
                        <p className="text-[11px] text-[var(--text-dim)] mt-2">Gap: ${Math.round(Math.max(0, incomeTarget - netIncome)).toLocaleString()}/mo</p>
                      </div>
                    )}

                    {/* Actions to close the gap */}
                    <div className="border-t border-white/[0.06] pt-4">
                      <p className="text-[12px] font-semibold text-[var(--text-mid)] mb-3">Actions to Close the Gap</p>
                      <div className="space-y-2">
                        {[
                          { text: 'Land 1 new client this week', link: '/pipeline' },
                          { text: 'Upsell existing clients', link: '/clients' },
                          { text: 'Cut unnecessary expenses', link: '/finances' },
                          { text: 'Ask AI for revenue strategy', link: '/ai?q=Help me close the income gap' },
                        ].map((action, i) => (
                          <Link key={i} href={action.link} className="flex items-center justify-between rounded-[10px] p-3 transition-colors hover:bg-white/[0.03]" style={{ background: 'var(--surface2)' }}>
                            <span className="text-[12px] text-[var(--text-mid)]">{action.text}</span>
                            <span className="text-[var(--text-dim)]">→</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </Drawer.Content>
                </Drawer.Portal>
              </Drawer.Root>

              {/* Today's tasks */}
              <div className="overflow-y-auto max-h-[200px]">
                <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">TODAY&apos;S TASKS</span>

                {/* Quick add input */}
                <form className="mt-2 mb-2" onSubmit={e => {
                  e.preventDefault()
                  if (quickTaskText.trim()) {
                    addTask({ businessId: businesses[0]?.id || '', text: quickTaskText.trim(), tag: '', priority: 'med', done: false, xpValue: XP_VALUES.med })
                    setQuickTaskText('')
                    toast.success('Task added!')
                  }
                }}>
                  <input
                    value={quickTaskText}
                    onChange={e => setQuickTaskText(e.target.value)}
                    placeholder="Add task..."
                    className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-[8px] px-2.5 py-1.5 text-[11px] text-white placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)]/50"
                  />
                </form>

                <div className="space-y-1.5">
                  {sortedTasks.slice(0, 6).map(t => (
                    <div key={t.id} className="flex items-center gap-2 group">
                      <motion.button
                        onClick={() => { toggleTask(t.id); toast.success(`Done! +${t.xpValue} XP`) }}
                        className="flex-shrink-0 w-4 h-4 rounded-[4px] border transition-colors hover:bg-white/[0.05]"
                        style={{ borderColor: t.priority === 'crit' ? 'var(--rose)' : t.priority === 'high' ? 'var(--amber)' : 'var(--border)' }}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.8 }}
                      />
                      <span className="text-[11px] text-[var(--text-mid)] truncate group-hover:text-white transition-colors">{t.text}</span>
                    </div>
                  ))}
                  {sortedTasks.length === 0 && <p className="text-[11px] text-[var(--text-dim)] italic">No tasks</p>}
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── ROW 6: CLIENT TABLE + GMB GRID ── */}
          <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-6 cursor-pointer" {...cardAnim(0.44)} whileHover={{ y: -3, scale: 1.005 }}>
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

          <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-6 cursor-pointer" {...cardAnim(0.48)} whileHover={{ y: -3, scale: 1.005 }}>
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
