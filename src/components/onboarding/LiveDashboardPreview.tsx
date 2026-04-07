'use client'

import { motion } from 'framer-motion'
import { Drawer } from 'vaul'
import { DRAWER_CONTENT_CLASS, DrawerDragHandle } from '@/components/ui/drawer-primitives'
import { useState } from 'react'
import { capitalizeDisplayName } from '@/lib/display-name'
import { toMoneyNumber } from '@/stores/store'
import type { OnboardingDraft } from './onboarding-types'

const ease = [0.25, 0.1, 0.25, 1] as const

const previewTile =
  'rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 transition-[background,border-color] duration-200 hover:bg-[var(--bg-secondary)] hover:border-[var(--border-hover)] cursor-pointer active:scale-[0.98] active:duration-100'

type TileId = 'greeting' | 'income' | 'goal' | 'businesses' | 'habits' | 'faith' | 'schedule'

function estMonthlyPersonalExp(f: OnboardingDraft['finance']) {
  const cars = (f.cars ?? []).reduce((s, c) => s + toMoneyNumber(c.payment), 0)
  const other = (f.otherExpenses ?? []).reduce((s, o) => s + toMoneyNumber(o.amount), 0)
  const debts = (f.debts ?? []).reduce((s, d) => s + toMoneyNumber(d.monthlyPayment), 0)
  return (
    (f.housingFree ? 0 : toMoneyNumber(f.housing)) +
    cars +
    toMoneyNumber(f.carInsurance) +
    toMoneyNumber(f.phone) +
    toMoneyNumber(f.subscriptions) +
    toMoneyNumber(f.food) +
    other +
    debts
  )
}

