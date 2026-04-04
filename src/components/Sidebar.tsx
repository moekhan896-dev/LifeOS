'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, getExecutionScore, getBusinessHealth } from '@/stores/store'

const NAV_SECTIONS = [
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
]

function getRevenueLabel(b: { monthlyRevenue: number; status: string }) {
  if (b.status === 'dormant' || b.status === 'backburner') return 'Dormant'
  if (b.monthlyRevenue === 0) return '$0'
  if (b.monthlyRevenue < 1000) return `$${b.monthlyRevenue}`
  return `$${(b.monthlyRevenue / 1000).toFixed(0)}K`
}

export default function Sidebar() {
  const pathname = usePathname()
  const {
    theme, toggleTheme, sidebarOpen, toggleSidebar,
    businesses, tasks, revenueEntries, projects,
    xp, level, todayHealth, focusSessions, trackPrayers,
  } = useStore()

  const undoneCount = tasks.filter((t) => !t.done).length
  const activeProjects = projects.filter((p) => p.status === 'in_progress').length
  const today = todayHealth.date
  const todayFocusCount = focusSessions.filter((s) => s.startedAt?.startsWith(today)).length
  const tasksDoneToday = tasks.filter((t) => t.done && t.completedAt?.startsWith(today)).length
  const tasksCommitted = tasks.filter(
    (t) => t.createdAt.startsWith(today) || (!t.done && t.priority !== 'low')
  ).length
  const executionScore = getExecutionScore(
    todayHealth,
    tasksCommitted,
    tasksDoneToday,
    todayFocusCount,
    trackPrayers
  )

  const xpInLevel = xp % 100
  const xpPercent = xpInLevel

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  const ringRadius = 24
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (executionScore / 100) * ringCircumference

  const closeMobileIfNeeded = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) toggleSidebar()
  }

  const getBadgeText = (badge: string) => {
    if (badge === 'tasks') return undoneCount > 0 ? `${undoneCount}` : null
    if (badge === 'projects') return `${activeProjects}/3 active`
    return null
  }

  const sidebarContent = (
    <div
      className="flex flex-col h-full w-[240px] overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, var(--color-surface) 0%, color-mix(in srgb, var(--color-surface) 95%, black) 100%)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <motion.div
            className="w-2 h-2 rounded-full bg-[var(--accent)]"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span className="text-[15px] font-semibold tracking-[-0.3px] text-[var(--accent)]">
            ART OS
          </span>
        </Link>
        <motion.button
          type="button"
          onClick={() => toggleTheme()}
          className="touch-target-44 flex items-center justify-center rounded-xl text-[var(--color-text-mid)] transition-colors hover:bg-[var(--color-surface2)]"
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: theme === 'dark' ? 0 : 180 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          title="Toggle theme"
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </motion.button>
      </div>

      {/* AI Strategist — subtle text link + purple dot (AI-only accent) */}
      <div className="px-4 pb-3">
        <Link
          href="/ai"
          className="flex items-center gap-2 px-1 py-2 text-[13px] font-medium text-[var(--ai)] transition-opacity hover:opacity-90"
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ai)]" aria-hidden />
          <span>AI Strategist</span>
        </Link>
      </div>

      {/* Scrollable Navigation */}
      <div className="flex-1 overflow-y-auto pb-2 scrollbar-thin">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="label px-4 mt-4 mb-1">{section.label}</div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href)
                const badgeText = 'badge' in item && item.badge ? getBadgeText(item.badge as string) : null
                return (
                  <Link key={item.href} href={item.href} onClick={closeMobileIfNeeded} className="block group">
                    <motion.div
                      className={`relative flex min-h-[44px] items-center gap-2.5 px-4 py-[6px] text-[13px] font-medium rounded-[10px] mx-1.5 transition-colors ${
                        active
                          ? 'bg-[var(--accent-bg)] text-[var(--color-text)] font-semibold'
                          : 'text-[var(--color-text-mid)]'
                      }`}
                      whileHover={{ x: 1, backgroundColor: 'var(--color-surface2)', color: 'var(--color-text)' }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                    >
                      {active && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[var(--accent)]"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <span className="w-4 text-center text-[14px] opacity-60 group-hover:opacity-100 transition-opacity leading-none">
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {badgeText && (
                        <span className="data text-[10px] bg-[var(--accent-bg)] text-[var(--accent)] px-1.5 py-0.5 rounded-md min-w-[20px] text-center font-semibold">
                          {badgeText}
                        </span>
                      )}
                    </motion.div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        {/* Businesses */}
        <div>
          <div className="label px-4 mt-4 mb-1 flex items-center gap-2">
            Businesses
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <div className="space-y-0.5">
            {businesses.map((b) => {
              const href = `/business/${b.id}`
              const active = isActive(href)
              const health = getBusinessHealth(b, tasks, revenueEntries)
              const dotColor = health === 'strong' ? 'var(--positive)' : health === 'weak' ? '#f59e0b' : '#ef4444'
              return (
                <Link key={b.id} href={href} onClick={closeMobileIfNeeded} className="block group">
                  <motion.div
                    className={`relative flex min-h-[44px] items-center gap-2.5 px-4 py-[6px] text-[13px] font-medium rounded-[10px] mx-1.5 transition-colors ${
                      active
                        ? 'bg-[var(--accent-bg)] text-[var(--color-text)] font-semibold'
                        : 'text-[var(--color-text-mid)]'
                    }`}
                    whileHover={{ x: 1, backgroundColor: 'var(--color-surface2)', color: 'var(--color-text)' }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[var(--accent)]"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    {health === 'strong' ? (
                      <motion.div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dotColor }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ) : (
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
                    )}
                    <span className="text-[14px] leading-none">{b.icon}</span>
                    <span className="flex-1 truncate">{b.name}</span>
                    <span className="font-mono text-[10px] text-[var(--color-text-dim)]">
                      {getRevenueLabel(b)}
                    </span>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Execution Score + XP + Level */}
      <div className="border-t border-[var(--color-border)] px-4 py-4 space-y-3">
        <div className="flex items-center justify-center">
          <div className="relative" style={{ width: 60, height: 60 }}>
            <svg className="w-full h-full" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="execRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle cx="30" cy="30" r={ringRadius} fill="none" stroke="var(--color-border)" strokeWidth="4" />
              <circle
                cx="30" cy="30" r={ringRadius}
                fill="none"
                stroke="url(#execRingGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                key={executionScore}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="gradient-text data text-[20px] font-bold"
              >
                {executionScore}
              </motion.span>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="data text-[10px] text-[var(--color-text-dim)]">{xpInLevel}/500 XP</span>
            <span className="data text-[10px] font-bold bg-[var(--accent)] text-white px-2 py-0.5 rounded-full">
              LVL {level}
            </span>
          </div>
          <div className="h-[3px] bg-[var(--color-surface2)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--accent)]"
              initial={false}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Cmd+K Hint */}
        <div className="flex justify-center">
          <span className="data text-[10px] text-[var(--color-text-dim)] bg-[var(--color-surface2)] px-2.5 py-1 rounded-lg">
            ⌘K
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={sidebarOpen}
        className="touch-target-44 md:hidden fixed top-3 left-3 z-50 flex items-center justify-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface2)] transition-all shadow-lg"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden md:block flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleSidebar}
            />
            <motion.aside
              className="md:hidden fixed inset-y-0 left-0 z-50"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
