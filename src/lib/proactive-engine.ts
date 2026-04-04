/**
 * Proactive AI inbox — template mode when no API key (PRD GAP 5–6).
 * PRD §8.4 — per-task escalation Day 1 / 3 / 7 / 14+ with dedup windows.
 */

import type { Client, Business, Task, RevenueEntry, DecisionEntry } from '@/stores/store'

type BizHealth = 'strong' | 'weak' | 'flatline'

type ProactivePriority = 'critical' | 'important' | 'informational'

export interface ProactiveCandidate {
  triggerId: string
  priority: ProactivePriority
  body: string
  /** Hours before the same triggerId can fire again (default 24 in store). */
  dedupHours?: number
  /** In-app navigation for decision check-ins, etc. */
  ctaHref?: string
}

function getClientNet(c: Client) {
  return c.grossMonthly - c.adSpend - c.grossMonthly * 0.03
}

function getBusinessHealth(biz: Business, tasks: Task[], revenueEntries: RevenueEntry[]): BizHealth {
  const bizTasks = tasks.filter((t) => t.businessId === biz.id)
  const doneLast7 = bizTasks.filter(
    (t) => t.done && t.completedAt && new Date(t.completedAt) > new Date(Date.now() - 7 * 86400000)
  ).length
  const hasRevenue = biz.monthlyRevenue > 0 || revenueEntries.some((r) => r.businessId === biz.id)
  if (doneLast7 === 0 && biz.status !== 'dormant') return 'flatline'
  if (doneLast7 < 2 || (!hasRevenue && biz.status !== 'active_prerevenue' && biz.status !== 'dormant')) return 'weak'
  return 'strong'
}

function hasRecentTrigger(
  existing: { triggerId: string; createdAt: string }[],
  triggerId: string,
  hours: number
) {
  const cutoff = Date.now() - hours * 3600000
  return existing.some((m) => m.triggerId === triggerId && new Date(m.createdAt).getTime() > cutoff)
}

