import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const pagePath = path.join(root, 'src/app/(app)/dashboard/page.tsx')
const outPath = path.join(root, 'src/app/(app)/dashboard/dashboard-tile-render.tsx')

const s = fs.readFileSync(pagePath, 'utf8')

function stripGridIndent(src) {
  return src
    .split('\n')
    .map((line) => (line.startsWith('          ') ? line.slice(10) : line))
    .join('\n')
}

function fixSpans(src) {
  return src
    .replace(/className="col-span-12"/g, 'className="w-full"')
    .replace(/className="col-span-6 md:col-span-3 /g, 'className="w-full ')
    .replace(/className="col-span-12 flex /g, 'className="w-full flex ')
    .replace(/className="card rounded-\[16px\] p-5 col-span-12 /g, 'className="card rounded-[16px] p-5 w-full ')
    .replace(/className="card rounded-\[16px\] p-5 col-span-12 md:col-span-5 /g, 'className="card rounded-[16px] p-5 w-full ')
    .replace(/className="card rounded-\[16px\] p-5 col-span-12 md:col-span-7 /g, 'className="card rounded-[16px] p-5 w-full ')
    .replace(/className="card-urgent rounded-\[16px\] p-5 col-span-12 md:col-span-5 /g, 'className="card-urgent rounded-[16px] p-5 w-full ')
    .replace(/className="col-span-12 cursor-pointer /g, 'className="w-full cursor-pointer ')
}

/** Slice inclusive start, exclusive end — both must exist */
function sliceBetween(label, a, b) {
  const i0 = s.indexOf(a)
  const i1 = s.indexOf(b)
  if (i0 < 0 || i1 < 0 || i1 <= i0) {
    throw new Error(`sliceBetween ${label}: ${i0} ${i1}`)
  }
  return stripGridIndent(fixSpans(s.slice(i0, i1)))
}

const morningInner = sliceBetween(
  'morning',
  '{isMorning && (',
  '\n\n          {/* ── ROW 1: THE ONE THING'
).replace(/^\{isMorning && \(\s*\n/, '').replace(/\n\)\}\s*$/, '')

const oneThing = sliceBetween(
  'one_thing',
  '{/* ── ROW 1: THE ONE THING ── */}',
  '\n\n          {/* ── ROW 2: 4 METRIC CARDS ── */}'
)

const netIncome = sliceBetween('net', '{/* NET INCOME */}', '{/* EXECUTION SCORE */}')
const execution = sliceBetween('exec', '{/* EXECUTION SCORE */}', '{/* ENERGY */}')
const energy = sliceBetween('energy', '{/* ENERGY */}', '{/* PRAYERS */}')
const prayers = sliceBetween('prayers', '{/* PRAYERS */}', '\n\n          {/* Life expectancy')

const lifeHorizon = sliceBetween(
  'life',
  '{/* Life expectancy (PRD §9.14)',
  '\n\n          {/* ── ROW 3: SCHEDULE TIMELINE ── */}'
)

const schedule = sliceBetween(
  'schedule',
  '{/* ── ROW 3: SCHEDULE TIMELINE ── */}',
  '\n\n          {/* ── ROW 4: ACTIVE PROJECTS + ALERTS ── */}'
)

const activeProjects = sliceBetween(
  'projects',
  '{/* ── ROW 4: ACTIVE PROJECTS + ALERTS ── */}',
  '\n\n          {/* ALERTS & INSIGHTS'
)

const aiInsights = sliceBetween(
  'ai',
  '{/* ALERTS & INSIGHTS — PRD §8.3 inbox */}',
  '\n\n          {/* ── ROW 5: COST OF INACTION + DAYS + TASKS ── */}'
)

const costInaction = sliceBetween(
  'cost',
  '{/* ── ROW 5: COST OF INACTION + DAYS + TASKS ── */}',
  '\n\n          <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-7 cursor-pointer"'
)

const daysTasks = sliceBetween(
  'days',
  '<motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-7 cursor-pointer" {...cardAnim(0.4)}',
  '\n\n          {/* ── ROW 6: CLIENT TABLE + GMB GRID ── */}'
)

const clients = sliceBetween(
  'clients',
  '{/* ── ROW 6: CLIENT TABLE + GMB GRID ── */}',
  '\n\n          <motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-6 cursor-pointer" {...cardAnim(0.48)}'
)

const gmb = sliceBetween(
  'gmb',
  '<motion.div className="card rounded-[16px] p-5 col-span-12 md:col-span-6 cursor-pointer" {...cardAnim(0.48)}',
  '\n\n        </div>\n\n        {/* ── ROW 7: QUICK CAPTURE'
)

const header = `'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Drawer } from 'vaul'
import { AreaChart, Area, LineChart, Line, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import type { HealthLog, Priority } from '@/stores/store'
import { XP_VALUES } from '@/lib/constants'
import { applyTaskDollarEstimateAfterCreate } from '@/lib/task-dollar-client'
import EveningVoiceReview from '@/components/EveningVoiceReview'
import type { LifeExpectancyResult } from '@/lib/life-expectancy'

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
  const router = x.router as ReturnType<typeof useRouter>
  const isMorning = x.isMorning as boolean
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
  const prayerTimes12 = x.prayerTimes12 as Record<string, string> | null | undefined
  const togglePrayer = x.togglePrayer as (p: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') => void
  const lifeY = x.lifeY as number
  const lifeD = x.lifeD as number
  const lifeH = x.lifeH as number
  const lifeM = x.lifeM as number
  const lifeS = x.lifeS as number
  const lifeRemainingSec = x.lifeRemainingSec as number
  const lifeModel = x.lifeModel as LifeExpectancyResult
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
  const costOfInaction = x.costOfInaction as { total: number; items: { label: string; amount: number }[] }
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

  switch (tileId) {
`

const cases = `
    case 'morning_brief': {
      if (!isMorning && !editMode) {
        return (
          <div className="w-full rounded-2xl border border-[var(--border)] border-dashed bg-[var(--bg-secondary)]/40 p-6 text-center text-[14px] text-[var(--text-secondary)]">
            Morning briefing appears before 2 PM. Use Customize to reorder this tile.
          </div>
        )
      }
      return (
${morningInner}
      )
    }
    case 'one_thing':
      return (
${oneThing}
      )
    case 'net_income':
      return (
${netIncome}
      )
    case 'execution':
      return (
${execution}
      )
    case 'energy':
      return (
${energy}
      )
    case 'prayers':
      return (
${prayers}
      )
    case 'life_horizon':
      return (
${lifeHorizon}
      )
    case 'schedule':
      return (
${schedule}
      )
    case 'active_projects':
      return (
${activeProjects}
      )
    case 'ai_insights':
      return (
${aiInsights}
      )
    case 'cost_inaction':
      return (
${costInaction}
      )
    case 'days_tasks':
      return (
${daysTasks}
      )
    case 'clients':
      return (
${clients}
      )
    case 'gmb':
      return (
${gmb}
      )
    default:
      return null
  }
}
`

const out = header + cases
fs.writeFileSync(outPath, out)
console.log('Wrote', outPath, 'bytes', out.length)
