'use client'

import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'

function formatWeek(start: string) {
  const s = new Date(start)
  const e = new Date(s); e.setDate(e.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(s)} - ${fmt(e)}`
}

export default function SprintPage() {
  const { sprints } = useStore()

  const totalDeliverables = sprints.reduce((s, sp) => s + sp.deliverables.length, 0)
  const totalDone = sprints.reduce((s, sp) => s + sp.deliverables.filter((d) => d.done).length, 0)
  const overallPct = totalDeliverables > 0 ? Math.round((totalDone / totalDeliverables) * 100) : 0

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 pb-20">
        <StaggerItem>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            90-Day Sprint Planner
          </h1>
        </StaggerItem>

        {/* Overall progress */}
        <StaggerItem>
          <motion.div whileHover={{ y: -2 }} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="label text-[10px] tracking-widest text-[var(--accent)]">OVERALL PROGRESS</span>
              <span className="data text-sm font-semibold text-[var(--accent)]">{overallPct}%</span>
            </div>
            <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--accent)]"
                initial={{ width: 0 }}
                animate={{ width: `${overallPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--text-dim)]">{totalDone} of {totalDeliverables} deliverables complete</p>
          </motion.div>
        </StaggerItem>

        {/* Sprints */}
        {sprints.map((sprint) => {
          const done = sprint.deliverables.filter((d) => d.done).length
          const pct = sprint.deliverables.length > 0 ? Math.round((done / sprint.deliverables.length) * 100) : 0
          const isActive = sprint.status === 'active'
          return (
            <StaggerItem key={sprint.id}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`card p-4 ${
                  isActive
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                    : sprint.status === 'completed'
                    ? 'border-[var(--accent)]/30'
                    : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="label text-xs font-semibold text-[var(--text)]">
                      Sprint {sprint.sprintNumber}
                    </span>
                    {isActive && (
                      <span className="ml-2 rounded-lg bg-[var(--accent)]/20 px-2 py-0.5 text-[10px] font-semibold text-[var(--accent)]">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-dim)]">{formatWeek(sprint.weekStart)}</span>
                </div>

                {/* Progress bar */}
                <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden mb-2">
                  <motion.div
                    className="h-full rounded-full bg-[var(--accent)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>

                {/* Deliverables */}
                <div className="space-y-1.5">
                  {sprint.deliverables.map((d, di) => (
                    <label key={di} className="flex items-center gap-2.5 cursor-pointer">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        d.done ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)]'
                      }`}>
                        {d.done && <span className="text-[var(--bg)] text-[10px]">&#10003;</span>}
                      </div>
                      <span className={`text-sm ${d.done ? 'line-through text-[var(--text-dim)]' : 'text-[var(--text)]'}`}>
                        {d.text}
                      </span>
                    </label>
                  ))}
                </div>
              </motion.div>
            </StaggerItem>
          )
        })}

        {sprints.length === 0 && (
          <StaggerItem>
            <p className="text-center text-sm text-[var(--text-dim)] py-10">No sprints defined yet.</p>
          </StaggerItem>
        )}
      </StaggerContainer>
    </PageTransition>
  )
}
