import type { Business, BusinessStatus, BusinessType, Client, TeamMember } from '@/stores/store'
import type { OnboardingDraft } from '@/components/onboarding/onboarding-types'
import {
  createInitialDraft,
  emptyBusinessDraft,
  emptyClientDraft,
} from '@/components/onboarding/onboarding-types'
import { NORTH_STAR_CHIPS } from '@/components/onboarding/onboarding-constants'
import { newId } from '@/lib/id'

type StoreSnapshot = ReturnType<typeof import('@/stores/store').useStore.getState>

const PALETTE = ['#0A84FF', '#60A5FA', '#A78BFA', '#FB7185', '#FBBF24', '#06B6D4', '#D4A853', '#F472B6']

const TYPE_LABEL: Record<BusinessType, string> = {
  agency: 'Marketing/SEO Agency',
  service: 'Service Business (trades, cleaning, etc.)',
  app: 'SaaS / Software / App',
  content: 'Content / Social Media / Influencer',
  real_estate: 'Real Estate (rentals, Airbnb, flipping)',
  coaching: 'Coaching / Consulting',
  other: 'Other',
}

const STATUS_LABEL: Record<BusinessStatus, string> = {
  active_healthy: 'Active — Growing',
  active_slow: 'Active — Stable',
  active_prerevenue: 'Pre-Revenue',
  dormant: 'Dormant',
  backburner: 'Dormant',
  idea: 'Idea Only',
}

function northStarFromStore(raw: string): { metric: string; custom: string } {
  const t = raw.trim()
  if (!t) return { metric: '', custom: '' }
  const preset = NORTH_STAR_CHIPS.find((c) => c === t)
  if (preset) return { metric: preset, custom: '' }
  return { metric: 'Something else', custom: t }
}

