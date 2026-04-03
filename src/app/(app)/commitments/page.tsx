'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'

export default function CommitmentsPage() {
  const { commitments, addCommitment, fulfillCommitment } = useStore()
  const [text, setText] = useState('')
  const [source, setSource] = useState('')
  const [dueDate, setDueDate] = useState('')

  const handleAdd = () => {
    if (!text.trim()) return
    addCommitment(text.trim(), source.trim() || 'Self', dueDate || undefined)
    setText('')
    setSource('')
    setDueDate('')
    toast.success('Commitment added')
  }

  const total = commitments.length
  const fulfilled = commitments.filter((c) => c.fulfilled).length
  const rate = total > 0 ? Math.round((fulfilled / total) * 100) : 0

  // 30-day rolling
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recent = commitments.filter((c) => new Date(c.createdAt) >= thirtyDaysAgo)
  const recentFulfilled = recent.filter((c) => c.fulfilled).length
  const recentRate = recent.length > 0 ? Math.round((recentFulfilled / recent.length) * 100) : 0

  const sorted = [...commitments].sort((a, b) => {
    if (a.fulfilled !== b.fulfilled) return a.fulfilled ? 1 : -1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 pb-20">
        <StaggerItem>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            Commitment Tracker
          </h1>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 gap-3">
            <motion.div whileHover={{ scale: 1.02 }} className="card p-3">
              <span className="label text-[10px] tracking-widest text-[var(--text-dim)]">ALL-TIME RATE</span>
              <p className={`data text-2xl font-bold mt-1 ${rate >= 80 ? 'text-[var(--accent)]' : rate >= 50 ? 'text-[var(--amber)]' : 'text-[var(--rose)]'}`}>
                {rate}%
              </p>
              <p className="text-xs text-[var(--text-dim)]">{fulfilled}/{total} kept</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="card p-3">
              <span className="label text-[10px] tracking-widest text-[var(--text-dim)]">30-DAY RATE</span>
              <p className={`data text-2xl font-bold mt-1 ${recentRate >= 80 ? 'text-[var(--accent)]' : recentRate >= 50 ? 'text-[var(--amber)]' : 'text-[var(--rose)]'}`}>
                {recentRate}%
              </p>
              <p className="text-xs text-[var(--text-dim)]">{recentFulfilled}/{recent.length} kept</p>
            </motion.div>
          </div>
        </StaggerItem>

        {/* Add */}
        <StaggerItem>
          <div className="card p-3">
            <span className="label text-[10px] tracking-widest text-[var(--accent)] mb-2 block">ADD COMMITMENT</span>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="What did you commit to?"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)]"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Source (who/where)"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none"
                />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] outline-none"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAdd}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--bg)]"
                >
                  Add
                </motion.button>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* List */}
        <div className="space-y-2">
          {sorted.map((c) => (
            <StaggerItem key={c.id}>
              <motion.div
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`card p-3 flex items-start gap-3 ${
                  c.fulfilled ? 'border-[var(--accent)]/20' : 'border-[var(--border)]'
                }`}
              >
                <motion.button
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (!c.fulfilled) {
                      fulfillCommitment(c.id)
                      toast.success('Commitment fulfilled!')
                    }
                  }}
                  className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                    c.fulfilled ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border)] hover:border-[var(--accent)]'
                  }`}
                >
                  {c.fulfilled && <span className="text-[var(--bg)] text-xs">&#10003;</span>}
                </motion.button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${c.fulfilled ? 'line-through text-[var(--text-dim)]' : 'text-[var(--text)]'}`}>
                    {c.text}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-[var(--text-dim)]">
                    <span>From: {c.source}</span>
                    {c.dueDate && <span>Due: {c.dueDate}</span>}
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
          {commitments.length === 0 && (
            <p className="text-center text-sm text-[var(--text-dim)] py-10">No commitments tracked yet.</p>
          )}
        </div>
      </StaggerContainer>
    </PageTransition>
  )
}
