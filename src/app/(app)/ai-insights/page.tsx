'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

export default function AiInsightsInboxPage() {
  const { proactiveMessages, markProactiveRead, dismissProactive } = useStore()
  const sorted = [...proactiveMessages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl space-y-6 pb-24">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-[var(--text-primary)]">AI Insights inbox</h1>
            <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
              Proactive messages from ART OS (PRD §8.3). Template mode without an API key; personalized when
              connected.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="shrink-0 text-[15px] font-medium text-[var(--accent)]"
          >
            ← Dashboard
          </Link>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-8 text-center text-[15px] text-[var(--text-secondary)]">
            No proactive messages yet. They appear when patterns trigger (concentration, flatline, stale tasks,
            etc.).
          </div>
        ) : (
          <ul className="space-y-3">
            {sorted.map((m) => (
              <motion.li
                key={m.id}
                layout
                className={`rounded-2xl border border-[var(--border)] p-4 ${
                  m.read ? 'bg-[var(--bg-secondary)] opacity-90' : 'bg-[var(--bg-elevated)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                        m.priority === 'critical'
                          ? 'bg-[rgba(255,69,58,0.15)] text-[var(--negative)]'
                          : m.priority === 'important'
                            ? 'bg-[rgba(255,159,10,0.15)] text-[var(--warning)]'
                            : 'bg-[rgba(10,132,255,0.12)] text-[var(--accent)]'
                      }`}
                    >
                      {m.priority}
                    </span>
                    <p className="mt-2 whitespace-pre-wrap text-[15px] text-[var(--text-primary)]">{m.body}</p>
                    {m.ctaHref ? (
                      <Link
                        href={m.ctaHref}
                        className="mt-3 inline-flex rounded-[10px] bg-[rgba(10,132,255,0.15)] px-3 py-1.5 text-[13px] font-medium text-[var(--accent)] hover:bg-[rgba(10,132,255,0.22)]"
                      >
                        Open
                      </Link>
                    ) : null}
                    <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    {!m.read && (
                      <button
                        type="button"
                        onClick={() => {
                          markProactiveRead(m.id)
                          toast.success('Marked read')
                        }}
                        className="rounded-[10px] bg-[rgba(255,255,255,0.08)] px-3 py-1.5 text-[13px] text-[var(--text-primary)]"
                      >
                        Mark read
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        dismissProactive(m.id)
                        toast.success('Dismissed')
                      }}
                      className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--negative)]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </PageTransition>
  )
}
