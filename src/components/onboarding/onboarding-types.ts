/** Draft types for the onboarding wizard — no user-specific defaults. */

export type PlaidIntent = 'connect' | 'manual' | 'later'

export interface OnboardingClientDraft {
  id: string
  name: string
  monthlyPayment: number
  adSpend: number
  relationshipHealth: string
  startYearMonth: string
  communicationFrequency: string
}

export interface OnboardingTeamMemberDraft {
  id: string
  name: string
  title: string
  whatTheyDo: string
  compensation: string
}

export interface OnboardingBusinessDraft {
  id: string
  name: string
  type: string
  status: string
  monthlyRevenue: number
  dayToDay: string
  role: string
  hasTeam: boolean
  team: OnboardingTeamMemberDraft[]
  tools: string
  revenueModel: string
  recurringClients: boolean
  clients: OnboardingClientDraft[]
  avgJobValue: number
  jobsPerMonth: number
  bottleneck: string
  color: string
}

export interface OnboardingCarDraft {
  id: string
  payment: number
}

export interface OnboardingOtherExpenseDraft {
  id: string
  label: string
  amount: number
}

export interface OnboardingDebtDraft {
  id: string
  label: string
  monthlyPayment: number
  balance: number
}

export interface OnboardingAssetDraft {
  id: string
  name: string
  type: string
  value: number
}

export interface OnboardingFinanceDraft {
  plaidIntent: PlaidIntent
  housing: number
  housingFree: boolean
  cars: OnboardingCarDraft[]
  carInsurance: number
  phone: number
  subscriptions: number
  food: number
  otherExpenses: OnboardingOtherExpenseDraft[]
  debts: OnboardingDebtDraft[]
  savingsRange: string
  assets: OnboardingAssetDraft[]
  financeConfirmed: boolean
}

export type ExitIntent = 'yes' | 'maybe' | 'no'

export interface OnboardingGoalsDraft {
  incomeTarget: number
  targetYearMonth: string
  whyThisMatters: string
  northStarMetric: string
  northStarCustom: string
  exitIntent: ExitIntent
  exitBusinessId: string
  exitPrice: number
  exitTimeline: string
  idealDay: string
}

/** PRD §6.8 — ideal daily schedule (captured with health for one flow, or split in UI) */
export interface OnboardingScheduleCommitmentDraft {
  id: string
  title: string
  time: string
  durationMin: number
  days: string[]
}

export interface OnboardingScheduleDraft {
  workStart: string
  workEnd: string
  deepFocus: string
  focusDuration: string
  commitments: OnboardingScheduleCommitmentDraft[]
}

export interface OnboardingHealthDraft {
  targetWake: string
  actualWake: string
  exercise: string
  exerciseDetail: string
  gymEquipment: string
  dietQuality: string
  caffeine: string
  caffeineDetail: string
  smoking: string
  screenTimeHours: number
  energy: number
  stress: number
  habitsToBuild: string[]
  customHabit: string
  tryingToQuit: string
  quitPrivate: boolean
}

export type FaithLevel =
  | 'central'
  | 'sometimes'
  | 'spiritual'
  | 'no'
  | 'prefer_not'

export interface OnboardingFaithDraft {
  /** Empty until user selects a role (required before continuing). */
  level: FaithLevel | ''
  tradition: string
  islamPrayerTracking: 'build' | 'consistent' | 'not_now' | ''
  prayerConsistency: string
  roleModel: string
  faithOtherNotes: string
  dashboardVisibility: 'prominent' | 'small' | 'health_only'
}

export interface OnboardingStrugglesDraft {
  procrastinationPattern: string
  behaviorPatterns: string
  biggestDistraction: string
  tryingToQuitDetail: string
  tryingToQuitPrivate: boolean
  lastLockedIn: string
  whatNeedsToBeTrue: string
}

export interface OnboardingAiDraft {
  communicationStyle: string
  motivators: string[]
  frequency: string
  reasoningDisplay: string
  factorHealthInBusiness: boolean
}

