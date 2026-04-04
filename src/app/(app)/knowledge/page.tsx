'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore, KnowledgeEntry } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const TYPES = ['book', 'podcast', 'article', 'video', 'idea', 'framework', 'swipe'] as const
type KType = typeof TYPES[number]

const TYPE_META: Record<KType, { emoji: string; label: string }> = {
  book: { emoji: '📚', label: 'Books' },
  podcast: { emoji: '🎧', label: 'Podcasts' },
  article: { emoji: '📰', label: 'Articles' },
  video: { emoji: '🎬', label: 'Videos' },
  idea: { emoji: '💡', label: 'Ideas' },
  framework: { emoji: '🔧', label: 'Frameworks' },
  swipe: { emoji: '📌', label: 'Swipe File' },
}

export default function KnowledgePage() {
  const { knowledgeEntries, addKnowledge, deleteKnowledge } = useStore()
  const [filter, setFilter] = useState<'all' | KType>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')
  const [type, setType] = useState<KType>('book')
  const [takeaways, setTakeaways] = useState('')
  const [actionItem, setActionItem] = useState('')

  const filtered = filter === 'all' ? knowledgeEntries : knowledgeEntries.filter(e => e.type === filter)

  function handleSubmit() {
    if (!title.trim()) { toast.error('Title is required'); return }
    addKnowledge({ title: title.trim(), source: source.trim(), type, takeaways: takeaways.trim(), actionItem: actionItem.trim() || undefined })
    toast.success('Knowledge captured!')
    setTitle(''); setSource(''); setTakeaways(''); setActionItem(''); setShowForm(false)
  }

  return (
    <PageTransition>
      <div className="space-y-4 pb-24">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Knowledge Vault</h1>
          <p className="text-sm text-[var(--text-dim)] mt-1">Capture, organize, apply.</p>
        </div>

        {/* Quick Add */}
        <motion.div
          className="rounded-[16px] border border-[#1e2338] bg-[#0e1018] p-4"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        >
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full text-left text-sm text-[var(--text-dim)] bg-[var(--bg)] border border-[var(--border)] rounded-[12px] px-4 py-3 hover:border-[var(--accent)] transition-colors"
            >
              What did you learn?
            </button>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex gap-2">
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="flex-1 text-sm bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]" />
                <select value={type} onChange={e => setType(e.target.value as KType)} className="text-sm bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-3 py-2 text-[var(--text)] focus:outline-none focus:border-[var(--accent)]">
                  {TYPES.map(t => <option key={t} value={t}>{TYPE_META[t].emoji} {TYPE_META[t].label}</option>)}
                </select>
              </div>
              <input value={source} onChange={e => setSource(e.target.value)} placeholder="Source (author, URL, etc.)" className="w-full text-sm bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]" />
              <textarea value={takeaways} onChange={e => setTakeaways(e.target.value)} placeholder="Key takeaways..." rows={3} className="w-full text-sm bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] resize-none" />
              <input value={actionItem} onChange={e => setActionItem(e.target.value)} placeholder="Action item (optional)" className="w-full text-sm bg-[var(--bg)] border border-[var(--border)] rounded-[10px] px-3 py-2 text-[var(--text)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)]" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowForm(false)} className="text-xs text-[var(--text-dim)] px-3 py-1.5 rounded-[8px] hover:bg-[var(--border)] transition-colors">Cancel</button>
                <button onClick={handleSubmit} className="text-xs font-medium text-white bg-[var(--accent)] px-4 py-1.5 rounded-[8px] hover:opacity-90 transition-opacity">Save</button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(['all', ...TYPES] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-colors ${filter === t ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg)] text-[var(--text-dim)] border border-[var(--border)] hover:border-[var(--accent)]'}`}
            >
              {t === 'all' ? 'All' : `${TYPE_META[t].emoji} ${TYPE_META[t].label}`}
            </button>
          ))}
        </div>

        {/* Entries Grid */}
        {filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[16px] border border-[#1e2338] bg-[#0e1018] p-8 text-center">
            <p className="text-sm text-[var(--text-dim)]">Your second brain starts here. Capture something you learned today.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {filtered.map(entry => {
                const isExpanded = expanded === entry.id
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    onClick={() => setExpanded(isExpanded ? null : entry.id)}
                    className="group relative rounded-[16px] border border-[#1e2338] bg-[#0e1018] p-4 cursor-pointer hover:border-[var(--accent)]/40 transition-colors"
                  >
                    {/* Delete */}
                    <button
                      onClick={e => { e.stopPropagation(); deleteKnowledge(entry.id); toast.success('Deleted') }}
                      className="absolute top-3 right-3 text-[var(--text-dim)] opacity-0 group-hover:opacity-100 hover:text-[var(--rose)] transition-all text-xs"
                    >
                      ✕
                    </button>

                    <div className="flex items-start gap-2">
                      <span className="text-base">{TYPE_META[entry.type]?.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-[var(--text)] leading-tight">{entry.title}</p>
                        {entry.source && <p className="text-[12px] text-[var(--text-mid)] mt-0.5">{entry.source}</p>}
                      </div>
                    </div>

                    {entry.takeaways && (
                      <p className={`text-[13px] text-[var(--text-dim)] mt-2 ${isExpanded ? '' : 'line-clamp-3'}`}>
                        {entry.takeaways}
                      </p>
                    )}

                    {entry.actionItem && (
                      <span className="inline-block mt-2 text-[11px] font-medium bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full">
                        {entry.actionItem}
                      </span>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
