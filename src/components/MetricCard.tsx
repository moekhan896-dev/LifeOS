'use client'

import { motion } from 'framer-motion'

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
  icon?: string
  accentColor?: string
}

export default function MetricCard({ label, value, sub, color, icon, accentColor }: MetricCardProps) {
  return (
    <motion.div
      className="card bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 group"
      style={accentColor ? { borderTop: `2px solid ${accentColor}` } : undefined}
      whileHover={{
        y: -2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        borderColor: 'var(--border-glow)',
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="label text-[10px] text-[var(--text-dim)]">{label}</span>
        {icon && (
          <motion.span
            className="text-sm opacity-60"
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {icon}
          </motion.span>
        )}
      </div>
      <motion.div
        layoutId={`metric-${label}`}
        className="data text-2xl font-bold"
        style={{ color: color || 'var(--text)' }}
      >
        {value}
      </motion.div>
      {sub && (
        <div className="text-[12px] text-[var(--text-mid)] mt-1">{sub}</div>
      )}
    </motion.div>
  )
}
