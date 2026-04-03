'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useStore, type Task, type Priority } from '@/stores/store'
import { BUSINESSES, TAGS, XP_VALUES, PRIORITY_COLORS } from '@/lib/constants'
import TaskItem from '@/components/TaskItem'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'

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

/* ── Sortable wrapper ── */
function SortableTask({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        y: 0,
        scale: isDragging ? 1.02 : 1,
        boxShadow: isDragging
          ? '0 8px 24px rgba(0,0,0,0.25)'
          : '0 0px 0px rgba(0,0,0,0)',
      }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <TaskItem task={task} />
    </motion.div>
  )
}

export default function TasksPage() {
  const { tasks, addTask, toggleTask, deleteTask } = useStore()
  const [search, setSearch] = useState('')
  const [filterBusiness, setFilterBusiness] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterTag, setFilterTag] = useState<string>('all')
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [inlineInputs, setInlineInputs] = useState<Record<string, string>>({})
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickText, setQuickText] = useState('')
  const [quickBusiness, setQuickBusiness] = useState<string>(BUSINESSES[0].id)
  const quickRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    if (showQuickAdd) quickRef.current?.focus()
  }, [showQuickAdd])

  const filtered = useMemo(() => {
    let result = tasks
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((t) => t.text.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q))
    }
    if (filterBusiness !== 'all') result = result.filter((t) => t.businessId === filterBusiness)
    if (filterPriority !== 'all') result = result.filter((t) => t.priority === filterPriority)
    if (filterTag !== 'all') result = result.filter((t) => t.tag === filterTag)
    return result
  }, [tasks, search, filterBusiness, filterPriority, filterTag])

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {}
    for (const b of BUSINESSES) map[b.id] = []
    for (const t of filtered) {
      if (!map[t.businessId]) map[t.businessId] = []
      map[t.businessId].push(t)
    }
    return map
  }, [filtered])

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.done).length
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const todayStr = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const tasksToday = tasks.filter((t) => t.createdAt.startsWith(todayStr)).length
  const tasksThisWeek = tasks.filter((t) => t.createdAt >= weekAgo).length
  const doneToday = tasks.filter((t) => t.done && t.completedAt?.startsWith(todayStr))
  const xpToday = doneToday.reduce((s, t) => s + t.xpValue, 0)

  const toggle = (id: string) => setCollapsed((p) => ({ ...p, [id]: !p[id] }))

  const handleInlineAdd = (businessId: string) => {
    const raw = inlineInputs[businessId]?.trim()
    if (!raw) return
    const { text, priority, tag } = parseTaskInput(raw)
    if (!text) return
    addTask({ businessId, text, priority, tag, done: false, xpValue: XP_VALUES[priority] })
    setInlineInputs((p) => ({ ...p, [businessId]: '' }))
    toast.success('Task added')
  }

  const handleQuickAdd = () => {
    const raw = quickText.trim()
    if (!raw) return
    const { text, priority, tag } = parseTaskInput(raw)
    if (!text) return
    addTask({ businessId: quickBusiness, text, priority, tag, done: false, xpValue: XP_VALUES[priority] })
    setQuickText('')
    setShowQuickAdd(false)
    toast.success('Task added')
  }

  const handleDragEnd = (_event: DragEndEvent) => {
    // Priority-based sorting is the source of truth.
    // Drag gives visual lift/feedback but snaps back on release.
  }

  const stats = [
    { label: 'Today', value: tasksToday },
    { label: 'This Week', value: tasksThisWeek },
    { label: 'Done Rate', value: `${completionPct}%` },
    { label: 'XP Today', value: `+${xpToday}` },
  ]

  return (
    <PageTransition>
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="label text-2xl tracking-widest">TASKS</h1>
            <p className="text-[var(--text-dim)] text-xs mt-1">{totalTasks} total &middot; {doneTasks} done</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-40 h-2 rounded-full bg-[var(--surface2)] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--accent)]"
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="data text-sm text-[var(--accent)]">{completionPct}%</span>
          </div>
        </div>

        {/* Stats bar */}
        <StaggerContainer className="grid grid-cols-4 gap-2">
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] px-3 py-2 text-center cursor-default"
              >
                <p className="label text-[10px] tracking-wider text-[var(--text-dim)]">{s.label}</p>
                <p className="data text-lg font-semibold text-[var(--text)]">{s.value}</p>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Filters */}
        <StaggerContainer>
          <StaggerItem>
            <div className="flex flex-wrap items-center gap-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-2.5">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="bg-transparent border border-[var(--border)] rounded-lg px-2.5 py-1 text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)] w-40 transition-colors"
              />
              <div className="h-4 w-px bg-[var(--border)]" />

              {[{ id: 'all', name: 'All' }, ...BUSINESSES].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setFilterBusiness(b.id)}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                    filterBusiness === b.id
                      ? 'bg-[var(--accent)]/15 border-[var(--accent)]/40 text-[var(--accent)]'
                      : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text)]'
                  }`}
                >
                  {'color' in b && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: (b as any).color }} />}
                  {b.name}
                </button>
              ))}

              <div className="h-4 w-px bg-[var(--border)]" />

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-2 py-0.5 text-[11px] text-[var(--text)] outline-none"
              >
                <option value="all">Priority</option>
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>{p.toUpperCase()}</option>
                ))}
              </select>

              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-2 py-0.5 text-[11px] text-[var(--text)] outline-none"
              >
                <option value="all">Tag</option>
                {TAGS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Grouped tasks */}
        <div className="space-y-3">
          {BUSINESSES.map((biz) => {
            const bizTasks = grouped[biz.id] || []
            if (filterBusiness !== 'all' && filterBusiness !== biz.id) return null
            const isCollapsed = collapsed[biz.id]
            const bizDone = bizTasks.filter((t) => t.done).length
            const sorted = sortTasks(bizTasks)

            return (
              <motion.div
                key={biz.id}
                layout
                className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-hidden"
              >
                {/* Section header */}
                <button
                  onClick={() => toggle(biz.id)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--surface2)] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: biz.color }} />
                    <span className="label text-sm tracking-wide">{biz.name}</span>
                    <span className="text-[10px] text-[var(--text-dim)] bg-[var(--surface2)] px-1.5 py-0.5 rounded-md">
                      {bizDone}/{bizTasks.length}
                    </span>
                  </div>
                  <motion.svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round"
                    animate={{ rotate: isCollapsed ? -90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </motion.svg>
                </button>

                {/* Task list */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-2.5 pb-2.5 space-y-1">
                        {bizTasks.length === 0 && (
                          <p className="text-[11px] text-[var(--text-dim)] text-center py-3 italic">No tasks yet</p>
                        )}
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleDragEnd}
                        >
                          <SortableContext
                            items={sorted.map((t) => t.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <AnimatePresence initial={false}>
                              {sorted.map((task) => (
                                <SortableTask key={task.id} task={task} />
                              ))}
                            </AnimatePresence>
                          </SortableContext>
                        </DndContext>

                        {/* Inline add */}
                        <div className="mt-1.5">
                          <input
                            value={inlineInputs[biz.id] || ''}
                            onChange={(e) => setInlineInputs((p) => ({ ...p, [biz.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && handleInlineAdd(biz.id)}
                            placeholder="+ Add task... (!crit !high !low #TAG)"
                            className="w-full bg-transparent border border-dashed border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-dim)]/50 outline-none focus:border-[var(--accent)] transition-colors"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* FAB */}
        <motion.button
          onClick={() => setShowQuickAdd(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--accent)] text-[var(--bg)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/25 z-50"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.button>

        {/* Quick Add Modal */}
        <AnimatePresence>
          {showQuickAdd && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
              onClick={() => setShowQuickAdd(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-6 w-full max-w-md space-y-4"
              >
                <h2 className="label text-lg tracking-wider">QUICK ADD</h2>
                <select
                  value={quickBusiness}
                  onChange={(e) => setQuickBusiness(e.target.value)}
                  className="w-full bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] outline-none"
                >
                  {BUSINESSES.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <input
                  ref={quickRef}
                  value={quickText}
                  onChange={(e) => setQuickText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                  placeholder="Task description... (!crit !high !low #TAG)"
                  className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)] transition-colors"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowQuickAdd(false)} className="px-4 py-1.5 text-xs text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">Cancel</button>
                  <button onClick={handleQuickAdd} className="px-4 py-1.5 text-xs bg-[var(--accent)] text-[var(--bg)] rounded-lg font-semibold hover:brightness-110 transition-all">Add Task</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  )
}
