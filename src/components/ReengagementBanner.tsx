'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/stores/store'
import { computeIdealSelfBenchmark } from '@/lib/ideal-self-benchmark'

const DISMISS_KEY = 'artos-reengage-dismissed-session'

/** PRD §8.7 — first-run after absence; dismissible for this browser session. */
export default function ReengagementBanner() {
  const { lastSessionDaysSinceOpen, previousLastOpenedAt, tasks } = useStore()
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1')
    } catch {
      setDismissed(false)
    }
  }, [])

  const tier = useMemo(() => {
    const d = lastSessionDaysSinceOpen
    if (d < 1) return null
    if (d <= 2) return 1 as const
    if (d <= 6) return 2 as const
    if (d <= 29) return 3 as const
    return 4 as const
  }, [lastSessionDaysSinceOpen])

  const ideal = useMemo(
    () => computeIdealSelfBenchmark(lastSessionDaysSinceOpen, previousLastOpenedAt, tasks),
    [lastSessionDaysSinceOpen, previousLastOpenedAt, tasks]
  )

  const missedSummary = useMemo(() => {
    if (!previousLastOpenedAt) return { done: 0, open: tasks.filter((t) => !t.done).length }
    const t0 = new Date(previousLastOpenedAt).getTime()
    let done = 0
    for (const t of tasks) {
      if (!t.done || !t.completedAt) continue
      const ct = new Date(t.completedAt).getTime()
      if (ct >= t0) done += 1
    }
    return { done, open: tasks.filter((t) => !t.done).length }
  }, [previousLastOpenedAt, tasks])

  const catchUpHref = `/ai?q=${encodeURIComponent(
    'Quick catch-up: (1) What changed in your businesses? (2) Biggest win since we last spoke? (3) Biggest worry? (4) One thing you are avoiding? (5) What do you want from me today?'
  )}`

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  if (dismissed || tier == null) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-[0_4px_24px_color-mix(in_srgb,var(--text-primary)_12%,transparent)]"
        role="region"
        aria-label="Welcome back"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2 text-[15px] leading-relaxed text-[var(--text-secondary)]">
            {tier === 1 && (
              <>
                <p className="font-semibold text-[var(--text-primary)]">Welcome back. Here&apos;s what you missed.</p>
                <p>
                  Since your last visit: <strong className="text-[var(--text-primary)]">{missedSummary.done}</strong>{' '}
                  tasks completed · <strong className="text-[var(--text-primary)]">{missedSummary.open}</strong> still
                  open.
                </p>
                <p className="text-[14px] text-[var(--text-tertiary)]">
                  Here&apos;s your #1 action to get back on track: open your Next Action on the dashboard or ask AI Partner
                  for a single priority.
                </p>
              </>
            )}
            {tier === 2 && (
              <>
                <p className="font-semibold text-[var(--text-primary)]">
                  You&apos;ve been away for {lastSessionDaysSinceOpen} days. Your Ideal Self kept going. Here&apos;s the
                  gap.
                </p>
                {ideal ? (
                  <p>
                    Benchmark while away: ~{ideal.idealTasks} priority tasks (~{ideal.idealXp} XP). You logged{' '}
                    {ideal.actualDone} completions (~{ideal.actualXp} XP). Gap ~{ideal.gapXp} XP.
                  </p>
                ) : (
                  <p>Keep logging tasks and check-ins to sharpen the Ideal Self comparison.</p>
                )}
                <p className="text-[14px] text-[var(--text-tertiary)]">
                  Here&apos;s your #1 action to get back on track: one high-ROI task before noon — or ask AI Partner what
                  to cut.
                </p>
              </>
            )}
            {tier === 3 && (
              <>
                <p className="font-semibold text-[var(--text-primary)]">
                  A lot might have changed. Want to update me on anything?
                </p>
                <p>
                  Five-question catch-up: businesses, wins, worries, avoidance, and what you need from your AI partner
                  today.
                </p>
                <Link
                  href={catchUpHref}
                  className="inline-block font-medium text-[var(--accent)] hover:underline"
                >
                  Start 5-question catch-up →
                </Link>
                <p className="text-[14px] text-[var(--text-tertiary)]">
                  Here&apos;s your #1 action to get back on track: complete the catch-up or trim your task list to three
                  items.
                </p>
              </>
            )}
            {tier === 4 && (
              <>
                <p className="font-semibold text-[var(--text-primary)]">Welcome back — want to do a quick refresh?</p>
                <p>
                  It&apos;s been {lastSessionDaysSinceOpen}+ days. Revisit your goals and baseline in Settings, or talk
                  it through with AI Partner.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href="/settings"
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[14px] font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
                  >
                    Open Settings
                  </Link>
                  <Link
                    href="/ai"
                    className="rounded-xl bg-[var(--accent)] px-3 py-2 text-[14px] font-semibold text-white"
                  >
                    Fresh start with AI Partner →
                  </Link>
                </div>
                <p className="text-[14px] text-[var(--text-tertiary)]">
                  Here&apos;s your #1 action to get back on track: pick one — reset your north star, or one tiny task
                  completed today.
                </p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg px-2 py-1 text-[12px] text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
