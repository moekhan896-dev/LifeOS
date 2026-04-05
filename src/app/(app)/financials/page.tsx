'use client'

import { useMemo } from 'react'
import { useStore, getAgencyTotals, getClientNet } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'
import { motion } from 'framer-motion'
import {
  FinancialsHero,
  FinancialsProfitLossSection,
  FinancialsRevenueByBusinessChart,
  FinancialsConcentrationWarnings,
  FinancialsDailySpending,
} from '@/components/financials/FinancialsRound5'
import {
  grossRevenue,
  businessCosts,
  processingFeesGross,
  netRevenue,
  personalExpensesRecurring,
  takeHome,
  clientConcentrationWarnings,
} from '@/lib/financials-metrics'

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

/** Typical federal estimated tax due dates (illustrative). */
function nextFederalEstimatedDeadlines(from: Date, count = 4): { label: string; date: Date }[] {
  const out: { label: string; date: Date }[] = []
  const y0 = from.getFullYear()
  for (let i = 0; i < 5; i++) {
    const yy = y0 + i
    const batch = [
      { label: 'Q1 — Apr 15', d: new Date(yy, 3, 15, 12, 0, 0) },
      { label: 'Q2 — Jun 15', d: new Date(yy, 5, 15, 12, 0, 0) },
      { label: 'Q3 — Sep 15', d: new Date(yy, 8, 15, 12, 0, 0) },
      { label: 'Q4 — Jan 15', d: new Date(yy + 1, 0, 15, 12, 0, 0) },
    ]
    for (const b of batch) {
      if (b.d >= from) out.push({ label: b.label, date: b.d })
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, count)
}

export default function FinancialsPage() {
  const {
    businesses,
    clients,
    expenseEntries,
    streaks,
    savingsRange,
    profitFirstPct,
    setProfitFirstPct,
    estimatedIncomeTaxRatePct,
    dailyNetSnapshots,
    incomeTarget,
    anthropicKey,
    plaidConnected,
    workDayStart,
    workDayEnd,
  } = useStore()
  const savingsLabel = savingsRange || '—'
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
  const TOTAL_COSTS = expenseEntries.filter((e) => e.recurring).reduce((s, e) => s + e.amount, 0)
  const NET_TAKE_HOME = TOTAL_INCOME - TOTAL_COSTS

  const netTakeHomePL = useMemo(() => {
    const g = grossRevenue(businesses)
    const c = businessCosts(businesses, clients)
    const p = processingFeesGross(g)
    const nr = netRevenue(g, c, p)
    const pe = personalExpensesRecurring(expenseEntries)
    return takeHome(nr, pe)
  }, [businesses, clients, expenseEntries])

  const hasConcentrationWarnings = useMemo(
    () => clientConcentrationWarnings(businesses, clients, 30).length > 0,
    [businesses, clients]
  )

  // Build scenarios from top revenue sources
  const scenarios = useMemo(() => {
    const sorted = [...incomeStreams].sort((a, b) => b.net - a.net)
    const result: { name: string; lostIncome: number; description: string }[] = []
    if (sorted[0]) result.push({ name: `${sorted[0].label} Gone`, lostIncome: sorted[0].net, description: `Lose ${sorted[0].label} revenue` })
    if (sorted[1]) result.push({ name: `${sorted[1].label} Gone`, lostIncome: sorted[1].net, description: `Lose ${sorted[1].label} revenue` })
    if (sorted[0] && sorted[1]) result.push({ name: 'Top 2 Gone', lostIncome: sorted[0].net + sorted[1].net, description: `Lose ${sorted[0].label} + ${sorted[1].label}` })
    return result
  }, [incomeStreams])

  const pf = profitFirstPct
  const taxSnapshot = useMemo(() => {
    const now = new Date()
    const next = nextFederalEstimatedDeadlines(now, 1)[0]
    const ms = next ? next.date.getTime() - now.getTime() : 0
    const days = Math.max(0, Math.ceil(ms / 86400000))
    const start = new Date(now.getFullYear(), 0, 1)
    const dayFrac = (now.getTime() - start.getTime()) / (365.25 * 24 * 3600 * 1000)
    const ytd = TOTAL_INCOME * (estimatedIncomeTaxRatePct / 100) * Math.min(1, Math.max(0, dayFrac))
    return { next, days, ytd }
  }, [TOTAL_INCOME, estimatedIncomeTaxRatePct])

  const pfBuckets: { key: keyof typeof pf; label: string; color: string }[] = [
    { key: 'ownersPay', label: "Owner's pay", color: 'var(--positive)' },
    { key: 'tax', label: 'Tax', color: 'var(--warning)' },
    { key: 'operating', label: 'Operating', color: 'var(--accent)' },
    { key: 'profit', label: 'Profit', color: 'var(--ai)' },
  ]

  return (
    <PageTransition>
      <div className="space-y-4 pb-24">
        <h1 className="page-title">Financials</h1>

        <StaggerContainer className="space-y-4">
          <StaggerItem>
            <FinancialsHero
              netTakeHome={netTakeHomePL}
              incomeTarget={incomeTarget}
              dailyNetSnapshots={dailyNetSnapshots}
              workDayStart={workDayStart || '09:00'}
              workDayEnd={workDayEnd || '17:00'}
            />
          </StaggerItem>

          <StaggerItem>
            <FinancialsProfitLossSection
              businesses={businesses}
              clients={clients}
              expenseEntries={expenseEntries}
              dailyNetSnapshots={dailyNetSnapshots}
              anthropicKey={anthropicKey}
            />
          </StaggerItem>

          {hasConcentrationWarnings && (
            <StaggerItem>
              <FinancialsConcentrationWarnings businesses={businesses} clients={clients} />
            </StaggerItem>
          )}

          <StaggerItem>
            <FinancialsRevenueByBusinessChart businesses={businesses} clients={clients} />
          </StaggerItem>

          {/* Income */}
          <StaggerItem>
            <div className="card px-5 py-4">
              <span className="label text-[var(--accent)]">Monthly income</span>
              <div className="mt-3 space-y-3">
                {incomeStreams.map((i) => (
                  <div key={i.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-[17px] font-medium text-[var(--text)]">{i.label}</p>
                      <p className="text-[15px] text-[var(--text-secondary)]">{i.detail}</p>
                    </div>
                    <span className="data text-lg font-semibold text-[var(--accent)]">{fmt(i.net)}</span>
                  </div>
                ))}
                <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-[var(--text)]">Total income</span>
                  <span className="data text-xl font-bold text-[var(--accent)]">{fmt(TOTAL_INCOME)}</span>
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Fixed Costs */}
          <StaggerItem>
            <div className="card px-5 py-4">
              <span className="label text-[var(--negative)]">Fixed costs</span>
              <div className="mt-3 space-y-2">
                {expenseEntries.length === 0 && (
                  <p className="text-[17px] text-[var(--text-secondary)]">
                    No expenses logged yet. Add them from onboarding follow-up or manual entry.
                  </p>
                )}
                {expenseEntries.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-[17px]">
                    <span className="text-[var(--text-secondary)]">{c.category}</span>
                    <span className="data text-[var(--rose)]">{fmt(c.amount)}</span>
                  </div>
                ))}
                <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
                  <span className="text-[15px] font-semibold text-[var(--text)]">Total expenses</span>
                  <span className="data text-lg font-bold text-[var(--rose)]">{fmt(TOTAL_COSTS)}</span>
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Emergency Scenario Planner */}
          <StaggerItem>
            <div className="card px-5 py-4">
              <span className="label text-[var(--warning)]">Emergency scenario planner</span>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {scenarios.map((s) => {
                  const newIncome = TOTAL_INCOME - s.lostIncome
                  const deficit = newIncome - TOTAL_COSTS
                  const runwayMonths = deficit < 0 ? NaN : Infinity
                  return (
                    <motion.div
                      key={s.name}
                      whileHover={{ filter: 'brightness(1.05)' }}
                      className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4"
                    >
                      <p className="text-[17px] font-semibold text-[var(--text)]">{s.name}</p>
                      <p className="text-[15px] text-[var(--text-secondary)] mb-2">{s.description}</p>
                      <div className="space-y-1.5 text-[15px]">
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
                          <span
                            className={`data font-semibold ${
                              Number.isNaN(runwayMonths) ? 'text-[var(--text-dim)]' : 'text-[var(--accent)]'
                            }`}
                          >
                            {Number.isNaN(runwayMonths)
                              ? '—'
                              : runwayMonths === Infinity
                                ? 'Safe'
                                : `${runwayMonths} months`}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </StaggerItem>

          {/* Profit First + Tax liability (PRD §12.1 §6–7) */}
          <StaggerItem>
            <div className="card px-5 py-4">
              <span className="label text-[var(--accent)]">Profit First allocations</span>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                Four buckets — percentages renormalize to 100%. Dollar amounts use monthly net take-home ({fmt(NET_TAKE_HOME)}).
              </p>
              <div className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-full">
                {pfBuckets.map((b) => (
                  <div
                    key={b.key}
                    className="h-full min-w-[4px]"
                    style={{ width: `${pf[b.key]}%`, background: b.color }}
                  />
                ))}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {pfBuckets.map((b) => (
                  <div key={b.key} className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
                    <div className="flex items-center justify-between">
                      <span className="label">{b.label}</span>
                      <span className="data font-mono text-[15px]" style={{ color: b.color }}>
                        {pf[b.key].toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={0.5}
                      value={pf[b.key]}
                      onChange={(e) => setProfitFirstPct({ [b.key]: Number(e.target.value) })}
                      className="mt-2 w-full accent-[var(--accent)]"
                    />
                    <p className="data mt-1 font-mono text-[17px] text-[var(--text)]">
                      {fmt(Math.round(NET_TAKE_HOME * (pf[b.key] / 100)))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </StaggerItem>

          <StaggerItem>
            <div className="card px-5 py-4">
              <span className="label text-[var(--warning)]">Tax liability (estimated)</span>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                Illustrative only — not tax advice. Adjust assumed income tax rate in Settings.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                  <p className="label">Next typical estimated deadline</p>
                  {taxSnapshot.next ? (
                    <>
                      <p className="data mt-1 text-[17px] font-semibold text-[var(--text)]">{taxSnapshot.next.label}</p>
                      <p className="mt-1 font-mono text-[15px] text-[var(--accent)]">
                        {taxSnapshot.next.date.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                      <p className="mt-2 text-[14px] text-[var(--text-mid)]">
                        ~{taxSnapshot.days} day{taxSnapshot.days === 1 ? '' : 's'} remaining
                      </p>
                    </>
                  ) : (
                    <p className="text-[var(--text-dim)]">—</p>
                  )}
                </div>
                <div className="rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
                  <p className="label">Year-to-date est. tax (accrual)</p>
                  <p className="data mt-1 font-mono text-2xl font-bold text-[var(--text)]">{fmt(Math.round(taxSnapshot.ytd))}</p>
                  <p className="mt-2 text-[12px] text-[var(--text-dim)]">
                    Based on net take-home × {estimatedIncomeTaxRatePct}% × fraction of year elapsed.
                  </p>
                </div>
              </div>
            </div>
          </StaggerItem>

          {/* Agency Valuation */}
          <StaggerItem>
            <motion.div whileHover={{ filter: 'brightness(1.05)' }} className="card px-5 py-4">
              <span className="label text-[var(--info)]">Estimated net worth</span>
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-[17px]">
                  <span className="text-[var(--text-secondary)]">Savings (range)</span>
                  <span className="data text-[var(--text)]">{savingsLabel}</span>
                </div>
                <div className="flex justify-between text-[17px]">
                  <span className="text-[var(--text-secondary)]">Agency valuation (net MRR × 12 × 3.5)</span>
                  <span className="data text-[var(--text)]">{fmt(Math.round(agencyTotals.net * 12 * 3.5))}</span>
                </div>
                <div className="border-t border-[var(--border)] pt-2">
                  <p className="text-[15px] text-[var(--text-dim)]">
                    Add asset values in Settings to combine savings + business valuation into a full net worth figure.
                  </p>
                </div>
              </div>
            </motion.div>
          </StaggerItem>

          {/* Time vs Money Matrix */}
          <StaggerItem>
            <div className="card px-5 py-4">
              <span className="label text-[var(--info)]">Time vs money matrix</span>
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
                        <p className="text-[17px] font-medium text-[var(--text)]">{b.name}</p>
                        <p className="text-[15px] text-[var(--text-secondary)]">{fmt(income)}/mo</p>
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
          <StaggerItem>
            <FinancialsDailySpending
              plaidConnected={plaidConnected}
              netTakeHome={netTakeHomePL}
              workDayStart={workDayStart || '09:00'}
              workDayEnd={workDayEnd || '17:00'}
            />
          </StaggerItem>

          {noGambleStreak && (
            <StaggerItem>
              <motion.div whileHover={{ filter: 'brightness(1.05)' }} className="card px-5 py-4 flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
                <div className="data flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(48,209,88,0.15)] text-[15px] font-bold text-[var(--positive)]">{noGambleStreak.currentStreak}</div>
                <div>
                  <p className="text-[15px] font-medium text-[var(--text-secondary)]">Days clean</p>
                  <p className="text-[13px] text-[var(--text-dim)]">Longest: {noGambleStreak.longestStreak}d</p>
                </div>
              </motion.div>
            </StaggerItem>
          )}
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
