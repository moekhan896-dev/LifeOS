import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'sonner'
import { newId } from '@/lib/id'
import { advanceRecurringDue, initialNextDue, type TaskRecurring } from '@/lib/task-recurring'
import {
  DEFAULT_DASHBOARD_LAYOUT,
  normalizeDashboardLayout,
  type DashboardLayoutState,
  type DashboardTileConfig,
} from '@/lib/dashboard-layout'
import { buildProactiveCandidates } from '@/lib/proactive-engine'

// ── Types ──
export type Priority = 'crit' | 'high' | 'med' | 'low'
export type InsightType = 'revenue' | 'risk' | 'efficiency'
export type DriverStatus = 'LIVE' | 'BUILD' | 'TEST' | 'PLAN' | 'IDEA' | 'STALE' | 'NEVER TRIED'
export type BusinessType = 'agency' | 'service' | 'app' | 'content' | 'real_estate' | 'coaching' | 'other'
export type BusinessStatus = 'active_healthy' | 'active_slow' | 'active_prerevenue' | 'dormant' | 'backburner' | 'idea'

export interface TeamMember {
  id: string
  name: string
  title: string
  whatTheyDo: string
  compensation: string
  createdAt: string
  updatedAt: string
}

export interface Business {
  id: string
  name: string
  type: BusinessType
  status: BusinessStatus
  monthlyRevenue: number
  color: string
  icon: string
  notes?: string
  dayToDay?: string
  bottleneck?: string
  tools?: string
  revenueModel?: string
  roleDetail?: string
  teamMembers?: TeamMember[]
  avgJobValue?: number
  jobsPerMonth?: number
  createdAt: string
  updatedAt?: string
  /** PRD §27.1 — soft delete; set on delete, cleared on undo, purged after 30d */
  archivedAt?: string | null
}

export interface Client {
  id: string
  businessId: string
  name: string
  grossMonthly: number
  adSpend: number
  serviceType: string
  meetingFrequency: string
  relationshipHealth?: string
  startDate?: string
  active: boolean
  createdAt: string
  updatedAt?: string
  archivedAt?: string | null
}

/** PRD GAP 13 — AI task value lane */
export type TaskValueCategory =
  | 'direct_revenue'
  | 'revenue_generating'
  | 'infrastructure'
  | 'health_correlation'

export interface Task {
  id: string
  businessId: string
  text: string
  tag: string
  priority: Priority
  done: boolean
  dueDate?: string
  xpValue: number
  drip?: DripZone
  projectId?: string
  dollarValue?: number
  dollarReasoning?: string
  /** PRD GAP 13 */
  taskValueCategory?: TaskValueCategory
  skipReason?: string
  skipCount?: number
  aiSuggested?: boolean
  subtasks?: Array<{ text: string; done: boolean }>
  /** PRD §10.1 — recurring; nextDue ISO */
  recurring?: TaskRecurring
  /** PRD §10.5 — open tasks only; todo vs in progress */
  kanbanLane?: 'todo' | 'in_progress'
  createdAt: string
  completedAt?: string
  updatedAt?: string
  archivedAt?: string | null
}

/** PRD Batch 2 — weekly AI goal grades (12-week chart slot) */
export interface WeeklyScorecardSlot {
  rate: number
  aiByGoal?: { goalId: string; grade: string; feedback: string }[]
  weekKey?: string
  generatedAt?: string
}

export interface Insight { id: string; type: InsightType; priority: string; title: string; body: string; rating?: 'up' | 'down' | null; snoozedUntil?: string; createdAt: string }
export interface HealthLog {
  date: string
  prayers: { fajr: boolean; dhuhr: boolean; asr: boolean; maghrib: boolean; isha: boolean }
  gym: boolean
  sleepTime?: string
  wakeTime?: string
  mealQuality?: 'good' | 'okay' | 'bad'
  energyDrinks: number
  screenTimeHours: number
  dailyScore: number
  waterGlasses?: number
  screenCategory?: 'social' | 'youtube' | 'games' | 'productive'
  gymType?: string
  gymDurationMin?: number
  gymNotes?: string
  mealDescription?: string
  /** Custom habit id → logged value today */
  customHabitLog?: Record<string, string | number | boolean | null>
}

/** PRD §9.10 — user-defined habits in Habits drawer */
export interface CustomHabitDef {
  id: string
  name: string
  emoji: string
  loggingType: 'boolean' | 'number' | 'text' | 'rating'
  private: boolean
  order: number
}
export interface Streak { habit: string; currentStreak: number; longestStreak: number; lastCompleted?: string }
export interface Idea { id: string; text: string; category: string; promoted: boolean; archived: boolean; createdAt: string }
export interface RevenueDriver {
  id: string
  businessId: string
  category: string
  name: string
  impact: number
  status: DriverStatus
  notes?: string
  archivedAt?: string | null
}
export interface Commitment { id: string; text: string; source: string; dueDate?: string; fulfilled: boolean; fulfilledDate?: string; createdAt: string }
export interface Win { id: string; title: string; dollarValue?: number; businessId?: string; category: string; notes?: string; createdAt: string }
export interface ScheduleBlock { time: string; title: string; type: 'prayer' | 'work' | 'health' | 'personal' | 'meal'; duration: number; completed: boolean }
export interface AiMessage { id: string; role: 'user' | 'assistant'; content: string; businessContext?: string; createdAt: string }
export interface PipelineDeal { id: string; companyName: string; contactName?: string; contactEmail?: string; stage: 'lead' | 'contacted' | 'call_booked' | 'proposal' | 'signed' | 'onboarding'; dealValue?: number; source?: string; notes?: string; createdAt: string }
export interface Sprint { id: string; sprintNumber: number; weekStart: string; deliverables: { text: string; done: boolean }[]; status: 'completed' | 'active' | 'upcoming' }
export interface SOP {
  id: string
  businessId: string
  title: string
  status: 'not_started' | 'in_progress' | 'documented'
  content?: string
  archivedAt?: string | null
}
export interface EnergyLog { date: string; timeOfDay: 'morning' | 'afternoon' | 'evening'; level: number }
export interface RevenueEntry {
  id: string
  businessId: string
  amount: number
  date: string
  source?: string
  notes?: string
  archivedAt?: string | null
}
export interface ExpenseEntry { id: string; category: string; amount: number; date: string; notes?: string; recurring: boolean }
export interface GmbProfile {
  id: string
  businessId: string
  city: string
  reviewCount: number
  callsPerMonth: number
  ranking: string
  status: 'strong' | 'medium' | 'new'
  hasAddress: boolean
  archivedAt?: string | null
}

// ── New Strategic Types ──
export type DripZone = 'double_down' | 'replace' | 'design' | 'eliminate'
export type IdentityStatus = 'aspirational' | 'developing' | 'integrated'
export type ProjectStatus = 'not_started' | 'in_progress' | 'blocked' | 'complete'

export interface IdentityStatement { id: string; text: string; status: IdentityStatus; order: number }
export interface VisionItem { id: string; text: string; type: 'vision' | 'anti_vision'; order: number }
export interface NorthStar { id: string; label: string; current: number; target: number; unit: string }

export interface Goal {
  id: string; title: string; targetMetric: string; currentValue: number; targetValue: number
  cycleStart: string; cycleEnd: string; linkedProjectIds: string[]; createdAt: string
}

export interface Project {
  id: string
  name: string
  description: string
  businessId?: string
  goalId?: string
  impact: number
  confidence: number
  ease: number
  status: ProjectStatus
  progress: number
  /** Optional explicit start; else roadmap uses createdAt (GAP 9). */
  startDate?: string
  deadline?: string
  createdAt: string
  /** Soft-delete / abandon; tasks unlinked when set */
  archivedAt?: string | null
}

/** PRD §12.1 §6 — Profit First bucket percentages (should sum to 100). */
export interface ProfitFirstPct {
  ownersPay: number
  tax: number
  operating: number
  profit: number
}

export interface FocusSession {
  id: string; taskId?: string; projectId?: string; startedAt: string; endedAt?: string
  duration: number; quality?: number; notes?: string; distractions: number
}

export type KnowledgeVaultStatus = 'captured' | 'processing' | 'applied' | 'archived'

export interface KnowledgeEntry {
  id: string; title: string; source: string; type: 'book' | 'podcast' | 'article' | 'video' | 'idea' | 'framework' | 'swipe'
  takeaways: string
  /** PRD — "What will I DO with this?" — may auto-create a linked task */
  actionItem?: string
  status?: KnowledgeVaultStatus
  linkedTaskId?: string
  createdAt: string
}

export interface AiReport {
  id: string
  level: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom'
  content: string
  date: string
  grade?: string
  /** For custom on-demand reports */
  topic?: string
  createdAt: string
}

// ── V2 Intelligence Types ──
export interface BehavioralEvent {
  id: string; eventType: string; eventData: Record<string, any>; timestamp: string
  dayScoreAtTime?: number; energyAtTime?: number
}

export interface ObstacleResponse {
  id: string; taskId: string; reason: string; deeperReason?: string; aiResponse?: string; createdAt: string
}

export interface SkillLevel {
  id: string; category: string; skill: string; level: number; xp: number
}

export type DecisionOutcomeRating = 'better' | 'as_expected' | 'worse' | 'much_worse'

export interface DecisionEntry {
  id: string
  decision: string
  reasoning: string
  expectedOutcome: string
  actualOutcome?: string
  outcomeRating?: DecisionOutcomeRating
  reviewDate?: string
  createdAt: string
}

export interface TimeCapsule {
  id: string; letter: string; deliverDate: string; delivered: boolean; createdAt: string
}

export interface AccountabilityContract {
  commitments: string[]; consequence: string; signedDate: string
}

export interface WeeklyReflection {
  id: string
  weekStart: string
  worked: string
  didnt: string
  avoided: string
  change: string
  grateful: string
  /** PRD §20.5 — end-of-day voice transcript */
  eveningVoiceTranscript?: string
  reflectionKind?: 'standard' | 'evening_voice'
  createdAt: string
}

