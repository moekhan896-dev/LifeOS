'use client'

import { useState } from 'react'
import { useStore, type SOP } from '@/stores/store'
import { BUSINESSES } from '@/lib/constants'

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  not_started: { bg: 'bg-[var(--text-dim)]/20 text-[var(--text-dim)]', label: 'Not Started' },
  in_progress: { bg: 'bg-[var(--amber)]/20 text-[var(--amber)]', label: 'In Progress' },
  documented: { bg: 'bg-[var(--accent)]/20 text-[var(--accent)]', label: 'Documented' },
}

export default function SopsPage() {
  const { sops, addSop, updateSop } = useStore()
  const [newTitle, setNewTitle] = useState('')
  const [newBiz, setNewBiz] = useState('agency')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  let ai = 0

  const handleAdd = () => {
    if (!newTitle.trim()) return
    addSop({ businessId: newBiz, title: newTitle.trim(), status: 'not_started' })
    setNewTitle('')
  }

  const documented = sops.filter((s) => s.status === 'documented').length
  const pct = sops.length > 0 ? Math.round((documented / sops.length) * 100) : 0

  return (
    <div className="space-y-6 pb-24">
      <h1 className="animate-in text-2xl font-bold text-[var(--text)]" style={{ animationDelay: `${0.05 * ai++}s` }}>
        SOP Library
      </h1>

      {/* Completion bar */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="label text-[10px] tracking-widest text-[var(--accent)]">DOCUMENTATION PROGRESS</span>
          <span className="data text-sm font-semibold text-[var(--accent)]">{pct}%</span>
        </div>
        <div className="h-3 rounded-full bg-[var(--border)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-[var(--text-dim)]">{documented} of {sops.length} SOPs documented</p>
      </div>

      {/* Add SOP */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <div className="flex gap-2">
          <select
            value={newBiz}
            onChange={(e) => setNewBiz(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-xs text-[var(--text)] outline-none"
          >
            {BUSINESSES.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="SOP title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)]"
          />
          <button onClick={handleAdd} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--bg)]">
            Add SOP
          </button>
        </div>
      </div>

      {/* SOPs list */}
      <div className="space-y-2">
        {sops.map((sop, idx) => {
          const expanded = expandedId === sop.id
          const biz = BUSINESSES.find((b) => b.id === sop.businessId)
          const st = STATUS_STYLES[sop.status]
          return (
            <div
              key={sop.id}
              className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
              style={{ animationDelay: `${0.05 * (ai + idx)}s` }}
            >
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() => setExpandedId(expanded ? null : sop.id)}
              >
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: biz?.color || '#666' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text)]">{sop.title}</p>
                  <p className="text-xs text-[var(--text-dim)]">{biz?.name}</p>
                </div>
                <select
                  value={sop.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => updateSop(sop.id, { status: e.target.value as SOP['status'] })}
                  className={`rounded-lg px-2 py-1 text-[10px] font-semibold border-0 outline-none cursor-pointer ${st.bg}`}
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="documented">Documented</option>
                </select>
                <span className="text-[var(--text-dim)] text-xs">{expanded ? '\u25B2' : '\u25BC'}</span>
              </div>
              {expanded && (
                <div className="border-t border-[var(--border)] p-4">
                  <textarea
                    value={sop.content || ''}
                    onChange={(e) => updateSop(sop.id, { content: e.target.value })}
                    placeholder="Document this SOP..."
                    rows={6}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)] resize-y"
                  />
                </div>
              )}
            </div>
          )
        })}
        {sops.length === 0 && (
          <p className="text-center text-sm text-[var(--text-dim)] py-12">No SOPs yet. Start documenting your processes.</p>
        )}
      </div>
    </div>
  )
}
