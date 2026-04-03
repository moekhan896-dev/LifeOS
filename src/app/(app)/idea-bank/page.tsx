'use client'

import { useState } from 'react'
import { useStore } from '@/stores/store'

const CATEGORIES = ['business', 'content', 'product', 'other'] as const
const CAT_COLORS: Record<string, string> = {
  business: 'bg-[var(--accent)]/15 text-[var(--accent)]',
  content: 'bg-[var(--pink)]/15 text-[var(--pink)]',
  product: 'bg-[var(--purple)]/15 text-[var(--purple)]',
  other: 'bg-[var(--text-dim)]/15 text-[var(--text-dim)]',
}

export default function IdeaBankPage() {
  const { ideas, addIdea, promoteIdea, archiveIdea } = useStore()
  const [text, setText] = useState('')
  const [category, setCategory] = useState<string>('business')
  const [filterCat, setFilterCat] = useState<string>('all')
  let ai = 0

  const handleAdd = () => {
    if (!text.trim()) return
    addIdea(text.trim(), category)
    setText('')
  }

  const visible = ideas
    .filter((i) => !i.archived)
    .filter((i) => filterCat === 'all' || i.category === filterCat)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div className="space-y-6 pb-24">
      <h1 className="animate-in text-2xl font-bold text-[var(--text)]" style={{ animationDelay: `${0.05 * ai++}s` }}>
        Idea Bank
      </h1>

      <p className="animate-in text-xs text-[var(--text-dim)] italic" style={{ animationDelay: `${0.05 * ai++}s` }}>
        Ideas are not obligations. Capture freely. Promote only what matters.
      </p>

      {/* Input */}
      <div className="animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4" style={{ animationDelay: `${0.05 * ai++}s` }}>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Capture an idea..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none focus:border-[var(--accent)]"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-xs text-[var(--text)] outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button onClick={handleAdd} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--bg)]">
            Save
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="animate-in flex gap-2" style={{ animationDelay: `${0.05 * ai++}s` }}>
        {['all', ...CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterCat === c ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface)] text-[var(--text-dim)] border border-[var(--border)]'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Ideas list */}
      <div className="space-y-2">
        {visible.map((idea, idx) => (
          <div
            key={idea.id}
            className={`animate-in rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 ${idea.promoted ? 'border-[var(--accent)]/40' : ''}`}
            style={{ animationDelay: `${0.05 * (ai + idx)}s` }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text)]">{idea.text}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-lg px-2 py-0.5 text-[10px] font-medium ${CAT_COLORS[idea.category] || CAT_COLORS.other}`}>
                    {idea.category}
                  </span>
                  <span className="text-[10px] text-[var(--text-dim)]">
                    {new Date(idea.createdAt).toLocaleDateString()}
                  </span>
                  {idea.promoted && (
                    <span className="text-[10px] font-semibold text-[var(--accent)]">PROMOTED</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {!idea.promoted && (
                  <button
                    onClick={() => promoteIdea(idea.id)}
                    className="rounded-lg bg-[var(--accent)]/10 px-2.5 py-1.5 text-[10px] font-medium text-[var(--accent)]"
                  >
                    Promote
                  </button>
                )}
                <button
                  onClick={() => archiveIdea(idea.id)}
                  className="rounded-lg bg-[var(--rose)]/10 px-2.5 py-1.5 text-[10px] font-medium text-[var(--rose)]"
                >
                  Kill
                </button>
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-center text-sm text-[var(--text-dim)] py-12">No ideas yet. Start capturing.</p>
        )}
      </div>
    </div>
  )
}
