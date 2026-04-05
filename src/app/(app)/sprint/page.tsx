'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore, type Sprint } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'

function thisMondayISO(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

function formatWeekOf(weekStart: string) {
  const s = new Date(weekStart + 'T12:00:00')
  return s.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function SprintPage() {
  const { sprints, addSprint, updateSprint, updateSprintDeliverable, appendSprintDeliverable } = useStore()

  const [showStartForm, setShowStartForm] = useState(false)
  const [weekStart, setWeekStart] = useState(thisMondayISO)
  const [lines, setLines] = useState<string[]>([''])
  const [newDeliverable, setNewDeliverable] = useState('')
  const [prevOpen, setPrevOpen] = useState(true)
  const [promptNext, setPromptNext] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const active = useMemo(() => sprints.find((s) => s.status === 'active'), [sprints])
  const pastSprints = useMemo(
    () =>
      [...sprints]
        .filter((s) => s.status !== 'active')
        .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()),
    [sprints]
  )

  const nextSprintNumber = useMemo(() => (sprints.length ? Math.max(...sprints.map((s) => s.sprintNumber)) + 1 : 1), [sprints])

  const startSprint = () => {
    const texts = lines.map((l) => l.trim()).filter(Boolean)
    if (texts.length === 0) {
      toast.error('Add at least one deliverable')
      return
    }
    addSprint({
      sprintNumber: nextSprintNumber,
      weekStart,
      deliverables: texts.map((text) => ({ text, done: false })),
      status: 'active',
    })
    setShowStartForm(false)
    setLines([''])
    toast.success('Sprint started')
  }

  const activeDone = active
    ? active.deliverables.length > 0 && active.deliverables.every((d) => d.done)
    : false

  const completeSprint = () => {
    if (!active) return
    updateSprint(active.id, { status: 'completed' })
    setPromptNext(true)
    toast.success('Sprint completed')
  }

  const startNextFromPrompt = () => {
    setPromptNext(false)
    setWeekStart(thisMondayISO())
    setLines([''])
    setShowStartForm(true)
  }

  const total = active?.deliverables.length ?? 0
  const done = active?.deliverables.filter((d) => d.done).length ?? 0
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 pb-24">
        <StaggerItem>
          <h1 className="text-2xl font-bold text-[var(--text)]">Sprint</h1>
          <p className="mt-1 text-[13px] text-[var(--text-dim)]">Weekly outcomes you ship.</p>
        </StaggerItem>

        <AnimatePresence>
          {promptNext && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card border-[var(--accent)]/40 bg-[var(--accent)]/10 p-4"
            >
              <p className="text-[15px] font-medium text-[var(--text)]">Start next sprint?</p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={startNextFromPrompt}
                  className="rounded-[10px] bg-[var(--accent)] px-4 py-2 text-[13px] font-semibold text-black"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setPromptNext(false)}
                  className="rounded-[10px] border border-[var(--border)] px-4 py-2 text-[13px] text-[var(--text)]"
                >
                  Not yet
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!active && !showStartForm && sprints.length > 0 && (
          <StaggerItem>
            <div className="card px-5 py-8 text-center">
              <p className="text-[16px] text-[var(--text-secondary)]">No active sprint. Start a new one?</p>
              <button
                type="button"
                onClick={() => {
                  setWeekStart(thisMondayISO())
                  setShowStartForm(true)
                }}
                className="mt-4 rounded-[12px] bg-[var(--accent)] px-5 py-2.5 text-[14px] font-semibold text-black"
              >
                Start Sprint
              </button>
            </div>
          </StaggerItem>
        )}

        {showStartForm && !active && (
          <StaggerItem>
            <div className="card space-y-4 p-5">
              <p className="text-[13px] text-[var(--text-dim)]">
                Sprint <span className="font-mono text-[var(--text)]">{nextSprintNumber}</span>
              </p>
              <div>
                <label className="mb-1 block text-[11px] text-[var(--text-dim)]">Week start (Monday)</label>
                <input
                  type="date"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                  className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[14px] text-[var(--text)]"
                />
              </div>
              <div className="space-y-2">
                <span className="text-[11px] text-[var(--text-dim)]">Deliverables</span>
                {lines.map((line, i) => (
                  <input
                    key={i}
                    value={line}
                    onChange={(e) => {
                      const next = [...lines]
                      next[i] = e.target.value
                      setLines(next)
                    }}
                    placeholder={`Deliverable ${i + 1}`}
                    className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[14px] text-[var(--text)]"
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setLines((l) => [...l, ''])}
                  className="text-[13px] font-medium text-[var(--accent)]"
                >
                  + Add another
                </button>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={startSprint} className="flex-1 rounded-[12px] bg-[var(--accent)] py-3 text-[14px] font-semibold text-black">
                  Start sprint
                </button>
                <button
                  type="button"
                  onClick={() => setShowStartForm(false)}
                  className="rounded-[12px] border border-[var(--border)] px-4 py-2 text-[13px] text-[var(--text-secondary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </StaggerItem>
        )}

        {active && (
          <>
            <StaggerItem>
              <div className="card p-5">
                <h2 className="title text-[22px] font-bold text-[var(--text)]">Sprint {active.sprintNumber}</h2>
                <p className="subheadline mt-1 text-[15px] text-[var(--text-secondary)]">Week of {formatWeekOf(active.weekStart)}</p>
                <div className="mt-4 space-y-2">
                  {active.deliverables.map((d, i) => (
                    <label key={i} className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-[var(--border)]/80 p-3">
                      <input
                        type="checkbox"
                        checked={d.done}
                        onChange={() => updateSprintDeliverable(active.id, i, !d.done)}
                        className="mt-1 accent-[var(--accent)]"
                      />
                      <span className={`text-[15px] ${d.done ? 'text-[var(--text-dim)] line-through' : 'text-[var(--text)]'}`}>{d.text}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    value={newDeliverable}
                    onChange={(e) => setNewDeliverable(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newDeliverable.trim()) {
                        appendSprintDeliverable(active.id, newDeliverable.trim())
                        setNewDeliverable('')
                      }
                    }}
                    placeholder="Add deliverable…"
                    className="flex-1 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[14px] text-[var(--text)]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newDeliverable.trim()) return
                      appendSprintDeliverable(active.id, newDeliverable.trim())
                      setNewDeliverable('')
                    }}
                    className="rounded-[10px] border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--accent)]"
                  >
                    + Add
                  </button>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-[12px] text-[var(--text-dim)]">
                    <span>
                      {done}/{total} deliverables
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface2)]">
                    <div className="h-2 rounded-full bg-[var(--accent)] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {activeDone && (
                  <div className="mt-5 rounded-[12px] border border-[var(--positive)]/40 bg-[var(--positive)]/10 px-4 py-3 text-center">
                    <p className="text-[15px] font-medium text-[var(--text)]">All deliverables done!</p>
                    <button
                      type="button"
                      onClick={completeSprint}
                      className="mt-2 text-[15px] font-semibold text-[var(--accent)]"
                    >
                      Complete Sprint →
                    </button>
                  </div>
                )}
              </div>
            </StaggerItem>

            {pastSprints.length > 0 && (
              <StaggerItem>
                <button
                  type="button"
                  onClick={() => setPrevOpen(!prevOpen)}
                  className="flex w-full items-center justify-between rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-left text-[15px] font-medium text-[var(--text)]"
                >
                  Previous Sprints
                  <span>{prevOpen ? '▾' : '▸'}</span>
                </button>
                {prevOpen && (
                  <div className="mt-3 space-y-3">
                    {pastSprints.map((sp) => (
                      <PastSprintCard key={sp.id} sp={sp} expanded={expandedId === sp.id} onToggle={() => setExpandedId(expandedId === sp.id ? null : sp.id)} />
                    ))}
                  </div>
                )}
              </StaggerItem>
            )}
          </>
        )}

        {sprints.length === 0 && !showStartForm && (
          <StaggerItem>
            <p className="px-2 text-center text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Sprints are weekly commitments to specific outcomes. Unlike tasks, these are the results you&apos;ll deliver this week.
            </p>
            <button
              type="button"
              onClick={() => setShowStartForm(true)}
              className="mt-4 w-full text-center text-[15px] font-medium text-[var(--accent)]"
            >
              Start your first sprint →
            </button>
          </StaggerItem>
        )}
      </StaggerContainer>
    </PageTransition>
  )
}

function PastSprintCard({
  sp,
  expanded,
  onToggle,
}: {
  sp: Sprint
  expanded: boolean
  onToggle: () => void
}) {
  const done = sp.deliverables.filter((d) => d.done).length
  const total = sp.deliverables.length
  const rate = total > 0 ? Math.round((done / total) * 100) : 0
  return (
    <motion.div layout className="card overflow-hidden p-4">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between text-left">
        <div>
          <p className="text-[16px] font-semibold text-[var(--text)]">Sprint {sp.sprintNumber}</p>
          <p className="text-[12px] text-[var(--text-dim)]">{formatWeekOf(sp.weekStart)}</p>
        </div>
        <span className="text-[14px] font-mono text-[var(--accent)]">{rate}%</span>
      </button>
      <p className="mt-1 text-[12px] text-[var(--text-dim)]">
        Completion: {done}/{total}
      </p>
      <AnimatePresence>
        {expanded && (
          <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 space-y-1 border-t border-[var(--border)] pt-3">
            {sp.deliverables.map((d, i) => (
              <li key={i} className={`text-[13px] ${d.done ? 'text-[var(--text-dim)] line-through' : 'text-[var(--text)]'}`}>
                {d.done ? '✓ ' : '○ '}
                {d.text}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
