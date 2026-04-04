'use client'

import { useState } from 'react'
import type { Task, TaskValueCategory } from '@/stores/store'

const CATEGORY_LABEL: Record<TaskValueCategory, string> = {
  direct_revenue: 'Direct revenue',
  revenue_generating: 'Revenue activity',
  infrastructure: 'Infrastructure',
  health_correlation: 'Health / energy',
}

type Props = {
  task: Task
  /** When false, show PRD empty hint for dollar column */
  hasAiKey: boolean
}

export default function TaskDollarHint({ task, hasAiKey }: Props) {
  const [open, setOpen] = useState(false)
  const has = task.dollarValue != null && task.dollarValue > 0
  const cat = task.taskValueCategory

  return (
    <div className="flex flex-col items-end gap-0.5 shrink-0 text-right max-w-[140px]">
      {has ? (
        <>
          <div className="flex items-center justify-end gap-1">
            <span className="data text-[13px] font-mono tabular-nums text-[var(--accent)]">
              ${task.dollarValue!.toLocaleString()}
              <span className="text-[10px] text-[var(--text-tertiary)] font-sans">/mo</span>
            </span>
            {task.dollarReasoning ? (
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="min-w-[22px] min-h-[22px] rounded-full border border-[var(--border)] text-[11px] font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                aria-expanded={open}
                aria-label="Show estimate reasoning"
              >
                ?
              </button>
            ) : null}
          </div>
          {cat && (
            <span className="text-[9px] text-[var(--text-tertiary)] leading-tight">{CATEGORY_LABEL[cat]}</span>
          )}
          {open && task.dollarReasoning && (
            <p className="text-[11px] text-[var(--text-secondary)] text-left mt-1 p-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] max-w-[220px]">
              {task.dollarReasoning}
            </p>
          )}
        </>
      ) : (
        <span className="text-[10px] text-[var(--text-tertiary)] leading-tight">
          {hasAiKey ? '—' : 'Connect AI to estimate'}
        </span>
      )}
    </div>
  )
}