function daysSinceCreation(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

function priorityRank(p: Task['priority']) {
  return { crit: 0, high: 1, med: 2, low: 3 }[p] ?? 2
}

/** §8.4 — incomplete tasks only; one message per task per tier window. */
function buildEscalationCandidates(input: {
  tasks: Task[]
  commitments: { fulfilled: boolean }[]
  proactiveMessages: { triggerId: string; createdAt: string }[]
  monthlyNet: number
}): ProactiveCandidate[] {
  const out: ProactiveCandidate[] = []
  const hourly = Math.max(35, input.monthlyNet > 0 ? input.monthlyNet / 160 : 50)

  const incomplete = input.tasks
    .filter((t) => !t.done)
    .map((t) => ({ t, days: daysSinceCreation(t.createdAt) }))
    .filter((x) => x.days >= 1)
    .sort((a, b) => {
      const da = a.t.dollarValue ?? 0
      const db = b.t.dollarValue ?? 0
      if (db !== da) return db - da
      return priorityRank(a.t.priority) - priorityRank(b.t.priority)
    })
    .slice(0, 6)

  const totalCommits = input.commitments.length
  const fulfilledCommits = input.commitments.filter((c) => c.fulfilled).length
  const followPct =
    totalCommits > 0 ? Math.round((fulfilledCommits / totalCommits) * 100) : 100

  for (const { t, days } of incomplete) {
    let tier: 1 | 2 | 3 | 4
    if (days >= 14) tier = 4
    else if (days >= 7) tier = 3
    else if (days >= 3) tier = 2
    else tier = 1

    const triggerId = `esc-${t.id}-t${tier}`
    const dedupHours = tier === 4 ? 48 : 7 * 24

    if (hasRecentTrigger(input.proactiveMessages, triggerId, dedupHours)) continue

    const dv = t.dollarValue ?? 0
    const daily = dv > 0 ? Math.round(dv / 30) : Math.round(hourly / 8)
    const lost7 = dv > 0 ? Math.round((dv / 30) * Math.min(days, 30)) : Math.round(hourly * 0.5 * days)
    const skipNote = t.skipReason ? ` Last skip reason: "${t.skipReason.slice(0, 120)}".` : ''
    const skips = t.skipCount ?? 0

    let body = ''
    let priority: ProactivePriority = 'informational'

    if (tier === 1) {
      body = `I noticed "${t.text.slice(0, 120)}${t.text.length > 120 ? '…' : ''}" hasn't been started. It's worth approximately $${daily}/day based on your estimate${dv ? '' : ' (effective hourly fallback)'}. No pressure — just flagging it.`
      priority = 'informational'
    } else if (tier === 2) {
      body = `"${t.text.slice(0, 100)}${t.text.length > 100 ? '…' : ''}" has been pending for 3+ days. Based on your data, this is a high-priority item at ~$${hourly}/hr effective rate. What would it take to start today? I can help break it into subtasks.`
      priority = 'important'
    } else if (tier === 3) {
      body = `7 days. ~$${lost7} in estimated opportunity while "${t.text.slice(0, 80)}${t.text.length > 80 ? '…' : ''}" waits.${skips ? ` Skipped ${skips} time(s).` : ''} Your commitment follow-through is ${followPct}%.${skipNote} Before we discuss anything else — what's actually blocking this?`
      priority = 'critical'
    } else {
      body = `This has been on your list for ${days} days: "${t.text.slice(0, 90)}${t.text.length > 90 ? '…' : ''}". Cumulative estimated cost ~$${lost7}. Pick one: (1) Commit with a deadline now — I'll hold you to it. (2) Remove it — it's okay to deprioritize. (3) Tell me what's really going on.`
      priority = 'critical'
    }

    out.push({ triggerId, priority, body, dedupHours })
  }

  return out
}

/** PRD — decision review on check-in date (30/60/90) when outcome not yet recorded */
function buildDecisionReviewCandidates(
  decisionJournal: DecisionEntry[],
  proactiveMessages: { triggerId: string; createdAt: string }[]
): ProactiveCandidate[] {
  const out: ProactiveCandidate[] = []
  const now = Date.now()
  for (const d of decisionJournal) {
    if (!d.reviewDate?.trim() || d.actualOutcome?.trim()) continue
    const due = new Date(d.reviewDate).setHours(0, 0, 0, 0)
    const today = new Date().setHours(0, 0, 0, 0)
    if (due > today) continue
    const triggerId = `decision-review-${d.id}`
    if (hasRecentTrigger(proactiveMessages, triggerId, 72)) continue
    const days = Math.floor((now - new Date(d.createdAt).getTime()) / 86400000)
    const snippet = d.decision.length > 220 ? `${d.decision.slice(0, 220)}…` : d.decision
    out.push({
      triggerId,
      priority: 'important',
      body: `You made this decision ${days} days ago: "${snippet}". How did it play out?`,
      dedupHours: 72,
      ctaHref: `/decisions?review=${encodeURIComponent(d.id)}`,
    })
  }
  return out
}

/** PRD §10.5 — repeated skips (≥3) surface a dedicated nudge (Batch 2 escalation protocol). */
function buildRepeatedSkipCandidates(
  tasks: Task[],
  proactiveMessages: { triggerId: string; createdAt: string }[]
): ProactiveCandidate[] {
  const out: ProactiveCandidate[] = []
  for (const t of tasks) {
    if (t.done) continue
    const skips = t.skipCount ?? 0
    if (skips < 3) continue
    const triggerId = `task-skip-escalation-${t.id}`
    if (hasRecentTrigger(proactiveMessages, triggerId, 48)) continue
    const snippet = t.text.length > 100 ? `${t.text.slice(0, 100)}…` : t.text
    out.push({
      triggerId,
      priority: 'critical',
      body: `"${snippet}" has been skipped ${skips} times. What would it take to either do it in the next 24 hours or delete it from your list?`,
      dedupHours: 48,
      ctaHref: `/tasks?task=${encodeURIComponent(t.id)}`,
    })
  }
  return out
}

export function buildProactiveCandidates(input: {
  clients: Client[]
  businesses: Business[]
  tasks: Task[]
  commitments: { fulfilled: boolean }[]
  revenueEntries: RevenueEntry[]
  proactiveMessages: { triggerId: string; createdAt: string }[]
  anthropicKey: string
  monthlyNet: number
  decisionJournal: DecisionEntry[]
}): ProactiveCandidate[] {
  const out: ProactiveCandidate[] = []
  const noKeyNote = input.anthropicKey.trim()
    ? ''
    : ' Connect your AI key in Settings for personalized recommendations.'

  out.push(...buildDecisionReviewCandidates(input.decisionJournal, input.proactiveMessages))
  out.push(...buildRepeatedSkipCandidates(input.tasks, input.proactiveMessages))
  out.push(...buildEscalationCandidates(input))

  const activeClients = input.clients.filter((c) => c.active)
  const totalNet = activeClients.reduce((s, c) => s + getClientNet(c), 0)
  activeClients.forEach((c) => {
    const pct = totalNet > 0 ? (getClientNet(c) / totalNet) * 100 : 0
    if (pct > 40 && !hasRecentTrigger(input.proactiveMessages, `conc-${c.id}`, 24)) {
      out.push({
        triggerId: `conc-${c.id}`,
        priority: 'important',
        body: `⚠ ${c.name} is about ${Math.round(pct)}% of your client net revenue. Consider diversifying.${noKeyNote}`,
      })
    }
  })

  input.businesses.forEach((b) => {
    if (b.status === 'dormant' || b.status === 'idea') return
    const h = getBusinessHealth(b, input.tasks, input.revenueEntries)
    if (h === 'flatline' && !hasRecentTrigger(input.proactiveMessages, `flat-${b.id}`, 24)) {
      out.push({
        triggerId: `flat-${b.id}`,
        priority: 'critical',
        body: `🔴 ${b.name} has had no completed tasks in the last 7 days. Is this intentional?${noKeyNote}`,
      })
    }
  })

  const stale = input.tasks.filter((t) => !t.done && Date.now() - new Date(t.createdAt).getTime() > 7 * 86400000)
  if (stale.length > 0 && !hasRecentTrigger(input.proactiveMessages, 'stale-tasks', 24)) {
    out.push({
      triggerId: 'stale-tasks',
      priority: 'important',
      body: `You have ${stale.length} task(s) older than 7 days. Want to reprioritize or remove them?${noKeyNote}`,
    })
  }

  const total = input.commitments.length
  const fulfilled = input.commitments.filter((c) => c.fulfilled).length
  if (total > 0 && fulfilled / total < 0.5 && !hasRecentTrigger(input.proactiveMessages, 'commit-rate', 24)) {
    out.push({
      triggerId: 'commit-rate',
      priority: 'informational',
      body: `Commitment follow-through is below 50%. Consider fewer, clearer commitments.${noKeyNote}`,
    })
  }

  return out
}
