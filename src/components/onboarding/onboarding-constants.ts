/** UI option lists — labels only, no user data. */

export const BUSINESS_TYPE_OPTIONS = [
  'Marketing/SEO Agency',
  'Service Business (trades, cleaning, etc.)',
  'E-commerce / Online Store',
  'SaaS / Software / App',
  'Content / Social Media / Influencer',
  'Real Estate (rentals, Airbnb, flipping)',
  'Coaching / Consulting',
  'Freelance / Contract Work',
  'Brick & Mortar Retail',
  'Food & Beverage',
  'Health & Wellness',
  'Education / Courses',
  'Other',
] as const

export const BUSINESS_STATUS_OPTIONS = [
  'Active — Growing',
  'Active — Stable',
  'Active — Declining',
  'Pre-Revenue',
  'Dormant',
  'Idea Only',
] as const

export const ROLE_OPTIONS = [
  'I do everything (owner-operator)',
  'I manage people (owner-manager)',
  'Mostly passive',
  'Partner / co-owner',
] as const

export const PAYMENT_METHOD_OPTIONS = ['Stripe', 'Bank transfer', 'Cash', 'Check', 'PayPal', 'Multiple methods'] as const

export const TOOL_SUGGESTIONS = [
  'Stripe',
  'QuickBooks',
  'Instantly',
  'GoHighLevel',
  'Notion',
  'Slack',
  'Google Workspace',
  'Social Media',
] as const

export const RELATIONSHIP_OPTIONS = ['Great', 'Good', 'Okay', 'At risk', 'About to leave'] as const

export const COMM_FREQ_OPTIONS = ['Weekly', 'Biweekly', 'Monthly', 'As needed', 'Rarely'] as const

export const SAVINGS_RANGE_OPTIONS = [
  'Under $5K',
  '$5-20K',
  '$20-50K',
  '$50-100K',
  '$100K+',
] as const

export const HABIT_PRESETS = [
  'Exercise regularly',
  'Eat clean / meal prep',
  'Sleep on time (before midnight)',
  'Read / learn daily',
  'Meditate / mindfulness',
  'Journal / reflect',
  'Limit screen time',
  'Drink more water',
  'Cold outreach / prospecting consistency',
  'Content creation consistency',
] as const

export const DISTRACTION_OPTIONS = [
  'Phone scrolling / social media',
  'Chasing new business ideas',
  'Netflix / YouTube / content consumption',
  'Gaming',
  'Gambling',
  'Socializing / going out',
  'Over-researching without acting',
  'Other',
] as const

export const NORTH_STAR_CHIPS = [
  'Monthly revenue',
  'Net worth',
  'New clients/month',
  'Daily execution score',
  'Something else',
] as const

export const CATEGORY_TITLES = [
  '',
  'About You',
  'Your Businesses',
  'Recurring revenue',
  'Your Money',
  "Where You're Going",
  'Your Foundation',
  'Your Spirit',
  'Real Talk',
  'Your AI Partner',
  'Power Up',
  'Lock It Down',
  'Your OS Is Ready',
] as const

/** Inputs — secondary surface, blue focus */
export const inputCls =
  'w-full min-h-[52px] rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-[14px] text-[17px] leading-snug text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none focus:ring-0'

/** Solid panel for grouped fields only (not identity single-field steps) */
export const glassPanel =
  'rounded-[16px] border border-[var(--border)] bg-[var(--bg-elevated)] p-5'

export const btnPrimary =
  'min-h-[44px] rounded-[14px] bg-[var(--accent)] px-8 py-4 text-[17px] font-semibold text-white transition hover:bg-[var(--accent-hover)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40'

export const btnSecondary =
  'min-h-[44px] rounded-[14px] bg-[rgba(255,255,255,0.08)] px-8 py-4 text-[17px] font-semibold text-[var(--text-primary)] transition hover:bg-[rgba(255,255,255,0.12)] active:scale-[0.97] disabled:opacity-40'

/** iMessage-style assistant bubble */
export const aiBubbleCls =
  'mb-0 max-w-[95%] rounded-[18px] rounded-bl-[4px] border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-4 text-[17px] leading-relaxed text-[var(--text-primary)]'
