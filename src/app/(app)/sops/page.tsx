'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore, type SOP } from '@/stores/store'
import { BUSINESSES } from '@/lib/constants'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  not_started: { bg: 'bg-[var(--text-dim)]/20 text-[var(--text-dim)]', label: 'Not Started' },
  in_progress: { bg: 'bg-[var(--amber)]/20 text-[var(--amber)]', label: 'In Progress' },
  documented: { bg: 'bg-[var(--accent)]/20 text-[var(--accent)]', label: 'Documented' },
}

export default function SopsPage() {
  const { sops, addSop, updateSop } = useStore()
  const [newTitle, setNewTitle] = useState('')
  const [newBiz, setNewBiz] = useState('agency')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleAdd = () => {
    if (!newTitle.trim()) return
    addSop({ businessId: newBiz, title: newTitle.trim(), status: 'not_started' })
    setNewTitle('')
    toast.success('SOP added')
  }

  const documented = sops.filter((s) => s.status === 'documented').length
  const pct = sops.length > 0 ? Math.round((documented / sops.length) * 100) : 0

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 pb-20">
        <StaggerItem>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            SOP Library
          </h1>
        </StaggerItem>

        {/* Completion bar */}
        <StaggerItem>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="label text-[10px] tracking-widest text-[var(--accent)]">DOCUMENTATION PROGRESS</span>
              <span className="data text-sm font-semibold text-[var(--accent)]">{pct}%</span>
            </div>
            <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--accent)]"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--text-dim)]">{documented} of {sops.length} SOPs documented</p>
          </div>
        </StaggerItem>

        {/* Add SOP */}
        <StaggerItem>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <div className="flex gap-2">
              <select
                value={newBiz}
                onChange={(e) => setNewBiz(e.target.value)}
                className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-xs text-[var(--text)] outline-none"
              >
                {BUSINESSES.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="SOP title..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)]"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAdd}
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--bg)]"
              >
                Add SOP
              </motion.button>
            </div>
          </div>
        </StaggerItem>

        {/* SOPs list */}
        <div className="space-y-2">
          {sops.map((sop) => {
            const expanded = expandedId === sop.id
            const biz = BUSINESSES.find((b) => b.id === sop.businessId)
            const st = STATUS_STYLES[sop.status]
            return (
              <StaggerItem key={sop.id}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
                >
                  <div
                    className="flex items-center gap-3 p-3 cursor-pointer"
                    onClick={() => setExpandedId(expanded ? null : sop.id)}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ background: biz?.color || '#666' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text)]">{sop.title}</p>
                      <p className="text-xs text-[var(--text-dim)]">{biz?.name}</p>
                    </div>
                    <select
                      value={sop.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        updateSop(sop.id, { status: e.target.value as SOP['status'] })
                        toast.success(`Status updated to ${STATUS_STYLES[e.target.value].label}`)
                      }}
                      className={`rounded-lg px-2 py-1 text-[10px] font-semibold border-0 outline-none cursor-pointer ${st.bg}`}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="documented">Documented</option>
                    </select>
                    <span className="text-[var(--text-dim)] text-xs">{expanded ? '\u25B2' : '\u25BC'}</span>
                  </div>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-[var(--border)] p-3"
                    >
                      <textarea
                        value={sop.content || ''}
                        onChange={(e) => updateSop(sop.id, { content: e.target.value })}
                        placeholder="Document this SOP..."
                        rows={6}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)] resize-y"
                      />
                    </motion.div>
                  )}
                </motion.div>
              </StaggerItem>
            )
          })}
          {sops.length === 0 && (
            <p className="text-center text-sm text-[var(--text-dim)] py-10">No SOPs yet. Start documenting your processes.</p>
          )}
        </div>
      </StaggerContainer>
    </PageTransition>
  )
}
