/** PRD §22 — template + data; AI fills narrative when key present */

export type ReportGenType = 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom' | 'daily'

const SYSTEM_BASE =
  'You are generating an ART OS analytics report. Use ONLY facts present in DATA; do not invent revenue, names, or tasks. If DATA is sparse, say what is missing. Keep structured headings. End with a letter grade line when applicable: "Grade: X".'

const SYSTEM_BY_TYPE: Record<ReportGenType, string> = {
  daily: `${SYSTEM_BASE} This is a DAILY debrief: same-day performance, wins/misses, and one priority for tomorrow.`,
  weekly: `${SYSTEM_BASE} This is a WEEKLY report (PRD §22.1): prioritize THIS week's average execution score, task throughput (done vs committed), and the single biggest bottleneck. Short sections; actionable.`,
  monthly: `${SYSTEM_BASE} This is a MONTHLY report (PRD §22.1): synthesize trends across ~4 weeks, revenue vs expenses trajectory, goal progress, habit consistency, energy/commitment summaries — not a copy of a single week.`,
  quarterly: `${SYSTEM_BASE} This is a QUARTERLY strategy report (PRD §22.1): 12-week scorecard, financial trajectory (start vs end of window), decision quality if present, identity/north-star alignment, next-quarter bets.`,
  annual: `${SYSTEM_BASE} This is an ANNUAL review (PRD §22.1): full-year narrative, headline numbers (revenue, net, net worth if present, tasks, scores, streaks, decisions), goals post-mortem, next-year priorities.`,
  custom: SYSTEM_BASE,
}

export function buildReportPrompt(
  type: ReportGenType,
  dataJson: string,
  customTopic?: string
): { system: string; user: string } {
  const data = dataJson || '{}'

  const shells: Record<ReportGenType, string> = {
    daily: `Daily Debrief (PRD §22)
- Performance summary (today)
- Wins / misses
- Letter grade (A–F)
DATA:\n${data}`,

    weekly: `Weekly Report — PRD §22.1 (distinct from monthly/quarterly/annual)
Focus THIS calendar week only:
1. Score overview (avg daily score if present, high/low, trend vs prior week if inferable)
2. Task stats (completed, committed, crit/high carryover)
3. Revenue / net snapshot (from DATA only)
4. Top achievement
5. Biggest struggle
6. Three concrete recommendations for NEXT week
DATA:\n${data}`,

    monthly: `Monthly Report — PRD §22.1
Aggregate the month (not a single week):
1. Weekly highlights rolled up (themes, not day-by-day noise)
2. Revenue trend vs prior month (only if DATA supports)
3. Expense / recurring pressure
4. Goal progress vs targets
5. Habit consistency (rates, streaks)
6. AI narrative: what changed vs last month
7. Energy pattern summary if logged
8. Commitment fulfillment rate
DATA:\n${data}`,

    quarterly: `Quarterly Strategy Report — PRD §22.1
12-week / ~90-day window:
1. Scorecard: execution + health scores summarized across the quarter
2. Financial trajectory (period start vs end — only from DATA)
3. Decision accuracy / follow-through if decision journal in DATA
4. Identity / vision drift or progress
5. Next cycle: 3 priorities and 1 thing to STOP
DATA:\n${data}`,

    annual: `Annual Review — PRD §22.1
Full year:
1. Year narrative (story arc of the business + life operating system)
2. Numbers summary: revenue, net, net worth if in DATA, tasks done, score highs, longest streaks, decision outcomes
3. Goals: hit / miss / why
4. Next-year recommendations (3–5)
DATA:\n${data}`,

    custom: `Custom report requested by user.
TOPIC: ${customTopic || '(unspecified)'}
Use DATA below. Structure the answer with clear headings.
DATA:\n${data}`,
  }

  const user = shells[type] ?? shells.custom
  const system = SYSTEM_BY_TYPE[type] ?? SYSTEM_BASE

  return { system, user }
}
