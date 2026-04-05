'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore, isArchived } from '@/stores/store'

const PAGES = [
  { name: 'Dashboard', href: '/dashboard', icon: '◆' },
  { name: 'AI Insights', href: '/ai-insights', icon: '✉' },
  { name: 'Schedule', href: '/schedule', icon: '◷' },
  { name: 'Tasks', href: '/tasks', icon: '☐' },
  { name: 'Insights', href: '/insights', icon: '◈' },
  { name: 'AI Partner', href: '/ai', icon: '🧠' },
  { name: 'Pipeline', href: '/pipeline', icon: '🎯' },
  { name: 'Clients', href: '/clients', icon: '👤' },
  { name: 'Businesses', href: '/businesses', icon: '🏢' },
  { name: 'Expenses', href: '/expenses', icon: '⊟' },
  { name: 'Financials', href: '/financials', icon: '⊞' },
  { name: 'Revenue Drivers', href: '/revenue-drivers', icon: '↗' },
  { name: 'Health & Deen', href: '/health', icon: '♡' },
  { name: 'Idea Bank', href: '/idea-bank', icon: '💡' },
  { name: 'Sprint Planner', href: '/sprint', icon: '🏃' },
  { name: 'Scenarios', href: '/scenarios', icon: '📊' },
  { name: 'SOPs', href: '/sops', icon: '📋' },
  { name: 'Wins', href: '/wins', icon: '🏆' },
  { name: 'Commitments', href: '/commitments', icon: '🤝' },
  { name: 'Net Worth', href: '/net-worth', icon: '💎' },
  { name: 'Ecosystem', href: '/ecosystem', icon: '🕸' },
  { name: 'Vision & Identity', href: '/vision', icon: '👁' },
  { name: 'Goals', href: '/goals', icon: '🎯' },
  { name: 'Projects', href: '/projects', icon: '📁' },
  { name: 'Focus Mode', href: '/focus', icon: '🔥' },
  { name: 'DRIP Matrix', href: '/drip', icon: '💧' },
  { name: 'Energy Dashboard', href: '/energy', icon: '⚡' },
  { name: 'Skill Tree', href: '/skills', icon: '🌳' },
  { name: 'AI Reports', href: '/reports', icon: '📈' },
  { name: 'Knowledge Vault', href: '/knowledge', icon: '📚' },
  { name: 'Decision Journal', href: '/decisions', icon: '⚖' },
  { name: 'Decision Lab', href: '/decision-lab', icon: '⚗' },
  { name: 'Mentors', href: '/mentors', icon: '🎭' },
  { name: 'Spending calculator', href: '/spending-calculator', icon: '⧉' },
  { name: 'Time Capsule', href: '/capsule', icon: '💊' },
  { name: 'Reflections', href: '/reflections', icon: '🪞' },
  { name: 'Contacts', href: '/contacts', icon: '👥' },
]

const paletteShell =
  'overflow-hidden rounded-[16px] border border-[var(--border)] bg-[var(--color-surface)] shadow-2xl backdrop-blur-[40px]'

const itemCls =
  'flex min-h-[44px] cursor-pointer items-center gap-3 rounded-[12px] px-3 py-2.5 text-[17px] text-[var(--color-text-mid)] transition-colors data-[selected]:bg-[var(--accent-bg)] data-[selected]:text-[var(--color-text)]'

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  /** Remount input with pre-filled query from voice ("search for …"). */
  const [inputBoot, setInputBoot] = useState({ key: 0, q: '' })
  const router = useRouter()
  const { tasks, businesses } = useStore()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    const onVoiceOpen = () => {
      const q = sessionStorage.getItem('cmdk-q') || ''
      sessionStorage.removeItem('cmdk-q')
      setInputBoot((b) => ({ key: b.key + 1, q }))
      setOpen(true)
    }
    window.addEventListener('artos:open-command-palette', onVoiceOpen)
    return () => window.removeEventListener('artos:open-command-palette', onVoiceOpen)
  }, [])

  const go = (href: string) => {
    router.push(href)
    setOpen(false)
  }

  const recentTasks = tasks.filter((t) => !t.done).slice(0, 5)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]"
          onClick={() => setOpen(false)}
        >
          <div className="fixed inset-0 bg-black/45 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -6 }}
            transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 mx-4 w-full max-w-[560px]"
          >
            <Command className={paletteShell}>
              <div className="border-b border-[var(--border)] px-4 pb-3 pt-4">
                <label className="sr-only" htmlFor="command-palette-input">
                  Search
                </label>
                <div className="flex items-center gap-3 rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--text-dim)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <Command.Input
                    key={inputBoot.key}
                    id="command-palette-input"
                    defaultValue={inputBoot.q}
                    placeholder="Search pages, tasks, or type a command…"
                    className="min-h-[48px] flex-1 bg-transparent py-[14px] text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:ring-0"
                  />
                  <kbd className="data shrink-0 rounded-md bg-[var(--color-surface2)] px-2 py-1 text-[11px] text-[var(--color-text-dim)]">
                    ESC
                  </kbd>
                </div>
              </div>
              <Command.List className="max-h-[min(420px,50vh)] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-[17px] text-[var(--text-dim)]">
                  No results found.
                </Command.Empty>

                <Command.Group heading={<span className="label block px-2 pb-1 pt-2">Pages</span>}>
                  {PAGES.map((p) => (
                    <Command.Item key={p.href} value={p.name} onSelect={() => go(p.href)} className={itemCls}>
                      <span className="w-5 text-center text-[15px] opacity-70">{p.icon}</span>
                      {p.name}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading={<span className="label block px-2 pb-1 pt-3">Businesses</span>}>
                  {businesses.filter((b) => !isArchived(b)).map((b) => (
                    <Command.Item
                      key={b.id}
                      value={`${b.name} ${b.id}`}
                      onSelect={() => go(`/business/${b.id}`)}
                      className={itemCls}
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: b.color }} />
                      {b.name}
                    </Command.Item>
                  ))}
                </Command.Group>

                {recentTasks.length > 0 && (
                  <Command.Group heading={<span className="label block px-2 pb-1 pt-3">Recent tasks</span>}>
                    {recentTasks.map((t) => (
                      <Command.Item
                        key={t.id}
                        value={t.text}
                        onSelect={() => {
                          go('/tasks')
                        }}
                        className={itemCls}
                      >
                        <span className="w-4 text-center text-[15px] opacity-40">☐</span>
                        <span className="truncate">{t.text}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading={<span className="label block px-2 pb-1 pt-3">Actions</span>}>
                  <Command.Item value="add task new" onSelect={() => go('/tasks')} className={itemCls}>
                    <span className="w-5 text-center text-[17px] font-semibold text-[var(--accent)]">+</span>
                    Add task
                  </Command.Item>
                  <Command.Item value="ask ai strategist" onSelect={() => go('/ai')} className={itemCls}>
                    <span className="w-5 text-center text-[15px]">🧠</span>
                    Ask AI Strategist
                  </Command.Item>
                  <Command.Item value="log idea" onSelect={() => go('/idea-bank')} className={itemCls}>
                    <span className="w-5 text-center text-[15px]">💡</span>
                    Log an idea
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
