'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import { useStore } from '@/stores/store'

function formatWeekHeadline(weekStart: string): string {
  const s = new Date(weekStart + 'T12:00:00')
  return `Week of ${s.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`
}

export default function ReflectionsPage() {
  const { weeklyReflections } = useStore()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const past = [...weeklyReflections].sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())

  return (
    <PageTransition>
      <div className="mx-auto max-w-xl space-y-6 pb-24">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-[24px] font-bold text-[var(--text)]">Reflections</h1>
          <Link
            href="/reflections/new"
            className="rounded-[12px] bg-[var(--accent)] px-4 py-2 text-[14px] font-semibold text-black"
          >
            + New Reflection
          </Link>
        </div>

        {past.length === 0 ? (
          <div className="card px-5 py-8 text-center text-[15px] leading-relaxed text-[var(--text-secondary)]">
            Reflections help you process your week and give the AI data to spot patterns. Take 5 minutes every Sunday.
            <Link href="/reflections/new" className="mt-4 block font-medium text-[var(--accent)]">
              Write your first reflection →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {past.map((r) => {
              const open = expandedId === r.id
              return (
                <motion.div
                  key={r.id}
                  layout
                  className="overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)]"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : r.id)}
                    className="w-full px-5 py-4 text-left"
                  >
                    <h2 className="headline text-[17px] font-semibold text-[var(--text)]">{formatWeekHeadline(r.weekStart)}</h2>
                    <p className="mt-2 line-clamp-2 text-[14px] text-[var(--text-secondary)]">{r.worked || '—'}</p>
                    <p className="caption mt-2 text-[12px] text-[var(--text-dim)]">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </button>
                  <AnimatePresence>
                    {open && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[var(--border)] px-5 pb-4"
                      >
                        <div className="mt-3 space-y-2 text-[13px] text-[var(--text-secondary)]">
                          <p>
                            <span className="text-[var(--text-dim)]">Didn&apos;t work: </span>
                            {r.didnt || '—'}
                          </p>
                          <p>
                            <span className="text-[var(--text-dim)]">Avoided: </span>
                            {r.avoided || '—'}
                          </p>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link href={`/reflections/${r.id}`} className="text-[14px] font-medium text-[var(--accent)]">
                            Open detail →
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
