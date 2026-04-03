'use client'

import { useState } from 'react'
import { useStore } from '@/stores/store'

const VARIABLES = [
  { key: 'agencyClients', label: 'New Agency Clients', min: 0, max: 10, fee: 1500, unit: '/mo each' },
  { key: 'plumbingCalls', label: 'Plumbing Calls/Day', min: 1, max: 6, fee: 700, unit: '/ticket avg' },
  { key: 'coachingStudents', label: 'Coaching Students', min: 0, max: 20, fee: 3000, unit: '/student' },
  { key: 'brandDeals', label: 'Brand Deals/Month', min: 0, max: 5, fee: 2000, unit: '/deal' },
]

const PRESETS = [
  { name: 'Conservative', values: { agencyClients: 2, plumbingCalls: 2, coachingStudents: 0, brandDeals: 0 }, target: 30000 },
  { name: 'Moderate', values: { agencyClients: 5, plumbingCalls: 3, coachingStudents: 5, brandDeals: 1 }, target: 50000 },
  { name: 'Aggressive', values: { agencyClients: 8, plumbingCalls: 5, coachingStudents: 15, brandDeals: 3 }, target: 80000 },
]

const BASE_INCOME = 23469

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export default function ScenariosPage() {
  const [values, setValues] = useState<Record<string, number>>({
    agencyClients: 3,
    plumbingCalls: 3,
    coachingStudents: 0,
    brandDeals: 0,
  })
  let ai = 0

  const projected =
    BASE_INCOME +
    values.agencyClients * 1500 +
    values.plumbingCalls * 700 * 22 * 0.4 +
    values.coachingStudents * 3000 +
    values.brandDeals * 2000

  const annual = projected * 12
  const target = 50000

  return (
    <div className="space-y-6 pb-24">
      <h1 className="animate-in text-2xl font-bold text-[var(--text)]" style={{ animationDelay: `${0.05 * ai++}s` }}>
        Scenario Modeler
      </h1>

      {/* Sliders */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 space-y-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <span className="label text-[10px] tracking-widest text-[var(--accent)]">VARIABLES</span>
        {VARIABLES.map((v) => (
          <div key={v.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[var(--text)]">{v.label}</span>
              <span className="data text-sm font-semibold text-[var(--accent)]">{values[v.key]}</span>
            </div>
            <input
              type="range"
              min={v.min}
              max={v.max}
              value={values[v.key]}
              onChange={(e) => setValues((p) => ({ ...p, [v.key]: Number(e.target.value) }))}
              className="w-full accent-[var(--accent)]"
            />
            <p className="text-[10px] text-[var(--text-dim)]">{fmt(v.fee)} {v.unit}</p>
          </div>
        ))}
      </div>

      {/* Output */}
      <div className="animate-in rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <span className="label text-[10px] tracking-widest text-[var(--accent)]">PROJECTED INCOME</span>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[var(--text-dim)]">Monthly</p>
            <p className="data text-2xl font-bold text-[var(--accent)]">{fmt(Math.round(projected))}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-dim)]">Annual</p>
            <p className="data text-2xl font-bold text-[var(--text)]">{fmt(Math.round(annual))}</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--text-dim)]">Progress to {fmt(target)}/mo target</span>
            <span className={`data font-semibold ${projected >= target ? 'text-[var(--accent)]' : 'text-[var(--amber)]'}`}>
              {Math.min(100, Math.round((projected / target) * 100))}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${projected >= target ? 'bg-[var(--accent)]' : 'bg-[var(--amber)]'}`}
              style={{ width: `${Math.min(100, (projected / target) * 100)}%` }}
            />
          </div>
          {projected >= target && (
            <p className="mt-2 text-xs font-semibold text-[var(--accent)]">Target reached!</p>
          )}
        </div>
      </div>

      {/* Presets */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <span className="label text-[10px] tracking-widest text-[var(--text-dim)]">PRE-BUILT SCENARIOS</span>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => setValues(p.values)}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-left hover:border-[var(--accent)] transition-colors"
            >
              <p className="text-sm font-semibold text-[var(--text)]">{p.name}</p>
              <p className="data text-lg font-bold text-[var(--accent)] mt-1">{fmt(p.target)}/mo</p>
              <p className="text-[10px] text-[var(--text-dim)] mt-1">Click to apply</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
