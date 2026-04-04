import { useStore } from '@/stores/store'

/** Calendar week anchor: local Sunday YYYY-MM-DD for the week containing `d` (Mon–Sat → previous Sunday). */
export function getLocalSundayKey(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = x.getDay()
  x.setDate(x.getDate() - day)
  return x.toISOString().split('T')[0]
}

function getCycleWeek(start: string) {
  const diff = Date.now() - new Date(start).getTime()
  return Math.max(1, Math.min(12, Math.ceil(diff / (7 * 86400000))))
}

/**
 * PRD Batch 2 — one AI scorecard per calendar week (week anchored on local Sunday).
 * Runs on **first authenticated app load after that Sunday** if not already generated
 * (so opening Mon–Sat still fills last Sunday’s week — not lost if they skipped Sunday).
 */
export async function runWeeklyAiScorecardIfDue() {
  const s = useStore.getState()
  if (!s.anthropicKey?.trim()) return

  const weekKey = getLocalSundayKey(new Date())
  if (s.lastWeeklyScorecardWeekKey === weekKey) return

  const activeGoals = s.goals.filter((g) => new Date(g.cycleEnd) >= new Date())
  if (activeGoals.length === 0) return

  const cycleStart = activeGoals[0].cycleStart
  const weekNum = getCycleWeek(cycleStart)
  const weekIndex = weekNum - 1

  const goalsPayload = activeGoals.map((g) => ({
    id: g.id,
    title: g.title,
    targetMetric: g.targetMetric,
    currentValue: g.currentValue,
    targetValue: g.targetValue,
  }))

  const tasksPayload = s.tasks.slice(-100).map((t) => ({
    id: t.id,
    text: t.text,
    done: t.done,
    priority: t.priority,
    projectId: t.projectId,
    createdAt: t.createdAt,
    completedAt: t.completedAt,
  }))

  const res = await fetch('/api/goals/weekly-scorecard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      goalsPayload,
      tasksPayload,
      apiKey: s.anthropicKey,
    }),
  })
  if (!res.ok) return

  const data = (await res.json()) as {
    grades?: { goalId: string; grade: string; feedback: string }[]
    rate?: number
  }

  s.applyWeeklyScorecard(weekIndex, {
    rate: typeof data.rate === 'number' ? data.rate : 0,
    aiByGoal: data.grades,
    weekKey,
    generatedAt: new Date().toISOString(),
  })
}
