import type { useStore } from '@/stores/store'
import { computeMonthlyMoneySnapshot, getExecutionScore } from '@/stores/store'

type StoreState = ReturnType<typeof useStore.getState>


function commitmentFollowThrough30d(commitments: StoreState['commitments']) {
  const cutoff = Date.now() - 30 * 86400000
  const recent = commitments.filter((c) => new Date(c.createdAt).getTime() >= cutoff)
  if (recent.length === 0) return { total: 0, fulfilled: 0, ratePct: null as number | null, unfulfilled: [] as string[] }
  const fulfilled = recent.filter((c) => c.fulfilled).length
  const ratePct = Math.round((fulfilled / recent.length) * 100)
  const unfulfilled = recent.filter((c) => !c.fulfilled).map((c) => c.text).slice(0, 8)
  return { total: recent.length, fulfilled, ratePct, unfulfilled }
}

/** Unfulfilled commitments in last 30d grouped by source — PRD §8.2 "most commonly broken". */
function mostBrokenCommitmentPattern(commitments: StoreState['commitments']): string {
  const cutoff = Date.now() - 30 * 86400000
  const broken = commitments.filter(
    (c) => !c.fulfilled && new Date(c.createdAt).getTime() >= cutoff
  )
  if (broken.length === 0) return 'none outstanding in window'
  const bySource: Record<string, number> = {}
  for (const c of broken) {
    const k = (c.source || 'unknown').slice(0, 40)
    bySource[k] = (bySource[k] ?? 0) + 1
  }
  const top = Object.entries(bySource)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([s, n]) => `${s} (${n})`)
    .join('; ')
  return top || 'n/a'
}

function gymTaskCorrelation(history: StoreState['healthHistory'], tasks: StoreState['tasks']): string {
  const days = [...history].filter((h) => h.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14)
  if (days.length < 5) return 'Need more logged days with gym + tasks to correlate.'
  let gymDays = 0
  let gymTasks = 0
  let restDays = 0
  let restTasks = 0
  for (const h of days) {
    const done = tasks.filter((t) => t.done && t.completedAt?.startsWith(h.date)).length
    if (h.gym) {
      gymDays++
      gymTasks += done
    } else {
      restDays++
      restTasks += done
    }
  }
  if (gymDays < 2 || restDays < 2) return 'Gym vs non-gym sample still small — keep logging.'
  const ag = gymTasks / gymDays
  const ar = restTasks / restDays
  return `Gym days avg ${ag.toFixed(1)} tasks completed vs ${ar.toFixed(1)} on non-gym days (last ${days.length} logged days).`
}

function score7DayTrend(history: StoreState['healthHistory']): string {
  const sorted = [...history]
    .filter((h) => h.date && typeof h.dailyScore === 'number')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7)
  if (sorted.length < 3) return 'insufficient daily scores for trend'
  const scores = sorted.map((h) => h.dailyScore).reverse()
  const mid = Math.floor(scores.length / 2) || 1
  const first = scores.slice(0, mid).reduce((a, b) => a + b, 0) / mid
  const second = scores.slice(mid).reduce((a, b) => a + b, 0) / (scores.length - mid)
  if (second > first + 4) return `improving (recent avg ${second.toFixed(0)} vs prior ${first.toFixed(0)})`
  if (second < first - 4) return `declining (recent avg ${second.toFixed(0)} vs prior ${first.toFixed(0)})`
  return `flat (~${((first + second) / 2).toFixed(0)} avg)`
}

function mostProductiveHourRange(tasks: StoreState['tasks']): string {
  const done = tasks.filter((t) => t.done && t.completedAt)
  if (done.length < 5) return 'insufficient completion timestamps — complete more tasks with logged times'
  const hours: number[] = []
  for (const t of done.slice(-80)) {
    hours.push(new Date(t.completedAt!).getHours())
  }
  const buckets = [0, 0, 0, 0]
  const labels = ['morning ~5am–12pm', 'afternoon ~12–5pm', 'early evening ~5–9pm', 'night']
  for (const h of hours) {
    if (h >= 5 && h < 12) buckets[0]++
    else if (h >= 12 && h < 17) buckets[1]++
    else if (h >= 17 && h < 21) buckets[2]++
    else buckets[3]++
  }
  const maxI = buckets.indexOf(Math.max(...buckets))
  return `${labels[maxI]} (mode of last ${hours.length} completions)`
}

