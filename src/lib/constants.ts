// XP values (PRD §10.1 / GAP 11)
export const XP_VALUES = { crit: 25, high: 15, med: 10, low: 5 } as const
export const XP_PER_LEVEL = 100

// Daily score weights
export const SCORE_WEIGHTS = { prayer: 0.35, health: 0.25, productivity: 0.40 }

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

/** Business / entity color picks — Apple system palette (green = optional positive accent, not primary UI) */
export const COLOR_SWATCHES = [
  '#0A84FF',
  '#30D158',
  '#64D2FF',
  '#FF9F0A',
  '#FF453A',
  '#BF5AF2',
  '#FF375F',
  '#FFD60A',
]

export const MEETING_FREQUENCIES = ['Weekly', 'Biweekly', 'Monthly', 'As needed', 'None']
