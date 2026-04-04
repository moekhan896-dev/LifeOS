import type { Task } from '@/stores/store'

export type KanbanColumnId = 'todo' | 'in_progress' | 'done'

export function taskKanbanColumn(task: Task): KanbanColumnId {
  if (task.done) return 'done'
  return task.kanbanLane === 'in_progress' ? 'in_progress' : 'todo'
}
