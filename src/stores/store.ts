import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Priority = 'crit' | 'high' | 'med' | 'low'
export type InsightType = 'revenue' | 'risk' | 'efficiency'
export type DriverStatus = 'LIVE' | 'BUILD' | 'TEST' | 'PLAN' | 'IDEA' | 'STALE' | 'NEVER TRIED'

export interface Task {
  id: string
  businessId: string
  text: string
  tag: string
  priority: Priority
  done: boolean
  dueDate?: string
  xpValue: number
  createdAt: string
  completedAt?: string
}

export interface Insight {
  id: string
  type: InsightType
  priority: string
  title: string
  body: string
  rating?: 'up' | 'down' | null
  snoozedUntil?: string
  createdAt: string
}

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
}

export interface Streak {
  habit: string
  currentStreak: number
  longestStreak: number
  lastCompleted?: string
}

export interface Idea {
  id: string
  text: string
  category: string
  promoted: boolean
  archived: boolean
  createdAt: string
}

export interface RevenueDriver {
  id: string
  businessId: string
  category: string
  name: string
  impact: number
  status: DriverStatus
  notes?: string
}

export interface Commitment {
  id: string
  text: string
  source: string
  dueDate?: string
  fulfilled: boolean
  fulfilledDate?: string
  createdAt: string
}

export interface Win {
  id: string
  title: string
  dollarValue?: number
  businessId?: string
  category: string
  notes?: string
  createdAt: string
}

export interface ScheduleBlock {
  time: string
  title: string
  type: 'prayer' | 'work' | 'health' | 'personal' | 'meal'
  duration: number
  completed: boolean
}

export interface AiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  businessContext?: string
  createdAt: string
}

export interface PipelineDeal {
  id: string
  companyName: string
  contactName?: string
  contactEmail?: string
  stage: 'lead' | 'contacted' | 'call_booked' | 'proposal' | 'signed' | 'onboarding'
  dealValue?: number
  source?: string
  notes?: string
  createdAt: string
}

export interface Sprint {
  id: string
  sprintNumber: number
  weekStart: string
  deliverables: { text: string; done: boolean }[]
  status: 'completed' | 'active' | 'upcoming'
}

export interface WeeklyScorecard {
  weekStart: string
  revenueTotal: number
  expensesTotal: number
  netProfit: number
  costOfInaction: number
  tasksCompleted: number
  tasksTotal: number
  prayersCompleted: number
  gymSessions: number
  energyDrinksTotal: number
  screenTimeTotal: number
  commitmentsMade: number
  commitmentsKept: number
  grade: string
  aiCommentary: string
  reflection?: { worked: string; didnt: string; avoided: string; different: string; grateful: string }
}

export interface SOP {
  id: string
  businessId: string
  title: string
  status: 'not_started' | 'in_progress' | 'documented'
  content?: string
}

export interface EnergyLog {
  date: string
  timeOfDay: 'morning' | 'afternoon' | 'evening'
  level: number
}

interface AppState {
  // Auth
  authenticated: boolean
  pin: string
  setAuthenticated: (v: boolean) => void
  setPin: (v: string) => void

  // Theme
  theme: 'dark' | 'light'
  toggleTheme: () => void

  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void

