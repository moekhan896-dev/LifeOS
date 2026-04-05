'use client'

import { motion } from 'framer-motion'
import { Drawer } from 'vaul'
import { useState } from 'react'
import { capitalizeDisplayName } from '@/lib/display-name'
import type { OnboardingDraft } from './onboarding-types'

const ease = [0.25, 0.1, 0.25, 1] as const

const previewTile =
  'rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] p-4 transition-[background,border-color] duration-200 hover:bg-[var(--bg-secondary)] hover:border-[var(--border-hover)] cursor-pointer active:scale-[0.98] active:duration-100'

type TileId = 'greeting' | 'income' | 'goal' | 'businesses' | 'habits' | 'faith' | 'schedule'

function estMonthlyPersonalExp(f: OnboardingDraft['finance']) {
  const cars = (f.cars ?? []).reduce((s, c) => s + (c.payment || 0), 0)
  const other = (f.otherExpenses ?? []).reduce((s, o) => s + (o.amount || 0), 0)
  const debts = (f.debts ?? []).reduce((s, d) => s + (d.monthlyPayment || 0), 0)
  return (
    (f.housingFree ? 0 : f.housing) +
    cars +
    f.carInsurance +
    f.phone +
    f.subscriptions +
    f.food +
    other +
    debts
  )
}

export function LiveDashboardPreview({
  draft,
  stepIndex,
  healthScheduleSubStep = 0,
  pulseBusinessIndex = null,
}: {
  draft: OnboardingDraft
  stepIndex: number
  healthScheduleSubStep?: number
  pulseBusinessIndex?: number | null
}) {
  const [open, setOpen] = useState<TileId | null>(null)

  const nameRaw = draft.identity.name.trim()
  const name = nameRaw ? capitalizeDisplayName(nameRaw) : '—'
  const loc = draft.identity.location.trim() || '—'
  const totalRev = draft.businesses.reduce((s, b) => s + (b.monthlyRevenue || 0), 0)
  const bizShown = draft.businesses.filter((b) => b.name.trim()).slice(0, 4)

  const incomeTarget = draft.goals.incomeTarget
  const monthLabel = draft.goals.targetYearMonth || '—'

  const showGreeting = stepIndex >= 1
  const showBusinesses = stepIndex >= 2
  const showFinance = stepIndex >= 4
  const showGoal = stepIndex >= 5
  const showHabits = stepIndex >= 6
  const showFaith = stepIndex >= 7
  const showSchedule = stepIndex >= 6 && (healthScheduleSubStep >= 1 || stepIndex >= 7)
  const showFull = stepIndex >= 12

  const exp = estMonthlyPersonalExp(draft.finance)
  const net = totalRev - exp

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

        <div className="grid auto-rows-min grid-cols-4 gap-3">
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
                {showFinance ? `Exp ~$${Math.round(exp).toLocaleString()} · Net ~$${Math.round(net).toLocaleString()}` : '—'}
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
              <p className="footnote mt-1">{showGoal ? `by ${monthLabel}` : 'Goal step unlocks this meter'}</p>
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
                    <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                    {b.name}
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
              <p className="body mt-2">
                {draft.health.habitsToBuild.length ? `${draft.health.habitsToBuild.length} selected` : '—'}
              </p>
              <p className="footnote mt-1 text-[var(--text-tertiary)]">Habits you pick show up here</p>
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
                Spirit
              </p>
              <p className="body mt-2">
                {draft.faith.level === 'prefer_not' || draft.faith.level === 'no'
                  ? '—'
                  : draft.faith.tradition || 'Configured'}
              </p>
              <p className="footnote mt-1 text-[var(--text-tertiary)]">Prayer tracking appears when enabled</p>
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
                {draft.schedule.workStart && draft.schedule.workEnd ? (
                  <div
                    className="h-3 rounded-full bg-[var(--accent)]/50"
                    style={{ width: '72%' }}
                  />
                ) : null}
              </div>
              <p className="footnote mt-2 text-[var(--text-secondary)]">
                {draft.schedule.workStart && draft.schedule.workEnd
                  ? `${draft.schedule.workStart} – ${draft.schedule.workEnd}`
                  : '— · Set work hours to fill this bar'}
              </p>
            </motion.button>
          )}
        </div>
      </div>

      <Drawer.Root open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm" />
          <Drawer.Content className="card-floating fixed bottom-0 left-0 right-0 z-[90] max-h-[85vh] rounded-t-[20px] p-6 text-[var(--text-primary)]">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[rgba(255,255,255,0.2)]" />
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
