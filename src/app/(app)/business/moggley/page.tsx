'use client'

import { BUSINESSES } from '@/lib/constants'

const biz = BUSINESSES.find((b) => b.id === 'moggley')!

const DISTRIBUTION = [
  { channel: 'Madison Clark Promotion', status: 'Planned', note: '300-500 installs at $0 CAC' },
  { channel: 'App Store Optimization', status: 'Not started', note: 'Keywords, screenshots, description' },
  { channel: 'TikTok Organic', status: 'Idea', note: 'Pet content viral potential' },
  { channel: 'Instagram Reels', status: 'Idea', note: 'Cute pet clips using the app' },
  { channel: 'Pet Influencer Outreach', status: 'Idea', note: 'Micro-influencers 5K-50K followers' },
]

export default function MoggleyPage() {
  return (
    <div className="p-6 md:p-10 max-w-[960px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 animate-in">
        <h1 className="text-[22px] font-bold tracking-tight text-[var(--text)]">{biz.name.toUpperCase()}</h1>
        <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-500">
          {biz.statusLabel}
        </span>
      </div>

      {/* App Metrics Placeholder */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-in" style={{ animationDelay: '50ms' }}>
        {[
          { label: 'Downloads', value: '—' },
          { label: 'DAU', value: '—' },
          { label: 'Retention (D7)', value: '—' },
        ].map((m) => (
          <div key={m.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
            <p className="label mb-1">{m.label}</p>
            <p className="data text-[22px] font-bold text-[var(--text)]">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Distribution Strategy */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 mb-6 animate-in" style={{ animationDelay: '100ms' }}>
        <h2 className="text-[15px] font-semibold text-[var(--text)] mb-3">Distribution Strategy</h2>
        <div className="flex flex-col gap-2">
          {DISTRIBUTION.map((d) => (
            <div key={d.channel} className="bg-[var(--surface2)] rounded-lg px-3 py-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-medium text-[var(--text)]">{d.channel}</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--text-dim)]/15 text-[var(--text-dim)]">{d.status}</span>
              </div>
              <p className="text-[12px] text-[var(--text-mid)]">{d.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Madison Clark Synergy */}
      <div className="bg-purple-500/10 border border-purple-500/20 rounded-[10px] p-4 mb-6 animate-in" style={{ animationDelay: '150ms' }}>
        <h2 className="text-[15px] font-semibold text-purple-400 mb-2">Madison Clark Synergy</h2>
        <p className="text-[14px] text-[var(--text)]">16K followers, 100M+ views = free distribution channel</p>
        <p className="text-[12px] text-[var(--text-mid)] mt-1">Soft launch via story mention, then pinned reel demo. Target: 300-500 organic installs with zero ad spend.</p>
      </div>

      {/* App Metrics Placeholder */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 animate-in" style={{ animationDelay: '200ms' }}>
        <h2 className="text-[15px] font-semibold text-[var(--text)] mb-2">App Metrics</h2>
        <p className="text-[13px] text-[var(--text-dim)]">Connect analytics (Firebase / Mixpanel) to track installs, sessions, retention, and revenue events.</p>
      </div>
    </div>
  )
}