export interface ContactEntry {
  id: string; name: string; role: string; lastContact?: string; notes?: string
}

export interface BalanceSheetAsset {
  id: string
  name: string
  assetType: string
  value: number
  createdAt: string
  updatedAt?: string
}

export interface BalanceSheetDebt {
  id: string
  label: string
  balance: number
  monthlyPayment: number
  createdAt: string
  updatedAt?: string
}

export type BusinessHealth = 'strong' | 'weak' | 'flatline'

export type ProactivePriority = 'critical' | 'important' | 'informational'

/** AI inbox item — template or API-generated (PRD §8.3, GAP 5–6) */
export interface ProactiveMessage {
  id: string
  triggerId: string
  priority: ProactivePriority
  body: string
  createdAt: string
  read: boolean
  /** Optional deep link (e.g. decision review) */
  ctaHref?: string
  /** If set, message is hidden from inbox until this ISO time (scheduled check-ins). */
  revealAt?: string
}

export interface DailyNetSnapshot {
  date: string
  net: number
}

export interface MentorPersona {
  id: string
  name: string
  description: string
  isBuiltin: boolean
  sourceUrls: string[]
  createdAt: string
}

interface AppState {
  // ── Auth & Onboarding ──
  authenticated: boolean
  /** Legacy plaintext PIN — cleared after migration to pinHash */
  pin: string
  pinHash: string
  pinFailedAttempts: number
  pinLockoutUntil: number
  lastOpenedAt: string | null
  /** Previous session open time (set when `touchLastOpened` runs). Used for absence / gap UX. */
  previousLastOpenedAt: string | null
  /** Days between last session's `lastOpenedAt` and this open (computed in `touchLastOpened`). */
  lastSessionDaysSinceOpen: number
  onboardingComplete: boolean
  userName: string
  userLocation: string
  userAge: number
  userSituation: string
  incomeTarget: number
  targetDate: string
  incomeWhy: string
  exitTarget: number
  exitBusinessId: string
  northStarMetric: string
  wakeUpTime: string
  actualWakeTime: string
  workDayStart: string
  workDayEnd: string
  exercise: string
  dietQuality: string
  caffeineType: string
  caffeineAmount: number
  phoneScreenTime: number
  energyLevel: number
  stressLevel: number
  hasFaith: boolean
  faithTradition: string
  trackPrayers: boolean
  faithConsistency: string
  faithRoleModel: string
  procrastination: string
  patterns: string
  biggestDistraction: string
  tryingToQuit: string
  lockedInMemory: string
  aiAvoidanceStyle: string
  aiPushStyle: string
  aiMotivators: string[]
  savingsRange: string
  anthropicKey: string
  stripeKey: string
  idealDay: string
  whatNeedsToBeTrue: string
  aiFrequency: string
  aiReasoningDisplay: string
  factorHealthInBusiness: boolean
  smokingStatus: string
  habitsToBuild: string[]
  faithDashboardVisibility: string
  calendarConnected: boolean
  plaidConnected: boolean
  exitIntent: string
  /** GAP 4 — geocoded from userLocation for adhan.js */
  userLat: number | null
  userLng: number | null
  /** GAP 4 — CalculationMethod key, default ISNA */
  prayerCalcMethod: string
  /** GAP 4 — Hanafi vs Shafi for Asr */
  prayerAsrHanafi: boolean
  /** PRD §12.1 §6 */
  profitFirstPct: ProfitFirstPct
  /** PRD §12.1 §7 — estimated income tax rate for quarterly liability */
  estimatedIncomeTaxRatePct: number
  setProfitFirstPct: (p: Partial<ProfitFirstPct>) => void
  /** In-app notification toggles (browser push is future). PRD — notification preferences. */
  notificationPrefs: {
    proactiveInbox: boolean
    morningBrief: boolean
    weeklyDigest: boolean
    quietHoursEnabled: boolean
    quietHoursStart: string
    quietHoursEnd: string
  }
  trackingPrefs: { prayers: boolean; gym: boolean; sleep: boolean; meals: boolean; energyDrinks: boolean; screenTime: boolean; gambling: boolean; coldEmail: boolean }
  setAuthenticated: (v: boolean) => void
  setPinHash: (hex: string) => void
  recordPinFailure: () => void
  resetPinSecurity: () => void
  /** Last execution score zone label — used to emit `score_zone_changed` once per boundary cross (GAP 26). */
  lastScoreZoneLabel: string | null
  syncScoreZoneFromExecution: () => void
  touchLastOpened: () => void
  /** GAP 19 — when calendar day changes vs todayHealth.date */
  maybeRollHealthDay: () => void
  /** PRD §27.1 — drop soft-deleted rows older than 30 days */
  purgeArchivedRecordsOlderThan30Days: () => void
  completeOnboarding: () => void
  updateProfile: (updates: Partial<Pick<AppState, 'userName' | 'userLocation' | 'userAge' | 'userSituation' | 'incomeTarget' | 'targetDate' | 'incomeWhy' | 'exitTarget' | 'exitBusinessId' | 'northStarMetric' | 'wakeUpTime' | 'actualWakeTime' | 'workDayStart' | 'workDayEnd' | 'exercise' | 'dietQuality' | 'caffeineType' | 'caffeineAmount' | 'phoneScreenTime' | 'energyLevel' | 'stressLevel' | 'hasFaith' | 'faithTradition' | 'trackPrayers' | 'faithConsistency' | 'faithRoleModel' | 'procrastination' | 'patterns' | 'biggestDistraction' | 'tryingToQuit' | 'lockedInMemory' | 'aiAvoidanceStyle' | 'aiPushStyle' | 'aiMotivators' | 'savingsRange' | 'anthropicKey' | 'stripeKey' | 'idealDay' | 'whatNeedsToBeTrue' | 'aiFrequency' | 'aiReasoningDisplay' | 'factorHealthInBusiness' | 'smokingStatus' | 'habitsToBuild' | 'faithDashboardVisibility' | 'calendarConnected' | 'plaidConnected' | 'exitIntent' | 'userLat' | 'userLng' | 'prayerCalcMethod' | 'prayerAsrHanafi' | 'profitFirstPct' | 'estimatedIncomeTaxRatePct'>>) => void
  setTrackingPrefs: (prefs: Partial<AppState['trackingPrefs']>) => void
  setNotificationPrefs: (prefs: Partial<AppState['notificationPrefs']>) => void
  resetAll: () => void

  // ── Theme ──
  theme: 'dark' | 'light'
  toggleTheme: () => void

  // ── Sidebar ──
  sidebarOpen: boolean
  toggleSidebar: () => void

  // ── Businesses ──
  businesses: Business[]
  addBusiness: (b: Omit<Business, 'id' | 'createdAt'>) => void
  updateBusiness: (id: string, updates: Partial<Business>) => void
  /** PRD §27.1 — soft delete + cascade; undo via toast */
  archiveBusiness: (id: string) => void
  restoreArchivedBusiness: (id: string) => void

  // ── Net worth (user data only) ──
  balanceSheetAssets: BalanceSheetAsset[]
  balanceSheetDebts: BalanceSheetDebt[]
  setBalanceSheet: (assets: BalanceSheetAsset[], debts: BalanceSheetDebt[]) => void
  updateBalanceSheetAsset: (id: string, updates: Partial<BalanceSheetAsset>) => void
  updateBalanceSheetDebt: (id: string, updates: Partial<BalanceSheetDebt>) => void

  // ── Clients ──
  clients: Client[]
  addClient: (c: Omit<Client, 'id' | 'createdAt'>) => void
  updateClient: (id: string, updates: Partial<Client>) => void
  deleteClient: (id: string) => void

  // ── Tasks ──
  tasks: Task[]
  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => string
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  /** PRD §10.5 — skip flow: increments skipCount, sets skipReason */
  recordTaskSkip: (id: string, reason: string) => void

  // ── Insights ──
  insights: Insight[]
  addInsight: (i: Omit<Insight, 'id' | 'createdAt'>) => void
  rateInsight: (id: string, rating: 'up' | 'down') => void
  snoozeInsight: (id: string) => void
  dismissInsight: (id: string) => void

  // ── Health ──
  todayHealth: HealthLog
  healthHistory: HealthLog[]
  updateHealth: (updates: Partial<HealthLog>) => void
  togglePrayer: (prayer: keyof HealthLog['prayers']) => void
  saveHealthDay: () => void
  customHabits: CustomHabitDef[]
  addCustomHabit: (h: Omit<CustomHabitDef, 'id' | 'order'>) => string
  updateCustomHabit: (id: string, updates: Partial<CustomHabitDef>) => void
  deleteCustomHabit: (id: string) => void

  // ── Streaks ──
  streaks: Streak[]
  updateStreak: (habit: string, completed: boolean) => void

  // ── Gamification ──
  xp: number
  level: number
  addXp: (amount: number) => void

  // ── Ideas ──
  ideas: Idea[]
  addIdea: (text: string, category: string) => void
  updateIdea: (id: string, updates: Partial<Idea>) => void
  promoteIdea: (id: string) => void
  archiveIdea: (id: string) => void

  // ── Revenue Drivers ──
  drivers: RevenueDriver[]
  updateDriverStatus: (id: string, status: DriverStatus) => void
  addDriver: (d: Omit<RevenueDriver, 'id'>) => void
  deleteDriver: (id: string) => void

  // ── Commitments ──
  commitments: Commitment[]
  addCommitment: (text: string, source: string, dueDate?: string) => string
  fulfillCommitment: (id: string) => void
  removeCommitment: (id: string) => void

  // ── Wins ──
  wins: Win[]
  addWin: (w: Omit<Win, 'id' | 'createdAt'>) => void
  deleteWin: (id: string) => void

  // ── Schedule ──
  todaySchedule: ScheduleBlock[]
  setSchedule: (blocks: ScheduleBlock[]) => void
  toggleScheduleBlock: (index: number) => void

  // ── AI Messages ──
  aiMessages: AiMessage[]
  addAiMessage: (msg: Omit<AiMessage, 'id' | 'createdAt'>) => string
  updateAiMessage: (id: string, content: string) => void
  clearAiMessages: () => void

