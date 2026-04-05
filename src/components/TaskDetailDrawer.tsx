'use client'

import { useEffect, useState } from 'react'
import { Drawer } from 'vaul'
import { DRAWER_CONTENT_CLASS, DrawerDragHandle } from '@/components/ui/drawer-primitives'
import { useStore, type Task, type DripZone, isArchived } from '@/stores/store'

const DRIP_OPTIONS: { value: DripZone | 'none'; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'double_down', label: 'Double down' },
  { value: 'replace', label: 'Replace' },
  { value: 'design', label: 'Design' },
  { value: 'eliminate', label: 'Eliminate' },
]
import TaskDollarHint from '@/components/TaskDollarHint'
import { initialNextDue, type RecurringFrequency } from '@/lib/task-recurring'

const PRIORITY_PILL: Record<Task['priority'], string> = {
  crit: 'bg-[rgba(255,69,58,0.15)] text-[var(--negative)]',
  high: 'bg-[rgba(255,159,10,0.15)] text-[var(--warning)]',
  med: 'bg-[var(--accent-bg)] text-[var(--accent)]',
  low: 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]',
}

interface TaskDetailDrawerProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestSkip: (taskId: string) => void
}

export default function TaskDetailDrawer({ task, open, onOpenChange, onRequestSkip }: TaskDetailDrawerProps) {
  const { updateTask, businesses, anthropicKey } = useStore()
  const [newSub, setNewSub] = useState('')
  const [title, setTitle] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.text)
      setNewSub('')
    }
  }, [task?.id, task?.text])

  useEffect(() => {
    if (!open || !task || task.done) return
    if (task.kanbanLane === 'in_progress') return
    updateTask(task.id, { kanbanLane: 'in_progress' })
  }, [open, task?.id, task?.done, task?.kanbanLane, updateTask])

  if (!task) return null

  const taskBusiness = businesses.find((b) => b.id === task.businessId && !isArchived(b))

  const subtasks = task.subtasks ?? []
  const doneSubs = subtasks.filter((s) => s.done).length
  const totalSubs = subtasks.length
  const skips = task.skipCount ?? 0
  const skipClass =
    skips >= 3 ? 'text-[var(--negative)]' : skips >= 2 ? 'text-[var(--warning)]' : 'text-[var(--text-secondary)]'

  const setRepeat = (mode: 'none' | RecurringFrequency) => {
    if (mode === 'none') {
      updateTask(task.id, { recurring: undefined })
      return
    }
    updateTask(task.id, {
      recurring: { frequency: mode, nextDue: initialNextDue(mode) },
    })
  }

  const currentRepeat: 'none' | RecurringFrequency = task.recurring?.frequency ?? 'none'

  const toggleSub = (index: number) => {
    const next = subtasks.map((s, i) => (i === index ? { ...s, done: !s.done } : s))
    updateTask(task.id, { subtasks: next, kanbanLane: 'in_progress' })
  }

  const removeSub = (index: number) => {
    updateTask(task.id, {
      subtasks: subtasks.filter((_, i) => i !== index),
    })
  }

  const addSub = () => {
    const t = newSub.trim()
    if (!t) return
    updateTask(task.id, {
      subtasks: [...subtasks, { text: t, done: false }],
      kanbanLane: 'in_progress',
    })
    setNewSub('')
  }

  const saveTitle = () => {
    const t = title.trim()
    if (t && t !== task.text) updateTask(task.id, { text: t })
  }

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[115] bg-black/60" />
        <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-[116] pb-10`}>
          <DrawerDragHandle />
          <Drawer.Title className="sr-only">Task details</Drawer.Title>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            className="w-full bg-transparent text-[20px] font-semibold text-[var(--text-primary)] outline-none"
          />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-[12px] font-semibold capitalize ${PRIORITY_PILL[task.priority]}`}>
              {task.priority}
            </span>
            {task.tag ? (
              <span className="rounded-md bg-[rgba(100,210,255,0.12)] px-2 py-0.5 text-[12px] text-[var(--info)]">
                {task.tag}
              </span>
            ) : null}
            {taskBusiness ? (
              <span className="text-[12px] text-[var(--text-secondary)]">{taskBusiness.name}</span>
            ) : null}
          </div>

          <div className="mt-4">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Strategic zone (DRIP)
            </label>
            <select
              value={task.drip ?? 'none'}
              disabled={task.done}
              onChange={(e) => {
                const v = e.target.value as DripZone | 'none'
                updateTask(task.id, { drip: v === 'none' ? undefined : v })
              }}
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] disabled:opacity-50"
            >
              {DRIP_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <TaskDollarHint task={task} hasAiKey={!!anthropicKey?.trim()} />
            {!task.done ? (
              <button
                type="button"
                onClick={() => {
                  onRequestSkip(task.id)
                  onOpenChange(false)
                }}
                className="shrink-0 text-[14px] font-medium text-[var(--warning)]"
              >
                Skip
              </button>
            ) : null}
          </div>

          {totalSubs > 0 ? (
            <p className="mt-3 text-[14px] text-[var(--text-secondary)]">
              {doneSubs}/{totalSubs} subtasks
            </p>
          ) : null}

          {skips > 0 ? (
            <p className={`mt-1 text-[13px] font-medium ${skipClass}`}>
              {skips} time{skips === 1 ? '' : 's'} skipped
              {task.skipReason ? ` · ${task.skipReason}` : ''}
            </p>
          ) : null}

          <div className="mt-5">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Subtasks</p>
            <ul className="mt-2 space-y-1">
              {subtasks.map((s, i) => (
                <li
                  key={`${i}-${s.text.slice(0, 24)}`}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2.5"
                >
                  <button
                    type="button"
                    aria-label={s.done ? 'Mark subtask incomplete' : 'Mark subtask complete'}
                    onClick={() => toggleSub(i)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                      s.done ? 'border-[var(--positive)] bg-[var(--positive)]' : 'border-[var(--border)]'
                    }`}
                  >
                    {s.done ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    ) : null}
                  </button>
                  <span
                    className={`min-w-0 flex-1 text-[15px] ${s.done ? 'text-[var(--text-tertiary)] line-through' : 'text-[var(--text-primary)]'}`}
                  >
                    {s.text}
                  </span>
                  <button
                    type="button"
                    aria-label="Remove subtask"
                    onClick={() => removeSub(i)}
                    className="shrink-0 text-[var(--negative)] opacity-70 hover:opacity-100"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
            {!task.done ? (
              <div className="mt-2 flex gap-2">
                <input
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSub()}
                  placeholder="Add subtask…"
                  className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
                <button
                  type="button"
                  onClick={addSub}
                  className="rounded-xl border border-[var(--border)] px-4 text-[14px] text-[var(--accent)]"
                >
                  Add
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-6">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">Repeat</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['none', 'daily', 'weekly', 'monthly'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={task.done}
                  onClick={() => setRepeat(m)}
                  className={`rounded-full px-4 py-2 text-[13px] font-medium capitalize ${
                    currentRepeat === m
                      ? 'bg-[var(--accent-bg)] text-[var(--accent)] ring-1 ring-[color-mix(in_srgb,var(--accent)_35%,transparent)]'
                      : 'border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
                  } ${task.done ? 'opacity-50' : ''}`}
                >
                  {m === 'none' ? 'None' : m}
                </button>
              ))}
            </div>
            {task.recurring ? (
              <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">
                Next due: {new Date(task.recurring.nextDue).toLocaleString()}
              </p>
            ) : null}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
