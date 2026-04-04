'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const REVIEW_OPTIONS = [
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
]

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
}

export default function DecisionsPage() {
  const { decisionJournal, addDecision, updateDecision, deleteDecision } = useStore()
  const [open, setOpen] = useState(false)
  const [decision, setDecision] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [expected, setExpected] = useState('')
  const [reviewDays, setReviewDays] = useState(30)
  const [reviewTexts, setReviewTexts] = useState<Record<string, string>>({})

  const handleSubmit = () => {
    if (!decision.trim()) return
    const reviewDate = new Date(Date.now() + reviewDays * 86400000).toISOString()
    addDecision({ decision: decision.trim(), reasoning: reasoning.trim(), expectedOutcome: expected.trim(), reviewDate })
    setDecision('')
    setReasoning('')
    setExpected('')
    setOpen(false)
    toast.success('Decision logged.')
  }

  const handleReview = (id: string) => {
    const text = reviewTexts[id]
    if (!text?.trim()) return
    updateDecision(id, { actualOutcome: text.trim() })
    setReviewTexts((p) => ({ ...p, [id]: '' }))
    toast.success('Outcome recorded.')
  }

  const sorted = [...decisionJournal].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const pendingReviews = sorted.filter((d) => d.reviewDate && !d.actualOutcome && daysUntil(d.reviewDate) <= 0)
  const rest = sorted.filter((d) => !pendingReviews.includes(d))

  const inputCls = 'w-full bg-[#1a1d2e] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-white placeholder:text-[var(--text-dim)] focus:outline-none focus:border-emerald-500/50 resize-none'

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 600 }} className="text-white">Decision Journal</h1>
          <p className="text-[13px] text-[var(--text-mid)] mt-1">Log decisions. Review outcomes. Build judgment.</p>
        </div>

        {/* Add Decision Form */}
        <motion.div className="rounded-[16px] p-5" style={{ background: '#0e1018' }}>
          <button
            onClick={() => setOpen(!open)}
            className="text-[14px] font-semibold text-white flex items-center gap-2 w-full"
          >
            <span className="text-emerald-400">{open ? '−' : '+'}</span> New Decision
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-3">
                  <textarea className={inputCls} rows={2} placeholder="What did you decide?" value={decision} onChange={(e) => setDecision(e.target.value)} />
                  <textarea className={inputCls} rows={2} placeholder="Why?" value={reasoning} onChange={(e) => setReasoning(e.target.value)} />
                  <textarea className={inputCls} rows={2} placeholder="What do you expect to happen?" value={expected} onChange={(e) => setExpected(e.target.value)} />
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[var(--text-dim)]">Review in:</span>
                    {REVIEW_OPTIONS.map((opt) => (
                      <button
                        key={opt.days}
                        onClick={() => setReviewDays(opt.days)}
                        className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                          reviewDays === opt.days
                            ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                            : 'border-[var(--border)] text-[var(--text-dim)] hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Log Decision
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pending Reviews */}
        {pendingReviews.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[14px] font-semibold text-amber-400">Pending Reviews</h2>
            {pendingReviews.map((d, i) => (
              <DecisionCard
                key={d.id}
                d={d}
                i={i}
                isPending
                reviewText={reviewTexts[d.id] || ''}
                onReviewTextChange={(v) => setReviewTexts((p) => ({ ...p, [d.id]: v }))}
                onReview={() => handleReview(d.id)}
                onDelete={() => { deleteDecision(d.id); toast('Decision deleted.') }}
                inputCls={inputCls}
              />
            ))}
          </div>
        )}

        {/* All Decisions */}
        <div className="space-y-3">
          {rest.map((d, i) => (
            <DecisionCard
              key={d.id}
              d={d}
              i={i}
              reviewText={reviewTexts[d.id] || ''}
              onReviewTextChange={(v) => setReviewTexts((p) => ({ ...p, [d.id]: v }))}
              onReview={() => handleReview(d.id)}
              onDelete={() => { deleteDecision(d.id); toast('Decision deleted.') }}
              inputCls={inputCls}
            />
          ))}
          {sorted.length === 0 && (
            <p className="text-[13px] text-[var(--text-dim)] text-center py-8">No decisions logged yet.</p>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

function DecisionCard({
  d, i, isPending, reviewText, onReviewTextChange, onReview, onDelete, inputCls,
}: {
  d: any; i: number; isPending?: boolean; reviewText: string
  onReviewTextChange: (v: string) => void; onReview: () => void; onDelete: () => void; inputCls: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      className="rounded-[16px] p-5 group relative"
      style={{ background: '#0e1018' }}
    >
      <div className="text-[10px] font-mono text-[var(--text-dim)] mb-1">{fmtDate(d.createdAt)}</div>
      <div className="text-[14px] font-semibold text-white mb-1">{d.decision}</div>
      {d.reasoning && <div className="text-[13px] text-[var(--text-mid)] mb-1"><span className="text-[var(--text-dim)]">Why:</span> {d.reasoning}</div>}
      {d.expectedOutcome && <div className="text-[13px] text-[var(--text-mid)] mb-2"><span className="text-[var(--text-dim)]">Expected:</span> {d.expectedOutcome}</div>}

      {d.actualOutcome ? (
        <div className="text-[13px] text-emerald-400 mt-2 border-t border-[var(--border)] pt-2">
          <span className="text-[var(--text-dim)]">Outcome:</span> {d.actualOutcome}
        </div>
      ) : d.reviewDate && daysUntil(d.reviewDate) <= 0 ? (
        <div className="mt-3 space-y-2">
          <span className="text-[11px] bg-amber-500/15 text-amber-400 rounded-md px-2 py-0.5">Review due</span>
          <textarea
            className={inputCls}
            rows={2}
            placeholder="How did it play out?"
            value={reviewText}
            onChange={(e) => onReviewTextChange(e.target.value)}
          />
          <button onClick={onReview} className="text-[12px] text-emerald-400 hover:text-emerald-300">
            Save Outcome
          </button>
        </div>
      ) : d.reviewDate ? (
        <div className="text-[10px] text-[var(--text-dim)] mt-2">
          Review in {daysUntil(d.reviewDate)} days
        </div>
      ) : null}

      <button
        onClick={onDelete}
        className="absolute top-4 right-4 text-[var(--text-dim)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-[12px]"
      >
        Delete
      </button>
    </motion.div>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
