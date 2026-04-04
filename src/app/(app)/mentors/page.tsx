'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

export default function MentorsPage() {
  const { mentorPersonas, addMentorPersona, removeMentorPersona } = useStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [urls, setUrls] = useState('')

  const addCustom = () => {
    if (!name.trim()) {
      toast.error('Name your mentor lens.')
      return
    }
    addMentorPersona({
      name: name.trim(),
      description: description.trim() || 'Custom perspective.',
      isBuiltin: false,
      sourceUrls: urls
        .split(/[\n,]+/)
        .map((u) => u.trim())
        .filter(Boolean),
    })
    setName('')
    setDescription('')
    setUrls('')
    toast.success('Mentor lens added')
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6 pb-24">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--text-primary)]">Mentor lenses</h1>
          <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
            Built-in personas plus your own. Use them in Decision Lab to bias the analysis (PRD §7.4).
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Add a lens</h2>
          <div className="mt-3 space-y-3">
            <input
              className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              placeholder="Name (e.g. Naval)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <textarea
              className="min-h-[72px] w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              placeholder="How do they think? (1–3 sentences)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              placeholder="Optional source URLs (comma or newline separated)"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
            />
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={addCustom}
              className="rounded-[12px] bg-[var(--accent)] px-4 py-2.5 text-[15px] font-semibold text-white"
            >
              Save lens
            </motion.button>
          </div>
        </div>

        <ul className="space-y-3">
          {mentorPersonas.map((m) => (
            <li
              key={m.id}
              className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="text-[17px] font-semibold text-[var(--text-primary)]">
                  {m.name}
                  {m.isBuiltin ? (
                    <span className="ml-2 text-[12px] font-normal text-[var(--text-tertiary)]">Built-in</span>
                  ) : null}
                </p>
                <p className="mt-1 text-[15px] text-[var(--text-secondary)]">{m.description}</p>
                {m.sourceUrls.length > 0 ? (
                  <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">{m.sourceUrls.join(' · ')}</p>
                ) : null}
              </div>
              {!m.isBuiltin ? (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    removeMentorPersona(m.id)
                    toast.success('Removed')
                  }}
                  className="shrink-0 text-[14px] text-[var(--negative)]"
                >
                  Remove
                </motion.button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </PageTransition>
  )
}
