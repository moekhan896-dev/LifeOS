'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

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

  const projected =
    BASE_INCOME +
    values.agencyClients * 1500 +
    values.plumbingCalls * 700 * 22 * 0.4 +
    values.coachingStudents * 3000 +
    values.brandDeals * 2000

  const annual = projected * 12
  const target = 50000

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 pb-20">
        <StaggerItem>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            Scenario Modeler
          </h1>
        </StaggerItem>

        {/* Sliders */}
        <StaggerItem>
          <motion.div whileHover={{ y: -2 }} className="card p-4 space-y-4">
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
          </motion.div>
        </StaggerItem>

        {/* Output */}
        <StaggerItem>
          <motion.div whileHover={{ y: -2 }} className="card border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4">
            <span className="label text-[10px] tracking-widest text-[var(--accent)]">PROJECTED INCOME</span>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[var(--text-dim)]">Monthly</p>
                <p className="data text-2xl font-bold text-[var(--accent)]">{fmt(Math.round(projected))}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-dim)]">Annual</p>
                <p className="data text-2xl font-bold text-[var(--text)]">{fmt(Math.round(annual))}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[var(--text-dim)]">Progress to {fmt(target)}/mo target</span>
                <span className={`data font-semibold ${projected >= target ? 'text-[var(--accent)]' : 'text-[var(--amber)]'}`}>
                  {Math.min(100, Math.round((projected / target) * 100))}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${projected >= target ? 'bg-[var(--accent)]' : 'bg-[var(--amber)]'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (projected / target) * 100)}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              {projected >= target && (
                <p className="mt-2 text-xs font-semibold text-[var(--accent)]">Target reached!</p>
              )}
            </div>
          </motion.div>
        </StaggerItem>

        {/* Projected Revenue Comparison */}
        <StaggerItem>
          <motion.div whileHover={{ y: -2 }} className="card p-4">
            <span className="label text-[10px] tracking-widest text-[var(--text-dim)]">SCENARIO COMPARISON</span>
            <div className="mt-3">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Current', revenue: BASE_INCOME },
                  { name: 'Conservative', revenue: 30000 },
                  { name: 'Moderate', revenue: 50000 },
                  { name: 'Aggressive', revenue: 80000 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                  <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </StaggerItem>

        {/* Presets */}
        <StaggerItem>
          <motion.div whileHover={{ y: -2 }} className="card p-4">
            <span className="label text-[10px] tracking-widest text-[var(--text-dim)]">PRE-BUILT SCENARIOS</span>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
              {PRESETS.map((p) => (
                <motion.button
                  key={p.name}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setValues(p.values)
                    toast.success(`${p.name} scenario applied`)
                  }}
                  className="rounded-[12px] border border-[var(--border)] bg-[var(--bg)] p-3 text-left hover:border-[var(--accent)] transition-colors"
                >
                  <p className="text-sm font-semibold text-[var(--text)]">{p.name}</p>
                  <p className="data text-lg font-bold text-[var(--accent)] mt-1">{fmt(p.target)}/mo</p>
                  <p className="text-[10px] text-[var(--text-dim)] mt-1">Click to apply</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  )
}
