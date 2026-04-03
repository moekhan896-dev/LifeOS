'use client'

import { useState } from 'react'
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
      className="fixed bottom-0 left-0 right-0 mx-4 mb-4 z-30"
    >
      <motion.div
        className="glass rounded-[16px] p-3 flex items-center gap-3 max-w-[640px] mx-auto"
        animate={{
          boxShadow: focused
            ? '0 12px 40px rgba(0,0,0,0.3), 0 0 24px rgba(16,185,129,0.1)'
            : '0 8px 24px rgba(0,0,0,0.2)',
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Mic button */}
        <button
          type="button"
          className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgb(16,185,129), rgb(6,182,212))' }}
          title="Use floating mic button"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </button>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Quick update or ask AI..."
          className="flex-1 bg-transparent text-[14px] text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none"
        />

        {/* Enter hint */}
        <kbd className="data text-[10px] text-[var(--text-dim)] bg-[var(--surface2)] px-1.5 py-0.5 rounded-[8px] flex-shrink-0">&crarr;</kbd>
      </motion.div>
    </form>
  )
}
