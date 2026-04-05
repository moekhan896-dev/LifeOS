'use client'

import { Drawer } from 'vaul'
import { DRAWER_CONTENT_CLASS, DrawerDragHandle } from '@/components/ui/drawer-primitives'
import { DASHBOARD_TILE_CATALOG } from '@/lib/dashboard-layout'

interface TileLibrarySheetProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  activeTileIds: Set<string>
  onToggleAdd: (tileId: string) => void
}

/** PRD §9.18 — bottom sheet: all tiles with on/off */
export default function TileLibrarySheet({ open, onOpenChange, activeTileIds, onToggleAdd }: TileLibrarySheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[200] bg-black/60" />
        <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-[210]`}>
          <DrawerDragHandle />
          <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)]">Tile library</Drawer.Title>
          <p className="mt-1 text-[17px] text-[var(--text-secondary)]">Tap a tile to add it to the bottom of your dashboard.</p>
          <ul className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
            {DASHBOARD_TILE_CATALOG.map((t) => {
              const on = activeTileIds.has(t.id)
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    disabled={on}
                    onClick={() => onToggleAdd(t.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-[15px] ${
                      on
                        ? 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'
                        : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:border-[var(--accent)]'
                    }`}
                  >
                    <span>{t.label}</span>
                    <span className="text-[12px] font-medium text-[var(--text-tertiary)]">{on ? 'Added' : 'Add'}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
