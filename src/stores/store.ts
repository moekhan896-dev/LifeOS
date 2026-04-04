import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ═══ Types ═══
export type Priority = 'crit' | 'high' | 'med' | 'low'
export type BusinessType = 'agency' | 'service' | 'app' | 'content' | 'real_estate' | 'coaching' | 'other'
export type BusinessStatus = 'healthy' | 'slow' | 'prerevenue' | 'dormant' | 'idea'
export type DripZone = 'double_down' | 'replace' | 'design' | 'eliminate'
export type PipelineStage = 'lead' | 'contacted' | 'call_booked' | 'proposal' | 'signed'

export interface Business {
  id: string; name: string; type: BusinessType; status: BusinessStatus
  grossRevenue: number; netToArt: number; color: string; icon: string
  constraint?: string; notes?: string; createdAt: string
}
export interface Client {
  id: string; businessId: string; name: string; grossMonthly: number; adSpend: number
  serviceType: string; meetingFreq: string; startDate?: string; active: boolean; createdAt: string
}
export interface Task {
  id: string; businessId: string; text: string; tag: string; priority: Priority
  done: boolean; dollarValue: number; xpValue: number; drip?: DripZone
  projectId?: string; dueDate?: string; skippedCount: number
  createdAt: string; completedAt?: string
}
export interface GmbProfile {
  id: string; businessId: string; city: string; reviews: number
  callsPerMonth: number; rank: string; status: 'strong' | 'medium' | 'new'
}
export interface HealthLog {
  date: string
  prayers: { fajr: boolean; dhuhr: boolean; asr: boolean; maghrib: boolean; isha: boolean }
  gym: boolean; gymDuration?: number; gymType?: string
  wakeTime?: string; bedTime?: string
  mealQuality?: 'clean' | 'okay' | 'fastfood'
  energyLevels: { morning?: number; afternoon?: number; evening?: number }
  screenTimeHours: number; energyDrinks: number
}
export interface Streak { habit: string; current: number; best: number; lastDate?: string }
export interface Idea { id: string; text: string; category: string; archived: boolean; createdAt: string }
export interface RevenueDriver { id: string; businessId: string; name: string; impact: number; status: string }
export interface Commitment { id: string; text: string; source: string; fulfilled: boolean; createdAt: string }
export interface Win { id: string; title: string; dollarValue: number; businessId?: string; createdAt: string }
export interface AiMessage { id: string; role: 'user' | 'assistant'; content: string; createdAt: string }
export interface Decision { id: string; statement: string; options?: string[]; chosen?: string; outcome?: string; createdAt: string; reviewDate?: string }
export interface ScheduleBlock { time: string; title: string; type: 'prayer' | 'work' | 'health' | 'personal' | 'meal'; duration: number; done: boolean }
export interface DailyScore { date: string; earned: number; idealEarned: number; pct: number; tasksCompleted: number; prayersDone: number; gymDone: boolean }
export interface Alert { id: string; text: string; color: string; icon: string; action: string; link: string }

const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
const today = () => new Date().toISOString().split('T')[0]
const ts = () => new Date().toISOString()

// ═══ App State ═══
interface AppState {
  // Auth
  authenticated: boolean; pin: string; onboardingComplete: boolean
  setAuthenticated: (v: boolean) => void; setPin: (v: string) => void; completeOnboarding: () => void

  // Profile
  userName: string; userLocation: string; incomeTarget: number; targetDate: string
  wakeUpTarget: string; anthropicKey: string
  updateProfile: (u: Partial<Pick<AppState, 'userName' | 'userLocation' | 'incomeTarget' | 'targetDate' | 'wakeUpTarget' | 'anthropicKey'>>) => void

  // Theme
  theme: 'dark' | 'light'; toggleTheme: () => void

  // Businesses
  businesses: Business[]
  addBusiness: (b: Omit<Business, 'id' | 'createdAt'>) => void
  updateBusiness: (id: string, u: Partial<Business>) => void
  deleteBusiness: (id: string) => void

