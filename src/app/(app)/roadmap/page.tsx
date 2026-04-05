'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  addDays,
  differenceInCalendarDays,
  isValid,
  max as dfmax,
  min as dfmin,
  parseISO,
  startOfDay,
} from 'date-fns'
import { Drawer } from 'vaul'
import { DRAWER_CONTENT_CLASS, DrawerDragHandle } from '@/components/ui/drawer-primitives'
import { motion } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import { useStore, isArchived, type Project, type Task } from '@/stores/store'

type Horizon = '90d' | '6mo' | '12mo'

const HORIZON_DAYS: Record<Horizon, number> = {
  '90d': 90,
  '6mo': 183,
  '12mo': 365,
}

function parseDay(s?: string): Date | null {
  if (!s) return null
  const d = parseISO(s.length <= 10 ? `${s}T12:00:00` : s)
  return isValid(d) ? startOfDay(d) : null
}

function projectStart(p: Project): Date {
  return parseDay(p.startDate) ?? parseDay(p.createdAt.split('T')[0]) ?? startOfDay(new Date())
}

function projectTasks(tasks: Task[], projectId: string) {
  return tasks.filter((t) => !isArchived(t) && t.projectId === projectId)
}

function projectedEndDate(project: Project, tasks: Task[], today: Date): Date {
  const start = projectStart(project)
  const daysElapsed = Math.max(1, differenceInCalendarDays(today, start))
  const pt = projectTasks(tasks, project.id)
  const done = pt.filter((t) => t.done).length
  const open = pt.filter((t) => !t.done).length
  if (pt.length > 0) {
    const v = done / daysElapsed
    if (open === 0) return parseDay(project.deadline) ?? addDays(today, 0)
    if (v > 0) return addDays(today, Math.ceil(open / v))
  }
  if (project.progress > 0) {
    const impliedTotalDays = daysElapsed / Math.max(project.progress / 100, 0.01)
    const remaining = impliedTotalDays - daysElapsed
    return addDays(today, Math.max(0, Math.ceil(remaining)))
  }
  return addDays(today, 45)
}

