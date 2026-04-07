import { capitalizeDisplayName } from '@/lib/display-name'
import { toMoneyNumber } from '@/stores/store'
import type { OnboardingDraft } from '@/components/onboarding/onboarding-types'

const DELAY_SHOW_MS = 400
const DISPLAY_MS = 1200

export const ONBOARDING_AI_TIMING = { delayShowMs: DELAY_SHOW_MS, displayMs: DISPLAY_MS }

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

function totalBusinessRevenue(draft: OnboardingDraft) {
  return draft.businesses.reduce((s, b) => s + toMoneyNumber(b.monthlyRevenue), 0)
}

/** Parse "HH:MM" to minutes from midnight */
function timeToMin(t: string): number | null {
  if (!t?.includes(':')) return null
  const [h, m] = t.split(':').map((x) => parseInt(x, 10))
  if (Number.isNaN(h)) return null
  return h * 60 + (Number.isNaN(m) ? 0 : m)
}

export function wakeGapHours(draft: OnboardingDraft): number | null {
  const a = timeToMin(draft.health.targetWake)
  const b = timeToMin(draft.health.actualWake)
  if (a == null || b == null) return null
  let diff = Math.abs(b - a)
  if (diff > 12 * 60) diff = 24 * 60 - diff
  return diff / 60
}

export function financeSummaryText(draft: OnboardingDraft): string {
  const income = totalBusinessRevenue(draft)
  const expenses = estMonthlyPersonalExp(draft.finance)
  const net = income - expenses
  const savingsRate =
    income > 0 ? Math.round(Math.max(0, Math.min(100, ((net / income) * 100)))) : 0
  return `Here's what I'm seeing: Income $${Math.round(income).toLocaleString()}/mo, Expenses $${Math.round(expenses).toLocaleString()}/mo, Net $${Math.round(net).toLocaleString()}/mo, Savings rate ${savingsRate}%.`
}

export function goalsIncomeBubble(draft: OnboardingDraft): string {
  const target = draft.goals.incomeTarget
  const current = Math.max(1, totalBusinessRevenue(draft))
  const mult = target / current
  const rounded = mult >= 10 ? mult.toFixed(1) : mult.toFixed(2)
  const aggressive = mult > 3
  return `$${target.toLocaleString()}/mo — that's ${rounded}x your current. ${aggressive ? 'Aggressive but' : 'Totally'} doable.`
}

export function goalsTargetDateBubble(draft: OnboardingDraft): string | null {
  const ym = draft.goals.targetYearMonth
  if (!ym) return null
  const [y, mo] = ym.split('-').map(Number)
  const target = new Date(y, (mo || 1) - 1, 1)
  const now = new Date()
  const months = Math.max(
    1,
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth())
  )
  const targetIncome = draft.goals.incomeTarget
  const current = Math.max(1, totalBusinessRevenue(draft))
  const gap = Math.max(0, (targetIncome - current) / months)
  return `${months} months. You need $${Math.round(gap).toLocaleString()} more per month to get there.`
}

export type AdvanceAiResult =
  | { kind: 'none' }
  | { kind: 'messages'; messages: string[] }
  | { kind: 'finance_summary' }

/** AI bubbles to show after successful validation when user hits Continue (before internal advance). */
export function advanceAiForIdentitySubStep(draft: OnboardingDraft, identitySubStep: number): AdvanceAiResult {
  const id = draft.identity
  if (identitySubStep === 0) {
    const name = capitalizeDisplayName(id.name.trim() || 'there')
    return { kind: 'messages', messages: [`Great, ${name}. Nice to meet you.`] }
  }
  if (identitySubStep === 1) {
    return { kind: 'messages', messages: [`Got it — ${id.location.trim() || 'your area'}. I'll use this for time zone and local context.`] }
  }
  if (identitySubStep === 2) {
    return { kind: 'messages', messages: ['Got it. Good baseline for projections.'] }
  }
  if (identitySubStep === 3) {
    return { kind: 'messages', messages: [`Thanks for the context. This helps me understand where you're starting from.`] }
  }
  return { kind: 'none' }
}

export function advanceAiLeavingClients(_: OnboardingDraft): AdvanceAiResult {
  return { kind: 'messages', messages: ['Recurring revenue mapped where it applies. Next: the full expense picture.'] }
}

export function advanceAiLeavingFinances(): AdvanceAiResult {
  return { kind: 'finance_summary' }
}

export function advanceAiLeavingGoals(draft: OnboardingDraft): AdvanceAiResult {
  const a = goalsIncomeBubble(draft)
  const b = goalsTargetDateBubble(draft)
  const messages = b ? [a, b] : [a]
  return { kind: 'messages', messages }
}

export function advanceAiHealthSubStep(draft: OnboardingDraft, foundationSubStep: number): AdvanceAiResult {
  if (foundationSubStep === 0) {
    const gap = wakeGapHours(draft)
    if (gap != null && gap > 2) {
      return {
        kind: 'messages',
        messages: [
          `${gap.toFixed(1)}-hour gap between target and actual wake time. That's worth addressing — sleep consistency correlates strongly with execution.`,
        ],
      }
    }
  }
  return { kind: 'none' }
}

export function advanceAiLeavingHealthStep(): AdvanceAiResult {
  return {
    kind: 'messages',
    messages: [`Baseline captured. I'll track how these habits correlate with your productivity.`],
  }
}

export function advanceAiLeavingFaith(): AdvanceAiResult {
  return { kind: 'messages', messages: [`Noted. Spiritual practice impacts discipline — I'll factor this in.`] }
}

export function advanceAiLeavingStruggles(): AdvanceAiResult {
  return { kind: 'messages', messages: [`Thanks for being honest. I'll use this carefully — it stays between us.`] }
}

export function advanceAiLeavingAiPrefs(): AdvanceAiResult {
  return { kind: 'messages', messages: [`Got it. I'll calibrate to that style. You can always change this in Settings.`] }
}

export function advanceAiLeavingTools(): AdvanceAiResult {
  return { kind: 'messages', messages: ['You can add or test API keys anytime under Settings.'] }
}

export function advanceAiPinConfirmed(): AdvanceAiResult {
  return { kind: 'messages', messages: ['Locked down. Your PIN is stored locally and never leaves this device.'] }
}

export function businessesCompleteSummary(draft: OnboardingDraft): string {
  const count = draft.businesses.filter((b) => b.name.trim()).length
  const total = totalBusinessRevenue(draft)
  return `${count} business${count > 1 ? 'es' : ''} mapped. Total revenue: $${Math.round(total).toLocaleString()}/mo. Let's look at the other side — expenses.`
}

export function computeAdvanceAiOnContinue(ctx: {
  step: number
  draft: OnboardingDraft
  identitySubStep: number
  foundationSubStep: number
}): AdvanceAiResult {
  const { step, draft, identitySubStep, foundationSubStep } = ctx
  if (step === 1) return advanceAiForIdentitySubStep(draft, identitySubStep)
  if (step === 3) return advanceAiLeavingClients(draft)
  if (step === 5) return advanceAiLeavingGoals(draft)
  if (step === 6) {
    if (foundationSubStep < 5) return advanceAiHealthSubStep(draft, foundationSubStep)
    return advanceAiLeavingHealthStep()
  }
  if (step === 7) return advanceAiLeavingFaith()
  if (step === 9) return advanceAiLeavingAiPrefs()
  if (step === 10) return advanceAiLeavingTools()
  return { kind: 'none' }
}
