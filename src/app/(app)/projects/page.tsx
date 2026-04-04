'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore, type ProjectStatus } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const card = 'bg-[#0e1018] border border-[#1e2338] rounded-[16px] p-5'
const label = 'text-[10px] font-mono uppercase tracking-widest text-slate-500'
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }
const fadeUp = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }

const STATUS_BADGE: Record<ProjectStatus, string> = {
  not_started: 'bg-slate-500/15 text-slate-400',
  in_progress: 'bg-blue-500/15 text-blue-400',
  blocked: 'bg-rose-500/15 text-rose-400',
  complete: 'bg-emerald-500/15 text-emerald-400',
}

function ProgressRing({ progress, size = 48 }: { progress: number; size?: number }) {
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e2338" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#8b5cf6" strokeWidth={3}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className="transition-all duration-500" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dy="0.35em"
        className="fill-white text-[10px] font-semibold" transform={`rotate(90 ${size / 2} ${size / 2})`}
      >{progress}%</text>
    </svg>
  )
}

export default function ProjectsPage() {
  const {
    projects, addProject, updateProject, deleteProject,
    tasks, goals, businesses,
  } = useStore()

  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', businessId: '', goalId: '',
    impact: 5, confidence: 5, ease: 5, deadline: '',
  })

  const active = projects.filter(p => p.status === 'in_progress')
  const backlog = [...projects.filter(p => p.status === 'not_started')]
    .sort((a, b) => (b.impact * b.confidence * b.ease) - (a.impact * a.confidence * a.ease))
  const blocked = projects.filter(p => p.status === 'blocked')
  const completed = projects.filter(p => p.status === 'complete')

  function ice(p: { impact: number; confidence: number; ease: number }) {
    return p.impact * p.confidence * p.ease
  }

  function getBiz(id?: string) { return businesses.find(b => b.id === id) }
  function getGoal(id?: string) { return goals.find(g => g.id === id) }
  function taskCount(projectId: string) { return tasks.filter(t => t.projectId === projectId).length }

  function submitProject() {
    if (!form.name.trim()) { toast.error('Name required'); return }
    addProject({
      name: form.name.trim(),
      description: form.description.trim(),
      businessId: form.businessId || undefined,
      goalId: form.goalId || undefined,
      impact: form.impact, confidence: form.confidence, ease: form.ease,
      status: 'not_started', progress: 0,
      deadline: form.deadline || undefined,
    })
    setForm({ name: '', description: '', businessId: '', goalId: '', impact: 5, confidence: 5, ease: 5, deadline: '' })
    setShowForm(false)
    toast.success('Project added to backlog')
  }

  function startProject(id: string) {
    if (active.length >= 3) {
      toast.error('WIP limit reached. Finish or pause one first.')
      return
    }
    updateProject(id, { status: 'in_progress' })
    toast.success('Project activated')
  }

  function renderProjectCard(p: typeof projects[0], isActive: boolean) {
    const biz = getBiz(p.businessId)
    const goal = getGoal(p.goalId)
    const tCount = taskCount(p.id)
    const isExpanded = expanded === p.id
    const linkedTasks = tasks.filter(t => t.projectId === p.id)

    return (
      <motion.div key={p.id} variants={fadeUp} layout
        whileHover={{ scale: 1.005 }}
        className={`${card} space-y-3 ${isActive ? 'border-l-[3px]' : ''}`}
        style={isActive && biz ? { borderLeftColor: biz.color } : undefined}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-semibold text-white ${isActive ? 'text-[18px]' : 'text-sm'}`}>{p.name}</h3>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ${STATUS_BADGE[p.status]}`}>{p.status.replace('_', ' ')}</span>
              <span className="text-[10px] font-mono bg-purple-500/15 text-purple-400 rounded-md px-2 py-0.5">
                ICE {p.impact}×{p.confidence}×{p.ease} = {ice(p)}
              </span>
            </div>
            {p.description && <p className="text-[13px] text-slate-400 mt-1 truncate">{p.description}</p>}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {biz && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: biz.color }} />{biz.name}
                </span>
              )}
              {goal && <span className="text-[11px] text-slate-400">Goal: {goal.title}</span>}
              <span className="text-[11px] text-slate-500">{tCount} task{tCount !== 1 ? 's' : ''}</span>
              {p.deadline && <span className="text-[11px] text-slate-500">Due {p.deadline}</span>}
            </div>
          </div>
          {isActive && <ProgressRing progress={p.progress} />}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          {p.status === 'not_started' && (
            <button onClick={() => startProject(p.id)}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg transition">Start</button>
          )}
          {p.status === 'in_progress' && (
            <>
              <button onClick={() => updateProject(p.id, { status: 'complete', progress: 100 })}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg transition">Complete</button>
              <button onClick={() => updateProject(p.id, { status: 'not_started' })}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded-lg transition">Pause</button>
            </>
          )}
          {p.status === 'blocked' && (
            <button onClick={() => updateProject(p.id, { status: 'in_progress' })}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg transition">Unblock</button>
          )}
          <button onClick={() => setExpanded(isExpanded ? null : p.id)}
            className="text-xs text-slate-400 hover:text-white transition">{isExpanded ? 'Collapse' : 'Expand'}</button>
          <button onClick={() => { deleteProject(p.id); toast('Deleted') }}
            className="text-xs text-slate-600 hover:text-rose-400 transition ml-auto">Delete</button>
        </div>

        {/* Expanded: linked tasks + edit */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3 pt-2 border-t border-[#1e2338]"
            >
              {linkedTasks.length > 0 ? (
                <div className="space-y-1">
                  <p className={label}>Linked Tasks</p>
                  {linkedTasks.map(t => (
                    <div key={t.id} className="flex items-center gap-2 text-sm">
                      <span className={`w-1.5 h-1.5 rounded-full ${t.done ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                      <span className={t.done ? 'text-slate-500 line-through' : 'text-slate-300'}>{t.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No tasks linked to this project yet.</p>
              )}

              {/* Inline edit progress */}
              {p.status === 'in_progress' && (
                <div className="space-y-1">
                  <p className={label}>Progress</p>
                  <input type="range" min={0} max={100} value={p.progress}
                    onChange={e => updateProject(p.id, { progress: Number(e.target.value) })}
                    className="w-full accent-purple-500" />
                </div>
              )}

              {/* Edit ICE */}
              <div className="grid grid-cols-3 gap-2">
                {(['impact', 'confidence', 'ease'] as const).map(k => (
                  <div key={k} className="space-y-1">
                    <p className={label}>{k}</p>
                    <input type="range" min={1} max={10}
                      value={p[k]}
                      onChange={e => updateProject(p.id, { [k]: Number(e.target.value) })}
                      className="w-full accent-purple-500" />
                    <p className="text-xs text-center text-slate-400">{p[k]}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Projects</h1>
            <p className="text-sm text-slate-400 mt-1">Maximum 3 active at a time.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-mono px-2 py-1 rounded-lg ${active.length >= 3 ? 'bg-amber-500/15 text-amber-400' : 'bg-blue-500/15 text-blue-400'}`}>
              {active.length}/3 active
            </span>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(!showForm)}
              className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 py-2 rounded-[12px] transition"
            >{showForm ? 'Cancel' : '+ New Project'}</motion.button>
          </div>
        </div>

        {/* WIP Warning */}
        {active.length >= 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-[12px] p-4 text-sm text-amber-300">
            You have 3 active projects. Finish or pause one first.
          </motion.div>
        )}

        {/* Add Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden"
            >
              <div className={`${card} space-y-4`}>
                <p className="text-sm font-medium text-white">New Project</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Project name" className="bg-slate-900/50 border border-[#1e2338] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none col-span-full" />
                  <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Description (optional)" className="bg-slate-900/50 border border-[#1e2338] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none col-span-full" />
                  <select value={form.businessId} onChange={e => setForm(p => ({ ...p, businessId: e.target.value }))}
                    className="bg-slate-900/50 border border-[#1e2338] rounded-lg px-3 py-2 text-sm text-white outline-none">
                    <option value="">No business</option>
                    {businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <select value={form.goalId} onChange={e => setForm(p => ({ ...p, goalId: e.target.value }))}
                    className="bg-slate-900/50 border border-[#1e2338] rounded-lg px-3 py-2 text-sm text-white outline-none">
                    <option value="">No goal</option>
                    {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                  </select>
                  <input type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))}
                    className="bg-slate-900/50 border border-[#1e2338] rounded-lg px-3 py-2 text-sm text-white outline-none" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {(['impact', 'confidence', 'ease'] as const).map(k => (
                    <div key={k} className="space-y-1">
                      <p className={label}>{k}</p>
                      <input type="range" min={1} max={10} value={form[k]}
                        onChange={e => setForm(p => ({ ...p, [k]: Number(e.target.value) }))}
                        className="w-full accent-purple-500" />
                      <p className="text-xs text-center text-slate-400">{form[k]}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-purple-400 font-mono">ICE Score: {form.impact} × {form.confidence} × {form.ease} = {form.impact * form.confidence * form.ease}</p>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={submitProject}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-5 py-2 rounded-[12px] transition">Add to Backlog</motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Projects */}
        {active.length > 0 && (
          <section className="space-y-3">
            <p className={label}>Active Projects</p>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
              {active.map(p => renderProjectCard(p, true))}
            </motion.div>
          </section>
        )}

        {/* Blocked */}
        {blocked.length > 0 && (
          <section className="space-y-3">
            <p className={label}>Blocked</p>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
              {blocked.map(p => renderProjectCard(p, false))}
            </motion.div>
          </section>
        )}

        {/* Backlog */}
        {backlog.length > 0 && (
          <section className="space-y-3">
            <p className={label}>Backlog <span className="text-slate-600">(sorted by ICE)</span></p>
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
              {backlog.map(p => renderProjectCard(p, false))}
            </motion.div>
          </section>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <section className="space-y-3">
            <button onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2">
              <p className={label}>Completed ({completed.length})</p>
              <span className="text-slate-500 text-xs">{showCompleted ? '▾' : '▸'}</span>
            </button>
            <AnimatePresence>
              {showCompleted && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-2"
                >
                  {completed.map(p => renderProjectCard(p, false))}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* Empty state */}
        {projects.length === 0 && !showForm && (
          <div className={`${card} text-center py-12`}>
            <p className="text-slate-400 text-sm">No projects yet.</p>
            <p className="text-slate-500 text-xs mt-1">Create your first project to start tracking progress with ICE scoring.</p>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
