'use client'

import { useState } from 'react'
import { Drawer } from 'vaul'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'

const CHIPS = [
  { label: 'Not a priority', value: 'Not a priority' },
  { label: "Don't know how to start", value: "Don't know how to start" },
  { label: "Don't want to", value: "Don't want to" },
] as const

interface TaskSkipDrawerProps {
  taskId: string | null
  onDismiss: () => void
}

/** PRD §10.5 — obstacle question after swipe skip or Skip control */
export default function TaskSkipDrawer({ taskId, onDismiss }: TaskSkipDrawerProps) {
  const recordTaskSkip = useStore((s) => s.recordTaskSkip)
  const [blockedDetail, setBlockedDetail] = useState('')
  const [showBlocked, setShowBlocked] = useState(false)
  const open = taskId != null

  const close = () => {
    onDismiss()
    setBlockedDetail('')
    setShowBlocked(false)
  }

  const submit = (reason: string) => {
    if (!taskId) return
    recordTaskSkip(taskId, reason)
    toast.success('Skip logged')
    close()
  }

  return (
    <Drawer.Root open={open} onOpenChange={(o) => !o && close()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[130] bg-black/60" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-[140] max-h-[85vh] rounded-t-[20px] border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/10" />
          <Drawer.Title className="text-lg font-semibold text-[var(--text-primary)]">
            What&apos;s preventing you from doing this?
          </Drawer.Title>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            Your answer is logged on the task. Skips add up toward follow-up nudges.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => submit(c.value)}
                className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-left text-[14px] text-[var(--text-primary)] hover:border-[var(--accent)]"
              >
                {c.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowBlocked(true)}
              className="rounded-full border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-2.5 text-[14px] text-[var(--text-primary)] hover:border-[var(--warning)]"
            >
              Blocked by…
            </button>
          </div>
          {showBlocked && (
            <div className="mt-4 space-y-2">
              <label className="text-[13px] text-[var(--text-secondary)]">What are you blocked by?</label>
              <input
                value={blockedDetail}
                onChange={(e) => setBlockedDetail(e.target.value)}
                placeholder="Client approval, tool access, …"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5 text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              />
              <button
                type="button"
                disabled={!blockedDetail.trim()}
                onClick={() => submit(`Blocked by: ${blockedDetail.trim()}`)}
                className="w-full rounded-xl bg-[var(--accent)] py-3 text-[15px] font-medium text-white disabled:opacity-40"
              >
                Log block
              </button>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
