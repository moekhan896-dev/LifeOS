'use client'

import { useState } from 'react'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

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

  const handleAdd = () => {
    if (!text.trim()) return
    addIdea(text.trim(), category)
    setText('')
    toast('Idea captured')
  }

  const visible = ideas
    .filter((i) => !i.archived)
    .filter((i) => filterCat === 'all' || i.category === filterCat)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <PageTransition>
      <div className="space-y-4 pb-24">
        <h1 className="text-2xl font-bold text-[var(--text)]">Idea Bank</h1>

        <p className="text-xs text-[var(--text-dim)] italic">
          Ideas are not obligations. Capture freely. Promote only what matters.
        </p>

        {/* Input */}
        <div className="card p-3">
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
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAdd}
              className="rounded-[8px] bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--bg)]"
            >
              Save
            </motion.button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['all', ...CATEGORIES].map((c) => (
            <motion.button
              key={c}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFilterCat(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filterCat === c ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface)] text-[var(--text-dim)] border border-[var(--border)]'
              }`}
            >
              {c}
            </motion.button>
          ))}
        </div>

        {/* Ideas list */}
        <StaggerContainer className="space-y-2">
          <AnimatePresence>
            {visible.map((idea) => (
              <StaggerItem key={idea.id}>
                <motion.div
                  layout
                  className={`card p-3 ${idea.promoted ? 'border-[var(--accent)]/40' : ''}`}
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
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            promoteIdea(idea.id)
                            toast('Idea promoted to task')
                          }}
                          className="rounded-lg bg-[var(--accent)]/10 px-2.5 py-1.5 text-[10px] font-medium text-[var(--accent)]"
                        >
                          Promote
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          archiveIdea(idea.id)
                          toast('Idea archived')
                        }}
                        className="rounded-lg bg-[var(--rose)]/10 px-2.5 py-1.5 text-[10px] font-medium text-[var(--rose)]"
                      >
                        Kill
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </AnimatePresence>
          {visible.length === 0 && (
            <p className="text-center text-sm text-[var(--text-dim)] py-12">No ideas yet. Start capturing.</p>
          )}
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
