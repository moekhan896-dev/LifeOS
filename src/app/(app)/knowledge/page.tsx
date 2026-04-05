'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore, isArchived, type KnowledgeEntry, type KnowledgeVaultStatus } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const TYPES = ['book', 'podcast', 'article', 'video', 'idea', 'framework', 'swipe'] as const
type KType = (typeof TYPES)[number]

const TYPE_META: Record<KType, { emoji: string; label: string }> = {
  book: { emoji: '📚', label: 'Books' },
  podcast: { emoji: '🎧', label: 'Podcasts' },
  article: { emoji: '📰', label: 'Articles' },
  video: { emoji: '🎬', label: 'Videos' },
  idea: { emoji: '💡', label: 'Ideas' },
  framework: { emoji: '🔧', label: 'Frameworks' },
  swipe: { emoji: '📌', label: 'Swipe File' },
}

const STATUS_FLOW: { value: KnowledgeVaultStatus; label: string }[] = [
  { value: 'captured', label: 'Captured' },
  { value: 'processing', label: 'Processing' },
  { value: 'applied', label: 'Applied' },
  { value: 'archived', label: 'Archived' },
]

export default function KnowledgePage() {
  const { knowledgeEntries, addKnowledge, updateKnowledge, deleteKnowledge, addTask, businesses } = useStore()
  const [filter, setFilter] = useState<'all' | KType>('all')
  const [statusFilter, setStatusFilter] = useState<KnowledgeVaultStatus | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')
  const [type, setType] = useState<KType>('book')
  const [takeaways, setTakeaways] = useState('')
  const [whatDo, setWhatDo] = useState('')

  const filtered = knowledgeEntries.filter((e) => {
    if (filter !== 'all' && e.type !== filter) return false
    const st = e.status ?? 'captured'
    if (statusFilter !== 'all' && st !== statusFilter) return false
    return true
  })

  function handleSubmit() {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    const kid = addKnowledge({
      title: title.trim(),
      source: source.trim(),
      type,
      takeaways: takeaways.trim(),
      actionItem: whatDo.trim() || undefined,
      status: 'captured',
    })
    const doText = whatDo.trim()
    if (doText) {
      const bid = businesses.find((b) => !isArchived(b))?.id ?? ''
      const tid = addTask({
        businessId: bid,
        text: doText,
        tag: 'knowledge',
        priority: 'med',
        done: false,
        xpValue: 5,
      })
      updateKnowledge(kid, { linkedTaskId: tid })
    }
    toast.success('Knowledge captured!')
    setTitle('')
    setSource('')
    setTakeaways('')
    setWhatDo('')
    setShowForm(false)
  }

  return (
    <PageTransition>
      <div className="space-y-4 pb-24">
        <div>
          <h1 className="title">Knowledge Vault</h1>
          <p className="subheadline mt-1">Capture → process → apply.</p>
        </div>

        <motion.div className="card rounded-2xl p-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full rounded-[12px] border border-[var(--border)] px-4 py-3 text-left text-sm text-[var(--text-dim)] hover:border-[var(--accent)]"
            >
              What did you learn?
            </button>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="flex-1 rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as KType)}
                  className="rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {TYPE_META[t].emoji} {TYPE_META[t].label}
                    </option>
                  ))}
                </select>
              </div>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Source (author, URL, etc.)"
                className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
              />
              <textarea
                value={takeaways}
                onChange={(e) => setTakeaways(e.target.value)}
                placeholder="Key takeaways..."
                rows={3}
                className="w-full resize-none rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
              />
              <div>
                <label className="mb-1 block text-[11px] font-medium text-[var(--text-dim)]">What will I DO with this?</label>
                <input
                  value={whatDo}
                  onChange={(e) => setWhatDo(e.target.value)}
                  placeholder="Creates a linked task when saved"
                  className="w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="rounded-[8px] px-3 py-1.5 text-xs text-[var(--text-dim)]">
                  Cancel
                </button>
                <button onClick={handleSubmit} className="rounded-[8px] bg-[var(--accent)] px-4 py-1.5 text-xs font-medium text-white">
                  Save
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Knowledge type">
          {(['all', ...TYPES] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={filter === t}
              onClick={() => setFilter(t)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs ${
                filter === t ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] text-[var(--text-dim)]'
              }`}
            >
              {t === 'all' ? 'All types' : TYPE_META[t].label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Knowledge status">
          <button
            type="button"
            role="tab"
            aria-selected={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
            className={`rounded-full px-3 py-1.5 text-xs ${statusFilter === 'all' ? 'bg-[var(--surface2)] text-[var(--text)]' : 'text-[var(--text-dim)]'}`}
          >
            All statuses
          </button>
          {STATUS_FLOW.map((s) => (
            <button
              key={s.value}
              type="button"
              role="tab"
              aria-selected={statusFilter === s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`rounded-full px-3 py-1.5 text-xs ${statusFilter === s.value ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)] text-[var(--text-dim)]'}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card rounded-2xl p-8 text-center">
            <p className="text-sm text-[var(--text-dim)]">Your second brain starts here. Capture something you learned today.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AnimatePresence>
              {filtered.map((entry) => (
                <KnowledgeCard key={entry.id} entry={entry} expanded={expanded === entry.id} onToggle={() => setExpanded(expanded === entry.id ? null : entry.id)} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageTransition>
  )
}

function KnowledgeCard({
  entry,
  expanded,
  onToggle,
}: {
  entry: KnowledgeEntry
  expanded: boolean
  onToggle: () => void
}) {
  const { updateKnowledge, deleteKnowledge } = useStore()
  const st = entry.status ?? 'captured'
  return (
    <motion.div
      layout
      className="group relative cursor-pointer rounded-2xl border border-[var(--border)] p-4 hover:border-[var(--border-hover)]"
      onClick={() => onToggle()}
    >
      <button
        type="button"
        aria-label="Remove knowledge entry"
        onClick={(e) => {
          e.stopPropagation()
          deleteKnowledge(entry.id)
          toast.success('Deleted')
        }}
        className="absolute right-3 top-3 text-xs text-[var(--text-dim)] opacity-0 transition-opacity hover:text-[var(--rose)] group-hover:opacity-100"
      >
        ✕
      </button>
      <div className="flex items-start gap-2">
        <span className="text-base">{TYPE_META[entry.type]?.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-semibold leading-tight text-[var(--text)]">{entry.title}</p>
          {entry.source && <p className="mt-0.5 text-[12px] text-[var(--text-mid)]">{entry.source}</p>}
        </div>
      </div>
      <select
        value={st}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => updateKnowledge(entry.id, { status: e.target.value as KnowledgeVaultStatus })}
        className="mt-2 w-full rounded-[8px] border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[11px] text-[var(--text)]"
      >
        {STATUS_FLOW.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {entry.takeaways && (
        <p className={`mt-2 text-[13px] text-[var(--text-dim)] ${expanded ? '' : 'line-clamp-3'}`}>{entry.takeaways}</p>
      )}
      {entry.actionItem && (
        <p className="mt-2 text-[12px] text-[var(--positive)]">
          <span className="text-[var(--text-dim)]">Do: </span>
          {entry.actionItem}
        </p>
      )}
    </motion.div>
  )
}
