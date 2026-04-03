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
          <h1 style={{ fontSize: 28, fontWeight: 600 }} className="text-white">Time Capsule</h1>
          <p className="text-[13px] text-[var(--text-mid)] mt-1">Write to your future self.</p>
        </div>

        {/* Write Form */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[16px] p-5"
          style={{ background: '#0e1018' }}
        >
          <h2 className="text-[14px] font-semibold text-white mb-3">Write a Capsule</h2>
          <textarea
            className="w-full bg-[#1a1d2e] border border-[var(--border)] rounded-lg px-3 py-3 text-[13px] text-white placeholder:text-[var(--text-dim)] focus:outline-none focus:border-emerald-500/50 resize-none min-h-[120px]"
            placeholder="Dear Future Art..."
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
          />
          <div className="flex items-center gap-3 mt-3">
            <span className="text-[12px] text-[var(--text-dim)]">Open in:</span>
            {DELIVER_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setDeliverDays(opt.days)}
                className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                  deliverDays === opt.days
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                    : 'border-[var(--border)] text-[var(--text-dim)] hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleSeal}
            className="mt-4 text-[13px] font-medium px-5 py-2 rounded-lg text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            Seal capsule &rarr;
          </button>
        </motion.div>

        {/* Ready to Open */}
        {ready.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[14px] font-semibold text-emerald-400">Ready to Open</h2>
            {ready.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-[16px] p-5"
                style={{ background: '#0e1018', borderLeft: '3px solid #10b981' }}
              >
                <div className="text-[10px] font-mono text-[var(--text-dim)]">Sealed {fmtDate(c.createdAt)}</div>
                <div className="text-[13px] text-[var(--text-mid)] mt-1">Delivery date has passed!</div>
                <button
                  onClick={() => handleOpen(c.id)}
                  className="mt-3 text-[12px] text-emerald-400 hover:text-emerald-300 font-medium"
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
            <h2 className="text-[14px] font-semibold text-amber-400">Sealed Capsules</h2>
            {sealed.map((c, i) => {
              const days = daysUntil(c.deliverDate)
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-[16px] p-5"
                  style={{ background: '#0e1018', borderLeft: '3px solid #eab30833' }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[16px]">&#x1F512;</span>
                    <div>
                      <div className="text-[10px] font-mono text-[var(--text-dim)]">
                        Sealed {fmtDate(c.createdAt)} &middot; Opens {fmtDate(c.deliverDate)}
                      </div>
                      <div className="text-[13px] text-[var(--text-mid)] mt-0.5">{days} days until delivery</div>
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
            <h2 className="text-[14px] font-semibold text-emerald-400">Opened Capsules</h2>
            {opened.map((c, i) => (
              <motion.div
                key={c.id}
                initial={revealedId === c.id ? { opacity: 0, scaleY: 0.3, originY: 0 } : { opacity: 1 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="rounded-[16px] p-5"
                style={{ background: '#0e1018', borderLeft: '3px solid #10b981' }}
              >
                <div className="text-[10px] font-mono text-[var(--text-dim)] mb-2">
                  Written {fmtDate(c.createdAt)} &middot; Opened {fmtDate(c.deliverDate)}
                </div>
                <div className="text-[13px] text-white leading-relaxed whitespace-pre-wrap">{c.letter}</div>
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
