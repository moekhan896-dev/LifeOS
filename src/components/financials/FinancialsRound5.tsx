'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Drawer } from 'vaul'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Business, Client, DailyNetSnapshot, ExpenseEntry } from '@/stores/store'
import {
  businessCosts,
  grossRevenue,
  last12MonthKeys,
  lastMonthScaled,
  netRevenue,
  netRevenueByBusiness,
  personalExpensesRecurring,
  processingFeesGross,
  sumSnapshotsByMonth,
  takeHome,
  currentAndPreviousMonthKeys,
  estimatedMonthlyWorkingHours,
  clientConcentrationWarnings,
} from '@/lib/financials-metrics'

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function deltaClass(delta: number, lowerIsBetter: boolean) {
  if (delta === 0) return 'text-[var(--text-secondary)]'
  const good = lowerIsBetter ? delta < 0 : delta > 0
  return good ? 'text-[var(--positive)]' : 'text-[var(--negative)]'
}

type PLRowId = 'gross' | 'biz' | 'proc' | 'netRev' | 'personal' | 'take'

export function FinancialsHero({
  netTakeHome,
  incomeTarget,
  dailyNetSnapshots,
  workDayStart,
  workDayEnd,
}: {
  netTakeHome: number
  incomeTarget: number
  dailyNetSnapshots: DailyNetSnapshot[]
  workDayStart: string
  workDayEnd: string
}) {
  const [open, setOpen] = useState(false)
  const gap = incomeTarget > 0 ? incomeTarget - netTakeHome : 0
  const progress = incomeTarget > 0 ? Math.min(1, Math.max(0, netTakeHome / incomeTarget)) : 0

  const chartData = useMemo(() => {
    const keys = last12MonthKeys()
    const byMonth = sumSnapshotsByMonth(dailyNetSnapshots)
    return keys.map((k) => ({
      monthKey: k,
      label: k,
      net: Math.round(byMonth.get(k) ?? 0),
    }))
  }, [dailyNetSnapshots])

  const hasData = chartData.some((d) => d.net !== 0)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="card w-full px-5 py-6 text-left transition hover:bg-[var(--bg-elevated)]"
      >
        <p className="label mb-1 text-[var(--accent)]">Net take-home (monthly)</p>
        <p
          className={`font-mono text-[48px] font-bold leading-none tabular-nums ${
            netTakeHome >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'
          }`}
        >
          {fmt(netTakeHome)}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-[15px]">
          <span className="text-[var(--text-secondary)]">
            Target: <span className="font-mono text-[var(--text)]">{fmt(incomeTarget)}</span>
          </span>
          <span className="text-[var(--text-secondary)]">
            Gap:{' '}
            <span className={`font-mono ${gap <= 0 ? 'text-[var(--positive)]' : 'text-[var(--warning)]'}`}>
              {fmt(gap)}
            </span>
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--surface2)]">
          <div className="h-2 rounded-full bg-[var(--accent)] transition-all" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="mt-4 h-[240px] w-full">
          {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="heroNetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--text-dim)', fontSize: 9 }} interval={2} />
                <YAxis tick={{ fill: 'var(--text-dim)', fontSize: 10 }} width={44} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v) => [fmt(Number(v)), 'Net']}
                />
                {incomeTarget > 0 && (
                  <ReferenceLine
                    y={incomeTarget}
                    stroke="var(--accent)"
                    strokeDasharray="5 5"
                    strokeOpacity={0.85}
                  />
                )}
                <Area type="monotone" dataKey="net" stroke="var(--accent)" fill="url(#heroNetGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-center text-[15px] text-[var(--text-secondary)]">
              Start tracking revenue and expenses to see your take-home.
            </div>
          )}
        </div>
        <p className="mt-2 text-[12px] text-[var(--text-dim)]">Tap the number for a monthly breakdown</p>
      </button>

      <Drawer.Root open={open} onOpenChange={setOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[80] bg-black/50" />
          <Drawer.Content className="card-floating fixed bottom-0 left-0 right-0 z-[90] max-h-[88vh] rounded-t-[20px] p-6">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--border)]" />
            <Drawer.Title className="text-lg font-semibold text-[var(--text)]">Monthly breakdown</Drawer.Title>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              Estimated working hours: {estimatedMonthlyWorkingHours(workDayStart, workDayEnd)} / month (for time-cost).
            </p>
            <ul className="mt-4 max-h-[55vh] space-y-3 overflow-y-auto">
              {chartData
                .filter((r) => r.net !== 0)
                .map((r) => (
                  <li key={r.monthKey} className="flex justify-between border-b border-[var(--border)] py-2 font-mono text-[15px]">
                    <span className="text-[var(--text-secondary)]">{r.monthKey}</span>
                    <span className={r.net >= 0 ? 'text-[var(--positive)]' : 'text-[var(--negative)]'}>{fmt(r.net)}</span>
                  </li>
                ))}
              {chartData.every((r) => r.net === 0) && (
                <li className="text-[15px] text-[var(--text-dim)]">
                  No snapshot history yet. Net is appended daily from your live P&amp;L when you use the app.
                </li>
              )}
            </ul>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}

