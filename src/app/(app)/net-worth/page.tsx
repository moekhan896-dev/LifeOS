'use client'

import { motion } from 'framer-motion'
import { useStore } from '@/stores/store'
import { CLIENTS } from '@/lib/constants'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

const ASSETS = [
  { name: 'Agency Valuation', detail: 'Net MRR x 12 x 3.5 multiple', value: 641000, color: 'var(--accent)' },
  { name: 'Florida House Equity', detail: 'Estimated equity after mortgage', value: 50000, color: 'var(--blue)' },
  { name: 'Savings', detail: 'Cash reserves', value: 35000, color: 'var(--cyan)' },
  { name: 'Social Media Pages', detail: 'Quattro 150K, Plumbing 30K, Personal 30K, Madison 16K', value: 15000, color: 'var(--pink)' },
]

const LIABILITIES = [
  { name: 'C8 Corvette', detail: 'Negative equity', value: -15000 },
  { name: 'Mercedes-AMG GLE', detail: 'Negative equity', value: -10000 },
  { name: 'Tesla Lease', detail: 'Lease obligation', value: -5000 },
]

const IMPACT_ACTIONS = [
  { action: 'Sign one $2K/mo agency client', impact: 84000, detail: '$2K x 12 x 3.5 multiple' },
  { action: 'Grow plumbing to $30K/mo gross', impact: 50400, detail: '$12K net x 12 x 0.35' },
  { action: 'Save $5K more cash', impact: 5000, detail: 'Direct net worth increase' },
  { action: 'Sell Tesla, buy $15K car cash', impact: 24600, detail: 'Eliminate $400/mo + insurance savings' },
]

export default function NetWorthPage() {
  const totalAssets = ASSETS.reduce((s, a) => s + a.value, 0)
  const totalLiabilities = LIABILITIES.reduce((s, l) => s + Math.abs(l.value), 0)
  const netWorth = totalAssets - totalLiabilities

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 pb-20">
        <StaggerItem>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            Net Worth Tracker
          </h1>
        </StaggerItem>

        {/* Net worth summary */}
        <StaggerItem>
          <div className="rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4">
            <span className="label text-[10px] tracking-widest text-[var(--accent)]">ESTIMATED NET WORTH</span>
            <p className="data text-3xl font-bold text-[var(--accent)] mt-2">{fmt(netWorth)}</p>
            <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[var(--text-dim)]">Assets</p>
                <p className="data font-semibold text-[var(--accent)]">{fmt(totalAssets)}</p>
              </div>
              <div>
                <p className="text-[var(--text-dim)]">Liabilities</p>
                <p className="data font-semibold text-[var(--rose)]">{fmt(totalLiabilities)}</p>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Assets */}
        <StaggerItem>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <span className="label text-[10px] tracking-widest text-[var(--accent)]">ASSETS</span>
            <div className="mt-3 space-y-2.5">
              {ASSETS.map((a) => (
                <motion.div
                  key={a.name}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: a.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text)]">{a.name}</p>
                    <p className="text-xs text-[var(--text-dim)]">{a.detail}</p>
                  </div>
                  <span className="data text-sm font-semibold text-[var(--accent)]">{fmt(a.value)}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </StaggerItem>

        {/* Liabilities */}
        <StaggerItem>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <span className="label text-[10px] tracking-widest text-[var(--rose)]">LIABILITIES</span>
            <div className="mt-3 space-y-2.5">
              {LIABILITIES.map((l) => (
                <motion.div
                  key={l.name}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm text-[var(--text)]">{l.name}</p>
                    <p className="text-xs text-[var(--text-dim)]">{l.detail}</p>
                  </div>
                  <span className="data text-sm font-semibold text-[var(--rose)]">{fmt(Math.abs(l.value))}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </StaggerItem>

        {/* Impact actions */}
        <StaggerItem>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <span className="label text-[10px] tracking-widest text-[var(--cyan)]">HOW EACH ACTION IMPACTS NET WORTH</span>
            <div className="mt-3 space-y-2.5">
              {IMPACT_ACTIONS.map((ia) => (
                <motion.div
                  key={ia.action}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2.5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[var(--text)]">{ia.action}</p>
                    <span className="data text-sm font-bold text-[var(--accent)]">+{fmt(ia.impact)}</span>
                  </div>
                  <p className="text-xs text-[var(--text-dim)] mt-1">{ia.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </StaggerItem>

        {/* Monthly snapshot placeholder */}
        <StaggerItem>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <span className="label text-[10px] tracking-widest text-[var(--text-dim)]">MONTHLY SNAPSHOTS</span>
            <div className="mt-3 flex items-center justify-center h-20 text-sm text-[var(--text-dim)]">
              Monthly tracking coming soon
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  )
}
