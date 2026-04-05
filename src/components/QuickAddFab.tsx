'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ACTIONS = [
  { label: 'Task', icon: '✓', event: 'artos-open-task-drawer' as const },
  { label: 'Idea', icon: '💡', event: 'artos-open-idea' as const },
  { label: 'Log', icon: '📝', event: 'artos-open-habit-log' as const },
  { label: 'Voice', icon: '🎤', event: 'artos-trigger-voice' as const },
]

/** PRD §9.20 — radial quick-add above the voice FAB */
export default function QuickAddFab() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={rootRef} className="fixed bottom-[152px] z-[99]" style={{ right: 24 }}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-[52px] right-0 flex flex-col items-end gap-2"
          >
            {ACTIONS.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent(a.event))
                  setOpen(false)
                }}
                className="flex min-w-[120px] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2.5 text-[13px] font-medium text-[var(--text-primary)] shadow-lg"
              >
                <span aria-hidden>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        aria-label="Quick add"
        aria-expanded={open}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="flex h-11 w-11 items-center justify-center rounded-full text-[22px] font-light leading-none text-[var(--text-primary)] shadow-lg"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        +
      </motion.button>
    </div>
  )
}
