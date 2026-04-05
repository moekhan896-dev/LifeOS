import type { Task } from '@/stores/store'

export interface CostOfInactionGap17Input {
  tasks: Task[]
  wakeUpTime: string | undefined
  /** Hours, e.g. 9–19 → 10h. Default 10. */
  workingHoursPerDay: number
  now: Date
}

/**
 * PRD GAP 17 — incomplete crit/high tasks with dollarValue set.
 * dailyValue = dollarValue/30; cost = Σ(dailyValue × hoursElapsed / workingHoursPerDay).
 */
export function computeCostOfInactionGap17(input: CostOfInactionGap17Input): {
  items: { taskId: string; label: string; dailyValue: number; taskCostNow: number }[]
  totalCostNow: number
  /** Σ(dollarValue/30) for qualifying tasks — used for per-second ticker */
  totalDailyValue: number
} {
  const { tasks, wakeUpTime, workingHoursPerDay, now } = input
  const wh = workingHoursPerDay > 0 ? workingHoursPerDay : 10

  const wakeH = wakeUpTime ? parseInt(wakeUpTime.split(':')[0] ?? '8', 10) : 8
  const wakeM = wakeUpTime ? parseInt(wakeUpTime.split(':')[1] ?? '0', 10) : 0
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const wakeToday = new Date(startOfToday)
  wakeToday.setHours(wakeH, wakeM, 0, 0)

  let hoursElapsed = (now.getTime() - wakeToday.getTime()) / 3600000
  if (hoursElapsed < 0) hoursElapsed = 0
  if (hoursElapsed > wh) hoursElapsed = wh

  const qual = tasks.filter(
    (t) => !t.done && t.dollarValue != null && t.dollarValue > 0 && (t.priority === 'crit' || t.priority === 'high')
  )

  const items: { taskId: string; label: string; dailyValue: number; taskCostNow: number }[] = []
  let totalDailyValue = 0
  let totalCostNow = 0

  for (const t of qual) {
    const dv = t.dollarValue!
    const dailyValue = dv / 30
    totalDailyValue += dailyValue
    const taskCostNow = dailyValue * (hoursElapsed / wh)
    totalCostNow += taskCostNow
    items.push({
      taskId: t.id,
      label: t.text.slice(0, 48),
      dailyValue,
      taskCostNow,
    })
  }

  return {
    items,
    totalCostNow,
    totalDailyValue,
  }
}
