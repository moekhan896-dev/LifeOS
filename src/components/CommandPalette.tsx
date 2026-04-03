'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/stores/store'

const PAGES = [
  { name: 'Dashboard', href: '/dashboard', icon: '◆' },
  { name: 'Schedule', href: '/schedule', icon: '◷' },
  { name: 'Tasks', href: '/tasks', icon: '☐' },
  { name: 'Insights', href: '/insights', icon: '◈' },
  { name: 'AI Strategist', href: '/ai', icon: '🧠' },
  { name: 'Financials', href: '/financials', icon: '⊟' },
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
  { name: 'Time Capsule', href: '/capsule', icon: '💊' },
  { name: 'Reflections', href: '/reflections', icon: '🪞' },
  { name: 'Contacts', href: '/contacts', icon: '👥' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { tasks, businesses, addTask } = useStore()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const go = (href: string) => { router.push(href); setOpen(false) }

  const recentTasks = tasks.filter((t) => !t.done).slice(0, 5)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
          onClick={() => setOpen(false)}
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-[560px] mx-4"
          >
            <Command className="glass border border-[var(--color-border)] rounded-[12px] overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-4 border-b border-[var(--color-border)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-dim)" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <Command.Input
                  placeholder="Search pages, tasks, or type a command..."
                  className="flex-1 bg-transparent py-3.5 text-[14px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] outline-none"
                />
                <kbd className="data text-[10px] text-[var(--color-text-dim)] bg-[var(--color-surface2)] px-1.5 py-0.5 rounded">ESC</kbd>
              </div>
              <Command.List className="max-h-[320px] overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-[13px] text-[var(--color-text-dim)]">No results found.</Command.Empty>

                <Command.Group heading={<span className="label text-[10px] px-2">PAGES</span>}>
                  {PAGES.map((p) => (
                    <Command.Item
                      key={p.href}
                      value={p.name}
                      onSelect={() => go(p.href)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-[var(--color-text-mid)] cursor-pointer transition-colors data-[selected]:bg-[var(--color-surface2)] data-[selected]:text-[var(--color-text)]"
                    >
                      <span className="w-5 text-center opacity-60">{p.icon}</span>
                      {p.name}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading={<span className="label text-[10px] px-2">BUSINESSES</span>}>
                  {businesses.map((b) => (
                    <Command.Item
                      key={b.id}
                      value={`${b.name} ${b.id}`}
                      onSelect={() => go(`/business/${b.id}`)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-[var(--color-text-mid)] cursor-pointer transition-colors data-[selected]:bg-[var(--color-surface2)] data-[selected]:text-[var(--color-text)]"
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                      {b.name}
                    </Command.Item>
                  ))}
                </Command.Group>

                {recentTasks.length > 0 && (
                  <Command.Group heading={<span className="label text-[10px] px-2">RECENT TASKS</span>}>
                    {recentTasks.map((t) => (
                      <Command.Item
                        key={t.id}
                        value={t.text}
                        onSelect={() => { go('/tasks') }}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-[var(--color-text-mid)] cursor-pointer transition-colors data-[selected]:bg-[var(--color-surface2)] data-[selected]:text-[var(--color-text)]"
                      >
                        <span className="w-4 text-center opacity-40">☐</span>
                        <span className="truncate">{t.text}</span>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                <Command.Group heading={<span className="label text-[10px] px-2">ACTIONS</span>}>
                  <Command.Item value="add task new" onSelect={() => go('/tasks')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-[var(--color-text-mid)] cursor-pointer transition-colors data-[selected]:bg-[var(--color-surface2)] data-[selected]:text-[var(--color-text)]">
                    <span className="w-5 text-center text-[var(--color-accent)]">+</span>
                    Add Task
                  </Command.Item>
                  <Command.Item value="ask ai strategist" onSelect={() => go('/ai')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-[var(--color-text-mid)] cursor-pointer transition-colors data-[selected]:bg-[var(--color-surface2)] data-[selected]:text-[var(--color-text)]">
                    <span className="w-5 text-center">🧠</span>
                    Ask AI Strategist
                  </Command.Item>
                  <Command.Item value="log idea" onSelect={() => go('/idea-bank')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-[var(--color-text-mid)] cursor-pointer transition-colors data-[selected]:bg-[var(--color-surface2)] data-[selected]:text-[var(--color-text)]">
                    <span className="w-5 text-center">💡</span>
                    Log an Idea
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
