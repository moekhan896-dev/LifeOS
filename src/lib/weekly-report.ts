import { useStore } from '@/stores/store'
import { getLocalSundayKey } from '@/lib/weekly-scorecard'

/**
 * PRD §22 — weekly report auto-generates on first app load after Sunday (same week key pattern as scorecard).
 */
export async function runWeeklyReportIfDue() {
  const s = useStore.getState()
  const weekKey = getLocalSundayKey(new Date())
  if (s.lastWeeklyReportWeekKey === weekKey) return

  const context = JSON.stringify({
    weekKey,
    generatedAt: new Date().toISOString(),
    businesses: s.businesses.map((b) => ({
      name: b.name,
      monthlyRevenue: b.monthlyRevenue,
      status: b.status,
    })),
    clientsActive: s.clients.filter((c) => c.active).length,
    tasksOpen: s.tasks.filter((t) => !t.done).length,
    tasksDoneWeek: s.tasks.filter(
      (t) => t.done && t.completedAt && Date.now() - new Date(t.completedAt).getTime() < 7 * 86400000
    ).length,
    goals: s.goals.map((g) => ({
      title: g.title,
      current: g.currentValue,
      target: g.targetValue,
    })),
    executionSnapshot: {
      streaks: s.streaks.map((x) => ({ habit: x.habit, current: x.currentStreak })),
    },
  })

  try {
    const res = await fetch('/api/reports/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportType: 'weekly',
        context,
        apiKey: s.anthropicKey || undefined,
      }),
    })
    if (!res.ok) return
    const data = (await res.json()) as { content?: string; grade?: string }
    const content = data.content || ''
    if (!content.trim()) return
    s.addAiReport({
      level: 'weekly',
      content,
      date: new Date().toISOString().split('T')[0],
      grade: data.grade,
    })
    s.setLastWeeklyReportWeekKey(weekKey)
  } catch {
    /* offline */
  }
}
