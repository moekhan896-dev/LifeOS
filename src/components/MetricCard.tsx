'use client'

import { motion } from 'framer-motion'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
  icon?: string
  accentColor?: string
  sparkData?: { v: number }[]
}

export default function MetricCard({ label, value, sub, color, icon, accentColor, sparkData }: MetricCardProps) {
  const fillColor = accentColor || color || 'var(--accent)'
  const isScore = typeof value === 'number' && !sparkData

  return (
    <motion.div
      className="card bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-5 group relative overflow-hidden"
      whileHover={{
        y: -2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}
      transition={{ duration: 0.2 }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-[10px] font-mono uppercase text-[var(--text-dim)]"
          style={{ letterSpacing: '2px' }}
        >
          {label}
        </span>
        {icon && (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[11px]"
            style={{ backgroundColor: `${fillColor}20`, color: fillColor }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <motion.div
        className="data text-[36px] font-bold leading-none"
        style={{ color: color || 'var(--text)' }}
      >
        {value}
      </motion.div>

      {/* Sub */}
      {sub && (
        <div className="text-[12px] text-[var(--text-mid)] mt-1.5">{sub}</div>
      )}

      {/* Spark area chart */}
      {sparkData && sparkData.length > 0 && (
        <div className="mt-3 -mx-1">
          <ResponsiveContainer width="100%" height={40}>
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={fillColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={fillColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={fillColor}
                strokeWidth={1.5}
                fill={`url(#spark-${label})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Score ring (if numeric value, no sparkData) */}
      {isScore && (
        <div className="mt-3 flex justify-start">
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle
              cx="20" cy="20" r="16"
              fill="none"
              stroke="var(--border)"
              strokeWidth="3"
            />
            <circle
              cx="20" cy="20" r="16"
              fill="none"
              stroke={fillColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(Math.min(Number(value), 100) / 100) * 100.5} 100.5`}
              transform="rotate(-90 20 20)"
            />
          </svg>
        </div>
      )}
    </motion.div>
  )
}
