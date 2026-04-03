'use client'

import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { BUSINESSES, AUDIENCE_ASSETS } from '@/lib/constants'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'

const biz = BUSINESSES.find((b) => b.id === 'brand')!

const SOCIAL_ACCOUNTS = [
  { name: 'Personal IG', followers: '30K', status: 'Dormant', daysSince: '540+ days' },
  { name: 'TikTok', followers: '1.5K', status: 'Dormant', daysSince: '30+ days' },
]

const FUNNEL_STEPS = [
  { step: 'Ad Account', status: 'Inactive', done: false },
  { step: 'VSL (Video Sales Letter)', status: 'Not recorded', done: false },
  { step: 'Landing Page', status: 'Needs update', done: false },
  { step: 'Offer Price', status: '$997 - $2,997 range', done: false },
  { step: 'Email Sequence', status: 'Not built', done: false },
  { step: 'Booking Calendar', status: 'Not set up', done: false },
]

export default function PersonalBrandPage() {
  return (
    <PageTransition>
      <div className="p-4 md:p-7 max-w-[960px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-[22px] font-bold tracking-tight text-[var(--text)]">PERSONAL BRAND / COACHING</h1>
          <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500">
            {biz.statusLabel}
          </span>
        </div>

        <StaggerContainer>
          {/* Social Accounts */}
          <StaggerItem>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3 mb-5">
              <h2 className="text-[15px] font-semibold text-[var(--text)] mb-3">Social Accounts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {SOCIAL_ACCOUNTS.map((a) => (
                  <motion.div key={a.name} whileHover={{ scale: 1.02, y: -1 }} className="bg-[var(--surface2)] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[14px] font-semibold text-[var(--text)]">{a.name}</p>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500">{a.status}</span>
                    </div>
                    <div className="flex gap-4 text-[12px]">
                      <div><p className="label">Followers</p><p className="data text-[var(--text)]">{a.followers}</p></div>
                      <div><p className="label">Last post</p><p className="data text-[var(--rose)]">{a.daysSince}</p></div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </StaggerItem>

          {/* Coaching Program Resurrection */}
          <StaggerItem>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3 mb-5">
              <h2 className="text-[15px] font-semibold text-[var(--text)] mb-3">Coaching Program Resurrection Tracker</h2>
              <div className="flex flex-col gap-1.5">
                {FUNNEL_STEPS.map((f) => (
                  <motion.div key={f.step} whileHover={{ x: 2 }} className="flex items-center justify-between bg-[var(--surface2)] rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${f.done ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)]'}`}>
                        {f.done && '✓'}
                      </div>
                      <span className="text-[13px] text-[var(--text)]">{f.step}</span>
                    </div>
                    <span className="text-[12px] text-[var(--text-dim)]">{f.status}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </StaggerItem>

          {/* remoteplumbingprofits.com */}
          <StaggerItem>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3 mb-5">
              <h2 className="text-[15px] font-semibold text-[var(--text)] mb-2">remoteplumbingprofits.com</h2>
              <p className="text-[13px] text-[var(--text-dim)]">Domain active. Landing page needs rebuild. Previously used for plumbing SEO coaching offer.</p>
            </div>
          </StaggerItem>

          {/* Camera Confidence */}
          <StaggerItem>
            <motion.div whileHover={{ scale: 1.01 }} className="bg-amber-500/10 border border-amber-500/20 rounded-[10px] p-3">
              <h2 className="text-[15px] font-semibold text-amber-400 mb-2">Camera Confidence Note</h2>
              <p className="text-[13px] text-[var(--text)]">Tied to gym consistency. When gym streak is 5+ days, confidence for recording VSLs and content increases significantly.</p>
              <p className="text-[12px] text-[var(--text-mid)] mt-1">Priority: Get gym streak going before attempting to record new coaching content.</p>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
