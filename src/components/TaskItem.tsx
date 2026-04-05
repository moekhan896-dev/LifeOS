'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { useStore, type Task, isArchived } from '@/stores/store'
import TaskDollarHint from '@/components/TaskDollarHint'
import { PRIORITY_COLORS } from '@/lib/constants'
import { toast } from 'sonner'

const BORDER_COLORS: Record<string, string> = {
  crit: 'var(--negative)',
  high: 'var(--warning)',
  med: 'var(--accent)',
  low: 'var(--border)',
}

interface TaskItemProps {
  task: Task
}

export default function TaskItem({ task }: TaskItemProps) {
  const { toggleTask, deleteTask, updateTask, businesses, anthropicKey } = useStore()
  const [showXp, setShowXp] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(task.text)
  const inputRef = useRef<HTMLInputElement>(null)

  const x = useMotionValue(0)
  const bgOpacity = useTransform(x, [-120, -50, 0, 50, 120], [1, 0.5, 0, 0.5, 1])
  const bgColor = useTransform(x, (v) =>
    v > 0 ? 'color-mix(in srgb, var(--positive) 25%, transparent)' : 'color-mix(in srgb, var(--negative) 25%, transparent)',
  )

  const pColors = PRIORITY_COLORS[task.priority]
  const business = businesses.find((b) => b.id === task.businessId && !isArchived(b))

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus()
  }, [editing])

  const handleToggle = () => {
    if (!task.done) {
      setShowXp(true)
      setTimeout(() => setShowXp(false), 1200)
      toast.success(`+${task.xpValue} XP`)
    }
    toggleTask(task.id)
  }

  const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
    if (info.offset.x > 80) {
      if (!task.done) handleToggle()
    } else if (info.offset.x < -80) {
      deleteTask(task.id)
      toast('Task deleted')
    }
  }

  const handleEditSave = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== task.text) {
      updateTask(task.id, { text: trimmed })
      toast('Task updated')
    }
    setEditing(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleEditSave()
    if (e.key === 'Escape') {
      setEditText(task.text)
      setEditing(false)
    }
  }

  const dueLabel = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  return (
    <div className="relative overflow-hidden rounded-[12px]">
      {/* Swipe background */}
      <motion.div
        className="absolute inset-0 rounded-[12px] flex items-center justify-between px-5"
        style={{ backgroundColor: bgColor, opacity: bgOpacity }}
      >
        <span className="text-[var(--accent)] text-sm font-semibold">Complete</span>
        <span className="text-[var(--rose)] text-sm font-semibold">Delete</span>
      </motion.div>

      <motion.div
        layout
        className={`group relative flex items-start gap-3 p-3 rounded-[12px] bg-[var(--surface)] ${
          task.done ? 'opacity-60' : ''
        }`}
        style={{
          x,
          borderLeft: `3px solid ${BORDER_COLORS[task.priority] || 'var(--border)'}`,
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragEnd={handleDragEnd}
        whileHover={{ borderColor: 'var(--border-glow)' }}
        transition={{ layout: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } }}
      >
        {/* Checkbox */}
        <motion.button
          type="button"
          onClick={handleToggle}
          aria-label={task.done ? 'Mark task incomplete' : 'Mark task complete'}
          className={`mt-0.5 flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-[6px] border-2 transition-colors ${
            task.done
              ? 'border-[var(--accent)] bg-[var(--accent)]'
              : 'border-[var(--border)] hover:border-[var(--accent)]'
          }`}
          whileTap={{ scale: 0.85 }}
        >
          {task.done && (
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--bg)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="check-draw"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </motion.button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              ref={inputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={handleEditKeyDown}
              className="w-full border-b border-[var(--accent)] bg-transparent pb-0.5 text-[17px] text-[var(--text)] outline-none"
            />
          ) : (
            <motion.div
              className={`cursor-text text-[17px] ${
                task.done ? 'text-[var(--text-dim)] line-through' : 'text-[var(--text)]'
              }`}
              animate={{ opacity: task.done ? 0.4 : 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => !task.done && setEditing(true)}
            >
              {task.text}
            </motion.div>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[8px] ${pColors.bg} ${pColors.text} ${pColors.border} border`}>
              {task.priority.toUpperCase()}
            </span>
            {task.tag && (
              <span className="text-[10px] text-[var(--text-dim)] bg-[var(--surface2)] px-1.5 py-0.5 rounded-[8px]">
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

        <TaskDollarHint task={task} hasAiKey={!!anthropicKey?.trim()} />

        {/* Delete button */}
        <motion.button
          type="button"
          onClick={() => { deleteTask(task.id); toast('Task deleted') }}
          className="mt-1 text-[var(--rose)]"
          aria-label="Delete task"
          initial={{ opacity: 0, x: 4 }}
          whileHover={{ opacity: 1 }}
          animate={{ opacity: 0, x: 4 }}
          whileTap={{ scale: 0.9 }}
          style={{ pointerEvents: 'auto' }}
          data-delete
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </motion.button>

        {/* XP Popup */}
        <AnimatePresence>
          {showXp && (
            <motion.span
              className="absolute -top-2 right-3 data text-xs font-bold text-[var(--accent)] pointer-events-none"
              initial={{ y: 0, opacity: 1 }}
              animate={{ y: -28, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            >
              +{task.xpValue} XP
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* CSS for group hover on delete and check-draw */}
      <style jsx global>{`
        .group:hover [data-delete] {
          opacity: 0.6 !important;
          transform: translateX(0) !important;
        }
        .group:hover [data-delete]:hover {
          opacity: 1 !important;
        }
        .check-draw polyline {
          stroke-dasharray: 30;
          stroke-dashoffset: 30;
          animation: check-draw 0.3s ease forwards;
        }
        @keyframes check-draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}
