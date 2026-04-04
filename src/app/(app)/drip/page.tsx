'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore, type DripZone } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const ZONES: { key: DripZone; label: string; subtitle: string; bg: string; border: string; color: string }[] = [
  { key: 'replace', label: 'REPLACE', subtitle: 'Delegate', bg: 'rgba(245,158,11,0.05)', border: 'var(--amber)', color: 'var(--amber)' },
  { key: 'double_down', label: 'DOUBLE DOWN', subtitle: 'Zone of genius', bg: 'rgba(16,185,129,0.05)', border: 'var(--accent)', color: 'var(--accent)' },
  { key: 'eliminate', label: 'ELIMINATE', subtitle: 'Stop this', bg: 'rgba(244,63,94,0.05)', border: 'var(--rose)', color: 'var(--rose)' },
  { key: 'design', label: 'DESIGN', subtitle: 'Build systems', bg: 'rgba(59,130,246,0.05)', border: 'var(--blue)', color: 'var(--blue)' },
]

const ZONE_MAP: Record<DripZone, typeof ZONES[0]> = Object.fromEntries(ZONES.map(z => [z.key, z])) as any

export default function DripPage() {
  const { tasks, updateTask } = useStore()

  const classified = tasks.filter(t => t.drip)
  const unclassified = tasks.filter(t => !t.drip)

  const tasksByZone = (zone: DripZone) => tasks.filter(t => t.drip === zone)

  const classify = (taskId: string, zone: DripZone) => {
    updateTask(taskId, { drip: zone })
    toast.success(`Moved to ${ZONE_MAP[zone].label}`)
  }

  // Stats: hours in eliminate this week (mock based on task count)
  const eliminateCount = tasksByZone('eliminate').length
  const doubleDownCount = tasksByZone('double_down').length

  const hasAnyClassified = classified.length > 0

  return (
    <PageTransition>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1 className="text-[22px] font-bold text-[var(--text)]">DRIP Matrix</h1>
          <p className="text-[13px] text-[var(--text-dim)] mt-1">Classify your tasks by energy and dollar value</p>
        </motion.div>

        {/* Matrix */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.35 }} className="rounded-[16px] border border-[#1e2338] bg-[#0e1018] p-5 space-y-2">
          {/* Axis labels */}
          <div className="text-center text-[11px] text-[var(--text-dim)] font-semibold tracking-wide uppercase">High $</div>

          <div className="flex items-center gap-2">
            <div className="text-[11px] text-[var(--text-dim)] font-semibold writing-mode-vertical [writing-mode:vertical-lr] rotate-180 w-4 text-center tracking-wide uppercase whitespace-nowrap">Draining</div>

            <div className="flex-1 grid grid-cols-2 gap-2 min-h-[300px]">
              {/* Top-left: REPLACE */}
              <QuadrantBox zone={ZONES[0]} tasks={tasksByZone('replace')} />
              {/* Top-right: DOUBLE DOWN */}
              <QuadrantBox zone={ZONES[1]} tasks={tasksByZone('double_down')} />
              {/* Bottom-left: ELIMINATE */}
              <QuadrantBox zone={ZONES[2]} tasks={tasksByZone('eliminate')} />
              {/* Bottom-right: DESIGN */}
              <QuadrantBox zone={ZONES[3]} tasks={tasksByZone('design')} />
            </div>

            <div className="text-[11px] text-[var(--text-dim)] font-semibold [writing-mode:vertical-lr] w-4 text-center tracking-wide uppercase whitespace-nowrap">Charging</div>
          </div>

          <div className="text-center text-[11px] text-[var(--text-dim)] font-semibold tracking-wide uppercase">Low $</div>
        </motion.div>

        {/* Stats */}
        {hasAnyClassified && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ZONES.map(z => {
              const count = tasksByZone(z.key).length
              return (
                <div key={z.key} className="rounded-[12px] border border-[#1e2338] bg-[#0e1018] p-4 text-center">
                  <p className="data text-[20px] font-bold" style={{ color: z.color }}>{count}</p>
                  <p className="text-[11px] text-[var(--text-dim)] mt-1">{z.label}</p>
                </div>
              )
            })}
          </motion.div>
        )}

        {hasAnyClassified && eliminateCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.35 }} className="rounded-[12px] border border-[#1e2338] bg-[#0e1018] p-4">
            <p className="text-[13px] text-[var(--text-dim)]">
              You have <span className="font-semibold text-[var(--rose)]">{eliminateCount} tasks</span> in ELIMINATE — consider dropping or delegating these.
              {doubleDownCount > 0 && <> Your zone of genius has <span className="font-semibold text-[var(--accent)]">{doubleDownCount} tasks</span> — protect this time.</>}
            </p>
          </motion.div>
        )}

        {/* Unclassified Tasks */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.35 }} className="rounded-[16px] border border-[#1e2338] bg-[#0e1018] p-5 space-y-3">
          <h3 className="text-[14px] font-semibold text-[var(--text)]">
            {unclassified.length > 0 ? `Unclassified Tasks (${unclassified.length})` : 'All tasks classified'}
          </h3>

          {unclassified.length === 0 && tasks.length === 0 && (
            <div className="text-center py-6">
              <div className="text-[36px] mb-3">🧭</div>
              <p className="text-[13px] text-[var(--text-dim)]">Classify your tasks to see the matrix.</p>
              <p className="text-[12px] text-[var(--text-dim)] mt-1">Add tasks first, then sort them into DRIP zones.</p>
            </div>
          )}

          {unclassified.length === 0 && tasks.length > 0 && (
            <p className="text-[12px] text-[var(--text-dim)]">All tasks have been classified. Nice work.</p>
          )}

          <div className="space-y-2">
            <AnimatePresence>
              {unclassified.map(task => (
                <motion.div key={task.id} layout initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12, height: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-[10px] bg-[var(--surface2)] border border-[var(--border)]">
                  <span className="text-[13px] text-[var(--text)] flex-1">{task.text}</span>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {ZONES.map(z => (
                      <button key={z.key} onClick={() => classify(task.id, z.key)} className="px-2.5 py-1 rounded-[6px] text-[10px] font-semibold border transition-colors hover:opacity-80" style={{ borderColor: z.border, color: z.color }}>
                        {z.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  )
}

function QuadrantBox({ zone, tasks }: { zone: typeof ZONES[0]; tasks: any[] }) {
  return (
    <div className="rounded-[12px] p-3 min-h-[140px] border" style={{ background: zone.bg, borderColor: `${zone.border}33` }}>
      <div className="mb-2">
        <span className="text-[12px] font-bold tracking-wide" style={{ color: zone.color }}>{zone.label}</span>
        <span className="text-[10px] text-[var(--text-dim)] ml-2">({zone.subtitle})</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <AnimatePresence>
          {tasks.map(t => (
            <motion.span key={t.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="inline-block px-2 py-1 rounded-[6px] text-[11px] bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] max-w-[160px] truncate">
              {t.text}
            </motion.span>
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <span className="text-[11px] text-[var(--text-dim)] italic">No tasks yet</span>
        )}
      </div>
    </div>
  )
}
