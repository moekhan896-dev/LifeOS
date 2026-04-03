'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/store'
import { BUSINESSES, TAGS, XP_VALUES } from '@/lib/constants'
import type { Priority } from '@/stores/store'

export default function CommandInput() {
  const [value, setValue] = useState('')
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

    // Detect priority
    if (lower.includes('!crit') || lower.includes('critical')) priority = 'crit'
    else if (lower.includes('!high') || lower.includes('urgent')) priority = 'high'
    else if (lower.includes('!low')) priority = 'low'

    // Detect business
    for (const b of BUSINESSES) {
      if (lower.includes(b.id) || lower.includes(b.name.toLowerCase())) {
        businessId = b.id
        break
      }
    }

    // Detect tag
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

    setValue('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[640px] z-30"
    >
      <div className="relative group">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Quick update or ask AI..."
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[10px] px-4 py-3 text-[13px] text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none transition-all duration-200 focus:border-[var(--border-glow)] focus:shadow-[0_0_20px_rgba(16,185,129,0.08)]"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-[var(--text-dim)]">
          <kbd className="data text-[10px] bg-[var(--surface2)] px-1.5 py-0.5 rounded">↵</kbd>
        </div>
      </div>
    </form>
  )
}
