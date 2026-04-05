'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const ROLES = ['client', 'plumber', 'family', 'friend', 'mentor', 'other'] as const

const ROLE_COLORS: Record<string, string> = {
  client: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  plumber: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  family: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  friend: 'bg-green-500/15 text-green-400 border-green-500/20',
  mentor: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  other: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
}

/** Days since last contact — higher = staler */
function daysSince(dateStr?: string): number {
  if (!dateStr) return 9999
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/** PRD: green &lt;14d, orange &gt;30d, red &gt;90d */
function agingClass(days: number): string {
  if (days < 14) return 'text-emerald-400'
  if (days > 90) return 'text-red-400'
  if (days > 30) return 'text-orange-400'
  return 'text-[var(--text-mid)]'
}

export default function ContactsPage() {
  const { contacts, addContact, updateContact, deleteContact } = useStore()
  const [name, setName] = useState('')
  const [role, setRole] = useState<string>('client')
  const [notes, setNotes] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  /** Oldest last-contact first (need attention most) */
  const sortedContacts = [...contacts].sort((a, b) => {
    const ta = a.lastContact ? new Date(a.lastContact).getTime() : 0
    const tb = b.lastContact ? new Date(b.lastContact).getTime() : 0
    return ta - tb
  })

  const handleAdd = () => {
    if (!name.trim()) return
    addContact({ name: name.trim(), role, notes: notes.trim() || undefined, lastContact: new Date().toISOString() })
    setName('')
    setNotes('')
    toast.success('Contact added')
  }

  const markContacted = (id: string) => {
    updateContact(id, { lastContact: new Date().toISOString() })
    toast.success('Last contact updated')
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text">Relationships</h1>
          <p className="mt-1 text-sm text-text-dim">Sorted by last contact — oldest first.</p>
        </div>

        <div className="mb-8 space-y-3 rounded-[16px] border border-border bg-surface2 p-4">
          <div className="flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="flex-1 rounded-[10px] border border-border bg-surface3 px-3 py-2 text-sm text-text placeholder-text-dim outline-none focus:border-accent/50"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-[10px] border border-border bg-surface3 px-3 py-2 text-sm text-text outline-none focus:border-accent/50"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full rounded-[10px] border border-border bg-surface3 px-3 py-2 text-sm text-text placeholder-text-dim outline-none focus:border-accent/50"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            className="rounded-[10px] bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent/80"
          >
            Add Contact
          </motion.button>
        </div>

        <div>
          <h2 className="mb-3 text-xs font-mono uppercase tracking-[2px] text-text-dim">All Contacts ({sortedContacts.length})</h2>
          <div className="space-y-2">
            <AnimatePresence>
              {sortedContacts.map((c) => {
                const days = daysSince(c.lastContact)
                const isExpanded = expandedId === c.id
                const isHovered = hoveredId === c.id
                const ageCls = agingClass(days)
                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    onMouseEnter={() => setHoveredId(c.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="rounded-[12px] border border-border bg-surface2 px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="text-[14px] font-semibold text-text">{c.name}</span>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${ROLE_COLORS[c.role] || ROLE_COLORS.other}`}>{c.role}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs ${ageCls}`}>
                          {c.lastContact ? `${days}d since contact` : 'Never contacted'}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => markContacted(c.id)}
                          className="rounded-[8px] border border-border bg-surface3 px-3 py-1.5 text-[11px] text-text-mid hover:border-accent/40 hover:text-text"
                        >
                          Update Last Contact
                        </motion.button>
                        {c.notes && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : c.id)}
                            className="text-xs text-text-dim transition-colors hover:text-text"
                          >
                            {isExpanded ? '−' : '+'}
                          </button>
                        )}
                        {isHovered && (
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => {
                              deleteContact(c.id)
                              toast('Contact deleted')
                            }}
                            className="text-xs text-rose-400 transition-colors hover:text-rose-300"
                          >
                            Delete
                          </motion.button>
                        )}
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && c.notes && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="mt-2 border-t border-border pt-2 text-xs text-text-dim">{c.notes}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {sortedContacts.length === 0 && <p className="py-8 text-center text-sm text-text-dim">No contacts yet. Add someone above.</p>}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
