'use client'

import Link from 'next/link'
import { useOnboardingStore } from '@/stores/onboarding-store'
import type { OnboardingDraft } from './onboarding-types'
import { aiBubbleCls, glassPanel, btnPrimary } from './onboarding-constants'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[var(--border)] py-2 last:border-0">
      <span className="text-[13px] text-[var(--text-tertiary)]">{label}</span>
      <span className="max-w-[60%] text-right text-[14px] text-[var(--text-primary)]">{value}</span>
    </div>
  )
}

function Section({
  title,
  children,
  editStep,
}: {
  title: string
  children: React.ReactNode
  editStep: number
}) {
  const setStep = useOnboardingStore((s) => s.setStep)
  return (
    <div className={glassPanel + ' p-4'}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h3>
        <button type="button" onClick={() => setStep(editStep)} className="text-[14px] font-medium text-[var(--accent)]">
          Edit
        </button>
      </div>
      <div>{children}</div>
    </div>
  )
}

export function OnboardingCategorySummary({
  draft,
  onLaunch,
  launching,
  primaryCtaLabel,
  hideSettingsLink,
}: {
  draft: OnboardingDraft
  onLaunch: () => void
  launching: boolean
  primaryCtaLabel?: string
  hideSettingsLink?: boolean
}) {
  const setStep = useOnboardingStore((s) => s.setStep)
  const totalRev = draft.businesses.reduce((s, b) => s + (b.monthlyRevenue || 0), 0)
  const expenseGuess =
    draft.finance.housingFree ? 0 : draft.finance.housing + draft.finance.carInsurance + draft.finance.phone

  const connections: string[] = []
  if (draft.connections.anthropicKey.trim()) connections.push('Anthropic key')
  if (draft.connections.stripeConnected) connections.push('Stripe')
  if (draft.connections.plaidIntent === 'connect') connections.push('Plaid (intent)')
  if (draft.connections.calendarConnected) connections.push('Calendar')

  return (
    <div className="space-y-4">
      <div className={aiBubbleCls}>
        Here&apos;s everything you&apos;ve shared. Tap <span className="font-semibold">Edit</span> on any section to
        jump back — or launch when you&apos;re ready.
      </div>

      <div className="max-h-[min(60vh,520px)] space-y-3 overflow-y-auto pr-1">
        <Section title="Identity" editStep={1}>
          <Row label="Name" value={draft.identity.name.trim() || '—'} />
          <Row label="Location" value={draft.identity.location.trim() || '—'} />
          <Row label="Age" value={draft.identity.age === '' ? '—' : String(draft.identity.age)} />
          <Row label="About you" value={draft.identity.selfDescription.trim() || '—'} />
        </Section>

        <Section title="Businesses" editStep={2}>
          <Row label="Count" value={String(draft.businessCount)} />
          {draft.businesses.map((b, i) => (
            <Row
              key={b.id || i}
              label={b.name.trim() || `Business ${i + 1}`}
              value={`$${(b.monthlyRevenue || 0).toLocaleString()}/mo`}
            />
          ))}
        </Section>

        <Section title="Finances" editStep={4}>
          <Row label="Plaid" value={draft.finance.plaidIntent} />
          <Row label="Housing" value={draft.finance.housingFree ? 'Rent-free' : `$${draft.finance.housing}/mo`} />
          <Row label="Savings range" value={draft.finance.savingsRange || '—'} />
          <Row label="Est. monthly expenses (excl. business)" value={`~$${expenseGuess.toLocaleString()}`} />
        </Section>

        <Section title="Goals" editStep={5}>
          <Row label="Income target" value={`$${draft.goals.incomeTarget.toLocaleString()}/mo`} />
          <Row label="Target date" value={draft.goals.targetYearMonth || '—'} />
          <Row label="North star" value={draft.goals.northStarMetric || '—'} />
          <Row label="Exit intent" value={draft.goals.exitIntent} />
        </Section>

        <Section title="Health" editStep={6}>
          <Row label="Target wake" value={draft.health.targetWake || '—'} />
          <Row label="Actual wake" value={draft.health.actualWake || '—'} />
          <Row label="Exercise" value={draft.health.exercise || '—'} />
          <Row label="Habits to build" value={draft.health.habitsToBuild.length ? draft.health.habitsToBuild.join(', ') : '—'} />
        </Section>

        <Section title="Schedule" editStep={6}>
          <Row label="Work start" value={draft.schedule.workStart || '—'} />
          <Row label="Work end" value={draft.schedule.workEnd || '—'} />
          <Row label="Commitments" value={draft.schedule.commitments?.length ? `${draft.schedule.commitments.length} blocks` : '—'} />
        </Section>

        <Section title="Faith" editStep={7}>
          <Row label="Tradition / level" value={`${draft.faith.level} · ${draft.faith.tradition || '—'}`} />
          <Row label="Prayer tracking" value={draft.faith.islamPrayerTracking || '—'} />
        </Section>

        <Section title="Struggles" editStep={8}>
          <Row
            label="Reflection"
            value={
              [
                draft.struggles.procrastinationPattern,
                draft.struggles.behaviorPatterns,
                draft.struggles.biggestDistraction,
              ].some((x) => (x || '').trim())
                ? 'Completed'
                : 'Skipped'
            }
          />
        </Section>

        <Section title="AI Preferences" editStep={9}>
          <Row label="Communication" value={draft.ai.communicationStyle || '—'} />
          <Row label="Frequency" value={draft.ai.frequency || '—'} />
          <Row label="Reasoning" value={draft.ai.reasoningDisplay || '—'} />
        </Section>

        <Section title="Connections" editStep={10}>
          <Row label="Services" value={connections.length ? connections.join(', ') : 'None yet'} />
        </Section>

        <div className={glassPanel + ' p-4'}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">Security</h3>
            <button type="button" onClick={() => setStep(11)} className="text-[14px] font-medium text-[var(--accent)]">
              Edit
            </button>
          </div>
          <Row label="PIN" value={draft.pin.length === 4 ? '✓ Set' : '—'} />
        </div>

      </div>

      <div className="flex flex-col gap-3 pt-2">
        <button type="button" onClick={onLaunch} disabled={launching} className={btnPrimary + ' w-full py-5 text-[18px]'}>
          {launching ? (primaryCtaLabel ? 'Saving…' : 'Starting…') : primaryCtaLabel ?? 'Launch ART OS →'}
        </button>
        <button type="button" onClick={() => setStep(1)} className="text-center text-[15px] text-[var(--accent)]">
          Go back and edit something
        </button>
        {!hideSettingsLink && (
          <Link href="/settings" className="text-center text-[13px] text-[var(--text-tertiary)]">
            Open Settings instead
          </Link>
        )}
      </div>
    </div>
  )
}
