'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const DELIVER_OPTIONS = [
  { label: '30 days', days: 30 },
  { label: '60 days', days: 60 },
  { label: '90 days', days: 90 },
]

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CapsulePage() {
  const { timeCapsules, addTimeCapsule, openTimeCapsule } = useStore()
  const [letter, setLetter] = useState('')
  const [deliverDays, setDeliverDays] = useState(30)
  const [revealedId, setRevealedId] = useState<string | null>(null)

  const handleSeal = () => {
    if (!letter.trim()) return
    const deliverDate = new Date(Date.now() + deliverDays * 86400000).toISOString()
    addTimeCapsule(letter.trim(), deliverDate)
    setLetter('')
    toast.success('Capsule sealed!')
  }

  const handleOpen = (id: string) => {
    openTimeCapsule(id)
    setRevealedId(id)
    toast.success('Capsule opened!')
  }

  const sealed = timeCapsules.filter((c) => !c.delivered && daysUntil(c.deliverDate) > 0)
  const ready = timeCapsules.filter((c) => !c.delivered && daysUntil(c.deliverDate) <= 0)
  const opened = timeCapsules.filter((c) => c.delivered)

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="title">Time Capsule</h1>
          <p className="subheadline mt-1">Write to your future self.</p>
        </div>

        {/* Write Form */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const }}
          className="card rounded-2xl p-5"
        >
          <h2 className="headline mb-3">Write a capsule</h2>
          <textarea
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl px-4 py-3 text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] resize-none min-h-[120px] transition-[border-color] duration-200"
            placeholder="Dear Future Art..."
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <span className="footnote text-[var(--text-secondary)]">Open in:</span>
            {DELIVER_OPTIONS.map((opt) => (
              <button
                type="button"
                key={opt.days}
                onClick={() => setDeliverDays(opt.days)}
                className={`text-[13px] px-3 py-2 min-h-[44px] rounded-lg border transition-colors ${
                  deliverDays === opt.days
                    ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-bg)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleSeal} className="btn-primary mt-4">
            Seal capsule →
          </button>
        </motion.div>

        {/* Ready to Open */}
        {ready.length > 0 && (
          <div className="space-y-3">
            <h2 className="headline text-[var(--accent)]">Ready to open</h2>
            {ready.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, ease: [0.25, 0.1, 0.25, 1] as const }}
                className="card rounded-2xl p-5 border-l-[3px] border-l-[var(--accent)]"
              >
                <div className="caption data-number text-[var(--text-tertiary)]">Sealed {fmtDate(c.createdAt)}</div>
                <div className="body text-[var(--text-secondary)] mt-1">Delivery date has passed!</div>
                <button
                  type="button"
                  onClick={() => handleOpen(c.id)}
                  className="btn-text mt-3 font-semibold"
                >
                  Open capsule
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Sealed Capsules */}
        {sealed.length > 0 && (
          <div className="space-y-3">
            <h2 className="headline text-[var(--warning)]">Sealed capsules</h2>
            {sealed.map((c, i) => {
              const days = daysUntil(c.deliverDate)
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, ease: [0.25, 0.1, 0.25, 1] as const }}
                  className="card rounded-2xl p-5 border-l-[3px] border-l-[color-mix(in_srgb,var(--spiritual)_40%,transparent)]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">&#x1F512;</span>
                    <div>
                      <div className="caption data-number text-[var(--text-tertiary)]">
                        Sealed {fmtDate(c.createdAt)} &middot; Opens {fmtDate(c.deliverDate)}
                      </div>
                      <div className="footnote text-[var(--text-secondary)] mt-0.5">{days} days until delivery</div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Opened Capsules */}
        {opened.length > 0 && (
          <div className="space-y-3">
            <h2 className="headline text-[var(--positive)]">Opened capsules</h2>
            {opened.map((c, i) => (
              <motion.div
                key={c.id}
                initial={revealedId === c.id ? { opacity: 0, scaleY: 0.3, originY: 0 } : { opacity: 1 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="card rounded-2xl p-5 border-l-[3px] border-l-[var(--positive)]"
              >
                <div className="caption data-number text-[var(--text-tertiary)] mb-2">
                  Written {fmtDate(c.createdAt)} &middot; Opened {fmtDate(c.deliverDate)}
                </div>
                <div className="body leading-relaxed whitespace-pre-wrap">{c.letter}</div>
              </motion.div>
            ))}
          </div>
        )}

        {timeCapsules.length === 0 && (
          <p className="text-[13px] text-[var(--text-dim)] text-center py-8">No capsules yet. Write one above.</p>
        )}
      </div>
    </PageTransition>
  )
}
