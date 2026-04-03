'use client'

import { useState, useEffect } from 'react'
import { useStore, type DriverStatus, type RevenueDriver } from '@/stores/store'
import { BUSINESSES, DRIVER_STATUSES, DRIVER_STATUS_COLORS } from '@/lib/constants'

const SEED_DRIVERS: Omit<RevenueDriver, 'id'>[] = [
  { businessId: 'agency', category: 'Acquisition', name: 'Cold email to UMich alumni', impact: 5, status: 'BUILD' },
  { businessId: 'agency', category: 'Acquisition', name: 'LinkedIn outbound DMs', impact: 3, status: 'IDEA' },
  { businessId: 'agency', category: 'Retention', name: 'Monthly client reports', impact: 4, status: 'LIVE' },
  { businessId: 'agency', category: 'Upsell', name: 'Offer paid ads to SEO clients', impact: 4, status: 'PLAN' },
  { businessId: 'plumbing', category: 'Growth', name: 'GMB SEO on all 9 profiles', impact: 5, status: 'BUILD' },
  { businessId: 'plumbing', category: 'Growth', name: 'Google LSA ads', impact: 4, status: 'NEVER TRIED' },
  { businessId: 'plumbing', category: 'Growth', name: 'Thumbtack / Angi leads', impact: 3, status: 'STALE' },
  { businessId: 'plumbing', category: 'Ops', name: 'Hire 2nd plumber', impact: 5, status: 'PLAN' },
  { businessId: 'madison', category: 'Monetize', name: 'Brand deal outreach', impact: 5, status: 'PLAN' },
  { businessId: 'madison', category: 'Growth', name: 'Reels strategy 3x/week', impact: 4, status: 'LIVE' },
  { businessId: 'madison', category: 'Monetize', name: 'Affiliate skincare links', impact: 3, status: 'IDEA' },
  { businessId: 'moggley', category: 'Product', name: 'MVP feature complete', impact: 5, status: 'BUILD' },
  { businessId: 'moggley', category: 'Launch', name: 'Beta launch via Madison story', impact: 4, status: 'PLAN' },
  { businessId: 'brand', category: 'Content', name: 'YouTube: behind the businesses', impact: 4, status: 'IDEA' },
  { businessId: 'brand', category: 'Content', name: 'Twitter/X daily posting', impact: 3, status: 'STALE' },
  { businessId: 'airbnb', category: 'Ops', name: 'Dynamic pricing tool', impact: 2, status: 'LIVE' },
]

export default function RevenueDriversPage() {
  const { drivers, updateDriverStatus, addDriver } = useStore()
  const [filter, setFilter] = useState<DriverStatus | 'ALL'>('ALL')
  const [newDrivers, setNewDrivers] = useState<Record<string, string>>({})
  let ai = 0

  useEffect(() => {
    if (drivers.length === 0) {
      SEED_DRIVERS.forEach((d) => addDriver(d))
    }
  }, [])

  const allDrivers = drivers.length > 0 ? drivers : []

  const cycleStatus = (id: string, current: DriverStatus) => {
    const idx = DRIVER_STATUSES.indexOf(current)
    const next = DRIVER_STATUSES[(idx + 1) % DRIVER_STATUSES.length]
    updateDriverStatus(id, next)
  }

  const handleAddDriver = (bizId: string) => {
    const text = newDrivers[bizId]?.trim()
    if (!text) return
    addDriver({ businessId: bizId, category: 'General', name: text, impact: 3, status: 'IDEA' })
    setNewDrivers((p) => ({ ...p, [bizId]: '' }))
  }

  const filtered = filter === 'ALL' ? allDrivers : allDrivers.filter((d) => d.status === filter)

  return (
    <div className="space-y-6 pb-24">
      <h1 className="animate-in text-2xl font-bold text-[var(--text)]" style={{ animationDelay: `${0.05 * ai++}s` }}>
        Revenue Drivers
      </h1>

      {/* Filter tabs */}
      <div className="animate-in flex flex-wrap gap-2" style={{ animationDelay: `${0.05 * ai++}s` }}>
        {(['ALL', ...DRIVER_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-[var(--accent)] text-[var(--bg)]'
                : 'bg-[var(--surface)] text-[var(--text-dim)] border border-[var(--border)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Business sections */}
      {BUSINESSES.map((biz) => {
        const bizDrivers = filtered.filter((d) => d.businessId === biz.id)
        if (filter !== 'ALL' && bizDrivers.length === 0) return null
        return (
          <div
            key={biz.id}
            className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5"
            style={{ animationDelay: `${0.05 * ai++}s` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full" style={{ background: biz.color }} />
              <span className="label text-sm font-semibold text-[var(--text)]">{biz.name}</span>
              <span className="text-xs text-[var(--text-dim)]">({bizDrivers.length})</span>
            </div>

            <div className="space-y-2">
              {bizDrivers.map((d) => (
                <div
                  key={d.id}
                  className={`flex items-center gap-3 rounded-lg border p-3 ${
                    d.status === 'STALE' ? 'border-[var(--rose)]/50 bg-[var(--rose)]/5' : 'border-[var(--border)] bg-[var(--bg)]'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text)]">{d.name}</p>
                    <p className="text-xs text-[var(--text-dim)]">{d.category}</p>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`w-2 h-2 rounded-full ${
                          n <= d.impact ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => cycleStatus(d.id, d.status)}
                    className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold ${DRIVER_STATUS_COLORS[d.status] || ''}`}
                  >
                    {d.status}
                  </button>
                </div>
              ))}
            </div>

            {/* Add driver input */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Add driver..."
                value={newDrivers[biz.id] || ''}
                onChange={(e) => setNewDrivers((p) => ({ ...p, [biz.id]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDriver(biz.id)}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)]"
              />
              <button
                onClick={() => handleAddDriver(biz.id)}
                className="rounded-lg bg-[var(--accent)]/10 px-3 py-2 text-xs font-medium text-[var(--accent)]"
              >
                Add
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