  // ── Pipeline ──
  pipeline: PipelineDeal[]
  addDeal: (d: Omit<PipelineDeal, 'id' | 'createdAt'>) => void
  updateDeal: (id: string, updates: Partial<PipelineDeal>) => void
  updateDealStage: (id: string, stage: PipelineDeal['stage']) => void
  deleteDeal: (id: string) => void

  // ── Sprints ──
  sprints: Sprint[]
  addSprint: (s: Omit<Sprint, 'id'>) => void
  updateSprint: (id: string, updates: Partial<Sprint>) => void
  updateSprintDeliverable: (sprintId: string, index: number, done: boolean) => void
  appendSprintDeliverable: (sprintId: string, text: string) => void

  // ── SOPs ──
  sops: SOP[]
  addSop: (s: Omit<SOP, 'id'>) => void
  updateSop: (id: string, updates: Partial<SOP>) => void
  deleteSop: (id: string) => void

  // ── Energy Logs ──
  energyLogs: EnergyLog[]
  addEnergyLog: (log: EnergyLog) => void

  // ── Revenue & Expenses ──
  revenueEntries: RevenueEntry[]
  expenseEntries: ExpenseEntry[]
  addRevenue: (r: Omit<RevenueEntry, 'id'>) => void
  addExpense: (e: Omit<ExpenseEntry, 'id'>) => void
  deleteRevenue: (id: string) => void
  deleteExpense: (id: string) => void

  // ── GMB Profiles ──
  gmbProfiles: GmbProfile[]
  addGmbProfile: (g: Omit<GmbProfile, 'id'>) => void
  updateGmbProfile: (id: string, updates: Partial<GmbProfile>) => void
  deleteGmbProfile: (id: string) => void

  // ── Voice Memos ──
  voiceMemos: { id: string; transcript: string; createdAt: string }[]
  addVoiceMemo: (transcript: string) => void

  // ── Scorecards ──
  scorecards: (WeeklyScorecardSlot | null)[]
  /** ISO week key (Sunday date) of last auto AI weekly grading */
  lastWeeklyScorecardWeekKey: string | null
  /** PRD §22 — last auto weekly report week (same Sunday key pattern as scorecard) */
  lastWeeklyReportWeekKey: string | null
  setLastWeeklyReportWeekKey: (key: string | null) => void
  applyWeeklyScorecard: (weekIndex: number, slot: WeeklyScorecardSlot) => void

  // ── Identity & Vision ──
  identityStatements: IdentityStatement[]
  visionItems: VisionItem[]
  northStars: NorthStar[]
  addIdentity: (text: string) => void
  updateIdentity: (id: string, updates: Partial<IdentityStatement>) => void
  deleteIdentity: (id: string) => void
  addVisionItem: (text: string, type: 'vision' | 'anti_vision') => void
  deleteVisionItem: (id: string) => void
  addNorthStar: (ns: Omit<NorthStar, 'id'>) => void
  updateNorthStar: (id: string, updates: Partial<NorthStar>) => void

  // ── Goals (12-Week Year) ──
  goals: Goal[]
  addGoal: (g: Omit<Goal, 'id' | 'createdAt'>) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  deleteGoal: (id: string) => void

  // ── Projects ──
  projects: Project[]
  /** For AI: "You abandoned {name}" */
  projectAbandonLog: { projectId: string; name: string; abandonedAt: string }[]
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  /** Archives project, unlinks tasks */
  archiveProject: (id: string) => void

  // ── Focus Sessions ──
  focusSessions: FocusSession[]
  addFocusSession: (s: Omit<FocusSession, 'id'>) => void
  updateFocusSession: (id: string, updates: Partial<FocusSession>) => void

  // ── Knowledge Vault ──
  knowledgeEntries: KnowledgeEntry[]
  addKnowledge: (k: Omit<KnowledgeEntry, 'id' | 'createdAt'>) => string
  updateKnowledge: (id: string, updates: Partial<KnowledgeEntry>) => void
  deleteKnowledge: (id: string) => void

  // ── AI Reports ──
  aiReports: AiReport[]
  addAiReport: (r: Omit<AiReport, 'id' | 'createdAt'>) => void

  // ── V2 Intelligence ──
  behavioralEvents: BehavioralEvent[]
  logEvent: (eventType: string, eventData: Record<string, any>) => void
  obstacleResponses: ObstacleResponse[]
  addObstacle: (o: Omit<ObstacleResponse, 'id' | 'createdAt'>) => void
  skillLevels: SkillLevel[]
  addSkillXp: (category: string, skill: string, xp: number) => void
  decisionJournal: DecisionEntry[]
  addDecision: (d: Omit<DecisionEntry, 'id' | 'createdAt'>) => string
  updateDecision: (id: string, updates: Partial<DecisionEntry>) => void
  deleteDecision: (id: string) => void
  timeCapsules: TimeCapsule[]
  addTimeCapsule: (letter: string, deliverDate: string) => void
  openTimeCapsule: (id: string) => void
  accountabilityContract: AccountabilityContract | null
  setContract: (c: AccountabilityContract) => void
  weeklyReflections: WeeklyReflection[]
  addReflection: (r: Omit<WeeklyReflection, 'id' | 'createdAt'>) => void
  updateReflection: (id: string, updates: Partial<WeeklyReflection>) => void
  deleteReflection: (id: string) => void
  contacts: ContactEntry[]
  addContact: (c: Omit<ContactEntry, 'id'>) => void
  updateContact: (id: string, updates: Partial<ContactEntry>) => void
  deleteContact: (id: string) => void
  contextualQuotes: string[]

  // ── Proactive AI inbox & net history (PRD §8.3, GAP 6, GAP 18) ──
  proactiveMessages: ProactiveMessage[]
  lastProactiveCheck: string | null
  proactiveDayKey: string
  proactiveGeneratedToday: number
  dailyNetSnapshots: DailyNetSnapshot[]
  markProactiveRead: (id: string) => void
  dismissProactive: (id: string) => void
  runProactiveEvaluation: () => void
  /** PRD Decision Lab — check-in appears in inbox on `revealAt`. */
  addScheduledProactiveMessage: (p: {
    triggerId: string
    body: string
    priority: ProactivePriority
    revealAt: string
    ctaHref?: string
  }) => void
  appendDailyNetSnapshot: () => void

  // ── Mentors (PRD §7.4) ──
  mentorPersonas: MentorPersona[]
  addMentorPersona: (m: Omit<MentorPersona, 'id' | 'createdAt'>) => void
  updateMentorPersona: (id: string, updates: Partial<Pick<MentorPersona, 'name' | 'description' | 'sourceUrls'>>) => void
  removeMentorPersona: (id: string) => void

  /** PRD §9.18 — dashboard tile layout */
  dashboardLayout: DashboardLayoutState
  setDashboardLayout: (layout: DashboardLayoutState) => void
  reorderDashboardTiles: (activeId: string, overId: string) => void
  updateDashboardTileSpan: (tileId: string, gridColumn: DashboardTileConfig['gridColumn']) => void
  setDashboardTileVisible: (tileId: string, visible: boolean) => void
  /** Add tile back from library at bottom */
  showDashboardTile: (tileId: string) => void
  resetDashboardLayout: () => void
}

const uid = () => newId()
const today = () => new Date().toISOString().split('T')[0]

/** PRD §27.1 — hidden from UI while archived */
export function isArchived<T extends { archivedAt?: string | null }>(x: T | null | undefined): boolean {
  return x != null && x.archivedAt != null && x.archivedAt !== ''
}

function freshHealthLogForDate(dateStr: string): HealthLog {
  return {
    date: dateStr,
    prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
    gym: false,
    energyDrinks: 0,
    screenTimeHours: 0,
    dailyScore: 0,
  }
}

const ARCHIVE_PURGE_MS = 30 * 24 * 60 * 60 * 1000

const PRAYER_TIME_OF_DAY: Record<string, string> = {
  fajr: 'morning',
  dhuhr: 'midday',
  asr: 'afternoon',
  maghrib: 'evening',
  isha: 'night',
}

function builtinMentors(): MentorPersona[] {
  const t = new Date().toISOString()
  return [
    { id: 'm-op', name: 'The Operator', description: 'Scale systems, hire, delegate.', isBuiltin: true, sourceUrls: [], createdAt: t },
    { id: 'm-inv', name: 'The Investor', description: "What's the ROI? Show the numbers.", isBuiltin: true, sourceUrls: [], createdAt: t },
    { id: 'm-bld', name: 'The Builder', description: 'Ship fast, iterate, avoid overthinking.', isBuiltin: true, sourceUrls: [], createdAt: t },
    { id: 'm-min', name: 'The Minimalist', description: 'Do less, better. Cut non-essentials.', isBuiltin: true, sourceUrls: [], createdAt: t },
  ]
}

const INITIAL_TRACKING = { prayers: true, gym: true, sleep: true, meals: true, energyDrinks: true, screenTime: true, gambling: true, coldEmail: true }
const INITIAL_NOTIFICATIONS = {
  proactiveInbox: true,
  morningBrief: false,
  weeklyDigest: false,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
}

export function getClientNet(c: Client) {
  return c.grossMonthly - c.adSpend - c.grossMonthly * 0.03
}

