/** PRD §5.1 — sidebar & mobile “More” sheet (labels match spec). */
export const NAV_SECTIONS = [
  {
    label: 'Home',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: '◉' }],
  },
  {
    label: 'Command Center',
    items: [
      { href: '/ai', label: 'AI Partner', icon: '🧠' },
      { href: '/decision-lab', label: 'Decision Lab', icon: '⚗' },
      { href: '/scenarios', label: 'Scenarios', icon: '📊' },
    ],
  },
  {
    label: 'Empire',
    items: [
      { href: '/businesses', label: 'Businesses', icon: '🏢' },
      { href: '/pipeline', label: 'Pipeline', icon: '🎯' },
      { href: '/clients', label: 'Clients', icon: '👤' },
      { href: '/revenue-drivers', label: 'Revenue Drivers', icon: '↗' },
    ],
  },
  {
    label: 'Execution',
    items: [
      { href: '/tasks', label: 'Tasks', icon: '☐', badge: 'tasks' as const },
      { href: '/projects', label: 'Projects', icon: '📋', badge: 'projects' as const },
      { href: '/goals', label: 'Goals', icon: '🎯' },
      { href: '/sprint', label: 'Sprint', icon: '🏃' },
      { href: '/roadmap', label: 'Roadmap', icon: '🗓' },
    ],
  },
  {
    label: 'Money',
    items: [
      { href: '/financials', label: 'Financials', icon: '💰' },
      { href: '/net-worth', label: 'Net Worth', icon: '💎' },
      { href: '/expenses', label: 'Expenses', icon: '⊟' },
    ],
  },
  {
    label: 'Foundation',
    items: [
      { href: '/health', label: 'Health', icon: '♡' },
      { href: '/energy', label: 'Energy', icon: '⚡' },
      { href: '/schedule', label: 'Schedule', icon: '◷' },
      { href: '/health#habits', label: 'Habits', icon: '🔥' },
    ],
  },
  {
    label: 'Mind',
    items: [
      { href: '/idea-bank', label: 'Ideas', icon: '💡' },
      { href: '/knowledge', label: 'Knowledge Vault', icon: '📚' },
      { href: '/reflections', label: 'Reflections', icon: '📝' },
      { href: '/mentors', label: 'Mentors', icon: '🎭' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { href: '/reports', label: 'Reports', icon: '📈' },
      { href: '/insights', label: 'Insights', icon: '◈' },
      { href: '/skills', label: 'Skills', icon: '🌳' },
      { href: '/ecosystem', label: 'Ecosystem Map', icon: '🔗' },
    ],
  },
  {
    label: 'Account',
    items: [{ href: '/settings', label: 'Settings', icon: '⚙' }],
  },
] as const