  // Clients
  clients: Client[]
  addClient: (c: Omit<Client, 'id' | 'createdAt'>) => void
  updateClient: (id: string, u: Partial<Client>) => void
  deleteClient: (id: string) => void

  // Tasks
  tasks: Task[]
  addTask: (t: Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'skippedCount'>) => void
  toggleTask: (id: string) => void
  skipTask: (id: string) => void
  deleteTask: (id: string) => void
  updateTask: (id: string, u: Partial<Task>) => void

  // GMBs
  gmbProfiles: GmbProfile[]
  addGmb: (g: Omit<GmbProfile, 'id'>) => void
  updateGmb: (id: string, u: Partial<GmbProfile>) => void
  deleteGmb: (id: string) => void

  // Health
  todayHealth: HealthLog
  healthHistory: HealthLog[]
  togglePrayer: (p: keyof HealthLog['prayers']) => void
  updateHealth: (u: Partial<HealthLog>) => void
  logEnergy: (slot: 'morning' | 'afternoon' | 'evening', level: number) => void

  // Streaks
  streaks: Streak[]
  bumpStreak: (habit: string) => void

  // XP
  xp: number; level: number; addXp: (n: number) => void

  // Daily scores
  dailyScores: DailyScore[]
  logDailyScore: (score: DailyScore) => void

  // AI
  aiMessages: AiMessage[]
  addAiMessage: (m: Omit<AiMessage, 'id' | 'createdAt'>) => void
  clearAiMessages: () => void

  // Schedule
  todaySchedule: ScheduleBlock[]
  setSchedule: (b: ScheduleBlock[]) => void
  toggleBlock: (i: number) => void

  // Ideas
  ideas: Idea[]
  addIdea: (text: string, category: string) => void
  archiveIdea: (id: string) => void

  // Revenue Drivers
  drivers: RevenueDriver[]
  addDriver: (d: Omit<RevenueDriver, 'id'>) => void
  updateDriverStatus: (id: string, status: string) => void

  // Commitments
  commitments: Commitment[]
  addCommitment: (text: string, source: string) => void
  fulfillCommitment: (id: string) => void

  // Wins
  wins: Win[]
  addWin: (w: Omit<Win, 'id' | 'createdAt'>) => void

  // Decisions
  decisions: Decision[]
  addDecision: (d: Omit<Decision, 'id' | 'createdAt'>) => void
  updateDecision: (id: string, u: Partial<Decision>) => void

  // Voice memos
  voiceMemos: { id: string; text: string; createdAt: string }[]
  addVoiceMemo: (text: string) => void

  // Behavioral events
  events: { type: string; data: any; ts: string }[]
  logEvent: (type: string, data?: any) => void

  // Seed
  seedDefaultData: () => void
  resetAll: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      authenticated: false, pin: '', onboardingComplete: false,
      setAuthenticated: (v) => set({ authenticated: v }),
      setPin: (v) => set({ pin: v }),
      completeOnboarding: () => set({ onboardingComplete: true }),

      // Profile
      userName: 'Art', userLocation: 'Westland, MI', incomeTarget: 50000,
      targetDate: '2026-10-01', wakeUpTarget: '05:47', anthropicKey: '',
      updateProfile: (u) => set(u as any),

      // Theme
      theme: 'dark', toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      // Businesses
      businesses: [],
      addBusiness: (b) => set((s) => ({ businesses: [...s.businesses, { ...b, id: uid(), createdAt: ts() }] })),
      updateBusiness: (id, u) => set((s) => ({ businesses: s.businesses.map((b) => b.id === id ? { ...b, ...u } : b) })),
      deleteBusiness: (id) => set((s) => ({ businesses: s.businesses.filter((b) => b.id !== id) })),

      // Clients
      clients: [],
      addClient: (c) => set((s) => ({ clients: [...s.clients, { ...c, id: uid(), createdAt: ts() }] })),
      updateClient: (id, u) => set((s) => ({ clients: s.clients.map((c) => c.id === id ? { ...c, ...u } : c) })),
      deleteClient: (id) => set((s) => ({ clients: s.clients.filter((c) => c.id !== id) })),

