'use client'

import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'

const SUGGESTED_PROMPTS = [
  'What should I focus on this week?',
  'How do I get to $50K/mo fastest?',
  'Analyze my revenue concentration risk',
  'Should I restart cold email for the agency?',
  "What's the ROI of signing the office lease?",
  'How should I monetize Madison Clark?',
  'Give me a brutal honest assessment',
  'What am I avoiding right now?',
]

// Business labels are now derived from store data at runtime

function renderMarkdown(text: string) {
  return text.split('\n').map((line, i) => {
    // Bold
    let html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Bullet points
    if (/^[-*]\s/.test(html)) {
      html = '<span class="inline-block w-1.5 h-1.5 rounded-full bg-accent mr-2 mt-2 shrink-0"></span>' + html.slice(2)
      return <div key={i} className="flex items-start ml-2 my-0.5" dangerouslySetInnerHTML={{ __html: html }} />
    }
    // Numbered lists
    if (/^\d+\.\s/.test(html)) {
      return <div key={i} className="ml-2 my-0.5" dangerouslySetInnerHTML={{ __html: html }} />
    }
    // Empty line
    if (!html.trim()) return <div key={i} className="h-2" />
    return <div key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: html }} />
  })
}

function buildContextSnapshot(state: ReturnType<typeof useStore.getState>) {
  const activeCommitments = state.commitments.filter(c => !c.fulfilled)
  const recentTasks = state.tasks.slice(-10)
  const activeStreaks = state.streaks

  // Compute financials from businesses, clients, revenue/expense entries
  const totalRevenue = state.revenueEntries.reduce((s, r) => s + r.amount, 0)
  const totalExpenses = state.expenseEntries.reduce((s, e) => s + e.amount, 0)
  const bizSummary = state.businesses.map(b => `${b.name}: $${b.monthlyRevenue.toLocaleString()}/mo`).join(', ')

  return `=== ART OS - BUSINESS CONTEXT SNAPSHOT ===
Date: ${new Date().toLocaleDateString()}

--- FINANCIALS (Computed) ---
Businesses: ${bizSummary || 'N/A'}
Total Logged Revenue: $${totalRevenue.toLocaleString()}
Total Logged Expenses: $${totalExpenses.toLocaleString()}

--- BUSINESS UNITS ---
${state.businesses.map((b, i) => `${i + 1}. ${b.name}: $${b.monthlyRevenue.toLocaleString()}/mo, status: ${b.status}${b.notes ? ' — ' + b.notes : ''}`).join('\n')}

--- STREAKS ---
${activeStreaks.map(s => `${s.habit}: ${s.currentStreak} day streak (best: ${s.longestStreak})`).join('\n')}

--- ACTIVE COMMITMENTS ---
${activeCommitments.length ? activeCommitments.map(c => `- ${c.text} (source: ${c.source}${c.dueDate ? ', due: ' + c.dueDate : ''})`).join('\n') : 'None'}

--- RECENT TASKS ---
${recentTasks.map(t => `- [${t.done ? 'x' : ' '}] ${t.text} (${t.priority})`).join('\n') || 'None'}

--- PIPELINE ---
${state.pipeline.map(d => `- ${d.companyName}: ${d.stage}${d.dealValue ? ' ($' + d.dealValue.toLocaleString() + ')' : ''}`).join('\n') || 'Empty'}

--- ACTIVE SPRINT ---
${state.sprints.filter(s => s.status === 'active').map(s => `Sprint ${s.sprintNumber}:\n${s.deliverables.map(d => `  - [${d.done ? 'x' : ' '}] ${d.text}`).join('\n')}`).join('\n') || 'None'}

--- XP / LEVEL ---
Level ${state.level} | ${state.xp} XP
`
}

const messageVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const } },
}