export function FinancialsProfitLossSection({
  businesses,
  clients,
  expenseEntries,
  dailyNetSnapshots,
  anthropicKey,
}: {
  businesses: Business[]
  clients: Client[]
  expenseEntries: ExpenseEntry[]
  dailyNetSnapshots: DailyNetSnapshot[]
  anthropicKey: string
}) {
  const { current, previous } = currentAndPreviousMonthKeys()
  const byMonth = useMemo(() => sumSnapshotsByMonth(dailyNetSnapshots), [dailyNetSnapshots])

  const { rows, insightContext } = useMemo(() => {
    const gross = grossRevenue(businesses)
    const biz = businessCosts(businesses, clients)
    const proc = processingFeesGross(gross)
    const nRev = netRevenue(gross, biz, proc)
    const personal = personalExpensesRecurring(expenseEntries)
    const take = takeHome(nRev, personal)

    const thisMonthNetSnap = byMonth.get(current) ?? null
    const prevMonthNetSnap = byMonth.get(previous) ?? null
    const thisTake = thisMonthNetSnap !== null && thisMonthNetSnap > 0 ? thisMonthNetSnap : take

    const last = (line: number) => lastMonthScaled(line, thisTake, prevMonthNetSnap)

    const rows: {
      id: PLRowId
      label: string
      thisM: number
      lastM: number | null
      lowerIsBetter: boolean
    }[] = [
      { id: 'gross', label: 'Gross Revenue', thisM: gross, lastM: last(gross), lowerIsBetter: false },
      { id: 'biz', label: 'Business Costs', thisM: biz, lastM: last(biz), lowerIsBetter: true },
      { id: 'proc', label: 'Processing Fees (est. 3%)', thisM: proc, lastM: last(proc), lowerIsBetter: true },
      { id: 'netRev', label: 'Net Revenue', thisM: nRev, lastM: last(nRev), lowerIsBetter: false },
      { id: 'personal', label: 'Personal Expenses (recurring)', thisM: personal, lastM: last(personal), lowerIsBetter: true },
      { id: 'take', label: 'Take-Home', thisM: take, lastM: prevMonthNetSnap, lowerIsBetter: false },
    ]

    const insightContext = rows
      .map((r) => {
        if (r.lastM === null) return `${r.label}: (no prior month in snapshots)`
        const d = r.thisM - r.lastM
        return `${r.label}: Δ ${fmt(d)}`
      })
      .join('\n')

    return { rows, insightContext }
  }, [businesses, clients, expenseEntries, byMonth, current, previous])

  const [expanded, setExpanded] = useState<PLRowId | null>(null)
  const [insight, setInsight] = useState<string | null>(null)

  useEffect(() => {
    if (!anthropicKey?.trim()) {
      setInsight(null)
      return
    }
    let cancelled = false
    void fetch('/api/financials/pl-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: anthropicKey, context: insightContext }),
    })
      .then((r) => r.json())
      .then((j: { sentence?: string }) => {
        if (!cancelled && j.sentence) setInsight(j.sentence)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [anthropicKey, insightContext])

  const breakdown = (id: PLRowId) => {
    switch (id) {
      case 'gross':
        return businesses.map((b) => (
          <div key={b.id} className="flex justify-between text-[13px]">
            <span>{b.name}</span>
            <span className="font-mono">{fmt(b.monthlyRevenue || 0)}</span>
          </div>
        ))
      case 'biz':
        return (
          <>
            <div className="flex justify-between text-[13px]">
              <span>Ad spend (all clients)</span>
              <span className="font-mono">{fmt(clients.filter((c) => c.active).reduce((s, c) => s + c.adSpend, 0))}</span>
            </div>
            {businesses.map((b) => (
              <div key={b.id} className="mt-1 text-[12px] text-[var(--text-dim)]">
                {(b.teamMembers ?? []).length ? `${b.name} team comp: ${(b.teamMembers ?? []).map((m) => m.compensation || '—').join(' · ')}` : null}
              </div>
            ))}
          </>
        )
      case 'proc':
        return <p className="text-[13px] text-[var(--text-secondary)]">3% of gross revenue (Stripe-style estimate).</p>
      case 'netRev':
        return <p className="text-[13px] text-[var(--text-secondary)]">Gross − business costs − processing.</p>
      case 'personal':
        return expenseEntries
          .filter((e) => e.recurring)
          .map((e) => (
            <div key={e.id} className="flex justify-between text-[13px]">
              <span>{e.category}</span>
              <span className="font-mono text-[var(--negative)]">{fmt(e.amount)}</span>
            </div>
          ))
      case 'take':
        return <p className="text-[13px] text-[var(--text-secondary)]">Net revenue minus recurring personal expenses.</p>
      default:
        return null
    }
  }

  return (
    <div className="card px-5 py-4">
      <h2 className="text-[17px] font-semibold text-[var(--text)]">Profit &amp; Loss</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[520px] text-[14px]">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[12px] uppercase text-[var(--text-dim)]">
              <th className="py-2 pr-2">Line</th>
              <th className="px-2 py-2 text-right">This month</th>
              <th className="px-2 py-2 text-right">Last month</th>
              <th className="py-2 pl-2 text-right">Delta</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const delta = r.lastM !== null ? r.thisM - r.lastM : null
              return (
                <Fragment key={r.id}>
                  <tr
                    className="cursor-pointer border-b border-[var(--border)]/60 hover:bg-[var(--bg-elevated)]"
                    onClick={() => setExpanded((e) => (e === r.id ? null : r.id))}
                  >
                    <td className="py-3 pr-2 font-medium text-[var(--text)]">{r.label}</td>
                    <td className="px-2 py-3 text-right font-mono tabular-nums">{fmt(r.thisM)}</td>
                    <td className="px-2 py-3 text-right font-mono tabular-nums text-[var(--text-secondary)]">
                      {r.lastM !== null ? fmt(r.lastM) : '—'}
                    </td>
                    <td
                      className={`py-3 pl-2 text-right font-mono tabular-nums ${
                        delta === null ? 'text-[var(--text-dim)]' : deltaClass(delta, r.lowerIsBetter)
                      }`}
                    >
                      {delta === null ? '—' : `${delta > 0 ? '+' : ''}${fmt(delta)}`}
                    </td>
                  </tr>
                  {expanded === r.id && (
                    <tr className="bg-[var(--bg-elevated)]">
                      <td colSpan={4} className="px-3 py-3 text-[var(--text-secondary)]">
                        {breakdown(r.id)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-4 rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-[14px] text-[var(--text-secondary)]">
        {insight ? (
          <p>{insight}</p>
        ) : anthropicKey?.trim() ? (
          <p className="text-[var(--text-dim)]">Generating insight…</p>
        ) : (
          <p>{insightContext || 'Add an Anthropic API key in Settings for an AI summary of the biggest change.'}</p>
        )}
      </div>
    </div>
  )
}

export function FinancialsRevenueByBusinessChart({ businesses, clients }: { businesses: Business[]; clients: Client[] }) {
  const router = useRouter()
  const data = useMemo(() => netRevenueByBusiness(businesses, clients), [businesses, clients])
  const totals = useMemo(() => {
    const gross = data.reduce((s, d) => s + d.gross, 0)
    const feesSplits = data.reduce((s, d) => s + d.deductions, 0)
    const net = data.reduce((s, d) => s + d.net, 0)
    return { gross, feesSplits, net }
  }, [data])
  const h = Math.max(200, 48 + data.length * 44)

  return (
    <div className="card px-5 py-4">
      <h2 className="text-[17px] font-semibold text-[var(--text)]">Revenue by business</h2>
      <div className="mt-3" style={{ height: h }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 4, right: 28, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
            <Tooltip
              formatter={(v) => [fmt(Number(v)), 'Net']}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12 }}
            />
            <Bar
              dataKey="net"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              onClick={(_, idx) => {
                const row = data[idx as number]
                if (row) router.push(`/business/${row.id}`)
              }}
            >
              {data.map((d) => (
                <Cell key={d.id} fill={d.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 font-mono text-[12px] text-[var(--text-secondary)]">
        Total gross: {fmt(totals.gross)} · Fees/splits: {fmt(totals.feesSplits)} · Net: {fmt(totals.net)}
      </p>
    </div>
  )
}

export function FinancialsConcentrationWarnings({
  businesses,
  clients,
}: {
  businesses: Business[]
  clients: Client[]
}) {
  const warnings = useMemo(() => clientConcentrationWarnings(businesses, clients, 30), [businesses, clients])

  if (warnings.length === 0) return null

  return (
    <div className="card px-5 py-4">
      <h2 className="text-[17px] font-semibold text-[var(--text)]">Client concentration</h2>
      <div className="mt-3 space-y-3">
        {warnings.map(({ client, business, clientNet, pctOfTotal }) => (
          <div
            key={client.id}
            className="rounded-[14px] border border-[var(--border)] border-l-[3px] border-l-[var(--negative)] bg-[var(--bg-elevated)] p-4"
          >
            <p className="text-[15px] text-[var(--text)]">
              ⚠ {client.name} represents {pctOfTotal.toFixed(0)}% of net revenue from {business.name}. If they leave, you lose{' '}
              {fmt(clientNet)}/mo. Diversify.
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FinancialsDailySpending({
  plaidConnected,
  netTakeHome,
  workDayStart,
  workDayEnd,
}: {
  plaidConnected: boolean
  netTakeHome: number
  workDayStart: string
  workDayEnd: string
}) {
  const hours = estimatedMonthlyWorkingHours(workDayStart, workDayEnd)
  const hourly = hours > 0 && netTakeHome > 0 ? netTakeHome / hours : 0

  return (
    <div className="card px-5 py-4">
      <h2 className="text-[17px] font-semibold text-[var(--text)]">Daily Spending</h2>
      {!plaidConnected ? (
        <div className="mt-3 rounded-[14px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
          <p className="text-[15px] text-[var(--text-secondary)]">
            Connect your bank to see daily transactions categorized automatically. Each purchase shows how many hours of your time it cost.
          </p>
          <Link href="/settings" className="mt-3 inline-block text-[15px] font-medium text-[var(--accent)]">
            Connect in Settings →
          </Link>
        </div>
      ) : (
        <div className="mt-3 max-h-48 space-y-2 overflow-y-auto rounded-[12px] border border-[var(--border)] p-3">
          <p className="text-[13px] text-[var(--text-dim)]">
            Plaid connected — transaction feed will appear here. Example row (placeholder):
          </p>
          <div className="flex justify-between border-b border-[var(--border)] py-2 text-[14px]">
            <span>Merchant</span>
            <span className="font-mono text-[var(--negative)]">($0.00)</span>
          </div>
          <p className="text-[12px] text-[var(--text-dim)]">
            Effective rate: {hourly > 0 ? `${fmt(hourly)}/hr` : '—'} · = hours of your time when linked.
          </p>
        </div>
      )}
    </div>
  )
}
