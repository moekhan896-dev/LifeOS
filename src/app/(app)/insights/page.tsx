'use client'

import { useState, useMemo } from 'react'
import { useStore, type InsightType } from '@/stores/store'
import InsightCard from '@/components/InsightCard'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const FILTERS: { key: 'all' | InsightType; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: 'bg-[var(--surface2)] text-[var(--text)]' },
  { key: 'revenue', label: 'Revenue Opportunities', color: 'bg-[var(--accent)]/15 text-[var(--accent)]' },
  { key: 'risk', label: 'Risk Alerts', color: 'bg-[var(--rose)]/15 text-[var(--rose)]' },
  { key: 'efficiency', label: 'Efficiency Plays', color: 'bg-[var(--blue)]/15 text-[var(--blue)]' },
]

export default function InsightsPage() {
  const { insights, rateInsight, snoozeInsight } = useStore()
  const [activeFilter, setActiveFilter] = useState<'all' | InsightType>('all')

  const now = new Date().toISOString()

  const visibleInsights = useMemo(() => {
    return insights
      .filter((i) => !i.snoozedUntil || i.snoozedUntil <= now)
      .filter((i) => activeFilter === 'all' || i.type === activeFilter)
  }, [insights, activeFilter, now])

  const totalCount = insights.filter((i) => !i.snoozedUntil || i.snoozedUntil <= now).length
  const thumbsUp = insights.filter((i) => i.rating === 'up').length
  const thumbsDown = insights.filter((i) => i.rating === 'down').length
  const actionable = insights.filter((i) => !i.rating && (!i.snoozedUntil || i.snoozedUntil <= now)).length

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-[960px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-[22px] font-bold tracking-tight text-[var(--text)]">INSIGHTS</h1>
          <span className="data bg-[var(--accent)]/15 text-[var(--accent)] text-[12px] font-semibold px-2.5 py-0.5 rounded-full">
            {totalCount}
          </span>
        </div>

        {/* Stats Row */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total', value: totalCount, icon: '📊' },
            { label: 'Thumbs Up', value: thumbsUp, icon: '👍' },
            { label: 'Thumbs Down', value: thumbsDown, icon: '👎' },
            { label: 'Actionable', value: actionable, icon: '⚡' },
          ].map((stat) => (
            <StaggerItem key={stat.label}>
              <motion.div
                whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                className="card p-3 flex items-center gap-3"
              >
                <span className="text-lg">{stat.icon}</span>
                <div>
                  <p className="data text-[18px] font-bold text-[var(--text)]">{stat.value}</p>
                  <p className="label">{stat.label}</p>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {FILTERS.map((f) => (
            <motion.button
              key={f.key}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setActiveFilter(f.key)
                toast(`Showing ${f.label.toLowerCase()}`)
              }}
              className={`text-[12px] font-semibold px-3.5 py-1.5 rounded-lg transition-all duration-150 ${
                activeFilter === f.key
                  ? `${f.color} ring-1 ring-current`
                  : 'bg-[var(--surface)] text-[var(--text-dim)] hover:text-[var(--text-mid)] border border-[var(--border)]'
              }`}
            >
              {f.label}
            </motion.button>
          ))}
        </div>

        {/* Feed */}
        {visibleInsights.length > 0 ? (
          <StaggerContainer className="flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-340px)] pr-1">
            {visibleInsights.map((insight) => (
              <StaggerItem key={insight.id}>
                <InsightCard insight={insight} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center text-3xl mb-5">
              🧠
            </div>
            <h3 className="text-[16px] font-semibold text-[var(--text)] mb-2">No insights yet</h3>
            <p className="text-[13px] text-[var(--text-mid)] max-w-[340px] leading-relaxed">
              Your AI engine will generate insights daily at 6 AM. Check back soon.
            </p>
          </motion.div>
        )}
      </div>
    </PageTransition>
  )
}
