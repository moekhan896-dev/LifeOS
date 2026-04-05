'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'
import { useStore, computeMonthlyMoneySnapshot, getClientNet, isArchived } from '@/stores/store'

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export default function ScenariosPage() {
  const { businesses, clients, expenseEntries } = useStore()

  const snapshot = useMemo(
    () => computeMonthlyMoneySnapshot({ businesses, clients, expenseEntries }),
    [businesses, clients, expenseEntries]
  )

  const activeClients = useMemo(
    () => clients.filter((c) => !isArchived(c) && c.active),
    [clients]
  )

  const avgClientNet = useMemo(() => {
    if (activeClients.length === 0) {
      return snapshot.totalIncome > 0 ? snapshot.totalIncome / 4 : 2500
    }
    const sum = activeClients.reduce((s, c) => s + getClientNet(c), 0)
    return sum / activeClients.length
  }, [activeClients, snapshot.totalIncome])

  const [newClients, setNewClients] = useState(0)
  const [pricingPct, setPricingPct] = useState(0)
  const [cutExpensesPct, setCutExpensesPct] = useState(0)
  const [teamCost, setTeamCost] = useState(0)

  const projectedNet = useMemo(() => {
    let income = snapshot.totalIncome
    income = income * (1 + pricingPct / 100)
    income += newClients * avgClientNet
    const recurring = snapshot.recurringCosts
    const adjustedExpenses = recurring * (1 - cutExpensesPct / 100) + teamCost
    return income - adjustedExpenses
  }, [snapshot.totalIncome, snapshot.recurringCosts, newClients, avgClientNet, pricingPct, cutExpensesPct, teamCost])

  const baselineNet = snapshot.net

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 pb-20">
        <StaggerItem>
          <h1 className="text-2xl font-bold text-[var(--text)]">Scenario simulator</h1>
          <p className="mt-1 text-[15px] text-[var(--text-dim)]">
            Adjust levers — projected monthly net updates immediately. Baseline net: {fmt(Math.round(baselineNet))}/mo.
          </p>
        </StaggerItem>

        <StaggerItem>
          <motion.div className="card space-y-5 border-[var(--accent)]/25 p-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--accent)]/5 p-4">
              <p className="label text-[10px] tracking-widest text-[var(--accent)]">PROJECTED MONTHLY NET</p>
              <p className="data mt-1 text-3xl font-bold tabular-nums text-[var(--accent)]">{fmt(Math.round(projectedNet))}</p>
              <p className="mt-1 text-[12px] text-[var(--text-dim)]">
                vs current {fmt(Math.round(baselineNet))}/mo (
                {baselineNet !== 0
                  ? `${projectedNet >= baselineNet ? '+' : ''}${(((projectedNet - baselineNet) / Math.max(Math.abs(baselineNet), 1)) * 100).toFixed(0)}%`
                  : '—'}
                )
              </p>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-[var(--text)]">Add new clients</span>
                <span className="data text-sm font-semibold text-[var(--accent)]">{newClients}</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={newClients}
                onChange={(e) => setNewClients(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <p className="text-[10px] text-[var(--text-dim)]">
                ~{fmt(Math.round(avgClientNet))}/mo each (avg net from active clients)
              </p>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-[var(--text)]">Change pricing (revenue)</span>
                <span className="data text-sm font-semibold text-[var(--accent)]">
                  {pricingPct >= 0 ? '+' : ''}
                  {pricingPct}%
                </span>
              </div>
              <input
                type="range"
                min={-50}
                max={100}
                step={1}
                value={pricingPct}
                onChange={(e) => setPricingPct(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-[var(--text)]">Cut recurring expenses</span>
                <span className="data text-sm font-semibold text-[var(--accent)]">{cutExpensesPct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={cutExpensesPct}
                onChange={(e) => setCutExpensesPct(Number(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <p className="text-[10px] text-[var(--text-dim)]">
                Applied to recurring ledger ({fmt(Math.round(snapshot.recurringCosts))}/mo)
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm text-[var(--text)]">Add team member at ($/mo)</label>
              <input
                type="number"
                min={0}
                step={100}
                value={teamCost || ''}
                onChange={(e) => setTeamCost(Number(e.target.value) || 0)}
                className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5 text-[17px] tabular-nums text-[var(--text)]"
              />
              <p className="mt-1 text-[10px] text-[var(--text-dim)]">Added to monthly burn (salary / contractor).</p>
            </div>
          </motion.div>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  )
}
