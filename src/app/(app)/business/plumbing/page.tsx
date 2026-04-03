'use client'

import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import { GMB_PROFILES, BUSINESSES, DRIVER_STATUS_COLORS } from '@/lib/constants'
import Link from 'next/link'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'

const biz = BUSINESSES.find((b) => b.id === 'plumbing')!

const STATUS_COLORS: Record<string, string> = {
  strong: 'bg-[var(--accent)]/15 text-[var(--accent)]',
  medium: 'bg-amber-500/15 text-amber-500',
  new: 'bg-[var(--text-dim)]/15 text-[var(--text-dim)]',
}

const LEASE_CHECKLIST = [
  { text: 'Tour spaces Monday', done: false },
  { text: 'Sign lease', done: false },
  { text: 'Update GMB addresses', done: false },
  { text: 'Wait for ranking boost', done: false },
]

const PLUMBING_DRIVERS = [
  { name: 'Office Lease + GMB Address Change', status: 'PLAN' },
  { name: 'Review Request System', status: 'IDEA' },
  { name: 'Yard Signs in Service Areas', status: 'IDEA' },
  { name: 'Quo Call Tracking Integration', status: 'IDEA' },
  { name: 'Google Guarantee Badge', status: 'NEVER TRIED' },
]

const currentCalls = 1.5
const targetCalls = 4.5

export default function PlumbingPage() {
  const { drivers } = useStore()
  const storeDrivers = drivers.filter((d) => d.businessId === 'plumbing')
  const displayDrivers = storeDrivers.length > 0 ? storeDrivers : null

  const totalReviews = GMB_PROFILES.reduce((s, p) => s + p.reviews, 0)
  const totalCalls = GMB_PROFILES.reduce((s, p) => s + p.calls, 0)

  return (
    <PageTransition>
      <div className="p-4 md:p-7 max-w-[960px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold tracking-tight text-[var(--text)]">{biz.name.toUpperCase()}</h1>
            <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500">
              {biz.statusLabel}
            </span>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/ai?business=plumbing" className="text-[13px] bg-[var(--surface2)] border border-[var(--border)] rounded-[10px] px-3 py-1.5 hover:bg-[var(--surface)] transition-colors">
              AI Context
            </Link>
          </motion.div>
        </div>

        {/* Revenue + Stats - Sticky */}
        <div className="sticky top-0 z-10 glass rounded-[12px] p-3 mb-5">
          <StaggerContainer className="grid grid-cols-3 gap-2">
            <StaggerItem>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3">
                <p className="label mb-1">Revenue</p>
                <p className="data text-[22px] font-bold text-[var(--text)]">~$18K</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3">
                <p className="label mb-1">Total Reviews</p>
                <p className="data text-[22px] font-bold text-[var(--text)]">{totalReviews}</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3">
                <p className="label mb-1">Calls/mo</p>
                <p className="data text-[22px] font-bold text-[var(--text)]">{totalCalls}</p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>

        <StaggerContainer>
          {/* GMB Profiles */}
          <StaggerItem>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3 mb-5">
              <h2 className="text-[15px] font-semibold text-[var(--text)] mb-3">GMB Profiles ({GMB_PROFILES.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {GMB_PROFILES.map((p) => (
                  <motion.div key={p.city} whileHover={{ scale: 1.02, y: -1 }} className="bg-[var(--surface2)] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[14px] font-semibold text-[var(--text)]">{p.city}</p>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[12px]">
                      <div><p className="label">Reviews</p><p className="data text-[var(--text)]">{p.reviews}</p></div>
                      <div><p className="label">Calls/mo</p><p className="data text-[var(--text)]">{p.calls}</p></div>
                      <div><p className="label">Rank</p><p className="data text-[var(--text)]">{p.rank}</p></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </StaggerItem>

          {/* Capacity Tracker */}
          <StaggerItem>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3 mb-5">
              <h2 className="text-[15px] font-semibold text-[var(--text)] mb-3">Capacity Tracker</h2>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-[var(--text-mid)]">Current: 1-2 calls/day</span>
                <span className="text-[13px] text-[var(--text-mid)]">Target: 4-5 calls/day</span>
              </div>
              <div className="h-3 bg-[var(--surface2)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentCalls / targetCalls) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="h-full rounded-full bg-amber-500"
                />
              </div>
              <p className="text-[12px] text-[var(--text-dim)] mt-1">{Math.round((currentCalls / targetCalls) * 100)}% of target capacity</p>
            </div>
          </StaggerItem>

          {/* Office Lease Progress */}
          <StaggerItem>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3 mb-5">
              <h2 className="text-[15px] font-semibold text-[var(--text)] mb-3">Office Lease Progress</h2>
              <div className="flex flex-col gap-1.5">
                {LEASE_CHECKLIST.map((item, i) => (
                  <motion.div key={i} whileHover={{ x: 2 }} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${item.done ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)]'}`}>
                      {item.done && '✓'}
                    </div>
                    <span className={`text-[13px] ${item.done ? 'text-[var(--text-dim)] line-through' : 'text-[var(--text)]'}`}>{item.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </StaggerItem>

          {/* Revenue Drivers */}
          <StaggerItem>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3 mb-5">
              <h2 className="text-[15px] font-semibold text-[var(--text)] mb-3">Revenue Drivers</h2>
              <div className="flex flex-col gap-1.5">
                {(displayDrivers || PLUMBING_DRIVERS).map((d, i) => (
                  <motion.div key={i} whileHover={{ x: 2 }} className="flex items-center justify-between bg-[var(--surface2)] rounded-lg px-3 py-2">
                    <span className="text-[13px] text-[var(--text)]">{d.name}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${DRIVER_STATUS_COLORS[d.status] || 'bg-[var(--surface)] text-[var(--text-dim)]'}`}>{d.status}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </StaggerItem>

          {/* Call Log Placeholder */}
          <StaggerItem>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3 mb-5">
              <h2 className="text-[15px] font-semibold text-[var(--text)] mb-2">Call Log</h2>
              <p className="text-[13px] text-[var(--text-dim)]">Connect Quo to see inbound calls, missed calls, and call duration by GMB profile.</p>
            </div>
          </StaggerItem>

          {/* Yard Sign Tracker */}
          <StaggerItem>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3">
              <h2 className="text-[15px] font-semibold text-[var(--text)] mb-2">Yard Sign Tracker</h2>
              <p className="text-[13px] text-[var(--text-dim)]">Track yard sign placements, locations, and call attribution.</p>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
