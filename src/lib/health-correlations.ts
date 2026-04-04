/**
 * PRD GAP 30 — health ↔ business correlations (14+ days, min 5/5 split).
 */

import type { HealthLog, Task } from '@/stores/store'

export interface CorrelationLine {
  id: string
  text: string
}

const MIN_DAYS = 14
const MIN_EACH = 5

function dayTaskScore(tasks: Task[], day: string): number {
  const done = tasks.filter((t) => t.done && t.completedAt?.startsWith(day)).length
  const denom = Math.max(1, tasks.filter((t) => t.createdAt.split('T')[0] <= day).length)
  return Math.min(100, (done / denom) * 100)
}

export function computeHealthBusinessCorrelations(input: {
  healthHistory: HealthLog[]
  tasks: Task[]
}): { ready: boolean; lines: CorrelationLine[] } {
  const byDate = new Map<string, HealthLog>()
  for (const h of input.healthHistory) {
    if (h.date) byDate.set(h.date, h)
  }
  const uniqueDays = [...byDate.keys()].sort((a, b) => a.localeCompare(b))

  if (uniqueDays.length < MIN_DAYS) {
    return {
      ready: false,
      lines: [{ id: 'need-data', text: 'I need more data to identify patterns. Keep logging.' }],
    }
  }

  const lines: CorrelationLine[] = []

  // Gym vs task completion
  const gymDays = uniqueDays.filter((d) => byDate.get(d)?.gym === true)
  const noGymDays = uniqueDays.filter((d) => byDate.get(d)?.gym === false)
  if (gymDays.length >= MIN_EACH && noGymDays.length >= MIN_EACH) {
    const avgGym = gymDays.reduce((s, d) => s + dayTaskScore(input.tasks, d), 0) / gymDays.length
    const avgNo = noGymDays.reduce((s, d) => s + dayTaskScore(input.tasks, d), 0) / noGymDays.length
    const diff = avgGym - avgNo
    if (Math.abs(diff) > 0.5) {
      lines.push({
        id: 'gym-tasks',
        text: `On gym days, your task completion is ${Math.abs(diff).toFixed(0)}% ${diff >= 0 ? 'higher' : 'lower'} on average than on non-gym days.`,
      })
    }
  }

  // Prayer (5/5) vs daily score
  const fullPrayer = uniqueDays.filter((d) => {
    const h = byDate.get(d)
    return h && Object.values(h.prayers).filter(Boolean).length >= 5
  })
  const partialPrayer = uniqueDays.filter((d) => {
    const h = byDate.get(d)
    return h && Object.values(h.prayers).filter(Boolean).length > 0 && Object.values(h.prayers).filter(Boolean).length < 5
  })
  if (fullPrayer.length >= MIN_EACH && partialPrayer.length >= MIN_EACH) {
    const avgFull = fullPrayer.reduce((s, d) => s + (byDate.get(d)?.dailyScore ?? 0), 0) / fullPrayer.length
    const avgPart = partialPrayer.reduce((s, d) => s + (byDate.get(d)?.dailyScore ?? 0), 0) / partialPrayer.length
    const diff = avgFull - avgPart
    if (Math.abs(diff) > 1) {
      lines.push({
        id: 'prayer-score',
        text: `When you complete all prayers, your daily score averages ${Math.round(avgFull)} vs ${Math.round(avgPart)} on partial-prayer days (${Math.abs(diff).toFixed(0)} points ${diff >= 0 ? 'higher' : 'lower'}).`,
      })
    }
  }

  // Sleep (logged) vs next calendar day score
  const sleepNext: { hour: number; score: number }[] = []
  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const d = uniqueDays[i]
    const nd = uniqueDays[i + 1]
    const h = byDate.get(d)
    const next = byDate.get(nd)
    if (h?.sleepTime && next && typeof next.dailyScore === 'number') {
      const [sh] = h.sleepTime.split(':').map(Number)
      sleepNext.push({ hour: sh, score: next.dailyScore })
    }
  }
  if (sleepNext.length >= MIN_DAYS) {
    const early = sleepNext.filter((x) => x.hour < 22)
    const late = sleepNext.filter((x) => x.hour >= 23 || x.hour < 4)
    if (early.length >= MIN_EACH && late.length >= MIN_EACH) {
      const avgE = early.reduce((s, x) => s + x.score, 0) / early.length
      const avgL = late.reduce((s, x) => s + x.score, 0) / late.length
      const diff = avgE - avgL
      if (Math.abs(diff) > 1) {
        lines.push({
          id: 'sleep-score',
          text: `Earlier sleep logs pair with a higher next-day score on average (${Math.round(avgE)} vs ${Math.round(avgL)}, ${Math.abs(diff).toFixed(0)} pts).`,
        })
      }
    }
  }

  // Screen time vs same-day score
  const withScreen = [...byDate.values()].filter((h) => typeof h.screenTimeHours === 'number')
  const low = withScreen.filter((h) => h.screenTimeHours <= 4)
  const high = withScreen.filter((h) => h.screenTimeHours > 8)
  if (low.length >= MIN_EACH && high.length >= MIN_EACH) {
    const avgLo = low.reduce((s, h) => s + h.dailyScore, 0) / low.length
    const avgHi = high.reduce((s, h) => s + h.dailyScore, 0) / high.length
    const diff = avgLo - avgHi
    lines.push({
      id: 'screen-score',
      text: `On days with screen time ≤4h, your daily score averages ${Math.round(avgLo)} vs ${Math.round(avgHi)} on days over 8h (${Math.abs(diff).toFixed(0)} points ${diff >= 0 ? 'higher' : 'lower'}).`,
    })
  }

  if (lines.length === 0) {
    return {
      ready: false,
      lines: [{ id: 'need-data', text: 'I need more data to identify patterns. Keep logging.' }],
    }
  }

  return { ready: true, lines }
}
