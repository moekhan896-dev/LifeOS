'use client'

import Link from 'next/link'
import { useStore, type Insight } from '@/stores/store'

const TYPE_STYLES: Record<string, { label: string; classes: string }> = {
  revenue: { label: 'Revenue Opportunity', classes: 'bg-[var(--accent)]/15 text-[var(--accent)]' },
  risk: { label: 'Risk Alert', classes: 'bg-[var(--rose)]/15 text-[var(--rose)]' },
  efficiency: { label: 'Efficiency Play', classes: 'bg-[var(--blue)]/15 text-[var(--blue)]' },
}

interface InsightCardProps {
  insight: Insight
}

export default function InsightCard({ insight }: InsightCardProps) {
  const { rateInsight, snoozeInsight } = useStore()
  const typeStyle = TYPE_STYLES[insight.type] || TYPE_STYLES.efficiency

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 transition-all duration-200 hover:border-[var(--border-glow)] group">
      {/* Badges */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${typeStyle.classes}`}>
          {typeStyle.label}
        </span>
        <span className="label text-[10px] text-[var(--text-dim)] bg-[var(--surface2)] px-2 py-0.5 rounded-md">
          {insight.priority}
        </span>
      </div>

      {/* Content */}
      <h3 className="text-[14px] font-semibold text-[var(--text)] mb-1.5">{insight.title}</h3>
      <p className="text-[12px] text-[var(--text-mid)] leading-relaxed mb-3">{insight.body}</p>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {([
          { emoji: '👍', action: () => rateInsight(insight.id, 'up'), active: insight.rating === 'up' },
          { emoji: '👎', action: () => rateInsight(insight.id, 'down'), active: insight.rating === 'down' },
          { emoji: '⏰', action: () => snoozeInsight(insight.id), active: false },
        ] as const).map((btn, i) => (
          <button
            key={i}
            onClick={btn.action}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-all duration-150 hover:scale-110 ${
              btn.active ? 'bg-[var(--accent)]/15 scale-105' : 'hover:bg-[var(--surface2)]'
            }`}
          >
            {btn.emoji}
          </button>
        ))}
        <Link
          href={`/ai?context=${encodeURIComponent(insight.title)}`}
          className="ml-auto flex items-center gap-1 text-[11px] text-[var(--cyan)] hover:text-[var(--text)] transition-colors px-2 py-1 rounded-lg hover:bg-[var(--surface2)]"
        >
          🧠 <span>Discuss with AI</span>
        </Link>
      </div>
    </div>
  )
}
