import { useStore } from '@/stores/store'
import type {
  BalanceSheetAsset,
  BalanceSheetDebt,
  BusinessStatus,
  BusinessType,
  ScheduleBlock,
} from '@/stores/store'
import { newId } from '@/lib/id'
import { capitalizeDisplayName } from '@/lib/display-name'
import { hashPin } from '@/lib/pin-hash'
import type { OnboardingDraft } from './onboarding-types'

type StoreApi = ReturnType<typeof useStore.getState>

function mapBusinessType(label: string): BusinessType {
  const t = label.toLowerCase()
  if (t.includes('marketing') || t.includes('seo') || t.includes('agency')) return 'agency'
  if (t.includes('service')) return 'service'
  if (t.includes('e-commerce') || t.includes('ecommerce') || t.includes('store')) return 'other'
  if (t.includes('saas') || t.includes('software') || t.includes('app')) return 'app'
  if (t.includes('content') || t.includes('social') || t.includes('influencer')) return 'content'
  if (t.includes('real estate') || t.includes('rental') || t.includes('airbnb')) return 'real_estate'
  if (t.includes('coach') || t.includes('consult')) return 'coaching'
  if (t.includes('freelance') || t.includes('contract')) return 'other'
  if (t.includes('retail') || t.includes('brick')) return 'other'
  if (t.includes('food') || t.includes('beverage')) return 'other'
  if (t.includes('health') || t.includes('wellness') || t.includes('gym')) return 'other'
  if (t.includes('education') || t.includes('course')) return 'other'
  return 'other'
}

function mapBusinessStatus(label: string): BusinessStatus {
  const t = label.toLowerCase()
  if (t.includes('growing')) return 'active_healthy'
  if (t.includes('stable')) return 'active_slow'
  if (t.includes('declining')) return 'active_slow'
  if (t.includes('pre-revenue') || t.includes('prerevenue')) return 'active_prerevenue'
  if (t.includes('dormant')) return 'dormant'
  if (t.includes('idea')) return 'idea'
  return 'active_healthy'
}

const TYPE_EMOJI: Record<string, string> = {
  agency: '⬡',
  service: '🔧',
  app: '📱',
  content: '🎙',
  real_estate: '🏠',
  coaching: '🎯',
  other: '📦',
}

