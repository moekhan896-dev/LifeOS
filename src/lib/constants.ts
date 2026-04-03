// Prayer times location - Westland, MI
export const LOCATION = { lat: 42.3243, lng: -83.4002, city: 'Westland', state: 'MI' }

// XP values
export const XP_VALUES = { crit: 50, high: 30, med: 20, low: 10 } as const
export const XP_PER_LEVEL = 500

// Daily score weights
export const SCORE_WEIGHTS = { prayer: 0.35, health: 0.25, productivity: 0.40 }

// Business data
export const BUSINESSES = [
  { id: 'agency', name: 'SEO Agency (Rysen)', icon: '⬡', color: '#10b981', status: 'active', statusLabel: 'Healthy' },
  { id: 'plumbing', name: 'Honest Plumbers', icon: '⬡', color: '#06b6d4', status: 'active', statusLabel: 'Slow' },
  { id: 'madison', name: 'Madison Clark', icon: '⬡', color: '#ec4899', status: 'active', statusLabel: 'Pre-Revenue' },
  { id: 'moggley', name: 'Moggley App', icon: '⬡', color: '#8b5cf6', status: 'active', statusLabel: 'Pre-Revenue' },
  { id: 'brand', name: 'Personal Brand', icon: '⬡', color: '#f59e0b', status: 'dormant', statusLabel: 'Dormant' },
  { id: 'airbnb', name: 'Airbnb FL', icon: '⬡', color: '#3b82f6', status: 'active', statusLabel: 'Low-Maintenance' },
] as const

export const CLIENTS = [
  { name: 'AWS Law Firm', gross: 18000, adSpend: 10000, stripe: 540, net: 7460, service: 'GMB + ADS', meeting: 'Every 2 weeks' },
  { name: 'Slim Dental', gross: 2400, adSpend: 0, stripe: 72, net: 2328, service: 'SEO', meeting: 'Weekly' },
  { name: 'Rock Remson Law', gross: 1700, adSpend: 0, stripe: 51, net: 1649, service: 'GMB SEO', meeting: 'None' },
  { name: 'Gravix Security', gross: 1500, adSpend: 0, stripe: 45, net: 1455, service: 'GMB SEO', meeting: 'None' },
  { name: 'Tyler Family Law', gross: 1450, adSpend: 0, stripe: 43.5, net: 1406.5, service: 'GMB SEO', meeting: 'Monthly' },
  { name: 'Eric (Plumbing)', gross: 1000, adSpend: 0, stripe: 30, net: 970, service: 'SEO', meeting: 'None' },
]

export const GMB_PROFILES = [
  { city: 'Ann Arbor', reviews: 52, calls: 31, status: 'strong', rank: '#4' },
  { city: 'Dearborn', reviews: 47, calls: 28, status: 'strong', rank: '#3' },
  { city: 'Farmington Hills', reviews: 38, calls: 22, status: 'strong', rank: '#5' },
  { city: 'Canton', reviews: 25, calls: 14, status: 'medium', rank: '#7' },
  { city: 'Birmingham', reviews: 21, calls: 11, status: 'medium', rank: '#8' },
  { city: 'Bloomfield', reviews: 18, calls: 9, status: 'medium', rank: '#9' },
  { city: 'Livonia', reviews: 3, calls: 2, status: 'new', rank: '—' },
  { city: 'Southgate', reviews: 2, calls: 1, status: 'new', rank: '—' },
  { city: 'Ypsilanti', reviews: 1, calls: 0, status: 'new', rank: '—' },
]

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
