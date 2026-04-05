'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { computeCostOfInactionGap17 } from '@/lib/cost-of-inaction-gap17'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { DndContext, type DragEndEvent, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
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
  isArchived,
} from '@/stores/store'
import { Drawer } from 'vaul'
import { DRAWER_CONTENT_CLASS, DrawerDragHandle } from '@/components/ui/drawer-primitives'
import PageTransition from '@/components/PageTransition'
import CommandInput from '@/components/CommandInput'
import { XP_VALUES } from '@/lib/constants'
import { applyTaskDollarEstimateAfterCreate } from '@/lib/task-dollar-client'
import { computeLifeExpectancy } from '@/lib/life-expectancy'
import SortableDashboardTile from '@/components/dashboard/SortableDashboardTile'
import TileLibrarySheet from '@/components/dashboard/TileLibrarySheet'
import { useLongPress } from '@/hooks/useLongPress'
import { renderDashboardTile, type DashboardTileRenderCtx } from '@/app/(app)/dashboard/dashboard-tile-render'
import TaskSkipDrawer from '@/components/TaskSkipDrawer'
import { isProactiveMessageVisible } from '@/lib/proactive-visibility'
import { computeIdealSelfBenchmark } from '@/lib/ideal-self-benchmark'
/* ── Helpers ── */

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
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
    trackPrayers,
    healthHistory,
    dailyNetSnapshots, proactiveMessages, markProactiveRead,
    userLat, userLng, prayerCalcMethod, prayerAsrHanafi,
    userAge, exercise, smokingStatus, dietQuality, stressLevel, phoneScreenTime,
    lastSessionDaysSinceOpen, previousLastOpenedAt,
    workDayStart, workDayEnd,
    xp, level,
    streaks,
    dashboardLayout,
    reorderDashboardTiles,
    updateDashboardTileSpan,
    setDashboardTileVisible,
    setDashboardLayout,
    showDashboardTile,
    customHabits,
    addIdea,
    balanceSheetAssets,
    balanceSheetDebts,
  } = useStore()

  const activeBusinesses = useMemo(
    () => businesses.filter((b) => !isArchived(b)),
    [businesses]
  )

  const visibleTasks = useMemo(() => tasks.filter((t) => !isArchived(t)), [tasks])

  const unreadProactive = useMemo(
    () => proactiveMessages.filter((m) => !m.read && isProactiveMessageVisible(m)).length,
    [proactiveMessages]
  )

  const todayStr = new Date().toISOString().split('T')[0]

  const habitDoneToday = useMemo(() => {
    let n = 0
    if (todayHealth.gym) n++
    if (todayHealth.mealQuality === 'good') n++
    if (todayHealth.sleepTime && todayHealth.wakeTime) n++
    if (todayHealth.screenTimeHours > 0) n++
    if ((todayHealth.waterGlasses ?? 0) >= 8) n++
    for (const c of customHabits.filter((x) => !x.private)) {
      const v = todayHealth.customHabitLog?.[c.id]
      if (c.loggingType === 'boolean') {
        if (v === true) n++
      } else if (v != null && v !== '') {
        n++
      }
    }
    return n
  }, [todayHealth, customHabits])

  const habitTotalToday = useMemo(() => 5 + customHabits.filter((c) => !c.private).length, [customHabits])

  const [coiTick, setCoiTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setCoiTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [])
  const now = useMemo(() => new Date(), [coiTick])
  const hour = now.getHours()
  /** PRD §9.21 — morning briefing tile before noon. */
  const isMorningBriefWindow = hour < 12

  /* ── Interactive state ── */
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskBiz, setNewTaskBiz] = useState(() => businesses.filter((b) => !isArchived(b))[0]?.id || '')
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('med')
  const [expandedAlert, setExpandedAlert] = useState<number | null>(null)
  const [habitDrawerOpen, setHabitDrawerOpen] = useState(false)
  const [skipTaskId, setSkipTaskId] = useState<string | null>(null)
  const openSkipForTask = useCallback((id: string) => setSkipTaskId(id), [])
  const [ideaFabOpen, setIdeaFabOpen] = useState(false)
  const [ideaText, setIdeaText] = useState('')

  useEffect(() => {
    const openTask = () => setShowAddTask(true)
    const openIdea = () => setIdeaFabOpen(true)
    const openHabits = () => setHabitDrawerOpen(true)
    window.addEventListener('artos-open-task-drawer', openTask)
    window.addEventListener('artos-open-idea', openIdea)
    window.addEventListener('artos-open-habit-log', openHabits)
    return () => {
      window.removeEventListener('artos-open-task-drawer', openTask)
      window.removeEventListener('artos-open-idea', openIdea)
      window.removeEventListener('artos-open-habit-log', openHabits)
    }
  }, [])
  const [quickTaskText, setQuickTaskText] = useState('')
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [newProjectBiz, setNewProjectBiz] = useState(() => businesses.filter((b) => !isArchived(b))[0]?.id || '')
  const [editMode, setEditMode] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)

  // ── Core metrics ──
  const agencyTotals = getAgencyTotals(clients)
  const { totalIncome, recurringCosts: totalExpenses, net: netIncome } = computeMonthlyMoneySnapshot({
    businesses: activeBusinesses,
    clients,
    expenseEntries,
  })

  const netWorth = useMemo(
    () =>
      balanceSheetAssets.reduce((s, a) => s + a.value, 0) -
      balanceSheetDebts.reduce((s, d) => s + d.balance, 0),
    [balanceSheetAssets, balanceSheetDebts]
  )

  const tasksDoneToday = visibleTasks.filter((t) => t.done && t.completedAt?.startsWith(todayStr)).length
  const todayFocusSessions = focusSessions.filter(s => s.startedAt.startsWith(todayStr)).length
  const tasksCommitted = visibleTasks.filter(
    (t) => t.createdAt.startsWith(todayStr) || (!t.done && t.priority !== 'low')
  ).length
  const executionScore = getExecutionScore(
    todayHealth,
    tasksCommitted,
    tasksDoneToday,
    todayFocusSessions,
    trackPrayers
  )
  const scoreZone = getScoreZone(executionScore)

  const prayersDone = Object.values(todayHealth.prayers).filter(Boolean).length

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
    return [...visibleTasks]
      .filter((t) => !t.done)
      .map((t) => {
        const biz = businesses.find((b) => b.id === t.businessId && !isArchived(b))
        return { ...t, score: getTaskPriorityScore(t, biz) }
      })
      .sort((a, b) => b.score - a.score)
  }, [visibleTasks, businesses])

  const theOneThing = sortedTasks[0]
  const theOneThingBiz = theOneThing ? businesses.find((b) => b.id === theOneThing.businessId && !isArchived(b)) : null
  const theOneThingProject = theOneThing?.projectId
    ? projects.find((p) => p.id === theOneThing.projectId && !isArchived(p))
    : null
  const theOneThingGoal = theOneThingProject?.goalId ? goals.find(g => g.id === theOneThingProject.goalId) : null

  // ── Active projects ──
  const activeProjects = projects.filter((p) => !isArchived(p) && p.status === 'in_progress').slice(0, 3)

  // ── Alerts (proactive inbox first, then computed) ──
  const alerts = useMemo(() => {
    const list: { text: string; color: string; type: string; id?: string }[] = []
    proactiveMessages
      .filter((m) => !m.read && isProactiveMessageVisible(m))
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
    const activeClients = clients.filter((c) => c.active && !isArchived(c))
    const totalNet = activeClients.reduce((s, c) => s + getClientNet(c), 0)
    activeClients.forEach(c => {
      const pct = totalNet > 0 ? (getClientNet(c) / totalNet) * 100 : 0
      if (pct > 40) list.push({ text: `${c.name} is ${Math.round(pct)}% of revenue — concentration risk`, color: 'var(--rose)', type: 'risk' })
    })
    // Business health
    businesses
      .filter((b) => !isArchived(b) && b.status !== 'dormant' && b.status !== 'idea')
      .forEach((b) => {
      const health = getBusinessHealth(b, visibleTasks, revenueEntries)
      if (health === 'flatline') list.push({ text: `${b.name} is flatlined — 0 tasks done in 7 days`, color: 'var(--rose)', type: 'health' })
    })
    // Stale tasks
    const staleTasks = visibleTasks.filter(
      (t) => !t.done && Date.now() - new Date(t.createdAt).getTime() > 7 * 86400000
    )
    if (staleTasks.length > 0) list.push({ text: `${staleTasks.length} stale task${staleTasks.length > 1 ? 's' : ''} older than 7 days`, color: 'var(--amber)', type: 'stale' })
    // Commitment rate
    const total = commitments.length
    const fulfilled = commitments.filter(c => c.fulfilled).length
    if (total > 0 && (fulfilled / total) < 0.5) list.push({ text: `Commitment rate is ${Math.round((fulfilled / total) * 100)}% — below 50%`, color: 'var(--amber)', type: 'commitment' })
    return list.slice(0, 8)
  }, [clients, businesses, visibleTasks, revenueEntries, commitments, proactiveMessages])

  /** PRD GAP 17 — dollar tasks + live recompute every 1s */
  const workingHoursPerDay = useMemo(() => {
    const parse = (s: string | undefined) => {
      if (!s?.includes(':')) return null
      const [h, m] = s.split(':').map(Number)
      return (h ?? 0) + (m ?? 0) / 60
    }
    const a = parse(workDayStart)
    const b = parse(workDayEnd)
    if (a != null && b != null && b > a) return Math.min(16, b - a)
    return 10
  }, [workDayStart, workDayEnd])

  const costOfInaction = useMemo(() => {
    const gap = computeCostOfInactionGap17({
      tasks: visibleTasks,
      wakeUpTime,
      workingHoursPerDay,
      now,
    })
    const allClear = gap.items.length === 0
    return {
      items: gap.items.map((it) => ({
        label: it.label,
        amount: Math.round(it.taskCostNow),
        taskId: it.taskId,
      })),
      total: allClear ? 0 : Math.round(gap.totalCostNow),
      totalDailyValue: gap.totalDailyValue,
      allClear,
    }
  }, [visibleTasks, wakeUpTime, workingHoursPerDay, now, coiTick])

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
        const done = visibleTasks.filter((t) => t.done && t.completedAt?.startsWith(h.date)).length
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
    visibleTasks,
    energyLogs,
    trackPrayers,
    prayersDone,
    latestEnergy,
    executionScore,
  ])

  /** PRD §9.5 — Ideal Self gap when returning after 2+ days. */
  const idealSelfBenchmark = useMemo(
    () => computeIdealSelfBenchmark(lastSessionDaysSinceOpen, previousLastOpenedAt, visibleTasks),
    [lastSessionDaysSinceOpen, previousLastOpenedAt, visibleTasks]
  )

  const nextActionMotivation = useMemo(() => {
    if (yesterdayScore != null && executionScore > yesterdayScore) {
      return "Complete this and you're already ahead of yesterday."
    }
    return 'If you do one thing today, make it this.'
  }, [yesterdayScore, executionScore])

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

  const sortedVisibleTiles = useMemo(
    () =>
      [...dashboardLayout.tiles]
        .filter((t) => t.visible)
        .sort((a, b) => a.order - b.order),
    [dashboardLayout.tiles]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const onDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e
      if (over && active.id !== over.id) {
        reorderDashboardTiles(String(active.id), String(over.id))
      }
    },
    [reorderDashboardTiles]
  )

  const handleRemoveTile = useCallback(
    (tileId: string) => {
      const snap = useStore.getState().dashboardLayout.tiles.find((t) => t.tileId === tileId)
      if (!snap) return
      setDashboardTileVisible(tileId, false)
      toast('Tile removed', {
        duration: 5000,
        action: {
          label: 'Undo',
          onClick: () => {
            const st = useStore.getState()
            st.setDashboardLayout({
              ...st.dashboardLayout,
              lastModified: new Date().toISOString(),
              tiles: st.dashboardLayout.tiles.map((t) =>
                t.tileId === tileId ? { ...snap, visible: true } : t
              ),
            })
          },
        },
      })
    },
    [setDashboardTileVisible, setDashboardLayout]
  )

  const longPressGrid = useLongPress(() => {
    if (!editMode) setEditMode(true)
  }, 550)

  const tileCtx: DashboardTileRenderCtx = useMemo(
    () => ({
      isMorningBriefWindow,
      editMode,
      morningBrief,
      yesterdayScore,
      todayStr,
      logEvent,
      theOneThing,
      showAddTask,
      setShowAddTask,
      newTaskText,
      setNewTaskText,
      newTaskBiz,
      setNewTaskBiz,
      newTaskPriority,
      setNewTaskPriority,
      businesses: activeBusinesses,
      toggleTask,
      addTask,
      theOneThingProject,
      theOneThingGoal,
      hour,
      netIncome,
      incomeSparkData,
      trajectoryData,
      updateBusiness,
      totalIncome,
      totalExpenses,
      executionScore,
      scoreZone,
      tasksDoneToday,
      tasksCommitted,
      prayersDone,
      todayHealth,
      todayFocusSessions,
      latestEnergy,
      addEnergyLog,
      energyLogs,
      habitDrawerOpen,
      setHabitDrawerOpen,
      habitDoneToday,
      habitTotalToday,
      togglePrayer,
      lifeY,
      lifeD,
      lifeH,
      lifeM,
      lifeS,
      lifeRemainingSec,
      lifeModel,
      todaySchedule,
      currentMinutes,
      scheduleStart,
      scheduleEnd,
      activeProjects,
      newProjectName,
      setNewProjectName,
      newProjectDesc,
      setNewProjectDesc,
      newProjectBiz,
      setNewProjectBiz,
      addProject,
      unreadProactive,
      alerts,
      expandedAlert,
      setExpandedAlert,
      getAlertAction,
      costOfInaction,
      daysRemaining,
      incomeTarget,
      targetDate,
      quickTaskText,
      setQuickTaskText,
      sortedTasks,
      tasks: visibleTasks,
      xp,
      level,
      streaks,
      clients,
      getClientNet,
      gmbProfiles,
      updateHealth,
      markProactiveRead,
      lastSessionDaysSinceOpen,
      idealSelfBenchmark,
      nextActionMotivation,
      healthHistory,
      trackPrayers,
      userLat,
      userLng,
      prayerCalcMethod,
      prayerAsrHanafi,
      onSkipTask: openSkipForTask,
      netWorth,
    }),
    [
      isMorningBriefWindow,
      editMode,
      morningBrief,
      yesterdayScore,
      todayStr,
      logEvent,
      theOneThing,
      showAddTask,
      newTaskText,
      newTaskBiz,
      newTaskPriority,
      activeBusinesses,
      toggleTask,
      addTask,
      theOneThingProject,
      theOneThingGoal,
      hour,
      netIncome,
      incomeSparkData,
      trajectoryData,
      updateBusiness,
      totalIncome,
      totalExpenses,
      executionScore,
      scoreZone,
      tasksDoneToday,
      tasksCommitted,
      prayersDone,
      todayHealth,
      todayFocusSessions,
      latestEnergy,
      addEnergyLog,
      energyLogs,
      habitDrawerOpen,
      setHabitDrawerOpen,
      habitDoneToday,
      habitTotalToday,
      togglePrayer,
      lifeY,
      lifeD,
      lifeH,
      lifeM,
      lifeS,
      lifeRemainingSec,
      lifeModel,
      todaySchedule,
      currentMinutes,
      scheduleStart,
      scheduleEnd,
      activeProjects,
      newProjectName,
      newProjectDesc,
      newProjectBiz,
      unreadProactive,
      alerts,
      expandedAlert,
      getAlertAction,
      costOfInaction,
      daysRemaining,
      incomeTarget,
      targetDate,
      quickTaskText,
      sortedTasks,
      visibleTasks,
      xp,
      level,
      streaks,
      clients,
      gmbProfiles,
      updateHealth,
      markProactiveRead,
      lastSessionDaysSinceOpen,
      idealSelfBenchmark,
      nextActionMotivation,
      healthHistory,
      trackPrayers,
      userLat,
      userLng,
      prayerCalcMethod,
      prayerAsrHanafi,
      openSkipForTask,
      netWorth,
    ]
  )

  const activeTileIds = useMemo(
    () => new Set(dashboardLayout.tiles.filter((t) => t.visible).map((t) => t.tileId)),
    [dashboardLayout.tiles]
  )

  return (
    <PageTransition>
      <div className="pb-32">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[15px] text-[var(--text-secondary)]">
            {getGreeting()},{' '}
            <span className="font-semibold text-[var(--text-primary)]">{userName?.trim() || 'there'}</span>
          </p>
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setLibraryOpen(true)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[14px] font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
                >
                  Add tile
                </button>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2 text-[14px] font-semibold text-white"
                >
                  Done
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="hidden md:inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[14px] font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
              >
                Customize
              </button>
            )}
          </div>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          <SortableContext items={sortedVisibleTiles.map((t) => t.tileId)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-12 gap-4" {...(!editMode ? longPressGrid : {})}>
              <AnimatePresence mode="popLayout">
                {sortedVisibleTiles.map((entry) => (
                  <motion.div
                    key={entry.tileId}
                    layout
                    initial={false}
                    exit={{ scale: 0.94, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="contents"
                  >
                    <SortableDashboardTile
                      id={entry.tileId}
                      entry={entry}
                      editMode={editMode}
                      onRemove={() => handleRemoveTile(entry.tileId)}
                      onResize={(next) => updateDashboardTileSpan(entry.tileId, next)}
                    >
                      {renderDashboardTile(entry.tileId, tileCtx)}
                    </SortableDashboardTile>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>

        <TileLibrarySheet
          open={libraryOpen}
          onOpenChange={setLibraryOpen}
          activeTileIds={activeTileIds}
          onToggleAdd={(id) => {
            showDashboardTile(id)
            toast.success('Tile added to the bottom of your dashboard')
          }}
        />

        <Drawer.Root open={ideaFabOpen} onOpenChange={setIdeaFabOpen}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-[110] bg-black/60" />
            <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-[120]`}>
              <DrawerDragHandle />
              <p className="text-lg font-semibold text-[var(--text-primary)]">Capture idea</p>
              <textarea
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                placeholder="Quick idea…"
                rows={4}
                className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[16px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
              <button
                type="button"
                className="btn-primary mt-4 w-full py-3"
                onClick={() => {
                  const t = ideaText.trim()
                  if (!t) {
                    toast.error('Enter an idea')
                    return
                  }
                  addIdea(t, 'quick-capture')
                  setIdeaText('')
                  setIdeaFabOpen(false)
                  toast.success('Idea saved')
                }}
              >
                Save idea
              </button>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>

        <TaskSkipDrawer taskId={skipTaskId} onDismiss={() => setSkipTaskId(null)} />

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
