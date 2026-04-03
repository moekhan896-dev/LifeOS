'use client'

import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'

const STATUS_LABELS: Record<string, string> = { active_healthy: 'Active', active_slow: 'Slow', active_prerevenue: 'Pre-Revenue', dormant: 'Dormant', backburner: 'Backburner', idea: 'Idea' }

const DISTRIBUTION = [
  { channel: 'Madison Clark Promotion', status: 'Planned', note: '300-500 installs at $0 CAC' },
  { channel: 'App Store Optimization', status: 'Not started', note: 'Keywords, screenshots, description' },
  { channel: 'TikTok Organic', status: 'Idea', note: 'Pet content viral potential' },
  { channel: 'Instagram Reels', status: 'Idea', note: 'Cute pet clips using the app' },
  { channel: 'Pet Influencer Outreach', status: 'Idea', note: 'Micro-influencers 5K-50K followers' },
]

export default function MoggleyPage() {
  const { businesses } = useStore()
  const biz = businesses.find(b => b.type === 'app' || b.name.toLowerCase().includes('moggley'))

  if (!biz) return (
    <PageTransition><div className="p-4 md:p-7 max-w-[960px] mx-auto"><p className="text-[var(--text-dim)]">No Moggley business found. Add businesses in Settings or re-run onboarding.</p></div></PageTransition>
  )

  return (
    <PageTransition>
      <div className="p-4 md:p-7 max-w-[960px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-[22px] font-bold tracking-tight text-[var(--text)]">{biz.name.toUpperCase()}</h1>
          <span className="text-[10px] font-mono uppercase tracking-[2px] text-purple-500 px-2.5 py-0.5 rounded-full bg-purple-500/15">
            {STATUS_LABELS[biz.status] || biz.status}
          </span>
        </div>

        {/* App Metrics Placeholder - Sticky */}
        <div className="sticky top-0 z-10 glass rounded-[16px] p-3 mb-5">
          <StaggerContainer className="grid grid-cols-3 gap-2">
            {[
              { label: 'Downloads', value: '—' },
              { label: 'DAU', value: '—' },
              { label: 'Retention (D7)', value: '—' },
            ].map((m) => (
              <StaggerItem key={m.label}>
                <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3">
                  <p className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-1">{m.label}</p>
                  <p className="data text-[28px] font-bold text-[var(--text)]">{m.value}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        <StaggerContainer>
          {/* Distribution Strategy */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3 mb-5">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-3">Distribution Strategy</h2>
              <div className="flex flex-col gap-1.5">
                {DISTRIBUTION.map((d) => (
                  <motion.div key={d.channel} whileHover={{ x: 2 }} className="bg-[var(--surface2)] rounded-[12px] px-3 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[14px] font-medium text-[var(--text-mid)]">{d.channel}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--text-dim)]/15 text-[var(--text-dim)]">{d.status}</span>
                    </div>
                    <p className="text-[12px] text-[var(--text-mid)]">{d.note}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </StaggerItem>

          {/* Madison Clark Synergy */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="bg-purple-500/10 border border-purple-500/20 rounded-[16px] p-3 mb-5">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-purple-400 mb-2">Madison Clark Synergy</h2>
              <p className="text-[14px] text-[var(--text-mid)]">16K followers, 100M+ views = free distribution channel</p>
              <p className="text-[12px] text-[var(--text-mid)] mt-1">Soft launch via story mention, then pinned reel demo. Target: 300-500 organic installs with zero ad spend.</p>
            </motion.div>
          </StaggerItem>

          {/* App Metrics Placeholder */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-2">App Metrics</h2>
              <p className="text-[14px] text-[var(--text-mid)]">Connect analytics (Firebase / Mixpanel) to track installs, sessions, retention, and revenue events.</p>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
