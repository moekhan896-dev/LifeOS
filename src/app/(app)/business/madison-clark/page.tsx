'use client'

import Link from 'next/link'
import { BUSINESSES } from '@/lib/constants'

const biz = BUSINESSES.find((b) => b.id === 'madison')!

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
  return (
    <div className="p-6 md:p-10 max-w-[960px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-in">
        <div className="flex items-center gap-3">
          <h1 className="text-[22px] font-bold tracking-tight text-[var(--text)]">{biz.name.toUpperCase()}</h1>
          <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-500">
            {biz.statusLabel}
          </span>
        </div>
        <Link href="/ai?business=madison" className="text-[13px] bg-[var(--surface2)] border border-[var(--border)] rounded-[10px] px-3 py-1.5 hover:bg-[var(--surface)] transition-colors">
          AI Context
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-in" style={{ animationDelay: '50ms' }}>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
          <p className="label mb-1">Followers</p>
          <p className="data text-[22px] font-bold text-[var(--text)]">16K</p>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
          <p className="label mb-1">Total Views</p>
          <p className="data text-[22px] font-bold text-[var(--text)]">100M+</p>
        </div>
      </div>

      {/* Follower Tracking */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 mb-6 animate-in" style={{ animationDelay: '100ms' }}>
        <h2 className="text-[15px] font-semibold text-[var(--text)] mb-2">Follower Tracking</h2>
        <p className="text-[13px] text-[var(--text-dim)]">Connect Instagram API to track daily follower growth and engagement rates.</p>
      </div>

      {/* Posting Calendar */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 mb-6 animate-in" style={{ animationDelay: '150ms' }}>
        <h2 className="text-[15px] font-semibold text-[var(--text)] mb-3">Posting Calendar (2x/day)</h2>
        <div className="grid grid-cols-7 gap-2">
          {DAYS.map((day) => (
            <div key={day} className="text-center">
              <p className="label text-[11px] mb-2">{day}</p>
              <div className="flex flex-col gap-1.5">
                <div className="h-8 bg-[var(--surface2)] rounded-lg border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--text-dim)]">AM</div>
                <div className="h-8 bg-[var(--surface2)] rounded-lg border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--text-dim)]">PM</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monetization Pipeline */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 mb-6 animate-in" style={{ animationDelay: '200ms' }}>
        <h2 className="text-[15px] font-semibold text-[var(--text)] mb-3">Monetization Pipeline</h2>
        <div className="flex flex-col gap-2">
          {MONETIZATION.map((m) => (
            <div key={m.channel} className="flex items-center justify-between bg-[var(--surface2)] rounded-lg px-3 py-2">
              <span className="text-[13px] text-[var(--text)]">{m.channel}</span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${m.statusColor}`}>{m.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content Ideas */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 mb-6 animate-in" style={{ animationDelay: '250ms' }}>
        <h2 className="text-[15px] font-semibold text-[var(--text)] mb-3">Content Ideas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {CONTENT_IDEAS.map((idea) => (
            <div key={idea} className="flex items-center gap-2 bg-[var(--surface2)] rounded-lg px-3 py-2">
              <span className="text-[14px]">💡</span>
              <span className="text-[13px] text-[var(--text)]">{idea}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Synergy Card */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-[10px] p-4 mb-6 animate-in" style={{ animationDelay: '300ms' }}>
        <h2 className="text-[15px] font-semibold text-purple-400 mb-2">Synergy: Moggley</h2>
        <p className="text-[14px] text-[var(--text)]">Promote Moggley app = 300-500 installs at $0 CAC</p>
        <p className="text-[12px] text-[var(--text-mid)] mt-1">A single story + pinned post could drive significant organic installs with zero marketing spend.</p>
      </div>

      {/* VA Cost Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 animate-in" style={{ animationDelay: '350ms' }}>
        <h2 className="text-[15px] font-semibold text-[var(--text)] mb-2">VA Opportunity</h2>
        <p className="text-[14px] text-[var(--text)]">Filipino VA: $500-800/mo</p>
        <p className="text-[12px] text-[var(--text-mid)] mt-1">Could handle content creation, scheduling, DM replies, and engagement. Free up Madison for filming only.</p>
      </div>
    </div>
  )
}
