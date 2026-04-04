import {
  computeMonthlyMoneySnapshot,
  useStore,
  type Business,
  type Client,
  type ExpenseEntry,
  type TaskValueCategory,
} from '@/stores/store'

type EstimateResult = {
  category: string
  dollarValue: number
  reasoning: string
}

/** Build compact strings for estimate API from live store snapshot. */
export function buildTaskEstimateContext(state: {
  businesses: Business[]
  clients: Client[]
  expenseEntries: ExpenseEntry[]
}): {
  businessSummary: string
  clientsSummary: string
  monthlyNetHint: number
} {
  const { net } = computeMonthlyMoneySnapshot({
    businesses: state.businesses,
    clients: state.clients,
    expenseEntries: state.expenseEntries,
  })

  const businessSummary = state.businesses
    .map(
      (b) =>
        `${b.name}: type=${b.type}, status=${b.status}, MRR~${b.monthlyRevenue}, model=${b.revenueModel ?? 'n/a'}`
    )
    .join('\n')

  const clientsSummary = state.clients
    .filter((c) => c.active)
    .map((c) => `${c.name} (${c.serviceType}, gross ${c.grossMonthly}/mo)`)
    .join('\n')

  return { businessSummary, clientsSummary, monthlyNetHint: net }
}

export function mapEstimateCategory(raw: string): TaskValueCategory {
  const m: Record<string, TaskValueCategory> = {
    direct_revenue: 'direct_revenue',
    revenue_generating: 'revenue_generating',
    infrastructure: 'infrastructure',
    health_correlation: 'health_correlation',
  }
  return m[raw] ?? 'infrastructure'
}

export async function fetchTaskDollarEstimate(args: {
  taskText: string
  apiKey: string | undefined
  context: ReturnType<typeof buildTaskEstimateContext>
}): Promise<EstimateResult | null> {
  if (!args.apiKey?.trim()) return null

  const res = await fetch('/api/tasks/estimate-value', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskText: args.taskText,
      businessSummary: args.context.businessSummary,
      clientsSummary: args.context.clientsSummary,
      monthlyNetHint: args.context.monthlyNetHint,
      apiKey: args.apiKey,
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  if (typeof data.dollarValue !== 'number') return null
  return {
    category: String(data.category ?? 'infrastructure'),
    dollarValue: data.dollarValue,
    reasoning: String(data.reasoning ?? ''),
  }
}

/** PRD GAP 13 — after task creation, fill dollar fields when API key is present. */
export async function applyTaskDollarEstimateAfterCreate(taskId: string, taskText: string) {
  const s = useStore.getState()
  if (!s.anthropicKey?.trim()) return
  const ctx = buildTaskEstimateContext({
    businesses: s.businesses,
    clients: s.clients,
    expenseEntries: s.expenseEntries,
  })
  const est = await fetchTaskDollarEstimate({
    taskText,
    apiKey: s.anthropicKey,
    context: ctx,
  })
  if (!est || est.dollarValue <= 0) return
  s.updateTask(taskId, {
    dollarValue: est.dollarValue,
    dollarReasoning: est.reasoning,
    taskValueCategory: mapEstimateCategory(est.category),
  })
}
