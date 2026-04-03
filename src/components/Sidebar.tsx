'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/stores/store'

function getRevenueLabel(b: { monthlyRevenue: number; status: string }) {
  if (b.status === 'dormant' || b.status === 'backburner') return 'Dormant'
  if (b.monthlyRevenue === 0) return '$0'
  if (b.monthlyRevenue < 1000) return `$${b.monthlyRevenue}`
  return `$${(b.monthlyRevenue / 1000).toFixed(0)}K`
}

const OPS_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: '\u25C6' },
  { href: '/schedule', label: 'Schedule', icon: '\u25F7' },
  { href: '/tasks', label: 'Tasks', icon: '\u2610', badge: 'tasks' as const },
  { href: '/insights', label: 'Insights', icon: '\u25C8', badge: 'insights' as const },
]

const SYSTEM_LINKS = [
  { href: '/financials', label: 'Financials' },
  { href: '/revenue-drivers', label: 'Revenue Drivers' },
  { href: '/health', label: 'Health & Deen' },
  { href: '/idea-bank', label: 'Idea Bank' },
  { href: '/sprint', label: 'Sprint' },
  { href: '/scenarios', label: 'Scenarios' },
  { href: '/sops', label: 'SOPs' },
  { href: '/wins', label: 'Wins' },
  { href: '/commitments', label: 'Commitments' },
  { href: '/net-worth', label: 'Net Worth' },
  { href: '/ecosystem', label: 'Ecosystem' },
  { href: '/settings', label: 'Settings', icon: '\u2699' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const {
    theme, toggleTheme, sidebarOpen, toggleSidebar,
    tasks, insights, xp, level, todayHealth, businesses,
  } = useStore()

  const undoneCount = tasks.filter((t) => !t.done).length
  const unratedCount = insights.filter((i) => !i.rating).length

  const prayerCount = Object.values(todayHealth.prayers).filter(Boolean).length
  const prayerScore = (prayerCount / 5) * 35
  const healthScore = (todayHealth.gym ? 15 : 0) + (todayHealth.energyDrinks === 0 ? 10 : 0)
  const doneToday = tasks.filter((t) => t.done && t.completedAt?.startsWith(todayHealth.date)).length
  const prodScore = Math.min(40, doneToday * 8)
  const dailyScore = Math.round(prayerScore + healthScore + prodScore)

  const xpInLevel = xp % 500
  const xpPercent = (xpInLevel / 500) * 100

  const badges: Record<string, number> = { tasks: undoneCount, insights: unratedCount }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  const ringRadius = 32
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (dailyScore / 100) * ringCircumference

  const closeMobileIfNeeded = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) toggleSidebar()
  }

  const navItem = (href: string, label: string, icon?: string, rightContent?: React.ReactNode) => {
    const active = isActive(href)
    return (
      <Link key={href} href={href} onClick={closeMobileIfNeeded} className="block">
        <motion.div
          className={`relative flex items-center gap-2.5 px-3 py-[7px] text-[13px] font-medium rounded-lg mx-1.5 transition-colors ${
            active
              ? 'bg-[var(--color-accent)]/5 text-white font-semibold'
              : 'text-[var(--color-text-mid)] hover:text-[var(--color-text)]'
          }`}
          whileHover={{ x: 2, backgroundColor: 'var(--color-surface2)' }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {/* Active indicator */}
          {active && (
            <motion.div
              layoutId="sidebar-active"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[var(--color-accent)]"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          {icon && (
            <span className="w-4 text-center text-[14px] opacity-60 group-hover:opacity-100 transition-opacity">
              {icon}
            </span>
          )}
          <span className="flex-1 truncate">{label}</span>
          {rightContent}
        </motion.div>
      </Link>
    )
  }

  const badge = (count: number) =>
    count > 0 ? (
      <span className="data text-[10px] bg-[var(--color-accent)]/15 text-[var(--color-accent)] px-1.5 py-0.5 rounded-full min-w-[20px] text-center font-semibold">
        {count}
      </span>
    ) : null

  const sidebarContent = (
    <div
      className="flex flex-col h-full w-[240px] overflow-hidden"
      style={{
        background: 'linear-gradient(90deg, var(--color-surface) 0%, color-mix(in srgb, var(--color-surface) 92%, white) 100%)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <motion.div
            className="w-2 h-2 rounded-full bg-[#10b981]"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <span
            className="data text-[15px] font-bold tracking-[6px]"
            style={{ color: '#10b981' }}
          >
            ART OS
          </span>
        </Link>
        <motion.button
          onClick={() => toggleTheme()}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[var(--color-surface2)] text-[var(--color-text-mid)] transition-colors"
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: theme === 'dark' ? 0 : 180 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          title="Toggle theme"
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

      {/* ---- AI Strategist Button ---- */}
      <div className="px-4 pb-3">
        <Link href="/ai" className="block">
          <motion.div
            className="gradient-border flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[12px] font-semibold text-white cursor-pointer"
            style={{ background: 'var(--color-surface2)' }}
            whileHover={{
              scale: 1.02,
              boxShadow: '0 0 24px rgba(16, 185, 129, 0.3)',
            }}
            transition={{ duration: 0.2 }}
          >
            <span>&#129504;</span>
            <span>AI Strategist</span>
          </motion.div>
        </Link>
      </div>

      {/* ---- Scrollable Navigation ---- */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-2 scrollbar-thin">
        {/* Operations */}
        <div>
          <div className="section-label px-4 mb-1.5">OPERATIONS</div>
          <div className="space-y-0.5">
            {OPS_LINKS.map((l) =>
              navItem(l.href, l.label, l.icon, l.badge ? badge(badges[l.badge]) : undefined)
            )}
          </div>
        </div>

        {/* Businesses */}
        <div>
          <div className="section-label px-4 mb-1.5">BUSINESSES</div>
          <div className="space-y-0.5">
            {businesses.map((b) => {
              const href = `/business/${b.id}`
              const active = isActive(href)
              return (
                <Link key={b.id} href={href} onClick={closeMobileIfNeeded} className="block">
                  <motion.div
                    className={`relative flex items-center gap-2.5 px-3 py-[7px] text-[13px] font-medium rounded-lg mx-1.5 transition-colors ${
                      active
                        ? 'bg-[var(--color-accent)]/5 text-white font-semibold'
                        : 'text-[var(--color-text-mid)] hover:text-[var(--color-text)]'
                    }`}
                    whileHover={{ x: 2, backgroundColor: 'var(--color-surface2)' }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-[var(--color-accent)]"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white/10"
                      style={{ backgroundColor: b.color }}
                    />
                    <span className="flex-1 truncate">{b.name}</span>
                    <span className="data text-[10px] text-[var(--color-text-dim)] font-medium">
                      {getRevenueLabel(b)}
                    </span>
                  </motion.div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* System */}
        <div>
          <div className="section-label px-4 mb-1.5">SYSTEM</div>
          <div className="space-y-0.5">
            {SYSTEM_LINKS.map((l) => navItem(l.href, l.label))}
          </div>
        </div>
      </div>

      {/* ---- Bottom: Daily Score ---- */}
      <div className="border-t border-[var(--color-border)] px-4 py-4 space-y-3">
        {/* Score Ring */}
        <div className="flex items-center justify-center">
          <div className="relative" style={{ width: 80, height: 80 }}>
            <svg className="w-full h-full" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="scoreRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle
                cx="40" cy="40" r={ringRadius}
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="5"
              />
              <circle
                cx="40" cy="40" r={ringRadius}
                fill="none"
                stroke="url(#scoreRingGrad)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                key={dailyScore}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="gradient-text data text-[24px] font-bold"
              >
                {dailyScore}
              </motion.span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="data text-[10px] text-[var(--color-text-dim)]">{xpInLevel}/500 XP</span>
            <span className="data text-[10px] font-bold bg-[var(--color-accent)] text-white px-2 py-0.5 rounded-full">
              LVL {level}
            </span>
          </div>
          <div className="h-[3px] bg-[var(--color-surface2)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--color-accent)] rounded-full"
              initial={false}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Cmd+K Hint */}
        <div className="flex justify-center">
          <span className="data text-[10px] text-[var(--color-text-dim)] bg-[var(--color-surface2)] px-2.5 py-1 rounded-lg">
            &#8984;K
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface2)] transition-all shadow-lg"
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
