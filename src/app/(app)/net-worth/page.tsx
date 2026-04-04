'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useStore, computeMonthlyMoneySnapshot } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  projectNetWorthSeries,
  requiredMonthlyForTarget,
  OPTIMIZED_MONTHLY_INCOME_MULTIPLIER,
} from '@/lib/net-worth-projection'

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

const CHART_COLORS = ['#30D158', '#0A84FF', '#64D2FF', '#FF9F0A', '#BF5AF2', '#FF453A']

export default function NetWorthPage() {
  const { balanceSheetAssets, balanceSheetDebts, userAge, businesses, clients, expenseEntries } = useStore()
  const [targetNW, setTargetNW] = useState(1_000_000)
  const [targetAge, setTargetAge] = useState(65)

  const { totalAssets, totalLiabilities, netWorth, pieData } = useMemo(() => {
    const totalAssets = balanceSheetAssets.reduce((s, a) => s + (a.value || 0), 0)
    const totalLiabilities = balanceSheetDebts.reduce((s, d) => s + Math.abs(d.balance || 0), 0)
    const netWorth = totalAssets - totalLiabilities
    const pieData = balanceSheetAssets
      .filter((a) => a.value > 0)
      .map((a, i) => ({
        name: a.name || 'Asset',
        value: a.value,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }))
    return { totalAssets, totalLiabilities, netWorth, pieData }
  }, [balanceSheetAssets, balanceSheetDebts])

  const monthlySavings = useMemo(() => {
    const { net } = computeMonthlyMoneySnapshot({ businesses, clients, expenseEntries })
    return Math.max(0, net)
  }, [businesses, clients, expenseEntries])

  const age = userAge > 0 ? userAge : 35
  const retireAge = 65

  const projection = useMemo(() => {
    return projectNetWorthSeries({
      currentNetWorth: netWorth,
      currentAge: age,
      retireAge,
      monthlyContribution: monthlySavings,
      optimizedContributionMultiplier: OPTIMIZED_MONTHLY_INCOME_MULTIPLIER,
    })
  }, [netWorth, age, monthlySavings])

  const lineData = useMemo(() => {
    return projection.ages.map((a, i) => ({
      age: a,
      current: projection.currentPath[i] ?? 0,
      optimized: projection.optimizedPath[i] ?? 0,
    }))
  }, [projection])

  const requiredMonthly = useMemo(() => {
    return requiredMonthlyForTarget({
      currentNetWorth: netWorth,
      currentAge: age,
      targetAge,
      targetNetWorth: targetNW,
    })
  }, [netWorth, age, targetAge, targetNW])

  const incomeGap = useMemo(() => {
    if (requiredMonthly <= monthlySavings) return 0
    return requiredMonthly - monthlySavings
  }, [requiredMonthly, monthlySavings])

  const hasData = balanceSheetAssets.length > 0 || balanceSheetDebts.length > 0

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 pb-20">
        <StaggerItem>
          <h1 className="text-[22px] font-bold tracking-[-0.2px] text-[var(--text-primary)]">Net worth</h1>
          <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
            PRD §9.15 / §12.2 — trajectory uses your current net worth and estimated monthly savings (from monthly net
            income in the app).
          </p>
        </StaggerItem>

        <StaggerItem>
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5"
          >
            <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Estimated net worth</span>
            <p
              className="data mt-2 text-3xl font-bold tabular-nums"
              style={{ color: netWorth >= 0 ? 'var(--positive)' : 'var(--negative)' }}
            >
              {hasData ? fmt(netWorth) : '—'}
            </p>
            {hasData && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
                <div>
                  <p className="text-[var(--text-secondary)]">Assets</p>
                  <p className="data font-semibold tabular-nums text-[var(--positive)]">{fmt(totalAssets)}</p>
                </div>
                <div>
                  <p className="text-[var(--text-secondary)]">Liabilities</p>
                  <p className="data font-semibold tabular-nums text-[var(--negative)]">{fmt(totalLiabilities)}</p>
                </div>
              </div>
            )}
          </motion.div>
        </StaggerItem>

        {hasData && (
          <StaggerItem>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
              <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Projection to age {retireAge}</span>
              <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">
                Current path uses your ~{fmt(monthlySavings)}/mo savings. Optimized assumes ~{Math.round((OPTIMIZED_MONTHLY_INCOME_MULTIPLIER - 1) * 100)}%
                higher monthly contributions from income growth (illustrative).
              </p>
              <div className="mt-4 h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                    <XAxis dataKey="age" tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }} label={{ value: 'Age', position: 'insideBottom', offset: -2, fill: 'var(--text-secondary)' }} />
                    <YAxis
                      tick={{ fill: 'var(--text-tertiary)', fontSize: 11 }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(v) => (v != null ? fmt(Number(v)) : '')}
                    />
                    <Line type="monotone" dataKey="current" name="Current trajectory" stroke="#64D2FF" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="optimized" name="Optimized trajectory" stroke="#30D158" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </StaggerItem>
        )}

        {hasData && (
          <StaggerItem>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
              <span className="text-[13px] font-semibold text-[var(--text-secondary)]">What would it take?</span>
              <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
                What would it take to reach <span className="font-semibold text-[var(--text-primary)]">{fmt(targetNW)}</span> by age{' '}
                <span className="font-semibold text-[var(--text-primary)]">{targetAge}</span>?
              </p>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-[12px] text-[var(--text-tertiary)]">Target net worth</label>
                  <input
                    type="number"
                    min={0}
                    value={targetNW}
                    onChange={(e) => setTargetNW(Math.max(0, Number(e.target.value) || 0))}
                    className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[12px] text-[var(--text-tertiary)]">
                    <span>Target age</span>
                    <span className="data text-[var(--text-primary)]">{targetAge}</span>
                  </div>
                  <input
                    type="range"
                    min={Math.ceil(age) + 1}
                    max={80}
                    value={Math.max(Math.ceil(age) + 1, Math.min(80, targetAge))}
                    onChange={(e) => setTargetAge(Number(e.target.value))}
                    className="mt-2 w-full accent-[var(--accent)]"
                  />
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 text-[14px] text-[var(--text-secondary)]">
                  <p>
                    Required monthly savings (approx., 5% annual return):{' '}
                    <span className="data font-semibold text-[var(--accent)]">{fmt(Math.round(requiredMonthly))}/mo</span>
                  </p>
                  {incomeGap > 0 ? (
                    <p className="mt-2">
                      That is about <span className="font-semibold text-[var(--warning)]">{fmt(Math.round(incomeGap))}/mo</span> more than your current estimated monthly savings.
                    </p>
                  ) : (
                    <p className="mt-2 text-[var(--positive)]">Your current savings rate may be sufficient for this target (illustrative).</p>
                  )}
                </div>
              </div>
            </div>
          </StaggerItem>
        )}

        {!hasData && (
          <StaggerItem>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 text-[17px] text-[var(--text-secondary)]">
              Add your assets and debts in onboarding (or re-run onboarding from Settings) to track net worth here.
            </div>
          </StaggerItem>
        )}

        {balanceSheetAssets.length > 0 && (
          <StaggerItem>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
              <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Assets</span>
              <div className="mt-3 space-y-2.5">
                {balanceSheetAssets.map((a, idx) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px] text-[var(--text-primary)]">{a.name}</p>
                      <p className="text-[13px] text-[var(--text-tertiary)]">{a.assetType}</p>
                    </div>
                    <span className="data text-[17px] font-semibold tabular-nums text-[var(--positive)]">{fmt(a.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </StaggerItem>
        )}

        {balanceSheetDebts.length > 0 && (
          <StaggerItem>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
              <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Liabilities</span>
              <div className="mt-3 space-y-2.5">
                {balanceSheetDebts.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[17px] text-[var(--text-primary)]">{d.label}</p>
                      <p className="text-[13px] text-[var(--text-tertiary)]">
                        {d.monthlyPayment > 0 && <>Monthly {fmt(d.monthlyPayment)} · </>}
                        Balance
                      </p>
                    </div>
                    <span className="data text-[17px] font-semibold tabular-nums text-[var(--negative)]">
                      {fmt(Math.abs(d.balance))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </StaggerItem>
        )}

        {pieData.length > 1 && (
          <StaggerItem>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
              <span className="text-[13px] font-semibold text-[var(--text-secondary)]">Asset mix</span>
              <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <ResponsiveContainer width="100%" height={200} className="max-w-[240px]">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name + i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(v) => (v != null ? fmt(Number(v)) : '')}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 shrink-0 rounded-full" style={{ background: d.color }} />
                      <span className="text-[13px] text-[var(--text-secondary)]">{d.name}</span>
                      <span className="data text-[13px] font-semibold tabular-nums text-[var(--text-primary)]">
                        {fmt(d.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </StaggerItem>
        )}
      </StaggerContainer>
    </PageTransition>
  )
}
