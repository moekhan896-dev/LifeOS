'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useStore } from '@/stores/store'
import { BUSINESSES } from '@/lib/constants'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

const REVENUE_LABELS: Record<string, string> = {
  agency: '$26K',
  plumbing: '~$18K',
  madison: '$16K',
  moggley: '$0',
  brand: 'Dormant',
  airbnb: '$1K net',
}

const BUSINESS_ROUTES: Record<string, string> = {
  agency: '/business/agency',
  plumbing: '/business/plumbing',
  madison: '/business/madison-clark',
  moggley: '/business/moggley',
  brand: '/business/personal-brand',
  airbnb: '/business/airbnb',
}

const OPS_LINKS = [
  { href: '/dashboard', label: 'Dashboard', icon: '◆' },
  { href: '/schedule', label: 'Schedule', icon: '◷' },
  { href: '/tasks', label: 'Tasks', icon: '☐', badge: 'tasks' as const },
  { href: '/insights', label: 'Insights', icon: '◈', badge: 'insights' as const },
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
]

export default function Sidebar() {
  const pathname = usePathname()
  const { theme, toggleTheme, sidebarOpen, toggleSidebar, tasks, insights, xp, level, todayHealth } = useStore()
  const [themeRotation, setThemeRotation] = useState(0)

  const undoneCount = tasks.filter((t) => !t.done).length
  const unratedCount = insights.filter((i) => !i.rating).length

  const prayers = todayHealth.prayers
  const prayerCount = Object.values(prayers).filter(Boolean).length
  const prayerScore = (prayerCount / 5) * 35
  const healthScore = (todayHealth.gym ? 15 : 0) + (todayHealth.energyDrinks === 0 ? 10 : 0)
  const doneToday = tasks.filter((t) => t.done && t.completedAt?.startsWith(todayHealth.date)).length
  const prodScore = Math.min(40, doneToday * 8)
  const dailyScore = Math.round(prayerScore + healthScore + prodScore)

  const xpInLevel = xp % 500
  const xpPercent = (xpInLevel / 500) * 100

  const badges: Record<string, number> = { tasks: undoneCount, insights: unratedCount }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  const handleThemeToggle = () => {
    setThemeRotation((r) => r + 180)
    toggleTheme()
  }

  // Score ring calculations
  const ringRadius = 24
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (dailyScore / 100) * ringCircumference

  const navLink = (href: string, label: string, icon?: string, badge?: number) => (
    <Link
      key={href}
      href={href}
      onClick={() => { if (window.innerWidth < 768) toggleSidebar() }}
      className="block"
    >
      <motion.div
        className={`relative flex items-center gap-2.5 px-3 py-1 text-[12px] group border-l-2 transition-colors ${
          isActive(href)
            ? 'border-l-[var(--color-accent)] bg-[var(--color-accent)]/5 text-[var(--color-accent)] font-medium'
            : 'border-l-transparent text-[var(--color-text-mid)]'
        }`}
        whileHover={{ x: 2, backgroundColor: 'var(--color-surface2)' }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {icon && <span className="w-4 text-center opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>}
        <span className="flex-1">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className="data text-[10px] bg-[var(--color-accent)]/15 text-[var(--color-accent)] px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
            {badge}
          </span>
        )}
      </motion.div>
    </Link>
  )

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] w-[220px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <Link href="/dashboard" className="data text-[14px] font-bold tracking-[5px] text-[var(--color-accent)]">
          ART OS
        </Link>
        <motion.button
          onClick={handleThemeToggle}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface2)] text-[var(--color-text-mid)] transition-colors"
          animate={{ rotate: themeRotation }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          )}
        </motion.button>
      </div>

      {/* AI Strategist Button */}
      <div className="px-3 pb-2">
        <Link href="/ai" className="block">
          <motion.div
            className="gradient-border-animated w-full text-center py-2 text-[12px] font-semibold tracking-wide text-[var(--color-text)]"
            whileHover={{
              scale: 1.02,
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.25)',
            }}
            transition={{ duration: 0.2 }}
          >
            AI Strategist
          </motion.div>
        </Link>
      </div>

      {/* Scrollable nav */}
      <div className="flex-1 overflow-y-auto px-1.5 space-y-3 scrollbar-thin">
        {/* Operations */}
        <div>
          <div className="section-label px-3 mb-1">OPERATIONS</div>
          <div className="space-y-0.5">
            {OPS_LINKS.map((l) => navLink(l.href, l.label, l.icon, l.badge ? badges[l.badge] : undefined))}
          </div>
        </div>

        {/* Businesses */}
        <div>
          <div className="section-label px-3 mb-1">BUSINESSES</div>
          <div className="space-y-0.5">
            {BUSINESSES.map((b) => (
              <Link
                key={b.id}
                href={BUSINESS_ROUTES[b.id]}
                onClick={() => { if (window.innerWidth < 768) toggleSidebar() }}
                className="block"
              >
                <motion.div
                  className={`relative flex items-center gap-2.5 px-3 py-1 text-[12px] group border-l-2 transition-colors ${
                    isActive(BUSINESS_ROUTES[b.id])
                      ? 'border-l-[var(--color-accent)] bg-[var(--color-accent)]/5 text-[var(--color-accent)] font-medium'
                      : 'border-l-transparent text-[var(--color-text-mid)]'
                  }`}
                  whileHover={{ x: 2, backgroundColor: 'var(--color-surface2)' }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: b.color }} />
                  <span className={`flex-1 truncate`}>{b.name}</span>
                  <span className="data text-[10px] text-[var(--color-text-dim)]">{REVENUE_LABELS[b.id]}</span>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* System */}
        <div>
          <div className="section-label px-3 mb-1">SYSTEM</div>
          <div className="space-y-0.5">
            {SYSTEM_LINKS.map((l) => navLink(l.href, l.label))}
          </div>
        </div>
      </div>

      {/* Daily Score with SVG Ring */}
      <div className="border-t border-[var(--color-border)] p-3 space-y-2">
        <div className="flex items-center justify-center">
          <div className="relative w-[60px] h-[60px]">
            <svg className="score-ring w-full h-full" viewBox="0 0 60 60">
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--color-accent)" />
                  <stop offset="100%" stopColor="var(--color-cyan)" />
                </linearGradient>
              </defs>
              <circle className="score-ring-bg" cx="30" cy="30" r={ringRadius} />
              <circle
                className="score-ring-fill"
                cx="30"
                cy="30"
                r={ringRadius}
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                key={dailyScore}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="gradient-text data text-lg font-bold"
              >
                {dailyScore}
              </motion.span>
            </div>
          </div>
        </div>

        {/* XP Bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-[var(--color-text-dim)]">XP</span>
            <div className="flex items-center gap-1.5">
              <span className="data text-[10px] text-[var(--color-text-dim)]">{xpInLevel}/500</span>
              <span className="data text-[9px] font-bold bg-[var(--color-accent)] text-[var(--color-bg)] px-1.5 py-0.5 rounded-full">
                LVL {level}
              </span>
            </div>
          </div>
          <div className="h-1.5 bg-[var(--color-surface2)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--color-accent)] rounded-full"
              initial={false}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Cmd+K hint */}
        <div className="flex justify-center pt-1">
          <span className="data text-[10px] text-[var(--color-text-dim)] bg-[var(--color-surface2)] px-2 py-0.5 rounded">
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
        onClick={toggleSidebar}
        className="md:hidden fixed top-3 left-3 z-50 w-9 h-9 flex items-center justify-center rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface2)] transition-all"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden md:block flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer with AnimatePresence */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleSidebar}
            />
            <motion.aside
              className="md:hidden fixed inset-y-0 left-0 z-50"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
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
