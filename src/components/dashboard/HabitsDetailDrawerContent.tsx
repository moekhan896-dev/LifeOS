'use client'

import { useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { useStore, type CustomHabitDef, type HealthLog } from '@/stores/store'

const GYM_TYPES = ['Strength', 'Cardio', 'Sport', 'Walk', 'Other'] as const
const SCREEN_CHIPS: HealthLog['screenCategory'][] = ['social', 'youtube', 'games', 'productive']

function sleepHours(sleep?: string, wake?: string) {
  if (!sleep || !wake) return null
  const [sh, sm] = sleep.split(':').map(Number)
  const [wh, wm] = wake.split(':').map(Number)
  if ([sh, sm, wh, wm].some((n) => Number.isNaN(n))) return null
  let a = sh * 60 + sm
  let b = wh * 60 + wm
  if (b < a) b += 24 * 60
  return Math.round(((b - a) / 60) * 10) / 10
}

function habitHeatmap(
  history: HealthLog[],
  todayStr: string,
  pick: (h: HealthLog) => boolean
) {
  const out: { date: string; ok: boolean; isToday: boolean }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const log = history.find((h) => h.date === ds)
    const ok = log ? pick(log) : false
    out.push({ date: ds, ok, isToday: ds === todayStr })
  }
  return out
}

function aiLine(history: HealthLog[], tasks: { done: boolean; completedAt?: string }[], pick: (h: HealthLog) => boolean) {
  const days = history.filter((h) => h.date && typeof h.dailyScore === 'number')
  if (days.length < 14) return null
  let onSum = 0
  let onN = 0
  let offSum = 0
  let offN = 0
  for (const h of days) {
    const done = tasks.filter((t) => t.done && t.completedAt?.startsWith(h.date)).length
    if (pick(h)) {
      onSum += done
      onN++
    } else {
      offSum += done
      offN++
    }
  }
  if (onN < 3 || offN < 3) return null
  return { on: onSum / onN, off: offSum / offN }
}

