'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

/* ── Helpers ── */

function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

type FormKeys = 'worked' | 'didnt' | 'avoided' | 'change' | 'grateful'

const PROMPTS: readonly { key: FormKeys; label: string; placeholder: string; highlight?: boolean }[] = [
  { key: 'worked', label: 'What worked this week?', placeholder: 'Wins, breakthroughs, things that clicked...' },
  { key: 'didnt', label: "What didn't work?", placeholder: 'Failures, friction, what fell flat...' },
  { key: 'avoided', label: 'What did I avoid?', placeholder: 'The hard things you kept pushing off...', highlight: true },
  { key: 'change', label: 'What would I do differently?', placeholder: 'If you could rewind the week...' },
  { key: 'grateful', label: 'What am I grateful for?', placeholder: 'People, moments, progress...' },
]

/* ── Main ── */

export default function ReflectionsPage() {
  const { weeklyReflections, addReflection } = useStore()

  const currentWeekStart = getWeekStart()
  const hasCurrentWeek = weeklyReflections.some(r => r.weekStart === currentWeekStart)

  const [form, setForm] = useState<Record<FormKeys, string>>({
    worked: '', didnt: '', avoided: '', change: '', grateful: '',
  })
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!form.worked && !form.didnt && !form.avoided && !form.change && !form.grateful) {
      toast.error('Write at least one reflection')
      return
    }
    addReflection({ weekStart: currentWeekStart, ...form })
    setForm({ worked: '', didnt: '', avoided: '', change: '', grateful: '' })
    toast.success('Reflection saved. Clarity earned.')
  }

  const pastReflections = [...weeklyReflections]
    .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())

  return (
    <PageTransition>
      <div className="pb-24 max-w-2xl mx-auto">

        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 600 }} className="text-[var(--text)]">Weekly Reflection</h1>
          <p className="text-[13px] text-[var(--text-mid)] mt-1 italic">Every Sunday. 5 minutes. Massive clarity.</p>
        </motion.div>

        {/* Current Week Form */}
        {!hasCurrentWeek ? (
          <motion.div
            className="rounded-[16px] p-6 mb-8"
            style={{ background: '#0e1018', border: '1px solid var(--border)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-5">
              <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--accent)] font-semibold">
                WEEK OF {formatWeekLabel(currentWeekStart).toUpperCase()}
              </span>
            </div>

            <div className="space-y-5">
              {PROMPTS.map((prompt, i) => (
                <motion.div
                  key={prompt.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                >
                  <label className="block mb-1.5">
                    <span className={`text-[13px] font-semibold ${prompt.highlight ? 'text-[var(--amber)]' : 'text-[var(--text)]'}`}>
                      {prompt.label}
                    </span>
                    {prompt.highlight && (
                      <span className="ml-2 text-[10px] font-mono uppercase tracking-[1px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--amber)' }}>
                        MOST IMPORTANT
                      </span>
                    )}
                  </label>
                  <textarea
                    value={form[prompt.key]}
                    onChange={e => setForm(prev => ({ ...prev, [prompt.key]: e.target.value }))}
                    placeholder={prompt.placeholder}
                    rows={3}
                    className="w-full rounded-[14px] px-4 py-3 text-[13px] text-[var(--text)] placeholder:text-[var(--text-dim)] resize-none focus:outline-none transition-colors"
                    style={{
                      background: '#0e1018',
                      border: `1px solid ${prompt.highlight ? 'rgba(245,158,11,0.25)' : 'var(--border)'}`,
                    }}
                  />
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={handleSubmit}
              className="mt-6 w-full py-3 rounded-[14px] text-[14px] font-semibold text-white transition-colors"
              style={{ background: 'var(--accent)' }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Save Reflection
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            className="rounded-[16px] p-6 mb-8 text-center"
            style={{ background: '#0e1018', border: '1px solid var(--border)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-[var(--accent)] text-[14px] font-semibold">✓ This week&apos;s reflection is done.</p>
            <p className="text-[12px] text-[var(--text-dim)] mt-1">Come back next Sunday.</p>
          </motion.div>
        )}

        {/* Past Reflections */}
        {pastReflections.length > 0 && (
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-4 block">PAST REFLECTIONS</span>
            <div className="space-y-2">
              {pastReflections.map((r, i) => (
                <motion.div
                  key={r.id}
                  className="rounded-[16px] overflow-hidden"
                  style={{ background: '#0e1018', border: '1px solid var(--border)' }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <button
                    onClick={() => setExpandedWeek(expandedWeek === r.id ? null : r.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-[var(--surface2)]"
                  >
                    <span className="text-[13px] font-medium text-[var(--text)]">{formatWeekLabel(r.weekStart)}</span>
                    <motion.span
                      animate={{ rotate: expandedWeek === r.id ? 180 : 0 }}
                      className="text-[var(--text-dim)] text-[14px]"
                    >
                      ▾
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {expandedWeek === r.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 space-y-3">
                          {[
                            { label: 'What worked', value: r.worked },
                            { label: "What didn't work", value: r.didnt },
                            { label: 'What I avoided', value: r.avoided, highlight: true },
                            { label: 'What I\'d change', value: r.change },
                            { label: 'Grateful for', value: r.grateful },
                          ].filter(x => x.value).map((item, j) => (
                            <div key={j}>
                              <p className={`text-[10px] font-mono uppercase tracking-[1px] mb-0.5 ${item.highlight ? 'text-[var(--amber)]' : 'text-[var(--text-dim)]'}`}>
                                {item.label}
                              </p>
                              <p className="text-[12px] text-[var(--text-mid)] leading-relaxed">{item.value}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        )}

      </div>
    </PageTransition>
  )
}
