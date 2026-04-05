'use client'

import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore, isArchived } from '@/stores/store'
import { buildFullSystemPrompt } from '@/lib/ai-context'
import { extractCommitmentsFromUserMessage } from '@/lib/extract-commitments'

const SUGGESTED_PROMPTS = [
  'What should I focus on this week?',
  'Where is my biggest revenue concentration risk?',
  'Analyze my pipeline vs my stated income goal',
  'What am I avoiding right now?',
  'Give me a direct assessment of my execution score drivers',
  'How should I prioritize my top three businesses?',
  'What would make this week a win?',
  'Compare my commitments to my calendar reality',
]

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

const messageVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const } },
}

function AIPageInner() {
  const searchParams = useSearchParams()
  const businessFilter = searchParams.get('business')

  const {
    aiMessages, addAiMessage, updateAiMessage, clearAiMessages,
    businesses, clients, tasks, commitments, streaks, pipeline, sprints, level, xp,
    projects, goals, identityStatements, skillLevels,
    addCommitment,
    addAiReport,
    logEvent,
  } = useStore()

  const activeBusinesses = useMemo(
    () => businesses.filter((b) => !isArchived(b)),
    [businesses]
  )
  const filterBizName = businessFilter
    ? activeBusinesses.find((b) => b.id === businessFilter)?.name
    : undefined

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const askPrefillDone = useRef(false)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [aiMessages, scrollToBottom])

  useEffect(() => {
    const ask = searchParams.get('ask')
    if (!ask || askPrefillDone.current) return
    askPrefillDone.current = true
    setInput((prev) => (prev.trim() ? prev : ask))
  }, [searchParams])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
    }
  }, [input])

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return
    setError(null)

    const raw = text.trim()
    const extracted = extractCommitmentsFromUserMessage(raw)
    if (extracted.length > 0) {
      for (const line of extracted) {
        addCommitment(line, 'ai_chat')
      }
      toast.success(extracted.length === 1 ? 'Commitment saved from your message' : `${extracted.length} commitments saved`)
    }

    const userContent = filterBizName ? `Context: ${filterBizName}\n\n${raw}` : raw

    addAiMessage({ role: 'user', content: userContent, businessContext: businessFilter || undefined })
    setInput('')

    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    setLoading(true)

    const reportMatch = raw.match(/\b(?:generate\s+(?:a\s+)?report\s+on|report\s+on)\s+(.+)/i)
    if (reportMatch) {
      const topic = reportMatch[1].trim()
      try {
        const st = useStore.getState()
        const res = await fetch('/api/reports/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportType: 'custom',
            customTopic: topic,
            context: buildFullSystemPrompt(st),
            apiKey: st.anthropicKey || undefined,
          }),
        })
        const data = (await res.json()) as { content?: string; grade?: string; error?: string }
        if (!res.ok) throw new Error(data.error || 'Report failed')
        const content = data.content || ''
        addAiReport({
          level: 'custom',
          content,
          topic,
          date: new Date().toISOString().split('T')[0],
          grade: data.grade,
        })
        addAiMessage({
          role: 'assistant',
          content: `**Custom report saved** (Reports → history). Topic: ${topic}\n\n${content}`,
        })
        toast.success('Report generated and saved')
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Report failed'
        addAiMessage({ role: 'assistant', content: `Could not generate report: ${msg}` })
      } finally {
        setLoading(false)
      }
      return
    }

    const currentMessages = useStore.getState().aiMessages
    const apiMessages = currentMessages.map(m => ({ role: m.role, content: m.content }))

    let streamAssistantId: string | undefined
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          context: buildFullSystemPrompt(useStore.getState()),
          fullPrdSystemPrompt: true,
          apiKey: useStore.getState().anthropicKey || undefined,
        }),
      })

      const ct = res.headers.get('content-type') || ''
      if (!res.ok) {
        const data = ct.includes('application/json') ? await res.json().catch(() => ({})) : {}
        throw new Error((data as { error?: string }).error || (await res.text()) || 'Failed to get response')
      }

      if (!res.body) {
        throw new Error('No response body')
      }

      streamAssistantId = addAiMessage({ role: 'assistant', content: '' })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      let started = false
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        if (!started && acc.length > 0) {
          started = true
          setLoading(false)
        }
        updateAiMessage(streamAssistantId, acc)
      }
      if (!started) setLoading(false)
      if (!acc.trim()) {
        updateAiMessage(streamAssistantId, '(Empty response — try again or check your API key.)')
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      if (streamAssistantId) {
        updateAiMessage(streamAssistantId, `Could not complete response: ${msg}`)
      }
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
    const snap = buildFullSystemPrompt(useStore.getState())
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
              {filterBizName ? `Focused: ${filterBizName}` : 'Your AI co-founder. Hard truths only.'}
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
                    transition={{ delay: i * 0.03, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                    whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                    onClick={() => sendMessage(p)}
                    className="text-left text-[17px] px-4 py-3 rounded-[12px] bg-surface2 border border-border hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)] text-text-mid hover:text-text transition-colors duration-200"
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
                  className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-[16px] text-[17px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-surface3 border border-border text-text rounded-br-md'
                      : 'bg-surface2 border border-border text-text rounded-bl-md'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="space-y-0.5">{renderMarkdown(msg.content || '…')}</div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                  {msg.role === 'assistant' && msg.content.trim().length > 0 && (
                    <div className="mt-2 flex items-center gap-2 border-t border-border/60 pt-2">
                      <button
                        type="button"
                        aria-label="Thumbs up"
                        className="rounded-lg px-2 py-1 text-[13px] text-text-mid hover:bg-surface3 hover:text-accent"
                        onClick={() => {
                          logEvent('ai_feedback', { messageId: msg.id, rating: 'up' })
                          toast.success("Noted — I'll do more of this.")
                        }}
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        aria-label="Thumbs down"
                        className="rounded-lg px-2 py-1 text-[13px] text-text-mid hover:bg-surface3 hover:text-rose"
                        onClick={() => {
                          logEvent('ai_feedback', { messageId: msg.id, rating: 'down' })
                          toast.success('Thanks for the feedback.')
                        }}
                      >
                        👎
                      </button>
                    </div>
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
              {activeBusinesses.map((b) => (
                <motion.div key={b.id} className="rounded-[12px] border border-border bg-surface2 px-3 py-2 transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)]">
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
                <motion.div key={s.habit} className="rounded-[12px] border border-border bg-surface2 px-2.5 py-1.5 transition-colors hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)]">
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

          {/* Projects */}
          {projects.length > 0 && (
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-[2px] text-text-dim mb-2">Projects</h3>
              <div className="space-y-1">
                {projects.map(p => (
                  <div key={p.id} className="flex items-center gap-2 text-text-mid">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.status === 'in_progress' ? 'bg-accent' : p.status === 'complete' ? 'bg-green-400' : 'bg-zinc-400'}`} />
                    <span className="truncate">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Goals */}
          {goals.length > 0 && (
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-[2px] text-text-dim mb-2">Goals</h3>
              <div className="space-y-1">
                {goals.map(g => (
                  <div key={g.id} className="text-text-mid flex gap-2">
                    <span className="text-accent shrink-0">{g.currentValue}/{g.targetValue}</span>
                    <span className="truncate">{g.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Identity */}
          {identityStatements.length > 0 && (
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-[2px] text-text-dim mb-2">Identity</h3>
              <div className="space-y-1">
                {identityStatements.map(i => (
                  <div key={i.id} className="text-text-mid text-xs italic">&ldquo;{i.text}&rdquo;</div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {skillLevels.length > 0 && (
            <div>
              <h3 className="text-[10px] font-mono uppercase tracking-[2px] text-text-dim mb-2">Top Skills</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {skillLevels.slice(0, 6).map(s => (
                  <div key={s.id} className="bg-surface2 border border-border rounded-[12px] px-2.5 py-1.5">
                    <span className="text-text">{s.skill}</span>
                    <span className="ml-1 font-mono font-bold text-accent">L{s.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Copy Context Button */}
          <motion.button
            whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
            onClick={copyContext}
            className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-border bg-surface3 py-2.5 text-[17px] font-medium text-text-mid transition-colors duration-200 hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)] hover:text-text"
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
