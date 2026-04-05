'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import PageTransition from '@/components/PageTransition'
import { useStore, getClientNet, isArchived } from '@/stores/store'

type SortKey =
  | 'name'
  | 'business'
  | 'grossMonthly'
  | 'adSpend'
  | 'net'
  | 'relationshipHealth'
  | 'concentration'

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function healthBadge(h?: string) {
  const v = (h || '—').toLowerCase()
  if (v.includes('strong') || v === 'good') return { label: h || 'Strong', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' }
  if (v.includes('weak') || v.includes('risk')) return { label: h || 'At risk', cls: 'bg-rose-500/15 text-rose-400 border-rose-500/25' }
  return { label: h || '—', cls: 'bg-[var(--surface2)] text-[var(--text-mid)] border-[var(--border)]' }
}

export default function ClientsPage() {
  const { clients, businesses } = useStore()
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const rows = useMemo(() => {
    const active = clients.filter((c) => !isArchived(c) && c.active)
    const totalNet = active.reduce((s, c) => s + getClientNet(c), 0)
    return active.map((c) => {
      const biz = businesses.find((b) => b.id === c.businessId && !isArchived(b))
      const net = getClientNet(c)
      return {
        c,
        businessName: biz?.name ?? '—',
        businessColor: biz?.color ?? '#888',
        net,
        concentration: totalNet > 0 ? (net / totalNet) * 100 : 0,
      }
    })
  }, [clients, businesses])

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    const list = [...rows]
    list.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = a.c.name.localeCompare(b.c.name)
          break
        case 'business':
          cmp = a.businessName.localeCompare(b.businessName)
          break
        case 'grossMonthly':
          cmp = a.c.grossMonthly - b.c.grossMonthly
          break
        case 'adSpend':
          cmp = a.c.adSpend - b.c.adSpend
          break
        case 'net':
          cmp = a.net - b.net
          break
        case 'relationshipHealth':
          cmp = (a.c.relationshipHealth || '').localeCompare(b.c.relationshipHealth || '')
          break
        case 'concentration':
          cmp = a.concentration - b.concentration
          break
        default:
          cmp = 0
      }
      return cmp * dir
    })
    return list
  }, [rows, sortKey, sortDir])

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir(k === 'name' || k === 'business' || k === 'relationshipHealth' ? 'asc' : 'desc')
    }
  }

  const th = (k: SortKey, label: string) => (
    <th className="cursor-pointer px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--text-dim)] hover:text-[var(--text-primary)]">
      <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort(k)}>
        {label}
        {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </button>
    </th>
  )

  return (
    <PageTransition>
      <div className="space-y-4 pb-24">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.2px] text-[var(--text-primary)]">Clients</h1>
          <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
            All revenue clients across businesses — concentration vs total net.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
          <table className="w-full min-w-[720px] border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {th('name', 'Client')}
                {th('business', 'Business')}
                {th('grossMonthly', 'Monthly payment')}
                {th('adSpend', 'Ad spend')}
                {th('net', 'Net revenue')}
                {th('relationshipHealth', 'Health')}
                {th('concentration', 'Conc. %')}
              </tr>
            </thead>
            <tbody>
              {sorted.map(({ c, businessName, businessColor, net, concentration }) => {
                const hb = healthBadge(c.relationshipHealth)
                return (
                  <tr key={c.id} className="border-b border-[var(--border)]/60 last:border-0">
                    <td className="px-3 py-2.5 font-medium text-[var(--text-primary)]">{c.name}</td>
                    <td className="px-3 py-2.5">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: businessColor }} />
                        {businessName}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums">{fmt(c.grossMonthly)}</td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-[var(--text-mid)]">{fmt(c.adSpend)}</td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-[var(--positive)]">{fmt(net)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[11px] ${hb.cls}`}>{hb.label}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono tabular-nums text-[var(--text-secondary)]">
                      {concentration.toFixed(1)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <p className="p-8 text-center text-[15px] text-[var(--text-dim)]">No active clients — add clients in business settings or onboarding.</p>
          )}
        </div>

        <Link
          href="/contacts"
          className="inline-block text-[14px] text-[var(--accent)] hover:underline"
        >
          Relationship contacts (CRM) →
        </Link>
      </div>
    </PageTransition>
  )
}
