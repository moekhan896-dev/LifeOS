'use client'

import { useState, useEffect } from 'react'
import { useStore, type DriverStatus, type RevenueDriver } from '@/stores/store'
import { DRIVER_STATUSES, DRIVER_STATUS_COLORS } from '@/lib/constants'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

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
  const { businesses, drivers, updateDriverStatus, addDriver } = useStore()
  const [filter, setFilter] = useState<DriverStatus | 'ALL'>('ALL')
  const [newDrivers, setNewDrivers] = useState<Record<string, string>>({})

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
    toast(`Status changed to ${next}`)
  }

  const handleAddDriver = (bizId: string) => {
    const text = newDrivers[bizId]?.trim()
    if (!text) return
    addDriver({ businessId: bizId, category: 'General', name: text, impact: 3, status: 'IDEA' })
    setNewDrivers((p) => ({ ...p, [bizId]: '' }))
    toast('Driver added')
  }

  const filtered = filter === 'ALL' ? allDrivers : allDrivers.filter((d) => d.status === filter)

  return (
    <PageTransition>
      <div className="space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-[var(--text)]">Revenue Drivers</h1>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {(['ALL', ...DRIVER_STATUSES] as const).map((s) => (
            <motion.button
              key={s}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === s
                  ? 'bg-[var(--accent)] text-[var(--bg)]'
                  : 'bg-[var(--surface)] text-[var(--text-dim)] border border-[var(--border)]'
              }`}
            >
              {s}
            </motion.button>
          ))}
        </div>

        {/* Business sections */}
        <StaggerContainer className="space-y-4">
          {businesses.map((biz) => {
            const bizDrivers = filtered.filter((d) => d.businessId === biz.id)
            if (filter !== 'ALL' && bizDrivers.length === 0) return null
            return (
              <StaggerItem key={biz.id}>
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: biz.color }} />
                    <span className="label text-sm font-semibold text-[var(--text)]">{biz.name}</span>
                    <span className="text-xs text-[var(--text-dim)]">({bizDrivers.length})</span>
                  </div>

                  <div className="space-y-2">
                    {bizDrivers.map((d) => (
                      <motion.div
                        key={d.id}
                        whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
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
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => cycleStatus(d.id, d.status)}
                          className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold ${DRIVER_STATUS_COLORS[d.status] || ''}`}
                        >
                          {d.status}
                        </motion.button>
                      </motion.div>
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
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddDriver(biz.id)}
                      className="rounded-[8px] bg-[var(--accent)]/10 px-3 py-2 text-xs font-medium text-[var(--accent)]"
                    >
                      Add
                    </motion.button>
                  </div>
                </div>
              </StaggerItem>
            )
          })}
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
