/** PRD Round 7 — consistent Vaul drawer surface (uses `card-floating` from globals.css). */
export const DRAWER_CONTENT_CLASS =
  'card-floating fixed bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-[20px] border-t border-[var(--border)] p-5'

export function DrawerDragHandle() {
  return (
    <div
      className="mx-auto mb-3 h-1 w-[40px] shrink-0 rounded-[2px] bg-[var(--text-primary)]/10"
      aria-hidden
    />
  )
}