function aiPartnerFeedbackSummary(events: StoreState['behavioralEvents']): string {
  const fb = events.filter((e) => e.eventType === 'ai_feedback')
  if (fb.length === 0) return 'No thumbs-up/down yet — encourage feedback on assistant replies.'
  let up = 0
  let down = 0
  for (const e of fb.slice(-80)) {
    if (e.eventData?.rating === 'up') up++
    else if (e.eventData?.rating === 'down') down++
  }
  return `Thumbs-up ${up}, thumbs-down ${down} (recent window). Prefer approaches that earned up-votes.`
}

function prayerProductivityLines(history: StoreState['healthHistory'], tasks: StoreState['tasks']) {
  const hist = [...history].filter((h) => h.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 21)
  if (hist.length < 3) {
    return 'Not enough health history yet — log a few days of prayers and tasks to compute correlation.'
  }
  let fullDays = 0
  let fullTaskSum = 0
  let partialDays = 0
  let partialTaskSum = 0
  for (const h of hist) {
    const pc = Object.values(h.prayers).filter(Boolean).length
    const done = tasks.filter((t) => t.done && t.completedAt?.startsWith(h.date)).length
    if (pc >= 5) {
      fullDays++
      fullTaskSum += done
    } else if (pc > 0) {
      partialDays++
      partialTaskSum += done
    }
  }
  const avgFull = fullDays ? fullTaskSum / fullDays : 0
  const avgPartial = partialDays ? partialTaskSum / partialDays : 0
  if (fullDays >= 2 && partialDays >= 1) {
    const lift = avgPartial > 0 ? (avgFull / avgPartial).toFixed(2) : 'n/a'
    return `Prayer-productivity (last ${hist.length} logged days): full prayer days avg ${avgFull.toFixed(1)} tasks completed vs ${avgPartial.toFixed(1)} on partial days; ratio ≈ ${lift}×.`
  }
  return 'Prayer tracking is on — continue logging to stabilize correlation.'
}

function energyPatternLine(energyLogs: StoreState['energyLogs']) {
  const cutoff = Date.now() - 14 * 86400000
  const recent = energyLogs.filter((e) => new Date(e.date).getTime() >= cutoff)
  if (recent.length < 2) return 'Energy pattern: insufficient logs — log 2–3× daily for 3+ days.'
  const m: number[] = []
  const a: number[] = []
  const e: number[] = []
  for (const x of recent) {
    if (x.timeOfDay === 'morning') m.push(x.level)
    else if (x.timeOfDay === 'afternoon') a.push(x.level)
    else e.push(x.level)
  }
  const avg = (arr: number[]) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0)
  return `Energy (1–10, last 14d): morning avg ${avg(m).toFixed(1)}, afternoon ${avg(a).toFixed(1)}, evening ${avg(e).toFixed(1)} (${recent.length} samples).`
}

function screenScoreCorrelation(history: StoreState['healthHistory']) {
  const hist = history.filter((h) => typeof h.screenTimeHours === 'number' && h.screenTimeHours >= 0)
  if (hist.length < 4) return 'Screen time vs daily score: need more days with screen time logged.'
  const low = hist.filter((h) => h.screenTimeHours <= 4)
  const high = hist.filter((h) => h.screenTimeHours > 8)
  if (low.length < 2 || high.length < 2) return 'Screen time vs score: keep logging — split low/high days not yet distinct.'
  const avg = (days: typeof hist) =>
    days.length ? days.reduce((s, h) => s + h.dailyScore, 0) / days.length : 0
  return `Screen time correlation: days ≤4h screen avg daily score ${avg(low).toFixed(0)} vs >8h ${avg(high).toFixed(0)}.`
}