/** Builds an onboarding draft from the main app store for “Update my info” review. */
export function hydrateOnboardingDraftFromMainStore(s: StoreSnapshot): OnboardingDraft {
  const base = createInitialDraft()
  const ns = northStarFromStore(s.northStarMetric || '')

  let targetYearMonth = ''
  if (s.targetDate) {
    const d = s.targetDate.slice(0, 10)
    targetYearMonth = d.length >= 7 ? d.slice(0, 7) : ''
  }

  const businesses = (s.businesses ?? []).map((b: Business, i: number) => {
    const row = emptyBusinessDraft(b.color || PALETTE[i % PALETTE.length])
    const bizClients = (s.clients ?? []).filter((c: Client) => c.businessId === b.id)
    return {
      ...row,
      id: b.id,
      name: b.name,
      type: TYPE_LABEL[b.type as BusinessType] ?? 'Other',
      status: STATUS_LABEL[b.status as BusinessStatus] ?? 'Active — Growing',
      monthlyRevenue: b.monthlyRevenue,
      dayToDay: b.dayToDay ?? '',
      role: b.roleDetail ?? '',
      hasTeam: (b.teamMembers?.length ?? 0) > 0,
      team:
        b.teamMembers?.map((m: TeamMember) => ({
          id: m.id,
          name: m.name,
          title: m.title,
          whatTheyDo: m.whatTheyDo,
          compensation: m.compensation,
        })) ?? [],
      tools: b.tools ?? '',
      revenueModel: b.revenueModel ?? '',
      recurringClients: bizClients.length > 0,
      clients: bizClients.map((c: Client) => ({
        ...emptyClientDraft(),
        id: c.id,
        name: c.name,
        monthlyPayment: c.grossMonthly,
        adSpend: c.adSpend,
        relationshipHealth: c.relationshipHealth ?? '',
        startYearMonth: c.startDate ? c.startDate.slice(0, 7) : '',
        communicationFrequency: c.meetingFrequency ?? '',
      })),
      avgJobValue: b.avgJobValue ?? 0,
      jobsPerMonth: b.jobsPerMonth ?? 0,
      bottleneck: b.bottleneck ?? '',
      color: b.color || row.color,
    }
  })

  if (businesses.length === 0) {
    businesses.push({ ...emptyBusinessDraft(PALETTE[0]), id: newId() })
  }
  const businessCount = businesses.length

  const ex = (s.exercise || '').split(' — ')
  const exercise = ex[0] || ''
  const exerciseDetail = ex.slice(1).join(' — ') || ''

  const faithLevel =
    s.hasFaith === false && !s.faithTradition?.trim()
      ? ('no' as const)
      : s.hasFaith
        ? ('sometimes' as const)
        : ('prefer_not' as const)

  const exitRaw = (s.exitIntent || '').toLowerCase()
  const exitIntent =
    exitRaw === 'yes' || exitRaw === 'maybe' || exitRaw === 'no' ? exitRaw : ('no' as const)

  return {
    ...base,
    businessCount,
    businesses: businesses.length ? businesses : [emptyBusinessDraft(PALETTE[0])],
    finance: {
      ...base.finance,
      plaidIntent: s.plaidConnected ? 'connect' : 'later',
      savingsRange: s.savingsRange || base.finance.savingsRange,
    },
    goals: {
      ...base.goals,
      incomeTarget: s.incomeTarget || base.goals.incomeTarget,
      targetYearMonth,
      whyThisMatters: s.incomeWhy ?? '',
      northStarMetric: ns.metric,
      northStarCustom: ns.custom,
      exitIntent,
      exitBusinessId: s.exitBusinessId ?? '',
      exitPrice: s.exitTarget ?? 0,
      idealDay: s.idealDay ?? '',
    },
    schedule: {
      ...base.schedule,
      workStart: s.workDayStart || '',
      workEnd: s.workDayEnd || '',
    },
    health: {
      ...base.health,
      targetWake: s.wakeUpTime || '',
      actualWake: s.actualWakeTime || '',
      exercise,
      exerciseDetail,
      dietQuality: s.dietQuality || '',
      caffeine: (s.caffeineType || '').split(' ')[0] || '',
      caffeineDetail: '',
      smoking: s.smokingStatus || '',
      screenTimeHours: s.phoneScreenTime ?? 0,
      energy: s.energyLevel ?? 5,
      stress: s.stressLevel ?? 5,
      habitsToBuild: [...(s.habitsToBuild ?? [])],
    },
    faith: {
      ...base.faith,
      level: faithLevel,
      tradition: s.faithTradition ?? '',
      islamPrayerTracking: s.trackPrayers ? 'consistent' : 'not_now',
      prayerConsistency: s.faithConsistency ?? '',
      roleModel: s.faithRoleModel ?? '',
      dashboardVisibility:
        (s.faithDashboardVisibility as OnboardingDraft['faith']['dashboardVisibility']) || 'health_only',
    },
    struggles: {
      ...base.struggles,
      procrastinationPattern: s.procrastination ?? '',
      behaviorPatterns: s.patterns ?? '',
      biggestDistraction: s.biggestDistraction ?? '',
      tryingToQuitDetail: s.tryingToQuit ?? '',
      lastLockedIn: s.lockedInMemory ?? '',
      whatNeedsToBeTrue: s.whatNeedsToBeTrue ?? '',
    },
    ai: {
      ...base.ai,
      communicationStyle: (s.aiAvoidanceStyle || 'mix').toLowerCase(),
      motivators: [...(s.aiMotivators ?? [])],
      frequency: s.aiFrequency ?? '',
      reasoningDisplay: s.aiReasoningDisplay ?? '',
      factorHealthInBusiness: s.factorHealthInBusiness ?? true,
    },
    connections: {
      ...base.connections,
      anthropicKey: s.anthropicKey ?? '',
      plaidIntent: s.plaidConnected ? 'connect' : 'later',
      calendarConnected: s.calendarConnected ?? false,
    },
    identity: {
      name: s.userName ?? '',
      location: s.userLocation ?? '',
      age: s.userAge && s.userAge > 0 ? s.userAge : '',
      selfDescription: s.userSituation ?? '',
    },
    pin: '',
    pinConfirm: '',
  }
}
