/** Fuzzy targets for voice "go to {page}" (PRD §20.3). */
const ENTRIES: { href: string; keys: string[] }[] = [
  { href: '/dashboard', keys: ['dashboard', 'command center', 'home', 'main'] },
  { href: '/tasks', keys: ['tasks', 'task list', 'to do'] },
  { href: '/projects', keys: ['projects'] },
  { href: '/goals', keys: ['goals', '12 week', 'twelve week'] },
  { href: '/financials', keys: ['financials', 'money', 'finance', 'income'] },
  { href: '/health', keys: ['health', 'deen', 'prayer tracker'] },
  { href: '/settings', keys: ['settings', 'preferences'] },
  { href: '/schedule', keys: ['schedule', 'calendar'] },
  { href: '/ai', keys: ['ai', 'ai partner', 'chat', 'strategist'] },
  { href: '/decision-lab', keys: ['decision lab', 'decisions lab'] },
  { href: '/decisions', keys: ['decision journal', 'journal'] },
  { href: '/reports', keys: ['reports', 'ai reports'] },
  { href: '/insights', keys: ['insights', 'execution', 'score'] },
  { href: '/roadmap', keys: ['roadmap'] },
  { href: '/idea-bank', keys: ['ideas', 'idea bank'] },
  { href: '/mentors', keys: ['mentors'] },
  { href: '/focus', keys: ['focus'] },
]

export function resolveVoiceNavigation(pageQuery: string): string | null {
  const q = pageQuery.toLowerCase().trim()
  if (!q) return null
  for (const e of ENTRIES) {
    if (e.keys.some((k) => q.includes(k) || k.includes(q))) return e.href
  }
  for (const e of ENTRIES) {
    if (e.keys.some((k) => q.split(/\s+/).some((w) => w.length > 2 && k.includes(w)))) return e.href
  }
  return null
}