export interface OnboardingConnectionsDraft {
  anthropicKey: string
  anthropicTestStatus: 'idle' | 'loading' | 'pass' | 'fail'
  stripeConnected: boolean
  plaidIntent: PlaidIntent
  calendarConnected: boolean
}

export interface OnboardingIdentityDraft {
  name: string
  location: string
  age: number | ''
  selfDescription: string
}

export interface OnboardingDraft {
  businessCount: number
  businesses: OnboardingBusinessDraft[]
  finance: OnboardingFinanceDraft
  goals: OnboardingGoalsDraft
  schedule: OnboardingScheduleDraft
  health: OnboardingHealthDraft
  faith: OnboardingFaithDraft
  struggles: OnboardingStrugglesDraft
  ai: OnboardingAiDraft
  connections: OnboardingConnectionsDraft
  identity: OnboardingIdentityDraft
  pin: string
  pinConfirm: string
}

export function emptyClientDraft(): OnboardingClientDraft {
  return {
    id: '',
    name: '',
    monthlyPayment: 0,
    adSpend: 0,
    relationshipHealth: '',
    startYearMonth: '',
    communicationFrequency: '',
  }
}

export function emptyTeamMemberDraft(): OnboardingTeamMemberDraft {
  return { id: '', name: '', title: '', whatTheyDo: '', compensation: '' }
}

export function emptyBusinessDraft(color: string): OnboardingBusinessDraft {
  return {
    id: '',
    name: '',
    type: '',
    status: '',
    monthlyRevenue: 0,
    dayToDay: '',
    role: '',
    hasTeam: false,
    team: [],
    tools: '',
    revenueModel: '',
    recurringClients: false,
    clients: [],
    avgJobValue: 0,
    jobsPerMonth: 0,
    bottleneck: '',
    color,
  }
}

export function createInitialDraft(): OnboardingDraft {
  return {
    businessCount: 1,
    businesses: [emptyBusinessDraft('#34D399')],
    finance: {
      plaidIntent: 'later',
      housing: 0,
      housingFree: false,
      cars: [],
      carInsurance: 0,
      phone: 0,
      subscriptions: 0,
      food: 0,
      otherExpenses: [],
      debts: [],
      savingsRange: '',
      assets: [],
      financeConfirmed: false,
    },
    goals: {
      incomeTarget: 5000,
      targetYearMonth: '',
      whyThisMatters: '',
      northStarMetric: '',
      northStarCustom: '',
      exitIntent: 'no',
      exitBusinessId: '',
      exitPrice: 0,
      exitTimeline: '',
      idealDay: '',
    },
    schedule: {
      workStart: '',
      workEnd: '',
      deepFocus: '',
      focusDuration: '',
      commitments: [],
    },
    health: {
      targetWake: '',
      actualWake: '',
      exercise: '',
      exerciseDetail: '',
      gymEquipment: '',
      dietQuality: '',
      caffeine: '',
      caffeineDetail: '',
      smoking: '',
      screenTimeHours: 0,
      energy: 5,
      stress: 5,
      habitsToBuild: [],
      customHabit: '',
      tryingToQuit: '',
      quitPrivate: true,
    },
    faith: {
      level: '',
      tradition: '',
      islamPrayerTracking: '',
      prayerConsistency: '',
      roleModel: '',
      faithOtherNotes: '',
      dashboardVisibility: 'health_only',
    },
    struggles: {
      procrastinationPattern: '',
      behaviorPatterns: '',
      biggestDistraction: '',
      tryingToQuitDetail: '',
      tryingToQuitPrivate: true,
      lastLockedIn: '',
      whatNeedsToBeTrue: '',
    },
    ai: {
      communicationStyle: 'mix',
      motivators: [],
      frequency: '',
      reasoningDisplay: '',
      factorHealthInBusiness: true,
    },
    connections: {
      anthropicKey: '',
      anthropicTestStatus: 'idle',
      stripeConnected: false,
      plaidIntent: 'later',
      calendarConnected: false,
    },
    identity: {
      name: '',
      location: '',
      age: '',
      selfDescription: '',
    },
    pin: '',
    pinConfirm: '',
  }
}