/** Aligns with Financial Command: client net when present, else business MRR. */
export function computeMonthlyMoneySnapshot(s: {
  businesses: Business[]
  clients: Client[]
  expenseEntries: ExpenseEntry[]
}) {
  const businesses = s.businesses.filter((b) => !isArchived(b))
  const clients = s.clients.filter((c) => !isArchived(c))
  const incomeStreams = businesses
    .filter((b) => b.monthlyRevenue > 0 || clients.some((c) => c.businessId === b.id && c.active))
    .map((b) => {
      const bizClients = clients.filter((c) => c.businessId === b.id && c.active)
      const clientNet = bizClients.reduce((acc, c) => acc + getClientNet(c), 0)
      return clientNet > 0 ? clientNet : b.monthlyRevenue
    })
  const totalIncome = incomeStreams.reduce((a, n) => a + n, 0)
  const recurringCosts = s.expenseEntries.filter((e) => e.recurring).reduce((a, e) => a + e.amount, 0)
  return { totalIncome, recurringCosts, net: totalIncome - recurringCosts }
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Auth & Onboarding ──
      authenticated: false,
      pin: '',
      pinHash: '',
      pinFailedAttempts: 0,
      pinLockoutUntil: 0,
      lastOpenedAt: null,
      previousLastOpenedAt: null,
      lastSessionDaysSinceOpen: 0,
      lastScoreZoneLabel: null,
      onboardingComplete: false,
      userName: '',
      userLocation: '',
      userAge: 0,
      userSituation: '',
      incomeTarget: 0,
      targetDate: '',
      incomeWhy: '',
      exitTarget: 0,
      exitBusinessId: '',
      northStarMetric: '',
      wakeUpTime: '07:00',
      actualWakeTime: '08:00',
      workDayStart: '',
      workDayEnd: '',
      exercise: '',
      dietQuality: '',
      caffeineType: '',
      caffeineAmount: 0,
      phoneScreenTime: 4,
      energyLevel: 5,
      stressLevel: 5,
      hasFaith: false,
      faithTradition: '',
      trackPrayers: false,
      faithConsistency: '',
      faithRoleModel: '',
      procrastination: '',
      patterns: '',
      biggestDistraction: '',
      tryingToQuit: '',
      lockedInMemory: '',
      aiAvoidanceStyle: '',
      aiPushStyle: '',
      aiMotivators: [],
      savingsRange: '',
      anthropicKey: '',
      stripeKey: '',
      idealDay: '',
      whatNeedsToBeTrue: '',
      aiFrequency: '',
      aiReasoningDisplay: '',
      factorHealthInBusiness: true,
      smokingStatus: '',
      habitsToBuild: [],
      faithDashboardVisibility: '',
      calendarConnected: false,
      plaidConnected: false,
      exitIntent: '',
      userLat: null,
      userLng: null,
      prayerCalcMethod: 'north_america',
      prayerAsrHanafi: false,
      profitFirstPct: { ownersPay: 50, tax: 15, operating: 30, profit: 5 },
      estimatedIncomeTaxRatePct: 30,
      setProfitFirstPct: (p) =>
        set((s) => {
          const next = { ...s.profitFirstPct, ...p }
          const sum = next.ownersPay + next.tax + next.operating + next.profit
          if (sum <= 0) return {}
          const f = 100 / sum
          return {
            profitFirstPct: {
              ownersPay: Math.round(next.ownersPay * f * 10) / 10,
              tax: Math.round(next.tax * f * 10) / 10,
              operating: Math.round(next.operating * f * 10) / 10,
              profit: Math.round(next.profit * f * 10) / 10,
            },
          }
        }),
      notificationPrefs: { ...INITIAL_NOTIFICATIONS },
      trackingPrefs: { ...INITIAL_TRACKING },
      setAuthenticated: (v) => set({ authenticated: v }),
      setPinHash: (hex) => set({ pinHash: hex, pin: '' }),
      recordPinFailure: () =>
        set((s) => {
          const n = s.pinFailedAttempts + 1
          let until = s.pinLockoutUntil
          if (n >= 10) until = Math.max(until, Date.now() + 30 * 60 * 1000)
          else if (n >= 5) until = Math.max(until, Date.now() + 5 * 60 * 1000)
          else if (n >= 3) until = Math.max(until, Date.now() + 30 * 1000)
          return { pinFailedAttempts: n, pinLockoutUntil: until }
        }),
      resetPinSecurity: () => set({ pinFailedAttempts: 0, pinLockoutUntil: 0 }),
      syncScoreZoneFromExecution: () => {
        const s = get()
        const day = s.todayHealth.date
        const tasksDoneToday = s.tasks.filter(
          (t) => !isArchived(t) && t.done && t.completedAt?.startsWith(day)
        ).length
        const todayFocusCount = s.focusSessions.filter((f) => f.startedAt?.startsWith(day)).length
        const tasksCommitted = s.tasks.filter(
          (t) =>
            !isArchived(t) && (t.createdAt.startsWith(day) || (!t.done && t.priority !== 'low'))
        ).length
        const score = getExecutionScore(
          s.todayHealth,
          tasksCommitted,
          tasksDoneToday,
          todayFocusCount,
          s.trackPrayers
        )
        const newZone = getScoreZone(score).label
        const prev = s.lastScoreZoneLabel
        if (prev != null && prev !== newZone) {
          get().logEvent('score_zone_changed', { oldZone: prev, newZone, score })
        }
        if (prev !== newZone) set({ lastScoreZoneLabel: newZone })
      },
      touchLastOpened: () => {
        const prev = get().lastOpenedAt
        const daysSinceLastOpen = prev
          ? Math.floor((Date.now() - new Date(prev).getTime()) / 86400000)
          : 0
        set({
          previousLastOpenedAt: prev,
          lastOpenedAt: new Date().toISOString(),
          lastSessionDaysSinceOpen: daysSinceLastOpen,
        })
        queueMicrotask(() => {
          get().maybeRollHealthDay()
          get().purgeArchivedRecordsOlderThan30Days()
          get().logEvent('app_opened', { daysSinceLastOpen })
        })
      },
      maybeRollHealthDay: () => {
        const s = get()
        const todayStr = today()
        if (s.todayHealth.date === todayStr) return
        const prev = s.todayHealth
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 365)
        const cutoffStr = cutoff.toISOString().split('T')[0]
        const merged = [...s.healthHistory.filter((h) => h.date !== prev.date), prev].filter((h) => h.date >= cutoffStr)
        set({
          healthHistory: merged,
          todayHealth: freshHealthLogForDate(todayStr),
        })
      },
      purgeArchivedRecordsOlderThan30Days: () => {
        const now = Date.now()
        const stale = (iso: string | null | undefined) =>
          iso != null && iso !== '' && now - new Date(iso).getTime() > ARCHIVE_PURGE_MS
        set((s) => ({
          tasks: s.tasks.filter((t) => !stale(t.archivedAt ?? null)),
          clients: s.clients.filter((c) => !stale(c.archivedAt ?? null)),
          revenueEntries: s.revenueEntries.filter((r) => !stale(r.archivedAt ?? null)),
          gmbProfiles: s.gmbProfiles.filter((g) => !stale(g.archivedAt ?? null)),
          drivers: s.drivers.filter((d) => !stale(d.archivedAt ?? null)),
          sops: s.sops.filter((sp) => !stale(sp.archivedAt ?? null)),
          businesses: s.businesses.filter((b) => !stale(b.archivedAt ?? null)),
          projects: s.projects.filter((p) => !stale(p.archivedAt ?? null)),
        }))
      },
      completeOnboarding: () => set({ onboardingComplete: true }),
      updateProfile: (updates) => set(updates),
      setTrackingPrefs: (prefs) => set((s) => ({ trackingPrefs: { ...s.trackingPrefs, ...prefs } })),
      setNotificationPrefs: (prefs) =>
        set((s) => ({ notificationPrefs: { ...s.notificationPrefs, ...prefs } })),
      resetAll: () =>
        set({
          onboardingComplete: false,
          authenticated: false,
          pin: '',
          pinHash: '',
          pinFailedAttempts: 0,
          pinLockoutUntil: 0,
          lastOpenedAt: null,
          previousLastOpenedAt: null,
          lastSessionDaysSinceOpen: 0,
          lastScoreZoneLabel: null,
          plaidConnected: false,
          calendarConnected: false,
          balanceSheetAssets: [],
          balanceSheetDebts: [],
          proactiveMessages: [],
          lastProactiveCheck: null,
          proactiveDayKey: '',
          proactiveGeneratedToday: 0,
          dailyNetSnapshots: [],
          userLat: null,
          userLng: null,
          prayerCalcMethod: 'north_america',
          prayerAsrHanafi: false,
          profitFirstPct: { ownersPay: 50, tax: 15, operating: 30, profit: 5 },
          estimatedIncomeTaxRatePct: 30,
          notificationPrefs: { ...INITIAL_NOTIFICATIONS },
          mentorPersonas: builtinMentors(),
          businesses: [],
          clients: [],
          tasks: [],
          customHabits: [],
          insights: [],
          ideas: [],
          drivers: [],
          wins: [],
          commitments: [],
          pipeline: [],
          sops: [],
          gmbProfiles: [],
          revenueEntries: [],
          expenseEntries: [],
          aiMessages: [],
          xp: 0,
          level: 1,
          streaks: [
        { habit: 'prayer', currentStreak: 0, longestStreak: 0 },
        { habit: 'gym', currentStreak: 0, longestStreak: 0 },
        { habit: 'sleep', currentStreak: 0, longestStreak: 0 },
        { habit: 'no_gamble', currentStreak: 0, longestStreak: 0 },
        { habit: 'cold_email', currentStreak: 0, longestStreak: 0 },
      ],
          scorecards: Array.from({ length: 12 }, () => null) as (WeeklyScorecardSlot | null)[],
          lastWeeklyScorecardWeekKey: null,
          lastWeeklyReportWeekKey: null,
          dashboardLayout: DEFAULT_DASHBOARD_LAYOUT,
          projectAbandonLog: [],
        }),

      // ── Theme ──
      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      // ── Sidebar ──
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      // ── Businesses ──
      businesses: [],
      addBusiness: (b) =>
        set((s) => ({
          businesses: [
            ...s.businesses,
            {
              ...b,
              id: newId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              archivedAt: null,
            },
          ],
        })),
      updateBusiness: (id, updates) =>
        set((s) => ({
          businesses: s.businesses.map((b) =>
            b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
          ),
        })),
      archiveBusiness: (id) => {
        const ts = new Date().toISOString()
        set((s) => ({
          businesses: s.businesses.map((b) => (b.id === id ? { ...b, archivedAt: ts, updatedAt: ts } : b)),
          tasks: s.tasks.map((t) => (t.businessId === id ? { ...t, archivedAt: ts } : t)),
          clients: s.clients.map((c) => (c.businessId === id ? { ...c, archivedAt: ts, updatedAt: ts } : c)),
          revenueEntries: s.revenueEntries.map((r) => (r.businessId === id ? { ...r, archivedAt: ts } : r)),
          gmbProfiles: s.gmbProfiles.map((g) => (g.businessId === id ? { ...g, archivedAt: ts } : g)),
          drivers: s.drivers.map((d) => (d.businessId === id ? { ...d, archivedAt: ts } : d)),
          sops: s.sops.map((sp) => (sp.businessId === id ? { ...sp, archivedAt: ts } : sp)),
        }))
        queueMicrotask(() => {
          toast('Business deleted.', {
            duration: 5000,
            action: {
              label: 'Undo',
              onClick: () => get().restoreArchivedBusiness(id),
            },
          })
        })
      },
      restoreArchivedBusiness: (id) => {
        const now = new Date().toISOString()
        set((s) => ({
          businesses: s.businesses.map((b) =>
            b.id === id ? { ...b, archivedAt: null, updatedAt: now } : b
          ),
          tasks: s.tasks.map((t) => (t.businessId === id ? { ...t, archivedAt: null } : t)),
          clients: s.clients.map((c) => (c.businessId === id ? { ...c, archivedAt: null, updatedAt: now } : c)),
          revenueEntries: s.revenueEntries.map((r) => (r.businessId === id ? { ...r, archivedAt: null } : r)),
          gmbProfiles: s.gmbProfiles.map((g) => (g.businessId === id ? { ...g, archivedAt: null } : g)),
          drivers: s.drivers.map((d) => (d.businessId === id ? { ...d, archivedAt: null } : d)),
          sops: s.sops.map((sp) => (sp.businessId === id ? { ...sp, archivedAt: null } : sp)),
        }))
      },

      balanceSheetAssets: [],
      balanceSheetDebts: [],
      setBalanceSheet: (assets, debts) => set({ balanceSheetAssets: assets, balanceSheetDebts: debts }),
      updateBalanceSheetAsset: (id, updates) =>
        set((s) => ({
          balanceSheetAssets: s.balanceSheetAssets.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
          ),
        })),
      updateBalanceSheetDebt: (id, updates) =>
        set((s) => ({
          balanceSheetDebts: s.balanceSheetDebts.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
          ),
        })),

      // ── Clients ──
      clients: [],
      addClient: (c) =>
        set((s) => ({
          clients: [
            ...s.clients,
            {
              ...c,
              id: newId(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              archivedAt: null,
            },
          ],
        })),
      updateClient: (id, updates) =>
        set((s) => ({
          clients: s.clients.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        })),
      deleteClient: (id) => set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),

      // ── Tasks ──
      tasks: [],
      addTask: (t) => {
        const id = uid()
        set((s) => ({
          tasks: [
            ...s.tasks,
            {
              ...t,
              skipCount: t.skipCount ?? 0,
              aiSuggested: t.aiSuggested ?? false,
              id,
              createdAt: new Date().toISOString(),
              archivedAt: null,
            },
          ],
        }))
        get().logEvent('task_created', {
          taskId: id,
          priority: t.priority,
          businessId: t.businessId,
          aiSuggested: t.aiSuggested ?? false,
        })
        return id
      },
      toggleTask: (id) => {
        set((s) => {
          const target = s.tasks.find((t) => t.id === id)
          if (!target) return {}
          const willComplete = !target.done
          let xp = s.xp
          let level = s.level

          if (willComplete) {
            xp += target.xpValue
            while (xp >= 100) {
              xp -= 100
              level += 1
            }
          } else if (target.done) {
            xp = Math.max(0, xp - target.xpValue)
          }

          let tasks = s.tasks.map((t) => {
            if (t.id !== id) return t
            if (willComplete) {
              const row = {
                ...t,
                done: true,
                completedAt: new Date().toISOString(),
                kanbanLane: undefined as Task['kanbanLane'],
              }
              if (t.recurring) {
                return { ...row, recurring: undefined }
              }
              return row
            }
            return { ...t, done: false, completedAt: undefined }
          })

          if (willComplete && target.recurring) {
            const nextDue = advanceRecurringDue(target.recurring)
            const nid = uid()
            const spawned: Task = {
              id: nid,
              businessId: target.businessId,
              text: target.text,
              tag: target.tag,
              priority: target.priority,
              done: false,
              xpValue: target.xpValue,
              dueDate: target.dueDate,
              drip: target.drip,
              projectId: target.projectId,
              dollarValue: target.dollarValue,
              dollarReasoning: target.dollarReasoning,
              taskValueCategory: target.taskValueCategory,
              skipReason: undefined,
              skipCount: 0,
              aiSuggested: target.aiSuggested,
              subtasks: target.subtasks?.map((st) => ({ text: st.text, done: false })),
              recurring: { frequency: target.recurring.frequency, nextDue },
              kanbanLane: 'todo',
              createdAt: new Date().toISOString(),
              archivedAt: null,
            }
            tasks = [...tasks, spawned]
            queueMicrotask(() => {
              get().logEvent('task_created', {
                taskId: nid,
                priority: spawned.priority,
                businessId: spawned.businessId,
                aiSuggested: false,
              })
            })
          }

          return { tasks, xp, level }
        })
        const task = get().tasks.find((x) => x.id === id)
        if (task?.done) {
          get().logEvent('task_completed', {
            taskId: id,
            xpValue: task.xpValue,
            dollarValue: task.dollarValue,
            priority: task.priority,
            businessId: task.businessId,
          })
        }
      },
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      updateTask: (id, updates) => {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)),
        }))
        if (updates.skipReason != null && String(updates.skipReason).length > 0) {
          const t = get().tasks.find((x) => x.id === id)
          if (t)
            get().logEvent('task_skipped', {
              taskId: id,
              reason: updates.skipReason,
              skipCount: t.skipCount ?? 0,
            })
        }
      },
      recordTaskSkip: (id, reason) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  skipReason: reason,
                  skipCount: (t.skipCount ?? 0) + 1,
                  updatedAt: new Date().toISOString(),
                }
              : t
          ),
        }))
        const t = get().tasks.find((x) => x.id === id)
        get().logEvent('task_skipped', {
          taskId: id,
          reason,
          skipCount: t?.skipCount ?? 0,
        })
      },

      // ── Insights ──
      insights: [],
      addInsight: (i) => set((s) => ({ insights: [{ ...i, id: uid(), createdAt: new Date().toISOString() }, ...s.insights] })),
      rateInsight: (id, rating) => {
        set((s) => ({ insights: s.insights.map((i) => (i.id === id ? { ...i, rating } : i)) }))
      },
      snoozeInsight: (id) => { const d = new Date(); d.setDate(d.getDate() + 7); set((s) => ({ insights: s.insights.map((i) => i.id === id ? { ...i, snoozedUntil: d.toISOString() } : i) })) },
      dismissInsight: (id) => set((s) => ({ insights: s.insights.filter((i) => i.id !== id) })),

      // ── Health ──
      todayHealth: { date: today(), prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false }, gym: false, energyDrinks: 0, screenTimeHours: 0, dailyScore: 0 },
      healthHistory: [],
      updateHealth: (updates) => {
        const prevGym = get().todayHealth.gym
        set((s) => ({ todayHealth: { ...s.todayHealth, ...updates } }))
        if (updates.gym === true && !prevGym) get().updateStreak('gym', true)
        else if (updates.gym === false && prevGym) get().updateStreak('gym', false)
      },
      togglePrayer: (prayer) => {
        const was = get().todayHealth.prayers[prayer as keyof HealthLog['prayers']]
        set((s) => ({
          todayHealth: {
            ...s.todayHealth,
            prayers: { ...s.todayHealth.prayers, [prayer]: !s.todayHealth.prayers[prayer] },
          },
        }))
        const on = get().todayHealth.prayers[prayer as keyof HealthLog['prayers']]
        if (on && !was) {
          get().logEvent('prayer_completed', {
            prayer,
            timeOfDay: PRAYER_TIME_OF_DAY[prayer] ?? 'day',
          })
        }
      },
      saveHealthDay: () =>
        set((s) => {
          const cutoff = new Date()
          cutoff.setDate(cutoff.getDate() - 365)
          const cutoffStr = cutoff.toISOString().split('T')[0]
          const merged = [...s.healthHistory.filter((h) => h.date !== s.todayHealth.date), s.todayHealth].filter(
            (h) => h.date >= cutoffStr
          )
          return { healthHistory: merged }
        }),

      customHabits: [],
      addCustomHabit: (h) => {
        const id = uid()
        set((s) => ({
          customHabits: [...s.customHabits, { ...h, id, order: s.customHabits.length }],
        }))
        return id
      },
      updateCustomHabit: (id, updates) =>
        set((s) => ({
          customHabits: s.customHabits.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteCustomHabit: (id) => set((s) => ({ customHabits: s.customHabits.filter((c) => c.id !== id) })),

      // ── Streaks ──
      streaks: [
        { habit: 'prayer', currentStreak: 0, longestStreak: 0 },
        { habit: 'gym', currentStreak: 0, longestStreak: 0 },
        { habit: 'sleep', currentStreak: 0, longestStreak: 0 },
        { habit: 'no_gamble', currentStreak: 0, longestStreak: 0 },
        { habit: 'cold_email', currentStreak: 0, longestStreak: 0 },
      ],
      updateStreak: (habit, completed) => {
        set((s) => ({
          streaks: s.streaks.map((st) => {
            if (st.habit !== habit) return st
            if (completed) {
              const n = st.currentStreak + 1
              return { ...st, currentStreak: n, longestStreak: Math.max(n, st.longestStreak), lastCompleted: today() }
            }
            return { ...st, currentStreak: 0 }
          }),
        }))
        if (completed) {
          const st = get().streaks.find((x) => x.habit === habit)
          get().logEvent('habit_completed', { habit, streakCount: st?.currentStreak ?? 0 })
        }
      },

      // ── Gamification ──
      xp: 0, level: 1,
      addXp: (amount) =>
        set((s) => {
          let xp = s.xp + amount
          let level = s.level
          while (xp >= 100) {
            xp -= 100
            level += 1
          }
          return { xp, level }
        }),

      // ── Ideas ──
      ideas: [],
      addIdea: (text, category) => set((s) => ({ ideas: [...s.ideas, { id: uid(), text, category, promoted: false, archived: false, createdAt: new Date().toISOString() }] })),
      updateIdea: (id, updates) => set((s) => ({ ideas: s.ideas.map((i) => i.id === id ? { ...i, ...updates } : i) })),
      promoteIdea: (id) => set((s) => ({ ideas: s.ideas.map((i) => i.id === id ? { ...i, promoted: true } : i) })),
      archiveIdea: (id) => set((s) => ({ ideas: s.ideas.map((i) => i.id === id ? { ...i, archived: true } : i) })),

      // ── Revenue Drivers ──
      drivers: [],
      updateDriverStatus: (id, status) => set((s) => ({ drivers: s.drivers.map((d) => d.id === id ? { ...d, status } : d) })),
      addDriver: (d) => set((s) => ({ drivers: [...s.drivers, { ...d, id: uid(), archivedAt: null }] })),
      deleteDriver: (id) => set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) })),

      // ── Commitments ──
      commitments: [],
      addCommitment: (text, source, dueDate) => {
        const cid = uid()
        set((s) => ({
          commitments: [
            ...s.commitments,
            { id: cid, text, source, dueDate, fulfilled: false, createdAt: new Date().toISOString() },
          ],
        }))
        get().logEvent('commitment_made', { commitmentId: cid, source })
        return cid
      },
      fulfillCommitment: (id) => {
        const before = get().commitments.find((c) => c.id === id)
        set((s) => ({
          commitments: s.commitments.map((c) =>
            c.id === id ? { ...c, fulfilled: true, fulfilledDate: today() } : c
          ),
        }))
        const after = get().commitments.find((c) => c.id === id)
        if (after?.fulfilled && before && !before.fulfilled) {
          const daysToFulfill = Math.max(
            0,
            Math.floor(
              (new Date(after.fulfilledDate!).getTime() - new Date(before.createdAt).getTime()) / 86400000
            )
          )
          get().logEvent('commitment_fulfilled', { commitmentId: id, daysToFulfill })
        }
      },
      removeCommitment: (id) => set((s) => ({ commitments: s.commitments.filter((c) => c.id !== id) })),

      // ── Wins ──
      wins: [],
      addWin: (w) => set((s) => ({ wins: [...s.wins, { ...w, id: uid(), createdAt: new Date().toISOString() }] })),
      deleteWin: (id) => set((s) => ({ wins: s.wins.filter((w) => w.id !== id) })),

      // ── Schedule ──
      todaySchedule: [],
      setSchedule: (blocks) => set({ todaySchedule: blocks }),
      toggleScheduleBlock: (index) => set((s) => ({ todaySchedule: s.todaySchedule.map((b, i) => i === index ? { ...b, completed: !b.completed } : b) })),

      // ── AI Messages ──
      aiMessages: [],
      addAiMessage: (msg) => {
        const id = uid()
        set((s) => ({
          aiMessages: [...s.aiMessages, { ...msg, id, createdAt: new Date().toISOString() }],
        }))
        return id
      },
      updateAiMessage: (id, content) =>
        set((s) => ({
          aiMessages: s.aiMessages.map((m) => (m.id === id ? { ...m, content } : m)),
        })),
      clearAiMessages: () => set({ aiMessages: [] }),

      // ── Pipeline ──
      pipeline: [],
      addDeal: (d) => set((s) => ({ pipeline: [...s.pipeline, { ...d, id: uid(), createdAt: new Date().toISOString() }] })),
      updateDeal: (id, updates) => set((s) => ({ pipeline: s.pipeline.map((d) => d.id === id ? { ...d, ...updates } : d) })),
      updateDealStage: (id, stage) => set((s) => ({ pipeline: s.pipeline.map((d) => d.id === id ? { ...d, stage } : d) })),
      deleteDeal: (id) => set((s) => ({ pipeline: s.pipeline.filter((d) => d.id !== id) })),

      // ── Sprints ──
      sprints: [],
      addSprint: (s_) =>
        set((s) => ({
          sprints: [
            ...s.sprints.map((sp) => (sp.status === 'active' ? { ...sp, status: 'completed' as const } : sp)),
            { ...s_, id: uid() },
          ],
        })),
      updateSprint: (id, updates) =>
        set((s) => ({ sprints: s.sprints.map((sp) => (sp.id === id ? { ...sp, ...updates } : sp)) })),
      updateSprintDeliverable: (sprintId, index, done) => set((s) => ({
        sprints: s.sprints.map((sp) => sp.id === sprintId ? { ...sp, deliverables: sp.deliverables.map((d, i) => i === index ? { ...d, done } : d) } : sp),
      })),
      appendSprintDeliverable: (sprintId, text) => {
        const t = text.trim()
        if (!t) return
        set((s) => ({
          sprints: s.sprints.map((sp) =>
            sp.id === sprintId ? { ...sp, deliverables: [...sp.deliverables, { text: t, done: false }] } : sp
          ),
        }))
      },

      // ── SOPs ──
      sops: [],
      addSop: (s_) => set((s) => ({ sops: [...s.sops, { ...s_, id: uid(), archivedAt: null }] })),
      updateSop: (id, updates) => set((s) => ({ sops: s.sops.map((sp) => sp.id === id ? { ...sp, ...updates } : sp) })),
      deleteSop: (id) => set((s) => ({ sops: s.sops.filter((sp) => sp.id !== id) })),

      // ── Energy Logs ──
      energyLogs: [],
      addEnergyLog: (log) => set((s) => ({ energyLogs: [...s.energyLogs, log] })),

      // ── Revenue & Expenses ──
      revenueEntries: [],
      expenseEntries: [],
      addRevenue: (r) =>
        set((s) => ({ revenueEntries: [...s.revenueEntries, { ...r, id: uid(), archivedAt: null }] })),
      addExpense: (e) => set((s) => ({ expenseEntries: [...s.expenseEntries, { ...e, id: uid() }] })),
      deleteRevenue: (id) => set((s) => ({ revenueEntries: s.revenueEntries.filter((r) => r.id !== id) })),
      deleteExpense: (id) => set((s) => ({ expenseEntries: s.expenseEntries.filter((e) => e.id !== id) })),

      // ── GMB Profiles ──
      gmbProfiles: [],
      addGmbProfile: (g) =>
        set((s) => ({ gmbProfiles: [...s.gmbProfiles, { ...g, id: uid(), archivedAt: null }] })),
      updateGmbProfile: (id, updates) => set((s) => ({ gmbProfiles: s.gmbProfiles.map((g) => g.id === id ? { ...g, ...updates } : g) })),
      deleteGmbProfile: (id) => set((s) => ({ gmbProfiles: s.gmbProfiles.filter((g) => g.id !== id) })),

      // ── Voice Memos ──
      voiceMemos: [],
      addVoiceMemo: (transcript) => set((s) => ({ voiceMemos: [...s.voiceMemos, { id: uid(), transcript, createdAt: new Date().toISOString() }] })),

      // ── Scorecards ──
      scorecards: Array.from({ length: 12 }, () => null) as (WeeklyScorecardSlot | null)[],
      lastWeeklyScorecardWeekKey: null,
      applyWeeklyScorecard: (weekIndex, slot) =>
        set((s) => {
          const sc = [...s.scorecards]
          while (sc.length < 12) sc.push(null)
          if (weekIndex >= 0 && weekIndex < 12) sc[weekIndex] = slot
          return {
            scorecards: sc,
            lastWeeklyScorecardWeekKey: slot.weekKey ?? s.lastWeeklyScorecardWeekKey,
          }
        }),
      lastWeeklyReportWeekKey: null,
      setLastWeeklyReportWeekKey: (key) => set({ lastWeeklyReportWeekKey: key }),

      // ── Identity & Vision ──
      identityStatements: [],
      visionItems: [],
      northStars: [],
      addIdentity: (text) => set((s) => ({ identityStatements: [...s.identityStatements, { id: uid(), text, status: 'aspirational' as const, order: s.identityStatements.length }] })),
      updateIdentity: (id, updates) => set((s) => ({ identityStatements: s.identityStatements.map((i) => i.id === id ? { ...i, ...updates } : i) })),
      deleteIdentity: (id) => set((s) => ({ identityStatements: s.identityStatements.filter((i) => i.id !== id) })),
      addVisionItem: (text, type) => set((s) => ({ visionItems: [...s.visionItems, { id: uid(), text, type, order: s.visionItems.length }] })),
      deleteVisionItem: (id) => set((s) => ({ visionItems: s.visionItems.filter((v) => v.id !== id) })),
      addNorthStar: (ns) => set((s) => ({ northStars: [...s.northStars, { ...ns, id: uid() }] })),
      updateNorthStar: (id, updates) => set((s) => ({ northStars: s.northStars.map((n) => n.id === id ? { ...n, ...updates } : n) })),

      // ── Goals ──
      goals: [],
      addGoal: (g) => {
        const gid = uid()
        set((s) => ({ goals: [...s.goals, { ...g, id: gid, createdAt: new Date().toISOString() }] }))
        get().logEvent('goal_created', {
          goalId: gid,
          targetMetric: g.targetMetric,
          targetValue: g.targetValue,
        })
      },
      updateGoal: (id, updates) => set((s) => ({ goals: s.goals.map((g) => g.id === id ? { ...g, ...updates } : g) })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      // ── Projects ──
      projects: [],
      projectAbandonLog: [],
      addProject: (p) =>
        set((s) => ({
          projects: [...s.projects, { ...p, id: uid(), createdAt: new Date().toISOString(), archivedAt: null }],
        })),
      updateProject: (id, updates) => {
        const prev = get().projects.find((p) => p.id === id)
        set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)) }))
        if (updates.status != null && prev && updates.status !== prev.status) {
          get().logEvent('project_status_changed', {
            projectId: id,
            oldStatus: prev.status,
            newStatus: updates.status,
          })
        }
      },
      archiveProject: (id) => {
        const prev = get().projects.find((p) => p.id === id)
        if (!prev || isArchived(prev)) return
        const ts = new Date().toISOString()
        set((s) => ({
          projects: s.projects.map((p) => (p.id === id ? { ...p, archivedAt: ts } : p)),
          tasks: s.tasks.map((t) => (t.projectId === id ? { ...t, projectId: undefined } : t)),
          projectAbandonLog: [...s.projectAbandonLog, { projectId: id, name: prev.name, abandonedAt: ts }],
        }))
      },

      // ── Focus Sessions ──
      focusSessions: [],
      addFocusSession: (s_) => {
        const fid = uid()
        set((s) => ({ focusSessions: [...s.focusSessions, { ...s_, id: fid }] }))
        get().logEvent('focus_session_started', { taskId: s_.taskId, projectId: s_.projectId })
      },
      updateFocusSession: (id, updates) => {
        const prev = get().focusSessions.find((f) => f.id === id)
        set((s) => ({
          focusSessions: s.focusSessions.map((f) => (f.id === id ? { ...f, ...updates } : f)),
        }))
        const next = get().focusSessions.find((f) => f.id === id)
        if (updates.endedAt && prev && !prev.endedAt && next) {
          get().logEvent('focus_session_ended', {
            duration: next.duration,
            quality: next.quality,
            distractions: next.distractions,
          })
        }
      },

      // ── Knowledge Vault ──
      knowledgeEntries: [],
      addKnowledge: (k) => {
        const kid = uid()
        set((s) => ({
          knowledgeEntries: [...s.knowledgeEntries, { ...k, id: kid, createdAt: new Date().toISOString() }],
        }))
        return kid
      },
      updateKnowledge: (id, updates) => set((s) => ({ knowledgeEntries: s.knowledgeEntries.map((k) => k.id === id ? { ...k, ...updates } : k) })),
      deleteKnowledge: (id) => set((s) => ({ knowledgeEntries: s.knowledgeEntries.filter((k) => k.id !== id) })),

      // ── AI Reports ──
      aiReports: [],
      addAiReport: (r) => set((s) => ({ aiReports: [...s.aiReports, { ...r, id: uid(), createdAt: new Date().toISOString() }] })),

      // ── V2 Intelligence ──
      behavioralEvents: [],
      logEvent: (eventType, eventData) =>
        set((s) => {
          const day = s.todayHealth.date
          const tasksDoneToday = s.tasks.filter(
            (t) => !isArchived(t) && t.done && t.completedAt?.startsWith(day)
          ).length
          const todayFocusCount = s.focusSessions.filter((f) => f.startedAt?.startsWith(day)).length
          const tasksCommitted = s.tasks.filter(
            (t) =>
              !isArchived(t) && (t.createdAt.startsWith(day) || (!t.done && t.priority !== 'low'))
          ).length
          const score = getExecutionScore(
            s.todayHealth,
            tasksCommitted,
            tasksDoneToday,
            todayFocusCount,
            s.trackPrayers
          )
          return {
            behavioralEvents: [
              ...s.behavioralEvents.slice(-499),
              {
                id: uid(),
                eventType,
                eventData,
                timestamp: new Date().toISOString(),
                dayScoreAtTime: score,
              },
            ],
          }
        }),
      obstacleResponses: [],
      addObstacle: (o) => set((s) => ({ obstacleResponses: [...s.obstacleResponses, { ...o, id: uid(), createdAt: new Date().toISOString() }] })),
      skillLevels: [],
      addSkillXp: (category, skill, amount) => set((s) => ({
        skillLevels: s.skillLevels.map(sl => {
          if (sl.category === category && sl.skill === skill) {
            const newXp = sl.xp + amount
            const levelUp = newXp >= 100
            return { ...sl, xp: levelUp ? newXp - 100 : newXp, level: levelUp ? sl.level + 1 : sl.level }
          }
          return sl
        })
      })),
      decisionJournal: [],
      addDecision: (d) => {
        const did = uid()
        set((s) => ({
          decisionJournal: [...s.decisionJournal, { ...d, id: did, createdAt: new Date().toISOString() }],
        }))
        return did
      },
      updateDecision: (id, updates) => set((s) => ({ decisionJournal: s.decisionJournal.map(d => d.id === id ? { ...d, ...updates } : d) })),
      deleteDecision: (id) => set((s) => ({ decisionJournal: s.decisionJournal.filter(d => d.id !== id) })),
      timeCapsules: [],
      addTimeCapsule: (letter, deliverDate) => set((s) => ({ timeCapsules: [...s.timeCapsules, { id: uid(), letter, deliverDate, delivered: false, createdAt: new Date().toISOString() }] })),
      openTimeCapsule: (id) => set((s) => ({ timeCapsules: s.timeCapsules.map(c => c.id === id ? { ...c, delivered: true } : c) })),
      accountabilityContract: null,
      setContract: (c) => set({ accountabilityContract: c }),
      weeklyReflections: [],
      addReflection: (r) => set((s) => ({ weeklyReflections: [...s.weeklyReflections, { ...r, id: uid(), createdAt: new Date().toISOString() }] })),
      updateReflection: (id, updates) =>
        set((s) => ({
          weeklyReflections: s.weeklyReflections.map((x) => (x.id === id ? { ...x, ...updates } : x)),
        })),
      deleteReflection: (id) =>
        set((s) => ({ weeklyReflections: s.weeklyReflections.filter((x) => x.id !== id) })),
      contacts: [],
      addContact: (c) => set((s) => ({ contacts: [...s.contacts, { ...c, id: uid() }] })),
      updateContact: (id, updates) => set((s) => ({ contacts: s.contacts.map(c => c.id === id ? { ...c, ...updates } : c) })),
      deleteContact: (id) => set((s) => ({ contacts: s.contacts.filter(c => c.id !== id) })),
      contextualQuotes: [],

      proactiveMessages: [],
      lastProactiveCheck: null,
      proactiveDayKey: '',
      proactiveGeneratedToday: 0,
      dailyNetSnapshots: [],
      markProactiveRead: (id) =>
        set((s) => ({
          proactiveMessages: s.proactiveMessages.map((m) => (m.id === id ? { ...m, read: true } : m)),
        })),
      dismissProactive: (id) =>
        set((s) => ({ proactiveMessages: s.proactiveMessages.filter((m) => m.id !== id) })),
      addScheduledProactiveMessage: (p) =>
        set((s) => ({
          proactiveMessages: [
            {
              id: uid(),
              triggerId: p.triggerId,
              priority: p.priority,
              body: p.body,
              createdAt: new Date().toISOString(),
              read: false,
              revealAt: p.revealAt,
              ctaHref: p.ctaHref,
            },
            ...s.proactiveMessages,
          ],
        })),
      runProactiveEvaluation: () => {
        const s = get()
        const now = Date.now()
        const fourH = 4 * 3600000
        if (s.lastProactiveCheck && now - new Date(s.lastProactiveCheck).getTime() < fourH) return
        const dayKey = today()
        let gen = s.proactiveGeneratedToday
        if (s.proactiveDayKey !== dayKey) gen = 0
        const { net: monthlyNet } = computeMonthlyMoneySnapshot(s)
        const candidates = buildProactiveCandidates({
          clients: s.clients.filter((c) => !isArchived(c)),
          businesses: s.businesses.filter((b) => !isArchived(b)),
          tasks: s.tasks.filter((t) => !isArchived(t)),
          commitments: s.commitments,
          revenueEntries: s.revenueEntries,
          proactiveMessages: s.proactiveMessages,
          anthropicKey: s.anthropicKey,
          monthlyNet,
          decisionJournal: s.decisionJournal,
        })
        const toAdd: ProactiveMessage[] = []
        for (const c of candidates) {
          if (gen >= 5) break
          const dedupMs = (c.dedupHours ?? 24) * 3600000
          const dup = s.proactiveMessages.some(
            (m) => m.triggerId === c.triggerId && now - new Date(m.createdAt).getTime() < dedupMs
          )
          if (dup) continue
          toAdd.push({
            id: uid(),
            triggerId: c.triggerId,
            priority: c.priority,
            body: c.body,
            createdAt: new Date().toISOString(),
            read: false,
            ctaHref: c.ctaHref,
          })
          gen++
        }
        set({
          proactiveMessages: [...toAdd, ...s.proactiveMessages],
          lastProactiveCheck: new Date().toISOString(),
          proactiveDayKey: dayKey,
          proactiveGeneratedToday: gen,
        })
      },
      appendDailyNetSnapshot: () =>
        set((s) => {
          const { net } = computeMonthlyMoneySnapshot(s)
          const day = today()
          const rest = s.dailyNetSnapshots.filter((x) => x.date !== day)
          return { dailyNetSnapshots: [...rest, { date: day, net }].slice(-30) }
        }),
      mentorPersonas: builtinMentors(),
      addMentorPersona: (m) =>
        set((s) => ({
          mentorPersonas: [...s.mentorPersonas, { ...m, id: uid(), createdAt: new Date().toISOString() }],
        })),
      updateMentorPersona: (id, updates) =>
        set((s) => ({
          mentorPersonas: s.mentorPersonas.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),
      removeMentorPersona: (id) =>
        set((s) => ({
          mentorPersonas: s.mentorPersonas.filter((m) => m.id !== id || m.isBuiltin),
        })),

      dashboardLayout: DEFAULT_DASHBOARD_LAYOUT,
      setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
      reorderDashboardTiles: (activeId, overId) =>
        set((s) => {
          const sorted = [...s.dashboardLayout.tiles].sort((a, b) => a.order - b.order)
          const oldIndex = sorted.findIndex((t) => t.tileId === activeId)
          const newIndex = sorted.findIndex((t) => t.tileId === overId)
          if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return {}
          const next = [...sorted]
          const [removed] = next.splice(oldIndex, 1)
          next.splice(newIndex, 0, removed)
          const reordered = next.map((t, i) => ({ ...t, order: i }))
          return {
            dashboardLayout: {
              tiles: reordered,
              lastModified: new Date().toISOString(),
            },
          }
        }),
      updateDashboardTileSpan: (tileId, gridColumn) =>
        set((s) => ({
          dashboardLayout: {
            ...s.dashboardLayout,
            lastModified: new Date().toISOString(),
            tiles: s.dashboardLayout.tiles.map((t) => (t.tileId === tileId ? { ...t, gridColumn } : t)),
          },
        })),
      setDashboardTileVisible: (tileId, visible) =>
        set((s) => ({
          dashboardLayout: {
            ...s.dashboardLayout,
            lastModified: new Date().toISOString(),
            tiles: s.dashboardLayout.tiles.map((t) => (t.tileId === tileId ? { ...t, visible } : t)),
          },
        })),
      showDashboardTile: (tileId) =>
        set((s) => {
          const maxOrder = Math.max(0, ...s.dashboardLayout.tiles.map((t) => t.order))
          return {
            dashboardLayout: {
              ...s.dashboardLayout,
              lastModified: new Date().toISOString(),
              tiles: s.dashboardLayout.tiles.map((t) =>
                t.tileId === tileId ? { ...t, visible: true, order: maxOrder + 1 } : t
              ),
            },
          }
        }),
      resetDashboardLayout: () =>
        set({
          dashboardLayout: {
            ...DEFAULT_DASHBOARD_LAYOUT,
            lastModified: new Date().toISOString(),
          },
        }),
    }),
    {
      name: 'art-os-store',
      partialize: (state) => {
        const { authenticated: _a, ...rest } = state
        return rest as unknown as AppState
      },
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState> | undefined
        const base = { ...current, ...p } as AppState
        base.dashboardLayout = normalizeDashboardLayout(p?.dashboardLayout ?? current.dashboardLayout)
        base.notificationPrefs = { ...INITIAL_NOTIFICATIONS, ...base.notificationPrefs }
        if (!Array.isArray(base.customHabits)) base.customHabits = []
        if (!Array.isArray(base.projectAbandonLog)) base.projectAbandonLog = []
        return base
      },
    }
  )
)

