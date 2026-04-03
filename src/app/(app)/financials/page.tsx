'use client'

import { useMemo } from 'react'
import { useStore, getAgencyTotals, getClientNet } from '@/stores/store'
import { FIXED_COSTS } from '@/lib/constants'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { BarChart, Bar, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts'

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export default function FinancialsPage() {
  const { businesses, clients, expenseEntries, streaks } = useStore()
  const savings = 35000
  const noGambleStreak = streaks.find(s => s.habit === 'no_gamble')

  const agencyTotals = getAgencyTotals(clients)

  const incomeStreams = useMemo(() => {
    return businesses
      .filter(b => b.monthlyRevenue > 0 || clients.some(c => c.businessId === b.id && c.active))
      .map(b => {
        const bizClients = clients.filter(c => c.businessId === b.id && c.active)
        const clientNet = bizClients.reduce((s, c) => s + getClientNet(c), 0)
        const net = clientNet > 0 ? clientNet : b.monthlyRevenue
        const detail = bizClients.length > 0
          ? `${bizClients.length} client${bizClients.length !== 1 ? 's' : ''}, net after ad spend`
          : b.notes || ''
        return { label: b.name, net, detail }
      })
  }, [businesses, clients])

  const TOTAL_INCOME = incomeStreams.reduce((s, i) => s + i.net, 0)
  const TOTAL_COSTS = FIXED_COSTS.reduce((s, c) => s + c.amount, 0)
  const NET_TAKE_HOME = TOTAL_INCOME - TOTAL_COSTS

  // Build scenarios from top revenue sources
  const scenarios = useMemo(() => {
    const sorted = [...incomeStreams].sort((a, b) => b.net - a.net)
    const result: { name: string; lostIncome: number; description: string }[] = []
    if (sorted[0]) result.push({ name: `${sorted[0].label} Gone`, lostIncome: sorted[0].net, description: `Lose ${sorted[0].label} revenue` })
    if (sorted[1]) result.push({ name: `${sorted[1].label} Gone`, lostIncome: sorted[1].net, description: `Lose ${sorted[1].label} revenue` })
    if (sorted[0] && sorted[1]) result.push({ name: 'Top 2 Gone', lostIncome: sorted[0].net + sorted[1].net, description: `Lose ${sorted[0].label} + ${sorted[1].label}` })
    return result
  }, [incomeStreams])

  // P&L chart placeholder (static shape scaled to real totals)
  const plData = useMemo(() => {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
    return months.map((m, i) => ({
      m,
      income: Math.round(TOTAL_INCOME * (0.85 + Math.sin(i) * 0.1 + i * 0.02)),
      expenses: Math.round(TOTAL_COSTS * (0.95 + Math.cos(i) * 0.05)),
    }))
  }, [TOTAL_INCOME, TOTAL_COSTS])
  const plTrend = plData.map((d) => ({ ...d, profit: d.income - d.expenses }))

  return (
    <PageTransition>
      <div className="space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-[var(--text)]">Financials</h1>

        <StaggerContainer className="space-y-4">
          {/* Income */}
          <StaggerItem>
            <div className="card p-4">
              <span className="label text-[10px] tracking-widest text-[var(--accent)]">MONTHLY INCOME</span>
              <div className="mt-3 space-y-3">
                {incomeStreams.map((i) => (
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
          </StaggerItem>

          {/* Fixed Costs */}
          <StaggerItem>
            <div className="card p-4">
              <span className="label text-[10px] tracking-widest text-[var(--rose)]">FIXED COSTS</span>
              <div className="mt-3 space-y-2">
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
          </StaggerItem>

          {/* P&L Summary */}
          <StaggerItem>
            <motion.div
              whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              className="card border-[var(--accent)]/30 bg-[var(--accent)]/5 p-4"
            >
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
            </motion.div>
          </StaggerItem>

          {/* Income vs Expenses BarChart */}
          <StaggerItem>
            <motion.div whileHover={{ y: -2 }} className="card p-4">
              <span className="label text-[10px] tracking-widest text-[var(--text-dim)]">INCOME VS EXPENSES</span>
              <div className="mt-3">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={plData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="m" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </StaggerItem>

          {/* P&L Trend */}
          <StaggerItem>
            <motion.div whileHover={{ y: -2 }} className="card p-4">
              <span className="label text-[10px] tracking-widest text-[var(--text-dim)]">P&L TREND</span>
              <div className="mt-3">
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={plTrend}>
                    <defs>
                      <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="m" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
                    <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profitGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Emergency Scenario Planner */}
          <StaggerItem>
            <div className="card p-4">
              <span className="label text-[10px] tracking-widest text-[var(--amber)]">EMERGENCY SCENARIO PLANNER</span>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {scenarios.map((s) => {
                  const newIncome = TOTAL_INCOME - s.lostIncome
                  const deficit = newIncome - TOTAL_COSTS
                  const runway = deficit < 0 ? Math.floor(savings / Math.abs(deficit)) : Infinity
                  return (
                    <motion.div
                      key={s.name}
                      whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      className="rounded-[12px] border border-[var(--border)] bg-[var(--bg)] p-3"
                    >
                      <p className="text-sm font-semibold text-[var(--text)]">{s.name}</p>
                      <p className="text-xs text-[var(--text-dim)] mb-2">{s.description}</p>
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
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </StaggerItem>

          {/* Profit First Allocations */}
          <StaggerItem>
            <div className="card p-4">
              <span className="label text-[10px] tracking-widest text-[var(--accent)]">PROFIT FIRST ALLOCATIONS</span>
              <div className="mt-3 flex gap-1 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 rounded-l-full" style={{ width: '50%' }} />
                <div className="bg-amber-500" style={{ width: '15%' }} />
                <div className="bg-blue-500" style={{ width: '30%' }} />
                <div className="bg-purple-500 rounded-r-full" style={{ width: '5%' }} />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[
                  { label: "Owner's Pay", pct: 50, color: 'text-emerald-400' },
                  { label: 'Taxes', pct: 15, color: 'text-amber-400' },
                  { label: 'OpEx', pct: 30, color: 'text-blue-400' },
                  { label: 'Profit', pct: 5, color: 'text-purple-400' },
                ].map(a => (
                  <motion.div key={a.label} whileHover={{ y: -1 }} className="rounded-[12px] border border-[var(--border)] bg-[var(--bg)] p-3 text-center">
                    <p className="text-[10px] text-[var(--text-dim)]">{a.label}</p>
                    <p className={`text-xs font-semibold ${a.color} mt-0.5`}>{a.pct}%</p>
                    <p className="data text-sm font-bold text-[var(--text)] mt-1">{fmt(Math.round(TOTAL_INCOME * a.pct / 100))}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </StaggerItem>

          {/* Agency Valuation */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1 }} className="card p-4">
              <span className="label text-[10px] tracking-widest text-[var(--cyan)]">ESTIMATED NET WORTH</span>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-dim)]">Savings</span>
                  <span className="data text-[var(--text)]">{fmt(savings)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-dim)]">Agency Valuation (Net MRR x 12 x 3.5)</span>
                  <span className="data text-[var(--text)]">{fmt(Math.round(agencyTotals.net * 12 * 3.5))}</span>
                </div>
                <div className="border-t border-[var(--border)] pt-2 flex justify-between">
                  <span className="text-sm font-bold text-[var(--text)]">Estimated Net Worth</span>
                  <span className="data text-lg font-bold text-[var(--accent)]">{fmt(savings + Math.round(agencyTotals.net * 12 * 3.5))}</span>
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Time vs Money Matrix */}
          <StaggerItem>
            <div className="card p-4">
              <span className="label text-[10px] tracking-widest text-[var(--cyan)]">TIME VS MONEY MATRIX</span>
              <div className="mt-3 space-y-3">
                {businesses.map((b) => {
                  const bizClients = clients.filter(c => c.businessId === b.id && c.active)
                  const income = bizClients.length > 0
                    ? bizClients.reduce((s, c) => s + getClientNet(c), 0)
                    : b.monthlyRevenue
                  const perHour = income > 0 ? income / (10 * 4.33) : 0 // estimate 10 hrs/wk
                  return (
                    <div key={b.id} className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: b.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text)]">{b.name}</p>
                        <p className="text-xs text-[var(--text-dim)]">{fmt(income)}/mo</p>
                      </div>
                      <div className="text-right">
                        <p className="data text-sm font-semibold text-[var(--text)]">{income > 0 ? `${fmt(Math.round(perHour))}/hr` : '—'}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </StaggerItem>
          {/* Days Clean */}
          {noGambleStreak && (
            <StaggerItem>
              <motion.div whileHover={{ y: -1 }} className="card p-3 flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs text-emerald-400 font-bold">{noGambleStreak.currentStreak}</div>
                <div>
                  <p className="text-xs font-medium text-[var(--text-mid)]">Days clean</p>
                  <p className="text-[10px] text-[var(--text-dim)]">Longest: {noGambleStreak.longestStreak}d</p>
                </div>
              </motion.div>
            </StaggerItem>
          )}
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
