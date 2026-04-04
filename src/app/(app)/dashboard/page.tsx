'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Drawer } from 'vaul'
import { AreaChart, Area, LineChart, Line, ResponsiveContainer } from 'recharts'
import {
  useStore,
  getExecutionScore,
  getScoreZone,
  getClientNet,
  getAgencyTotals,
  getBusinessHealth,
  getTaskPriorityScore,
  computeMonthlyMoneySnapshot,
  type Priority,
} from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import CommandInput from '@/components/CommandInput'
import { XP_VALUES } from '@/lib/constants'
import { applyTaskDollarEstimateAfterCreate } from '@/lib/task-dollar-client'
import { prayerRecordTo12 } from '@/lib/prayer-times'
import { computeLifeExpectancy } from '@/lib/life-expectancy'
import EveningVoiceReview from '@/components/EveningVoiceReview'
/* ── Helpers ── */

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const cardAnim = (delay: number) => ({
  initial: { opacity: 0, y: 8 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const },
})

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
  personal: 'var(--info)', meal: 'var(--amber)',
}

/* ── Main ── */

export default function DashboardPage() {
  const router = useRouter()
  const {
    businesses, clients, tasks, todayHealth, gmbProfiles, projects,
    toggleTask, incomeTarget, targetDate, revenueEntries, expenseEntries,
    userName, todaySchedule, energyLogs, commitments, wakeUpTime,
    focusSessions, goals, identityStatements, logEvent,
    addTask, addProject, togglePrayer, updateHealth, addEnergyLog, updateBusiness,
    trackPrayers, healthHistory,
    dailyNetSnapshots, proactiveMessages, markProactiveRead,
    userLat, userLng, prayerCalcMethod, prayerAsrHanafi,
    userAge, exercise, smokingStatus, dietQuality, stressLevel, phoneScreenTime,
  } = useStore()

  const unreadProactive = useMemo(
    () => proactiveMessages.filter((m) => !m.read).length,
    [proactiveMessages]
  )

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
  const { totalIncome, recurringCosts: totalExpenses, net: netIncome } = computeMonthlyMoneySnapshot({
    businesses,
    clients,
    expenseEntries,
  })

  const tasksDoneToday = tasks.filter(t => t.done && t.completedAt?.startsWith(todayStr)).length
  const todayFocusSessions = focusSessions.filter(s => s.startedAt.startsWith(todayStr)).length
  const tasksCommitted = tasks.filter(t => t.createdAt.startsWith(todayStr) || (!t.done && t.priority !== 'low')).length
  const executionScore = getExecutionScore(
    todayHealth,
    tasksCommitted,
    tasksDoneToday,
    todayFocusSessions,
    trackPrayers
  )
  const scoreZone = getScoreZone(executionScore)

  const prayersDone = Object.values(todayHealth.prayers).filter(Boolean).length

  const prayerTimes12 = useMemo(() => {
    if (userLat == null || userLng == null) return null
    return prayerRecordTo12(userLat, userLng, new Date(), prayerCalcMethod, prayerAsrHanafi)
  }, [userLat, userLng, prayerCalcMethod, prayerAsrHanafi, todayHealth.date])

  const lifeModel = useMemo(
    () =>
      computeLifeExpectancy(
        {
          age: userAge > 0 ? userAge : 35,
          exercise: exercise || '',
          smokingStatus: smokingStatus || '',
          dietQuality: dietQuality || '',
          stressLevel: stressLevel ?? 5,
          phoneScreenTime: phoneScreenTime ?? 0,
        },
        Date.now()
      ),
    [userAge, exercise, smokingStatus, dietQuality, stressLevel, phoneScreenTime]
  )

  const [nowTick, setNowTick] = useState(Date.now())
  useEffect(() => {
    const t = window.setInterval(() => setNowTick(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const lifeRemainingSec = Math.max(0, (lifeModel.expectedEnd.getTime() - nowTick) / 1000)
  const lifeY = Math.floor(lifeRemainingSec / (365.25 * 24 * 3600))
  let lifeR = lifeRemainingSec - lifeY * 365.25 * 24 * 3600
  const lifeD = Math.floor(lifeR / (24 * 3600))
  lifeR -= lifeD * 24 * 3600
  const lifeH = Math.floor(lifeR / 3600)
  lifeR -= lifeH * 3600
  const lifeM = Math.floor(lifeR / 60)
  const lifeS = Math.floor(lifeR - lifeM * 60)

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

  // ── Alerts (proactive inbox first, then computed) ──
  const alerts = useMemo(() => {
    const list: { text: string; color: string; type: string; id?: string }[] = []
    proactiveMessages
      .filter((m) => !m.read)
      .slice(0, 5)
      .forEach((m) => {
        list.push({
          text: m.body,
          color:
            m.priority === 'critical'
              ? 'var(--negative)'
              : m.priority === 'important'
                ? 'var(--warning)'
                : 'var(--accent)',
          type: 'proactive',
          id: m.id,
        })
      })
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
    return list.slice(0, 8)
  }, [clients, businesses, tasks, revenueEntries, commitments, proactiveMessages])

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

  const yesterdayScore = useMemo(() => {
    const prev = healthHistory.filter((h) => h.date < todayStr).sort((a, b) => b.date.localeCompare(a.date))[0]
    return prev?.dailyScore ?? null
  }, [healthHistory, todayStr])

  /** PRD §9.21 — predictions from logs, not hardcoded copy. */
  const morningBrief = useMemo(() => {
    const hist = [...healthHistory]
      .filter((h) => h.date)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 21)

    let prayerLine = ''
    if (hist.length >= 3) {
      let fullDays = 0
      let fullTaskSum = 0
      let partialDays = 0
      let partialTaskSum = 0
      for (const h of hist) {
        const pc = Object.values(h.prayers).filter(Boolean).length
        const done = tasks.filter((t) => t.done && t.completedAt?.startsWith(h.date)).length
        if (pc >= 5) {
          fullDays++
          fullTaskSum += done
        } else if (pc > 0) {
          partialDays++
          partialTaskSum += done
        }
      }
      const avgFull = fullDays ? fullTaskSum / fullDays : 0
      const avgPartial = partialDays ? partialTaskSum / partialDays : 0
      if (fullDays >= 2 && partialDays >= 1) {
        prayerLine = `Prayer ↔ tasks: on full-prayer days you average ${avgFull.toFixed(1)} tasks completed vs ${avgPartial.toFixed(1)} on partial days (last ${hist.length} logged days).`
      } else if (trackPrayers) {
        prayerLine = 'Keep logging prayers and task completions to sharpen prayer–productivity correlation.'
      } else {
        prayerLine = 'Enable prayer tracking in Settings to correlate consistency with daily output.'
      }
    } else {
      prayerLine = 'Log a few days of health + tasks to unlock prayer–productivity correlation.'
    }

    const cutoffMs = Date.now() - 14 * 86400000
    const elogs = energyLogs.filter((e) => new Date(e.date).getTime() >= cutoffMs)
    const by = { morning: [] as number[], afternoon: [] as number[], evening: [] as number[] }
    for (const e of elogs) {
      by[e.timeOfDay].push(e.level)
    }
    const avgArr = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
    const energyLine =
      elogs.length >= 3
        ? `Energy pattern (14d, 1–10): morning ${avgArr(by.morning).toFixed(1)}, afternoon ${avgArr(by.afternoon).toFixed(1)}, evening ${avgArr(by.evening).toFixed(1)} (${elogs.length} logs).`
        : 'Log energy morning / afternoon / evening to surface your curve.'

    const withScreen = hist.filter((h) => typeof h.screenTimeHours === 'number')
    const low = withScreen.filter((h) => h.screenTimeHours <= 4)
    const high = withScreen.filter((h) => h.screenTimeHours > 8)
    const avgScore = (days: typeof withScreen) =>
      days.length ? days.reduce((s, h) => s + h.dailyScore, 0) / days.length : 0
    let screenLine = ''
    if (low.length >= 2 && high.length >= 2) {
      screenLine = `Screen time ↔ score: days ≤4h avg daily score ${avgScore(low).toFixed(0)} vs >8h ${avgScore(high).toFixed(0)}.`
    } else if (withScreen.length >= 3) {
      screenLine = `Screen time logged on ${withScreen.length} days — keep logging to split low vs high usage.`
    } else {
      screenLine = 'Log screen hours on the Health page to correlate with daily score.'
    }

    const beatTips: string[] = []
    if (trackPrayers && prayersDone < 5)
      beatTips.push(`Finish remaining prayers (${5 - prayersDone}) to align with your stronger days.`)
    if (latestEnergy && latestEnergy.level < 5)
      beatTips.push('Energy is below recent levels — add a short reset or walk.')
    if (executionScore < 55) beatTips.push('Execution score is soft — complete one high-ROI task before noon.')
    while (beatTips.length < 3) {
      const fallbacks = [
        'Complete your one thing before diving into inbox.',
        'Block 25 minutes for deep work before mid-afternoon.',
        'Confirm or trim tonight’s commitments.',
      ]
      beatTips.push(fallbacks[beatTips.length] ?? 'Review priorities once more today.')
      if (beatTips.length > 5) break
    }

    return {
      prayerLine,
      energyLine,
      screenLine,
      beatTips: beatTips.slice(0, 3),
    }
  }, [
    healthHistory,
    tasks,
    energyLogs,
    trackPrayers,
    prayersDone,
    latestEnergy,
    executionScore,
  ])

  // ── Sparkline: last 7 daily net snapshots (PRD GAP 18) ──
  const incomeSparkData = useMemo(() => {
    const sorted = [...dailyNetSnapshots].sort((a, b) => a.date.localeCompare(b.date))
    const last = sorted.slice(-7).map((s) => ({ v: s.net }))
    if (last.length >= 7) return last
    const pad = netIncome
    const out = [...last]
    while (out.length < 7) out.unshift({ v: out[0]?.v ?? pad })
    return out.slice(-7)
  }, [dailyNetSnapshots, netIncome])

  // ── Trajectory data for drawer charts (no random variation — uses current net) ──
  const trajectoryData = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        day: `D${i + 1}`,
        actual: i < 7 ? netIncome : undefined,
        projected: netIncome,
      })),
    [netIncome]
  )

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
  const getAlertAction = (alert: { type: string; text: string; id?: string }) => {
    switch (alert.type) {
      case 'proactive':
        return {
          action: () => {
            if (alert.id) markProactiveRead(alert.id)
            router.push('/ai-insights')
          },
          label: 'Open inbox',
        }
      case 'risk': return { href: `/ai?q=${encodeURIComponent('Analyze concentration risk: ' + alert.text)}`, label: 'Ask AI' }
      case 'health': return { action: () => { const tid = addTask({ businessId: businesses[0]?.id || '', text: `Fix: ${alert.text}`, tag: 'health', priority: 'high' as Priority, done: false, xpValue: XP_VALUES.high }); void applyTaskDollarEstimateAfterCreate(tid, `Fix: ${alert.text}`); toast.success('Task created!') }, label: 'Create Task' }
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
              <div
                className="cursor-pointer rounded-2xl border border-[var(--border)] p-6"
                style={{ background: 'color-mix(in srgb, var(--accent) 8%, var(--bg-elevated))' }}
              >
                <p className="text-[13px] font-semibold text-[var(--text-secondary)]">Morning briefing (from your logs)</p>
                <div className="mt-3 space-y-2">
                  <p className="text-[15px] text-[var(--text-secondary)]">{morningBrief.prayerLine}</p>
                  <p className="text-[15px] text-[var(--text-secondary)]">{morningBrief.energyLine}</p>
                  <p className="text-[15px] text-[var(--text-secondary)]">{morningBrief.screenLine}</p>
                </div>
                <div className="mt-4">
                  <p className="text-[13px] font-semibold text-[var(--text-secondary)]">To beat yesterday&apos;s trajectory</p>
                  <ul className="mt-1.5 list-decimal space-y-1 pl-5">
                    {morningBrief.beatTips.map((tip, i) => (
                      <li key={i} className="text-[17px] text-[var(--text-primary)]">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[13px] text-[var(--text-secondary)]">
                    {yesterdayScore != null ? (
                      <>Yesterday you scored {yesterdayScore}. Beat it today.</>
                    ) : (
                      <>Log today&apos;s activity to start comparing day over day.</>
                    )}
                  </p>
                  <motion.button
                    type="button"
                    onClick={() => {
                      logEvent('challenge_accepted', { date: todayStr })
                      toast.success('Challenge accepted! Let\'s go.')
                    }}
                    className="btn-primary shrink-0 !px-5 !py-3 !text-[17px]"
                    whileTap={{ scale: 0.97 }}
                  >
                    Challenge accepted →
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ROW 1: THE ONE THING ── */}
          <motion.div
            className="col-span-12 cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6"
            {...cardAnim(0.04)}
          >
            <div className="text-center">
              <p className="text-[13px] font-semibold text-[var(--text-secondary)]">The one thing</p>
                {theOneThing ? (
                  <>
                    <p className="mt-3 text-[22px] font-bold text-[var(--text-primary)]">{theOneThing.text}</p>
                    {theOneThing.score && (
                      <span className="data mt-2 inline-block rounded-full bg-[var(--accent-bg)] px-2 py-0.5 text-[11px] text-[var(--accent)]">
                        Score: {theOneThing.score}/100
                      </span>
                    )}
                    {(theOneThingProject || theOneThingGoal) && (
                      <p className="text-[11px] text-[var(--text-dim)] mt-2">
                        {theOneThingProject && <>📋 {theOneThingProject.name}</>}
                        {theOneThingGoal && <> → 🎯 {theOneThingGoal.title}</>}
                      </p>
                    )}
                    <div className="mt-4 flex items-center justify-center gap-4">
                      <motion.button
                        type="button"
                        onClick={() => {
                          toggleTask(theOneThing.id)
                          toast.success(`Done! +${theOneThing.xpValue} XP`)
                        }}
                        className="rounded-[14px] bg-[#0A84FF] px-5 py-2.5 text-[17px] font-semibold text-white hover:bg-[var(--accent-hover)]"
                        whileTap={{ scale: 0.97 }}
                      >
                        ✓ Done
                      </motion.button>
                      <Link href="/tasks" className="text-[17px] text-[#0A84FF] hover:underline">
                        Skip →
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[20px] font-semibold text-white mt-3">Your plate is clear.</p>
                    {!showAddTask ? (
                      <div className="mt-4 flex flex-col items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddTask(true)}
                          className="btn-text text-[17px] font-normal"
                        >
                          + Add your first task
                        </button>
                        <Link href="/ai" className="text-[17px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                          Or ask AI what to focus on →
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3 max-w-md mx-auto">
                        <input value={newTaskText} onChange={e => setNewTaskText(e.target.value)} placeholder="What needs to get done?"
                          className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-[14px] text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-0" autoFocus />
                        <div className="flex gap-2">
                          <select value={newTaskBiz} onChange={e => setNewTaskBiz(e.target.value)} className="flex-1 bg-[var(--surface2)] border border-[var(--border)] rounded-[10px] px-3 py-2 text-[12px] text-white">
                            {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                          </select>
                          <div className="flex gap-1">
                            {(['crit', 'high', 'med', 'low'] as const).map(p => (
                              <button key={p} onClick={() => setNewTaskPriority(p)} className={`min-h-[36px] px-2.5 py-1.5 rounded-[8px] text-[13px] font-semibold capitalize ${newTaskPriority === p ? 'bg-[var(--accent-bg)] text-[var(--accent)]' : 'bg-[var(--surface2)] text-[var(--text-dim)]'}`}>{p}</button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <motion.button onClick={() => { if (newTaskText.trim()) { const tid = addTask({ businessId: newTaskBiz, text: newTaskText.trim(), tag: '', priority: newTaskPriority, done: false, xpValue: XP_VALUES[newTaskPriority] }); void applyTaskDollarEstimateAfterCreate(tid, newTaskText.trim()); setNewTaskText(''); setShowAddTask(false); toast.success('Task added!') } }} whileHover={{ filter: 'brightness(1.08)' }} whileTap={{ scale: 0.97 }}
                            className="btn-primary flex-1 min-h-[44px]">Add Task</motion.button>
                          <button onClick={() => setShowAddTask(false)} className="px-4 py-2.5 rounded-[10px] text-[12px] text-[var(--text-dim)]">Cancel</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {hour >= 20 && (
                  <div
                    className="mt-6 border-t border-[var(--border)] pt-5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)]">
                      Evening — reflect
                    </p>
                    <EveningVoiceReview />
                  </div>
                )}
              </div>
          </motion.div>

          {/* ── ROW 2: 4 METRIC CARDS ── */}

          {/* NET INCOME */}
          <Drawer.Root>
            <Drawer.Trigger asChild>
              <motion.div
                className="col-span-6 md:col-span-3 cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
                {...cardAnim(0.08)}
                whileHover={{ filter: 'brightness(1.06)' }}
              >
                <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Net income</span>
                <div className="data mt-2" style={{ fontSize: 32, fontWeight: 700, color: netIncome >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
                  ${netIncome > 0 ? Math.round(netIncome).toLocaleString() : '0'}
                </div>
                <p className="text-[11px] text-[var(--text-mid)]">{new Date().toLocaleDateString('en-US', { month: 'short' })} take-home</p>
                <div className="mt-2">
                  {netIncome > 0 ? (
                    <ResponsiveContainer width={100} height={32}>
                      <AreaChart data={incomeSparkData}>
                        <defs><linearGradient id="sparkIncome" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--positive)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--positive)" stopOpacity={0} /></linearGradient></defs>
                        <Area type="monotone" dataKey="v" stroke="var(--positive)" strokeWidth={1.5} fill="url(#sparkIncome)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <span className="text-[10px] text-[var(--text-dim)] italic">Start tracking</span>}
                </div>
              </motion.div>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[var(--bg-elevated)] p-5 max-h-[85vh] overflow-y-auto">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
                <Drawer.Title className="text-lg font-semibold text-white mb-4">Net Income Breakdown</Drawer.Title>

                {/* Trajectory chart */}
                <div className="mb-5 rounded-[12px] p-4" style={{ background: 'var(--surface2)' }}>
                  <p className="mb-3 text-[13px] font-semibold text-[var(--text-secondary)]">14-day income trajectory</p>
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
                        className="w-28 text-right bg-transparent border border-[var(--border)] rounded-[8px] px-2 py-1 text-[13px] data outline-none focus:border-[var(--accent)]"
                        style={{ color: 'var(--positive)' }}
                      />
                    </div>
                  ))}
                </div>

                {/* Expenses + Net */}
                <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--text-mid)]">Total Revenue</span>
                    <span className="data" style={{ color: 'var(--positive)' }}>${Math.round(totalIncome).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span className="text-[var(--text-mid)]">Total Expenses</span>
                    <span className="data text-[var(--rose)]">-${Math.round(totalExpenses).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[14px] font-semibold pt-2 border-t border-white/[0.06]">
                    <span className="text-white">Net Income</span>
                    <span className="data" style={{ color: netIncome >= 0 ? 'var(--positive)' : 'var(--negative)' }}>${Math.round(netIncome).toLocaleString()}</span>
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          {/* EXECUTION SCORE */}
          <Drawer.Root>
            <Drawer.Trigger asChild>
              <motion.div
                className="col-span-6 md:col-span-3 cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
                {...cardAnim(0.12)}
                whileHover={{ filter: 'brightness(1.06)' }}
              >
                <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Execution</span>
                <div className="data mt-2" style={{ fontSize: 32, fontWeight: 700, color: scoreZone.color }}>
                  {executionScore}<span className="text-[14px] text-[var(--text-dim)]">/100</span>
                </div>
                <p className="text-[11px] text-[var(--text-mid)]">{scoreZone.emoji} {scoreZone.label}</p>
                <div className="mt-2 flex justify-center relative">
                  <ProgressRing value={executionScore} max={100} size={40} color="var(--accent)" />
                  <span className="absolute inset-0 flex items-center justify-center data text-[10px] font-bold text-[var(--text)]">{executionScore}</span>
                </div>
              </motion.div>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[var(--bg-elevated)] p-5 max-h-[85vh] overflow-y-auto">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
                <Drawer.Title className="text-lg font-semibold text-white mb-4">Execution Score Breakdown</Drawer.Title>

                {/* Large ring */}
                <div className="flex justify-center mb-6 relative" style={{ width: 80, height: 80, margin: '0 auto 24px' }}>
                  <ProgressRing value={executionScore} max={100} size={80} color="var(--accent)" />
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
                    { label: 'Sleep Tracked', detail: todayHealth.sleepTime ? 'Yes' : 'No', value: (todayHealth.sleepTime && todayHealth.wakeTime) ? 5 : 0, max: 5, color: 'var(--accent)' },
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
              <motion.div
                className="col-span-6 md:col-span-3 cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
                {...cardAnim(0.16)}
                whileHover={{ filter: 'brightness(1.06)' }}
              >
                <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Energy</span>
                <div className="data mt-2" style={{ fontSize: 32, fontWeight: 700, color: latestEnergy ? (latestEnergy.level >= 7 ? 'var(--accent)' : latestEnergy.level >= 4 ? 'var(--amber)' : 'var(--rose)') : 'var(--text-dim)' }}>
                  {latestEnergy ? `${latestEnergy.level}/10` : '—'}
                </div>
                <p className="text-[11px] text-[var(--text-mid)]">⚡ {latestEnergy ? latestEnergy.timeOfDay : 'Not logged'}</p>
              </motion.div>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[var(--bg-elevated)] p-5 max-h-[85vh] overflow-y-auto">
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
                    <p className="mb-2 text-[13px] font-semibold text-[var(--text-secondary)]">Today&apos;s log</p>
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
              <motion.div
                className="col-span-6 md:col-span-3 cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
                {...cardAnim(0.2)}
                whileHover={{ filter: 'brightness(1.06)' }}
              >
                <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Prayers</span>
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
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[var(--bg-elevated)] p-5 max-h-[85vh] overflow-y-auto">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
                <Drawer.Title className="text-lg font-semibold text-white mb-4">Today&apos;s Prayers</Drawer.Title>
                {!prayerTimes12 && (
                  <p className="mb-4 text-[13px] text-[var(--text-dim)]">
                    Set your location in Settings (or finish onboarding) to compute times with ISNA / adhan.js. Times shown
                    as — until coordinates are saved.
                  </p>
                )}

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
                      <span className="text-[12px] text-[var(--text-dim)] font-mono">
                        {prayerTimes12?.[prayer] ?? '—'}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          {/* Life expectancy (PRD §9.14) — full-width so the metric row stays 4×3 cols */}
          <Drawer.Root>
            <Drawer.Trigger asChild>
              <motion.div
                className="col-span-12 flex cursor-pointer flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:flex-row sm:items-center sm:justify-between"
                {...cardAnim(0.22)}
                whileHover={{ filter: 'brightness(1.06)' }}
              >
                <div>
                  <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Life horizon</span>
                  <p className="text-[10px] text-[var(--text-mid)]">Est. remaining — tap for adjustment breakdown</p>
                </div>
                <div className="flex flex-wrap items-baseline gap-4 sm:justify-end">
                  <div className="data text-[22px] font-bold leading-tight text-[var(--text-primary)]">
                    {lifeY}y {lifeD}d {lifeH}h {lifeM}m {lifeS}s
                  </div>
                  <p className="font-mono text-[12px] text-[var(--text-dim)]">
                    {Math.floor(lifeRemainingSec).toLocaleString()}s total
                  </p>
                </div>
              </motion.div>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-[20px] border-t border-white/[0.06] bg-[var(--bg-elevated)] p-5">
                <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
                <Drawer.Title className="text-lg font-semibold text-white">Life expectancy model</Drawer.Title>
                <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
                  Illustrative blend of actuarial baseline and your logged health behaviors — not a medical prognosis.
                </p>
                <div className="mt-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface2)] p-4">
                  <p className="text-[12px] text-[var(--text-dim)]">Baseline years remaining (age-adjusted)</p>
                  <p className="data text-xl font-bold text-[var(--text)]">
                    {lifeModel.baselineYearsRemaining.toFixed(1)} yrs
                  </p>
                </div>
                <p className="mt-4 text-[13px] font-semibold text-[var(--text-secondary)]">Adjustments</p>
                <ul className="mt-2 space-y-2">
                  {lifeModel.adjustments.length === 0 ? (
                    <li className="text-[14px] text-[var(--text-dim)]">No behavioral adjustments applied yet.</li>
                  ) : (
                    lifeModel.adjustments.map((a, i) => (
                      <li key={i} className="flex justify-between text-[14px]">
                        <span className="text-[var(--text)]">{a.label}</span>
                        <span className={a.years >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}>
                          {a.years >= 0 ? '+' : ''}
                          {a.years.toFixed(1)} yrs
                        </span>
                      </li>
                    ))
                  )}
                </ul>
                <p className="mt-4 text-[14px] text-[var(--text-secondary)]">
                  Adjusted expectation:{' '}
                  <span className="data font-semibold text-[var(--accent)]">
                    {lifeModel.adjustedYearsRemaining.toFixed(1)} years
                  </span>{' '}
                  remaining (~{lifeModel.expectedEnd.toLocaleDateString()}).
                </p>
                <p className="mt-3 text-[12px] text-[var(--text-dim)]">
                  Motivational: every hour you move execution forward is an hour reclaimed from drift — use the scorecard,
                  not this number, for business decisions.
                </p>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          {/* ── ROW 3: SCHEDULE TIMELINE ── */}
          <Drawer.Root>
            <Drawer.Trigger asChild>
              <motion.div className="card rounded-[16px] p-5 col-span-12 cursor-pointer" {...cardAnim(0.24)} whileHover={{ filter: 'brightness(1.06)' }}>
                <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Today&apos;s schedule</span>
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
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[var(--bg-elevated)] p-5 max-h-[85vh] overflow-y-auto">
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
              <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-5 cursor-pointer" {...cardAnim(0.28)} whileHover={{ filter: 'brightness(1.06)' }}>
                <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Active projects</span>
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
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[var(--bg-elevated)] p-5 max-h-[85vh] overflow-y-auto">
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

          {/* ALERTS & INSIGHTS — PRD §8.3 inbox */}
          <motion.div
            className="card rounded-[16px] p-5 col-span-12 md:col-span-7 cursor-pointer"
            {...cardAnim(0.32)}
            whileHover={{ filter: 'brightness(1.06)' }}
            role="button"
            tabIndex={0}
            onClick={() => router.push('/ai-insights')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                router.push('/ai-insights')
              }
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-[var(--text-secondary)]">AI Insights</span>
              {unreadProactive > 0 && (
                <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-bold text-white">
                  {unreadProactive > 99 ? '99+' : unreadProactive}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] text-[var(--text-dim)]">Tap for full proactive inbox</p>
            {alerts.length > 0 ? (
              <div className="mt-3 space-y-2">
                {alerts.map((a, i) => {
                  const action = getAlertAction(a)
                  return (
                    <div key={a.id ?? `alert-${i}`}>
                      <motion.div
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedAlert(expandedAlert === i ? null : i)
                        }}
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
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="px-3 py-2 text-[11px] text-[var(--text-dim)]">
                              {a.type === 'proactive' &&
                                'Template insight from your data. Add an Anthropic API key in Settings for fully personalized recommendations.'}
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
                whileHover={{ filter: 'brightness(1.05)' }}
              >
                <span className="text-[13px] font-semibold text-[var(--negative)]">Cost of inaction</span>
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
              <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[var(--bg-elevated)] p-5 max-h-[85vh] overflow-y-auto">
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
                    <Link
                      href={`/ai?q=${encodeURIComponent('Help me prioritize these critical tasks to minimize cost of inaction')}`}
                      className="badge badge-ai flex w-full justify-center py-3 text-[13px] font-semibold"
                    >
                      How to fix → Ask AI
                    </Link>
                  </div>
                )}
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-7 cursor-pointer" {...cardAnim(0.4)} whileHover={{ filter: 'brightness(1.05)' }}>
            <div className="grid grid-cols-2 gap-4 h-full">
              {/* Days remaining */}
              <Drawer.Root>
                <Drawer.Trigger asChild>
                  <div className="cursor-pointer">
                    <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Days to target</span>
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
                  <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[20px] border-t border-white/[0.06] bg-[var(--bg-elevated)] p-5 max-h-[85vh] overflow-y-auto">
                    <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
                    <Drawer.Title className="text-lg font-semibold text-white mb-4">Days to Target</Drawer.Title>

                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="rounded-[12px] p-4" style={{ background: 'var(--surface2)' }}>
                        <p className="text-[12px] font-medium text-[var(--text-secondary)]">Days left</p>
                        <p className="data text-[28px] font-bold" style={{ color: 'var(--cyan)' }}>{daysRemaining > 0 ? daysRemaining : '—'}</p>
                      </div>
                      <div className="rounded-[12px] p-4" style={{ background: 'var(--surface2)' }}>
                        <p className="text-[12px] font-medium text-[var(--text-secondary)]">Target income</p>
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
                <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Today&apos;s tasks</span>

                {/* Quick add input */}
                <form className="mt-2 mb-2" onSubmit={e => {
                  e.preventDefault()
                  if (quickTaskText.trim()) {
                    const q = quickTaskText.trim()
                    const tid = addTask({ businessId: businesses[0]?.id || '', text: q, tag: '', priority: 'med', done: false, xpValue: XP_VALUES.med })
                    void applyTaskDollarEstimateAfterCreate(tid, q)
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
          <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-6 cursor-pointer" {...cardAnim(0.44)} whileHover={{ filter: 'brightness(1.05)' }}>
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Clients</span>
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

          <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-6 cursor-pointer" {...cardAnim(0.48)} whileHover={{ filter: 'brightness(1.05)' }}>
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">GMB profiles</span>
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
