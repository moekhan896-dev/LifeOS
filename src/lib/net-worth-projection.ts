/**
 * PRD §9.15 / §12.2 — net worth trajectory to age 65 (monthly compounding).
 */

const MONTHS_PER_YEAR = 12
const DEFAULT_ANNUAL_RETURN = 0.05
/** Assumed lift when following AI income recommendations */
export const OPTIMIZED_MONTHLY_INCOME_MULTIPLIER = 1.12

export function projectNetWorthSeries(input: {
  currentNetWorth: number
  currentAge: number
  retireAge?: number
  monthlyContribution: number
  annualReturn?: number
  /** Multiply monthly contribution for "optimized" line */
  optimizedContributionMultiplier?: number
}): {
  ages: number[]
  currentPath: number[]
  optimizedPath: number[]
} {
  const retireAge = input.retireAge ?? 65
  const r = (input.annualReturn ?? DEFAULT_ANNUAL_RETURN) / MONTHS_PER_YEAR
  const years = Math.max(0, retireAge - input.currentAge)
  const optMul = input.optimizedContributionMultiplier ?? OPTIMIZED_MONTHLY_INCOME_MULTIPLIER

  const currentPath: number[] = []
  const optimizedPath: number[] = []
  const ages: number[] = []

  let balC = input.currentNetWorth
  let balO = input.currentNetWorth
  const pmtC = Math.max(0, input.monthlyContribution)
  const pmtO = pmtC * optMul

  for (let y = 0; y <= years; y++) {
    ages.push(input.currentAge + y)
    currentPath.push(Math.round(balC))
    optimizedPath.push(Math.round(balO))
    for (let m = 0; m < MONTHS_PER_YEAR; m++) {
      balC = balC * (1 + r) + pmtC
      balO = balO * (1 + r) + pmtO
    }
  }

  return { ages, currentPath, optimizedPath }
}

/** Required monthly contribution to reach target NW at targetAge from current age & balance. */
export function requiredMonthlyForTarget(input: {
  currentNetWorth: number
  currentAge: number
  targetAge: number
  targetNetWorth: number
  annualReturn?: number
}): number {
  const r = (input.annualReturn ?? DEFAULT_ANNUAL_RETURN) / MONTHS_PER_YEAR
  const months = Math.max(1, (input.targetAge - input.currentAge) * MONTHS_PER_YEAR)
  const fv = input.targetNetWorth
  const pv = input.currentNetWorth
  const growth = Math.pow(1 + r, months)
  const fvFromPv = pv * growth
  if (fv <= fvFromPv) return 0
  const need = fv - fvFromPv
  if (r < 1e-9) return need / months
  return (need * r) / (growth - 1)
}
