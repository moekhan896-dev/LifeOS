'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import { BUSINESSES } from '@/lib/constants'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'

interface Connection {
  from: string
  to: string
  label: string
  active: boolean
  recommendation?: string
}

const CONNECTIONS: Connection[] = [
  { from: 'plumbing', to: 'agency', label: 'Same Detroit audience', active: true },
  { from: 'madison', to: 'moggley', label: 'Skincare synergy', active: true },
  { from: 'agency', to: 'brand', label: 'Knowledge transfer to coaching', active: false, recommendation: 'Package your SEO + GMB playbook into a coaching offer. You already have proof of results from 6 clients and 9 GMB profiles. Start with a $3K cohort.' },
  { from: 'brand', to: 'agency', label: 'Distribution for everything', active: false, recommendation: 'Your personal brand (60K+ combined followers across dormant pages) is an untapped distribution channel. Reactivate Quattro Labs IG with behind-the-scenes business content.' },
  { from: 'brand', to: 'plumbing', label: 'Content drives leads', active: false, recommendation: 'Post plumbing content on personal brand to drive local leads. Day-in-the-life plumber content performs well on TikTok.' },
  { from: 'madison', to: 'brand', label: 'Cross-audience growth', active: false, recommendation: 'Madison Clark audience (16K) overlaps with personal brand potential audience. Collaborate on content to cross-pollinate followers.' },
  { from: 'moggley', to: 'agency', label: 'Tech credibility', active: false, recommendation: 'Building a tech product (Moggley) adds credibility to your agency. Mention it in pitches to show you build, not just consult.' },
  { from: 'airbnb', to: 'brand', label: 'Lifestyle content', active: false, recommendation: 'Use FL property as content backdrop. "I own a property in FL at 24" is compelling personal brand content.' },
]

// Node positions for SVG diagram (percentage-based)
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  agency: { x: 50, y: 15 },
  plumbing: { x: 15, y: 40 },
  madison: { x: 85, y: 40 },
  moggley: { x: 75, y: 75 },
  brand: { x: 50, y: 55 },
  airbnb: { x: 25, y: 75 },
}

export default function EcosystemPage() {
  const [selected, setSelected] = useState<Connection | null>(null)

  const activeCount = CONNECTIONS.filter((c) => c.active).length
  const missingCount = CONNECTIONS.filter((c) => !c.active).length

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 pb-20">
        <StaggerItem>
          <h1 className="text-2xl font-bold text-[var(--text)]">
            Business Ecosystem
          </h1>
        </StaggerItem>

        <StaggerItem>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[var(--accent)] rounded" />
              <span className="text-[var(--text-dim)]">Active ({activeCount})</span>
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 border-t border-dashed border-[var(--rose)]" />
              <span className="text-[var(--text-dim)]">Missing ({missingCount})</span>
            </span>
          </div>
        </StaggerItem>

        {/* SVG Diagram */}
        <StaggerItem>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
            <svg viewBox="0 0 400 320" className="w-full h-auto" style={{ maxHeight: '400px' }}>
              {/* Connections */}
              {CONNECTIONS.map((conn, i) => {
                const fromPos = NODE_POSITIONS[conn.from]
                const toPos = NODE_POSITIONS[conn.to]
                if (!fromPos || !toPos) return null
                const x1 = fromPos.x * 4
                const y1 = fromPos.y * 3.2
                const x2 = toPos.x * 4
                const y2 = toPos.y * 3.2
                return (
                  <line
                    key={i}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke={conn.active ? 'var(--accent)' : 'var(--rose)'}
                    strokeWidth={conn.active ? 2 : 1.5}
                    strokeDasharray={conn.active ? '0' : '6 4'}
                    opacity={0.6}
                    className="cursor-pointer hover:opacity-100"
                    onClick={() => {
                      if (!conn.active) {
                        setSelected(conn)
                        toast('Viewing recommendation', { description: conn.label })
                      }
                    }}
                  />
                )
              })}
              {/* Nodes */}
              {BUSINESSES.map((biz) => {
                const pos = NODE_POSITIONS[biz.id]
                if (!pos) return null
                const cx = pos.x * 4
                const cy = pos.y * 3.2
                return (
                  <g key={biz.id}>
                    <circle cx={cx} cy={cy} r={22} fill={biz.color} opacity={0.15} />
                    <circle cx={cx} cy={cy} r={16} fill={biz.color} opacity={0.3} />
                    <circle cx={cx} cy={cy} r={10} fill={biz.color} />
                    <text x={cx} y={cy + 28} textAnchor="middle" fill="var(--text)" fontSize="9" fontWeight="600">
                      {biz.name.split('(')[0].split(' ').slice(0, 2).join(' ')}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </StaggerItem>

        {/* Recommendation panel */}
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-lg border border-[var(--rose)]/30 bg-[var(--rose)]/5 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="label text-[10px] tracking-widest text-[var(--rose)]">MISSING CONNECTION</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelected(null)}
                className="text-xs text-[var(--text-dim)] hover:text-[var(--text)]"
              >
                Close
              </motion.button>
            </div>
            <p className="text-sm font-semibold text-[var(--text)]">
              {BUSINESSES.find((b) => b.id === selected.from)?.name} &rarr; {BUSINESSES.find((b) => b.id === selected.to)?.name}
            </p>
            <p className="text-xs text-[var(--text-dim)] mt-1">{selected.label}</p>
            {selected.recommendation && (
              <p className="mt-2 text-sm text-[var(--text)] leading-relaxed">{selected.recommendation}</p>
            )}
          </motion.div>
        )}

        {/* Connections list */}
        <StaggerItem>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
            <span className="label text-[10px] tracking-widest text-[var(--text-dim)]">ALL CONNECTIONS</span>
            <div className="mt-3 space-y-2">
              {CONNECTIONS.map((conn, i) => {
                const fromBiz = BUSINESSES.find((b) => b.id === conn.from)
                const toBiz = BUSINESSES.find((b) => b.id === conn.to)
                return (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer ${
                      conn.active ? 'border-[var(--accent)]/20 bg-[var(--accent)]/5' : 'border-[var(--rose)]/20 bg-[var(--rose)]/5'
                    }`}
                    onClick={() => {
                      if (!conn.active) {
                        setSelected(conn)
                        toast('Viewing recommendation', { description: conn.label })
                      }
                    }}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: fromBiz?.color }} />
                    <span className="text-xs text-[var(--text-dim)]">&rarr;</span>
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: toBiz?.color }} />
                    <span className="text-sm text-[var(--text)] flex-1">{conn.label}</span>
                    <span className={`text-[10px] font-semibold ${conn.active ? 'text-[var(--accent)]' : 'text-[var(--rose)]'}`}>
                      {conn.active ? 'ACTIVE' : 'MISSING'}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </StaggerItem>
      </StaggerContainer>
    </PageTransition>
  )
}
