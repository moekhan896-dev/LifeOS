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

function daysSince(dateStr?: string): number {
  if (!dateStr) return 999
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function daysColor(days: number): string {
  if (days < 3) return 'text-green-400'
  if (days <= 7) return 'text-amber-400'
  return 'text-rose-400'
}

export default function ContactsPage() {
  const { contacts, addContact, updateContact, deleteContact } = useStore()
  const [name, setName] = useState('')
  const [role, setRole] = useState<string>('client')
  const [notes, setNotes] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const sortedContacts = [...contacts].sort((a, b) => daysSince(b.lastContact) - daysSince(a.lastContact))
  const goingCold = sortedContacts.filter(c => daysSince(c.lastContact) > 7)

  const handleAdd = () => {
    if (!name.trim()) return
    addContact({ name: name.trim(), role, notes: notes.trim() || undefined, lastContact: new Date().toISOString() })
    setName('')
    setNotes('')
    toast.success('Contact added')
  }

  const markContacted = (id: string) => {
    updateContact(id, { lastContact: new Date().toISOString() })
    toast.success('Marked as contacted today')
  }

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text">Relationships</h1>
          <p className="text-sm text-text-dim mt-1">Track who matters. Don&apos;t let connections go cold.</p>
        </div>

        {/* Add Contact Form */}
        <div className="bg-surface2 border border-border rounded-[16px] p-4 mb-8 space-y-3">
          <div className="flex gap-3">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name"
              className="flex-1 bg-surface3 border border-border rounded-[10px] px-3 py-2 text-sm text-text placeholder-text-dim outline-none focus:border-accent/50"
            />
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="bg-surface3 border border-border rounded-[10px] px-3 py-2 text-sm text-text outline-none focus:border-accent/50"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full bg-surface3 border border-border rounded-[10px] px-3 py-2 text-sm text-text placeholder-text-dim outline-none focus:border-accent/50"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            className="px-4 py-2 rounded-[10px] bg-accent text-bg text-sm font-medium hover:bg-accent/80 transition-colors"
          >
            Add Contact
          </motion.button>
        </div>

        {/* Going Cold Section */}
        {goingCold.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-mono uppercase tracking-[2px] text-rose-400 mb-3">Going Cold</h2>
            <div className="space-y-2">
              {goingCold.map(c => {
                const days = daysSince(c.lastContact)
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-500/5 border border-rose-500/20 rounded-[12px] px-4 py-3 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[14px] font-semibold text-text">{c.name}</span>
                      <span className={`ml-2 text-[11px] px-2 py-0.5 rounded-full border ${ROLE_COLORS[c.role] || ROLE_COLORS.other}`}>{c.role}</span>
                      <p className="text-rose-400 text-xs mt-0.5">Last contacted: {days} days ago</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => markContacted(c.id)}
                      className="text-xs px-3 py-1.5 rounded-[8px] bg-surface3 border border-border hover:border-accent/40 text-text-mid hover:text-text transition-colors"
                    >
                      Contacted Today
                    </motion.button>
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {/* All Contacts */}
        <div>
          <h2 className="text-xs font-mono uppercase tracking-[2px] text-text-dim mb-3">All Contacts ({sortedContacts.length})</h2>
          <div className="space-y-2">
            <AnimatePresence>
              {sortedContacts.map(c => {
                const days = daysSince(c.lastContact)
                const isExpanded = expandedId === c.id
                const isHovered = hoveredId === c.id
                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    onMouseEnter={() => setHoveredId(c.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="bg-surface2 border border-border rounded-[12px] px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-[14px] font-semibold text-text">{c.name}</span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border shrink-0 ${ROLE_COLORS[c.role] || ROLE_COLORS.other}`}>{c.role}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs ${daysColor(days)}`}>
                          {c.lastContact ? `Last contacted: ${days} days ago` : 'Never contacted'}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => markContacted(c.id)}
                          className="text-[10px] px-2 py-1 rounded-[6px] bg-surface3 border border-border hover:border-accent/40 text-text-dim hover:text-text transition-colors"
                        >
                          Today
                        </motion.button>
                        {c.notes && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : c.id)}
                            className="text-text-dim hover:text-text text-xs transition-colors"
                          >
                            {isExpanded ? '−' : '+'}
                          </button>
                        )}
                        {isHovered && (
                          <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={() => { deleteContact(c.id); toast('Contact deleted') }}
                            className="text-rose-400 hover:text-rose-300 text-xs transition-colors"
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
                          <p className="text-xs text-text-dim mt-2 pt-2 border-t border-border">{c.notes}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </AnimatePresence>
            {sortedContacts.length === 0 && (
              <p className="text-center text-text-dim text-sm py-8">No contacts yet. Add someone above.</p>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
