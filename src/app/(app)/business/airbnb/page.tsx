'use client'

import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { BUSINESSES } from '@/lib/constants'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'

const biz = BUSINESSES.find((b) => b.id === 'airbnb')!

export default function AirbnbPage() {
  return (
    <PageTransition>
      <div className="p-4 md:p-7 max-w-[960px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-[22px] font-bold tracking-tight text-[var(--text)]">{biz.name.toUpperCase()}</h1>
          <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-500">
            {biz.statusLabel}
          </span>
        </div>

        {/* Property Details - Sticky */}
        <div className="sticky top-0 z-10 glass rounded-[12px] p-3 mb-5">
          <StaggerContainer className="grid grid-cols-2 gap-2">
            <StaggerItem>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3">
                <p className="label mb-1">Purchase Price</p>
                <p className="data text-[22px] font-bold text-[var(--text)]">$575K</p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3">
                <p className="label mb-1">Mortgage</p>
                <p className="data text-[22px] font-bold text-[var(--text)]">$4,200/mo</p>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>

        <StaggerContainer>
          {/* Monthly Revenue */}
          <StaggerItem>
            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3">
                <p className="label mb-1">Gross Revenue</p>
                <p className="data text-[22px] font-bold text-[var(--text)]">$10K/mo</p>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3">
                <p className="label mb-1">Net Profit</p>
                <p className="data text-[22px] font-bold text-[var(--accent)]">~$1K/mo</p>
              </div>
            </div>
          </StaggerItem>

          {/* Occupancy Rate */}
          <StaggerItem>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3 mb-5">
              <h2 className="text-[15px] font-semibold text-[var(--text)] mb-2">Occupancy Rate</h2>
              <p className="text-[13px] text-[var(--text-dim)]">Connect Airbnb API or manually log monthly occupancy to track seasonal trends.</p>
              <div className="h-3 bg-[var(--surface2)] rounded-full overflow-hidden mt-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 0.6 }}
                  className="h-full rounded-full bg-blue-500"
                />
              </div>
              <p className="text-[12px] text-[var(--text-dim)] mt-1">No data yet</p>
            </div>
          </StaggerItem>

          {/* Monthly Breakdown */}
          <StaggerItem>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3 mb-5">
              <h2 className="text-[15px] font-semibold text-[var(--text)] mb-3">Monthly Breakdown</h2>
              <div className="flex flex-col gap-1.5 text-[13px]">
                {[
                  { label: 'Gross Revenue', value: '$10,000', color: 'text-[var(--text)]' },
                  { label: 'Mortgage', value: '-$4,200', color: 'text-[var(--rose)]' },
                  { label: 'Cleaning / Supplies', value: '-$2,000', color: 'text-[var(--rose)]' },
                  { label: 'Utilities / Insurance', value: '-$1,500', color: 'text-[var(--rose)]' },
                  { label: 'Management / Platform Fees', value: '-$1,300', color: 'text-[var(--rose)]' },
                  { label: 'Net Profit', value: '~$1,000', color: 'text-[var(--accent)]' },
                ].map((row) => (
                  <motion.div key={row.label} whileHover={{ x: 2 }} className="flex items-center justify-between bg-[var(--surface2)] rounded-lg px-3 py-2">
                    <span className="text-[var(--text-mid)]">{row.label}</span>
                    <span className={`data font-semibold ${row.color}`}>{row.value}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </StaggerItem>

          {/* Property Value */}
          <StaggerItem>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3">
              <h2 className="text-[15px] font-semibold text-[var(--text)] mb-2">Property Value Tracker</h2>
              <p className="text-[13px] text-[var(--text-dim)]">Log quarterly Zestimate or appraisal values to track equity growth alongside cash flow.</p>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
