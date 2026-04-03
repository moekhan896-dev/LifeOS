// Prayer times location - Westland, MI
export const LOCATION = { lat: 42.3243, lng: -83.4002, city: 'Westland', state: 'MI' }

// XP values
export const XP_VALUES = { crit: 50, high: 30, med: 20, low: 10 } as const
export const XP_PER_LEVEL = 500

// Daily score weights
export const SCORE_WEIGHTS = { prayer: 0.35, health: 0.25, productivity: 0.40 }

export const FIXED_COSTS = [
  { name: 'C8 Corvette', amount: 1250 },
  { name: 'Mercedes-AMG GLE', amount: 575 },
  { name: 'Tesla Lease', amount: 400 },
  { name: 'Insurance (avg/mo)', amount: 920 },
  { name: 'Food', amount: 2000 },
  { name: 'Subscriptions', amount: 500 },
  { name: 'Phone', amount: 100 },
  { name: 'Vaping', amount: 50 },
  { name: 'Energy Drinks', amount: 150 },
]

export const TAGS = ['SEO', 'OUTBOUND', 'REVENUE', 'CLIENT', 'EXIT', 'CRITICAL', 'ADS', 'CONTENT', 'MONETIZE', 'SYNERGY', 'BRAND', 'OPS', 'HEALTH'] as const

export const PRIORITY_COLORS = {
  crit: { bg: 'bg-rose/15', text: 'text-rose', border: 'border-rose/30' },
  high: { bg: 'bg-amber/15', text: 'text-amber', border: 'border-amber/30' },
  med: { bg: 'bg-blue/15', text: 'text-blue', border: 'border-blue/30' },
  low: { bg: 'bg-text-dim/15', text: 'text-text-dim', border: 'border-text-dim/30' },
} as const

export const DRIVER_STATUSES = ['LIVE', 'BUILD', 'TEST', 'PLAN', 'IDEA', 'STALE', 'NEVER TRIED'] as const

export const DRIVER_STATUS_COLORS: Record<string, string> = {
  LIVE: 'bg-accent/20 text-accent',
  BUILD: 'bg-blue/20 text-blue',
  TEST: 'bg-cyan/20 text-cyan',
  PLAN: 'bg-purple/20 text-purple',
  IDEA: 'bg-text-dim/20 text-text-mid',
  STALE: 'bg-rose/20 text-rose',
  'NEVER TRIED': 'bg-amber/20 text-amber',
}

export const AUDIENCE_ASSETS = [
  { name: 'Quattro Labs IG', followers: 150000, platform: 'Instagram', status: 'dormant', daysSincePost: 365 },
  { name: 'Plumbing IG', followers: 30000, platform: 'Instagram', status: 'passive', daysSincePost: 14 },
  { name: 'Personal IG', followers: 30000, platform: 'Instagram', status: 'dormant', daysSincePost: 540 },
  { name: 'Madison Clark', followers: 16000, platform: 'Instagram', status: 'active', daysSincePost: 0 },
  { name: 'TikTok', followers: 1500, platform: 'TikTok', status: 'dormant', daysSincePost: 30 },
]

// ── Reference arrays for forms/UI ──

export const BUSINESS_TYPES = [
  { value: 'agency', label: 'Agency' },
  { value: 'service', label: 'Service Business' },
  { value: 'app', label: 'App / SaaS' },
  { value: 'content', label: 'Content / Media' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'other', label: 'Other' },
]

export const BUSINESS_STATUSES = [
  { value: 'active_healthy', label: 'Active - Healthy' },
  { value: 'active_slow', label: 'Active - Slow' },
  { value: 'active_prerevenue', label: 'Active - Pre-Revenue' },
  { value: 'dormant', label: 'Dormant' },
  { value: 'backburner', label: 'Backburner' },
  { value: 'idea', label: 'Idea' },
]

export const COLOR_SWATCHES = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899', '#eab308']

export const MEETING_FREQUENCIES = ['Weekly', 'Biweekly', 'Monthly', 'As needed', 'None']