function AIPageInner() {
  const searchParams = useSearchParams()
  const businessFilter = searchParams.get('business')

  const {
    aiMessages, addAiMessage, clearAiMessages,
    businesses, clients, tasks, commitments, streaks, pipeline, sprints, level, xp
  } = useStore()

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => { scrollToBottom() }, [aiMessages.length, scrollToBottom])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [input])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    setError(null)

    const userContent = businessFilter && businesses.find(b => b.id === businessFilter)?.name
      ? `Context: ${businesses.find(b => b.id === businessFilter)?.name}\n\n${text.trim()}`
      : text.trim()

    addAiMessage({ role: 'user', content: userContent, businessContext: businessFilter || undefined })
    setInput('')

    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    setLoading(true)

    const currentMessages = useStore.getState().aiMessages
    const apiMessages = currentMessages.map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          context: buildContextSnapshot(useStore.getState()),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to get response')
      }

      const data = await res.json()
      addAiMessage({ role: 'assistant', content: data.content })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      if (msg.includes('API key') || msg.includes('ANTHROPIC_API_KEY')) {
        setError('AI requires an Anthropic API key. Add ANTHROPIC_API_KEY to your environment variables, or use the \'Copy Context\' button to paste into Claude.ai.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const copyContext = () => {
    const snap = buildContextSnapshot(useStore.getState())
    navigator.clipboard.writeText(snap)
    setCopied(true)
    toast.success('Context copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const activeCommitments = commitments.filter(c => !c.fulfilled)
  const recentTasks = tasks.slice(-5)
  const noMessages = aiMessages.length === 0

  return (
    <div className="h-[calc(100vh-0px)] flex">
      {/* LEFT: Chat Panel */}
      <div className="flex-1 lg:w-[70%] flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-text">AI Strategist</h1>
            <p className="text-[10px] font-mono uppercase tracking-[2px] text-text-dim mt-0.5">
              {businessFilter && businesses.find(b => b.id === businessFilter)?.name
                ? `Focused: ${businesses.find(b => b.id === businessFilter)?.name}`
                : 'Your AI co-founder. Hard truths only.'}
            </p>
          </div>
          {aiMessages.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { clearAiMessages(); toast('Chat cleared') }}
              className="text-xs text-text-dim hover:text-rose transition-colors px-3 py-1.5 rounded-[8px] border border-border hover:border-rose/30"
            >
              Clear Chat
            </motion.button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3">
          {noMessages && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <div className="w-12 h-12 rounded-[16px] bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h2 className="text-text font-medium mb-1">What&apos;s on your mind?</h2>
              <p className="text-text-dim text-sm mb-6">Pick a prompt or type your own</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <motion.button
                    key={p}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    whileHover={{ scale: 1.02, y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => sendMessage(p)}
                    className="text-left text-[14px] px-4 py-3 rounded-[12px] bg-surface2 border border-border hover:border-accent/40 hover:bg-surface3 text-text-mid hover:text-text transition-all duration-200"
                  >
                    {p}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {aiMessages.map((msg) => (
              <motion.div
                key={msg.id}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                layout
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-[16px] text-[14px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-surface3 border border-border text-text rounded-br-md'
                      : 'bg-surface2 border border-border text-text rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="space-y-0.5">{renderMarkdown(msg.content)}</div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                  <div className="text-[10px] text-text-dim mt-2 opacity-60">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-surface2 border border-border px-4 py-3 rounded-[16px] rounded-bl-md">
                <div className="flex gap-1.5">
                  <motion.span
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-accent/60 rounded-full"
                  />
                  <motion.span
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
                    className="w-2 h-2 bg-accent/60 rounded-full"
                  />
                  <motion.span
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
                    className="w-2 h-2 bg-accent/60 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto max-w-lg bg-rose/10 border border-rose/20 rounded-[16px] px-4 py-3 text-[14px] text-rose"
            >
              {error}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 md:px-6 pb-4 pt-2 border-t border-border shrink-0">
          <motion.div
            animate={{
              borderColor: inputFocused ? 'var(--accent)' : 'var(--border)',
              boxShadow: inputFocused ? '0 0 0 2px rgba(var(--accent-rgb, 99, 102, 241), 0.1)' : '0 0 0 0px transparent',
            }}
            transition={{ duration: 0.2 }}
            className="flex gap-2 items-end bg-surface2 border border-border rounded-[16px] px-4 py-2"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Ask your AI co-founder anything..."
              rows={1}
              className="flex-1 bg-transparent text-[14px] text-text placeholder-text-dim resize-none outline-none py-1.5 max-h-40"
            />
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="shrink-0 w-9 h-9 rounded-[12px] bg-accent hover:bg-accent/80 disabled:bg-surface3 disabled:text-text-dim text-bg flex items-center justify-center transition-all duration-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </motion.button>
          </motion.div>
          <p className="text-[10px] text-text-dim mt-1.5 text-center opacity-50">Shift+Enter for new line</p>
        </div>
      </div>

      {/* RIGHT: Context Panel (desktop only) */}
      <div className="hidden lg:flex w-[30%] border-l border-border flex-col overflow-y-auto bg-surface/50">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Business Context</h2>
          <p className="text-[10px] font-mono uppercase tracking-[2px] text-text-dim mt-0.5">Live data snapshot</p>
        </div>

        <div className="px-5 py-4 space-y-5 text-xs">
          {/* Business Snapshot */}
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-[2px] text-text-dim mb-2">Revenue Streams</h3>
            <div className="space-y-2">
              {businesses.map(b => (
                <motion.div key={b.id} whileHover={{ x: 2, y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} className="bg-surface2 border border-border rounded-[12px] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="text-text font-medium">{b.name}</span>
                  </div>
                  <p className="text-[14px] text-text-mid ml-3.5">${b.monthlyRevenue.toLocaleString()}/mo</p>
                  {b.notes && <p className="text-text-dim ml-3.5">{b.notes}</p>}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Streaks */}
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-[2px] text-text-dim mb-2">Streaks</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {streaks.map(s => (
                <motion.div key={s.habit} whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} className="bg-surface2 border border-border rounded-[12px] px-2.5 py-1.5">
                  <span className="text-text capitalize">{s.habit.replace('_', ' ')}</span>
                  <span className={`ml-1 font-mono font-bold ${s.currentStreak > 0 ? 'text-accent' : 'text-text-dim'}`}>
                    {s.currentStreak}d
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent Tasks */}
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-[2px] text-text-dim mb-2">Recent Tasks</h3>
            <div className="space-y-1">
              {recentTasks.length ? recentTasks.map(t => (
                <div key={t.id} className="flex items-center gap-2 text-text-mid">
                  <span className={`w-3 h-3 rounded border ${t.done ? 'bg-accent border-accent' : 'border-border'} shrink-0 flex items-center justify-center`}>
                    {t.done && <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2"><path d="M2 6l3 3 5-5"/></svg>}
                  </span>
                  <span className={t.done ? 'line-through text-text-dim' : ''}>{t.text}</span>
                </div>
              )) : <p className="text-text-dim italic">No tasks yet</p>}
            </div>
          </div>

          {/* Active Commitments */}
          <div>
            <h3 className="text-[10px] font-mono uppercase tracking-[2px] text-text-dim mb-2">Active Commitments</h3>
            <div className="space-y-1">
              {activeCommitments.length ? activeCommitments.map(c => (
                <div key={c.id} className="text-text-mid flex gap-2">
                  <span className="text-amber shrink-0">!</span>
                  <span>{c.text}</span>
                </div>
              )) : <p className="text-text-dim italic">No open commitments</p>}
            </div>
          </div>

          {/* Copy Context Button */}
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={copyContext}
            className="w-full py-2.5 rounded-[12px] bg-surface3 border border-border hover:border-accent/40 text-text-mid hover:text-text text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent"><path d="M20 6L9 17l-5-5"/></svg>
                Copied to Clipboard!
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copy Context to Claude.ai
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default function AIPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center text-text-dim">Loading...</div>}>
      <AIPageInner />
    </Suspense>
  )
}
