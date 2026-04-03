'use client'

import { useStore } from '@/stores/store'

function formatWeek(start: string) {
  const s = new Date(start)
  const e = new Date(s); e.setDate(e.getDate() + 6)
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(s)} - ${fmt(e)}`
}

export default function SprintPage() {
  const { sprints } = useStore()
  let ai = 0

  const totalDeliverables = sprints.reduce((s, sp) => s + sp.deliverables.length, 0)
  const totalDone = sprints.reduce((s, sp) => s + sp.deliverables.filter((d) => d.done).length, 0)
  const overallPct = totalDeliverables > 0 ? Math.round((totalDone / totalDeliverables) * 100) : 0

  return (
    <div className="space-y-6 pb-24">
      <h1 className="animate-in text-2xl font-bold text-[var(--text)]" style={{ animationDelay: `${0.05 * ai++}s` }}>
        90-Day Sprint Planner
      </h1>

      {/* Overall progress */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="label text-[10px] tracking-widest text-[var(--accent)]">OVERALL PROGRESS</span>
          <span className="data text-sm font-semibold text-[var(--accent)]">{overallPct}%</span>
        </div>
        <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${overallPct}%` }} />
        </div>
        <p className="mt-2 text-xs text-[var(--text-dim)]">{totalDone} of {totalDeliverables} deliverables complete</p>
      </div>

      {/* Sprints */}
      {sprints.map((sprint, idx) => {
        const done = sprint.deliverables.filter((d) => d.done).length
        const pct = sprint.deliverables.length > 0 ? Math.round((done / sprint.deliverables.length) * 100) : 0
        const isActive = sprint.status === 'active'
        return (
          <div
            key={sprint.id}
            className={`animate-in rounded-lg border p-5 ${
              isActive
                ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                : sprint.status === 'completed'
                ? 'border-[var(--accent)]/30 bg-[var(--surface)]'
                : 'border-[var(--border)] bg-[var(--surface)]'
            }`}
            style={{ animationDelay: `${0.05 * (ai + idx)}s` }}
          >
            <div className="flex items-center justify-between mb-3">
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
            <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden mb-3">
              <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${pct}%` }} />
            </div>

            {/* Deliverables */}
            <div className="space-y-2">
              {sprint.deliverables.map((d, di) => (
                <label key={di} className="flex items-center gap-3 cursor-pointer">
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
          </div>
        )
      })}

      {sprints.length === 0 && (
        <p className="text-center text-sm text-[var(--text-dim)] py-12">No sprints defined yet.</p>
      )}
    </div>
  )
}
