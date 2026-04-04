/** PRD §5 — shared nav sections for sidebar and mobile “More” sheet. */
export const NAV_SECTIONS = [
  {
    label: 'Your day',
    items: [
      { href: '/dashboard', label: 'Command Center', icon: '◉' },
      { href: '/ai-insights', label: 'AI Insights', icon: '✉' },
      { href: '/focus', label: 'Focus Mode', icon: '◎' },
      { href: '/schedule', label: 'Schedule', icon: '◷' },
    ],
  },
  {
    label: 'Think',
    items: [
      { href: '/vision', label: 'Identity & Vision', icon: '🧬' },
      { href: '/goals', label: '12-Week Goals', icon: '🎯' },
      { href: '/projects', label: 'Projects', icon: '📋', badge: 'projects' as const },
      { href: '/roadmap', label: 'Roadmap', icon: '🗓' },
      { href: '/decision-lab', label: 'Decision Lab', icon: '⚗' },
      { href: '/mentors', label: 'Mentors', icon: '🎭' },
      { href: '/spending-calculator', label: 'Spending calc', icon: '⧉' },
    ],
  },
  {
    label: 'Execute',
    items: [
      { href: '/tasks', label: 'Tasks', icon: '☐', badge: 'tasks' as const },
      { href: '/drip', label: 'DRIP Matrix', icon: '📊' },
      { href: '/revenue-drivers', label: 'Revenue Drivers', icon: '↗' },
    ],
  },
  {
    label: 'Measure',
    items: [
      { href: '/insights', label: 'Execution Score', icon: '📈' },
      { href: '/financials', label: 'Financial Command', icon: '💰' },
      { href: '/energy', label: 'Energy Dashboard', icon: '⚡' },
      { href: '/health', label: 'Health & Deen', icon: '♡' },
    ],
  },
  {
    label: 'Learn',
    items: [
      { href: '/reports', label: 'AI Reports', icon: '🧠' },
      { href: '/knowledge', label: 'Knowledge Vault', icon: '📚' },
      { href: '/skills', label: 'Skill Tree', icon: '🏆' },
      { href: '/idea-bank', label: 'Idea Bank', icon: '💡' },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/ecosystem', label: 'Ecosystem', icon: '🔗' },
      { href: '/wins', label: 'Wins', icon: '🏆' },
      { href: '/commitments', label: 'Commitments', icon: '📝' },
      { href: '/decisions', label: 'Decision Journal', icon: '📓' },
      { href: '/settings', label: 'Settings', icon: '⚙' },
    ],
  },
] as const
