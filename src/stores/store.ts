import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ──
export type Priority = 'crit' | 'high' | 'med' | 'low'
export type InsightType = 'revenue' | 'risk' | 'efficiency'
export type DriverStatus = 'LIVE' | 'BUILD' | 'TEST' | 'PLAN' | 'IDEA' | 'STALE' | 'NEVER TRIED'
export type BusinessType = 'agency' | 'service' | 'app' | 'content' | 'real_estate' | 'coaching' | 'other'
export type BusinessStatus = 'active_healthy' | 'active_slow' | 'active_prerevenue' | 'dormant' | 'backburner' | 'idea'

export interface Business {
  id: string
  name: string
  type: BusinessType
  status: BusinessStatus
  monthlyRevenue: number
  color: string
  icon: string
  notes?: string
  createdAt: string
}

export interface Client {
  id: string
  businessId: string
  name: string
  grossMonthly: number
  adSpend: number
  serviceType: string
  meetingFrequency: string
  startDate?: string
  active: boolean
  createdAt: string
}

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
  createdAt: string
  completedAt?: string
}

export interface Insight { id: string; type: InsightType; priority: string; title: string; body: string; rating?: 'up' | 'down' | null; snoozedUntil?: string; createdAt: string }
export interface HealthLog { date: string; prayers: { fajr: boolean; dhuhr: boolean; asr: boolean; maghrib: boolean; isha: boolean }; gym: boolean; sleepTime?: string; wakeTime?: string; mealQuality?: 'good' | 'okay' | 'bad'; energyDrinks: number; screenTimeHours: number; dailyScore: number }
export interface Streak { habit: string; currentStreak: number; longestStreak: number; lastCompleted?: string }
export interface Idea { id: string; text: string; category: string; promoted: boolean; archived: boolean; createdAt: string }
export interface RevenueDriver { id: string; businessId: string; category: string; name: string; impact: number; status: DriverStatus; notes?: string }
export interface Commitment { id: string; text: string; source: string; dueDate?: string; fulfilled: boolean; fulfilledDate?: string; createdAt: string }
export interface Win { id: string; title: string; dollarValue?: number; businessId?: string; category: string; notes?: string; createdAt: string }
export interface ScheduleBlock { time: string; title: string; type: 'prayer' | 'work' | 'health' | 'personal' | 'meal'; duration: number; completed: boolean }
export interface AiMessage { id: string; role: 'user' | 'assistant'; content: string; businessContext?: string; createdAt: string }
export interface PipelineDeal { id: string; companyName: string; contactName?: string; contactEmail?: string; stage: 'lead' | 'contacted' | 'call_booked' | 'proposal' | 'signed' | 'onboarding'; dealValue?: number; source?: string; notes?: string; createdAt: string }
export interface Sprint { id: string; sprintNumber: number; weekStart: string; deliverables: { text: string; done: boolean }[]; status: 'completed' | 'active' | 'upcoming' }
export interface SOP { id: string; businessId: string; title: string; status: 'not_started' | 'in_progress' | 'documented'; content?: string }
export interface EnergyLog { date: string; timeOfDay: 'morning' | 'afternoon' | 'evening'; level: number }
export interface RevenueEntry { id: string; businessId: string; amount: number; date: string; source?: string; notes?: string }
export interface ExpenseEntry { id: string; category: string; amount: number; date: string; notes?: string; recurring: boolean }
export interface GmbProfile { id: string; businessId: string; city: string; reviewCount: number; callsPerMonth: number; ranking: string; status: 'strong' | 'medium' | 'new'; hasAddress: boolean }

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
  id: string; name: string; description: string; businessId?: string; goalId?: string
  impact: number; confidence: number; ease: number
  status: ProjectStatus; progress: number; deadline?: string; createdAt: string
}

export interface FocusSession {
  id: string; taskId?: string; projectId?: string; startedAt: string; endedAt?: string
  duration: number; quality?: number; notes?: string; distractions: number
}