// ── Computed helpers (call with store state) ──
export function getAgencyTotals(clients: Client[]) {
  const active = clients.filter((c) => c.active && !isArchived(c))
  const gross = active.reduce((s, c) => s + c.grossMonthly, 0)
  const adSpend = active.reduce((s, c) => s + c.adSpend, 0)
  const net = active.reduce((s, c) => s + getClientNet(c), 0)
  return { gross, adSpend, net, count: active.length }
}
export function getDailyScore(health: HealthLog, tasksDoneToday: number) {
  const prayerCount = Object.values(health.prayers).filter(Boolean).length
  const prayer = (prayerCount / 5) * 35
  const h = (health.gym ? 15 : 0) + (health.energyDrinks === 0 ? 10 : 0)
  const prod = Math.min(40, tasksDoneToday * 8)
  return Math.round(prayer + h + prod)
}

/** PRD §19 + GAP 12 — when prayer tracking is off, faith points are removed and other components scale to 100. */
export function getExecutionScore(
  health: HealthLog,
  tasksCommitted: number,
  tasksDone: number,
  focusSessionsToday: number,
  prayerEnabled: boolean
) {
  if (prayerEnabled) {
    const commitment = tasksCommitted > 0 ? (tasksDone / tasksCommitted) * 35 : 0
    const energy =
      (health.gym ? 10 : 0) +
      (health.mealQuality === 'good' ? 5 : 0) +
      (health.energyDrinks < 2 ? 5 : 0) +
      (health.sleepTime && health.wakeTime ? 5 : 0)
    const focus = Math.min(20, focusSessionsToday * 5)
    const prayerCount = Object.values(health.prayers).filter(Boolean).length
    const faith = prayerCount * 4
    return Math.round(Math.min(100, commitment + energy + focus + faith))
  }
  const commitment = tasksCommitted > 0 ? (tasksDone / tasksCommitted) * 43.75 : 0
  const energy =
    (health.gym ? 12.5 : 0) +
    (health.mealQuality === 'good' ? 6.25 : 0) +
    (health.energyDrinks < 2 ? 6.25 : 0) +
    (health.sleepTime && health.wakeTime ? 6.25 : 0)
  const focus = Math.min(25, focusSessionsToday * 6.25)
  return Math.round(Math.min(100, commitment + energy + focus))
}

