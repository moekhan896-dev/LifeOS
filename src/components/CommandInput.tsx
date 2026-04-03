'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useStore } from '@/stores/store'
import { BUSINESSES, TAGS, XP_VALUES } from '@/lib/constants'
import type { Priority } from '@/stores/store'
import { toast } from 'sonner'

export default function CommandInput() {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const router = useRouter()
  const { addTask } = useStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = value.trim()
    if (!text) return

    // AI query
    if (text.startsWith('?') || text.toLowerCase().startsWith('ask ')) {
      const query = text.startsWith('?') ? text.slice(1).trim() : text.slice(4).trim()
      router.push(`/ai?q=${encodeURIComponent(query)}`)
      setValue('')
      return
    }

    // Smart parse task
    let priority: Priority = 'med'
    let businessId = 'agency'
    let tag = ''

    const lower = text.toLowerCase()

    if (lower.includes('!crit') || lower.includes('critical')) priority = 'crit'
    else if (lower.includes('!high') || lower.includes('urgent')) priority = 'high'
    else if (lower.includes('!low')) priority = 'low'

    for (const b of BUSINESSES) {
      if (lower.includes(b.id) || lower.includes(b.name.toLowerCase())) {
        businessId = b.id
        break
      }
    }

    for (const t of TAGS) {
      if (lower.includes(`#${t.toLowerCase()}`) || lower.includes(t.toLowerCase())) {
        tag = t
        break
      }
    }

    addTask({
      businessId,
      text: text.replace(/!(crit|high|med|low)/gi, '').replace(/#\w+/g, '').trim(),
      tag,
      priority,
      done: false,
      xpValue: XP_VALUES[priority],
    })

    toast.success('Task added')
    setValue('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[640px] z-30"
    >
      <motion.div
        className="relative"
        animate={{
          boxShadow: focused
            ? '0 8px 32px rgba(0,0,0,0.25), 0 0 20px rgba(16,185,129,0.08)'
            : '0 4px 16px rgba(0,0,0,0.15)',
        }}
        style={{ borderRadius: 10 }}
        transition={{ duration: 0.2 }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Quick update or ask AI..."
          className="glass w-full bg-[var(--surface)]/80 backdrop-blur-xl border border-[var(--border)] rounded-[10px] px-4 py-3 text-[13px] text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none transition-colors duration-200 focus:border-[var(--border-glow)]"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[var(--text-dim)]">
          <button
            type="button"
            className="opacity-50 hover:opacity-100 transition-opacity group/mic relative"
            title="Use floating mic button"
          >
            <span className="absolute -top-8 right-0 whitespace-nowrap text-[10px] bg-[var(--surface2)] text-[var(--text-mid)] px-2 py-1 rounded-md opacity-0 group-hover/mic:opacity-100 transition-opacity pointer-events-none">
              Use floating mic button
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
          <kbd className="data text-[10px] bg-[var(--surface2)] px-1.5 py-0.5 rounded">↵</kbd>
        </div>
      </motion.div>
    </form>
  )
}