interface RowProps {
  title: string
  emoji: string
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

function HabitRow({ title, emoji, expanded, onToggle, children, footer }: RowProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/30 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-[16px]">
          <span className="mr-2">{emoji}</span>
          <span className="font-semibold text-[var(--text-primary)]">{title}</span>
        </span>
        <span className="text-[var(--text-tertiary)]">{expanded ? '▼' : '▶'}</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[var(--border)] px-4 py-3 space-y-4"
          >
            {children}
            {footer ?? null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HabitsDetailDrawerContent({ todayStr }: { todayStr: string }) {
  const {
    todayHealth,
    updateHealth,
    healthHistory,
    tasks,
    streaks,
    customHabits,
    addCustomHabit,
  } = useStore()
  const [expanded, setExpanded] = useState<string | null>('gym')
  const [privateOpen, setPrivateOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('✨')
  const [newType, setNewType] = useState<CustomHabitDef['loggingType']>('boolean')
  const [newPrivate, setNewPrivate] = useState(false)

  const publicCustom = customHabits.filter((c) => !c.private).sort((a, b) => a.order - b.order)
  const privateCustom = customHabits.filter((c) => c.private).sort((a, b) => a.order - b.order)

  const doneBuiltIn = useMemo(() => {
    let n = 0
    if (todayHealth.gym) n++
    if (todayHealth.mealQuality === 'good') n++
    if (todayHealth.sleepTime && todayHealth.wakeTime) n++
    if (todayHealth.screenTimeHours > 0) n++
    if ((todayHealth.waterGlasses ?? 0) >= 8) n++
    return n
  }, [todayHealth])

  const totalTracked = 5 + publicCustom.length

  const streak = (key: string) => streaks.find((s) => s.habit === key)

  const setCustomVal = (id: string, v: string | number | boolean | null) => {
    const next = { ...(todayHealth.customHabitLog ?? {}), [id]: v }
    updateHealth({ customHabitLog: next })
  }

  const trendGradId = useId().replace(/:/g, '')

  const renderTrend = (suffix: string, label: string, data: { day: string; v: number }[]) => {
    const gid = `${trendGradId}-${suffix}`
    return (
      <div>
        <p className="mb-1 text-[11px] text-[var(--text-tertiary)]">{label}</p>
        <div style={{ height: 100 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--text-tertiary)' }} />
              <Tooltip />
              <Area type="monotone" dataKey="v" stroke="var(--accent)" fill={`url(#${gid})`} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  const scoreTrend = useMemo(() => {
    return [...healthHistory]
      .filter((h) => h.date && typeof h.dailyScore === 'number')
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map((h) => ({ day: h.date.slice(8), v: h.dailyScore }))
  }, [healthHistory])

  const gymAi = useMemo(
    () => aiLine(healthHistory, tasks, (h) => h.gym),
    [healthHistory, tasks]
  )

  return (
    <div className="space-y-3 pb-6">
      <p className="text-[12px] text-[var(--text-dim)]">
        {doneBuiltIn + publicCustom.filter((c) => todayHealth.customHabitLog?.[c.id]).length}/{totalTracked} habits
        logged today (built-in + visible custom).
      </p>

      {streaks.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-3">
          <p className="mb-2 text-[12px] font-semibold text-[var(--text-secondary)]">Streaks</p>
          <ul className="space-y-1.5">
            {streaks.map((s) => (
              <li key={s.habit} className="flex items-center justify-between text-[13px]">
                <span className="capitalize text-[var(--text-primary)]">{s.habit}</span>
                <span className="font-mono text-[var(--accent)]">
                  {s.currentStreak}d{' '}
                  <span className="text-[12px] text-[var(--text-dim)]">(best {s.longestStreak})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <HabitRow
        emoji="💪"
        title="Gym"
        expanded={expanded === 'gym'}
        onToggle={() => setExpanded((e) => (e === 'gym' ? null : 'gym'))}
        footer={
          <>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div>
                <span className="text-[var(--text-tertiary)]">Current streak</span>
                <p className="font-mono text-[var(--accent)]">{streak('gym')?.currentStreak ?? 0}d</p>
              </div>
              <div>
                <span className="text-[var(--text-tertiary)]">Best</span>
                <p className="font-mono">{streak('gym')?.longestStreak ?? 0}d</p>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {habitHeatmap(healthHistory, todayStr, (h) => h.gym).map((c) => (
                <div
                  key={c.date}
                  className="aspect-square rounded-sm"
                  style={{
                    background: c.ok ? 'color-mix(in srgb, var(--accent) 45%, transparent)' : 'var(--surface2)',
                    boxShadow: c.isToday ? '0 0 0 1px var(--accent)' : undefined,
                  }}
                />
              ))}
            </div>
            {gymAi && (
              <p className="text-[12px] text-[var(--text-secondary)]">
                On gym days, task completion averages {gymAi.on.toFixed(1)} vs {gymAi.off.toFixed(1)} when skipped.
              </p>
            )}
            {renderTrend('gym', 'Daily score (30d)', scoreTrend)}
          </>
        }
      >
        <label className="flex items-center gap-2 text-[14px]">
          <input
            type="checkbox"
            checked={todayHealth.gym}
            onChange={() => updateHealth({ gym: !todayHealth.gym })}
          />
          Done today
        </label>
        <div>
          <p className="text-[11px] text-[var(--text-tertiary)] mb-1">Type</p>
          <select
            value={todayHealth.gymType ?? ''}
            onChange={(e) => updateHealth({ gymType: e.target.value })}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[14px]"
          >
            <option value="">Select…</option>
            {GYM_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-[11px] text-[var(--text-tertiary)] mb-1">Duration {todayHealth.gymDurationMin ?? 30} min</p>
          <input
            type="range"
            min={15}
            max={120}
            step={5}
            value={todayHealth.gymDurationMin ?? 30}
            onChange={(e) => updateHealth({ gymDurationMin: parseInt(e.target.value, 10) })}
            className="w-full"
          />
        </div>
        <textarea
          value={todayHealth.gymNotes ?? ''}
          onChange={(e) => updateHealth({ gymNotes: e.target.value })}
          placeholder="Notes"
          rows={2}
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[14px]"
        />
      </HabitRow>

      <HabitRow
        emoji="🍎"
        title="Diet"
        expanded={expanded === 'diet'}
        onToggle={() => setExpanded((e) => (e === 'diet' ? null : 'diet'))}
        footer={
          <>
            <div className="grid grid-cols-6 gap-1">
              {habitHeatmap(healthHistory, todayStr, (h) => h.mealQuality === 'good').map((c) => (
                <div
                  key={c.date}
                  className="aspect-square rounded-sm"
                  style={{
                    background: c.ok ? 'color-mix(in srgb, var(--positive) 40%, transparent)' : 'var(--surface2)',
                    boxShadow: c.isToday ? '0 0 0 1px var(--accent)' : undefined,
                  }}
                />
              ))}
            </div>
            {renderTrend('diet', 'Daily score (30d)', scoreTrend)}
          </>
        }
      >
        <input
          value={todayHealth.mealDescription ?? ''}
          onChange={(e) => updateHealth({ mealDescription: e.target.value })}
          placeholder="Meal description"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[14px]"
        />
        <div className="flex gap-2">
          {(['good', 'okay', 'bad'] as const).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => updateHealth({ mealQuality: q })}
              className="flex h-10 flex-1 items-center justify-center rounded-full text-[12px] font-semibold capitalize"
              style={{
                background:
                  todayHealth.mealQuality === q
                    ? q === 'good'
                      ? 'var(--positive)'
                      : q === 'okay'
                        ? 'var(--amber)'
                        : 'var(--rose)'
                    : 'var(--surface2)',
                color: todayHealth.mealQuality === q ? '#fff' : 'var(--text-dim)',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </HabitRow>

      <HabitRow
        emoji="😴"
        title="Sleep"
        expanded={expanded === 'sleep'}
        onToggle={() => setExpanded((e) => (e === 'sleep' ? null : 'sleep'))}
        footer={
          <>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <div>
                <span className="text-[var(--text-tertiary)]">Streak</span>
                <p className="font-mono">{streak('sleep')?.currentStreak ?? 0}d</p>
              </div>
              <div>
                <span className="text-[var(--text-tertiary)]">Best</span>
                <p className="font-mono">{streak('sleep')?.longestStreak ?? 0}d</p>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {habitHeatmap(healthHistory, todayStr, (h) => !!(h.sleepTime && h.wakeTime)).map((c) => (
                <div
                  key={c.date}
                  className="aspect-square rounded-sm"
                  style={{
                    background: c.ok ? 'color-mix(in srgb, var(--blue) 40%, transparent)' : 'var(--surface2)',
                    boxShadow: c.isToday ? '0 0 0 1px var(--accent)' : undefined,
                  }}
                />
              ))}
            </div>
            {renderTrend('sleep', 'Daily score (30d)', scoreTrend)}
          </>
        }
      >
        <div className="flex gap-3">
          <div className="flex-1">
            <p className="text-[11px] text-[var(--text-tertiary)]">Bed</p>
            <input
              type="time"
              value={todayHealth.sleepTime ?? ''}
              onChange={(e) => updateHealth({ sleepTime: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-2 font-mono text-[14px]"
            />
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-[var(--text-tertiary)]">Wake</p>
            <input
              type="time"
              value={todayHealth.wakeTime ?? ''}
              onChange={(e) => updateHealth({ wakeTime: e.target.value })}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-2 font-mono text-[14px]"
            />
          </div>
        </div>
        <p className="font-mono text-[14px] text-[var(--text-secondary)]">
          Hours: {sleepHours(todayHealth.sleepTime, todayHealth.wakeTime) ?? '—'}
        </p>
      </HabitRow>

      <HabitRow
        emoji="📱"
        title="Screen time"
        expanded={expanded === 'screen'}
        onToggle={() => setExpanded((e) => (e === 'screen' ? null : 'screen'))}
        footer={
          <div className="grid grid-cols-6 gap-1">
            {habitHeatmap(healthHistory, todayStr, (h) => h.screenTimeHours > 0).map((c) => (
              <div
                key={c.date}
                className="aspect-square rounded-sm"
                style={{
                  background: c.ok ? 'color-mix(in srgb, var(--cyan) 35%, transparent)' : 'var(--surface2)',
                  boxShadow: c.isToday ? '0 0 0 1px var(--accent)' : undefined,
                }}
              />
            ))}
          </div>
        }
      >
        <p className="text-[11px] text-[var(--text-tertiary)]">{todayHealth.screenTimeHours} h</p>
        <input
          type="range"
          min={0}
          max={12}
          step={0.5}
          value={todayHealth.screenTimeHours}
          onChange={(e) => updateHealth({ screenTimeHours: parseFloat(e.target.value) })}
          className="w-full"
        />
        <div className="flex flex-wrap gap-2">
          {SCREEN_CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => updateHealth({ screenCategory: c })}
              className={`rounded-full px-3 py-1 text-[12px] capitalize ${
                todayHealth.screenCategory === c ? 'bg-[var(--accent-bg)] text-[var(--accent)]' : 'bg-[var(--surface2)] text-[var(--text-dim)]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </HabitRow>

      <HabitRow
        emoji="💧"
        title="Water"
        expanded={expanded === 'water'}
        onToggle={() => setExpanded((e) => (e === 'water' ? null : 'water'))}
        footer={
          <div className="grid grid-cols-6 gap-1">
            {habitHeatmap(healthHistory, todayStr, (h) => (h.waterGlasses ?? 0) >= 8).map((c) => (
              <div
                key={c.date}
                className="aspect-square rounded-sm"
                style={{
                  background: c.ok ? 'color-mix(in srgb, var(--blue) 45%, transparent)' : 'var(--surface2)',
                  boxShadow: c.isToday ? '0 0 0 1px var(--accent)' : undefined,
                }}
              />
            ))}
          </div>
        }
      >
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            className="rounded-full bg-[var(--surface2)] px-4 py-2 text-[20px]"
            onClick={() =>
              updateHealth({ waterGlasses: Math.max(0, (todayHealth.waterGlasses ?? 0) - 1) })
            }
          >
            −
          </button>
          <span className="font-mono text-[24px]">{todayHealth.waterGlasses ?? 0}</span>
          <button
            type="button"
            className="rounded-full bg-[var(--surface2)] px-4 py-2 text-[20px]"
            onClick={() => updateHealth({ waterGlasses: (todayHealth.waterGlasses ?? 0) + 1 })}
          >
            +
          </button>
        </div>
        <p className="text-center text-[11px] text-[var(--text-dim)]">Goal 8 glasses</p>
      </HabitRow>

      {publicCustom.map((c) => (
        <HabitRow
          key={c.id}
          emoji={c.emoji}
          title={c.name}
          expanded={expanded === c.id}
          onToggle={() => setExpanded((e) => (e === c.id ? null : c.id))}
          footer={
            <div className="grid grid-cols-6 gap-1">
              {habitHeatmap(healthHistory, todayStr, (h) => {
                const v = h.customHabitLog?.[c.id]
                if (c.loggingType === 'boolean') return v === true
                return v != null && v !== ''
              }).map((x) => (
                <div
                  key={x.date}
                  className="aspect-square rounded-sm"
                  style={{
                    background: x.ok ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : 'var(--surface2)',
                    boxShadow: x.isToday ? '0 0 0 1px var(--accent)' : undefined,
                  }}
                />
              ))}
            </div>
          }
        >
          {c.loggingType === 'boolean' && (
            <label className="flex gap-2 text-[14px]">
              <input
                type="checkbox"
                checked={todayHealth.customHabitLog?.[c.id] === true}
                onChange={() => setCustomVal(c.id, !(todayHealth.customHabitLog?.[c.id] === true))}
              />
              Completed
            </label>
          )}
          {c.loggingType === 'number' && (
            <input
              type="number"
              value={Number(todayHealth.customHabitLog?.[c.id] ?? 0)}
              onChange={(e) => setCustomVal(c.id, parseFloat(e.target.value) || 0)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 font-mono"
            />
          )}
          {c.loggingType === 'text' && (
            <textarea
              value={String(todayHealth.customHabitLog?.[c.id] ?? '')}
              onChange={(e) => setCustomVal(c.id, e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2"
            />
          )}
          {c.loggingType === 'rating' && (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCustomVal(c.id, n)}
                  className={`h-10 w-10 rounded-full font-mono ${
                    todayHealth.customHabitLog?.[c.id] === n ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface2)]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </HabitRow>
      ))}

      <div className="rounded-xl border border-dashed border-[var(--border)]">
        <button
          type="button"
          onClick={() => setPrivateOpen(!privateOpen)}
          className="flex w-full items-center justify-between px-4 py-3 text-[14px] text-[var(--text-secondary)]"
        >
          Private habits ({privateCustom.length})
          <span>{privateOpen ? '▼' : '▶'}</span>
        </button>
        <AnimatePresence>
          {privateOpen && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="space-y-2 px-4 pb-4">
              {privateCustom.length === 0 ? (
                <p className="text-[12px] text-[var(--text-dim)]">No private habits yet.</p>
              ) : (
                privateCustom.map((c) => (
                  <HabitRow
                    key={c.id}
                    emoji={c.emoji}
                    title={c.name}
                    expanded={expanded === c.id}
                    onToggle={() => setExpanded((e) => (e === c.id ? null : c.id))}
                    footer={
                      <div className="grid grid-cols-6 gap-1">
                        {habitHeatmap(healthHistory, todayStr, (h) => {
                          const v = h.customHabitLog?.[c.id]
                          if (c.loggingType === 'boolean') return v === true
                          return v != null && v !== ''
                        }).map((x) => (
                          <div
                            key={x.date}
                            className="aspect-square rounded-sm"
                            style={{
                              background: x.ok ? 'color-mix(in srgb, var(--accent) 40%, transparent)' : 'var(--surface2)',
                              boxShadow: x.isToday ? '0 0 0 1px var(--accent)' : undefined,
                            }}
                          />
                        ))}
                      </div>
                    }
                  >
                    {c.loggingType === 'boolean' && (
                      <label className="flex gap-2 text-[14px]">
                        <input
                          type="checkbox"
                          checked={todayHealth.customHabitLog?.[c.id] === true}
                          onChange={() => setCustomVal(c.id, !(todayHealth.customHabitLog?.[c.id] === true))}
                        />
                        Completed
                      </label>
                    )}
                    {c.loggingType === 'number' && (
                      <input
                        type="number"
                        value={Number(todayHealth.customHabitLog?.[c.id] ?? 0)}
                        onChange={(e) => setCustomVal(c.id, parseFloat(e.target.value) || 0)}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 font-mono"
                      />
                    )}
                    {c.loggingType === 'text' && (
                      <textarea
                        value={String(todayHealth.customHabitLog?.[c.id] ?? '')}
                        onChange={(e) => setCustomVal(c.id, e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2"
                      />
                    )}
                    {c.loggingType === 'rating' && (
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setCustomVal(c.id, n)}
                            className={`h-10 w-10 rounded-full font-mono ${
                              todayHealth.customHabitLog?.[c.id] === n ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface2)]'
                            }`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    )}
                  </HabitRow>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <button
          type="button"
          onClick={() => setAddOpen(!addOpen)}
          className="w-full rounded-xl border border-[var(--border)] py-3 text-[14px] font-semibold text-[var(--accent)]"
        >
          + Add custom habit
        </button>
        {addOpen && (
          <div className="space-y-2 rounded-xl border border-[var(--border)] p-4">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Name"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2"
            />
            <input
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              className="w-20 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as CustomHabitDef['loggingType'])}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2"
            >
              <option value="boolean">Boolean</option>
              <option value="number">Number</option>
              <option value="text">Text</option>
              <option value="rating">Rating (1–5)</option>
            </select>
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={newPrivate} onChange={(e) => setNewPrivate(e.target.checked)} />
              Private
            </label>
            <button
              type="button"
              className="btn-primary w-full py-2"
              onClick={() => {
                if (!newName.trim()) {
                  toast.error('Name required')
                  return
                }
                addCustomHabit({
                  name: newName.trim(),
                  emoji: newEmoji || '✨',
                  loggingType: newType,
                  private: newPrivate,
                })
                setNewName('')
                setAddOpen(false)
                toast.success('Habit added')
              }}
            >
              Save
            </button>
          </div>
        )}
        <Link href="/health" className="block text-center text-[14px] text-[var(--accent)]">
          Edit habits (Health) →
        </Link>
      </div>
    </div>
  )
}
