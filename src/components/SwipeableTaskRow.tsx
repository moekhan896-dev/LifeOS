'use client'

import { type ReactNode } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

const SWIPE_THRESHOLD = 72

interface SwipeableTaskRowProps {
  children: ReactNode
  className?: string
  enabled: boolean
  onSwipeComplete: () => void
  onSwipeSkip: () => void
}

/** PRD §10.4 — mobile-only: swipe right complete, swipe left skip */
export default function SwipeableTaskRow({
  children,
  className = '',
  enabled,
  onSwipeComplete,
  onSwipeSkip,
}: SwipeableTaskRowProps) {
  const x = useMotionValue(0)

  const leftReveal = useTransform(x, [-120, 0], [1, 0])
  const rightReveal = useTransform(x, [0, 120], [0, 1])

  if (!enabled) {
    return <>{children}</>
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-between rounded-2xl px-6"
        style={{ opacity: leftReveal, background: 'rgba(239,68,68,0.22)' }}
      >
        <span className="text-[22px] text-[var(--negative)]">✕</span>
        <span className="text-[12px] font-medium text-[var(--negative)]">Skip</span>
      </motion.div>
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-between rounded-2xl px-6"
        style={{ opacity: rightReveal, background: 'rgba(16,185,129,0.22)' }}
      >
        <span className="text-[12px] font-medium text-[var(--positive)]">Complete</span>
        <span className="text-[22px] text-[var(--positive)]">✓</span>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.55}
        style={{ x }}
        onDragEnd={(_, info) => {
          const ox = info.offset.x
          if (ox > SWIPE_THRESHOLD) {
            void animate(x, 0, { type: 'spring', stiffness: 420, damping: 32 })
            onSwipeComplete()
          } else if (ox < -SWIPE_THRESHOLD) {
            void animate(x, 0, { type: 'spring', stiffness: 420, damping: 32 })
            onSwipeSkip()
          } else {
            void animate(x, 0, { type: 'spring', stiffness: 420, damping: 32 })
          }
        }}
        className={`relative touch-pan-y ${className}`}
      >
        {children}
      </motion.div>
    </div>
  )
}