export function LiveDashboardPreview({
  draft,
  stepIndex,
  foundationSubStep = 0,
  pulseBusinessIndex = null,
}: {
  draft: OnboardingDraft
  stepIndex: number
  foundationSubStep?: number
  pulseBusinessIndex?: number | null
}) {
  const [open, setOpen] = useState<TileId | null>(null)

  const nameRaw = draft.identity.name.trim()
  const name = nameRaw ? capitalizeDisplayName(nameRaw) : '—'
  const loc = draft.identity.location.trim() || '—'
  const totalRev = draft.businesses.reduce((s, b) => s + toMoneyNumber(b.monthlyRevenue), 0)
  const bizShown = draft.businesses.filter((b) => b.name.trim()).slice(0, 4)

  const incomeTarget = draft.goals.incomeTarget
  const monthLabel = draft.goals.targetYearMonth || '—'

  const showGreeting = stepIndex >= 1
  const showBusinesses = stepIndex >= 2
  const showFinance = stepIndex >= 4
  const showGoal = stepIndex >= 5
  const showHabits = stepIndex > 6 || (stepIndex === 6 && foundationSubStep >= 4)
  const showSchedule = stepIndex > 6 || (stepIndex === 6 && foundationSubStep >= 5)
  const showFaith = stepIndex >= 7
  const showFull = stepIndex >= 12

  const exp = estMonthlyPersonalExp(draft.finance)
  const net = totalRev - exp

  const goalPct =
    incomeTarget > 0 ? Math.min(100, Math.round((incomeTarget / 500000) * 100)) : 0

  const schedulePct = (() => {
    const ws = draft.schedule.workStart
    const we = draft.schedule.workEnd
    if (!ws || !we) return 0
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map((x) => parseInt(x, 10))
      if (Number.isNaN(h)) return 0
      return h * 60 + (Number.isNaN(m) ? 0 : m)
    }
    const a = toMin(ws)
    const b = toMin(we)
    if (b <= a) return 72
    return Math.min(100, Math.round(((b - a) / (24 * 60)) * 100))
  })()

  const prayerOn =
    draft.faith.tradition === 'Islam' &&
    (draft.faith.islamPrayerTracking === 'build' || draft.faith.islamPrayerTracking === 'consistent')

  return (
    <div className="relative hidden h-full min-h-[420px] flex-col md:flex">
      <div
        className="pointer-events-none absolute inset-0 rounded-[20px] opacity-60"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(10, 132, 255, 0.06) 0%, transparent 55%)',
        }}
      />
      <div className="relative flex flex-1 flex-col gap-3 p-1">
        <p className="label text-center">Live preview</p>

        {stepIndex === 0 && (
          <div className="onboarding-shimmer-wrap space-y-3">
            <div className="onboarding-shimmer h-16 rounded-[16px]" />
            <div className="grid grid-cols-2 gap-3">
              <div className="onboarding-shimmer h-24 rounded-[16px]" />
              <div className="onboarding-shimmer h-24 rounded-[16px]" />
            </div>
            <div className="onboarding-shimmer h-20 rounded-[16px]" />
            <div className="grid grid-cols-2 gap-3">
              <div className="onboarding-shimmer h-16 rounded-[16px]" />
              <div className="onboarding-shimmer h-16 rounded-[16px]" />
            </div>
            <div className="onboarding-shimmer h-14 rounded-[16px]" />
          </div>
        )}

        <div className={`grid auto-rows-min grid-cols-4 gap-3 ${stepIndex === 0 ? 'hidden' : ''}`}>
          {(showGreeting || showFull) && (
            <motion.button
              type="button"
              layout
              onClick={() => setOpen('greeting')}
              className={`${previewTile} col-span-4 p-5 text-left`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease, delay: 0.02 }}
            >
              <p className="label text-[var(--accent)]">Dashboard</p>
              <p className="title-small mt-1">
                {nameRaw ? (
                  <>
                    Good morning, <span className="text-[var(--positive)]">{name}</span>
                  </>
                ) : (
                  <span className="text-[var(--text-tertiary)]">—</span>
                )}
              </p>
              {showGreeting && nameRaw ? (
                <p className="subheadline mt-1">{loc}</p>
              ) : (
                <p className="footnote mt-1 text-[var(--text-tertiary)]">Name and location fill this tile</p>
              )}
            </motion.button>
          )}

          {(showFinance || showFull) && (
            <motion.button
              type="button"
              onClick={() => setOpen('income')}
              className={`${previewTile} col-span-2 min-h-[120px] p-4 text-left`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease, delay: 0.06 }}
            >
              <p className="label">Money in / out (est.)</p>
              <p className="data mt-2 text-[22px] font-bold tabular-nums leading-tight text-[var(--positive)]">
                {showFinance ? `$${totalRev.toLocaleString()}` : '—'}
              </p>
              <p className="footnote mt-1 text-[var(--text-secondary)]">
                {showFinance
                  ? `Exp ~$${Math.round(exp).toLocaleString()} · Net ~$${Math.round(net).toLocaleString()}`
                  : '—'}
              </p>
            </motion.button>
          )}

          {(showGoal || showFull) && (
            <motion.button
              type="button"
              onClick={() => setOpen('goal')}
              className={`${previewTile} col-span-2 min-h-[120px] p-4 text-left`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease, delay: 0.1 }}
            >
              <p className="label">Target</p>
              <p className="data mt-2 text-[28px] font-bold tabular-nums text-[var(--positive)]">
                {showGoal && incomeTarget > 0 ? `$${incomeTarget.toLocaleString()}` : '—'}
              </p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--surface2)]">
                {showGoal && incomeTarget > 0 ? (
                  <motion.div
                    className="h-2 rounded-full bg-[var(--accent)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${goalPct}%` }}
                    transition={{ duration: 0.35, ease }}
                  />
                ) : null}
              </div>
              <p className="footnote mt-1">{showGoal && monthLabel !== '—' ? `by ${monthLabel}` : '—'}</p>
            </motion.button>
          )}

          {(showBusinesses || showFull) && (
            <motion.button
              type="button"
              onClick={() => setOpen('businesses')}
              className={`${previewTile} col-span-4 w-full p-5 text-left`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease, delay: 0.14 }}
            >
              <p className="label">Businesses</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {bizShown.length === 0 && (
                  <span className="body text-[var(--text-secondary)]">—</span>
                )}
                {bizShown.map((b, i) => (
                  <span
                    key={b.id || i}
                    className={`inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-2.5 py-1 text-[15px] font-medium text-[var(--text-primary)] ${pulseBusinessIndex === i ? 'animate-pulse ring-2 ring-[var(--accent)]' : ''}`}
                    style={{ borderColor: `${b.color}44` }}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: b.color }} />
                    <span className="tabular-nums">
                      {b.name}
                      <span className="text-[var(--text-tertiary)]"> · </span>
                      ${(b.monthlyRevenue || 0).toLocaleString()}/mo
                    </span>
                  </span>
                ))}
              </div>
              {bizShown.length === 0 && (
                <p className="footnote mt-2 text-[var(--text-tertiary)]">Business names appear as you add them</p>
              )}
            </motion.button>
          )}

          {(showHabits || showFull) && (
            <motion.button
              type="button"
              onClick={() => setOpen('habits')}
              className={`${previewTile} col-span-2 min-h-[100px] p-4 text-left`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease, delay: 0.18 }}
            >
              <p className="label">Habits</p>
              <p className="body mt-2 text-[var(--text-primary)]">
                {draft.health.habitsToBuild.length
                  ? draft.health.habitsToBuild.slice(0, 3).join(' · ')
                  : '—'}
              </p>
              <p className="footnote mt-1 text-[var(--text-tertiary)]">Tiles fill as you choose habits to build</p>
            </motion.button>
          )}

          {(showFaith || showFull) && (
            <motion.button
              type="button"
              onClick={() => setOpen('faith')}
              className={`${previewTile} col-span-2 min-h-[100px] p-4 text-left`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease, delay: 0.22 }}
            >
              <p className="label" style={{ color: 'var(--spiritual)' }}>
                {showFaith && prayerOn ? 'Prayer' : 'Faith'}
              </p>
              <p className="body mt-2">
                {!showFaith
                  ? '—'
                  : prayerOn
                    ? 'Tracking on'
                    : draft.faith.level === 'prefer_not' || draft.faith.level === 'no' || draft.faith.level === ''
                      ? '—'
                      : draft.faith.tradition || '—'}
              </p>
              <p className="footnote mt-1 text-[var(--text-tertiary)]">
                {showFaith ? (prayerOn ? 'Prayer window when enabled' : 'From your faith answers') : '—'}
              </p>
            </motion.button>
          )}

          {(showSchedule || showFull) && (
            <motion.button
              type="button"
              onClick={() => setOpen('schedule')}
              className={`${previewTile} col-span-4 p-4 text-left`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease, delay: 0.26 }}
            >
              <p className="label">Schedule</p>
              <div className="mt-2 h-3 w-full rounded-full bg-[var(--surface2)]">
                {showSchedule && draft.schedule.workStart && draft.schedule.workEnd ? (
                  <motion.div
                    className="h-3 rounded-full bg-[var(--accent)]/55"
                    initial={{ width: 0 }}
                    animate={{ width: `${schedulePct || 72}%` }}
                    transition={{ duration: 0.35, ease }}
                  />
                ) : null}
              </div>
              <p className="footnote mt-2 text-[var(--text-secondary)]">
                {showSchedule && draft.schedule.workStart && draft.schedule.workEnd
                  ? `${draft.schedule.workStart} – ${draft.schedule.workEnd}`
                  : '—'}
              </p>
            </motion.button>
          )}
        </div>
      </div>

      <Drawer.Root open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm" />
          <Drawer.Content className={`${DRAWER_CONTENT_CLASS} z-[90] text-[var(--text-primary)]`}>
            <DrawerDragHandle />
            <Drawer.Title className="title-small">
              {open === 'greeting' && 'Greeting tile'}
              {open === 'income' && 'Income snapshot'}
              {open === 'goal' && 'Goal meter'}
              {open === 'businesses' && 'Business cards'}
              {open === 'habits' && 'Habit stack'}
              {open === 'faith' && 'Spiritual practice'}
              {open === 'schedule' && 'Schedule'}
            </Drawer.Title>
            <p className="body mt-2 text-[var(--text-secondary)]">
              This is a live mirror of what you&apos;re entering. After onboarding, every tile opens real data —
              nothing here is sample content.
            </p>
            <ul className="body mt-4 space-y-2 text-[var(--text-primary)]">
              {open === 'income' && (
                <>
                  <li>Combined business revenue you enter rolls into financial projections.</li>
                  <li>Personal expenses from the finance step refine net estimates.</li>
                </>
              )}
              {open === 'goal' && (
                <>
                  <li>Your income target and date set the gap ART OS will help you close.</li>
                </>
              )}
              {open === 'businesses' && (
                <>
                  <li>Each business keeps its color, revenue, and bottleneck context for AI decisions.</li>
                </>
              )}
              {open === 'habits' && (
                <>
                  <li>Habits you choose to build appear as trackable tiles on your dashboard.</li>
                </>
              )}
              {open === 'faith' && (
                <>
                  <li>Visibility matches what you selected — prominent, compact, or health-only.</li>
                </>
              )}
              {open === 'schedule' && (
                <>
                  <li>Work blocks anchor your execution score and reminders.</li>
                </>
              )}
              {open === 'greeting' && (
                <>
                  <li>All numbers and labels on your real dashboard come from your inputs.</li>
                </>
              )}
            </ul>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="btn-secondary mt-6 w-full min-h-[44px]"
            >
              Close
            </button>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  )
}
