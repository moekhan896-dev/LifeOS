'use client'

import { motion } from 'framer-motion'
import { toast } from 'sonner'
import Link from 'next/link'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'

const STATUS_LABELS: Record<string, string> = { active_healthy: 'Active', active_slow: 'Slow', active_prerevenue: 'Pre-Revenue', dormant: 'Dormant', backburner: 'Backburner', idea: 'Idea' }

const MONETIZATION = [
  { channel: 'Brand Deals', status: 'Not started', statusColor: 'bg-[var(--text-dim)]/15 text-[var(--text-dim)]' },
  { channel: 'Moggley Promotion', status: 'Planned', statusColor: 'bg-purple-500/15 text-purple-500' },
  { channel: 'Affiliate Links', status: 'Not started', statusColor: 'bg-[var(--text-dim)]/15 text-[var(--text-dim)]' },
  { channel: 'Shoutouts', status: 'Not started', statusColor: 'bg-[var(--text-dim)]/15 text-[var(--text-dim)]' },
  { channel: 'Digital Products', status: 'Idea', statusColor: 'bg-[var(--text-dim)]/15 text-[var(--text-dim)]' },
]

const CONTENT_IDEAS = [
  'Day in the life with Moggley',
  'Get ready with me (GRWM)',
  'What I eat in a day',
  'Outfit of the day hauls',
  'Trending audio remixes',
  'Behind the scenes / bloopers',
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function MadisonClarkPage() {
  const { businesses } = useStore()
  const biz = businesses.find(b => b.type === 'content' || b.name.toLowerCase().includes('madison'))

  if (!biz) return (
    <PageTransition><div className="p-4 md:p-7 max-w-[960px] mx-auto"><p className="text-[var(--text-dim)]">No Madison Clark business found. Add businesses in Settings or re-run onboarding.</p></div></PageTransition>
  )

  return (
    <PageTransition>
      <div className="p-4 md:p-7 max-w-[960px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold tracking-tight text-[var(--text)]">{biz.name.toUpperCase()}</h1>
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-purple-500 px-2.5 py-0.5 rounded-full bg-purple-500/15">
              {STATUS_LABELS[biz.status] || biz.status}
            </span>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/ai?business=madison" className="text-[13px] bg-[var(--surface2)] border border-[var(--border)] rounded-[8px] px-3 py-1.5 hover:bg-[var(--surface)] transition-colors">
              AI Context
            </Link>
          </motion.div>
        </div>

        {/* Stats - Sticky */}
        <div className="sticky top-0 z-10 glass rounded-[16px] p-3 mb-5">
          <StaggerContainer className="grid grid-cols-2 gap-2">
            <StaggerItem>
              <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3">
                <p className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-1">Followers</p>
                <p className="data text-[28px] font-bold text-[var(--text)]">16K</p>
              </motion.div>
            </StaggerItem>
            <StaggerItem>
              <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3">
                <p className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-1">Total Views</p>
                <p className="data text-[28px] font-bold text-[var(--text)]">100M+</p>
              </motion.div>
            </StaggerItem>
          </StaggerContainer>
        </div>

        <StaggerContainer>
          {/* Follower Tracking */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3 mb-5">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-2">Follower Tracking</h2>
              <p className="text-[14px] text-[var(--text-mid)]">Connect Instagram API to track daily follower growth and engagement rates.</p>
            </motion.div>
          </StaggerItem>

          {/* Posting Calendar */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3 mb-5">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-3">Posting Calendar (2x/day)</h2>
              <div className="grid grid-cols-7 gap-1.5">
                {DAYS.map((day) => (
                  <div key={day} className="text-center">
                    <p className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-2">{day}</p>
                    <div className="flex flex-col gap-1.5">
                      <motion.div whileHover={{ scale: 1.08 }} className="h-8 bg-[var(--surface2)] rounded-[8px] border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--text-dim)] cursor-pointer">AM</motion.div>
                      <motion.div whileHover={{ scale: 1.08 }} className="h-8 bg-[var(--surface2)] rounded-[8px] border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--text-dim)] cursor-pointer">PM</motion.div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </StaggerItem>

          {/* Monetization Pipeline */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3 mb-5">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-3">Monetization Pipeline</h2>
              <div className="flex flex-col gap-1.5">
                {MONETIZATION.map((m) => (
                  <motion.div key={m.channel} whileHover={{ x: 2 }} className="flex items-center justify-between bg-[var(--surface2)] rounded-[12px] px-3 py-2">
                    <span className="text-[14px] text-[var(--text-mid)]">{m.channel}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${m.statusColor}`}>{m.status}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </StaggerItem>

          {/* Content Ideas */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3 mb-5">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-3">Content Ideas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {CONTENT_IDEAS.map((idea) => (
                  <motion.div
                    key={idea}
                    whileHover={{ scale: 1.02, x: 2 }}
                    onClick={() => toast.success(`"${idea}" copied to clipboard`)}
                    className="flex items-center gap-2 bg-[var(--surface2)] rounded-[12px] px-3 py-2 cursor-pointer"
                  >
                    <span className="text-[14px]">💡</span>
                    <span className="text-[14px] text-[var(--text-mid)]">{idea}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </StaggerItem>

          {/* Synergy Card */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="bg-purple-500/10 border border-purple-500/20 rounded-[16px] p-3 mb-5">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-purple-400 mb-2">Synergy: Moggley</h2>
              <p className="text-[14px] text-[var(--text-mid)]">Promote Moggley app = 300-500 installs at $0 CAC</p>
              <p className="text-[12px] text-[var(--text-mid)] mt-1">A single story + pinned post could drive significant organic installs with zero marketing spend.</p>
            </motion.div>
          </StaggerItem>

          {/* VA Cost Card */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-2">VA Opportunity</h2>
              <p className="text-[14px] text-[var(--text-mid)]">Filipino VA: $500-800/mo</p>
              <p className="text-[12px] text-[var(--text-mid)] mt-1">Could handle content creation, scheduling, DM replies, and engagement. Free up Madison for filming only.</p>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
