import type { Task } from '@/stores/store'

/** PRD §9.5 / §8.7 — Ideal Self benchmark vs actual completions since last session. */
export function computeIdealSelfBenchmark(
  lastSessionDaysSinceOpen: number,
  previousLastOpenedAt: string | null,
  tasks: Task[]
) {
  if (lastSessionDaysSinceOpen < 2) return null
  const idealTasks = Math.min(Math.round(lastSessionDaysSinceOpen * 2.5), 40)
  const idealXp = idealTasks * 13
  let actualDone = 0
  let actualXp = 0
  if (previousLastOpenedAt) {
    const t0 = new Date(previousLastOpenedAt).getTime()
    const t1 = Date.now()
    for (const t of tasks) {
      if (!t.done || !t.completedAt) continue
      const ct = new Date(t.completedAt).getTime()
      if (ct >= t0 && ct <= t1) {
        actualDone += 1
        actualXp += t.xpValue
      }
    }
  }
  return {
    days: lastSessionDaysSinceOpen,
    idealTasks,
    idealXp,
    actualDone,
    actualXp,
    gapXp: Math.max(0, idealXp - actualXp),
  }
}
