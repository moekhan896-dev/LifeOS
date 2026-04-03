'use client'

import { useStore } from '@/stores/store'
import { CLIENTS } from '@/lib/constants'

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
  let ai = 0

  return (
    <div className="space-y-6 pb-24">
      <h1 className="animate-in text-2xl font-bold text-[var(--text)]" style={{ animationDelay: `${0.05 * ai++}s` }}>
        Net Worth Tracker
      </h1>

      {/* Net worth summary */}
      <div className="animate-in rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <span className="label text-[10px] tracking-widest text-[var(--accent)]">ESTIMATED NET WORTH</span>
        <p className="data text-3xl font-bold text-[var(--accent)] mt-2">{fmt(netWorth)}</p>
        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
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

      {/* Assets */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <span className="label text-[10px] tracking-widest text-[var(--accent)]">ASSETS</span>
        <div className="mt-4 space-y-3">
          {ASSETS.map((a) => (
            <div key={a.name} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: a.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text)]">{a.name}</p>
                <p className="text-xs text-[var(--text-dim)]">{a.detail}</p>
              </div>
              <span className="data text-sm font-semibold text-[var(--accent)]">{fmt(a.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Liabilities */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <span className="label text-[10px] tracking-widest text-[var(--rose)]">LIABILITIES</span>
        <div className="mt-4 space-y-3">
          {LIABILITIES.map((l) => (
            <div key={l.name} className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text)]">{l.name}</p>
                <p className="text-xs text-[var(--text-dim)]">{l.detail}</p>
              </div>
              <span className="data text-sm font-semibold text-[var(--rose)]">{fmt(Math.abs(l.value))}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Impact actions */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <span className="label text-[10px] tracking-widest text-[var(--cyan)]">HOW EACH ACTION IMPACTS NET WORTH</span>
        <div className="mt-4 space-y-3">
          {IMPACT_ACTIONS.map((ia) => (
            <div key={ia.action} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--text)]">{ia.action}</p>
                <span className="data text-sm font-bold text-[var(--accent)]">+{fmt(ia.impact)}</span>
              </div>
              <p className="text-xs text-[var(--text-dim)] mt-1">{ia.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly snapshot placeholder */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <span className="label text-[10px] tracking-widest text-[var(--text-dim)]">MONTHLY SNAPSHOTS</span>
        <div className="mt-4 flex items-center justify-center h-24 text-sm text-[var(--text-dim)]">
          Monthly tracking coming soon
        </div>
      </div>
    </div>
  )
}