export interface KnowledgeEntry {
  id: string; title: string; source: string; type: 'book' | 'podcast' | 'article' | 'video' | 'idea' | 'framework' | 'swipe'
  takeaways: string; actionItem?: string; status?: string; createdAt: string
}

export interface AiReport {
  id: string; level: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  content: string; date: string; grade?: string; createdAt: string
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

export interface DecisionEntry {
  id: string; decision: string; reasoning: string; expectedOutcome: string
  actualOutcome?: string; reviewDate?: string; createdAt: string
}

export interface TimeCapsule {
  id: string; letter: string; deliverDate: string; delivered: boolean; createdAt: string
}

export interface AccountabilityContract {
  commitments: string[]; consequence: string; signedDate: string
}

export interface WeeklyReflection {
  id: string; weekStart: string; worked: string; didnt: string; avoided: string; change: string; grateful: string; createdAt: string
}

export interface ContactEntry {
  id: string; name: string; role: string; lastContact?: string; notes?: string
}

export type BusinessHealth = 'strong' | 'weak' | 'flatline'

interface AppState {
  // ── Auth & Onboarding ──
  authenticated: boolean
  pin: string
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
  trackingPrefs: { prayers: boolean; gym: boolean; sleep: boolean; meals: boolean; energyDrinks: boolean; screenTime: boolean; gambling: boolean; coldEmail: boolean }
  setAuthenticated: (v: boolean) => void
  setPin: (v: string) => void
  completeOnboarding: () => void
  updateProfile: (updates: Partial<Pick<AppState, 'userName' | 'userLocation' | 'userAge' | 'userSituation' | 'incomeTarget' | 'targetDate' | 'incomeWhy' | 'exitTarget' | 'exitBusinessId' | 'northStarMetric' | 'wakeUpTime' | 'actualWakeTime' | 'exercise' | 'dietQuality' | 'caffeineType' | 'caffeineAmount' | 'phoneScreenTime' | 'energyLevel' | 'stressLevel' | 'hasFaith' | 'faithTradition' | 'trackPrayers' | 'faithConsistency' | 'faithRoleModel' | 'procrastination' | 'patterns' | 'biggestDistraction' | 'tryingToQuit' | 'lockedInMemory' | 'aiAvoidanceStyle' | 'aiPushStyle' | 'aiMotivators' | 'savingsRange' | 'anthropicKey' | 'stripeKey'>>) => void
  setTrackingPrefs: (prefs: Partial<AppState['trackingPrefs']>) => void
  resetAll: () => void
  seedDefaultData: () => void

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
  deleteBusiness: (id: string) => void

  // ── Clients ──
  clients: Client[]
  addClient: (c: Omit<Client, 'id' | 'createdAt'>) => void
  updateClient: (id: string, updates: Partial<Client>) => void
  deleteClient: (id: string) => void

  // ── Tasks ──
  tasks: Task[]
  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  updateTask: (id: string, updates: Partial<Task>) => void

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
  addCommitment: (text: string, source: string, dueDate?: string) => void
  fulfillCommitment: (id: string) => void

  // ── Wins ──
  wins: Win[]
  addWin: (w: Omit<Win, 'id' | 'createdAt'>) => void

  // ── Schedule ──
  todaySchedule: ScheduleBlock[]
  setSchedule: (blocks: ScheduleBlock[]) => void
  toggleScheduleBlock: (index: number) => void

  // ── AI Messages ──
  aiMessages: AiMessage[]
  addAiMessage: (msg: Omit<AiMessage, 'id' | 'createdAt'>) => void
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
  updateSprintDeliverable: (sprintId: string, index: number, done: boolean) => void

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
  scorecards: any[]

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
  addProject: (p: Omit<Project, 'id' | 'createdAt'>) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void

  // ── Focus Sessions ──
  focusSessions: FocusSession[]
  addFocusSession: (s: Omit<FocusSession, 'id'>) => void
  updateFocusSession: (id: string, updates: Partial<FocusSession>) => void

