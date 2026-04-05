'use client'

import { motion } from 'framer-motion'

interface StreakCardProps {
  habit: string
  streak: number
  longest: number
  icon: string
  color?: string
}

export default function StreakCard({ habit, streak, longest, icon, color }: StreakCardProps) {
  const numColor = streak === 0 ? 'var(--rose)' : (color || 'var(--accent)')

  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-base">{icon}</span>
      <span className="text-[13px] text-[var(--text)] font-medium flex-1 min-w-0 truncate">
        {habit}
        {streak > 7 && ' \u{1F525}'}
      </span>
      <div className="flex items-baseline gap-1 flex-shrink-0">
        <motion.span
          key={streak}
          className="data text-[20px] font-bold"
          style={{ color: numColor }}
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {streak}
        </motion.span>
        <span className="text-[10px] text-[var(--text-dim)]">days</span>
      </div>
      {streak === 0 && (
        <span className="text-[10px] text-[var(--text-dim)] italic flex-shrink-0">Start today.</span>
      )}
    </div>
  )
}