function behavioralHeuristics(state: StoreState): { strength: string; weakness: string; corePattern: string } {
  const open = state.tasks.filter((t) => !t.done)
  const stale = open.filter(
    (t) => Date.now() - new Date(t.createdAt).getTime() > 7 * 86400000
  ).length
  const doneWeek = state.tasks.filter(
    (t) => t.done && t.completedAt && Date.now() - new Date(t.completedAt).getTime() < 7 * 86400000
  ).length
  const ideas = state.ideas.filter((i) => !i.archived).length
  const promoted = state.ideas.filter((i) => i.promoted).length
  const ratio = ideas > 0 ? (promoted / ideas).toFixed(2) : 'n/a'
  return {
    strength:
      doneWeek >= 10
        ? 'High weekly task throughput'
        : doneWeek >= 3
          ? 'Steady execution on some fronts'
          : 'Building baseline — few completions last 7 days',
    weakness: stale > 5 ? `${stale} tasks open >7 days` : stale > 0 ? `${stale} older open tasks` : 'Limited data on avoidance',
    corePattern: `Idea→execution ratio (promoted/active ideas): ${ratio}; open tasks: ${open.length}.`,
  }
}

function escalationBlock(state: StoreState): string {
  const { net } = computeMonthlyMoneySnapshot({
    businesses: state.businesses,
    clients: state.clients,
    expenseEntries: state.expenseEntries,
  })
  const hourly =
    state.incomeTarget > 0
      ? Math.round(state.incomeTarget / 160)
      : Math.max(35, Math.round(net / 160) || 50)
  const cf = commitmentFollowThrough30d(state.commitments)
  const rate = cf.ratePct != null ? `${cf.ratePct}%` : 'n/a'
  return `ESCALATION PROTOCOL (per task age for incomplete work — PRD §8.2 / §8.4):
Day 1: Gentle, observational (informational). "I noticed [task] hasn't been started. Worth approximately $X/day." Use each task's dollar estimate from context.
Day 3: Data-backed (important). "[Task] pending 3 days. Highest-ROI at ~$${hourly}/hr. What would it take?" Reference similar task completion times when available.
Day 7: Firm, cost-focused (critical). "7 days. $[totalCost] in estimated lost value. Committed [x] times. Follow-through: ${rate}." Reference skip reasons if any.
Day 14+: Direct confrontation (critical). "[x] days on list; cumulative cost $[z]; ${rate} follow-through. Options: commit with plan + deadline, remove from list, or explain what's blocking — no judgment."
When generating proactive copy, match tier tone; include task dollar value and commitment follow-through rate in tier 2–4 messages.`
}

function conversationDigest(messages: StoreState['aiMessages']): string {
  const last = messages.slice(-10)
  if (last.length === 0) return 'No AI chat history yet.'
  return last
    .map((m) => `${m.role.toUpperCase()} (${new Date(m.createdAt).toLocaleDateString()}): ${m.content.slice(0, 280)}${m.content.length > 280 ? '…' : ''}`)
    .join('\n')
}

function daysSinceLastOpen(lastOpenedAt: string | null): string {
  if (!lastOpenedAt) return 'Unknown (first session or not tracked)'
  const ms = Date.now() - new Date(lastOpenedAt).getTime()
  return `${Math.max(0, Math.floor(ms / 86400000))}`
}