      // Tasks
      tasks: [],
      addTask: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, id: uid(), createdAt: ts(), skippedCount: 0 }] })),
      toggleTask: (id) => set((s) => {
        let xpGain = 0
        const tasks = s.tasks.map((t) => {
          if (t.id !== id) return t
          const done = !t.done
          if (done) xpGain = t.xpValue
          return { ...t, done, completedAt: done ? ts() : undefined }
        })
        const xp = s.xp + xpGain
        return { tasks, xp, level: Math.floor(xp / 500) + 1 }
      }),
      skipTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, skippedCount: t.skippedCount + 1 } : t) })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
      updateTask: (id, u) => set((s) => ({ tasks: s.tasks.map((t) => t.id === id ? { ...t, ...u } : t) })),

      // GMBs
      gmbProfiles: [],
      addGmb: (g) => set((s) => ({ gmbProfiles: [...s.gmbProfiles, { ...g, id: uid() }] })),
      updateGmb: (id, u) => set((s) => ({ gmbProfiles: s.gmbProfiles.map((g) => g.id === id ? { ...g, ...u } : g) })),
      deleteGmb: (id) => set((s) => ({ gmbProfiles: s.gmbProfiles.filter((g) => g.id !== id) })),

      // Health
      todayHealth: {
        date: today(), prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
        gym: false, energyLevels: {}, screenTimeHours: 0, energyDrinks: 0,
      },
      healthHistory: [],
      togglePrayer: (p) => set((s) => ({ todayHealth: { ...s.todayHealth, prayers: { ...s.todayHealth.prayers, [p]: !s.todayHealth.prayers[p] } } })),
      updateHealth: (u) => set((s) => ({ todayHealth: { ...s.todayHealth, ...u } })),
      logEnergy: (slot, level) => set((s) => ({ todayHealth: { ...s.todayHealth, energyLevels: { ...s.todayHealth.energyLevels, [slot]: level } } })),

      // Streaks
      streaks: [
        { habit: 'prayer', current: 0, best: 0 },
        { habit: 'gym', current: 0, best: 0 },
        { habit: 'sleep', current: 0, best: 0 },
        { habit: 'no_gamble', current: 42, best: 42, lastDate: today() },
        { habit: 'cold_email', current: 0, best: 0 },
      ],
      bumpStreak: (habit) => set((s) => ({
        streaks: s.streaks.map((st) => {
          if (st.habit !== habit) return st
          const n = st.current + 1
          return { ...st, current: n, best: Math.max(n, st.best), lastDate: today() }
        }),
      })),

      // XP
      xp: 0, level: 1,
      addXp: (n) => set((s) => { const xp = s.xp + n; return { xp, level: Math.floor(xp / 500) + 1 } }),

      // Daily scores
      dailyScores: [],
      logDailyScore: (score) => set((s) => ({ dailyScores: [...s.dailyScores.filter((d) => d.date !== score.date), score] })),

      // AI
      aiMessages: [],
      addAiMessage: (m) => set((s) => ({ aiMessages: [...s.aiMessages, { ...m, id: uid(), createdAt: ts() }] })),
      clearAiMessages: () => set({ aiMessages: [] }),

      // Schedule
      todaySchedule: [],
      setSchedule: (b) => set({ todaySchedule: b }),
      toggleBlock: (i) => set((s) => ({ todaySchedule: s.todaySchedule.map((b, j) => j === i ? { ...b, done: !b.done } : b) })),

      // Ideas
      ideas: [],
      addIdea: (text, category) => set((s) => ({ ideas: [...s.ideas, { id: uid(), text, category, archived: false, createdAt: ts() }] })),
      archiveIdea: (id) => set((s) => ({ ideas: s.ideas.map((i) => i.id === id ? { ...i, archived: true } : i) })),

      // Drivers
      drivers: [],
      addDriver: (d) => set((s) => ({ drivers: [...s.drivers, { ...d, id: uid() }] })),
      updateDriverStatus: (id, status) => set((s) => ({ drivers: s.drivers.map((d) => d.id === id ? { ...d, status } : d) })),

      // Commitments
      commitments: [],
      addCommitment: (text, source) => set((s) => ({ commitments: [...s.commitments, { id: uid(), text, source, fulfilled: false, createdAt: ts() }] })),
      fulfillCommitment: (id) => set((s) => ({ commitments: s.commitments.map((c) => c.id === id ? { ...c, fulfilled: true } : c) })),

      // Wins
      wins: [],
      addWin: (w) => set((s) => ({ wins: [...s.wins, { ...w, id: uid(), createdAt: ts() }] })),

      // Decisions
      decisions: [],
      addDecision: (d) => set((s) => ({ decisions: [...s.decisions, { ...d, id: uid(), createdAt: ts() }] })),
      updateDecision: (id, u) => set((s) => ({ decisions: s.decisions.map((d) => d.id === id ? { ...d, ...u } : d) })),

      // Voice
      voiceMemos: [],
      addVoiceMemo: (text) => set((s) => ({ voiceMemos: [...s.voiceMemos, { id: uid(), text, createdAt: ts() }] })),

      // Events
      events: [],
      logEvent: (type, data) => set((s) => ({ events: [...s.events.slice(-200), { type, data: data || {}, ts: ts() }] })),

      // Seed
      seedDefaultData: () => {
        const s = get()
        if (s.businesses.length > 0 || !s.onboardingComplete) return
        const aId = uid(), pId = uid(), mId = uid(), mgId = uid(), bId = uid(), abId = uid()
        set({
          businesses: [
            { id: aId, name: 'SEO Agency (Rysen)', type: 'agency', status: 'healthy', grossRevenue: 26050, netToArt: 15269, color: '#10b981', icon: '🏢', constraint: 'No outbound acquisition — 0 cold emails in 12 days', createdAt: ts() },
            { id: pId, name: 'Honest Plumbers', type: 'service', status: 'slow', grossRevenue: 18000, netToArt: 4100, color: '#f59e0b', icon: '🔧', constraint: 'Lead flow — 1-2 calls/day, capacity for 6', createdAt: ts() },
            { id: mId, name: 'Madison Clark', type: 'content', status: 'prerevenue', grossRevenue: 0, netToArt: 0, color: '#ec4899', icon: '✨', constraint: 'Monetization — 16K followers, $0 revenue', createdAt: ts() },
            { id: mgId, name: 'Moggley App', type: 'app', status: 'prerevenue', grossRevenue: 0, netToArt: 0, color: '#8b5cf6', icon: '🧬', constraint: 'Distribution — product exists, 0 users', createdAt: ts() },
            { id: bId, name: 'Personal Brand', type: 'coaching', status: 'dormant', grossRevenue: 0, netToArt: 0, color: '#3b82f6', icon: '🎤', constraint: 'Content creation — blocked by confidence', createdAt: ts() },
            { id: abId, name: 'Airbnb FL', type: 'real_estate', status: 'healthy', grossRevenue: 10000, netToArt: 1000, color: '#eab308', icon: '🏠', createdAt: ts() },
          ],
          clients: [
            { id: uid(), businessId: aId, name: 'AWS Law Firm', grossMonthly: 18000, adSpend: 10000, serviceType: 'GMB + ADS', meetingFreq: 'Biweekly', active: true, createdAt: ts() },
            { id: uid(), businessId: aId, name: 'Slim Dental', grossMonthly: 2400, adSpend: 0, serviceType: 'SEO', meetingFreq: 'Weekly', active: true, createdAt: ts() },
            { id: uid(), businessId: aId, name: 'Rock Remson Law', grossMonthly: 1700, adSpend: 0, serviceType: 'GMB SEO', meetingFreq: 'None', active: true, createdAt: ts() },
            { id: uid(), businessId: aId, name: 'Gravix Security', grossMonthly: 1500, adSpend: 0, serviceType: 'GMB SEO', meetingFreq: 'None', active: true, createdAt: ts() },
            { id: uid(), businessId: aId, name: 'Tyler Family Law', grossMonthly: 1450, adSpend: 0, serviceType: 'GMB SEO', meetingFreq: 'Monthly', active: true, createdAt: ts() },
            { id: uid(), businessId: aId, name: 'Eric (Plumbing)', grossMonthly: 1000, adSpend: 0, serviceType: 'SEO', meetingFreq: 'None', active: true, createdAt: ts() },
          ],
          gmbProfiles: [
            { id: uid(), businessId: pId, city: 'Ann Arbor', reviews: 52, callsPerMonth: 31, rank: '#4', status: 'strong' },
            { id: uid(), businessId: pId, city: 'Dearborn', reviews: 47, callsPerMonth: 28, rank: '#3', status: 'strong' },
            { id: uid(), businessId: pId, city: 'Farmington Hills', reviews: 38, callsPerMonth: 22, rank: '#5', status: 'strong' },
            { id: uid(), businessId: pId, city: 'Canton', reviews: 25, callsPerMonth: 14, rank: '#7', status: 'medium' },
            { id: uid(), businessId: pId, city: 'Birmingham', reviews: 21, callsPerMonth: 11, rank: '#8', status: 'medium' },
            { id: uid(), businessId: pId, city: 'Bloomfield', reviews: 18, callsPerMonth: 9, rank: '#9', status: 'medium' },
            { id: uid(), businessId: pId, city: 'Livonia', reviews: 3, callsPerMonth: 2, rank: '—', status: 'new' },
            { id: uid(), businessId: pId, city: 'Southgate', reviews: 2, callsPerMonth: 1, rank: '—', status: 'new' },
          ],
          tasks: [
            { id: uid(), businessId: aId, text: 'Send 200 cold emails to UMich alumni lawyers', tag: 'OUTBOUND', priority: 'crit' as const, done: false, dollarValue: 175, xpValue: 50, skippedCount: 0, createdAt: ts() },
            { id: uid(), businessId: aId, text: 'SEO your own 3 agency GMBs', tag: 'SEO', priority: 'high' as const, done: false, dollarValue: 130, xpValue: 30, skippedCount: 0, createdAt: ts() },
            { id: uid(), businessId: aId, text: 'Slim Dental weekly check-in', tag: 'CLIENT', priority: 'med' as const, done: false, dollarValue: 45, xpValue: 20, skippedCount: 0, createdAt: ts() },
            { id: uid(), businessId: aId, text: 'Build referral program — 10% rev share', tag: 'REVENUE', priority: 'high' as const, done: false, dollarValue: 100, xpValue: 30, skippedCount: 0, createdAt: ts() },
            { id: uid(), businessId: pId, text: 'Tour office spaces Monday — sign lease', tag: 'CRITICAL', priority: 'crit' as const, done: false, dollarValue: 200, xpValue: 50, skippedCount: 0, createdAt: ts() },
            { id: uid(), businessId: pId, text: 'Set up real review request system', tag: 'SEO', priority: 'high' as const, done: false, dollarValue: 80, xpValue: 30, skippedCount: 0, createdAt: ts() },
            { id: uid(), businessId: pId, text: 'Restart yard sign drops in top 3 areas', tag: 'ADS', priority: 'med' as const, done: false, dollarValue: 60, xpValue: 20, skippedCount: 0, createdAt: ts() },
            { id: uid(), businessId: mId, text: 'Post 2x today on Madison Clark', tag: 'CONTENT', priority: 'med' as const, done: false, dollarValue: 25, xpValue: 20, skippedCount: 0, createdAt: ts() },
            { id: uid(), businessId: mId, text: 'Research brand deal rates for 16K AI influencer', tag: 'MONETIZE', priority: 'med' as const, done: false, dollarValue: 50, xpValue: 20, skippedCount: 0, createdAt: ts() },
            { id: uid(), businessId: mgId, text: 'Post Moggley on Madison Clark story', tag: 'SYNERGY', priority: 'med' as const, done: false, dollarValue: 30, xpValue: 20, skippedCount: 0, createdAt: ts() },
            { id: uid(), businessId: bId, text: 'Rebuild remoteplumbingprofits.com funnel', tag: 'REVENUE', priority: 'high' as const, done: false, dollarValue: 150, xpValue: 30, skippedCount: 0, createdAt: ts() },
          ],
        })
      },

      resetAll: () => set({
        onboardingComplete: false, authenticated: false, pin: '',
        businesses: [], clients: [], tasks: [], gmbProfiles: [],
        ideas: [], drivers: [], commitments: [], wins: [], decisions: [],
        aiMessages: [], voiceMemos: [], events: [], dailyScores: [],
        healthHistory: [], xp: 0, level: 1,
        streaks: [
          { habit: 'prayer', current: 0, best: 0 },
          { habit: 'gym', current: 0, best: 0 },
          { habit: 'sleep', current: 0, best: 0 },
          { habit: 'no_gamble', current: 0, best: 0 },
          { habit: 'cold_email', current: 0, best: 0 },
        ],
      }),
    }),
    { name: 'art-os-v3' }
  )
)

