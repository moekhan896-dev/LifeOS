'use client'

import Link from 'next/link'
import PageTransition from '@/components/PageTransition'
import { useStore, isArchived, getBusinessHealth } from '@/stores/store'

export default function BusinessesPage() {
  const { businesses, tasks, revenueEntries } = useStore()
  const list = businesses.filter((b) => !isArchived(b))

  return (
    <PageTransition>
      <div className="space-y-6 pb-24">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.2px] text-[var(--color-text)]">Businesses</h1>
          <p className="mt-1 text-[15px] text-[var(--color-text-mid)]">Overview of active businesses — open one for details.</p>
        </div>
        <ul className="space-y-2">
          {list.map((b) => {
            const health = getBusinessHealth(b, tasks, revenueEntries)
            const dot =
              health === 'strong' ? 'bg-[var(--positive)]' : health === 'weak' ? 'bg-[var(--warning)]' : 'bg-[var(--negative)]'
            return (
              <li key={b.id}>
                <Link
                  href={`/business/${b.id}`}
                  className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface2)] px-4 py-3 transition-colors hover:bg-[var(--color-surface)]"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
                  <span className="text-[17px]">{b.icon}</span>
                  <span className="flex-1 text-[17px] font-medium text-[var(--color-text)]">{b.name}</span>
                  <span className="font-mono text-[13px] text-[var(--color-text-dim)]">
                    ${b.monthlyRevenue.toLocaleString()}/mo
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
        {list.length === 0 && (
          <p className="text-[15px] text-[var(--color-text-mid)]">No businesses yet — add one from onboarding or settings.</p>
        )}
      </div>
    </PageTransition>
  )
}
