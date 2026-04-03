'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const LEVELS = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'] as const
type Level = typeof LEVELS[number]

const LEVEL_LABELS: Record<Level, string> = {
  daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', annual: 'Annual',
}

export default function ReportsPage() {
  const { aiReports, addAiReport, anthropicKey, businesses, clients, tasks, todayHealth, streaks, commitments } = useStore()
  const [activeLevel, setActiveLevel] = useState<Level>('daily')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const levelReports = aiReports
    .filter(r => r.level === activeLevel)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  async function generateReport() {
    if (!anthropicKey) {
      toast.error('Connect API key in Settings')
      return
    }
    setLoading(true)
    try {
      const context = JSON.stringify({
        businesses: businesses.map(b => ({ name: b.name, revenue: b.monthlyRevenue })),
        activeClients: clients.filter(c => c.active).length,
        openTasks: tasks.filter(t => !t.done).length,
        completedToday: tasks.filter(t => t.done && t.completedAt?.startsWith(new Date().toISOString().split('T')[0])).length,
        health: { gym: todayHealth.gym, energyDrinks: todayHealth.energyDrinks, screenTime: todayHealth.screenTimeHours },
        streaks: streaks.map(s => ({ habit: s.habit, current: s.currentStreak })),
        commitments: commitments.slice(0, 5).map(c => ({ text: c.text, done: c.fulfilled })),
      })

      const prompts: Record<Level, string> = {
        daily: `Generate a concise Daily Debrief report. Review today's performance, wins, misses, and give a letter grade (A-F). Context: ${context}`,
        weekly: `Generate a Weekly Review report. Summarize the week's progress, patterns, wins, areas for improvement, and a letter grade. Context: ${context}`,
        monthly: `Generate a Monthly Report. Analyze trends, revenue trajectory, habit consistency, key wins, biggest risks, and a letter grade. Context: ${context}`,
        quarterly: `Generate a Quarterly Strategy Report. Evaluate business trajectory, goal progress, recommended pivots, and a letter grade. Context: ${context}`,
        annual: `Generate an Annual Review. Comprehensive analysis of growth, milestones, lessons learned, and next year's priorities. Give a letter grade. Context: ${context}`,
      }

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompts[activeLevel] }], apiKey: anthropicKey }),
      })

      if (!res.ok) throw new Error('Failed to generate report')
      const data = await res.json()
      const content = data.content || data.message || ''
      const gradeMatch = content.match(/Grade:\s*([A-F][+-]?)/i)

      addAiReport({
        level: activeLevel,
        content,
        date: new Date().toISOString().split('T')[0],
        grade: gradeMatch?.[1] || undefined,
      })
      toast.success(`${LEVEL_LABELS[activeLevel]} report generated`)
    } catch (err) {
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
          <p className="text-sm text-[var(--text-dim)] mt-1">Cascading intelligence from daily to annual.</p>
        </div>

        {/* Level Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {LEVELS.map(l => (
            <button
              key={l}
              onClick={() => { setActiveLevel(l); setExpanded(null) }}
              className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-colors ${activeLevel === l ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg)] text-[var(--text-dim)] border border-[var(--border)] hover:border-[var(--accent)]'}`}
            >
              {LEVEL_LABELS[l]}
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateReport}
          disabled={loading}
          className="w-full rounded-[12px] border border-[var(--accent)]/30 bg-[var(--accent)]/10 py-3 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors disabled:opacity-50"
        >
          {loading ? 'Generating...' : `Generate ${LEVEL_LABELS[activeLevel]} Report`}
        </motion.button>

        {/* Reports List */}
        {levelReports.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[16px] border border-[#1e2338] bg-[#0e1018] p-8 text-center">
            <p className="text-sm text-[var(--text-dim)]">No {activeLevel} reports yet. Generate your first one.</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {levelReports.map(report => {
                const isExpanded = expanded === report.id
                return (
                  <motion.div
                    key={report.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setExpanded(isExpanded ? null : report.id)}
                    className="rounded-[16px] border border-[#1e2338] bg-[#0e1018] p-4 cursor-pointer hover:border-[var(--accent)]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--text)]">{report.date}</span>
                      {report.grade && (
                        <span className="text-xs font-bold bg-[var(--accent)]/15 text-[var(--accent)] px-2 py-0.5 rounded-full">{report.grade}</span>
                      )}
                    </div>
                    <p className={`text-[13px] text-[var(--text-dim)] mt-2 whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-3'}`}>
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
