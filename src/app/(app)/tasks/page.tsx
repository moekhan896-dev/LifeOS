'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore, isArchived, type Task, type Priority } from '@/stores/store'
import { TAGS, XP_VALUES } from '@/lib/constants'
import { applyTaskDollarEstimateAfterCreate } from '@/lib/task-dollar-client'
import { buildTaskSuggestContext } from '@/lib/ai-context'
import TaskDollarHint from '@/components/TaskDollarHint'
import PageTransition from '@/components/PageTransition'
import TaskDetailDrawer from '@/components/TaskDetailDrawer'
import TaskSkipDrawer from '@/components/TaskSkipDrawer'
import TaskKanbanBoard from '@/components/TaskKanbanBoard'
import SwipeableTaskRow from '@/components/SwipeableTaskRow'
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport'
import { taskKanbanColumn, type KanbanColumnId } from '@/lib/task-kanban'

const PRIORITY_ORDER: Priority[] = ['crit', 'high', 'med', 'low']

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    const pa = PRIORITY_ORDER.indexOf(a.priority)
    const pb = PRIORITY_ORDER.indexOf(b.priority)
    if (pa !== pb) return pa - pb
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

function parseTaskInput(text: string): { text: string; priority: Priority; tag: string } {
  let priority: Priority = 'med'
  let tag = ''
  let cleaned = text

  const priorityMatch = cleaned.match(/!(crit|high|low)\b/)
  if (priorityMatch) {
    priority = priorityMatch[1] as Priority
    cleaned = cleaned.replace(priorityMatch[0], '').trim()
  }

  const tagMatch = cleaned.match(/#(\w+)/)
  if (tagMatch) {
    tag = tagMatch[1].toUpperCase()
    cleaned = cleaned.replace(tagMatch[0], '').trim()
  }

  return { text: cleaned, priority, tag }
}

const PRIORITY_BAR_COLORS: Record<Priority, string> = {
  crit: 'bg-[var(--negative)]',
  high: 'bg-[var(--warning)]',
  med: 'bg-[var(--accent)]',
  low: 'bg-[var(--bg-tertiary)]',
}

const PRIORITY_PILL: Record<Priority, string> = {
  crit: 'bg-[rgba(255,69,58,0.15)] text-[var(--negative)]',
  high: 'bg-[rgba(255,159,10,0.15)] text-[var(--warning)]',
  med: 'bg-[var(--accent-bg)] text-[var(--accent)]',
  low: 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]',
}

