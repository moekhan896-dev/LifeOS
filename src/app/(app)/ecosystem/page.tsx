'use client'

import { useMemo, useState } from 'react'
import { useStore, isArchived } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'
import { buildEcosystemEdges } from '@/lib/ecosystem-graph'

export default function EcosystemPage() {
  const { businesses, clients, anthropicKey } = useStore()
  const activeBusinesses = useMemo(
    () => businesses.filter((b) => !isArchived(b)),
    [businesses]
  )
  const edges = useMemo(() => buildEcosystemEdges(activeBusinesses, clients), [activeBusinesses, clients])

  const positions = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {}
    const n = activeBusinesses.length
    activeBusinesses.forEach((b, i) => {
      const angle = (i / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2
      map[b.id] = { x: 50 + 38 * Math.cos(angle), y: 50 + 38 * Math.sin(angle) }
    })
    return map
  }, [activeBusinesses])

  const [sel, setSel] = useState<string | null>(null)

  if (activeBusinesses.length < 2) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-lg space-y-4 pb-20">
          <h1 className="text-[22px] font-bold text-[var(--text-primary)]">Ecosystem map</h1>
          <p className="text-[17px] text-[var(--text-secondary)]">
            Add at least two businesses to see how they connect (shared tools, types, or client names).
          </p>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <StaggerContainer className="space-y-4 pb-20">
        <StaggerItem>
          <h1 className="text-[22px] font-bold text-[var(--text-primary)]">Ecosystem map</h1>
          <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
            Connections are derived from your data — no sample companies.
          </p>
        </StaggerItem>

        <StaggerItem>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
            <svg viewBox="0 0 100 100" className="h-auto w-full" style={{ maxHeight: 420 }}>
              {edges.map((e, i) => {
                const a = positions[e.fromId]
                const b = positions[e.toId]
                if (!a || !b) return null
                return (
                  <line
                    key={`${e.fromId}-${e.toId}-${i}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="rgba(10,132,255,0.35)"
                    strokeWidth={0.4}
                  />
                )
              })}
              {activeBusinesses.map((b) => {
                const p = positions[b.id]
                if (!p) return null
                const selected = sel === b.id
                return (
                  <g key={b.id} className="cursor-pointer" onClick={() => setSel(selected ? null : b.id)}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={selected ? 6 : 5}
                      fill={b.color || 'var(--accent)'}
                      opacity={0.9}
                    />
                    <text
                      x={p.x}
                      y={p.y + 8}
                      textAnchor="middle"
                      fill="var(--text-secondary)"
                      fontSize="3"
                      className="pointer-events-none"
                    >
                      {b.name.slice(0, 14)}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </StaggerItem>

        <StaggerItem>
          <div className="space-y-2">
            <p className="text-[13px] font-semibold text-[var(--text-secondary)]">Connections</p>
            {edges.length === 0 ? (
              <p className="text-[15px] text-[var(--text-tertiary)]">
                No automatic links yet. Add overlapping tools or client names across businesses.
              </p>
            ) : (
              <ul className="space-y-2">
                {edges.map((e, i) => {
                  const fa = activeBusinesses.find((b) => b.id === e.fromId)?.name
                  const fb = activeBusinesses.find((b) => b.id === e.toId)?.name
                  return (
                    <li key={i} className="text-[15px] text-[var(--text-secondary)]">
                      <span className="text-[var(--text-primary)]">{fa}</span> ↔{' '}
                      <span className="text-[var(--text-primary)]">{fb}</span> — {e.label}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </StaggerItem>

        {anthropicKey.trim() ? (
          <StaggerItem>
            <p className="text-[13px] text-[var(--text-tertiary)]">
              AI synergy narratives can be generated from the AI Partner using your live context.
            </p>
          </StaggerItem>
        ) : null}
      </StaggerContainer>
    </PageTransition>
  )
}