/** PRD §8.2 — full dynamic system prompt rebuilt from store (same text used for Copy Context). */
export function buildFullSystemPrompt(state: StoreState): string {
  const { totalIncome, recurringCosts, net } = computeMonthlyMoneySnapshot({
    businesses: state.businesses,
    clients: state.clients,
    expenseEntries: state.expenseEntries,
  })
  const gap = state.incomeTarget > 0 ? Math.max(0, state.incomeTarget - net) : 0
  const bh = behavioralHeuristics(state)
  const cf = commitmentFollowThrough30d(state.commitments)
  const tasksDoneToday = state.tasks.filter(
    (t) => t.done && t.completedAt?.startsWith(new Date().toISOString().split('T')[0])
  ).length
  const tasksRemaining = state.tasks.filter((t) => !t.done).length
  const todayStr = new Date().toISOString().split('T')[0]
  const tasksCommitted = state.tasks.filter(
    (t) => t.createdAt.startsWith(todayStr) || (!t.done && t.priority !== 'low')
  ).length
  const todayFocus = state.focusSessions.filter((s) => s.startedAt.startsWith(todayStr)).length
  const execScore = getExecutionScore(
    state.todayHealth,
    tasksCommitted,
    tasksDoneToday,
    todayFocus,
    state.trackPrayers
  )
  const zone =
    execScore >= 86
      ? 'Peak'
      : execScore >= 71
        ? 'Locked in'
        : execScore >= 51
          ? 'Solid'
          : execScore >= 31
            ? 'Getting there'
            : 'Restart'

  const valueDoneToday = state.tasks
    .filter((t) => t.done && t.completedAt?.startsWith(todayStr))
    .reduce((s, t) => s + (t.dollarValue ?? 0), 0)
  const valueRemaining = state.tasks
    .filter((t) => !t.done)
    .reduce((s, t) => s + (t.dollarValue ?? 0), 0)

  const avoidedTasks = state.tasks
    .filter((t) => !t.done)
    .map((t) => ({
      text: t.text,
      days: Math.floor((Date.now() - new Date(t.createdAt).getTime()) / 86400000),
      biz: state.businesses.find((b) => b.id === t.businessId)?.name ?? '',
    }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 8)

  const bizBlock = state.businesses
    .map((b) => {
      const cs = state.clients
        .filter((c) => c.businessId === b.id && c.active)
        .map(
          (c) =>
            `${c.name}: gross $${c.grossMonthly}/mo, ad $${c.adSpend}, health ${c.relationshipHealth ?? '—'}`
        )
        .join('; ')
      return `  • ${b.name} (${b.type}): ${b.status}, $${b.monthlyRevenue}/mo
    Day-to-day: "${(b.dayToDay ?? '').slice(0, 200)}"
    Role: ${b.roleDetail ?? '—'}, Team size: ${b.teamMembers?.length ?? 0}
    Tools: ${b.tools ?? '—'}, Bottleneck: "${(b.bottleneck ?? '').slice(0, 160)}"
    Revenue model: ${b.revenueModel ?? '—'}
    Clients: ${cs || 'none logged'}`
    })
    .join('\n')

  const assets = state.balanceSheetAssets.map((a) => `${a.name}: $${a.value}`).join('; ') || 'none logged'
  const debts = state.balanceSheetDebts.map((d) => `${d.label}: $${d.balance}`).join('; ') || 'none logged'
  const nw =
    state.balanceSheetAssets.reduce((s, a) => s + a.value, 0) -
    state.balanceSheetDebts.reduce((s, d) => s + d.balance, 0)

  const wakeAvg =
    state.healthHistory.length > 0
      ? state.healthHistory
          .filter((h) => h.wakeTime)
          .map((h) => h.wakeTime!)
          .slice(0, 7)
          .join(', ') || 'insufficient wake logs'
      : 'insufficient wake logs'

  const faithPct = (() => {
    const h = state.healthHistory.slice(-14)
    if (h.length === 0) return 'n/a'
    let sum = 0
    for (const day of h) {
      sum += Object.values(day.prayers).filter(Boolean).length / 5
    }
    return `${Math.round((sum / h.length) * 100)}% (avg prayer completion over ${h.length} days)`
  })()

  const mentorBlock =
    state.mentorPersonas.map((m) => `  • ${m.name}: ${m.description}`).join('\n') || '  (none)'

  return `You are the user's AI business partner inside ART OS. You have complete
knowledge of their life, businesses, finances, health, and behavioral
patterns. You communicate like a $1M/year business advisor — data-driven,
direct, always pushing toward action. You never just listen passively.
Every response should move toward a decision or next action.

YOUR PERSONALITY:
- Think like someone who has built and exited multiple 8-figure businesses
- You maintain great health, fitness, relationships, and spiritual practice
- You are simultaneously a coach, partner, mentor, and strategist
- You show data, ask "what would it take?", and always recommend an action
- You have full authority to argue with the user if you disagree
- You adapt your communication style based on what works for this specific user

COMMUNICATION STYLE (from onboarding):
Avoidance style: ${state.aiAvoidanceStyle || '—'}
Push style: ${state.aiPushStyle || '—'}
Motivators: ${(state.aiMotivators ?? []).join(', ') || '—'}
Frequency: ${state.aiFrequency || '—'}
Reasoning display: ${state.aiReasoningDisplay || '—'}

${escalationBlock(state)}

THE USER:
Name: ${state.userName || '—'}
Age: ${state.userAge || '—'}
Location: ${state.userLocation || '—'}
Self-description: "${(state.userSituation || '').slice(0, 500)}"
Biggest strength (heuristic): ${bh.strength}
Biggest weakness (heuristic): ${bh.weakness}
Core pattern: ${bh.corePattern}

GOALS:
Income target: $${state.incomeTarget}/mo by ${state.targetDate || '—'}
Current income (computed from businesses/clients): $${Math.round(totalIncome)}/mo
Gap to stated target: $${Math.round(gap)}/mo
North star: "${state.northStarMetric || '—'}"
Ideal day: "${(state.idealDay || '').slice(0, 400)}"
Why: "${(state.incomeWhy || '').slice(0, 400)}"

BUSINESSES (${state.businesses.length} total):
${bizBlock || '  (none)'}

FINANCES:
Monthly income (computed): $${Math.round(totalIncome)}
Monthly recurring expenses: $${Math.round(recurringCosts)}
Net take-home (computed): $${Math.round(net)}
Savings range: ${state.savingsRange || '—'}
Debts: ${debts}
Assets: ${assets}
Net worth (assets − debts, from balance sheet): ~$${Math.round(nw)}

HEALTH & HABITS:
Target wake: ${state.wakeUpTime || '—'}, Recent wake logs: ${wakeAvg}
Exercise: ${state.exercise || '—'}, Diet: ${state.dietQuality || '—'}
Caffeine: ${state.caffeineType || '—'} (${state.caffeineAmount ?? 0}/day)
Active streaks: ${state.streaks.map((s) => `${s.habit}: ${s.currentStreak}d`).join(', ') || '—'}
Energy pattern: ${energyPatternLine(state.energyLogs)}
Correlations:
- ${prayerProductivityLines(state.healthHistory, state.tasks)}
- ${screenScoreCorrelation(state.healthHistory)}
- ${gymTaskCorrelation(state.healthHistory, state.tasks)}

FAITH:
Tradition: ${state.faithTradition || '—'}
Prayer tracking: ${state.trackPrayers ? 'enabled' : 'disabled'}
Consistency (recent): ${faithPct}
(Prayer–productivity correlation is under HEALTH & HABITS → Correlations.)

STRUGGLES (handle with care):
Procrastination: "${(state.procrastination || '').slice(0, 300)}"
Distraction: ${state.biggestDistraction || '—'}
Trying to quit: "${(state.tryingToQuit || '').slice(0, 200)}"
Last locked in: "${(state.lockedInMemory || '').slice(0, 200)}"
What needs to be true: "${(state.whatNeedsToBeTrue || '').slice(0, 300)}"

COMMITMENTS (last 30 days):
Total: ${cf.total}, Fulfilled: ${cf.fulfilled}, Rate: ${cf.ratePct != null ? `${cf.ratePct}%` : 'n/a'}
Outstanding: ${cf.unfulfilled.length ? cf.unfulfilled.join('; ') : 'none listed'}
Most commonly broken (by source / pattern): ${mostBrokenCommitmentPattern(state.commitments)}

BEHAVIORAL PATTERNS:
Tasks avoided / stale (sample): ${avoidedTasks.map((t) => `"${t.text.slice(0, 60)}" (${t.days}d pending${t.biz ? ` · ${t.biz}` : ''})`).join('; ') || 'none'}
Most productive time (from completion timestamps): ${mostProductiveHourRange(state.tasks)}
7-day daily score trend: ${score7DayTrend(state.healthHistory)}
Avg execution score (today): ${execScore}/100 (${zone})
Idea → execution: ${state.ideas.filter((i) => !i.archived).length} active ideas, ${state.ideas.filter((i) => i.promoted).length} promoted; tasks completed last 7d: ${state.tasks.filter((t) => t.done && t.completedAt && Date.now() - new Date(t.completedAt).getTime() < 7 * 86400000).length}
Action-to-result: use pipeline / task completion dates when present; cold outreach → closed deal timing varies by user data.
AI PARTNER FEEDBACK (thumbs — PRD §8.8):
${aiPartnerFeedbackSummary(state.behavioralEvents)}

ACTIVE MENTOR PERSONAS:
${mentorBlock}

RECENT END-OF-DAY VOICE REVIEWS (PRD §20.5 — may reference in follow-ups):
${
  state.weeklyReflections
    .filter((r) => r.reflectionKind === 'evening_voice' || r.eveningVoiceTranscript)
    .slice(-5)
    .map((r) => {
      const t = (r.eveningVoiceTranscript || r.worked || '').slice(0, 500)
      const d = (r.createdAt || '').split('T')[0]
      return `  • ${d}: ${t}${t.length >= 500 ? '…' : ''}`
    })
    .join('\n') || '  (none yet)'
}

RECENT AI CONVERSATION EXCERPTS (last 10 messages — PRD §8.5):
${conversationDigest(state.aiMessages)}

CURRENT CONTEXT:
Date: ${todayStr}, Time: ${new Date().toLocaleTimeString()}
Tasks done today: ${tasksDoneToday} (tracked $ value est. $${Math.round(valueDoneToday)})
Tasks remaining: ${tasksRemaining} (uncompleted $ est. $${Math.round(valueRemaining)})
Execution score: ${execScore}/100 (${zone})
Days since last app open: ${daysSinceLastOpen(state.lastOpenedAt)}
`
}

/** @deprecated Use buildFullSystemPrompt — kept as alias for Copy Context & APIs (PRD §8.2, §8.6). */
export function buildContextSnapshot(state: StoreState): string {
  return buildFullSystemPrompt(state)
}

/** Shorter block for decision endpoints (includes financial + behavioral summary). */
export function buildDecisionContextAppendix(state: StoreState): string {
  const full = buildFullSystemPrompt(state)
  if (full.length <= 12000) return full
  return `${full.slice(0, 12000)}\n\n[… context truncated for token limits …]`
}

/** PRD Batch 2 — compact context for “Let AI suggest tasks”. */
export function buildTaskSuggestContext(state: StoreState): string {
  const goals = state.goals.filter((g) => new Date(g.cycleEnd) >= new Date())
  const projects = state.projects.filter((p) => p.status !== 'complete')
  const h = behavioralHeuristics(state)
  const open = state.tasks.filter((t) => !t.done)
  const bottlenecks = state.businesses
    .filter((b) => b.bottleneck?.trim())
    .map((b) => `${b.name}: ${b.bottleneck}`)
    .slice(0, 5)
  return [
    `Goals: ${goals.map((g) => `${g.title} (${g.currentValue}/${g.targetValue} ${g.targetMetric})`).join('; ') || 'none'}`,
    `Projects (not complete): ${projects.map((p) => `${p.name} [${p.status}] ICE ${p.impact * p.confidence * p.ease}`).join('; ') || 'none'}`,
    `Pattern / weakness: ${h.weakness}. ${h.corePattern}`,
    bottlenecks.length ? `Business bottlenecks: ${bottlenecks.join(' | ')}` : '',
    `Open tasks (sample): ${open.slice(0, 15).map((t) => t.text).join(' | ') || 'none'}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export type { StoreState }
