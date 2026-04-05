'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { buildFullSystemPrompt } from '@/lib/ai-context'

const LEVELS = ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom'] as const
type Level = (typeof LEVELS)[number]

const LEVEL_LABELS: Record<Level, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
  custom: 'Custom',
}

export default function ReportsPage() {
  const {
    aiReports,
    addAiReport,
    anthropicKey,
    businesses,
    clients,
    tasks,
    todayHealth,
    streaks,
    commitments,
  } = useStore()
  const [activeLevel, setActiveLevel] = useState<Level>('weekly')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [customTopic, setCustomTopic] = useState('')

  const levelReports = aiReports
    .filter((r) => r.level === activeLevel)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  async function generateReport() {
    setLoading(true)
    try {
      const st = useStore.getState()
      const context = buildFullSystemPrompt(st)
      const reportType =
        activeLevel === 'custom'
          ? 'custom'
          : activeLevel === 'daily'
            ? 'daily'
            : activeLevel

      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType,
          customTopic: activeLevel === 'custom' ? customTopic.trim() || 'General' : undefined,
          context,
          apiKey: anthropicKey || undefined,
        }),
      })

      const data = (await res.json()) as { content?: string; grade?: string; error?: string; rawTemplate?: boolean }
      if (!res.ok) throw new Error(data.error || 'Failed to generate report')

      const content = data.content || ''
      addAiReport({
        level: activeLevel === 'custom' ? 'custom' : activeLevel,
        content,
        date: new Date().toISOString().split('T')[0],
        grade: data.grade,
        topic: activeLevel === 'custom' ? customTopic.trim() || undefined : undefined,
      })
      toast.success(
        data.rawTemplate ? 'Template saved (add API key for AI narrative)' : `${LEVEL_LABELS[activeLevel]} report generated`
      )
    } catch {
      toast.error('Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="space-y-4 pb-24">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">AI Reports</h1>
          <p className="mt-1 text-[17px] text-[var(--text-dim)]">
            PRD §22 — cascading intelligence. Weekly auto-runs after Sunday on first load when an API key is set.
          </p>
        </div>

        <div
          className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar"
          role="tablist"
          aria-label="Report period"
        >
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={activeLevel === l}
              onClick={() => {
                setActiveLevel(l)
                setExpanded(null)
              }}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors ${
                activeLevel === l
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border)] bg-[var(--bg)] text-[var(--text-dim)] hover:border-[var(--accent)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {LEVEL_LABELS[l]}
            </button>
          ))}
        </div>

        {activeLevel === 'custom' && (
          <input
            className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[15px] text-[var(--text-primary)]"
            placeholder="Topic for custom report…"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
          />
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.1 }}
          onClick={generateReport}
          disabled={loading}
          className="w-full rounded-[12px] border border-[var(--accent)]/30 bg-[var(--accent)]/10 py-3 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/20 disabled:opacity-50"
        >
          {loading ? 'Generating...' : `Generate ${LEVEL_LABELS[activeLevel]} report`}
        </motion.button>

        {levelReports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center"
          >
            <p className="text-sm text-[var(--text-dim)]">No {activeLevel} reports yet. Generate your first one.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {levelReports.map((report) => {
                const isExpanded = expanded === report.id
                return (
                  <motion.div
                    key={report.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setExpanded(isExpanded ? null : report.id)}
                    className="cursor-pointer rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 transition-colors hover:border-[var(--accent)]/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[var(--text)]">{report.date}</span>
                      {report.grade && (
                        <span className="rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-bold text-[var(--accent)]">
                          {report.grade}
                        </span>
                      )}
                    </div>
                    {report.topic && (
                      <p className="mt-1 text-[12px] text-[var(--text-dim)]">Topic: {report.topic}</p>
                    )}
                    <p
                      className={`mt-2 whitespace-pre-wrap text-[13px] text-[var(--text-dim)] ${isExpanded ? '' : 'line-clamp-3'}`}
                    >
                      {report.content}
                    </p>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