export async function commitOnboardingDraft(store: StoreApi, draft: OnboardingDraft) {
  const now = new Date().toISOString()

  for (const b of draft.businesses) {
    if (!b.name.trim()) continue
    const bt = mapBusinessType(b.type)
    const bs = mapBusinessStatus(b.status)
    const teamMembers =
      b.team?.map((m) => ({
        id: m.id || newId(),
        name: m.name,
        title: m.title,
        whatTheyDo: m.whatTheyDo,
        compensation: m.compensation,
        createdAt: now,
        updatedAt: now,
      })) ?? []

    store.addBusiness({
      name: b.name.trim(),
      type: bt,
      status: bs,
      monthlyRevenue: b.monthlyRevenue,
      color: b.color,
      icon: TYPE_EMOJI[bt] ?? '📦',
      dayToDay: b.dayToDay,
      bottleneck: b.bottleneck,
      tools: b.tools,
      revenueModel: b.revenueModel,
      roleDetail: b.role,
      teamMembers,
      avgJobValue: b.avgJobValue,
      jobsPerMonth: b.jobsPerMonth,
      notes: [b.bottleneck ? `Bottleneck: ${b.bottleneck}` : '', b.dayToDay ? `Day-to-day: ${b.dayToDay}` : '']
        .filter(Boolean)
        .join('\n\n'),
    })
  }

  const { businesses } = store

  draft.businesses.forEach((b, idx) => {
    if (!b.name.trim()) return
    const match = businesses.find((x) => x.name === b.name.trim())
    if (!match) return

    if (b.recurringClients) {
      for (const c of b.clients) {
        if (!c.name.trim()) continue
        store.addClient({
          businessId: match.id,
          name: c.name.trim(),
          grossMonthly: c.monthlyPayment,
          adSpend: c.adSpend,
          serviceType: '',
          meetingFrequency: c.communicationFrequency || 'As needed',
          relationshipHealth: c.relationshipHealth,
          startDate: c.startYearMonth ? `${c.startYearMonth}-01` : undefined,
          active: true,
        })
      }
    }
  })

  const isoMonth = draft.goals.targetYearMonth
    ? `${draft.goals.targetYearMonth}-01`
    : ''

  store.updateProfile({
    userName: capitalizeDisplayName(draft.identity.name),
    userLocation: draft.identity.location.trim(),
    userAge: typeof draft.identity.age === 'number' ? draft.identity.age : 0,
    userSituation: draft.identity.selfDescription,
    incomeTarget: draft.goals.incomeTarget,
    targetDate: isoMonth,
    incomeWhy: draft.goals.whyThisMatters,
    exitTarget: draft.goals.exitPrice,
    exitBusinessId: draft.goals.exitBusinessId,
    northStarMetric:
      draft.goals.northStarMetric === 'Something else'
        ? draft.goals.northStarCustom.trim()
        : draft.goals.northStarMetric,
    wakeUpTime: draft.health.targetWake,
    actualWakeTime: draft.health.actualWake,
    exercise: [draft.health.exercise, draft.health.exerciseDetail].filter(Boolean).join(' — '),
    dietQuality: draft.health.dietQuality,
    caffeineType: [draft.health.caffeine, draft.health.caffeineDetail].filter(Boolean).join(' '),
    caffeineAmount: 0,
    phoneScreenTime: draft.health.screenTimeHours,
    energyLevel: draft.health.energy,
    stressLevel: draft.health.stress,
    hasFaith: draft.faith.level !== 'no' && draft.faith.level !== 'prefer_not',
    faithTradition: draft.faith.tradition,
    trackPrayers: draft.faith.islamPrayerTracking === 'build' || draft.faith.islamPrayerTracking === 'consistent',
    faithConsistency: draft.faith.prayerConsistency,
    faithRoleModel: draft.faith.roleModel,
    procrastination: draft.struggles.procrastinationPattern,
    patterns: draft.struggles.behaviorPatterns,
    biggestDistraction: draft.struggles.biggestDistraction,
    tryingToQuit: draft.struggles.tryingToQuitDetail,
    lockedInMemory: draft.struggles.lastLockedIn,
    aiAvoidanceStyle: draft.ai.communicationStyle,
    aiPushStyle: '',
    aiMotivators: draft.ai.motivators,
    savingsRange: draft.finance.savingsRange,
    anthropicKey: draft.connections.anthropicKey,
    stripeKey: '',
    idealDay: draft.goals.idealDay,
    whatNeedsToBeTrue: draft.struggles.whatNeedsToBeTrue,
    aiFrequency: draft.ai.frequency,
    aiReasoningDisplay: draft.ai.reasoningDisplay,
    factorHealthInBusiness: draft.ai.factorHealthInBusiness,
    smokingStatus: draft.health.smoking,
    habitsToBuild: draft.health.habitsToBuild,
    faithDashboardVisibility: draft.faith.dashboardVisibility,
    calendarConnected: draft.connections.calendarConnected,
    plaidConnected: draft.finance.plaidIntent === 'connect' || draft.connections.plaidIntent === 'connect',
    exitIntent: draft.goals.exitIntent,
    workDayStart: draft.schedule.workStart,
    workDayEnd: draft.schedule.workEnd,
  })

  const loc = draft.identity.location.trim()
  if (loc) {
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(loc)}`)
      if (res.ok) {
        const j = (await res.json()) as { lat?: number; lon?: number }
        if (typeof j.lat === 'number' && typeof j.lon === 'number') {
          store.updateProfile({ userLat: j.lat, userLng: j.lon })
        }
      }
    } catch {
      /* offline or rate limit — prayer times fall back until user sets coords in Settings */
    }
  }

  const toMin = (t: string) => {
    const [h, m] = t.split(':').map((x) => parseInt(x, 10))
    if (Number.isNaN(h)) return 0
    return h * 60 + (Number.isNaN(m) ? 0 : m)
  }
  const sch = draft.schedule
  const scheduleBlocks: ScheduleBlock[] = []
  if (sch.workStart && sch.workEnd) {
    const dur = Math.max(30, toMin(sch.workEnd) - toMin(sch.workStart))
    scheduleBlocks.push({
      time: sch.workStart,
      title: 'Work',
      type: 'work',
      duration: dur,
      completed: false,
    })
  }
  for (const c of sch.commitments) {
    if (!c.title?.trim()) continue
    scheduleBlocks.push({
      time: c.time || sch.workStart || '09:00',
      title: c.title.trim(),
      type: 'personal',
      duration: c.durationMin > 0 ? c.durationMin : 60,
      completed: false,
    })
  }
  store.setSchedule(scheduleBlocks)

  const pinHash = await hashPin(draft.pin)
  store.setPinHash(pinHash)

  const assets: BalanceSheetAsset[] = []
  for (const a of draft.finance.assets) {
    if (!a.name.trim()) continue
    assets.push({
      id: a.id || newId(),
      name: a.name.trim(),
      assetType: a.type.trim(),
      value: a.value,
      createdAt: now,
    })
  }
  const debts: BalanceSheetDebt[] = []
  for (const d of draft.finance.debts) {
    if (!d.label.trim()) continue
    debts.push({
      id: d.id || newId(),
      label: d.label.trim(),
      balance: d.balance,
      monthlyPayment: d.monthlyPayment,
      createdAt: now,
    })
  }
  store.setBalanceSheet(assets, debts)

  const today = new Date().toISOString().split('T')[0]

  const addMonthly = (category: string, amount: number) => {
    if (amount <= 0) return
    store.addExpense({
      category,
      amount,
      date: today,
      recurring: true,
      notes: 'From onboarding',
    })
  }

  if (draft.finance.housingFree) {
    /* skip */
  } else addMonthly('Housing', draft.finance.housing)

  for (const car of draft.finance.cars) {
    addMonthly('Car payment', car.payment)
  }
  addMonthly('Car insurance', draft.finance.carInsurance)
  addMonthly('Phone', draft.finance.phone)
  addMonthly('Subscriptions', draft.finance.subscriptions)
  addMonthly('Food & dining', draft.finance.food)

  for (const o of draft.finance.otherExpenses) {
    if (o.label.trim()) addMonthly(o.label.trim(), o.amount)
  }

  for (const d of draft.finance.debts) {
    if (d.label.trim()) {
      store.addExpense({
        category: `Debt: ${d.label.trim()}`,
        amount: d.monthlyPayment,
        date: today,
        recurring: true,
        notes: `Balance ~${d.balance}`,
      })
    }
  }

  store.setTrackingPrefs({
    prayers: draft.faith.islamPrayerTracking === 'build' || draft.faith.islamPrayerTracking === 'consistent',
    gym: draft.health.habitsToBuild.some((h) => h.toLowerCase().includes('exercise')),
    sleep: draft.health.habitsToBuild.some((h) => h.toLowerCase().includes('sleep')),
    meals: true,
    energyDrinks: false,
    screenTime: draft.health.habitsToBuild.some((h) => h.toLowerCase().includes('screen')),
    gambling: false,
    coldEmail: draft.health.habitsToBuild.some((h) => h.toLowerCase().includes('outreach')),
  })
}

/** Settings “Update my info” — profile, schedule, tracking, optional new PIN only (no duplicate businesses/expenses). */
export async function commitProfileUpdateFromDraft(store: StoreApi, draft: OnboardingDraft) {
  const isoMonth = draft.goals.targetYearMonth ? `${draft.goals.targetYearMonth}-01` : ''

  store.updateProfile({
    userName: capitalizeDisplayName(draft.identity.name),
    userLocation: draft.identity.location.trim(),
    userAge: typeof draft.identity.age === 'number' ? draft.identity.age : 0,
    userSituation: draft.identity.selfDescription,
    incomeTarget: draft.goals.incomeTarget,
    targetDate: isoMonth,
    incomeWhy: draft.goals.whyThisMatters,
    exitTarget: draft.goals.exitPrice,
    exitBusinessId: draft.goals.exitBusinessId,
    northStarMetric:
      draft.goals.northStarMetric === 'Something else'
        ? draft.goals.northStarCustom.trim()
        : draft.goals.northStarMetric,
    wakeUpTime: draft.health.targetWake,
    actualWakeTime: draft.health.actualWake,
    exercise: [draft.health.exercise, draft.health.exerciseDetail].filter(Boolean).join(' — '),
    dietQuality: draft.health.dietQuality,
    caffeineType: [draft.health.caffeine, draft.health.caffeineDetail].filter(Boolean).join(' '),
    caffeineAmount: 0,
    phoneScreenTime: draft.health.screenTimeHours,
    energyLevel: draft.health.energy,
    stressLevel: draft.health.stress,
    hasFaith: draft.faith.level !== 'no' && draft.faith.level !== 'prefer_not',
    faithTradition: draft.faith.tradition,
    trackPrayers: draft.faith.islamPrayerTracking === 'build' || draft.faith.islamPrayerTracking === 'consistent',
    faithConsistency: draft.faith.prayerConsistency,
    faithRoleModel: draft.faith.roleModel,
    procrastination: draft.struggles.procrastinationPattern,
    patterns: draft.struggles.behaviorPatterns,
    biggestDistraction: draft.struggles.biggestDistraction,
    tryingToQuit: draft.struggles.tryingToQuitDetail,
    lockedInMemory: draft.struggles.lastLockedIn,
    aiAvoidanceStyle: draft.ai.communicationStyle,
    aiPushStyle: '',
    aiMotivators: draft.ai.motivators,
    savingsRange: draft.finance.savingsRange,
    anthropicKey: draft.connections.anthropicKey,
    stripeKey: '',
    idealDay: draft.goals.idealDay,
    whatNeedsToBeTrue: draft.struggles.whatNeedsToBeTrue,
    aiFrequency: draft.ai.frequency,
    aiReasoningDisplay: draft.ai.reasoningDisplay,
    factorHealthInBusiness: draft.ai.factorHealthInBusiness,
    smokingStatus: draft.health.smoking,
    habitsToBuild: draft.health.habitsToBuild,
    faithDashboardVisibility: draft.faith.dashboardVisibility,
    calendarConnected: draft.connections.calendarConnected,
    plaidConnected: draft.finance.plaidIntent === 'connect' || draft.connections.plaidIntent === 'connect',
    exitIntent: draft.goals.exitIntent,
    workDayStart: draft.schedule.workStart,
    workDayEnd: draft.schedule.workEnd,
  })

  const loc = draft.identity.location.trim()
  if (loc) {
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(loc)}`)
      if (res.ok) {
        const j = (await res.json()) as { lat?: number; lon?: number }
        if (typeof j.lat === 'number' && typeof j.lon === 'number') {
          store.updateProfile({ userLat: j.lat, userLng: j.lon })
        }
      }
    } catch {
      /* offline */
    }
  }

  const toMin = (t: string) => {
    const [h, m] = t.split(':').map((x) => parseInt(x, 10))
    if (Number.isNaN(h)) return 0
    return h * 60 + (Number.isNaN(m) ? 0 : m)
  }
  const sch = draft.schedule
  const scheduleBlocks: ScheduleBlock[] = []
  if (sch.workStart && sch.workEnd) {
    const dur = Math.max(30, toMin(sch.workEnd) - toMin(sch.workStart))
    scheduleBlocks.push({
      time: sch.workStart,
      title: 'Work',
      type: 'work',
      duration: dur,
      completed: false,
    })
  }
  for (const c of sch.commitments) {
    if (!c.title?.trim()) continue
    scheduleBlocks.push({
      time: c.time || sch.workStart || '09:00',
      title: c.title.trim(),
      type: 'personal',
      duration: c.durationMin > 0 ? c.durationMin : 60,
      completed: false,
    })
  }
  store.setSchedule(scheduleBlocks)

  store.setTrackingPrefs({
    prayers: draft.faith.islamPrayerTracking === 'build' || draft.faith.islamPrayerTracking === 'consistent',
    gym: draft.health.habitsToBuild.some((h) => h.toLowerCase().includes('exercise')),
    sleep: draft.health.habitsToBuild.some((h) => h.toLowerCase().includes('sleep')),
    meals: true,
    energyDrinks: false,
    screenTime: draft.health.habitsToBuild.some((h) => h.toLowerCase().includes('screen')),
    gambling: false,
    coldEmail: draft.health.habitsToBuild.some((h) => h.toLowerCase().includes('outreach')),
  })

  if (draft.pin.length === 4) {
    const pinHash = await hashPin(draft.pin)
    store.setPinHash(pinHash)
  }
}
