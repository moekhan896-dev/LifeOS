'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, type Insight } from '@/stores/store'
import { toast } from 'sonner'

const TYPE_STYLES: Record<string, { label: string; classes: string; border: string }> = {
  revenue: { label: 'Revenue Opportunity', classes: 'bg-[var(--accent)]/15 text-[var(--accent)]', border: 'var(--accent)' },
  risk: { label: 'Risk Alert', classes: 'bg-[var(--rose)]/15 text-[var(--rose)]', border: 'var(--rose)' },
  efficiency: { label: 'Efficiency Play', classes: 'bg-[var(--blue)]/15 text-[var(--blue)]', border: 'var(--blue)' },
}

interface InsightCardProps {
  insight: Insight
}

export default function InsightCard({ insight }: InsightCardProps) {
  const { rateInsight, snoozeInsight } = useStore()
  const typeStyle = TYPE_STYLES[insight.type] || TYPE_STYLES.efficiency

  const handleSnooze = () => {
    snoozeInsight(insight.id)
    toast('Insight snoozed for 7 days')
  }

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        layout
        key={insight.id}
        className="card bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-4 group"
        style={{
          borderLeft: `3px solid ${typeStyle.border}`,
        }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0, padding: 0, overflow: 'hidden' }}
        whileHover={{
          y: -2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Badges */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-[8px] ${typeStyle.classes}`}>
            {typeStyle.label}
          </span>
          <span className="label text-[10px] text-[var(--text-dim)] bg-[var(--surface2)] px-2 py-0.5 rounded-[8px]">
            {insight.priority}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-[14px] font-semibold text-[var(--text)] mb-1.5">{insight.title}</h3>
        <p className="text-[12px] text-[var(--text-mid)] leading-[1.6] mb-3">{insight.body}</p>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {([
            { emoji: '\u{1F44D}', action: () => { rateInsight(insight.id, 'up'); toast('Rated up') }, active: insight.rating === 'up' },
            { emoji: '\u{1F44E}', action: () => { rateInsight(insight.id, 'down'); toast('Rated down') }, active: insight.rating === 'down' },
            { emoji: '\u23F0', action: handleSnooze, active: false },
          ] as const).map((btn, i) => (
            <motion.button
              key={i}
              onClick={btn.action}
              className={`w-8 h-8 flex items-center justify-center rounded-[8px] text-sm ${
                btn.active ? 'bg-[var(--accent)]/15 scale-105' : 'hover:bg-[var(--surface2)]'
              }`}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              {btn.emoji}
            </motion.button>
          ))}
          <Link
            href={`/ai?context=${encodeURIComponent(insight.title)}`}
            className="ml-auto flex items-center gap-1 text-[11px] text-[var(--cyan)] hover:text-[var(--text)] transition-colors px-2 py-1 rounded-[8px] hover:bg-[var(--surface2)]"
          >
            Discuss with AI &rarr;
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
