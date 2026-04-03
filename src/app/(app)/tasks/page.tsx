'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore, type Task, type Priority } from '@/stores/store'
import { TAGS, XP_VALUES, PRIORITY_COLORS } from '@/lib/constants'
import PageTransition from '@/components/PageTransition'

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
  crit: 'bg-rose-500',
  high: 'bg-amber-500',
  med: 'bg-blue-500',
  low: 'bg-slate-600',
}

const PRIORITY_PILL: Record<Priority, string> = {
  crit: 'bg-rose-500/15 text-rose-400',
  high: 'bg-amber-500/15 text-amber-400',
  med: 'bg-blue-500/15 text-blue-400',
  low: 'bg-slate-500/15 text-slate-400',
}

export default function TasksPage() {
  const { tasks, businesses, addTask, toggleTask, deleteTask, updateTask } = useStore()

  const [search, setSearch] = useState('')
  const [filterBusiness, setFilterBusiness] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterTag, setFilterTag] = useState<string>('all')

  // New task flow
  const [showNewTask, setShowNewTask] = useState(false)
  const [newText, setNewText] = useState('')
  const [newBusiness, setNewBusiness] = useState<string>('')
  const [newPriority, setNewPriority] = useState<Priority>('med')
  const [newTag, setNewTag] = useState<string>('')

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  // Completed section
  const [showCompleted, setShowCompleted] = useState(false)

  // XP animation
  const [xpAnimId, setXpAnimId] = useState<string | null>(null)

  // Stats
  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.done).length
  const todayStr = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const todayUndone = tasks.filter((t) => !t.done && t.createdAt.startsWith(todayStr)).length
  const thisWeekCount = tasks.filter((t) => t.createdAt >= weekAgo).length
  const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const doneToday = tasks.filter((t) => t.done && t.completedAt?.startsWith(todayStr))
  const xpToday = doneToday.reduce((s, t) => s + t.xpValue, 0)

  // Filtering
  const filtered = useMemo(() => {
    let result = tasks
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((t) => t.text.toLowerCase().includes(q))
    }
    if (filterBusiness !== 'all') result = result.filter((t) => t.businessId === filterBusiness)
    if (filterPriority !== 'all') result = result.filter((t) => t.priority === filterPriority)
    if (filterTag !== 'all') result = result.filter((t) => t.tag === filterTag)
    return result
  }, [tasks, search, filterBusiness, filterPriority, filterTag])

  const incompleteTasks = useMemo(() => sortTasks(filtered.filter((t) => !t.done)), [filtered])
  const completedTasks = useMemo(() => filtered.filter((t) => t.done).sort((a, b) =>
    new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime()
  ), [filtered])

  const handleNewTask = () => {
    const raw = newText.trim()
    if (!raw) return
    const parsed = parseTaskInput(raw)
    const priority = newPriority !== 'med' ? newPriority : parsed.priority
    const tag = newTag || parsed.tag
    const businessId = newBusiness || businesses[0]?.id || ''
    addTask({ businessId, text: parsed.text, priority, tag, done: false, xpValue: XP_VALUES[priority] })
    setNewText('')
    setNewPriority('med')
    setNewTag('')
    setNewBusiness('')
    setShowNewTask(false)
    toast.success('Task added')
  }

  const handleToggle = (task: Task) => {
    toggleTask(task.id)
    if (!task.done) {
      setXpAnimId(task.id)
      setTimeout(() => setXpAnimId(null), 800)
      toast.success(`Task completed · +${task.xpValue} XP`)
    }
  }

  const handleInlineEdit = (task: Task) => {
    setEditingId(task.id)
    setEditText(task.text)
  }

  const saveInlineEdit = (id: string) => {
    if (editText.trim()) {
      updateTask(id, { text: editText.trim() })
    }
    setEditingId(null)
  }

  const getBusiness = (id: string) => businesses.find((b) => b.id === id)

  const stats = [
    { label: 'TODAY', value: todayUndone, color: 'text-white' },
    { label: 'THIS WEEK', value: thisWeekCount, color: 'text-white' },
    { label: 'DONE RATE', value: `${completionPct}%`, color: completionPct > 50 ? 'text-emerald-400' : 'text-amber-400' },
    { label: 'XP TODAY', value: `+${xpToday}`, color: 'text-purple-400' },
  ]

  const renderTaskCard = (task: Task, index: number) => {
    const biz = getBusiness(task.businessId)
    const isEditing = editingId === task.id

    return (
      <motion.div
        key={task.id}
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
        transition={{ duration: 0.2, delay: index * 0.04, ease: [0.25, 0.1, 0.25, 1] }}
        className="group bg-[#0e1018] border border-[#1e2338] rounded-[14px] px-[18px] py-[14px] mb-2 flex items-center gap-[14px] hover:border-[#2d3450] hover:bg-[#111520] hover:-translate-y-[1px] hover:shadow-lg transition-all duration-150 relative"
      >
        {/* Priority bar */}
        <div className={`w-1 h-10 rounded-full flex-shrink-0 ${PRIORITY_BAR_COLORS[task.priority]}`} />

        {/* Checkbox */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={() => handleToggle(task)}
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            task.done
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-[#2d3450] bg-transparent hover:border-emerald-500'
          }`}
        >
          {task.done && (
            <motion.svg
              width="10" height="10" viewBox="0 0 12 12" fill="none"
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
        </motion.button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveInlineEdit(task.id)
                if (e.key === 'Escape') setEditingId(null)
              }}
              onBlur={() => saveInlineEdit(task.id)}
              className="w-full bg-transparent text-[14px] font-medium text-white outline-none border-b border-emerald-500/40 pb-0.5"
            />
          ) : (
            <p
              onClick={() => !task.done && handleInlineEdit(task)}
              className={`text-[14px] font-medium text-white truncate cursor-text ${
                task.done ? 'opacity-40 line-through' : ''
              }`}
            >
              {task.text}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[9px] font-mono uppercase rounded-md px-2 py-0.5 ${PRIORITY_PILL[task.priority]}`}>
              {task.priority}
            </span>
            {task.tag && (
              <span className="text-[9px] font-mono uppercase rounded-md px-2 py-0.5 bg-cyan-500/15 text-cyan-400">
                {task.tag}
              </span>
            )}
            {biz && (
              <span className="flex items-center gap-1.5 text-[11px] text-[#8892b0]">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: biz.color }} />
                {biz.name}
              </span>
            )}
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={() => deleteTask(task.id)}
          className="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#1a1f2e] text-rose-400 transition-all flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* XP animation */}
        <AnimatePresence>
          {xpAnimId === task.id && (
            <motion.span
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -30 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
              className="absolute right-12 top-2 text-emerald-400 text-[12px] font-mono font-bold pointer-events-none"
            >
              +{task.xpValue} XP
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <PageTransition>
      <div className="p-6 max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-semibold text-white">Tasks</h1>
            <p className="text-[13px] text-[#8892b0]">{totalTasks} total &middot; {doneTasks} done</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setNewBusiness(businesses[0]?.id || '')
              setShowNewTask(true)
            }}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-[12px] px-5 py-2.5 text-[13px] font-semibold"
          >
            + New Task
          </motion.button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              className="bg-[#0e1018] border border-[#1e2338] rounded-[14px] p-4"
            >
              <p className="text-[10px] font-mono uppercase tracking-[2px] text-[#4a5278]">{s.label}</p>
              <p className={`text-[28px] font-mono font-bold ${s.color}`}>{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5278]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="w-64 bg-[#0e1018] border border-[#1e2338] rounded-[12px] pl-9 pr-3 py-2 text-[13px] text-white placeholder:text-[#4a5278] outline-none focus:border-[#2d3450] transition-colors"
            />
          </div>

          {/* Business pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterBusiness('all')}
              className={`rounded-full px-4 py-2 text-[12px] border transition-all ${
                filterBusiness === 'all'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'text-[#8892b0] border-transparent hover:bg-[#1a1f2e]'
              }`}
            >
              All
            </button>
            {businesses.map((b) => (
              <button
                key={b.id}
                onClick={() => setFilterBusiness(b.id)}
                className={`rounded-full px-4 py-2 text-[12px] border transition-all flex items-center gap-1.5 ${
                  filterBusiness === b.id
                    ? `border-opacity-20 bg-opacity-10`
                    : 'text-[#8892b0] border-transparent hover:bg-[#1a1f2e]'
                }`}
                style={filterBusiness === b.id ? {
                  backgroundColor: `${b.color}15`,
                  color: b.color,
                  borderColor: `${b.color}33`,
                } : undefined}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                {b.name}
              </button>
            ))}
          </div>

          {/* Priority dropdown */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-[#0e1018] border border-[#1e2338] rounded-[10px] px-3 py-2 text-[12px] text-white outline-none"
          >
            <option value="all">Priority</option>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>

          {/* Tag dropdown */}
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="bg-[#0e1018] border border-[#1e2338] rounded-[10px] px-3 py-2 text-[12px] text-white outline-none"
          >
            <option value="all">Tag</option>
            {TAGS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Task List */}
        <div>
          <AnimatePresence initial={false}>
            {/* New Task Card */}
            {showNewTask && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="bg-[#0e1018] border border-emerald-500/20 rounded-[14px] px-[18px] py-[14px] mb-2"
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
                  className="w-full bg-transparent text-[14px] font-medium text-white placeholder:text-[#4a5278] outline-none mb-3"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Business dropdown */}
                  <select
                    value={newBusiness}
                    onChange={(e) => setNewBusiness(e.target.value)}
                    className="bg-[#0e1018] border border-[#1e2338] rounded-[10px] px-3 py-1.5 text-[12px] text-white outline-none"
                  >
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>

                  {/* Priority toggle buttons */}
                  {PRIORITY_ORDER.map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      className={`text-[11px] font-mono uppercase rounded-md px-3 py-1.5 border transition-all ${
                        newPriority === p
                          ? PRIORITY_PILL[p] + ' border-current/20'
                          : 'text-[#8892b0] border-[#1e2338] hover:bg-[#1a1f2e]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  {/* Tag dropdown */}
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="bg-[#0e1018] border border-[#1e2338] rounded-[10px] px-3 py-1.5 text-[12px] text-white outline-none"
                  >
                    <option value="">No tag</option>
                    {TAGS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {/* Incomplete tasks */}
            {incompleteTasks.map((task, i) => renderTaskCard(task, i))}
          </AnimatePresence>

          {/* Empty state */}
          {incompleteTasks.length === 0 && !showNewTask && (
            <p className="text-center text-[13px] text-[#4a5278] py-8">No tasks to show</p>
          )}
        </div>

        {/* Completed Section */}
        {completedTasks.length > 0 && (
          <div>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-[13px] text-[#8892b0] hover:text-white transition-colors mb-2"
            >
              <motion.svg
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
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
                  <div className="opacity-50">
                    {completedTasks.map((task, i) => renderTaskCard(task, i))}
                  </div>
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
      </div>
    </PageTransition>
  )
}
