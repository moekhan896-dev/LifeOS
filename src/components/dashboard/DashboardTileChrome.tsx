'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { DashboardTileConfig } from '@/lib/dashboard-layout'
import { cycleSpan, spanToClass } from '@/lib/dashboard-layout'

interface DashboardTileChromeProps {
  entry: DashboardTileConfig
  editMode: boolean
  onRemove: () => void
  onResize: (next: DashboardTileConfig['gridColumn']) => void
  dragAttributes: DraggableAttributes
  /** From useSortable — kept loose for dnd-kit version compatibility */
  dragListeners: Record<string, unknown> | undefined
  children: React.ReactNode
}

/** PRD §9.18 — drag handle, resize, remove in edit mode */
export default function DashboardTileChrome({
  entry,
  editMode,
  onRemove,
  onResize,
  dragAttributes,
  dragListeners,
  children,
}: DashboardTileChromeProps) {
  const spanClass = spanToClass(entry.gridColumn)

  return (
    <div className={`relative ${spanClass}`}>
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-2 ring-[var(--accent)]/40"
          />
        )}
      </AnimatePresence>

      {editMode && (
        <>
          <button
            type="button"
            className="absolute left-1/2 top-1 z-20 flex -translate-x-1/2 cursor-grab touch-none items-center justify-center rounded-lg bg-[var(--bg-elevated)] px-2 py-1 text-[var(--text-tertiary)] shadow-md active:cursor-grabbing"
            aria-label="Drag to reorder"
            {...dragAttributes}
            {...dragListeners}
          >
            <span className="select-none text-[18px] leading-none tracking-tighter">⋮⋮⋮</span>
          </button>
          <button
            type="button"
            onClick={() => onResize(cycleSpan(entry.gridColumn))}
            className="absolute bottom-2 right-2 z-20 flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-elevated)] text-[var(--text-secondary)] shadow-md hover:text-[var(--accent)]"
            title="Resize (snap columns)"
            aria-label="Resize tile"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 3L3 21M21 9V3h-6M3 15v6h6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--negative)]/90 text-white shadow-md hover:bg-[var(--negative)]"
            aria-label="Remove tile"
          >
            ✕
          </button>
        </>
      )}

      <motion.div
        layout
        initial={false}
        animate={{ scale: editMode ? 0.99 : 1 }}
        transition={{ duration: 0.2 }}
        className={editMode ? 'pt-7' : ''}
      >
        {children}
      </motion.div>
    </div>
  )
}
