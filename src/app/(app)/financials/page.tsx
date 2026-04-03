'use client'

import { useState } from 'react'
import { useStore } from '@/stores/store'
import { FIXED_COSTS, CLIENTS } from '@/lib/constants'

const INCOME = {
  agency: { label: 'SEO Agency (Rysen)', net: 15269, detail: '6 clients, net after ad spend + Stripe' },
  plumbing: { label: 'Honest Plumbers', net: 7200, detail: '~40% of $18K gross revenue' },
  airbnb: { label: 'Airbnb FL', net: 1000, detail: 'Net after mortgage + management' },
}

const TOTAL_INCOME = Object.values(INCOME).reduce((s, i) => s + i.net, 0)
const TOTAL_COSTS = FIXED_COSTS.reduce((s, c) => s + c.amount, 0)
const NET_TAKE_HOME = TOTAL_INCOME - TOTAL_COSTS

const SCENARIOS = [
  { name: 'AWS Leaves', lostIncome: 7460, description: 'Lose biggest agency client' },
  { name: 'Plumber Quits', lostIncome: 7200, description: 'Lose all plumbing revenue' },
  { name: 'Both Leave', lostIncome: 14660, description: 'AWS + Plumber gone' },
  { name: 'Housing -20%', lostIncome: 200, description: 'Airbnb revenue drops 20%' },
]

const TIME_MONEY = [
  { biz: 'SEO Agency', income: 15269, hours: 5, color: 'var(--accent)' },
  { biz: 'Honest Plumbers', income: 7200, hours: 15, color: 'var(--cyan)' },
  { biz: 'Madison Clark', income: 0, hours: 10, color: 'var(--pink)' },
]

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export default function FinancialsPage() {
  const [savingsMonths] = useState(6)
  const savings = 35000
  let ai = 0

  return (
    <div className="space-y-6 pb-24">
      <h1 className="animate-in text-2xl font-bold text-[var(--text)]" style={{ animationDelay: `${0.05 * ai++}s` }}>
        Financials
      </h1>

      {/* Income */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <span className="label text-[10px] tracking-widest text-[var(--accent)]">MONTHLY INCOME</span>
        <div className="mt-4 space-y-3">
          {Object.values(INCOME).map((i) => (
            <div key={i.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">{i.label}</p>
                <p className="text-xs text-[var(--text-dim)]">{i.detail}</p>
              </div>
              <span className="data text-lg font-semibold text-[var(--accent)]">{fmt(i.net)}</span>
            </div>
          ))}
          <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
            <span className="label text-sm font-bold text-[var(--text)]">Total Income</span>
            <span className="data text-xl font-bold text-[var(--accent)]">{fmt(TOTAL_INCOME)}</span>
          </div>
        </div>
      </div>

      {/* Fixed Costs */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <span className="label text-[10px] tracking-widest text-[var(--rose)]">FIXED COSTS</span>
        <div className="mt-4 space-y-2">
          {FIXED_COSTS.map((c) => (
            <div key={c.name} className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-mid)]">{c.name}</span>
              <span className="data text-[var(--rose)]">{fmt(c.amount)}</span>
            </div>
          ))}
          <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
            <span className="label text-sm font-bold text-[var(--text)]">Total Expenses</span>
            <span className="data text-lg font-bold text-[var(--rose)]">{fmt(TOTAL_COSTS)}</span>
          </div>
        </div>
      </div>

      {/* P&L Summary */}
      <div className="animate-in rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <span className="label text-[10px] tracking-widest text-[var(--accent)]">NET TAKE-HOME</span>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="data text-3xl font-bold text-[var(--accent)]">{fmt(NET_TAKE_HOME)}</span>
          <span className="text-sm text-[var(--text-dim)]">/ month</span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
          <div>
            <p className="text-[var(--text-dim)]">Income</p>
            <p className="data font-semibold text-[var(--text)]">{fmt(TOTAL_INCOME)}</p>
          </div>
          <div>
            <p className="text-[var(--text-dim)]">Expenses</p>
            <p className="data font-semibold text-[var(--rose)]">{fmt(TOTAL_COSTS)}</p>
          </div>
          <div>
            <p className="text-[var(--text-dim)]">Margin</p>
            <p className="data font-semibold text-[var(--accent)]">{((NET_TAKE_HOME / TOTAL_INCOME) * 100).toFixed(0)}%</p>
          </div>
        </div>
      </div>

      {/* Trailing Trends Placeholder */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <span className="label text-[10px] tracking-widest text-[var(--text-dim)]">TRAILING TRENDS</span>
        <div className="mt-4 flex items-center justify-center h-32 text-sm text-[var(--text-dim)]">
          Charts coming soon -- monthly revenue tracking
        </div>
      </div>

      {/* Emergency Scenario Planner */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <span className="label text-[10px] tracking-widest text-[var(--amber)]">EMERGENCY SCENARIO PLANNER</span>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SCENARIOS.map((s) => {
            const newIncome = TOTAL_INCOME - s.lostIncome
            const deficit = newIncome - TOTAL_COSTS
            const runway = deficit < 0 ? Math.floor(savings / Math.abs(deficit)) : Infinity
            return (
              <div key={s.name} className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4">
                <p className="text-sm font-semibold text-[var(--text)]">{s.name}</p>
                <p className="text-xs text-[var(--text-dim)] mb-3">{s.description}</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-dim)]">New Income</span>
                    <span className="data text-[var(--text)]">{fmt(newIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-dim)]">Monthly {deficit >= 0 ? 'Surplus' : 'Deficit'}</span>
                    <span className={`data ${deficit >= 0 ? 'text-[var(--accent)]' : 'text-[var(--rose)]'}`}>
                      {deficit >= 0 ? '+' : ''}{fmt(deficit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-dim)]">Runway</span>
                    <span className={`data font-semibold ${runway < 6 ? 'text-[var(--rose)]' : 'text-[var(--accent)]'}`}>
                      {runway === Infinity ? 'Safe' : `${runway} months`}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Time vs Money Matrix */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <span className="label text-[10px] tracking-widest text-[var(--cyan)]">TIME VS MONEY MATRIX</span>
        <div className="mt-4 space-y-3">
          {TIME_MONEY.map((t) => {
            const perHour = t.hours > 0 ? t.income / (t.hours * 4.33) : 0
            return (
              <div key={t.biz} className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text)]">{t.biz}</p>
                  <p className="text-xs text-[var(--text-dim)]">~{t.hours} hrs/wk</p>
                </div>
                <div className="text-right">
                  <p className="data text-sm font-semibold text-[var(--text)]">{fmt(Math.round(perHour))}/hr</p>
                  <p className="text-xs text-[var(--text-dim)]">{fmt(t.income)}/mo</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
