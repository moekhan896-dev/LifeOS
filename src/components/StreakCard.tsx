'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface StreakCardProps {
  habit: string
  streak: number
  longest: number
  icon: string
}

export default function StreakCard({ habit, streak, longest, icon }: StreakCardProps) {
  return (
    <motion.div
      className={`bg-[var(--surface)] border rounded-[10px] p-4 ${
        streak > 0
          ? 'border-[var(--border-glow)] animate-pulse-border'
          : 'border-[var(--border)]'
      }`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[var(--text)] font-medium truncate">
            {habit}
            <AnimatePresence>
              {streak > 0 && (
                <motion.span
                  className="ml-1.5"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: streak > 14 ? 1 : streak > 7 ? 0.8 : 0.5 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  style={{ fontSize: streak > 14 ? 18 : streak > 7 ? 16 : 14 }}
                >
                  {streak > 14 ? '🔥🔥' : streak > 7 ? '🔥' : '🕯️'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {streak === 0 ? (
            <p className="text-[10px] text-[var(--text-dim)] mt-1 italic">Every streak starts at 1.</p>
          ) : (
            <>
              <div className="flex items-baseline gap-1 mt-1">
                <motion.span
                  key={streak}
                  className="data text-2xl font-bold text-[var(--accent)]"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {streak}
                </motion.span>
                <span className="data text-xs text-[var(--text-dim)]">days</span>
              </div>
              <div className="data text-[10px] text-[var(--text-dim)] mt-0.5">
                best: {longest}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