  // ── Knowledge Vault ──
  knowledgeEntries: KnowledgeEntry[]
  addKnowledge: (k: Omit<KnowledgeEntry, 'id' | 'createdAt'>) => void
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
  addDecision: (d: Omit<DecisionEntry, 'id' | 'createdAt'>) => void
  updateDecision: (id: string, updates: Partial<DecisionEntry>) => void
  deleteDecision: (id: string) => void
  timeCapsules: TimeCapsule[]
  addTimeCapsule: (letter: string, deliverDate: string) => void
  openTimeCapsule: (id: string) => void
  accountabilityContract: AccountabilityContract | null
  setContract: (c: AccountabilityContract) => void
  weeklyReflections: WeeklyReflection[]
  addReflection: (r: Omit<WeeklyReflection, 'id' | 'createdAt'>) => void
  contacts: ContactEntry[]
  addContact: (c: Omit<ContactEntry, 'id'>) => void
  updateContact: (id: string, updates: Partial<ContactEntry>) => void
  deleteContact: (id: string) => void
  contextualQuotes: string[]
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
const today = () => new Date().toISOString().split('T')[0]

const INITIAL_TRACKING = { prayers: true, gym: true, sleep: true, meals: true, energyDrinks: true, screenTime: true, gambling: true, coldEmail: true }

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Auth & Onboarding ──
      authenticated: false,
      pin: '1234',
      onboardingComplete: false,
      userName: '',
      userLocation: '',
      userAge: 0,
      userSituation: '',
      incomeTarget: 50000,
      targetDate: '',
      incomeWhy: '',
      exitTarget: 0,
      exitBusinessId: '',
      northStarMetric: '',
      wakeUpTime: '07:00',
      actualWakeTime: '08:00',
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
      trackingPrefs: { ...INITIAL_TRACKING },
      setAuthenticated: (v) => set({ authenticated: v }),
      setPin: (v) => set({ pin: v }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      updateProfile: (updates) => set(updates),
      setTrackingPrefs: (prefs) => set((s) => ({ trackingPrefs: { ...s.trackingPrefs, ...prefs } })),
      resetAll: () => set({ onboardingComplete: false, authenticated: false, businesses: [], clients: [], tasks: [], insights: [], ideas: [], drivers: [], wins: [], commitments: [], pipeline: [], sops: [], gmbProfiles: [], revenueEntries: [], expenseEntries: [], aiMessages: [], xp: 0, level: 1, streaks: [
        { habit: 'prayer', currentStreak: 0, longestStreak: 0 },
        { habit: 'gym', currentStreak: 0, longestStreak: 0 },
        { habit: 'sleep', currentStreak: 0, longestStreak: 0 },
        { habit: 'no_gamble', currentStreak: 0, longestStreak: 0 },
        { habit: 'cold_email', currentStreak: 0, longestStreak: 0 },
      ] }),

      seedDefaultData: () => {
        // No-op: all data comes from onboarding. Kept for interface compatibility.
      },

      // ── Theme ──
      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      // ── Sidebar ──
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      // ── Businesses ──
      businesses: [],
      addBusiness: (b) => set((s) => ({ businesses: [...s.businesses, { ...b, id: uid(), createdAt: new Date().toISOString() }] })),
      updateBusiness: (id, updates) => set((s) => ({ businesses: s.businesses.map((b) => b.id === id ? { ...b, ...updates } : b) })),
      deleteBusiness: (id) => set((s) => ({ businesses: s.businesses.filter((b) => b.id !== id) })),

      // ── Clients ──
      clients: [],
      addClient: (c) => set((s) => ({ clients: [...s.clients, { ...c, id: uid(), createdAt: new Date().toISOString() }] })),
      updateClient: (id, updates) => set((s) => ({ clients: s.clients.map((c) => c.id === id ? { ...c, ...updates } : c) })),
      deleteClient: (id) => set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),

