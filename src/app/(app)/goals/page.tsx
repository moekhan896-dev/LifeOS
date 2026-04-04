'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const cardAnim = (delay: number) => ({
  initial: { opacity: 0, y: 12 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay, duration: 0.35 },
})

function getCycleWeek(start: string) {
  const diff = Date.now() - new Date(start).getTime()
  return Math.max(1, Math.min(12, Math.ceil(diff / (7 * 86400000))))
}

function progressColor(pct: number) {
  if (pct >= 70) return 'var(--accent)'
  if (pct >= 30) return 'var(--amber)'
  return 'var(--rose)'
}

/** PRD §1 — suggestions are generic; users define real metrics in the form. */
const SUGGESTED_GOALS = [
  { title: 'Hit a measurable revenue milestone', metric: 'Your target metric', target: 100 },
  { title: 'Raise average weekly execution score', metric: 'Avg score', target: 70 },
  { title: 'Ship one major milestone per month', metric: 'Milestones', target: 3 },
]

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[8px] border border-[var(--border)] p-2" style={{ background: 'var(--bg)' }}>
      <p className="text-[10px] text-[var(--text-dim)] mb-1">{label}</p>
      <p className="data text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
        {Math.round(payload[0].value)}%
      </p>
    </div>
  )
}

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal, projects, scorecards } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [form, setForm] = useState({
    title: '', targetMetric: '', currentValue: 0, targetValue: 100,
    cycleStart: new Date().toISOString().split('T')[0],
    cycleEnd: new Date(Date.now() + 84 * 86400000).toISOString().split('T')[0],
  })

  const activeGoals = goals.filter(g => new Date(g.cycleEnd) >= new Date())
  const currentCycle = activeGoals.length > 0 ? activeGoals[0] : null
  const weekNum = currentCycle ? getCycleWeek(currentCycle.cycleStart) : 0

  const weeklyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      name: `W${i + 1}`,
      rate:
        i < weekNum && Array.isArray(scorecards) && scorecards[i] != null && typeof scorecards[i]?.rate === 'number'
          ? scorecards[i].rate
          : 0,
    }))
  }, [weekNum, scorecards])

  const handleAdd = () => {
    if (!form.title.trim()) { toast.error('Goal title required'); return }
    addGoal({ ...form, linkedProjectIds: [] })
    setForm({ title: '', targetMetric: '', currentValue: 0, targetValue: 100, cycleStart: new Date().toISOString().split('T')[0], cycleEnd: new Date(Date.now() + 84 * 86400000).toISOString().split('T')[0] })
    setShowForm(false)
    toast.success('Goal added')
  }

  const handleUpdateProgress = (id: string) => {
    const val = parseFloat(editValue)
    if (isNaN(val)) { toast.error('Enter a valid number'); return }
    updateGoal(id, { currentValue: val })
    setEditingId(null)
    setEditValue('')
    toast.success('Progress updated')
  }

  const handleSuggested = (s: typeof SUGGESTED_GOALS[0]) => {
    addGoal({
      title: s.title, targetMetric: s.metric, currentValue: 0, targetValue: s.target,
      cycleStart: new Date().toISOString().split('T')[0],
      cycleEnd: new Date(Date.now() + 84 * 86400000).toISOString().split('T')[0],
      linkedProjectIds: [],
    })
    toast.success(`Added: ${s.title}`)
  }

  return (
    <PageTransition>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div {...cardAnim(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-[var(--text)]">12-Week Year</h1>
            {currentCycle ? (
              <p className="text-[13px] text-[var(--text-dim)] mt-1">
                {new Date(currentCycle.cycleStart).toLocaleDateString()} — {new Date(currentCycle.cycleEnd).toLocaleDateString()} &middot; Week {weekNum} of 12
              </p>
            ) : (
              <p className="text-[13px] text-[var(--text-dim)] mt-1">No active cycle</p>
            )}
          </div>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-[10px] text-[13px] font-semibold bg-[var(--accent)] text-black hover:opacity-90 transition-opacity">
            + Add Goal
          </button>
        </motion.div>

        {/* Add Goal Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 space-y-4 overflow-hidden">
              <h3 className="text-[14px] font-semibold text-[var(--text)]">New Goal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Goal title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="px-3 py-2 rounded-[8px] bg-[var(--surface2)] border border-[var(--border)] text-[13px] text-[var(--text)] outline-none" />
                <input placeholder="Target metric (measurable)" value={form.targetMetric} onChange={e => setForm({ ...form, targetMetric: e.target.value })} className="px-3 py-2 rounded-[8px] bg-[var(--surface2)] border border-[var(--border)] text-[13px] text-[var(--text)] outline-none" />
                <input type="number" placeholder="Current value" value={form.currentValue || ''} onChange={e => setForm({ ...form, currentValue: +e.target.value })} className="px-3 py-2 rounded-[8px] bg-[var(--surface2)] border border-[var(--border)] text-[13px] text-[var(--text)] outline-none" />
                <input type="number" placeholder="Target value" value={form.targetValue || ''} onChange={e => setForm({ ...form, targetValue: +e.target.value })} className="px-3 py-2 rounded-[8px] bg-[var(--surface2)] border border-[var(--border)] text-[13px] text-[var(--text)] outline-none" />
                <input type="date" value={form.cycleStart} onChange={e => setForm({ ...form, cycleStart: e.target.value })} className="px-3 py-2 rounded-[8px] bg-[var(--surface2)] border border-[var(--border)] text-[13px] text-[var(--text)] outline-none" />
                <input type="date" value={form.cycleEnd} onChange={e => setForm({ ...form, cycleEnd: e.target.value })} className="px-3 py-2 rounded-[8px] bg-[var(--surface2)] border border-[var(--border)] text-[13px] text-[var(--text)] outline-none" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} className="px-4 py-2 rounded-[8px] text-[12px] font-semibold bg-[var(--accent)] text-black">Save Goal</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-[8px] text-[12px] font-semibold text-[var(--text-dim)] border border-[var(--border)]">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goals List */}
        {goals.length === 0 ? (
          <motion.div {...cardAnim(0.1)} className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center space-y-5">
            <div className="text-[40px]">🎯</div>
            <h2 className="text-[16px] font-semibold text-[var(--text)]">Start your first 12-week cycle</h2>
            <p className="text-[13px] text-[var(--text-dim)] max-w-md mx-auto">Set 3-5 goals. Focus beats breadth. Each goal should have a measurable target.</p>
            <div className="space-y-2 max-w-sm mx-auto">
              {SUGGESTED_GOALS.map((s, i) => (
                <button key={i} onClick={() => handleSuggested(s)} className="w-full flex items-center justify-between px-4 py-3 rounded-[10px] border border-[var(--border)] bg-[var(--surface2)] hover:border-[var(--accent)] transition-colors text-left">
                  <span className="text-[13px] text-[var(--text)]">{s.title}</span>
                  <span className="text-[11px] text-[var(--text-dim)]">{s.metric}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal, i) => {
              const pct = goal.targetValue > 0 ? Math.round((goal.currentValue / goal.targetValue) * 100) : 0
              const linkedCount = projects.filter(p => goal.linkedProjectIds.includes(p.id)).length
              return (
                <motion.div key={goal.id} {...cardAnim(0.05 * i)} className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-[16px] font-semibold text-[var(--text)]">{goal.title}</h3>
                      <p className="text-[12px] text-[var(--text-dim)] mt-0.5">{goal.targetMetric}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(editingId === goal.id ? null : goal.id); setEditValue(String(goal.currentValue)) }} className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">
                        Update Progress
                      </button>
                      <button onClick={() => { deleteGoal(goal.id); toast.success('Goal deleted') }} className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold text-[var(--rose)] border border-[var(--border)] hover:bg-[var(--rose)]/10 transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="data text-[12px] text-[var(--text-dim)]">{goal.currentValue} / {goal.targetValue}</span>
                      <span className="data text-[12px] font-semibold" style={{ color: progressColor(pct) }}>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--surface2)] overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full rounded-full" style={{ background: progressColor(pct) }} />
                    </div>
                  </div>

                  {linkedCount > 0 && (
                    <p className="text-[11px] text-[var(--text-dim)]">{linkedCount} linked project{linkedCount !== 1 ? 's' : ''}</p>
                  )}

                  {weekNum > 0 &&
                    Array.isArray(scorecards) &&
                    scorecards[weekNum - 1]?.aiByGoal &&
                    (() => {
                      const g = scorecards[weekNum - 1]!.aiByGoal!.find((x) => x.goalId === goal.id)
                      if (!g) return null
                      return (
                        <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--surface2)] p-3">
                          <p className="text-[10px] uppercase tracking-wide text-[var(--text-dim)]">
                            Weekly AI grade
                          </p>
                          <p className="text-[22px] font-bold text-[var(--accent)] mt-0.5">{g.grade}</p>
                          <p className="text-[12px] text-[var(--text-secondary)] mt-1 leading-snug">{g.feedback}</p>
                        </div>
                      )
                    })()}

                  {/* Inline edit */}
                  <AnimatePresence>
                    {editingId === goal.id && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex gap-2 pt-1 overflow-hidden">
                        <input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="px-3 py-1.5 rounded-[8px] bg-[var(--surface2)] border border-[var(--border)] text-[13px] text-[var(--text)] outline-none w-32" autoFocus />
                        <button onClick={() => handleUpdateProgress(goal.id)} className="px-3 py-1.5 rounded-[8px] text-[11px] font-semibold bg-[var(--accent)] text-black">Save</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-[8px] text-[11px] text-[var(--text-dim)]">Cancel</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Weekly Execution Chart */}
        {goals.length > 0 && (
          <motion.div {...cardAnim(0.2)} className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] p-5 space-y-3">
            <h3 className="text-[14px] font-semibold text-[var(--text)]">Weekly Execution Rate</h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="rate" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