function TasksPageInner() {
  const searchParams = useSearchParams()
  const { tasks, businesses, addTask, toggleTask, deleteTask, updateTask, anthropicKey } = useStore()
  const mobile = useIsMobileViewport()
  const activeBusinesses = useMemo(() => businesses.filter((b) => !isArchived(b)), [businesses])

  const [search, setSearch] = useState('')
  const [filterBusiness, setFilterBusiness] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterTag, setFilterTag] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')

  const [showNewTask, setShowNewTask] = useState(false)
  const [newText, setNewText] = useState('')
  const [newBusiness, setNewBusiness] = useState<string>('')
  const [newPriority, setNewPriority] = useState<Priority>('med')
  const [newTag, setNewTag] = useState<string>('')

  const [showCompleted, setShowCompleted] = useState(false)
  const [xpAnimId, setXpAnimId] = useState<string | null>(null)
  const [suggestLoading, setSuggestLoading] = useState(false)

  const [detailTaskId, setDetailTaskId] = useState<string | null>(null)
  const [skipTaskId, setSkipTaskId] = useState<string | null>(null)

  const detailTask = detailTaskId ? tasks.find((t) => t.id === detailTaskId) ?? null : null

  useEffect(() => {
    const tid = searchParams.get('task')
    if (tid) setDetailTaskId(tid)
  }, [searchParams])

  const visibleTasks = useMemo(() => tasks.filter((t) => !isArchived(t)), [tasks])
  const totalTasks = visibleTasks.length
  const doneTasks = visibleTasks.filter((t) => t.done).length
  const todayStr = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const todayUndone = visibleTasks.filter((t) => !t.done && t.createdAt.startsWith(todayStr)).length
  const thisWeekCount = visibleTasks.filter((t) => t.createdAt >= weekAgo).length
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const doneToday = visibleTasks.filter((t) => t.done && t.completedAt?.startsWith(todayStr))
  const xpToday = doneToday.reduce((s, t) => s + t.xpValue, 0)

  const filtered = useMemo(() => {
    let result = visibleTasks
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((t) => t.text.toLowerCase().includes(q))
    }
    if (filterBusiness !== 'all') result = result.filter((t) => t.businessId === filterBusiness)
    if (filterPriority !== 'all') result = result.filter((t) => t.priority === filterPriority)
    if (filterTag !== 'all') result = result.filter((t) => t.tag === filterTag)
    return result
  }, [visibleTasks, search, filterBusiness, filterPriority, filterTag])

  const incompleteTasks = useMemo(() => sortTasks(filtered.filter((t) => !t.done)), [filtered])
  const completedTasks = useMemo(
    () =>
      filtered
        .filter((t) => t.done)
        .sort(
          (a, b) =>
            new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime()
        ),
    [filtered]
  )

  const handleNewTask = () => {
    const raw = newText.trim()
    if (!raw) return
    const parsed = parseTaskInput(raw)
    const priority = newPriority !== 'med' ? newPriority : parsed.priority
    const tag = newTag || parsed.tag
    const businessId = newBusiness || activeBusinesses[0]?.id || ''
    const id = addTask({ businessId, text: parsed.text, priority, tag, done: false, xpValue: XP_VALUES[priority] })
    void applyTaskDollarEstimateAfterCreate(id, parsed.text)
    setNewText('')
    setNewPriority('med')
    setNewTag('')
    setNewBusiness('')
    setShowNewTask(false)
    toast.success('Task added')
  }

  const handleSuggestTasks = async () => {
    if (!anthropicKey?.trim()) {
      toast.error('Add an Anthropic API key in Settings first.')
      return
    }
    setSuggestLoading(true)
    try {
      const context = buildTaskSuggestContext(useStore.getState())
      const res = await fetch('/api/tasks/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, apiKey: anthropicKey }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Suggest failed')
      const rows = (data.tasks ?? []) as { text: string; priority: Priority; tag: string; rationale: string }[]
      if (rows.length === 0) {
        toast.message('No tasks returned — try again.')
        return
      }
      const biz = activeBusinesses[0]?.id || ''
      if (!biz) {
        toast.error('Add a business first.')
        return
      }
      for (const row of rows) {
        const pr = (['crit', 'high', 'med', 'low'] as const).includes(row.priority) ? row.priority : 'med'
        const id = addTask({
          businessId: biz,
          text: row.text,
          tag: row.tag || 'AI',
          priority: pr,
          done: false,
          xpValue: XP_VALUES[pr],
          aiSuggested: true,
        })
        void applyTaskDollarEstimateAfterCreate(id, row.text)
      }
      toast.success(`Added ${rows.length} AI-suggested tasks`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Suggest failed')
    } finally {
      setSuggestLoading(false)
    }
  }

  const handleToggle = (task: Task) => {
    toggleTask(task.id)
    if (!task.done) {
      setXpAnimId(task.id)
      setTimeout(() => setXpAnimId(null), 800)
      toast.success(`Task completed · +${task.xpValue} XP`)
    }
  }

  const handleColumnChange = (taskId: string, col: KanbanColumnId) => {
    const t = useStore.getState().tasks.find((x) => x.id === taskId)
    if (!t) return
    if (taskKanbanColumn(t) === col) return

    if (col === 'done') {
      if (!t.done) toggleTask(taskId)
      return
    }

    if (t.done) toggleTask(taskId)
    const fresh = useStore.getState().tasks.find((x) => x.id === taskId)
    if (!fresh || fresh.done) return
    if (col === 'todo') updateTask(taskId, { kanbanLane: undefined })
    else updateTask(taskId, { kanbanLane: 'in_progress' })
  }

  const getBusiness = (id: string) => activeBusinesses.find((b) => b.id === id)

  const stats = [
    { label: 'Today', value: todayUndone, color: 'text-[var(--text-primary)]' },
    { label: 'This week', value: thisWeekCount, color: 'text-[var(--text-primary)]' },
    { label: 'Done rate', value: `${completionPct}%`, color: completionPct > 50 ? 'text-[var(--positive)]' : 'text-[var(--warning)]' },
    { label: 'XP today', value: `+${xpToday}`, color: 'text-[var(--ai)]' },
  ]

  const renderTaskCard = (task: Task, index: number) => {
    const biz = getBusiness(task.businessId)
    const subs = task.subtasks ?? []
    const doneSubs = subs.filter((s) => s.done).length
    const totalSubs = subs.length

    const rowInner = (
      <>
        <div className={`w-1 h-10 rounded-full flex-shrink-0 ${PRIORITY_BAR_COLORS[task.priority]}`} />

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handleToggle(task)}
          type="button"
          className="min-h-[44px] min-w-[44px] shrink-0 flex items-center justify-center rounded-full"
          aria-label={task.done ? 'Mark incomplete' : 'Mark complete'}
        >
          <span
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
              task.done
                ? 'bg-[var(--positive)] border-[var(--positive)]'
                : 'border-[var(--border)] bg-transparent hover:border-[var(--accent)]'
            }`}
          >
            {task.done && (
              <motion.svg
                width="10"
                height="10"
                viewBox="0 0 12 12"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.path
                  d="M2 6L5 9L10 3"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.2 }}
                />
              </motion.svg>
            )}
          </span>
        </motion.button>

        <SwipeableTaskRow
          className="min-w-0 flex-1"
          enabled={mobile && !task.done}
          onSwipeComplete={() => handleToggle(task)}
          onSwipeSkip={() => setSkipTaskId(task.id)}
        >
          <button
            type="button"
            onClick={() => setDetailTaskId(task.id)}
            className="flex w-full min-w-0 flex-col items-start gap-1 text-left"
          >
            <p
              className={`w-full text-[17px] font-medium text-[var(--text-primary)] ${
                task.done ? 'opacity-40 line-through' : ''
              }`}
            >
              {task.text}
            </p>
            {totalSubs > 0 ? (
              <p className="text-[13px] text-[var(--text-secondary)]">
                {doneSubs}/{totalSubs} subtasks
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`caption rounded-md px-2 py-0.5 capitalize ${PRIORITY_PILL[task.priority]}`}>
                {task.priority}
              </span>
              {task.tag && (
                <span className="caption rounded-md px-2 py-0.5 bg-[rgba(100,210,255,0.12)] text-[var(--info)]">
                  {task.tag}
                </span>
              )}
              {biz && (
                <span className="flex items-center gap-1.5 footnote text-[var(--text-secondary)]">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: biz.color }} />
                  {biz.name}
                </span>
              )}
            </div>
          </button>
        </SwipeableTaskRow>

        <TaskDollarHint task={task} hasAiKey={!!anthropicKey?.trim()} />

        {!task.done ? (
          <button
            type="button"
            onClick={() => setSkipTaskId(task.id)}
            className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-medium text-[var(--warning)] opacity-80 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
          >
            Skip
          </button>
        ) : null}

        <button
          onClick={() => deleteTask(task.id)}
          type="button"
          aria-label="Delete task"
          className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-xl text-[var(--negative)] opacity-0 transition-all group-hover:opacity-100 hover:bg-[var(--bg-secondary)]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <AnimatePresence>
          {xpAnimId === task.id && (
            <motion.span
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -30 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="absolute right-12 top-2 text-[var(--positive)] text-sm data-number font-bold pointer-events-none"
            >
              +{task.xpValue} XP
            </motion.span>
          )}
        </AnimatePresence>
      </>
    )

    return (
      <motion.div
        key={task.id}
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
        transition={{ duration: 0.2, delay: index * 0.03, ease: [0.25, 0.1, 0.25, 1] as const }}
        className="group bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl px-5 py-3.5 mb-2 flex items-center gap-[14px] hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)] transition-[background,border-color] duration-150 relative"
      >
        {rowInner}
      </motion.div>
    )
  }

  return (
    <PageTransition>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="title">Tasks</h1>
            <p className="subheadline mt-1">
              {totalTasks} total &middot; {doneTasks} done
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1"
              role="tablist"
              aria-label="Task view"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={`rounded-lg px-4 py-2 text-[14px] font-medium ${
                  viewMode === 'list' ? 'bg-[var(--accent-bg)] text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                List
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'board'}
                onClick={() => setViewMode('board')}
                className={`rounded-lg px-4 py-2 text-[14px] font-medium ${
                  viewMode === 'board' ? 'bg-[var(--accent-bg)] text-[var(--accent)]' : 'text-[var(--text-secondary)]'
                }`}
              >
                Board
              </button>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setNewBusiness(activeBusinesses[0]?.id || '')
                setShowNewTask(true)
              }}
              type="button"
              className="btn-primary !px-8 !py-4"
            >
              + New Task
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03, ease: [0.25, 0.1, 0.25, 1] as const }}
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-4"
            >
              <p className="footnote text-[var(--text-secondary)]">{s.label}</p>
              <p className={`data mt-1 text-[28px] font-bold ${s.color}`}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]"
              aria-hidden
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              aria-label="Search tasks"
              className="min-h-[44px] w-64 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] py-2 pl-9 pr-3 text-[17px] text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterBusiness('all')}
              className={`rounded-full px-4 py-2 text-[13px] border transition-all min-h-[44px] ${
                filterBusiness === 'all'
                  ? 'bg-[var(--accent-bg)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_25%,transparent)]'
                  : 'text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-secondary)]'
              }`}
            >
              All
            </button>
            {activeBusinesses.map((b) => (
              <button
                key={b.id}
                onClick={() => setFilterBusiness(b.id)}
                className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] transition-all ${
                  filterBusiness === b.id
                    ? `border-opacity-20 bg-opacity-10`
                    : 'border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
                style={
                  filterBusiness === b.id
                    ? {
                        backgroundColor: `${b.color}15`,
                        color: b.color,
                        borderColor: `${b.color}33`,
                      }
                    : undefined
                }
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                {b.name}
              </button>
            ))}
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[10px] px-3 py-2 min-h-[44px] text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          >
            <option value="all">Priority</option>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {p.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[10px] px-3 py-2 min-h-[44px] text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          >
            <option value="all">Tag</option>
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            disabled={suggestLoading}
            onClick={() => void handleSuggestTasks()}
            className="min-h-[44px] rounded-xl border border-[var(--border)] px-4 text-[15px] font-medium text-[var(--text-primary)] hover:border-[var(--accent)] disabled:opacity-40"
          >
            {suggestLoading ? 'Suggesting…' : 'Let AI suggest tasks'}
          </motion.button>
        </div>

        {viewMode === 'list' ? (
          <div>
            <AnimatePresence initial={false}>
              {showNewTask && (
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="bg-[var(--bg-elevated)] border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] rounded-2xl px-5 py-3.5 mb-2"
                >
                  <input
                    autoFocus
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleNewTask()
                      if (e.key === 'Escape') setShowNewTask(false)
                    }}
                    placeholder="What needs to get done?"
                    className="w-full bg-transparent text-[17px] font-medium text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none mb-3"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={newBusiness}
                      onChange={(e) => setNewBusiness(e.target.value)}
                      className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[10px] px-3 py-1.5 min-h-[44px] text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    >
                      {activeBusinesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    {PRIORITY_ORDER.map((p) => (
                      <button
                        key={p}
                        onClick={() => setNewPriority(p)}
                        className={`caption rounded-md px-3 py-2 min-h-[44px] border transition-all capitalize ${
                          newPriority === p
                            ? PRIORITY_PILL[p] + ' border-current/20'
                            : 'text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <select
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[10px] px-3 py-1.5 min-h-[44px] text-[15px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    >
                      <option value="">No tag</option>
                      {TAGS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}

              {incompleteTasks.map((task, i) => renderTaskCard(task, i))}
            </AnimatePresence>

            {incompleteTasks.length === 0 && !showNewTask && (
              <p className="py-8 text-center text-[17px] text-[var(--text-secondary)]">No tasks to show</p>
            )}
          </div>
        ) : (
          <TaskKanbanBoard
            tasks={filtered}
            onColumnChange={handleColumnChange}
            onTaskClick={(t) => setDetailTaskId(t.id)}
          />
        )}

        {completedTasks.length > 0 && (
          <div>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="mb-2 flex items-center gap-2 text-[17px] text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              <motion.svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                animate={{ rotate: showCompleted ? 0 : -90 }}
                transition={{ duration: 0.2 }}
              >
                <polyline points="6 9 12 15 18 9" />
              </motion.svg>
              Completed ({completedTasks.length})
            </button>

            <AnimatePresence>
              {showCompleted && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                  className="overflow-hidden"
                >
                  <div className="opacity-50">{completedTasks.map((task, i) => renderTaskCard(task, i))}</div>
                  <button
                    onClick={() => {
                      completedTasks.forEach((t) => deleteTask(t.id))
                      toast.success('Cleared completed tasks')
                    }}
                    className="text-[12px] text-rose-400 hover:text-rose-300 mt-2 transition-colors"
                  >
                    Clear completed
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <TaskDetailDrawer
          task={detailTask}
          open={detailTask != null}
          onOpenChange={(o) => {
            if (!o) setDetailTaskId(null)
          }}
          onRequestSkip={(id) => setSkipTaskId(id)}
        />

        <TaskSkipDrawer taskId={skipTaskId} onDismiss={() => setSkipTaskId(null)} />
      </div>
    </PageTransition>
  )
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <PageTransition>
          <div className="p-6 text-[var(--text-dim)]">Loading tasks…</div>
        </PageTransition>
      }
    >
      <TasksPageInner />
    </Suspense>
  )
}