/** PRD §9.7 — execution drawer formula rows (must stay in sync with `getExecutionScore`). */
export interface ExecutionScoreBreakdown {
  prayerEnabled: boolean
  commitment: { earned: number; max: number; label: string }
  energy: { earned: number; max: number; parts: { label: string; earned: number; max: number }[] }
  focus: { earned: number; max: number; sessions: number }
  faith: { earned: number; max: number; prayersLogged: number } | null
  total: number
}

export function getExecutionScoreBreakdown(
  health: HealthLog,
  tasksCommitted: number,
  tasksDone: number,
  focusSessionsToday: number,
  prayerEnabled: boolean
): ExecutionScoreBreakdown {
  if (prayerEnabled) {
    const commitmentEarned = tasksCommitted > 0 ? (tasksDone / tasksCommitted) * 35 : 0
    const parts = [
      { label: 'Gym / workout', earned: health.gym ? 10 : 0, max: 10 },
      { label: 'Meal quality (good)', earned: health.mealQuality === 'good' ? 5 : 0, max: 5 },
      { label: 'Energy drinks (<2)', earned: health.energyDrinks < 2 ? 5 : 0, max: 5 },
      { label: 'Sleep & wake logged', earned: health.sleepTime && health.wakeTime ? 5 : 0, max: 5 },
    ]
    const energyEarned = parts.reduce((s, p) => s + p.earned, 0)
    const focusEarned = Math.min(20, focusSessionsToday * 5)
    const prayerCount = Object.values(health.prayers).filter(Boolean).length
    const faithEarned = prayerCount * 4
    const total = Math.round(
      Math.min(100, commitmentEarned + energyEarned + focusEarned + faithEarned)
    )
    return {
      prayerEnabled: true,
      commitment: {
        earned: Math.round(commitmentEarned * 10) / 10,
        max: 35,
        label: 'Commitment (tasks done vs committed today)',
      },
      energy: { earned: Math.round(energyEarned * 10) / 10, max: 25, parts },
      focus: {
        earned: Math.round(focusEarned * 10) / 10,
        max: 20,
        sessions: focusSessionsToday,
      },
      faith: {
        earned: Math.round(faithEarned * 10) / 10,
        max: 20,
        prayersLogged: prayerCount,
      },
      total,
    }
  }
  const commitmentEarned = tasksCommitted > 0 ? (tasksDone / tasksCommitted) * 43.75 : 0
  const parts = [
    { label: 'Gym / workout', earned: health.gym ? 12.5 : 0, max: 12.5 },
    { label: 'Meal quality (good)', earned: health.mealQuality === 'good' ? 6.25 : 0, max: 6.25 },
    { label: 'Energy drinks (<2)', earned: health.energyDrinks < 2 ? 6.25 : 0, max: 6.25 },
    { label: 'Sleep & wake logged', earned: health.sleepTime && health.wakeTime ? 6.25 : 0, max: 6.25 },
  ]
  const energyEarned = parts.reduce((s, p) => s + p.earned, 0)
  const focusEarned = Math.min(25, focusSessionsToday * 6.25)
  const total = Math.round(Math.min(100, commitmentEarned + energyEarned + focusEarned))
  return {
    prayerEnabled: false,
    commitment: {
      earned: Math.round(commitmentEarned * 10) / 10,
      max: 43.75,
      label: 'Commitment (scaled — prayer tracking off)',
    },
    energy: { earned: Math.round(energyEarned * 10) / 10, max: 31.25, parts },
    focus: {
      earned: Math.round(focusEarned * 10) / 10,
      max: 25,
      sessions: focusSessionsToday,
    },
    faith: null,
    total,
  }
}

