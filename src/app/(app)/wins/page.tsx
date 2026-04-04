'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'

const WIN_CATEGORIES = ['New Client', 'Big Job', 'Milestone', 'Follower Growth', 'Personal'] as const

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export default function WinsPage() {
  const { wins, businesses, addWin } = useStore()
  const [title, setTitle] = useState('')
  const [dollarValue, setDollarValue] = useState('')
  const [businessId, setBusinessId] = useState('agency')
  const [category, setCategory] = useState<string>('New Client')

  const handleAdd = () => {
    if (!title.trim()) return
    addWin({
      title: title.trim(),
      dollarValue: dollarValue ? Number(dollarValue) : undefined,
      businessId,
      category,
    })
    setTitle('')
    setDollarValue('')
    toast.success('Win logged!')
  }

  const totalValue = wins.reduce((s, w) => s + (w.dollarValue || 0), 0)

  // Win streak: consecutive days with at least one win
  const sortedWins = [...wins].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  let streak = 0
  if (sortedWins.length > 0) {
    const days = new Set(sortedWins.map((w) => w.createdAt.split('T')[0]))
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      if (days.has(ds)) streak++
      else break
    }
  }

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 pb-20">
        <StaggerItem>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            Win Tracker
          </h1>
        </StaggerItem>

        {/* Stats */}
        <StaggerItem>
          <div className="grid grid-cols-2 gap-3">
            <motion.div whileHover={{ scale: 1.02 }} className="card border-[var(--amber)]/30 bg-[var(--amber)]/5 p-3">
              <span className="label text-[10px] tracking-widest text-[var(--amber)]">TOTAL VALUE</span>
              <p className="data text-2xl font-bold text-[var(--amber)] mt-1">{fmt(totalValue)}</p>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} className="card border-[var(--amber)]/30 bg-[var(--amber)]/5 p-3">
              <span className="label text-[10px] tracking-widest text-[var(--amber)]">WIN STREAK</span>
              <p className="data text-2xl font-bold text-[var(--amber)] mt-1">{streak} day{streak !== 1 ? 's' : ''}</p>
            </motion.div>
          </div>
        </StaggerItem>

        {/* Add Win */}
        <StaggerItem>
          <div className="card border-[var(--amber)]/20 p-3">
            <span className="label text-[10px] tracking-widest text-[var(--amber)] mb-2 block">LOG A WIN</span>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="What did you win?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--amber)]"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="$ value (optional)"
                  value={dollarValue}
                  onChange={(e) => setDollarValue(e.target.value)}
                  className="w-32 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none"
                />
                <select
                  value={businessId}
                  onChange={(e) => setBusinessId(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-xs text-[var(--text)] outline-none"
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-xs text-[var(--text)] outline-none"
                >
                  {WIN_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAdd}
                  className="rounded-lg bg-[var(--amber)] px-4 py-2 text-xs font-semibold text-[var(--bg)]"
                >
                  Add
                </motion.button>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Wins list */}
        <div className="space-y-2">
          {sortedWins.map((win) => {
            const biz = businesses.find((b) => b.id === win.businessId)
            return (
              <StaggerItem key={win.id}>
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="card border-[var(--amber)]/20 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-1 h-full min-h-[40px] rounded-full bg-[var(--amber)]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text)]">{win.title}</p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {win.dollarValue && (
                          <span className="data text-xs font-semibold text-[var(--amber)]">{fmt(win.dollarValue)}</span>
                        )}
                        {biz && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text-dim)]">{biz.name}</span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--amber)]/10 text-[var(--amber)]">{win.category}</span>
                        <span className="text-[10px] text-[var(--text-dim)]">{new Date(win.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            )
          })}
          {wins.length === 0 && (
            <p className="text-center text-sm text-[var(--text-dim)] py-10">No wins logged yet. Go get one.</p>
          )}
        </div>
      </StaggerContainer>
    </PageTransition>
  )
}
