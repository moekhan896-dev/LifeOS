'use client'

import { useMemo } from 'react'
import PageTransition from '@/components/PageTransition'
import { useStore, computeMonthlyMoneySnapshot } from '@/stores/store'

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

export default function ExpensesPage() {
  const { expenseEntries, businesses, clients } = useStore()
  const { recurringCosts, net } = computeMonthlyMoneySnapshot({ businesses, clients, expenseEntries })

  const rows = useMemo(() => {
    return [...expenseEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 40)
  }, [expenseEntries])

  const recurring = expenseEntries.filter((e) => e.recurring)
  const oneOff = expenseEntries.filter((e) => !e.recurring)

  return (
    <PageTransition>
      <div className="space-y-6 pb-24">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.2px] text-[var(--color-text)]">Expenses</h1>
          <p className="mt-1 text-[15px] text-[var(--color-text-mid)]">
            Recurring total (from entries marked recurring):{' '}
            <span className="font-mono text-[var(--color-text)]">{fmt(recurringCosts)}</span>
            /mo · Net take-home (snapshot): <span className="font-mono text-[var(--color-text)]">{fmt(net)}</span>/mo
          </p>
        </div>

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface2)] p-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">
            Recurring entries ({recurring.length})
          </h2>
          <ul className="mt-3 divide-y divide-[var(--color-border)]">
            {recurring.length === 0 && (
              <li className="py-2 text-[15px] text-[var(--color-text-mid)]">None logged.</li>
            )}
            {recurring.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[15px]">
                <span className="text-[var(--color-text)]">{e.category}</span>
                <span className="font-mono text-[var(--color-text-mid)]">{fmt(e.amount)}/mo</span>
                <span className="w-full text-[13px] text-[var(--color-text-dim)]">{e.date.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface2)] p-4">
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">
            Recent activity ({oneOff.length} one-off in full list)
          </h2>
          <ul className="mt-3 divide-y divide-[var(--color-border)]">
            {rows.length === 0 && (
              <li className="py-2 text-[15px] text-[var(--color-text-mid)]">No expense entries yet.</li>
            )}
            {rows.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[15px]">
                <span className="text-[var(--color-text)]">{e.category}</span>
                <span className="font-mono text-[var(--negative)]">−{fmt(e.amount)}</span>
                <span className="w-full text-[13px] text-[var(--color-text-dim)]">
                  {e.date.slice(0, 10)}
                  {e.recurring ? ' · recurring' : ''}
                  {e.notes ? ` · ${e.notes}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageTransition>
  )
}
