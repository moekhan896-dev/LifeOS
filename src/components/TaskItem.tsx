'use client'

import { useState } from 'react'
import { useStore, type Task } from '@/stores/store'
import { BUSINESSES, PRIORITY_COLORS } from '@/lib/constants'

interface TaskItemProps {
  task: Task
}

export default function TaskItem({ task }: TaskItemProps) {
  const { toggleTask, deleteTask } = useStore()
  const [showXp, setShowXp] = useState(false)
  const [animating, setAnimating] = useState(false)

  const pColors = PRIORITY_COLORS[task.priority]
  const business = BUSINESSES.find((b) => b.id === task.businessId)

  const handleToggle = () => {
    if (!task.done) {
      setAnimating(true)
      setShowXp(true)
      setTimeout(() => setShowXp(false), 1200)
      setTimeout(() => setAnimating(false), 300)
    }
    toggleTask(task.id)
  }

  const dueLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <div className={`group relative flex items-start gap-3 px-3 py-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] transition-all duration-200 hover:border-[var(--border-glow)] ${
      animating ? 'scale-[0.98]' : ''
    }`}>
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`mt-0.5 w-[18px] h-[18px] rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
          task.done
            ? 'bg-[var(--accent)] border-[var(--accent)]'
            : 'border-[var(--border)] hover:border-[var(--accent)]'
        }`}
      >
        {task.done && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-[13px] transition-all duration-200 ${
          task.done ? 'line-through text-[var(--text-dim)]' : 'text-[var(--text)]'
        }`}>
          {task.text}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${pColors.bg} ${pColors.text} ${pColors.border} border`}>
            {task.priority.toUpperCase()}
          </span>
          {task.tag && (
            <span className="text-[10px] text-[var(--text-dim)] bg-[var(--surface2)] px-1.5 py-0.5 rounded-md">
              {task.tag}
            </span>
          )}
          {business && (
            <span className="text-[10px] text-[var(--text-dim)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: business.color }} />
              {business.name}
            </span>
          )}
          {dueLabel && (
            <span className="data text-[10px] text-[var(--text-dim)]">{dueLabel}</span>
          )}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={() => deleteTask(task.id)}
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-[var(--rose)] transition-all duration-150 mt-1 hover:scale-110"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      {/* XP Popup */}
      {showXp && (
        <span className="absolute -top-2 right-3 data text-xs font-bold text-[var(--accent)] animate-xp-pop">
          +{task.xpValue} XP
        </span>
      )}
    </div>
  )
}
