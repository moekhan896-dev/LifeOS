'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import { useStore, computeMonthlyMoneySnapshot } from '@/stores/store'

export default function SpendingCalculatorPage() {
  const { businesses, clients, expenseEntries } = useStore()
  const { net: netTakeHome } = computeMonthlyMoneySnapshot({ businesses, clients, expenseEntries })

  const [name, setName] = useState('')
  const [monthly, setMonthly] = useState<number>(0)
  const [upfront, setUpfront] = useState<number>(0)
  const [replaces, setReplaces] = useState(false)
  const [replaceCost, setReplaceCost] = useState<number>(0)

  const analysis = useMemo(() => {
    const netMonthly = Math.max(0, monthly - (replaces ? replaceCost : 0))
    const annual = netMonthly * 12
    const fiveYear = annual * 5 + upfront
    const hourlyRate = netTakeHome > 0 && netTakeHome < 1e9 ? netTakeHome / 160 : 0
    const hoursPerMonthEq = hourlyRate > 0 ? netMonthly / hourlyRate : 0
    const hoursPerYearEq = hoursPerMonthEq * 12
    const pctOfIncome = netTakeHome > 0 ? (netMonthly / netTakeHome) * 100 : 0
    let afford: 'CAN_AFFORD' | 'STRETCH' | 'CANNOT_AFFORD' = 'STRETCH'
    if (netTakeHome <= 0) afford = 'CANNOT_AFFORD'
    else if (netMonthly / Math.max(netTakeHome, 1) < 0.05) afford = 'CAN_AFFORD'
    else if (netMonthly / Math.max(netTakeHome, 1) > 0.2) afford = 'CANNOT_AFFORD'

    const workWeeksEq = hourlyRate > 0 ? fiveYear / (hourlyRate * 40) : 0
    const savingsRedirect = netMonthly * 12 * 5

    return {
      netMonthly,
      annual,
      fiveYear,
      hoursPerMonthEq,
      hoursPerYearEq,
      afford,
      hourlyRate,
      pctOfIncome,
      workWeeksEq,
      savingsRedirect,
    }
  }, [monthly, upfront, replaces, replaceCost, netTakeHome])

  const altIdeas = useMemo(() => {
    const m = analysis.netMonthly
    const hr = analysis.hourlyRate
    if (m <= 0) return [] as string[]
    const out: string[] = []
    if (m >= 50) out.push(`Same outlay over a year could fund ~${Math.floor((m * 12) / 1200)} months of focused coaching or a mid-tier course.`)
    if (m >= 200) out.push(`Roughly ${Math.floor(m / 25)} very nice dinners out — or one serious weekend trip if you stack a few months.`)
    if (hr > 0) out.push(`Banking this for a year equals ~${(analysis.hoursPerYearEq / 8).toFixed(0)} full workdays of your effective rate.`)
    if (out.length === 0) out.push('Small recurring costs still compound — compare to adding to your tax or profit buckets instead.')
    return out
  }, [analysis])

  return (
    <PageTransition>
      <div className="mx-auto max-w-lg space-y-6 pb-24">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.2px] text-[var(--text-primary)]">Spending impact</h1>
          <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
            PRD §7.3 — four-part analysis. Uses your current net take-home from the store (
            {netTakeHome >= 0 ? `$${netTakeHome.toLocaleString()}` : '—'} /mo).
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <label className="input-label block">Item</label>
          <input
            className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[17px] text-[var(--text-primary)]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What are you considering?"
          />
          <label className="input-label block">Monthly cost (incl. insurance, etc.)</label>
          <input
            type="number"
            min={0}
            className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[17px] text-[var(--text-primary)] tabular-nums"
            value={monthly || ''}
            onChange={(e) => setMonthly(Number(e.target.value) || 0)}
          />
          <label className="input-label block">Upfront / down payment</label>
          <input
            type="number"
            min={0}
            className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[17px] text-[var(--text-primary)] tabular-nums"
            value={upfront || ''}
            onChange={(e) => setUpfront(Number(e.target.value) || 0)}
          />
          <label className="flex items-center gap-2 text-[15px] text-[var(--text-primary)]">
            <input type="checkbox" checked={replaces} onChange={(e) => setReplaces(e.target.checked)} />
            Replaces a current expense
          </label>
          {replaces && (
            <>
              <label className="input-label block">Current expense you would drop ($/mo)</label>
              <input
                type="number"
                min={0}
                className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[17px] tabular-nums"
                value={replaceCost || ''}
                onChange={(e) => setReplaceCost(Number(e.target.value) || 0)}
              />
            </>
          )}
        </div>

        {/* §7.3 — The Real Cost */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            The real cost
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Net monthly increase after substitutions:{' '}
            <span className="data tabular-nums text-[var(--text-primary)]">${analysis.netMonthly.toLocaleString()}</span>.
            Annualized:{' '}
            <span className="data tabular-nums text-[var(--text-primary)]">${analysis.annual.toLocaleString()}</span>. Over five
            years (including upfront):{' '}
            <span className="data tabular-nums text-[var(--text-primary)]">${analysis.fiveYear.toLocaleString()}</span>.
          </p>
        </section>

        {/* §7.3 — What This Equals In Your World */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            What this equals in your world
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
            {analysis.hourlyRate > 0 ? (
              <>
                At an effective ~${analysis.hourlyRate.toFixed(0)}/hr (net ÷ 160h), this recurring spend is about{' '}
                <span className="data tabular-nums text-[var(--text-primary)]">
                  {analysis.hoursPerMonthEq.toFixed(1)} hours/month
                </span>{' '}
                of work (
                <span className="tabular-nums">{analysis.hoursPerYearEq.toFixed(0)}</span> h/year). Five-year total ≈{' '}
                <span className="tabular-nums">{analysis.workWeeksEq.toFixed(1)}</span> forty-hour weeks of that rate.
              </>
            ) : (
              <>Add income and expense data so we can translate spend into hours at your effective rate.</>
            )}
          </p>
          <p className="mt-2 text-[14px] text-[var(--text-tertiary)]">
            Burden vs income:{' '}
            <span className="tabular-nums text-[var(--text-primary)]">{analysis.pctOfIncome.toFixed(1)}%</span> of monthly
            take-home.
          </p>
        </section>

        {/* §7.3 — Can You Afford This */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Can you afford this
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div
              className="inline-block rounded-lg px-3 py-1.5 text-[12px] font-semibold uppercase tracking-wide"
              style={{
                background:
                  analysis.afford === 'CAN_AFFORD'
                    ? 'rgba(48,209,88,0.12)'
                    : analysis.afford === 'CANNOT_AFFORD'
                      ? 'rgba(255,69,58,0.12)'
                      : 'rgba(255,159,10,0.12)',
                color:
                  analysis.afford === 'CAN_AFFORD'
                    ? 'var(--positive)'
                    : analysis.afford === 'CANNOT_AFFORD'
                      ? 'var(--negative)'
                      : 'var(--warning)',
              }}
            >
              {analysis.afford === 'CAN_AFFORD'
                ? 'Within range'
                : analysis.afford === 'CANNOT_AFFORD'
                  ? 'High relative load'
                  : 'Stretch'}
            </div>
            <p className="text-[15px] text-[var(--text-secondary)]">
              {analysis.afford === 'CAN_AFFORD' &&
                'Relative to your current take-home, this is a small line item — still mind the compounding.'}
              {analysis.afford === 'STRETCH' &&
                'Noticeable but not automatically disqualifying — check runway and quarterly tax reserves.'}
              {analysis.afford === 'CANNOT_AFFORD' &&
                'This would eat a large share of net income or income is not yet modeled — pause and re-run after revenue/expense data is current.'}
            </p>
          </div>
        </section>

        {/* §7.3 — The Alternative */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            The alternative
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-2 text-[15px] text-[var(--text-secondary)]">
            {altIdeas.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
            <li>
              Redirecting the same{' '}
              <span className="tabular-nums text-[var(--text-primary)]">${analysis.netMonthly.toLocaleString()}</span>/mo to
              savings or debt for five years ≈{' '}
              <span className="tabular-nums text-[var(--positive)]">${analysis.savingsRedirect.toLocaleString()}</span>{' '}
              before returns.
            </li>
          </ul>
        </section>

        <motion.div
          className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]/80 p-4"
          whileTap={{ scale: 0.99 }}
        >
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Illustrative only — not tax or legal advice. Execution rate and business context matter as much as the raw
            numbers.
          </p>
        </motion.div>
      </div>
    </PageTransition>
  )
}