// ═══ Computed helpers ═══
export function clientNet(c: Client) { return c.grossMonthly - c.adSpend - c.grossMonthly * 0.03 }
export function agencyTotals(clients: Client[]) {
  const active = clients.filter((c) => c.active)
  return {
    gross: active.reduce((s, c) => s + c.grossMonthly, 0),
    net: active.reduce((s, c) => s + clientNet(c), 0),
    count: active.length,
  }
}

// Ideal Art daily value breakdown
export const IDEAL_ART_DAILY = {
  fajr: 400, // enables morning, 3x productivity
  allPrayers: 200, // additional for all 5
  gym: 200,
  coldEmail: 175,
  clientWork: 250,
  plumbingCalls: 1400, // 2 calls × $700
  madisonPosts: 50,
  noScrolling: 300,
  earlyBed: 200,
  total: 2175,
}

export function getIdealEarnedByNow() {
  const h = new Date().getHours()
  // Ideal Art's schedule: Fajr 5:47, gym 7, emails 9, client work 10, plumbing all day, madison afternoon
  if (h < 6) return 0
  let earned = IDEAL_ART_DAILY.fajr // Fajr done at 6am
  if (h >= 8) earned += IDEAL_ART_DAILY.gym
  if (h >= 10) earned += IDEAL_ART_DAILY.coldEmail
  if (h >= 12) earned += IDEAL_ART_DAILY.clientWork
  if (h >= 14) earned += IDEAL_ART_DAILY.plumbingCalls * 0.5
  if (h >= 16) earned += IDEAL_ART_DAILY.madisonPosts
  if (h >= 18) earned += IDEAL_ART_DAILY.plumbingCalls * 0.5
  if (h >= 20) earned += IDEAL_ART_DAILY.noScrolling
  if (h >= 23) earned += IDEAL_ART_DAILY.earlyBed
  return earned
}

export function getArtEarnedToday(tasks: Task[], health: HealthLog) {
  let earned = 0
  // Completed tasks
  const todayStr = new Date().toISOString().split('T')[0]
  tasks.filter(t => t.done && t.completedAt?.startsWith(todayStr)).forEach(t => { earned += t.dollarValue })
  // Prayers (indirect value)
  const prayers = Object.values(health.prayers).filter(Boolean).length
  earned += prayers * 80 // $80 per prayer (indirect)
  // Gym
  if (health.gym) earned += 200
  return earned
}

export function getLeftOnTable(tasks: Task[]) {
  const todayStr = new Date().toISOString().split('T')[0]
  return tasks
    .filter(t => !t.done && (t.priority === 'crit' || t.priority === 'high'))
    .reduce((s, t) => s + t.dollarValue, 0)
}
