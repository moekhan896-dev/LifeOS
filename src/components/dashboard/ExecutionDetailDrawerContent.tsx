'use client'

import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { HealthLog } from '@/stores/store'
import {
  getExecutionScoreBreakdown,
  getScoreZone,
  type ExecutionScoreBreakdown,
} from '@/stores/store'

function RowBar({
  label,
  earned,
  max,
  color = 'var(--accent)',
}: {
  label: string
  earned: number
  max: number
  color?: string
}) {
  const pct = max > 0 ? Math.min(100, (earned / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[12px] text-[var(--text-secondary)]">
        <span>{label}</span>
        <span className="font-mono tabular-nums text-[var(--text-primary)]">
          {earned.toFixed(1)} / {max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-sm bg-[var(--bg-secondary)]">
        <div className="h-full rounded-sm transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export interface ExecutionDetailDrawerContentProps {
  executionScore: number
  todayHealth: HealthLog
  tasksDoneToday: number
  tasksCommitted: number
  todayFocusSessions: number
  trackPrayers: boolean
  healthHistory: HealthLog[]
  todayStr: string
}

export default function ExecutionDetailDrawerContent(p: ExecutionDetailDrawerContentProps) {
  const breakdown: ExecutionScoreBreakdown = useMemo(
    () =>
      getExecutionScoreBreakdown(
        p.todayHealth,
        p.tasksCommitted,
        p.tasksDoneToday,
        p.todayFocusSessions,
        p.trackPrayers
      ),
    [
      p.todayHealth,
      p.tasksCommitted,
      p.tasksDoneToday,
      p.todayFocusSessions,
      p.trackPrayers,
    ]
  )

  const zone = getScoreZone(p.executionScore)

  const trend7 = useMemo(() => {
    const days = [...p.healthHistory]
      .filter((h) => h.date && typeof h.dailyScore === 'number')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7)
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days.map((h) => ({
      day: h.date.slice(5),
      label: labels[new Date(h.date + 'T12:00:00').getDay()] ?? h.date,
      score: h.dailyScore,
      date: h.date,
    }))
  }, [p.healthHistory])

  return (
    <div className="space-y-6 pb-4">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
          Today&apos;s execution score
        </p>
        <p className="mt-1 text-[36px] font-bold tabular-nums" style={{ color: zone.color }}>
          {p.executionScore}
          <span className="text-[16px] text-[var(--text-tertiary)]">/100</span>
        </p>
        <p className="text-[13px] text-[var(--text-secondary)]">
          {zone.emoji} {zone.label}
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/30 p-4">
        <p className="text-[13px] font-semibold text-[var(--text-secondary)]">Score formula</p>
        <RowBar
          label={breakdown.commitment.label}
          earned={breakdown.commitment.earned}
          max={breakdown.commitment.max}
        />
        <div className="space-y-2">
          <p className="text-[12px] font-medium text-[var(--text-tertiary)]">Energy</p>
          {breakdown.energy.parts.map((part) => (
            <RowBar key={part.label} label={part.label} earned={part.earned} max={part.max} color="var(--info)" />
          ))}
          <RowBar label="Energy (total)" earned={breakdown.energy.earned} max={breakdown.energy.max} />
        </div>
        <RowBar
          label={`Focus (${breakdown.focus.sessions} session${breakdown.focus.sessions === 1 ? '' : 's'} today)`}
          earned={breakdown.focus.earned}
          max={breakdown.focus.max}
          color="var(--warning)"
        />
        {breakdown.faith ? (
          <RowBar
            label={`Faith (${breakdown.faith.prayersLogged}/5 prayers)`}
            earned={breakdown.faith.earned}
            max={breakdown.faith.max}
            color="var(--spiritual)"
          />
        ) : (
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Faith component omitted — prayer tracking is off (remaining pillars scaled to 100).
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-[13px] font-semibold text-[var(--text-secondary)]">7-day score trend</p>
        <div style={{ height: 140 }}>
          {trend7.length === 0 ? (
            <p className="text-[13px] text-[var(--text-tertiary)]">Log a few days to see your trend.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend7}>
                <defs>
                  <linearGradient id="execTrendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-[12px]">
                        <p className="font-mono text-[var(--accent)]">{payload[0].payload.date}</p>
                        <p>Score: {payload[0].value}</p>
                      </div>
                    ) : null
                  }
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  fill="url(#execTrendFill)"
                  dot={(props: { cx?: number; cy?: number; payload?: { date?: string } }) => {
                    const { cx, cy, payload } = props
                    if (cx == null || cy == null) return null
                    const r = payload?.date === p.todayStr ? 5 : 3
                    return <circle cx={cx} cy={cy} r={r} fill="var(--accent)" />
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <p className="text-center text-[12px] text-[var(--text-tertiary)]">
        Components mirror the live execution algorithm (§19 / GAP 12).
      </p>
    </div>
  )
}