      // ── Tasks ──
      tasks: [],
      addTask: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, id: uid(), createdAt: new Date().toISOString() }] })),
      toggleTask: (id) => set((s) => {
        const tasks = s.tasks.map((t) => {
          if (t.id !== id) return t
          const done = !t.done
          if (done) { const xp = s.xp + t.xpValue; setTimeout(() => set({ xp, level: Math.floor(xp / 500) + 1 }), 0) }
          return { ...t, done, completedAt: done ? new Date().toISOString() : undefined }
        })
        return { tasks }
      }),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      updateTask: (id, updates) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t) })),

      // ── Insights ──
      insights: [],
      addInsight: (i) => set((s) => ({ insights: [{ ...i, id: uid(), createdAt: new Date().toISOString() }, ...s.insights] })),
      rateInsight: (id, rating) => set((s) => ({ insights: s.insights.map((i) => i.id === id ? { ...i, rating } : i) })),
      snoozeInsight: (id) => { const d = new Date(); d.setDate(d.getDate() + 7); set((s) => ({ insights: s.insights.map((i) => i.id === id ? { ...i, snoozedUntil: d.toISOString() } : i) })) },
      dismissInsight: (id) => set((s) => ({ insights: s.insights.filter((i) => i.id !== id) })),

      // ── Health ──
      todayHealth: { date: today(), prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false }, gym: false, energyDrinks: 0, screenTimeHours: 0, dailyScore: 0 },
      healthHistory: [],
      updateHealth: (updates) => set((s) => ({ todayHealth: { ...s.todayHealth, ...updates } })),
      togglePrayer: (prayer) => set((s) => ({ todayHealth: { ...s.todayHealth, prayers: { ...s.todayHealth.prayers, [prayer]: !s.todayHealth.prayers[prayer] } } })),
      saveHealthDay: () => set((s) => ({ healthHistory: [...s.healthHistory.filter((h) => h.date !== s.todayHealth.date), s.todayHealth] })),

      // ── Streaks ──
      streaks: [
        { habit: 'prayer', currentStreak: 0, longestStreak: 0 },
        { habit: 'gym', currentStreak: 0, longestStreak: 0 },
        { habit: 'sleep', currentStreak: 0, longestStreak: 0 },
        { habit: 'no_gamble', currentStreak: 0, longestStreak: 0 },
        { habit: 'cold_email', currentStreak: 0, longestStreak: 0 },
      ],
      updateStreak: (habit, completed) => set((s) => ({
        streaks: s.streaks.map((st) => {
          if (st.habit !== habit) return st
          if (completed) { const n = st.currentStreak + 1; return { ...st, currentStreak: n, longestStreak: Math.max(n, st.longestStreak), lastCompleted: today() } }
          return { ...st, currentStreak: 0 }
        }),
      })),

      // ── Gamification ──
      xp: 0, level: 1,
      addXp: (amount) => set((s) => { const xp = s.xp + amount; return { xp, level: Math.floor(xp / 500) + 1 } }),

      // ── Ideas ──
      ideas: [],
      addIdea: (text, category) => set((s) => ({ ideas: [...s.ideas, { id: uid(), text, category, promoted: false, archived: false, createdAt: new Date().toISOString() }] })),
      updateIdea: (id, updates) => set((s) => ({ ideas: s.ideas.map((i) => i.id === id ? { ...i, ...updates } : i) })),
      promoteIdea: (id) => set((s) => ({ ideas: s.ideas.map((i) => i.id === id ? { ...i, promoted: true } : i) })),
      archiveIdea: (id) => set((s) => ({ ideas: s.ideas.map((i) => i.id === id ? { ...i, archived: true } : i) })),

      // ── Revenue Drivers ──
      drivers: [],
      updateDriverStatus: (id, status) => set((s) => ({ drivers: s.drivers.map((d) => d.id === id ? { ...d, status } : d) })),
      addDriver: (d) => set((s) => ({ drivers: [...s.drivers, { ...d, id: uid() }] })),
      deleteDriver: (id) => set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) })),

      // ── Commitments ──
      commitments: [],
      addCommitment: (text, source, dueDate) => set((s) => ({ commitments: [...s.commitments, { id: uid(), text, source, dueDate, fulfilled: false, createdAt: new Date().toISOString() }] })),
      fulfillCommitment: (id) => set((s) => ({ commitments: s.commitments.map((c) => c.id === id ? { ...c, fulfilled: true, fulfilledDate: today() } : c) })),

      // ── Wins ──
      wins: [],
      addWin: (w) => set((s) => ({ wins: [...s.wins, { ...w, id: uid(), createdAt: new Date().toISOString() }] })),

      // ── Schedule ──
      todaySchedule: [],
      setSchedule: (blocks) => set({ todaySchedule: blocks }),
      toggleScheduleBlock: (index) => set((s) => ({ todaySchedule: s.todaySchedule.map((b, i) => i === index ? { ...b, completed: !b.completed } : b) })),

      // ── AI Messages ──
      aiMessages: [],
      addAiMessage: (msg) => set((s) => ({ aiMessages: [...s.aiMessages, { ...msg, id: uid(), createdAt: new Date().toISOString() }] })),
      clearAiMessages: () => set({ aiMessages: [] }),

      // ── Pipeline ──
      pipeline: [],
      addDeal: (d) => set((s) => ({ pipeline: [...s.pipeline, { ...d, id: uid(), createdAt: new Date().toISOString() }] })),
      updateDeal: (id, updates) => set((s) => ({ pipeline: s.pipeline.map((d) => d.id === id ? { ...d, ...updates } : d) })),
      updateDealStage: (id, stage) => set((s) => ({ pipeline: s.pipeline.map((d) => d.id === id ? { ...d, stage } : d) })),
      deleteDeal: (id) => set((s) => ({ pipeline: s.pipeline.filter((d) => d.id !== id) })),

      // ── Sprints ──
      sprints: [],
      addSprint: (s_) => set((s) => ({ sprints: [...s.sprints, { ...s_, id: uid() }] })),
      updateSprintDeliverable: (sprintId, index, done) => set((s) => ({
        sprints: s.sprints.map((sp) => sp.id === sprintId ? { ...sp, deliverables: sp.deliverables.map((d, i) => i === index ? { ...d, done } : d) } : sp),
      })),

      // ── SOPs ──
      sops: [],
      addSop: (s_) => set((s) => ({ sops: [...s.sops, { ...s_, id: uid() }] })),
      updateSop: (id, updates) => set((s) => ({ sops: s.sops.map((sp) => sp.id === id ? { ...sp, ...updates } : sp) })),
      deleteSop: (id) => set((s) => ({ sops: s.sops.filter((sp) => sp.id !== id) })),

      // ── Energy Logs ──
      energyLogs: [],
      addEnergyLog: (log) => set((s) => ({ energyLogs: [...s.energyLogs, log] })),

      // ── Revenue & Expenses ──
      revenueEntries: [],
      expenseEntries: [],
      addRevenue: (r) => set((s) => ({ revenueEntries: [...s.revenueEntries, { ...r, id: uid() }] })),
      addExpense: (e) => set((s) => ({ expenseEntries: [...s.expenseEntries, { ...e, id: uid() }] })),
      deleteRevenue: (id) => set((s) => ({ revenueEntries: s.revenueEntries.filter((r) => r.id !== id) })),
      deleteExpense: (id) => set((s) => ({ expenseEntries: s.expenseEntries.filter((e) => e.id !== id) })),

      // ── GMB Profiles ──
      gmbProfiles: [],
      addGmbProfile: (g) => set((s) => ({ gmbProfiles: [...s.gmbProfiles, { ...g, id: uid() }] })),
      updateGmbProfile: (id, updates) => set((s) => ({ gmbProfiles: s.gmbProfiles.map((g) => g.id === id ? { ...g, ...updates } : g) })),
      deleteGmbProfile: (id) => set((s) => ({ gmbProfiles: s.gmbProfiles.filter((g) => g.id !== id) })),

      // ── Voice Memos ──
      voiceMemos: [],
      addVoiceMemo: (transcript) => set((s) => ({ voiceMemos: [...s.voiceMemos, { id: uid(), transcript, createdAt: new Date().toISOString() }] })),

      // ── Scorecards ──
      scorecards: [],

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
      addGoal: (g) => set((s) => ({ goals: [...s.goals, { ...g, id: uid(), createdAt: new Date().toISOString() }] })),
      updateGoal: (id, updates) => set((s) => ({ goals: s.goals.map((g) => g.id === id ? { ...g, ...updates } : g) })),
      deleteGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),

      // ── Projects ──
      projects: [],
      addProject: (p) => set((s) => ({ projects: [...s.projects, { ...p, id: uid(), createdAt: new Date().toISOString() }] })),
      updateProject: (id, updates) => set((s) => ({ projects: s.projects.map((p) => p.id === id ? { ...p, ...updates } : p) })),
      deleteProject: (id) => set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      // ── Focus Sessions ──
      focusSessions: [],
      addFocusSession: (s_) => set((s) => ({ focusSessions: [...s.focusSessions, { ...s_, id: uid() }] })),
      updateFocusSession: (id, updates) => set((s) => ({ focusSessions: s.focusSessions.map((f) => f.id === id ? { ...f, ...updates } : f) })),

      // ── Knowledge Vault ──
      knowledgeEntries: [],
      addKnowledge: (k) => set((s) => ({ knowledgeEntries: [...s.knowledgeEntries, { ...k, id: uid(), createdAt: new Date().toISOString() }] })),
      updateKnowledge: (id, updates) => set((s) => ({ knowledgeEntries: s.knowledgeEntries.map((k) => k.id === id ? { ...k, ...updates } : k) })),
      deleteKnowledge: (id) => set((s) => ({ knowledgeEntries: s.knowledgeEntries.filter((k) => k.id !== id) })),

      // ── AI Reports ──
      aiReports: [],
      addAiReport: (r) => set((s) => ({ aiReports: [...s.aiReports, { ...r, id: uid(), createdAt: new Date().toISOString() }] })),

      // ── V2 Intelligence ──
      behavioralEvents: [],
      logEvent: (eventType, eventData) => set((s) => {
        const score = getDailyScore(s.todayHealth, s.tasks.filter(t => t.done && t.completedAt?.startsWith(today())).length)
        return { behavioralEvents: [...s.behavioralEvents.slice(-500), { id: uid(), eventType, eventData, timestamp: new Date().toISOString(), dayScoreAtTime: score }] }
      }),
      obstacleResponses: [],
      addObstacle: (o) => set((s) => ({ obstacleResponses: [...s.obstacleResponses, { ...o, id: uid(), createdAt: new Date().toISOString() }] })),
      skillLevels: [
        { id: '1', category: 'Marketing', skill: 'Cold Email', level: 8, xp: 0 },
        { id: '2', category: 'Marketing', skill: 'GMB/SEO', level: 9, xp: 0 },
        { id: '3', category: 'Marketing', skill: 'Paid Ads', level: 2, xp: 0 },
        { id: '4', category: 'Marketing', skill: 'Content', level: 4, xp: 0 },
        { id: '5', category: 'Marketing', skill: 'Branding', level: 3, xp: 0 },
        { id: '6', category: 'Business', skill: 'Sales', level: 7, xp: 0 },
        { id: '7', category: 'Business', skill: 'Finance', level: 2, xp: 0 },
        { id: '8', category: 'Business', skill: 'Hiring', level: 1, xp: 0 },
        { id: '9', category: 'Business', skill: 'SOPs', level: 1, xp: 0 },
        { id: '10', category: 'Business', skill: 'Systems', level: 3, xp: 0 },
        { id: '11', category: 'Personal', skill: 'Discipline', level: 2, xp: 0 },
        { id: '12', category: 'Personal', skill: 'Fitness', level: 1, xp: 0 },
        { id: '13', category: 'Personal', skill: 'Faith', level: 2, xp: 0 },
        { id: '14', category: 'Personal', skill: 'Nutrition', level: 1, xp: 0 },
        { id: '15', category: 'Personal', skill: 'Focus', level: 2, xp: 0 },
      ],
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
      addDecision: (d) => set((s) => ({ decisionJournal: [...s.decisionJournal, { ...d, id: uid(), createdAt: new Date().toISOString() }] })),
      updateDecision: (id, updates) => set((s) => ({ decisionJournal: s.decisionJournal.map(d => d.id === id ? { ...d, ...updates } : d) })),
      deleteDecision: (id) => set((s) => ({ decisionJournal: s.decisionJournal.filter(d => d.id !== id) })),
      timeCapsules: [],
      addTimeCapsule: (letter, deliverDate) => set((s) => ({ timeCapsules: [...s.timeCapsules, { id: uid(), letter, deliverDate, delivered: false, createdAt: new Date().toISOString() }] })),
      openTimeCapsule: (id) => set((s) => ({ timeCapsules: s.timeCapsules.map(c => c.id === id ? { ...c, delivered: true } : c) })),
      accountabilityContract: null,
      setContract: (c) => set({ accountabilityContract: c }),
      weeklyReflections: [],
      addReflection: (r) => set((s) => ({ weeklyReflections: [...s.weeklyReflections, { ...r, id: uid(), createdAt: new Date().toISOString() }] })),
      contacts: [],
      addContact: (c) => set((s) => ({ contacts: [...s.contacts, { ...c, id: uid() }] })),
      updateContact: (id, updates) => set((s) => ({ contacts: s.contacts.map(c => c.id === id ? { ...c, ...updates } : c) })),
      deleteContact: (id) => set((s) => ({ contacts: s.contacts.filter(c => c.id !== id) })),
      contextualQuotes: [],
    }),
    { name: 'art-os-store' }
  )
)

