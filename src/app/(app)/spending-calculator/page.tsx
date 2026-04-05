'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import PageTransition from '@/components/PageTransition'
import {
  useStore,
  computeMonthlyMoneySnapshot,
  getExecutionScore,
  getClientNet,
  isArchived,
} from '@/stores/store'

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

/** Future value of monthly contributions at approximate annual return (illustrative). */
function fvMonthly(monthly: number, years: number, annualRate: number) {
  const rm = annualRate / 12
  const n = years * 12
  if (monthly <= 0 || n <= 0) return 0
  return monthly * ((Math.pow(1 + rm, n) - 1) / rm)
}

export default function SpendingCalculatorPage() {
  const router = useRouter()
  const {
    businesses,
    clients,
    expenseEntries,
    todayHealth,
    tasks,
    focusSessions,
    trackPrayers,
    balanceSheetAssets,
    savingsRange,
    incomeTarget,
  } = useStore()

  const { net: netTakeHome, recurringCosts } = computeMonthlyMoneySnapshot({
    businesses,
    clients,
    expenseEntries,
  })

  const [name, setName] = useState('')
  const [monthly, setMonthly] = useState<number>(0)
  const [upfront, setUpfront] = useState<number>(0)
  const [replaces, setReplaces] = useState(false)
  const [replaceCost, setReplaceCost] = useState<number>(0)

  const todayStr = new Date().toISOString().split('T')[0]
  const tasksDoneToday = tasks.filter(
    (t) => !isArchived(t) && t.done && t.completedAt?.startsWith(todayStr)
  ).length
  const tasksCommitted = tasks.filter(
    (t) =>
      !isArchived(t) && (t.createdAt.startsWith(todayStr) || (!t.done && t.priority !== 'low'))
  ).length
  const todayFocusCount = focusSessions.filter((s) => s.startedAt?.startsWith(todayStr)).length
  const execScore = getExecutionScore(
    todayHealth,
    tasksCommitted,
    tasksDoneToday,
    todayFocusCount,
    trackPrayers
  )

  const activeClients = clients.filter((c) => !isArchived(c) && c.active)
  const totalClientNet = activeClients.reduce((s, c) => s + getClientNet(c), 0)
  const avgClientMonthly = activeClients.length > 0 ? totalClientNet / activeClients.length : 0

  const assetTotal = balanceSheetAssets.reduce((s, a) => s + a.value, 0)

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

    const netAfterPurchase = netTakeHome - netMonthly
    const monthlyBurnBefore = Math.max(recurringCosts, 1)
    const monthlyBurnAfter = monthlyBurnBefore + netMonthly
    const runwayMonthsBefore = assetTotal > 0 ? assetTotal / monthlyBurnBefore : null
    const runwayMonthsAfter = assetTotal > 0 ? assetTotal / monthlyBurnAfter : null

    const revenueToCover = netMonthly
    const extraClientsAtAvgFee =
      avgClientMonthly > 0 ? revenueToCover / avgClientMonthly : 0
    const impliedOutputLiftPct =
      netTakeHome > 0 && incomeTarget > 0
        ? Math.max(0, ((incomeTarget + netMonthly) / Math.max(incomeTarget, 1) - 1) * 100)
        : netTakeHome > 0
          ? (netMonthly / netTakeHome) * 100
          : 0
    const execLiftNeeded = Math.max(0, 85 - execScore)

    const deprecStraightLine5yr = upfront > 0 ? upfront / 5 : 0

    const sp10 = fvMonthly(netMonthly, 10, 0.1)
    const bizChannelFv = fvMonthly(netMonthly, 10, 0.15)

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
      netAfterPurchase,
      runwayMonthsBefore,
      runwayMonthsAfter,
      revenueToCover,
      extraClientsAtAvgFee,
      impliedOutputLiftPct,
      execLiftNeeded,
      deprecStraightLine5yr,
      sp10,
      bizChannelFv,
    }
  }, [
    monthly,
    upfront,
    replaces,
    replaceCost,
    netTakeHome,
    recurringCosts,
    assetTotal,
    avgClientMonthly,
    incomeTarget,
    execScore,
  ])

  const altIdeas = useMemo(() => {
    const m = analysis.netMonthly
    const hr = analysis.hourlyRate
    if (m <= 0) return [] as string[]
    const out: string[] = []
    if (m >= 50)
      out.push(
        `Same outlay over a year could fund ~${Math.floor((m * 12) / 1200)} months of focused coaching or a mid-tier course.`
      )
    if (m >= 200)
      out.push(
        `Roughly ${Math.floor(m / 25)} very nice dinners out — or one serious weekend trip if you stack a few months.`
      )
    if (hr > 0)
      out.push(
        `Banking this for a year equals ~${(analysis.hoursPerYearEq / 8).toFixed(0)} full workdays of your effective rate.`
      )
    if (out.length === 0)
      out.push('Small recurring costs still compound — compare to adding to your tax or profit buckets instead.')
    return out
  }, [analysis])

  const savingsLabel = savingsRange?.trim() || 'not set in profile'

  async function shareAnalysis() {
    const text = [
      name ? `Item: ${name}` : 'Spending impact',
      `Net monthly: ${fmt(analysis.netMonthly)}`,
      `5-year (incl. upfront): ${fmt(analysis.fiveYear)}`,
      `Verdict: ${analysis.afford}`,
    ].join('\n')
    try {
      if (navigator.share) {
        await navigator.share({ title: 'ART OS — Spending analysis', text })
      } else {
        await navigator.clipboard.writeText(text)
        toast.success('Copied summary to clipboard')
      }
    } catch {
      toast.error('Could not share — try again')
    }
  }

  function revisitLater() {
    const key = 'artos:spending-revisit'
    try {
      const raw = localStorage.getItem(key)
      const list = raw ? (JSON.parse(raw) as string[]) : []
      const line = `${new Date().toISOString().slice(0, 10)} — ${name || 'Purchase'} — ${fmt(analysis.netMonthly)}/mo`
      localStorage.setItem(key, JSON.stringify([line, ...list].slice(0, 20)))
    } catch {
      /* ignore */
    }
    toast.message('Saved', { description: 'Reminder stored on this device. Revisit from Decision Lab or here.' })
  }

  function askAiMore() {
    const q = name
      ? `Can I afford "${name}" at about ${fmt(monthly)}/mo? Here's my ART OS numbers: net ~${fmt(netTakeHome)}/mo, verdict ${analysis.afford}.`
      : `Help me think through a purchase at ~${fmt(monthly)}/mo given my current finances.`
    router.push(`/ai?ask=${encodeURIComponent(q)}`)
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-lg space-y-6 pb-24">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.2px] text-[var(--text-primary)]">Spending impact</h1>
          <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
            PRD §7.3 — five-part analysis. Net take-home from your ledger:{' '}
            {netTakeHome >= 0 ? fmt(netTakeHome) : '—'} /mo.
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
          <label className="input-label block">Monthly cost (incl. insurance, maintenance)</label>
          <input
            type="number"
            min={0}
            className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[17px] text-[var(--text-primary)] tabular-nums"
            value={monthly || ''}
            onChange={(e) => setMonthly(Number(e.target.value) || 0)}
          />
          <label className="input-label block">Down payment / upfront</label>
          <input
            type="number"
            min={0}
            className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[17px] text-[var(--text-primary)] tabular-nums"
            value={upfront || ''}
            onChange={(e) => setUpfront(Number(e.target.value) || 0)}
          />
          <label className="flex items-center gap-2 text-[15px] text-[var(--text-primary)]">
            <input type="checkbox" checked={replaces} onChange={(e) => setReplaces(e.target.checked)} />
            Does this replace a current expense?
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
            <span className="data tabular-nums text-[var(--text-primary)]">{fmt(analysis.netMonthly)}</span>. Annualized:{' '}
            <span className="data tabular-nums text-[var(--text-primary)]">{fmt(analysis.annual)}</span>. Five-year total
            (including upfront):{' '}
            <span className="data tabular-nums text-[var(--text-primary)]">{fmt(analysis.fiveYear)}</span>.
          </p>
          {upfront > 0 && (
            <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
              Down payment impact: one-time deployable cash drops by{' '}
              <span className="tabular-nums text-[var(--text-primary)]">{fmt(upfront)}</span>. Illustrative straight-line
              depreciation on capital over 5y: ~<span className="tabular-nums">{fmt(analysis.deprecStraightLine5yr)}</span>
              /yr.
            </p>
          )}
          <p className="mt-2 text-[14px] text-[var(--text-tertiary)]">
            Savings range (profile): {savingsLabel}. After this commitment, monthly cushion vs today&apos;s modeled net
            shifts by <span className="tabular-nums text-[var(--text-primary)]">−{fmt(analysis.netMonthly)}</span>/mo (
            {netTakeHome >= 0 ? (
              <>
                from <span className="tabular-nums">{fmt(netTakeHome)}</span> to{' '}
                <span className="tabular-nums">{fmt(analysis.netAfterPurchase)}</span> take-home
              </>
            ) : (
              'income not fully modeled'
            )}
            ).
          </p>
        </section>

        {/* §7.3 — What This Equals In Your World */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            What this equals in your world
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Revenue / cashflow needed to break even on this monthly obligation:{' '}
            <span className="tabular-nums text-[var(--text-primary)]">{fmt(analysis.revenueToCover)}</span>/mo.
          </p>
          {analysis.hourlyRate > 0 ? (
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-secondary)]">
              At an effective ~{fmt(analysis.hourlyRate)}/hr (net ÷ 160h), that&apos;s about{' '}
              <span className="data tabular-nums text-[var(--text-primary)]">
                {analysis.hoursPerMonthEq.toFixed(1)} hours/month
              </span>{' '}
              of work (<span className="tabular-nums">{analysis.hoursPerYearEq.toFixed(0)}</span> h/year). Five-year
              effort ≈ <span className="tabular-nums">{analysis.workWeeksEq.toFixed(1)}</span> forty-hour weeks at that
              rate.
            </p>
          ) : (
            <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
              Add income and expense data so we can translate spend into hours at your effective rate.
            </p>
          )}
          <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
            {avgClientMonthly > 0 ? (
              <>
                At your average active-client net (~{fmt(avgClientMonthly)}/mo per client), this needs roughly{' '}
                <span className="tabular-nums text-[var(--text-primary)]">
                  {analysis.extraClientsAtAvgFee.toFixed(2)}
                </span>{' '}
                additional equivalent clients (or proportional upsell) to cover the line item.
              </>
            ) : (
              'Log active clients with fees to translate this into “how many clients” at your average ticket.'
            )}
          </p>
          <p className="mt-2 text-[14px] text-[var(--text-tertiary)]">
            Burden vs current take-home:{' '}
            <span className="tabular-nums text-[var(--text-primary)]">{analysis.pctOfIncome.toFixed(1)}%</span>. Rough
            implied output / income lift to neutralize the line item: ~{' '}
            <span className="tabular-nums">{analysis.impliedOutputLiftPct.toFixed(1)}%</span> vs baseline (modeled). At
            your current execution score ({execScore}/100), closing the gap might need roughly{' '}
            <span className="tabular-nums">{analysis.execLiftNeeded.toFixed(0)}</span> points of execution lift (or more
            revenue) — illustrative, not a guarantee.
          </p>
        </section>

        {/* §7.3 — Can You Afford This */}
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            Can you afford this?
          </h2>
          <p className="mt-3 text-[15px] text-[var(--text-secondary)]">
            Current net take-home (modeled): <span className="tabular-nums">{fmt(netTakeHome)}</span>/mo. After purchase:{' '}
            <span className="tabular-nums">{fmt(analysis.netAfterPurchase)}</span>/mo.
          </p>
          <p className="mt-2 text-[15px] text-[var(--text-secondary)]">
            Emergency runway (rough, assets ÷ monthly burn):{' '}
            {analysis.runwayMonthsBefore != null ? (
              <>
                ~<span className="tabular-nums">{analysis.runwayMonthsBefore.toFixed(1)}</span> mo before →{' '}
                <span className="tabular-nums">{analysis.runwayMonthsAfter?.toFixed(1)}</span> mo after (uses balance
                sheet assets as a single pool; illustrative).
              </>
            ) : (
              'Add balance sheet assets to estimate months covered.'
            )}
          </p>
          <p className="mt-2 text-[14px] text-[var(--text-tertiary)]">
            Savings rate: net {fmt(netTakeHome)}/mo vs recurring ledger {fmt(recurringCosts)}/mo — adding this line moves
            discretionary room by about −{fmt(analysis.netMonthly)}/mo.
          </p>
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
                ? 'Can afford'
                : analysis.afford === 'CANNOT_AFFORD'
                  ? 'Cannot afford'
                  : 'Stretch'}
            </div>
            <p className="text-[15px] text-[var(--text-secondary)]">
              {analysis.afford === 'CAN_AFFORD' &&
                'Relative to your current take-home, this is a smaller slice — compounding still matters.'}
              {analysis.afford === 'STRETCH' &&
                'Noticeable — check runway, taxes, and whether this trades off with your stated income target.'}
              {analysis.afford === 'CANNOT_AFFORD' &&
                'High relative load or income not modeled — pause until numbers are current.'}
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
              Redirecting <span className="tabular-nums text-[var(--text-primary)]">{fmt(analysis.netMonthly)}</span>/mo
              to savings for five years ≈{' '}
              <span className="tabular-nums text-[var(--positive)]">{fmt(analysis.savingsRedirect)}</span> before returns.
            </li>
            <li>
              Same flow into your highest-ROI growth channel (~15% illustrative annual reinvestment compounding over 10y):
              ≈ <span className="tabular-nums">{fmt(analysis.bizChannelFv)}</span> (not a forecast — for comparison only).
            </li>
            <li>
              S&P 500–style index (~10% annualized illustrative): ≈{' '}
              <span className="tabular-nums">{fmt(analysis.sp10)}</span> after 10 years of monthly contributions at this
              amount.
            </li>
            <li>
              Paid ads: if blended ROAS were ~3×, <span className="tabular-nums">{fmt(analysis.netMonthly)}</span>/mo in ad
              spend might yield ~<span className="tabular-nums">{fmt(analysis.netMonthly * 3)}</span>/mo revenue
              (illustrative — replace with your real funnel metrics).
            </li>
          </ul>
        </section>

        {/* §7.3 — Action buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <motion.button
            type="button"
            className="min-h-[48px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-[17px] font-medium text-[var(--text-primary)]"
            whileTap={{ scale: 0.99 }}
            onClick={() => void shareAnalysis()}
          >
            Share analysis
          </motion.button>
          <motion.button
            type="button"
            className="min-h-[48px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 text-[17px] font-medium text-[var(--text-primary)]"
            whileTap={{ scale: 0.99 }}
            onClick={revisitLater}
          >
            Revisit later
          </motion.button>
          <motion.button
            type="button"
            className="min-h-[48px] flex-1 rounded-xl bg-[var(--accent)] px-4 text-[17px] font-semibold text-white"
            whileTap={{ scale: 0.99 }}
            onClick={askAiMore}
          >
            Ask AI more questions
          </motion.button>
        </div>

        <motion.div
          className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-secondary)]/80 p-4"
          whileTap={{ scale: 0.99 }}
        >
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Illustrative only — not tax or legal advice. Execution and business context matter as much as the raw numbers.
          </p>
        </motion.div>
      </div>
    </PageTransition>
  )
}