export function getProjectIce(p: Project) { return p.impact * p.confidence * p.ease }

export function getScoreZone(score: number) {
  if (score >= 86) return { label: 'Peak performance', color: 'var(--positive)', emoji: '✨' }
  if (score >= 71) return { label: 'Locked in', color: 'var(--positive)', emoji: '🟢' }
  if (score >= 51) return { label: 'Solid day', color: 'var(--accent)', emoji: '🔵' }
  if (score >= 31) return { label: 'Getting there', color: 'var(--warning)', emoji: '🟡' }
  return { label: 'Restart tomorrow', color: 'var(--negative)', emoji: '🔴' }
}

export function getBusinessHealth(biz: Business, tasks: Task[], revenueEntries: RevenueEntry[]): BusinessHealth {
  const bizTasks = tasks.filter((t) => t.businessId === biz.id && !isArchived(t))
  const doneLast7 = bizTasks.filter(t => t.done && t.completedAt && new Date(t.completedAt) > new Date(Date.now() - 7 * 86400000)).length
  const hasRevenue =
    biz.monthlyRevenue > 0 || revenueEntries.some((r) => r.businessId === biz.id && !isArchived(r))
  if (doneLast7 === 0 && biz.status !== 'dormant') return 'flatline'
  if (doneLast7 < 2 || (!hasRevenue && biz.status !== 'active_prerevenue' && biz.status !== 'dormant')) return 'weak'
  return 'strong'
}

export function getTaskPriorityScore(task: Task, biz?: Business): number {
  const priorityBase = { crit: 90, high: 70, med: 50, low: 20 }[task.priority]
  const revenueBonus = biz && biz.monthlyRevenue > 10000 ? 10 : biz && biz.monthlyRevenue > 0 ? 5 : 0
  const dripBonus = task.drip === 'double_down' ? 15 : task.drip === 'replace' ? 5 : 0
  const ageBonus = Math.min(10, Math.floor((Date.now() - new Date(task.createdAt).getTime()) / 86400000))
  return Math.min(100, priorityBase + revenueBonus + dripBonus + ageBonus)
}
