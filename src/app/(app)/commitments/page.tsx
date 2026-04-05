'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore, type Commitment } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'

type Tab = 'active' | 'fulfilled' | 'all'

function formatSourceLine(c: Commitment): string {
  const created = new Date(c.createdAt)
  const dateStr = created.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
  if (c.source === 'manual') return `Manual · ${dateStr}`
  if (c.source === 'ai_chat') return `From AI chat · ${dateStr}`
  if (c.source === 'decision_lab' || c.source === 'decision_lab_option') return `From Decision Lab · ${dateStr}`
  return `${c.source} · ${dateStr}`
}

function dueTone(c: Commitment): { className: string; label: string } {
  if (!c.dueDate || c.fulfilled) return { className: 'text-[var(--text-dim)]', label: c.dueDate ? c.dueDate : 'No due date' }
  const due = new Date(c.dueDate + 'T12:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(due)
  d.setHours(0, 0, 0, 0)
  const diff = (d.getTime() - today.getTime()) / 86400000
  if (diff < 0) return { className: 'text-[var(--negative)] font-medium', label: `Due ${c.dueDate} (overdue)` }
  if (diff === 0) return { className: 'text-[var(--warning)] font-medium', label: `Due today` }
  return { className: 'text-[var(--positive)]', label: `Due ${c.dueDate}` }
}

export default function CommitmentsPage() {
  const { commitments, addCommitment, fulfillCommitment, removeCommitment } = useStore()
  const [tab, setTab] = useState<Tab>('active')
  const [showAdd, setShowAdd] = useState(false)
  const [text, setText] = useState('')
  const [dueDate, setDueDate] = useState('')

  const total = commitments.length
  const fulfilled = commitments.filter((c) => c.fulfilled).length
  const pct = total > 0 ? Math.round((fulfilled / total) * 100) : 0

  const filtered = useMemo(() => {
    let list =
      tab === 'active'
        ? commitments.filter((c) => !c.fulfilled)
        : tab === 'fulfilled'
          ? commitments.filter((c) => c.fulfilled)
          : [...commitments]
    if (tab === 'active') {
      list = [...list].sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      })
    } else if (tab === 'fulfilled' || tab === 'all') {
      list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return list
  }, [commitments, tab])

  const handleAdd = () => {
    if (!text.trim()) return
    addCommitment(text.trim(), 'manual', dueDate || undefined)
    setText('')
    setDueDate('')
    setShowAdd(false)
    toast.success('Commitment added')
  }

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 pb-24">
        <StaggerItem>
          <h1 className="text-2xl font-bold text-[var(--text)]">Commitments</h1>
        </StaggerItem>

        <StaggerItem>
          <div className="card p-4">
            <p className="text-[15px] text-[var(--text)]">
              <span className="font-semibold">{fulfilled}</span>/{total} commitments fulfilled ({pct}%)
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface2)]">
              <div className="h-2 rounded-full bg-[var(--accent)] transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="flex rounded-[12px] border border-[var(--border)] p-1">
            {(['active', 'fulfilled', 'all'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-[10px] py-2 text-[13px] font-medium capitalize ${
                  tab === t ? 'bg-[var(--accent)] text-black' : 'text-[var(--text-secondary)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </StaggerItem>

        <StaggerItem>
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            className="w-full rounded-[12px] border border-[var(--border)] py-3 text-[14px] font-semibold text-[var(--accent)]"
          >
            + Add Commitment
          </button>
          {showAdd && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="card mt-3 space-y-3 p-4">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What are you committing to?"
                className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[14px] text-[var(--text)]"
              />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[14px]"
              />
              <div className="flex gap-2">
                <button type="button" onClick={handleAdd} className="flex-1 rounded-[10px] bg-[var(--accent)] py-2.5 text-[14px] font-semibold text-black">
                  Save
                </button>
                <button type="button" onClick={() => setShowAdd(false)} className="rounded-[10px] border border-[var(--border)] px-4 py-2 text-[13px]">
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </StaggerItem>

        <div className="space-y-2">
          {filtered.map((c) => {
            const overdue =
              !c.fulfilled &&
              !!c.dueDate &&
              (() => {
                const t0 = new Date()
                t0.setHours(0, 0, 0, 0)
                const d = new Date(c.dueDate + 'T12:00:00')
                d.setHours(0, 0, 0, 0)
                return d.getTime() < t0.getTime()
              })()
            const tone = dueTone(c)
            return (
              <StaggerItem key={c.id}>
                <div
                  className={`card p-4 ${overdue ? 'border-l-[3px] border-l-[var(--negative)]' : ''}`}
                >
                  <p className="body text-[15px] text-[var(--text)]">{c.text}</p>
                  <p className="caption mt-1 text-[12px] text-[var(--text-dim)]">{formatSourceLine(c)}</p>
                  <p className={`mt-2 text-[13px] ${tone.className}`}>{tone.label}</p>
                  {!c.fulfilled && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          fulfillCommitment(c.id)
                          toast.success('Marked fulfilled')
                        }}
                        className="rounded-[10px] bg-[var(--positive)]/15 px-3 py-1.5 text-[13px] font-medium text-[var(--positive)]"
                      >
                        Mark Fulfilled ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof window !== 'undefined' && !window.confirm('Remove this commitment?')) return
                          removeCommitment(c.id)
                          toast.success('Removed')
                        }}
                        className="text-[13px] text-[var(--text-dim)] underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </StaggerItem>
            )
          })}
        </div>

        {commitments.length === 0 && (
          <p className="px-2 text-center text-[15px] leading-relaxed text-[var(--text-secondary)]">
            No commitments yet. When you tell the AI &quot;I&apos;ll do X,&quot; it gets logged here. You can also add commitments manually.{' '}
            <button type="button" onClick={() => setShowAdd(true)} className="font-medium text-[var(--accent)]">
              + Add Commitment
            </button>
          </p>
        )}
      </StaggerContainer>
    </PageTransition>
  )
}