export default function RoadmapPage() {
  const { projects, tasks, goals, businesses } = useStore()
  const [horizon, setHorizon] = useState<Horizon>('90d')
  const [openProject, setOpenProject] = useState<Project | null>(null)

  const { windowStart, windowEnd, totalMs, today, todayX } = useMemo(() => {
    const t = startOfDay(new Date())
    const past = 21
    const ws = addDays(t, -past)
    const we = addDays(t, HORIZON_DAYS[horizon])
    const tot = we.getTime() - ws.getTime()
    const tx = ((t.getTime() - ws.getTime()) / tot) * 100
    return { windowStart: ws, windowEnd: we, totalMs: tot, today: t, todayX: tx }
  }, [horizon])

  const bizColor = (businessId?: string) =>
    businesses.find((b) => b.id === businessId && !isArchived(b))?.color ?? 'var(--accent)'

  const layout = useMemo(() => {
    const rows: {
      kind: 'project'
      project: Project
      left: number
      width: number
      color: string
      openEnded: boolean
      projectedEnd: Date
    }[] = []

    for (const p of projects.filter((x) => !isArchived(x) && x.status !== 'complete')) {
      const start = projectStart(p)
      const deadline = parseDay(p.deadline)
      const projEnd = projectedEndDate(p, tasks, today)
      const end = deadline ?? projEnd
      const barStart = dfmax([start, windowStart])
      const barEnd = dfmin([dfmax([end, start]), windowEnd])
      if (barEnd < windowStart || barStart > windowEnd || barEnd <= barStart) continue
      const left = ((barStart.getTime() - windowStart.getTime()) / totalMs) * 100
      const width = Math.max(
        0.8,
        ((barEnd.getTime() - barStart.getTime()) / totalMs) * 100
      )
      rows.push({
        kind: 'project',
        project: p,
        left,
        width,
        color: bizColor(p.businessId),
        openEnded: !p.deadline,
        projectedEnd: projEnd,
      })
    }

    const milestones: { goalId: string; title: string; left: number; cycleEnd: Date }[] = []
    for (const g of goals) {
      if (g.linkedProjectIds.length > 0) continue
      const ce = parseDay(g.cycleEnd)
      if (!ce || ce < windowStart || ce > windowEnd) continue
      const left = ((ce.getTime() - windowStart.getTime()) / totalMs) * 100
      milestones.push({ goalId: g.id, title: g.title, left, cycleEnd: ce })
    }

    return { rows, milestones }
  }, [projects, tasks, goals, today, windowStart, windowEnd, totalMs, businesses])

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-5 pb-24">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="page-title">Roadmap</h1>
            <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
              Gantt-style horizon — bars use business colors; dashed = no deadline (velocity projection).
            </p>
          </div>
          <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1">
            {(['90d', '6mo', '12mo'] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizon(h)}
                className={`rounded-lg px-3 py-2 text-[12px] font-semibold uppercase tracking-wide transition-colors ${
                  horizon === h
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)]'
                    : 'text-[var(--text-dim)] hover:text-[var(--text)]'
                }`}
              >
                {h === '90d' ? '90 days' : h === '6mo' ? '6 months' : '12 months'}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <div className="mb-2 flex justify-between text-[11px] text-[var(--text-dim)]">
            <span>{windowStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            <span>Today</span>
            <span>{windowEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>

          <div className="relative h-[min(420px,60vh)] min-h-[200px] overflow-hidden rounded-xl bg-[var(--bg-secondary)]">
            {/* Today marker */}
            <div
              className="absolute top-0 bottom-0 z-20 w-px bg-rose-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]"
              style={{ left: `${todayX}%` }}
            />
            <div
              className="absolute z-20 -translate-x-1/2 rounded bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white"
              style={{ left: `${todayX}%`, top: 4 }}
            >
              Today
            </div>

            {/* Milestones (goals without projects) */}
            {layout.milestones.map((m) => (
              <button
                key={m.goalId}
                type="button"
                title={m.title}
                className="absolute z-10 -translate-x-1/2 cursor-pointer"
                style={{ left: `${m.left}%`, top: 12 }}
                onClick={() => {}}
              >
                <span className="block h-3 w-3 rotate-45 border-2 border-[var(--warning)] bg-[var(--warning)]/30" />
              </button>
            ))}

            {/* Project bars */}
            <div className="absolute inset-0 pt-10 pb-2">
              {layout.rows.map((row, i) => (
                <motion.button
                  key={row.project.id}
                  type="button"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="absolute flex h-9 items-center rounded-md px-2 text-left text-[11px] font-semibold text-white shadow-md"
                  style={{
                    left: `${row.left}%`,
                    width: `${row.width}%`,
                    top: 8 + i * 44,
                    background: row.color,
                    borderStyle: row.openEnded ? 'dashed' : 'solid',
                    borderWidth: row.openEnded ? 2 : 0,
                    borderColor: 'var(--border-hover)',
                    opacity: row.openEnded ? 0.92 : 1,
                  }}
                  onClick={() => setOpenProject(row.project)}
                >
                  <span className="truncate">{row.project.name}</span>
                </motion.button>
              ))}
            </div>

            {layout.rows.length === 0 && layout.milestones.length === 0 && (
              <div className="flex h-full items-center justify-center p-6 text-center text-[15px] text-[var(--text-secondary)]">
                No active projects in this window. Add projects from{' '}
                <Link href="/projects" className="ml-1 text-[var(--accent)] underline">
                  Projects
                </Link>
                .
              </div>
            )}
          </div>
        </div>

        <p className="text-[12px] text-[var(--text-tertiary)]">
          ◆ Milestones = 12-week goals with no linked project (at cycle end). Tap a bar for velocity and dates.
        </p>

        <Drawer.Root open={openProject !== null} onOpenChange={(o) => !o && setOpenProject(null)}>
          <Drawer.Portal>
            <Drawer.Overlay className="fixed inset-0 z-50 bg-black/60" />
            <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-50`}>
              <DrawerDragHandle />
              {openProject && (
                <>
                  <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)]">
                    {openProject.name}
                  </Drawer.Title>
                  <p className="mt-2 text-[15px] text-[var(--text-secondary)]">{openProject.description || '—'}</p>
                  <dl className="mt-4 space-y-2 text-[14px]">
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--text-dim)]">Progress</dt>
                      <dd className="data font-mono text-[var(--text-primary)]">{openProject.progress}%</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--text-dim)]">Start</dt>
                      <dd className="font-mono text-[var(--text-primary)]">
                        {projectStart(openProject).toLocaleDateString()}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--text-dim)]">Deadline</dt>
                      <dd className="font-mono text-[var(--text-primary)]">
                        {openProject.deadline ? parseISO(openProject.deadline).toLocaleDateString() : 'None (open)'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--text-dim)]">Velocity projected end</dt>
                      <dd className="font-mono text-[var(--accent)]">
                        {projectedEndDate(openProject, tasks, today).toLocaleDateString()}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-[var(--text-dim)]">Tasks linked</dt>
                      <dd className="font-mono text-[var(--text-primary)]">
                        {projectTasks(tasks, openProject.id).length}
                      </dd>
                    </div>
                  </dl>
                  <Link
                    href="/projects"
                    className="mt-5 inline-flex rounded-xl bg-[var(--accent)] px-4 py-2.5 text-[14px] font-semibold text-white"
                    onClick={() => setOpenProject(null)}
                  >
                    Open Projects
                  </Link>
                </>
              )}
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      </div>
    </PageTransition>
  )
}
