'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { buildDecisionContextAppendix } from '@/lib/ai-context'
import { formatDecisionAnalysisForChat, type DecisionAnalysisStructured } from '@/lib/decision-analysis-types'

type ClarifyQ = { id: string; text: string; placeholder?: string }

export default function DecisionLabPage() {
  const store = useStore()
  const {
    anthropicKey,
    addDecision,
    addCommitment,
    mentorPersonas,
    logEvent,
    updateDecision,
    addScheduledProactiveMessage,
  } = store
  const [decision, setDecision] = useState('')
  const [mentorId, setMentorId] = useState<string>('')
  const [phase, setPhase] = useState<'decision' | 'clarify' | 'result'>('decision')
  const [questions, setQuestions] = useState<ClarifyQ[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  /** Legacy fallback when the model returns non-JSON */
  const [analysisFallback, setAnalysisFallback] = useState<string | null>(null)
  const [analysisStructured, setAnalysisStructured] = useState<DecisionAnalysisStructured | null>(null)
  /** Journal row for this run — used for check-ins and follow-ups (PRD §7.2). */
  const [resultDecisionId, setResultDecisionId] = useState<string | null>(null)

  const lens = mentorPersonas.find((m) => m.id === mentorId)

  const fetchQuestions = async () => {
    if (!decision.trim()) {
      toast.error('Describe what you are considering.')
      return
    }
    if (!anthropicKey) {
      toast.error('Add an Anthropic API key in Settings to generate clarifying questions.')
      return
    }
    setLoadingQuestions(true)
    setQuestions([])
    setAnswers({})
    try {
      const context = buildDecisionContextAppendix(store)
      const res = await fetch('/api/decision-lab/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decision.trim(),
          context,
          apiKey: anthropicKey || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load questions')
      setQuestions(data.questions ?? [])
      setPhase('clarify')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Could not generate questions')
    } finally {
      setLoadingQuestions(false)
    }
  }

  const runAnalysis = async () => {
    if (!decision.trim()) {
      toast.error('Decision missing.')
      return
    }
    const missing = questions.filter((q) => !answers[q.id]?.trim())
    if (questions.length > 0 && missing.length > 0) {
      toast.error('Answer each clarifying question (short answers are fine).')
      return
    }
    setLoading(true)
    setAnalysisFallback(null)
    setAnalysisStructured(null)
    try {
      const context = buildDecisionContextAppendix(store)
      const answerPayload: Record<string, string> = {}
      for (const q of questions) {
        answerPayload[q.text] = answers[q.id]?.trim() ?? ''
      }
      const res = await fetch('/api/decision-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: decision.trim(),
          answers: questions.length ? answerPayload : {},
          context,
          apiKey: anthropicKey || undefined,
          mentorLens:
            lens != null
              ? { name: lens.name, description: lens.description, sourceUrls: lens.sourceUrls }
              : undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      if (data.structured) {
        setAnalysisStructured(data.structured as DecisionAnalysisStructured)
        setAnalysisFallback(null)
      } else {
        setAnalysisStructured(null)
        setAnalysisFallback(typeof data.content === 'string' ? data.content : '')
        if (data.parseError) toast.message(String(data.parseError))
      }
      setPhase('result')
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const logCommitment = () => {
    addCommitment(`Decision: ${decision.trim()}`, 'decision_lab')
    toast.success('Logged as commitment')
  }

  const analysisSummaryText = analysisStructured
    ? formatDecisionAnalysisForChat(analysisStructured)
    : analysisFallback ?? ''

  const ensureDecisionJournalId = () => {
    if (resultDecisionId) return resultDecisionId
    const id = addDecision({
      decision: decision.trim(),
      reasoning: JSON.stringify(answers),
      expectedOutcome: analysisSummaryText.slice(0, 500),
    })
    setResultDecisionId(id)
    return id
  }

  const chooseOption = (opt: 'A' | 'B' | 'C') => {
    if (!analysisSummaryText.trim()) return
    const id = addDecision({
      decision: decision.trim(),
      reasoning: JSON.stringify({ clarifyAnswers: answers, chosenOption: opt }),
      expectedOutcome: analysisSummaryText.slice(0, 500),
    })
    setResultDecisionId(id)
    addCommitment(`Commit to Option ${opt}: ${decision.trim().slice(0, 140)}`, 'decision_lab_option', undefined)
    logEvent('decision_made', { decisionId: id, optionChosen: opt })
    toast.success(`Option ${opt} saved — commitment added`)
  }

  const scheduleCheckIn = (days: 30 | 60 | 90) => {
    const id = ensureDecisionJournalId()
    const reveal = new Date()
    reveal.setDate(reveal.getDate() + days)
    reveal.setHours(9, 0, 0, 0)
    updateDecision(id, { reviewDate: reveal.toISOString() })
    addScheduledProactiveMessage({
      triggerId: `decision-checkin-${id}-${days}d`,
      body: `Decision check-in: "${decision.trim().slice(0, 120)}${decision.length > 120 ? '…' : ''}" — Review how it went and your next move.`,
      priority: 'important',
      revealAt: reveal.toISOString(),
      ctaHref: '/decision-lab',
    })
    toast.success(`Check-in scheduled — you’ll see a reminder in ${days} days`)
  }

  const argueWithMeHref =
    analysisSummaryText && decision.trim()
      ? `/ai?q=${encodeURIComponent(
          `Argue with me on this decision. Challenge my assumptions and stress-test my reasoning.\n\n---\nDecision:\n${decision.trim()}\n\n---\nAnalysis:\n${analysisSummaryText.slice(0, 3500)}`
        )}`
      : '/ai'

  const resetFlow = () => {
    setPhase('decision')
    setQuestions([])
    setAnswers({})
    setAnalysisFallback(null)
    setAnalysisStructured(null)
    setResultDecisionId(null)
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl space-y-6 pb-24">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.2px] text-[var(--text-primary)]">Decision Lab</h1>
          <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
            PRD §7.2 — state the decision, answer AI-generated clarifiers, then get Option A / B / C analysis.
          </p>
        </div>

        {!anthropicKey && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-[15px] text-[var(--text-secondary)]">
            Add an Anthropic API key in{' '}
            <Link href="/settings" className="font-medium text-[var(--accent)]">
              Settings
            </Link>{' '}
            for clarifying questions and analysis. Or use{' '}
            <Link href="/ai" className="font-medium text-[var(--accent)]">
              AI Partner → Copy Context
            </Link>
            .
          </div>
        )}

        {phase === 'decision' && (
          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
            <label className="input-label block">What are you considering?</label>
            <textarea
              className="min-h-[100px] w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:outline-none"
              placeholder="e.g. Should I hire a VA part-time for 10 hours/week?"
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
            />
            <label className="input-label block">Mentor lens (optional)</label>
            <select
              className="w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[17px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
              value={mentorId}
              onChange={(e) => setMentorId(e.target.value)}
            >
              <option value="">Balanced (no lens)</option>
              {mentorPersonas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.isBuiltin ? '' : ' (custom)'}
                </option>
              ))}
            </select>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              disabled={loadingQuestions || !anthropicKey}
              onClick={() => void fetchQuestions()}
              className="mt-2 min-h-[44px] w-full rounded-[14px] bg-[var(--accent)] py-3 text-[17px] font-semibold text-white disabled:opacity-40"
            >
              {loadingQuestions ? 'Generating questions…' : 'Continue — get clarifying questions'}
            </motion.button>
          </div>
        )}

        {phase === 'clarify' && questions.length > 0 && (
          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
            <p className="text-[15px] font-medium text-[var(--text-primary)]">Answer a few questions</p>
            {questions.map((q, i) => (
              <div key={q.id}>
                <label className="mb-1 block text-[13px] text-[var(--text-secondary)]">
                  {i + 1}. {q.text}
                </label>
                <textarea
                  className="min-h-[72px] w-full rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[17px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none"
                  placeholder={q.placeholder || 'Your answer'}
                  value={answers[q.id] ?? ''}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                onClick={() => void runAnalysis()}
                className="min-h-[44px] flex-1 rounded-[14px] bg-[var(--accent)] py-3 text-[17px] font-semibold text-white disabled:opacity-40"
              >
                {loading ? 'Analyzing…' : 'Run impact analysis'}
              </motion.button>
              <button
                type="button"
                onClick={resetFlow}
                className="min-h-[44px] rounded-[14px] border border-[var(--border)] px-4 text-[15px] text-[var(--text-secondary)]"
              >
                Start over
              </button>
            </div>
          </div>
        )}

        {phase === 'result' && analysisSummaryText.trim() && (
          <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[17px] font-semibold text-[var(--text-primary)]">Analysis</h2>
              <button type="button" onClick={resetFlow} className="text-[14px] text-[var(--accent)]">
                New decision
              </button>
            </div>

            {analysisStructured ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
                    Decision
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                    {analysisStructured.decisionSummary}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50 p-4">
                  <p className="text-[13px] font-semibold text-[var(--accent)]">Option A — proposed action</p>
                  <dl className="mt-3 space-y-2 text-[14px] text-[var(--text-secondary)]">
                    <div>
                      <dt className="text-[11px] font-medium text-[var(--text-tertiary)]">Financial impact</dt>
                      <dd className="mt-0.5">{analysisStructured.optionA.financialImpact}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-medium text-[var(--text-tertiary)]">Non-financial impact</dt>
                      <dd className="mt-0.5">{analysisStructured.optionA.nonFinancialImpact}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-medium text-[var(--text-tertiary)]">Timeline</dt>
                      <dd className="mt-0.5">{analysisStructured.optionA.timeline}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-medium text-[var(--text-tertiary)]">Risk factors</dt>
                      <dd className="mt-0.5">{analysisStructured.optionA.riskFactors}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-medium text-[var(--text-tertiary)]">Confidence</dt>
                      <dd className="mt-0.5">{analysisStructured.optionA.confidence}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50 p-4">
                  <p className="text-[13px] font-semibold text-[var(--accent)]">Option B — status quo</p>
                  <dl className="mt-3 space-y-2 text-[14px] text-[var(--text-secondary)]">
                    <div>
                      <dt className="text-[11px] font-medium text-[var(--text-tertiary)]">Status quo</dt>
                      <dd className="mt-0.5">{analysisStructured.optionB.statusQuo}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-medium text-[var(--text-tertiary)]">Cost of inaction</dt>
                      <dd className="mt-0.5">{analysisStructured.optionB.costOfInaction}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]/50 p-4">
                  <p className="text-[13px] font-semibold text-[var(--accent)]">Option C — alternative</p>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                    {analysisStructured.optionC.alternative}
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--accent)]/35 bg-[var(--accent)]/5 p-4">
                  <p className="text-[13px] font-semibold text-[var(--accent)]">AI recommendation</p>
                  <p className="mt-1 text-[15px] font-semibold text-[var(--text-primary)]">
                    {analysisStructured.aiRecommendation.verdict}{' '}
                    <span className="text-[13px] font-normal text-[var(--text-tertiary)]">
                      ({Math.round(analysisStructured.aiRecommendation.confidencePercent)}% confidence)
                    </span>
                  </p>
                  <p className="mt-2 text-[14px] leading-relaxed text-[var(--text-secondary)]">
                    {analysisStructured.aiRecommendation.reasoning}
                  </p>
                </div>
              </div>
            ) : (
              <div className="prose prose-invert mt-1 max-w-none whitespace-pre-wrap text-[15px] text-[var(--text-secondary)]">
                {analysisFallback}
              </div>
            )}

            <div className="space-y-2 border-t border-[var(--border)] pt-4">
              <p className="text-[13px] font-medium text-[var(--text-primary)]">Commit</p>
              <p className="text-[12px] text-[var(--text-tertiary)]">
                Logs a commitment and records <code className="text-[11px]">decision_made</code>.
              </p>
              <div className="flex flex-wrap gap-2">
                {(['A', 'B', 'C'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => chooseOption(opt)}
                    className="min-h-[44px] rounded-[12px] bg-[var(--accent)] px-4 py-2 text-[15px] font-semibold text-white"
                  >
                    I&apos;ll do {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border)] pt-4">
              <Link
                href={argueWithMeHref}
                className="rounded-[12px] border border-[var(--border)] bg-[rgba(255,255,255,0.06)] px-4 py-2 text-[15px] font-medium text-[var(--text-primary)]"
              >
                Argue with me
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] text-[var(--text-secondary)]">Set check-in</span>
                {([30, 60, 90] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => scheduleCheckIn(d)}
                    className="rounded-[10px] border border-[var(--border)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-primary)] hover:border-[var(--accent)]"
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const id = addDecision({
                    decision: decision.trim(),
                    reasoning: JSON.stringify(answers),
                    expectedOutcome: analysisSummaryText.slice(0, 500),
                  })
                  setResultDecisionId(id)
                  toast.success('Saved to decision journal')
                }}
                className="rounded-[12px] bg-[rgba(255,255,255,0.08)] px-4 py-2 text-[15px] font-medium text-[var(--text-primary)]"
              >
                Save to journal
              </button>
              <button
                type="button"
                onClick={logCommitment}
                className="rounded-[12px] bg-[rgba(255,255,255,0.08)] px-4 py-2 text-[15px] font-medium text-[var(--text-primary)]"
              >
                Log commitment
              </button>
              <Link
                href="/spending-calculator"
                className="rounded-[12px] px-4 py-2 text-[15px] font-medium text-[var(--accent)]"
              >
                Spending calculator →
              </Link>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
