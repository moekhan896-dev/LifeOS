'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useStore, type Task, type Priority } from '@/stores/store'
import { BUSINESSES, TAGS, XP_VALUES, PRIORITY_COLORS } from '@/lib/constants'
import TaskItem from '@/components/TaskItem'

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
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setAnimateIn(true))
  }, [])

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
  }

  const handleQuickAdd = () => {
    const raw = quickText.trim()
    if (!raw) return
    const { text, priority, tag } = parseTaskInput(raw)
    if (!text) return
    addTask({ businessId: quickBusiness, text, priority, tag, done: false, xpValue: XP_VALUES[priority] })
    setQuickText('')
    setShowQuickAdd(false)
  }

  return (
    <div className={`p-6 max-w-5xl mx-auto space-y-6 transition-all duration-500 ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="label text-2xl tracking-widest">TASKS</h1>
          <p className="text-[var(--text-dim)] text-xs mt-1">{totalTasks} total &middot; {doneTasks} done</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-40 h-2 rounded-full bg-[var(--surface2)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${completionPct}%` }} />
          </div>
          <span className="data text-sm text-[var(--accent)]">{completionPct}%</span>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Today', value: tasksToday },
          { label: 'This Week', value: tasksThisWeek },
          { label: 'Done Rate', value: `${completionPct}%` },
          { label: 'XP Today', value: `+${xpToday}` },
        ].map((s) => (
          <div key={s.label} className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] px-4 py-3 text-center">
            <p className="label text-[10px] tracking-wider text-[var(--text-dim)]">{s.label}</p>
            <p className="data text-lg font-semibold text-[var(--text)]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks..."
          className="bg-transparent border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)] w-44 transition-colors"
        />
        <div className="h-4 w-px bg-[var(--border)]" />

        {/* Business tabs */}
        {[{ id: 'all', name: 'All' }, ...BUSINESSES].map((b) => (
          <button
            key={b.id}
            onClick={() => setFilterBusiness(b.id)}
            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
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

        {/* Priority filter */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-2 py-1 text-[11px] text-[var(--text)] outline-none"
        >
          <option value="all">Priority</option>
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>{p.toUpperCase()}</option>
          ))}
        </select>

        {/* Tag filter */}
        <select
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value)}
          className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-2 py-1 text-[11px] text-[var(--text)] outline-none"
        >
          <option value="all">Tag</option>
          {TAGS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* Grouped tasks */}
      <div className="space-y-4">
        {BUSINESSES.map((biz) => {
          const bizTasks = grouped[biz.id] || []
          if (filterBusiness !== 'all' && filterBusiness !== biz.id) return null
          const isCollapsed = collapsed[biz.id]
          const bizDone = bizTasks.filter((t) => t.done).length

          return (
            <div key={biz.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-hidden">
              {/* Section header */}
              <button
                onClick={() => toggle(biz.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[var(--surface2)] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: biz.color }} />
                  <span className="label text-sm tracking-wide">{biz.name}</span>
                  <span className="text-[10px] text-[var(--text-dim)] bg-[var(--surface2)] px-1.5 py-0.5 rounded-md">
                    {bizDone}/{bizTasks.length}
                  </span>
                </div>
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round"
                  className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Task list */}
              {!isCollapsed && (
                <div className="px-3 pb-3 space-y-1.5">
                  {bizTasks.length === 0 && (
                    <p className="text-[11px] text-[var(--text-dim)] text-center py-3 italic">No tasks yet</p>
                  )}
                  {sortTasks(bizTasks).map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}

                  {/* Inline add */}
                  <div className="mt-2">
                    <input
                      value={inlineInputs[biz.id] || ''}
                      onChange={(e) => setInlineInputs((p) => ({ ...p, [biz.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleInlineAdd(biz.id)}
                      placeholder="+ Add task... (!crit !high !low #TAG)"
                      className="w-full bg-transparent border border-dashed border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-dim)]/50 outline-none focus:border-[var(--accent)] transition-colors"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[var(--accent)] text-[var(--bg)] flex items-center justify-center shadow-lg shadow-[var(--accent)]/25 hover:scale-110 active:scale-95 transition-transform z-50"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowQuickAdd(false)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-6 w-full max-w-md space-y-4 animate-in">
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
              className="w-full bg-transparent border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)] transition-colors"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowQuickAdd(false)} className="px-4 py-2 text-xs text-[var(--text-dim)] hover:text-[var(--text)] transition-colors">Cancel</button>
              <button onClick={handleQuickAdd} className="px-4 py-2 text-xs bg-[var(--accent)] text-[var(--bg)] rounded-lg font-semibold hover:brightness-110 transition-all">Add Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
