'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore, type DecisionEntry, type DecisionOutcomeRating } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const REVIEW_OPTIONS = [
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
]

const RATING_CHIPS: { id: DecisionOutcomeRating; label: string }[] = [
  { id: 'better', label: 'Better' },
  { id: 'as_expected', label: 'As expected' },
  { id: 'worse', label: 'Worse' },
  { id: 'much_worse', label: 'Much worse' },
]

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
}

function decisionAccuracyPct(journal: DecisionEntry[]): number | null {
  const rated = journal.filter((d) => d.outcomeRating)
  if (rated.length === 0) return null
  const good = rated.filter((d) => d.outcomeRating === 'better' || d.outcomeRating === 'as_expected').length
  return Math.round((good / rated.length) * 100)
}

function DecisionsPageInner() {
  const searchParams = useSearchParams()
  const { decisionJournal, addDecision, updateDecision, deleteDecision } = useStore()
  const [open, setOpen] = useState(false)
  const [decision, setDecision] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [expected, setExpected] = useState('')
  const [reviewDays, setReviewDays] = useState(30)
  const [reviewTexts, setReviewTexts] = useState<Record<string, string>>({})
  const [ratings, setRatings] = useState<Record<string, DecisionOutcomeRating | undefined>>({})
  const scrolled = useRef(false)

  const focusId = searchParams.get('review')

  useEffect(() => {
    if (!focusId || scrolled.current) return
    const t = window.setTimeout(() => {
      document.getElementById(`decision-${focusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      scrolled.current = true
    }, 400)
    return () => window.clearTimeout(t)
  }, [focusId])

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
    const rating = ratings[id]
    const text = reviewTexts[id]?.trim()
    if (!rating) {
      toast.error('Choose how it played out.')
      return
    }
    updateDecision(id, {
      outcomeRating: rating,
      actualOutcome: text || `Rated: ${rating}`,
    })
    setReviewTexts((p) => ({ ...p, [id]: '' }))
    setRatings((p) => ({ ...p, [id]: undefined }))
    toast.success('Outcome recorded.')
  }

  const sorted = [...decisionJournal].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const pendingReviews = sorted.filter((d) => d.reviewDate && !d.actualOutcome && daysUntil(d.reviewDate) <= 0)
  const rest = sorted.filter((d) => !pendingReviews.includes(d))
  const acc = decisionAccuracyPct(decisionJournal)

  const inputCls =
    'w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 min-h-[44px] text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] resize-none transition-[border-color] duration-200'

  return (
    <PageTransition>
      <div className="space-y-6">
        <div>
          <h1 className="title">Decision Journal</h1>
          <p className="subheadline mt-1">Log decisions. Review outcomes. Build judgment.</p>
          {acc != null && (
            <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
              Decision accuracy (vs expectation):{' '}
              <span className="data font-semibold text-[var(--accent)]">{acc}%</span>
              <span className="text-[var(--text-dim)]"> — from rated outcomes</span>
            </p>
          )}
        </div>

        <motion.div className="card rounded-2xl p-5">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="headline flex w-full items-center gap-2 text-left text-[var(--text-primary)]"
          >
            <span className="text-[var(--accent)]">{open ? '−' : '+'}</span> New decision
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
                  <textarea
                    className={inputCls}
                    rows={2}
                    placeholder="What did you decide?"
                    value={decision}
                    onChange={(e) => setDecision(e.target.value)}
                  />
                  <textarea
                    className={inputCls}
                    rows={2}
                    placeholder="Why?"
                    value={reasoning}
                    onChange={(e) => setReasoning(e.target.value)}
                  />
                  <textarea
                    className={inputCls}
                    rows={2}
                    placeholder="What do you expect to happen?"
                    value={expected}
                    onChange={(e) => setExpected(e.target.value)}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="footnote text-[var(--text-secondary)]">Review in:</span>
                    {REVIEW_OPTIONS.map((opt) => (
                      <button
                        type="button"
                        key={opt.days}
                        onClick={() => setReviewDays(opt.days)}
                        className={`min-h-[44px] rounded-lg border px-3 py-2 text-[13px] transition-colors ${
                          reviewDays === opt.days
                            ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <button type="button" onClick={handleSubmit} className="btn-primary">
                    Log decision
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {pendingReviews.length > 0 && (
          <div className="space-y-3">
            <h2 className="headline text-[var(--warning)]">Pending reviews</h2>
            {pendingReviews.map((d, i) => (
              <DecisionCard
                key={d.id}
                d={d}
                i={i}
                isPending
                highlight={focusId === d.id}
                reviewText={reviewTexts[d.id] || ''}
                rating={ratings[d.id]}
                onRating={(r) => setRatings((p) => ({ ...p, [d.id]: r }))}
                onReviewTextChange={(v) => setReviewTexts((p) => ({ ...p, [d.id]: v }))}
                onReview={() => handleReview(d.id)}
                onDelete={() => {
                  deleteDecision(d.id)
                  toast('Decision deleted.')
                }}
                inputCls={inputCls}
              />
            ))}
          </div>
        )}

        <div className="space-y-3">
          {rest.map((d, i) => (
            <DecisionCard
              key={d.id}
              d={d}
              i={i}
              highlight={focusId === d.id}
              reviewText={reviewTexts[d.id] || ''}
              rating={ratings[d.id]}
              onRating={(r) => setRatings((p) => ({ ...p, [d.id]: r }))}
              onReviewTextChange={(v) => setReviewTexts((p) => ({ ...p, [d.id]: v }))}
              onReview={() => handleReview(d.id)}
              onDelete={() => {
                deleteDecision(d.id)
                toast('Decision deleted.')
              }}
              inputCls={inputCls}
            />
          ))}
          {sorted.length === 0 && (
            <p className="py-8 text-center text-[13px] text-[var(--text-dim)]">No decisions logged yet.</p>
          )}
        </div>
      </div>
    </PageTransition>
  )
}

export default function DecisionsPage() {
  return (
    <Suspense fallback={<PageTransition><p className="p-6 text-[var(--text-dim)]">Loading…</p></PageTransition>}>
      <DecisionsPageInner />
    </Suspense>
  )
}

function DecisionCard({
  d,
  i,
  isPending,
  highlight,
  reviewText,
  rating,
  onRating,
  onReviewTextChange,
  onReview,
  onDelete,
  inputCls,
}: {
  d: DecisionEntry
  i: number
  isPending?: boolean
  highlight?: boolean
  reviewText: string
  rating?: DecisionOutcomeRating
  onRating: (r: DecisionOutcomeRating) => void
  onReviewTextChange: (v: string) => void
  onReview: () => void
  onDelete: () => void
  inputCls: string
}) {
  const due = d.reviewDate && daysUntil(d.reviewDate) <= 0 && !d.actualOutcome

  return (
    <motion.div
      id={`decision-${d.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03, ease: [0.25, 0.1, 0.25, 1] as const }}
      className={`group relative card rounded-2xl p-5 ${highlight ? 'ring-2 ring-[var(--accent)]' : ''}`}
    >
      <div className="caption data-number mb-1 text-[var(--text-tertiary)]">{fmtDate(d.createdAt)}</div>
      <div className="headline mb-1">{d.decision}</div>
      {d.reasoning && (
        <div className="body mb-1 text-[var(--text-secondary)]">
          <span className="text-[var(--text-tertiary)]">Why:</span> {d.reasoning}
        </div>
      )}
      {d.expectedOutcome && (
        <div className="body mb-2 text-[var(--text-secondary)]">
          <span className="text-[var(--text-tertiary)]">Expected:</span> {d.expectedOutcome}
        </div>
      )}

      {d.actualOutcome ? (
        <div className="body mt-2 border-t border-[var(--separator)] pt-2 text-[var(--positive)]">
          <span className="text-[var(--text-tertiary)]">Outcome:</span> {d.actualOutcome}
          {d.outcomeRating && (
            <span className="ml-2 text-[12px] text-[var(--text-dim)]">({d.outcomeRating.replace('_', ' ')})</span>
          )}
        </div>
      ) : due ? (
        <div className="mt-3 space-y-3">
          <span className="caption rounded-md bg-[rgba(255,159,10,0.12)] px-2 py-1 text-[var(--warning)]">
            {isPending ? 'Review due (from inbox)' : 'Review due'}
          </span>
          <p className="text-[13px] text-[var(--text-secondary)]">How did it play out?</p>
          <div className="flex flex-wrap gap-2">
            {RATING_CHIPS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onRating(c.id)}
                className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
                  rating === c.id
                    ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <textarea
            className={inputCls}
            rows={2}
            placeholder="Notes (optional)"
            value={reviewText}
            onChange={(e) => onReviewTextChange(e.target.value)}
          />
          <button type="button" onClick={onReview} className="btn-text text-[17px]">
            Save outcome
          </button>
        </div>
      ) : d.reviewDate ? (
        <div className="mt-2 text-[10px] text-[var(--text-dim)]">Review in {daysUntil(d.reviewDate)} days</div>
      ) : null}

      <button
        onClick={onDelete}
        type="button"
        className="footnote absolute right-4 top-4 min-h-[44px] px-2 text-[var(--text-tertiary)] opacity-0 transition-opacity hover:text-[var(--negative)] group-hover:opacity-100"
      >
        Delete
      </button>
    </motion.div>
  )
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
