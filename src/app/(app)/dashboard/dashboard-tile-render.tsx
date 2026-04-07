'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Drawer } from 'vaul'
import { AreaChart, Area, LineChart, Line, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import type { HealthLog, Priority, Task } from '@/stores/store'
import { XP_VALUES } from '@/lib/constants'
import { applyTaskDollarEstimateAfterCreate } from '@/lib/task-dollar-client'
import EveningVoiceReview from '@/components/EveningVoiceReview'
import ScoreDetailDrawerContent from '@/components/dashboard/ScoreDetailDrawerContent'
import ExecutionDetailDrawerContent from '@/components/dashboard/ExecutionDetailDrawerContent'
import PrayerDetailDrawerContent from '@/components/dashboard/PrayerDetailDrawerContent'
import HabitsDetailDrawerContent from '@/components/dashboard/HabitsDetailDrawerContent'
import type { LifeAdjustment } from '@/lib/life-expectancy'
import { DRAWER_CONTENT_CLASS, DrawerDragHandle } from '@/components/ui/drawer-primitives'

const cardAnim = (delay: number) => ({
  initial: { opacity: 0, y: 8 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const },
})

const BLOCK_COLORS: Record<string, string> = {
  prayer: 'var(--gold)', work: 'var(--blue)', health: 'var(--accent)',
  personal: 'var(--info)', meal: 'var(--amber)',
}

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

export type DashboardTileRenderCtx = Record<string, unknown>

export function renderDashboardTile(tileId: string, x: DashboardTileRenderCtx): ReactNode {
  const isMorningBriefWindow = x.isMorningBriefWindow as boolean
  const editMode = x.editMode as boolean
  const morningBrief = x.morningBrief as { prayerLine: string; energyLine: string; screenLine: string; beatTips: string[] }
  const yesterdayScore = x.yesterdayScore as number | null
  const todayStr = x.todayStr as string
  const logEvent = x.logEvent as (e: string, p?: Record<string, unknown>) => void
  const theOneThing = x.theOneThing as
    | { id: string; text: string; xpValue: number; score?: number; projectId?: string }
    | undefined
  const showAddTask = x.showAddTask as boolean
  const setShowAddTask = x.setShowAddTask as (v: boolean) => void
  const newTaskText = x.newTaskText as string
  const setNewTaskText = x.setNewTaskText as (v: string) => void
  const newTaskBiz = x.newTaskBiz as string
  const setNewTaskBiz = x.setNewTaskBiz as (v: string) => void
  const newTaskPriority = x.newTaskPriority as Priority
  const setNewTaskPriority = x.setNewTaskPriority as (v: Priority) => void
  const businesses = x.businesses as { id: string; name: string; color: string; monthlyRevenue: number }[]
  const toggleTask = x.toggleTask as (id: string) => void
  const addTask = x.addTask as (t: {
    businessId: string
    text: string
    tag: string
    priority: Priority
    done: boolean
    xpValue: number
  }) => string
  const theOneThingProject = x.theOneThingProject as { name: string } | null | undefined
  const theOneThingGoal = x.theOneThingGoal as { title: string } | null | undefined
  const hour = x.hour as number
  const netIncome = x.netIncome as number
  const incomeSparkData = x.incomeSparkData as { v: number }[]
  const trajectoryData = x.trajectoryData as { day: string; actual?: number; projected: number }[]
  const updateBusiness = x.updateBusiness as (id: string, u: { monthlyRevenue: number }) => void
  const totalIncome = x.totalIncome as number
  const totalExpenses = x.totalExpenses as number
  const executionScore = x.executionScore as number
  const scoreZone = x.scoreZone as { color: string; emoji: string; label: string }
  const tasksDoneToday = x.tasksDoneToday as number
  const tasksCommitted = x.tasksCommitted as number
  const prayersDone = x.prayersDone as number
  const todayHealth = x.todayHealth as HealthLog
  const todayFocusSessions = x.todayFocusSessions as number
  const latestEnergy = x.latestEnergy as { level: number; timeOfDay: string } | null
  const addEnergyLog = x.addEnergyLog as (l: { date: string; timeOfDay: string; level: number }) => void
  const energyLogs = x.energyLogs as { date: string; timeOfDay: string; level: number }[]
  const togglePrayer = x.togglePrayer as (p: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') => void
  const lifeRemainingSec = x.lifeRemainingSec as number
  const lifeModel = x.lifeModel as {
    baselineYearsRemaining: number
    adjustments: LifeAdjustment[]
    adjustedYearsRemaining: number
    expectedEnd: Date
  }
  const todaySchedule = x.todaySchedule as {
    time: string
    duration: number
    type: string
    title: string
    completed?: boolean
  }[]
  const currentMinutes = x.currentMinutes as number
  const scheduleStart = x.scheduleStart as number
  const scheduleEnd = x.scheduleEnd as number
  const activeProjects = x.activeProjects as {
    id: string
    name: string
    description?: string
    businessId?: string
    progress: number
  }[]
  const newProjectName = x.newProjectName as string
  const setNewProjectName = x.setNewProjectName as (v: string) => void
  const newProjectDesc = x.newProjectDesc as string
  const setNewProjectDesc = x.setNewProjectDesc as (v: string) => void
  const newProjectBiz = x.newProjectBiz as string
  const setNewProjectBiz = x.setNewProjectBiz as (v: string) => void
  const addProject = x.addProject as (p: {
    name: string
    description: string
    businessId?: string
    impact: number
    confidence: number
    ease: number
    status: string
    progress: number
  }) => void
  const unreadProactive = x.unreadProactive as number
  const alerts = x.alerts as { text: string; color: string; type: string; id?: string }[]
  const expandedAlert = x.expandedAlert as number | null
  const setExpandedAlert = x.setExpandedAlert as (v: number | null) => void
  const getAlertAction = x.getAlertAction as (a: {
    type: string
    text: string
    id?: string
  }) => { href?: string; label: string; action?: () => void } | null
  const costOfInaction = x.costOfInaction as {
    total: number
    allClear?: boolean
    items: { label: string; amount: number; taskId?: string }[]
  }
  const tasksFull = x.tasks as Task[]
  const xp = x.xp as number
  const level = x.level as number
  const healthHistory = x.healthHistory as HealthLog[]
  const trackPrayers = x.trackPrayers as boolean
  const userLat = x.userLat as number | null
  const userLng = x.userLng as number | null
  const prayerCalcMethod = x.prayerCalcMethod as string
  const prayerAsrHanafi = x.prayerAsrHanafi as boolean
  const daysRemaining = x.daysRemaining as number
  const incomeTarget = x.incomeTarget as number
  const targetDate = x.targetDate as string | undefined
  const quickTaskText = x.quickTaskText as string
  const setQuickTaskText = x.setQuickTaskText as (v: string) => void
  const sortedTasks = x.sortedTasks as { id: string; text: string; xpValue: number; priority: string }[]
  const clients = x.clients as { id: string; name: string; active: boolean; serviceType: string }[]
  const getClientNet = x.getClientNet as (c: (typeof clients)[number]) => number
  const gmbProfiles = x.gmbProfiles as {
    id: string
    city: string
    reviewCount: number
    callsPerMonth: number
    status: string
  }[]
  const updateHealth = x.updateHealth as (h: Partial<HealthLog>) => void
  const markProactiveRead = x.markProactiveRead as (id: string) => void
  const onSkipTask = x.onSkipTask as ((id: string) => void) | undefined
  const netWorth = x.netWorth as number

  switch (tileId) {

    case 'morning_brief': {
      /** PRD §9.21 — only before noon; after noon hide unless customizing layout */
      if (!isMorningBriefWindow && !editMode) {
        return null
      }
      if (!isMorningBriefWindow && editMode) {
        return (
          <div className="w-full rounded-2xl border border-[var(--border)] border-dashed bg-[var(--bg-secondary)]/40 p-6 text-center text-[14px] text-[var(--text-secondary)]">
            Morning briefing only appears before noon (your local time). Reorder or resize while in Customize.
          </div>
        )
      }
      return (
  <motion.div className="w-full" {...cardAnim(0)}>
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
      )
    }
    case 'one_thing': {
      const lastSessionDaysSinceOpen = x.lastSessionDaysSinceOpen as number
      const idealSelfBenchmark = x.idealSelfBenchmark as {
        days: number
        idealTasks: number
        idealXp: number
        actualDone: number
        actualXp: number
        gapXp: number
      } | null
      const nextActionMotivation = (x.nextActionMotivation as string) || 'If you do one thing today, make it this.'
      const topFive = (
        x.sortedTasks as { id: string; text: string; xpValue: number; priority: string; score?: number }[]
      ).slice(0, 5)

      const absence = lastSessionDaysSinceOpen >= 2
      // Morning before noon; afternoon noon–8pm task list; evening after 8pm — PRD §9.5
      const phase: 'absence' | 'morning' | 'afternoon' | 'evening' = absence
        ? 'absence'
        : hour >= 20
          ? 'evening'
          : hour >= 12
            ? 'afternoon'
            : 'morning'

      const emptyPlate = (
        <>
          <p className="text-[20px] font-semibold text-[var(--text-primary)] mt-3">Your plate is clear.</p>
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
              <input
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="What needs to get done?"
                className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-[14px] text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)] focus:ring-0"
                autoFocus
              />
              <div className="flex gap-2">
                <select
                  value={newTaskBiz}
                  onChange={(e) => setNewTaskBiz(e.target.value)}
                  className="flex-1 bg-[var(--surface2)] border border-[var(--border)] rounded-[10px] px-3 py-2 text-[12px] text-[var(--text-primary)]"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1">
                  {(['crit', 'high', 'med', 'low'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTaskPriority(p)}
                      className={`min-h-[36px] px-2.5 py-1.5 rounded-[8px] text-[13px] font-semibold capitalize ${newTaskPriority === p ? 'bg-[var(--accent-bg)] text-[var(--accent)]' : 'bg-[var(--surface2)] text-[var(--text-dim)]'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  onClick={() => {
                    if (newTaskText.trim()) {
                      const tid = addTask({
                        businessId: newTaskBiz,
                        text: newTaskText.trim(),
                        tag: '',
                        priority: newTaskPriority,
                        done: false,
                        xpValue: XP_VALUES[newTaskPriority],
                      })
                      void applyTaskDollarEstimateAfterCreate(tid, newTaskText.trim())
                      setNewTaskText('')
                      setShowAddTask(false)
                      toast.success('Task added!')
                    }
                  }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary flex-1 min-h-[44px]"
                >
                  Add Task
                </motion.button>
                <button type="button" onClick={() => setShowAddTask(false)} className="px-4 py-2.5 rounded-[10px] text-[12px] text-[var(--text-dim)]">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )

      return (
        <motion.div
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6"
          {...cardAnim(0.04)}
        >
          <p className="text-center text-[13px] font-semibold text-[var(--text-secondary)]">The one thing</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${phase}-${theOneThing?.id ?? 'none'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.3 } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="mt-2"
            >
              {phase === 'absence' && (
                <div className="text-center space-y-3">
                  <p className="text-[15px] text-[var(--text-secondary)]">
                    Welcome back — it&apos;s been {lastSessionDaysSinceOpen} day{lastSessionDaysSinceOpen === 1 ? '' : 's'} since your last session.
                  </p>
                  {idealSelfBenchmark ? (
                    <p className="text-[15px] text-[var(--text-primary)]">
                      While you were away, your Ideal Self benchmark was ~{idealSelfBenchmark.idealTasks} priority tasks (~
                      {idealSelfBenchmark.idealXp} XP). You logged {idealSelfBenchmark.actualDone} completions (~
                      {idealSelfBenchmark.actualXp} XP). Gap: ~{idealSelfBenchmark.gapXp} XP.
                    </p>
                  ) : (
                    <p className="text-[15px] text-[var(--text-secondary)]">Open the app more consistently to unlock gap tracking.</p>
                  )}
                  <Link
                    href="/ai"
                    className="inline-block rounded-[14px] bg-[var(--accent)] px-5 py-2.5 text-[17px] font-semibold text-white"
                  >
                    Let&apos;s catch up →
                  </Link>
                </div>
              )}

              {phase === 'morning' &&
                (theOneThing ? (
                  <div className="text-center">
                    <p className="text-[15px] text-[var(--text-secondary)] mb-3">{nextActionMotivation}</p>
                    <p className="text-[22px] font-bold text-[var(--text-primary)]">{theOneThing.text}</p>
                    {theOneThing.score != null && (
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
                        className="rounded-[14px] bg-[var(--accent)] px-5 py-2.5 text-[17px] font-semibold text-white hover:bg-[var(--accent-hover)]"
                        whileTap={{ scale: 0.97 }}
                      >
                        ✓ Done
                      </motion.button>
                      <button
                        type="button"
                        className="text-[17px] text-[var(--accent)] hover:underline"
                        onClick={() => onSkipTask?.(theOneThing.id)}
                      >
                        Skip →
                      </button>
                    </div>
                  </div>
                ) : (
                  emptyPlate
                ))}

              {phase === 'afternoon' && (
                <div>
                  <p className="text-[13px] font-medium text-[var(--text-secondary)] mb-2">
                    Still on your plate ({topFive.length})
                  </p>
                  {topFive.length === 0 ? (
                    emptyPlate
                  ) : (
                    <ul className="space-y-2">
                      {topFive.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-start justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50 px-3 py-2"
                        >
                          <span className="text-[15px] text-[var(--text-primary)] flex-1">{t.text}</span>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                toggleTask(t.id)
                                toast.success(`Done! +${t.xpValue} XP`)
                              }}
                              className="text-[13px] font-semibold text-[var(--accent)]"
                            >
                              Done
                            </button>
                            <button
                              type="button"
                              className="text-[13px] text-[var(--text-secondary)] hover:underline"
                              onClick={() => onSkipTask?.(t.id)}
                            >
                              Skip
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {phase === 'evening' && (
                <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                  <div className="text-center">
                    <p className="text-[15px] text-[var(--text-secondary)]">
                      Today&apos;s score: <span className="font-semibold text-[var(--text-primary)]">{executionScore}</span> · Tasks done{' '}
                      {tasksDoneToday} / {tasksCommitted || '—'} committed
                    </p>
                  </div>
                  {theOneThing && (
                    <p className="text-center text-[14px] text-[var(--text-dim)]">Top priority still: {theOneThing.text.slice(0, 80)}</p>
                  )}
                  <div className="border-t border-[var(--border)] pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)] mb-2">
                      How was your day?
                    </p>
                    <EveningVoiceReview />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )
    }
    case 'net_income':
      return (
<Drawer.Root>
  <Drawer.Trigger asChild>
    <motion.div
      className="w-full cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5"
      {...cardAnim(0.08)}
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
    <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50`}>
      <DrawerDragHandle />
      <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)] mb-4">Net Income Breakdown</Drawer.Title>
      <div className="mb-5 rounded-[12px] p-4" style={{ background: 'var(--surface2)' }}>
        <p className="mb-3 text-[13px] font-semibold text-[var(--text-secondary)]">14-day income trajectory</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={trajectoryData}>
            <Line type="monotone" dataKey="actual" stroke="var(--accent)" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="projected" stroke="var(--text-dim)" strokeWidth={1} strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
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
          <span className="text-[var(--text-primary)]">Net Income</span>
          <span className="data" style={{ color: netIncome >= 0 ? 'var(--positive)' : 'var(--negative)' }}>${Math.round(netIncome).toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-[12px] pt-2">
          <span className="text-[var(--text-mid)]">Net worth (balance sheet)</span>
          <span className="data tabular-nums" style={{ color: netWorth >= 0 ? 'var(--positive)' : 'var(--negative)' }}>
            ${Math.round(netWorth).toLocaleString()}
          </span>
        </div>
      </div>
      <Link
        href="/financials"
        className="mt-4 block w-full rounded-xl border border-[var(--border)] py-3 text-center text-[13px] font-semibold text-[var(--accent)]"
      >
        View full page →
      </Link>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>


      )
    case 'daily_score': {
      const dailyScore = typeof todayHealth.dailyScore === 'number' ? todayHealth.dailyScore : 0
      return (
        <Drawer.Root>
          <Drawer.Trigger asChild>
            <motion.div
              className="w-full cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5"
              {...cardAnim(0.1)}
            >
              <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Score ring</span>
              <div className="relative mx-auto mt-2 flex h-[56px] w-[56px] items-center justify-center">
                <ProgressRing value={dailyScore} max={100} size={56} color="var(--accent)" />
                <span className="absolute inset-0 flex items-center justify-center data text-[12px] font-bold text-[var(--text)]">
                  {dailyScore}
                </span>
              </div>
              <p className="mt-1 text-center text-[11px] text-[var(--text-mid)]">Health scorecard · tap</p>
            </motion.div>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
            <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50 max-h-[90vh] overflow-y-auto`}>
              <DrawerDragHandle />
              <Drawer.Title className="mb-2 text-lg font-semibold text-[var(--text-primary)]">Daily scorecard</Drawer.Title>
              <ScoreDetailDrawerContent
                todayStr={todayStr}
                executionScore={executionScore}
                tasks={tasksFull}
                todayHealth={todayHealth}
                tasksDoneToday={tasksDoneToday}
                tasksCommitted={tasksCommitted}
                todayFocusSessions={todayFocusSessions}
                trackPrayers={trackPrayers}
                healthHistory={healthHistory}
                xp={xp}
                level={level}
                togglePrayer={togglePrayer}
                toggleTask={toggleTask}
              />
              <Link
                href="/health"
                className="mt-4 block w-full rounded-xl border border-[var(--border)] py-3 text-center text-[13px] font-semibold text-[var(--accent)]"
              >
                View full page →
              </Link>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )
    }
    case 'execution':
      return (
<Drawer.Root>
  <Drawer.Trigger asChild>
    <motion.div
      className="w-full cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5"
      {...cardAnim(0.12)}
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
    <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50`}>
      <DrawerDragHandle />
      <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)] mb-2">Execution score</Drawer.Title>
      <div className="flex justify-center mb-4 relative" style={{ width: 80, height: 80, margin: '0 auto 16px' }}>
        <ProgressRing value={executionScore} max={100} size={80} color="var(--accent)" />
        <span className="absolute inset-0 flex items-center justify-center data text-[18px] font-bold text-white">{executionScore}</span>
      </div>
      <ExecutionDetailDrawerContent
        todayStr={todayStr}
        executionScore={executionScore}
        todayHealth={todayHealth}
        tasksDoneToday={tasksDoneToday}
        tasksCommitted={tasksCommitted}
        todayFocusSessions={todayFocusSessions}
        trackPrayers={trackPrayers}
        healthHistory={healthHistory}
      />
      <Link
        href="/tasks"
        className="mt-4 block w-full rounded-xl border border-[var(--border)] py-3 text-center text-[13px] font-semibold text-[var(--accent)]"
      >
        View full page →
      </Link>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>


      )
    case 'energy':
      return (
<Drawer.Root>
  <Drawer.Trigger asChild>
    <motion.div
      className="w-full cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5"
      {...cardAnim(0.16)}
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
    <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50`}>
      <DrawerDragHandle />
      <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)] mb-4">Log Your Energy</Drawer.Title>

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
      <Link
        href="/energy"
        className="mt-4 block w-full rounded-xl border border-[var(--border)] py-3 text-center text-[13px] font-semibold text-[var(--accent)]"
      >
        View full page →
      </Link>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>


      )
    case 'prayers':
      return (
<Drawer.Root>
  <Drawer.Trigger asChild>
    <motion.div
      className="w-full cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5"
      {...cardAnim(0.2)}
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
    <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50`}>
      <DrawerDragHandle />
      <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)] mb-4">Prayers</Drawer.Title>
      <div className="flex items-center gap-2 mb-4">
        <span className="data text-[24px] font-bold" style={{ color: 'var(--gold)' }}>{prayersDone}/5</span>
        <span className="text-[12px] text-[var(--text-dim)]">completed today</span>
      </div>
      <PrayerDetailDrawerContent
        todayStr={todayStr}
        todayHealth={todayHealth}
        healthHistory={healthHistory}
        trackPrayers={trackPrayers}
        togglePrayer={togglePrayer}
        userLat={userLat}
        userLng={userLng}
        prayerCalcMethod={prayerCalcMethod}
        prayerAsrHanafi={prayerAsrHanafi}
      />
      <Link
        href="/health"
        className="mt-4 block w-full rounded-xl border border-[var(--border)] py-3 text-center text-[13px] font-semibold text-[var(--accent)]"
      >
        View full page →
      </Link>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
      )
    case 'life_horizon': {
      const totalSec = Math.max(0, Math.floor(lifeRemainingSec))
      const years = Math.floor(totalSec / 31536000)
      const months = Math.floor((totalSec % 31536000) / 2592000)
      const days = Math.floor((totalSec % 2592000) / 86400)
      const lifeHuman =
        years > 0
          ? `~${years} year${years === 1 ? '' : 's'}${months > 0 ? `, ${months} mo` : ''}`
          : months > 0
            ? `~${months} month${months === 1 ? '' : 's'}`
            : `~${days} day${days === 1 ? '' : 's'}`
      return (
<Drawer.Root>
  <Drawer.Trigger asChild>
    <motion.div
      className="w-full flex cursor-pointer flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:flex-row sm:items-center sm:justify-between"
      {...cardAnim(0.22)}
    >
      <div>
        <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Life horizon</span>
        <p className="text-[10px] text-[var(--text-mid)]">Est. remaining — tap for adjustment breakdown</p>
      </div>
      <div className="flex flex-wrap items-baseline gap-2 sm:justify-end">
        <div className="data text-[22px] font-bold leading-tight text-[var(--text-primary)]">
          {lifeHuman}
        </div>
      </div>
    </motion.div>
  </Drawer.Trigger>
  <Drawer.Portal>
    <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
    <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50`}>
      <DrawerDragHandle />
      <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)]">Life expectancy model</Drawer.Title>
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
          lifeModel.adjustments.map((a: LifeAdjustment, i: number) => (
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
      <Link
        href="/health"
        className="mt-4 block w-full rounded-xl border border-[var(--border)] py-3 text-center text-[13px] font-semibold text-[var(--accent)]"
      >
        View full page →
      </Link>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
      )
    }
    case 'schedule':
      return (
<Drawer.Root>
  <Drawer.Trigger asChild>
    <motion.div className="card rounded-[16px] p-5 w-full cursor-pointer" {...cardAnim(0.24)} >
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
    <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50`}>
      <DrawerDragHandle />
      <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)] mb-4">Today&apos;s Schedule</Drawer.Title>

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
      )
    case 'active_projects':
      return (
<Drawer.Root>
  <Drawer.Trigger asChild>
    <motion.div className="card rounded-[16px] p-5 w-full cursor-pointer" {...cardAnim(0.28)} >
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
    <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50`}>
      <DrawerDragHandle />
      <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)] mb-4">
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
      <Link
        href="/projects"
        className="mt-4 block w-full rounded-xl border border-[var(--border)] py-3 text-center text-[13px] font-semibold text-[var(--accent)]"
      >
        View full page →
      </Link>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
      )
    case 'ai_insights': {
      const insightBody = (
        <>
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
                      className="flex cursor-pointer items-center justify-between rounded-[10px] px-3 py-2.5"
                      style={{ borderLeft: `3px solid ${a.color}`, background: 'var(--surface2)' }}
                      whileHover={{ scale: 1.005 }}
                    >
                      <p className="flex-1 text-[12px] text-[var(--text-mid)]">{a.text}</p>
                      {action &&
                        ('href' in action ? (
                          <Link
                            href={action.href!}
                            onClick={(e) => e.stopPropagation()}
                            className="ml-2 flex-shrink-0 rounded-[6px] px-2.5 py-1 text-[10px] font-semibold"
                            style={{
                              background: `color-mix(in srgb, ${a.color} 15%, transparent)`,
                              color: a.color,
                            }}
                          >
                            {action.label}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              action.action!()
                            }}
                            className="ml-2 flex-shrink-0 rounded-[6px] px-2.5 py-1 text-[10px] font-semibold"
                            style={{
                              background: `color-mix(in srgb, ${a.color} 15%, transparent)`,
                              color: a.color,
                            }}
                          >
                            {action.label}
                          </button>
                        ))}
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
                            {a.type === 'risk' &&
                              'High client concentration puts your revenue at risk. Consider diversifying by acquiring new clients or increasing revenue from smaller accounts.'}
                            {a.type === 'health' &&
                              'This business has had no task completions in the past week. Assign tasks or reconsider its priority.'}
                            {a.type === 'stale' &&
                              'Stale tasks drag down your execution score. Review and either complete, reschedule, or delete them.'}
                            {a.type === 'commitment' &&
                              'Low commitment fulfillment erodes trust. Review pending commitments and prioritize follow-through.'}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-3 text-[12px] italic text-[var(--text-dim)]">All clear. Keep it up.</p>
          )}
        </>
      )
      return (
        <Drawer.Root>
          <Drawer.Trigger asChild>
            <motion.div className="card w-full cursor-pointer rounded-[16px] p-5 text-left" {...cardAnim(0.32)}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[var(--text-secondary)]">AI Insights</span>
                {unreadProactive > 0 && (
                  <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-bold text-white">
                    {unreadProactive > 99 ? '99+' : unreadProactive}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] text-[var(--text-dim)]">Tap for detail and actions</p>
              {alerts[0] && (
                <p className="mt-2 line-clamp-2 text-[12px] text-[var(--text-mid)]">{alerts[0].text}</p>
              )}
            </motion.div>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
            <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50 max-h-[88vh] overflow-y-auto`}>
              <DrawerDragHandle />
              <Drawer.Title className="mb-1 text-lg font-semibold text-[var(--text-primary)]">AI Insights</Drawer.Title>
              <p className="mb-3 text-[13px] text-[var(--text-secondary)]">Proactive inbox — expand for context.</p>
              {insightBody}
              <Link
                href="/ai-insights"
                className="mt-5 block w-full rounded-xl border border-[var(--border)] py-3 text-center text-[13px] font-semibold text-[var(--accent)]"
              >
                View full page →
              </Link>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )
    }
    case 'cost_inaction':
      return (
<Drawer.Root>
  <Drawer.Trigger asChild>
    <motion.div
      className="card-urgent rounded-[16px] p-5 w-full cursor-pointer"
      style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--rose) 5%, var(--surface)), var(--surface))' }}
      {...cardAnim(0.36)}
    >
      <span className="text-[13px] font-semibold text-[var(--negative)]">Cost of inaction</span>
      <div
        className="data mt-2"
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: costOfInaction.allClear ? 'var(--positive)' : 'var(--rose)',
        }}
      >
        ${costOfInaction.total.toLocaleString()}
      </div>
      <p className="text-[10px] text-[var(--text-dim)] mb-2">
        {costOfInaction.allClear ? 'high-priority dollar tasks clear' : "lost today if you don't act"}
      </p>
      <div className="space-y-1">
        {costOfInaction.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-mid)] truncate mr-2">{item.label}</span>
            <span className="data text-[var(--rose)]">${item.amount}</span>
          </div>
        ))}
        {costOfInaction.items.length === 0 && (
          <p className="text-[11px] text-[var(--text-dim)] italic">
            {costOfInaction.allClear ? 'All crit/high dollar tasks done or none pending.' : 'No qualifying tasks'}
          </p>
        )}
      </div>
    </motion.div>
  </Drawer.Trigger>
  <Drawer.Portal>
    <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
    <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50`}>
      <DrawerDragHandle />
      <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)] mb-4">Cost of Inaction</Drawer.Title>

      <div
        className="data text-[32px] font-bold mb-1"
        style={{ color: costOfInaction.allClear ? 'var(--positive)' : 'var(--rose)' }}
      >
        ${costOfInaction.total.toLocaleString()}
      </div>
      <p className="text-[12px] text-[var(--text-dim)] mb-2">
        {costOfInaction.allClear
          ? 'No incomplete crit/high tasks with dollar estimates — opportunity cost is $0.'
          : 'Σ(dailyValue × hours since wake ÷ working hours); dailyValue = dollarValue ÷ 30.'}
      </p>

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
      <Link
        href="/tasks"
        className="mt-3 block w-full rounded-xl border border-[var(--border)] py-3 text-center text-[13px] font-semibold text-[var(--accent)]"
      >
        View full page →
      </Link>
    </Drawer.Content>
  </Drawer.Portal>
</Drawer.Root>
      )
    case 'days_tasks':
      return (
<motion.div className="card rounded-[16px] p-5 w-full" {...cardAnim(0.4)} >
  <div className="grid grid-cols-2 gap-4 h-full">
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
        <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50`}>
          <DrawerDragHandle />
          <Drawer.Title className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Days to Target</Drawer.Title>

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
          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-[12px] font-semibold text-[var(--text-mid)] mb-3">Actions to Close the Gap</p>
            <div className="space-y-2">
              {[
                { text: 'Land 1 new client this week', link: '/pipeline' },
                { text: 'Upsell existing clients', link: '/clients' },
                { text: 'Cut unnecessary expenses', link: '/financials' },
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
    <Drawer.Root>
      <Drawer.Trigger asChild>
        <div className="max-h-[200px] cursor-pointer overflow-y-auto text-left">
          <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Today&apos;s tasks</span>
          <p className="mt-0.5 text-[10px] text-[var(--text-dim)]">{sortedTasks.length} open · tap to manage</p>
          <div className="mt-2 space-y-1">
            {sortedTasks.slice(0, 5).map((t) => (
              <div key={t.id} className="truncate text-[11px] text-[var(--text-mid)]">
                • {t.text}
              </div>
            ))}
            {sortedTasks.length === 0 && <p className="text-[11px] italic text-[var(--text-dim)]">No tasks</p>}
          </div>
        </div>
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50 max-h-[90vh] overflow-y-auto`}>
          <DrawerDragHandle />
          <Drawer.Title className="mb-2 text-lg font-semibold text-[var(--text-primary)]">Today&apos;s tasks</Drawer.Title>
          <form
            className="mb-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (quickTaskText.trim()) {
                const q = quickTaskText.trim()
                const tid = addTask({
                  businessId: businesses[0]?.id || '',
                  text: q,
                  tag: '',
                  priority: 'med',
                  done: false,
                  xpValue: XP_VALUES.med,
                })
                void applyTaskDollarEstimateAfterCreate(tid, q)
                setQuickTaskText('')
                toast.success('Task added!')
              }
            }}
          >
            <input
              value={quickTaskText}
              onChange={(e) => setQuickTaskText(e.target.value)}
              placeholder="Add task..."
              className="w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface2)] px-2.5 py-2 text-[14px] text-white placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)]/50"
            />
          </form>
          <div className="space-y-2">
            {sortedTasks.slice(0, 25).map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <motion.button
                  type="button"
                  onClick={() => {
                    toggleTask(t.id)
                    toast.success(`Done! +${t.xpValue} XP`)
                  }}
                  className="h-4 w-4 flex-shrink-0 rounded-[4px] border transition-colors hover:bg-white/[0.05]"
                  style={{
                    borderColor:
                      t.priority === 'crit' ? 'var(--rose)' : t.priority === 'high' ? 'var(--amber)' : 'var(--border)',
                  }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.8 }}
                />
                <span className="flex-1 text-[13px] text-[var(--text-mid)]">{t.text}</span>
                <button
                  type="button"
                  className="shrink-0 text-[12px] text-[var(--text-secondary)] hover:underline"
                  onClick={() => onSkipTask?.(t.id)}
                >
                  Skip
                </button>
              </div>
            ))}
            {sortedTasks.length === 0 && <p className="text-[13px] italic text-[var(--text-dim)]">No tasks</p>}
          </div>
          <Link
            href="/tasks"
            className="mt-5 block w-full rounded-xl border border-[var(--border)] py-3 text-center text-[13px] font-semibold text-[var(--accent)]"
          >
            View full page →
          </Link>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  </div>
</motion.div>
      )
    case 'clients': {
      const activeClients = clients.filter((c) => c.active)
      return (
        <Drawer.Root>
          <Drawer.Trigger asChild>
            <motion.div className="card w-full cursor-pointer rounded-[16px] p-5" {...cardAnim(0.44)}>
              <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Clients</span>
              <p className="mt-1 text-[11px] text-[var(--text-dim)]">Business overview · tap</p>
              {activeClients.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {activeClients.slice(0, 6).map((c) => {
                    const biz = businesses.find((b) => b.id === (c as { businessId?: string }).businessId)
                    return (
                      <div key={c.id} className="flex items-center justify-between text-[12px]">
                        <span className="mr-2 flex min-w-0 items-center gap-2 font-medium text-[var(--text)]">
                          {biz && (
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ background: biz.color || 'var(--accent)' }}
                            />
                          )}
                          <span className="truncate">{c.name}</span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="data text-[var(--accent)]">${Math.round(getClientNet(c)).toLocaleString()}</span>
                          <span className="text-[var(--text-dim)]">{c.serviceType}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-3 text-[12px] italic text-[var(--text-dim)]">No active clients</p>
              )}
            </motion.div>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
            <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50 max-h-[88vh] overflow-y-auto`}>
              <DrawerDragHandle />
              <Drawer.Title className="mb-2 text-lg font-semibold text-[var(--text-primary)]">Clients</Drawer.Title>
              <p className="mb-3 text-[13px] text-[var(--text-secondary)]">
                Revenue clients across businesses — edit on the full page.
              </p>
              {activeClients.length > 0 ? (
                <div className="space-y-2">
                  {activeClients.map((c) => {
                    const biz = businesses.find((b) => b.id === (c as { businessId?: string }).businessId)
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-3 py-2.5 text-[13px]"
                      >
                        <span className="flex min-w-0 items-center gap-2 font-medium text-[var(--text)]">
                          {biz && (
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ background: biz.color || 'var(--accent)' }}
                            />
                          )}
                          <span className="truncate">{c.name}</span>
                        </span>
                        <span className="data shrink-0 text-[var(--accent)]">
                          ${Math.round(getClientNet(c)).toLocaleString()}/mo
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[14px] text-[var(--text-dim)]">No active clients yet.</p>
              )}
              <Link
                href="/clients"
                className="mt-5 block w-full rounded-xl border border-[var(--border)] py-3 text-center text-[13px] font-semibold text-[var(--accent)]"
              >
                View full page →
              </Link>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )
    }
    case 'habits': {
      const habitDrawerOpen = x.habitDrawerOpen as boolean
      const setHabitDrawerOpen = x.setHabitDrawerOpen as (v: boolean) => void
      const habitDoneToday = x.habitDoneToday as number
      const habitTotalToday = x.habitTotalToday as number
      const mini = [
        { k: 'gym', e: '💪', ok: todayHealth.gym },
        { k: 'diet', e: '🍎', ok: todayHealth.mealQuality === 'good' },
        { k: 'sleep', e: '😴', ok: !!(todayHealth.sleepTime && todayHealth.wakeTime) },
        { k: 'screen', e: '📱', ok: todayHealth.screenTimeHours > 0 },
        { k: 'water', e: '💧', ok: (todayHealth.waterGlasses ?? 0) >= 8 },
      ]
      return (
        <Drawer.Root open={habitDrawerOpen} onOpenChange={setHabitDrawerOpen}>
          <Drawer.Trigger asChild>
            <motion.div
              className="w-full cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5"
              {...cardAnim(0.19)}
            >
              <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Habits</span>
              <div className="data mt-2" style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>
                {habitDoneToday}
                <span className="text-[14px] text-[var(--text-dim)]">/{habitTotalToday}</span>
              </div>
              <p className="text-[11px] text-[var(--text-mid)]">today</p>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {mini.map((m) => (
                  <div
                    key={m.k}
                    className="relative flex aspect-square flex-col items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface2)] text-[20px]"
                  >
                    <span>{m.e}</span>
                    {m.ok && (
                      <span className="absolute right-1 top-1 text-[10px] text-[var(--positive)]">✓</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </Drawer.Trigger>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
            <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50`}>
              <DrawerDragHandle />
              <Drawer.Title className="mb-2 text-lg font-semibold text-[var(--text-primary)]">Habits</Drawer.Title>
              <HabitsDetailDrawerContent todayStr={todayStr} />
              <Link
                href="/health#habits"
                className="mt-4 block w-full rounded-xl border border-[var(--border)] py-3 text-center text-[13px] font-semibold text-[var(--accent)]"
              >
                View full page →
              </Link>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )
    }
    case 'gmb':
      return (
<motion.div className="card rounded-[16px] p-5 w-full cursor-pointer" {...cardAnim(0.48)} >
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
      )
    default:
      return null
  }
}
