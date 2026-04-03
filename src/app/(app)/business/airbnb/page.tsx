'use client'

import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'

const STATUS_LABELS: Record<string, string> = { active_healthy: 'Active', active_slow: 'Slow', active_prerevenue: 'Pre-Revenue', dormant: 'Dormant', backburner: 'Backburner', idea: 'Idea' }

export default function AirbnbPage() {
  const { businesses } = useStore()
  const biz = businesses.find(b => b.type === 'real_estate' || b.name.toLowerCase().includes('airbnb'))

  if (!biz) return (
    <PageTransition><div className="p-4 md:p-7 max-w-[960px] mx-auto"><p className="text-[var(--text-dim)]">No Airbnb business found. Add businesses in Settings or re-run onboarding.</p></div></PageTransition>
  )

  return (
    <PageTransition>
      <div className="p-4 md:p-7 max-w-[960px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-[22px] font-bold tracking-tight text-[var(--text)]">{biz.name.toUpperCase()}</h1>
          <span className="text-[10px] font-mono uppercase tracking-[2px] text-blue-500 px-2.5 py-0.5 rounded-full bg-blue-500/15">
            {STATUS_LABELS[biz.status] || biz.status}
          </span>
        </div>

        {/* Property Details - Sticky */}
        <div className="sticky top-0 z-10 glass rounded-[16px] p-3 mb-5">
          <StaggerContainer className="grid grid-cols-2 gap-2">
            <StaggerItem>
              <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3">
                <p className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-1">Purchase Price</p>
                <p className="data text-[28px] font-bold text-[var(--text)]">$575K</p>
              </motion.div>
            </StaggerItem>
            <StaggerItem>
              <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3">
                <p className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-1">Mortgage</p>
                <p className="data text-[28px] font-bold text-[var(--text)]">$4,200/mo</p>
              </motion.div>
            </StaggerItem>
          </StaggerContainer>
        </div>

        <StaggerContainer>
          {/* Monthly Revenue */}
          <StaggerItem>
            <div className="grid grid-cols-2 gap-2 mb-5">
              <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3">
                <p className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-1">Gross Revenue</p>
                <p className="data text-[28px] font-bold text-[var(--text)]">$10K/mo</p>
              </motion.div>
              <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3">
                <p className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-1">Net Profit</p>
                <p className="data text-[28px] font-bold text-[var(--accent)]">~$1K/mo</p>
              </motion.div>
            </div>
          </StaggerItem>

          {/* Occupancy Rate */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3 mb-5">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-2">Occupancy Rate</h2>
              <p className="text-[14px] text-[var(--text-mid)]">Connect Airbnb API or manually log monthly occupancy to track seasonal trends.</p>
              <div className="h-3 bg-[var(--surface2)] rounded-full overflow-hidden mt-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 0.6 }}
                  className="h-full rounded-full bg-blue-500"
                />
              </div>
              <p className="text-[12px] text-[var(--text-dim)] mt-1">No data yet</p>
            </motion.div>
          </StaggerItem>

          {/* Monthly Breakdown */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3 mb-5">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-3">Monthly Breakdown</h2>
              <div className="flex flex-col gap-1.5 text-[13px]">
                {[
                  { label: 'Gross Revenue', value: '$10,000', color: 'text-[var(--text)]' },
                  { label: 'Mortgage', value: '-$4,200', color: 'text-[var(--rose)]' },
                  { label: 'Cleaning / Supplies', value: '-$2,000', color: 'text-[var(--rose)]' },
                  { label: 'Utilities / Insurance', value: '-$1,500', color: 'text-[var(--rose)]' },
                  { label: 'Management / Platform Fees', value: '-$1,300', color: 'text-[var(--rose)]' },
                  { label: 'Net Profit', value: '~$1,000', color: 'text-[var(--accent)]' },
                ].map((row) => (
                  <motion.div key={row.label} whileHover={{ x: 2 }} className="flex items-center justify-between bg-[var(--surface2)] rounded-[12px] px-3 py-2">
                    <span className="text-[14px] text-[var(--text-mid)]">{row.label}</span>
                    <span className={`data font-semibold ${row.color}`}>{row.value}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </StaggerItem>

          {/* Property Value */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-2">Property Value Tracker</h2>
              <p className="text-[14px] text-[var(--text-mid)]">Log quarterly Zestimate or appraisal values to track equity growth alongside cash flow.</p>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
