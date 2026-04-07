'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DraggableAttributes } from '@dnd-kit/core'
import type { DashboardTileConfig } from '@/lib/dashboard-layout'
import { spanToClass } from '@/lib/dashboard-layout'
import DashboardTileChrome from './DashboardTileChrome'

interface SortableDashboardTileProps {
  id: string
  entry: DashboardTileConfig
  editMode: boolean
  onRemove: () => void
  onResize: (next: DashboardTileConfig['gridColumn']) => void
  children: React.ReactNode
}

export default function SortableDashboardTile({
  id,
  entry,
  editMode,
  onRemove,
  onResize,
  children,
}: SortableDashboardTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !editMode })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 5 : undefined,
  }

  /** Column span must be on the grid item (direct child of `grid`), not nested inside tile chrome. */
  const spanClass = spanToClass(entry.gridColumn)

  return (
    <div ref={setNodeRef} style={style} className={spanClass}>
      <DashboardTileChrome
        entry={entry}
        editMode={editMode}
        onRemove={onRemove}
        onResize={onResize}
        dragAttributes={attributes as DraggableAttributes}
        dragListeners={listeners as Record<string, unknown> | undefined}
      >
        {children}
      </DashboardTileChrome>
    </div>
  )
}