// ── Computed helpers (call with store state) ──
export function getClientNet(c: Client) { return c.grossMonthly - c.adSpend - (c.grossMonthly * 0.03) }
export function getAgencyTotals(clients: Client[]) {
  const active = clients.filter((c) => c.active)
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

export function getExecutionScore(health: HealthLog, tasksCommitted: number, tasksDone: number, focusSessionsToday: number) {
  const commitment = tasksCommitted > 0 ? (tasksDone / tasksCommitted) * 35 : 0
  const energy = (health.gym ? 10 : 0) + (health.mealQuality === 'good' ? 5 : 0) + (health.energyDrinks < 2 ? 5 : 0) + ((health.sleepTime && health.wakeTime) ? 5 : 0)
  const focus = Math.min(20, focusSessionsToday * 5)
  const prayerCount = Object.values(health.prayers).filter(Boolean).length
  const faith = prayerCount * 4
  return Math.round(Math.min(100, commitment + energy + focus + faith))
}

export function getProjectIce(p: Project) { return p.impact * p.confidence * p.ease }

export function getScoreZone(score: number) {
  if (score >= 86) return { label: 'Peak performance', color: '#10b981', emoji: '✨' }
  if (score >= 71) return { label: 'Locked in', color: '#10b981', emoji: '🟢' }
  if (score >= 51) return { label: 'Solid day', color: '#3b82f6', emoji: '🔵' }
  if (score >= 31) return { label: 'Getting there', color: '#f59e0b', emoji: '🟡' }
  return { label: 'Restart tomorrow', color: '#ef4444', emoji: '🔴' }
}

export function getBusinessHealth(biz: Business, tasks: Task[], revenueEntries: RevenueEntry[]): BusinessHealth {
  const bizTasks = tasks.filter(t => t.businessId === biz.id)
  const doneLast7 = bizTasks.filter(t => t.done && t.completedAt && new Date(t.completedAt) > new Date(Date.now() - 7 * 86400000)).length
  const hasRevenue = biz.monthlyRevenue > 0 || revenueEntries.some(r => r.businessId === biz.id)
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
