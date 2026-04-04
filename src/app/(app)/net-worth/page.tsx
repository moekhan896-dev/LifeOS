'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

const CHART_COLORS = ['#30D158', '#0A84FF', '#64D2FF', '#FF9F0A', '#BF5AF2', '#FF453A']

export default function NetWorthPage() {
  const { balanceSheetAssets, balanceSheetDebts } = useStore()

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

  const hasData = balanceSheetAssets.length > 0 || balanceSheetDebts.length > 0

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 pb-20">
        <StaggerItem>
          <h1 className="text-[22px] font-bold tracking-[-0.2px] text-[var(--text-primary)]">Net worth</h1>
          <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
            Values come from onboarding and edits you make here — nothing is prefilled.
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
