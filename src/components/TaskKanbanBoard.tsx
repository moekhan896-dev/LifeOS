'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import type { Task } from '@/stores/store'
import { taskKanbanColumn, type KanbanColumnId } from '@/lib/task-kanban'

const COL_IDS: Record<KanbanColumnId, string> = {
  todo: 'col-todo',
  in_progress: 'col-in_progress',
  done: 'col-done',
}

const PRIORITY_DOT: Record<Task['priority'], string> = {
  crit: 'bg-[var(--negative)]',
  high: 'bg-[var(--warning)]',
  med: 'bg-[var(--accent)]',
  low: 'bg-[var(--text-tertiary)]',
}

function DroppableColumn({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[280px] flex-1 flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)]/40 p-3 ${
        isOver ? 'ring-2 ring-[var(--accent)]/60' : ''
      }`}
    >
      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">{title}</h3>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
    </div>
  )
}

function DraggableCard({
  task,
  onCardClick,
}: {
  task: Task
  onCardClick: (t: Task) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)` }
    : undefined
  const dollars =
    task.dollarValue != null && task.dollarValue > 0
      ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
          task.dollarValue
        )
      : '—'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex w-full items-stretch rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm transition-opacity ${
        isDragging ? 'opacity-50' : 'hover:border-[var(--border-hover)]'
      }`}
    >
      <button
        type="button"
        className="cursor-grab touch-manipulation px-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] active:cursor-grabbing"
        aria-label="Drag task"
        {...listeners}
        {...attributes}
      >
        <span className="text-[18px] leading-none">⋮⋮</span>
      </button>
      <button
        type="button"
        onClick={() => onCardClick(task)}
        className="min-w-0 flex-1 p-3 pl-0 text-left"
      >
        <div className="flex items-start gap-2">
          <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} />
          <div className="min-w-0 flex-1">
            <p
              className={`line-clamp-3 text-[14px] font-medium leading-snug text-[var(--text-primary)] ${
                task.done ? 'opacity-50 line-through' : ''
              }`}
            >
              {task.text}
            </p>
            <p className="mt-2 text-[12px] text-[var(--text-secondary)]">{dollars}</p>
          </div>
        </div>
      </button>
    </div>
  )
}

export interface TaskKanbanBoardProps {
  tasks: Task[]
  onColumnChange: (taskId: string, column: KanbanColumnId) => void
  onTaskClick: (task: Task) => void
}

export default function TaskKanbanBoard({ tasks, onColumnChange, onTaskClick }: TaskKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  )

  const grouped = useMemo(() => {
    const todo: Task[] = []
    const progress: Task[] = []
    const done: Task[] = []
    for (const t of tasks) {
      const c = taskKanbanColumn(t)
      if (c === 'done') done.push(t)
      else if (c === 'in_progress') progress.push(t)
      else todo.push(t)
    }
    return { todo, progress, done }
  }, [tasks])

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null

  const resolveColumn = (overId: string): KanbanColumnId | null => {
    if (overId === COL_IDS.todo || overId === 'col-todo') return 'todo'
    if (overId === COL_IDS.in_progress || overId === 'col-in_progress') return 'in_progress'
    if (overId === COL_IDS.done || overId === 'col-done') return 'done'
    const t = tasks.find((x) => x.id === overId)
    return t ? taskKanbanColumn(t) : null
  }

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id))
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = e
    if (!over) return
    const taskId = String(active.id)
    const col = resolveColumn(String(over.id))
    if (!col) return
    onColumnChange(taskId, col)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col gap-4 lg:flex-row">
        <DroppableColumn id={COL_IDS.todo} title="To do">
          {grouped.todo.map((t) => (
            <DraggableCard key={t.id} task={t} onCardClick={onTaskClick} />
          ))}
        </DroppableColumn>
        <DroppableColumn id={COL_IDS.in_progress} title="In progress">
          {grouped.progress.map((t) => (
            <DraggableCard key={t.id} task={t} onCardClick={onTaskClick} />
          ))}
        </DroppableColumn>
        <DroppableColumn id={COL_IDS.done} title="Done">
          {grouped.done.map((t) => (
            <DraggableCard key={t.id} task={t} onCardClick={onTaskClick} />
          ))}
        </DroppableColumn>
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="w-[260px] rounded-xl border border-[var(--accent)] bg-[var(--bg-elevated)] p-3 opacity-95 shadow-xl">
            <p className="line-clamp-3 text-[14px] font-medium text-[var(--text-primary)]">{activeTask.text}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
