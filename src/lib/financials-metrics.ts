import type { Business, Client, DailyNetSnapshot, ExpenseEntry } from '@/stores/store'
import { getClientNet } from '@/stores/store'

/** Parse rough monthly $ from free-text compensation (best-effort). */
export function parseMonthlyDollars(text: string): number {
  if (!text?.trim()) return 0
  const cleaned = text.replace(/,/g, '')
  const m = cleaned.match(/(\d+(\.\d+)?)/)
  if (!m) return 0
  const n = parseFloat(m[1])
  if (!Number.isFinite(n)) return 0
  if (/year|annual|yr/i.test(text)) return n / 12
  if (/week|wk/i.test(text)) return n * 4.33
  if (/hour|hr/i.test(text)) return n * 160
  return n
}

export function sumTeamCompensation(businesses: Business[]): number {
  return businesses.reduce((sum, b) => {
    const team = b.teamMembers ?? []
    return sum + team.reduce((s, m) => s + parseMonthlyDollars(m.compensation || ''), 0)
  }, 0)
}

/** Rough tools budget: first $ amount found in string, else 0. */
export function parseToolsMonthly(tools: string | undefined): number {
  if (!tools?.trim()) return 0
  const m = tools.match(/\$?\s*([\d,]+)\s*\/?\s*mo/i) || tools.match(/\$?\s*([\d,]+)/)
  if (!m) return 0
  return parseFloat(m[1].replace(/,/g, '')) || 0
}

export function grossRevenue(businesses: Business[]): number {
  return businesses.reduce((s, b) => s + (b.monthlyRevenue || 0), 0)
}

export function totalAdSpend(clients: Client[]): number {
  return clients.filter((c) => c.active).reduce((s, c) => s + c.adSpend, 0)
}

export function businessCosts(businesses: Business[], clients: Client[]): number {
  return totalAdSpend(clients) + sumTeamCompensation(businesses) + businesses.reduce((s, b) => s + parseToolsMonthly(b.tools), 0)
}

export function processingFeesGross(gross: number): number {
  return Math.round(gross * 0.03 * 100) / 100
}

export function netRevenue(gross: number, costs: number, fees: number): number {
  return gross - costs - fees
}

export function personalExpensesRecurring(expenseEntries: ExpenseEntry[]): number {
  return expenseEntries.filter((e) => e.recurring).reduce((s, e) => s + e.amount, 0)
}

export function takeHome(netRev: number, personal: number): number {
  return netRev - personal
}

export interface MonthlyNetFromSnapshots {
  monthKey: string
  sum: number
}

/** YYYY-MM from ISO date */
export function monthKeyFromDate(isoDate: string): string {
  return isoDate.slice(0, 7)
}

export function sumSnapshotsByMonth(snapshots: DailyNetSnapshot[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const s of snapshots) {
    const k = monthKeyFromDate(s.date)
    m.set(k, (m.get(k) ?? 0) + s.net)
  }
  return m
}

export function currentAndPreviousMonthKeys(): { current: string; previous: string } {
  const d = new Date()
  const cur = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  const prevD = new Date(d.getFullYear(), d.getMonth() - 1, 1)
  const prev = `${prevD.getFullYear()}-${String(prevD.getMonth() + 1).padStart(2, '0')}`
  return { current: cur, previous: prev }
}

/** Scale this-month P&L line estimates to last month using net snapshot ratio when available. */
export function lastMonthScaled(
  thisMonthLine: number,
  thisMonthTakeHome: number,
  lastMonthTakeHome: number | null
): number | null {
  if (lastMonthTakeHome === null) return null
  if (thisMonthTakeHome <= 0) return lastMonthTakeHome > 0 ? 0 : null
  return Math.round((thisMonthLine * (lastMonthTakeHome / thisMonthTakeHome)) * 100) / 100
}

export interface BusinessNetBar {
  id: string
  name: string
  color: string
  gross: number
  deductions: number
  net: number
}

/**
 * Per-business net after team/tools; client path uses getClientNet (ad + 3% already deducted), then subtract shared costs.
 */
export function netRevenueByBusiness(businesses: Business[], clients: Client[]): BusinessNetBar[] {
  return businesses.map((b) => {
    const bizClients = clients.filter((c) => c.businessId === b.id && c.active)
    const clientNetSum = bizClients.reduce((s, c) => s + getClientNet(c), 0)
    const grossMonthly = bizClients.length > 0 ? bizClients.reduce((s, c) => s + c.grossMonthly, 0) : b.monthlyRevenue || 0
    const team = (b.teamMembers ?? []).reduce((s, m) => s + parseMonthlyDollars(m.compensation || ''), 0)
    const tools = parseToolsMonthly(b.tools)
    const proc = processingFeesGross(grossMonthly)
    let net: number
    if (clientNetSum > 0) {
      net = Math.round((clientNetSum - team - tools) * 100) / 100
    } else {
      const base = b.monthlyRevenue || 0
      net = Math.round((base - team - tools - proc) * 100) / 100
    }
    const deductions = Math.max(0, grossMonthly - net)
    return {
      id: b.id,
      name: b.name,
      color: b.color || '#0A84FF',
      gross: grossMonthly,
      deductions,
      net,
    }
  })
}

export interface ConcentrationRow {
  client: Client
  business: Business
  clientNet: number
  pctOfTotal: number
}

export function clientConcentrationWarnings(
  businesses: Business[],
  clients: Client[],
  thresholdPct = 30
): ConcentrationRow[] {
  const totalNet = clients.filter((c) => c.active).reduce((s, c) => s + getClientNet(c), 0)
  if (totalNet <= 0) return []
  const out: ConcentrationRow[] = []
  for (const c of clients) {
    if (!c.active) continue
    const net = getClientNet(c)
    const pct = (net / totalNet) * 100
    if (pct > thresholdPct) {
      const business = businesses.find((b) => b.id === c.businessId)
      if (business) out.push({ client: c, business, clientNet: net, pctOfTotal: pct })
    }
  }
  return out.sort((a, b) => b.pctOfTotal - a.pctOfTotal)
}

export function last12MonthKeys(): string[] {
  const out: string[] = []
  const d = new Date()
  for (let i = 11; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1)
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`)
  }
  return out
}

export function estimatedMonthlyWorkingHours(workDayStart: string, workDayEnd: string): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map((x) => parseInt(x, 10))
    if (Number.isNaN(h)) return 0
    return h * 60 + (Number.isNaN(m) ? 0 : m)
  }
  if (!workDayStart || !workDayEnd) return 160
  const a = toMin(workDayStart)
  const b = toMin(workDayEnd)
  const hrs = Math.max(0, (b - a) / 60)
  if (hrs <= 0) return 160
  return Math.round(hrs * 22 * 10) / 10
}