  // Tasks
  tasks: Task[]
  addTask: (t: Omit<Task, 'id' | 'createdAt'>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  updateTask: (id: string, updates: Partial<Task>) => void

  // Insights
  insights: Insight[]
  addInsight: (i: Omit<Insight, 'id' | 'createdAt'>) => void
  rateInsight: (id: string, rating: 'up' | 'down') => void
  snoozeInsight: (id: string) => void

  // Health
  todayHealth: HealthLog
  updateHealth: (updates: Partial<HealthLog>) => void
  togglePrayer: (prayer: keyof HealthLog['prayers']) => void

  // Streaks
  streaks: Streak[]
  updateStreak: (habit: string, completed: boolean) => void

  // Gamification
  xp: number
  level: number
  addXp: (amount: number) => void

  // Ideas
  ideas: Idea[]
  addIdea: (text: string, category: string) => void
  promoteIdea: (id: string) => void
  archiveIdea: (id: string) => void

  // Revenue Drivers
  drivers: RevenueDriver[]
  updateDriverStatus: (id: string, status: DriverStatus) => void
  addDriver: (d: Omit<RevenueDriver, 'id'>) => void

  // Commitments
  commitments: Commitment[]
  addCommitment: (text: string, source: string, dueDate?: string) => void
  fulfillCommitment: (id: string) => void

  // Wins
  wins: Win[]
  addWin: (w: Omit<Win, 'id' | 'createdAt'>) => void

  // Schedule
  todaySchedule: ScheduleBlock[]
  setSchedule: (blocks: ScheduleBlock[]) => void
  toggleScheduleBlock: (index: number) => void

  // AI Messages
  aiMessages: AiMessage[]
  addAiMessage: (msg: Omit<AiMessage, 'id' | 'createdAt'>) => void
  clearAiMessages: () => void

  // Pipeline
  pipeline: PipelineDeal[]
  addDeal: (d: Omit<PipelineDeal, 'id' | 'createdAt'>) => void
  updateDealStage: (id: string, stage: PipelineDeal['stage']) => void
  deleteDeal: (id: string) => void

  // Sprints
  sprints: Sprint[]

  // Weekly Scorecards
  scorecards: WeeklyScorecard[]

  // SOPs
  sops: SOP[]
  addSop: (s: Omit<SOP, 'id'>) => void
  updateSop: (id: string, updates: Partial<SOP>) => void

  // Energy Logs
  energyLogs: EnergyLog[]
  addEnergyLog: (log: EnergyLog) => void

  // Financial snapshots
  financialSnapshots: { date: string; agencyGross: number; agencyNet: number; plumbingRevenue: number; plumbingCut: number; airbnbNet: number; totalTakeHome: number; totalExpenses: number }[]

  // Voice memos
  voiceMemos: { id: string; transcript: string; createdAt: string }[]
  addVoiceMemo: (transcript: string) => void
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
const today = () => new Date().toISOString().split('T')[0]

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      authenticated: false,
      pin: '1234',
      setAuthenticated: (v) => set({ authenticated: v }),
      setPin: (v) => set({ pin: v }),

      // Theme
      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      // Tasks
      tasks: [],
      addTask: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, id: uid(), createdAt: new Date().toISOString() }] })),
      toggleTask: (id) => set((s) => {
        const tasks = s.tasks.map((t) => {
          if (t.id !== id) return t
          const done = !t.done
          if (done) {
            const xp = s.xp + t.xpValue
            const level = Math.floor(xp / 500) + 1
            setTimeout(() => set({ xp, level }), 0)
          }
          return { ...t, done, completedAt: done ? new Date().toISOString() : undefined }
        })
        return { tasks }
      }),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      updateTask: (id, updates) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t) })),

      // Insights
      insights: [],
      addInsight: (i) => set((s) => ({ insights: [{ ...i, id: uid(), createdAt: new Date().toISOString() }, ...s.insights] })),
      rateInsight: (id, rating) => set((s) => ({ insights: s.insights.map((i) => i.id === id ? { ...i, rating } : i) })),
      snoozeInsight: (id) => {
        const d = new Date(); d.setDate(d.getDate() + 7)
        set((s) => ({ insights: s.insights.map((i) => i.id === id ? { ...i, snoozedUntil: d.toISOString() } : i) }))
      },

      // Health
      todayHealth: {
        date: today(),
        prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
        gym: false, energyDrinks: 0, screenTimeHours: 0, dailyScore: 0,
      },
      updateHealth: (updates) => set((s) => ({ todayHealth: { ...s.todayHealth, ...updates } })),
      togglePrayer: (prayer) => set((s) => ({
        todayHealth: {
          ...s.todayHealth,
          prayers: { ...s.todayHealth.prayers, [prayer]: !s.todayHealth.prayers[prayer] },
        },
      })),

      // Streaks
      streaks: [
        { habit: 'prayer', currentStreak: 0, longestStreak: 0 },
        { habit: 'gym', currentStreak: 0, longestStreak: 0 },
        { habit: 'sleep', currentStreak: 0, longestStreak: 0 },
        { habit: 'no_gamble', currentStreak: 1, longestStreak: 1, lastCompleted: today() },
        { habit: 'cold_email', currentStreak: 0, longestStreak: 0 },
      ],
      updateStreak: (habit, completed) => set((s) => ({
        streaks: s.streaks.map((st) => {
          if (st.habit !== habit) return st
          if (completed) {
            const newStreak = st.currentStreak + 1
            return { ...st, currentStreak: newStreak, longestStreak: Math.max(newStreak, st.longestStreak), lastCompleted: today() }
          }
          return { ...st, currentStreak: 0 }
        }),
      })),

      // Gamification
      xp: 0,
      level: 1,
      addXp: (amount) => set((s) => {
        const xp = s.xp + amount
        return { xp, level: Math.floor(xp / 500) + 1 }
      }),

      // Ideas
      ideas: [],
      addIdea: (text, category) => set((s) => ({
        ideas: [...s.ideas, { id: uid(), text, category, promoted: false, archived: false, createdAt: new Date().toISOString() }],
      })),
      promoteIdea: (id) => set((s) => ({ ideas: s.ideas.map((i) => i.id === id ? { ...i, promoted: true } : i) })),
      archiveIdea: (id) => set((s) => ({ ideas: s.ideas.map((i) => i.id === id ? { ...i, archived: true } : i) })),

      // Revenue Drivers
      drivers: [],
      updateDriverStatus: (id, status) => set((s) => ({ drivers: s.drivers.map((d) => d.id === id ? { ...d, status } : d) })),
      addDriver: (d) => set((s) => ({ drivers: [...s.drivers, { ...d, id: uid() }] })),

      // Commitments
      commitments: [],
      addCommitment: (text, source, dueDate) => set((s) => ({
        commitments: [...s.commitments, { id: uid(), text, source, dueDate, fulfilled: false, createdAt: new Date().toISOString() }],
      })),
      fulfillCommitment: (id) => set((s) => ({
        commitments: s.commitments.map((c) => c.id === id ? { ...c, fulfilled: true, fulfilledDate: today() } : c),
      })),

      // Wins
      wins: [],
      addWin: (w) => set((s) => ({ wins: [...s.wins, { ...w, id: uid(), createdAt: new Date().toISOString() }] })),

      // Schedule
      todaySchedule: [],
      setSchedule: (blocks) => set({ todaySchedule: blocks }),
      toggleScheduleBlock: (index) => set((s) => ({
        todaySchedule: s.todaySchedule.map((b, i) => i === index ? { ...b, completed: !b.completed } : b),
      })),

      // AI Messages
      aiMessages: [],
      addAiMessage: (msg) => set((s) => ({
        aiMessages: [...s.aiMessages, { ...msg, id: uid(), createdAt: new Date().toISOString() }],
      })),
      clearAiMessages: () => set({ aiMessages: [] }),

      // Pipeline
      pipeline: [],
      addDeal: (d) => set((s) => ({ pipeline: [...s.pipeline, { ...d, id: uid(), createdAt: new Date().toISOString() }] })),
      updateDealStage: (id, stage) => set((s) => ({ pipeline: s.pipeline.map((d) => d.id === id ? { ...d, stage } : d) })),
      deleteDeal: (id) => set((s) => ({ pipeline: s.pipeline.filter((d) => d.id !== id) })),

      // Sprints
      sprints: [
        { id: '1', sprintNumber: 1, weekStart: '2026-04-06', deliverables: [
          { text: 'Sign office lease for plumbing GMBs', done: false },
          { text: 'Set up cold email infrastructure (Instantly)', done: false },
          { text: 'Start SEO on 3 agency GMB profiles', done: false },
        ], status: 'active' },
        { id: '2', sprintNumber: 2, weekStart: '2026-04-13', deliverables: [
          { text: 'Send first 1,000 cold emails to UMich alumni', done: false },
          { text: 'Change all 9 plumbing GMBs to office address', done: false },
          { text: 'Set up real review request system', done: false },
        ], status: 'upcoming' },
        { id: '3', sprintNumber: 3, weekStart: '2026-04-20', deliverables: [
          { text: 'First Madison Clark brand deal outreach (10 brands)', done: false },
          { text: 'Soft launch Moggley via Madison Clark story', done: false },
          { text: 'Cold email 500 property managers', done: false },
        ], status: 'upcoming' },
      ],

      // Scorecards
      scorecards: [],

      // SOPs
      sops: [],
      addSop: (s_) => set((s) => ({ sops: [...s.sops, { ...s_, id: uid() }] })),
      updateSop: (id, updates) => set((s) => ({ sops: s.sops.map((sp) => sp.id === id ? { ...sp, ...updates } : sp) })),

      // Energy Logs
      energyLogs: [],
      addEnergyLog: (log) => set((s) => ({ energyLogs: [...s.energyLogs, log] })),

      // Financial Snapshots
      financialSnapshots: [
        { date: '2026-03-01', agencyGross: 26050, agencyNet: 15268.5, plumbingRevenue: 18000, plumbingCut: 7200, airbnbNet: 1000, totalTakeHome: 23468.5, totalExpenses: 5945 },
      ],

      // Voice Memos
      voiceMemos: [],
      addVoiceMemo: (transcript) => set((s) => ({
        voiceMemos: [...s.voiceMemos, { id: uid(), transcript, createdAt: new Date().toISOString() }],
      })),
    }),
    { name: 'art-os-store' }
  )
)
