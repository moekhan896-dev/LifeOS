/** Rough US combined life expectancy remaining (years) by age — illustrative actuarial baseline. */
function baselineYearsRemaining(age: number): number {
  if (age < 18) return Math.max(55, 78 - age)
  const anchors: [number, number][] = [
    [18, 59],
    [25, 52.5],
    [35, 43.2],
    [45, 33.8],
    [55, 25.1],
    [65, 17.3],
    [75, 11.2],
    [85, 6.2],
    [95, 3],
  ]
  if (age <= anchors[0][0]) return anchors[0][1]
  if (age >= anchors[anchors.length - 1][0]) return Math.max(0.5, anchors[anchors.length - 1][1] - (age - 95) * 0.35)
  for (let i = 0; i < anchors.length - 1; i++) {
    const [a0, r0] = anchors[i]
    const [a1, r1] = anchors[i + 1]
    if (age >= a0 && age <= a1) {
      const t = (age - a0) / (a1 - a0)
      return r0 + t * (r1 - r0)
    }
  }
  return 10
}

export type LifeAdjustment = { label: string; years: number }

export type LifeExpectancyInput = {
  age: number
  exercise: string
  smokingStatus: string
  dietQuality: string
  stressLevel: number
  phoneScreenTime: number
}

export function computeLifeExpectancy(
  input: LifeExpectancyInput,
  /** Freeze "now" when snapshotting so countdown can drift from a fixed expected end. */
  anchorNow: number = Date.now()
): {
  baselineYearsRemaining: number
  adjustments: LifeAdjustment[]
  adjustedYearsRemaining: number
  expectedEnd: Date
} {
  const { age, exercise, smokingStatus, dietQuality, stressLevel, phoneScreenTime } = input
  let base = baselineYearsRemaining(age)
  const adj: LifeAdjustment[] = []

  const ex = exercise.toLowerCase()
  if (ex.includes('daily') || ex.includes('every day') || ex.includes('6+')) {
    adj.push({ label: 'Regular exercise', years: 2.2 })
  } else if (ex.includes('4') || ex.includes('3–5') || ex.includes('3-5') || ex.includes('3 to 5')) {
    adj.push({ label: 'Moderate exercise', years: 1.2 })
  } else if (ex.includes('1') || ex.includes('2') || ex.includes('light')) {
    adj.push({ label: 'Light exercise', years: 0.4 })
  } else if (ex.trim() && (ex.includes('none') || ex.includes('no ') || ex === 'no')) {
    adj.push({ label: 'Low activity', years: -1.5 })
  }

  const sm = smokingStatus.toLowerCase()
  if (sm.includes('current') || sm.includes('daily') || sm.includes('yes')) {
    adj.push({ label: 'Smoking', years: -8 })
  } else if (sm.includes('former') || sm.includes('quit')) {
    adj.push({ label: 'Former smoker', years: -2.5 })
  }

  const diet = dietQuality.toLowerCase()
  if (diet.includes('good') || diet.includes('clean') || diet.includes('high')) {
    adj.push({ label: 'Diet quality', years: 1 })
  } else if (diet.includes('bad') || diet.includes('poor') || diet.includes('junk')) {
    adj.push({ label: 'Diet quality', years: -1.2 })
  }

  if (stressLevel >= 8) adj.push({ label: 'High stress', years: -0.8 })
  else if (stressLevel <= 3) adj.push({ label: 'Lower stress profile', years: 0.5 })

  if (phoneScreenTime >= 8) adj.push({ label: 'High screen time', years: -0.4 })

  const delta = adj.reduce((s, x) => s + x.years, 0)
  const adjusted = Math.max(0.25, base + delta)
  const ms = adjusted * 365.25 * 24 * 3600 * 1000
  const expectedEnd = new Date(anchorNow + ms)

  return {
    baselineYearsRemaining: base,
    adjustments: adj,
    adjustedYearsRemaining: adjusted,
    expectedEnd,
  }
}

export function formatDurationParts(totalSeconds: number): {
  years: number
  days: number
  hours: number
  minutes: number
  seconds: number
} {
  const sec = Math.max(0, Math.floor(totalSeconds))
  const years = Math.floor(sec / (365.25 * 24 * 3600))
  let rest = sec - years * (365.25 * 24 * 3600)
  const days = Math.floor(rest / (24 * 3600))
  rest -= days * 24 * 3600
  const hours = Math.floor(rest / 3600)
  rest -= hours * 3600
  const minutes = Math.floor(rest / 60)
  const seconds = rest - minutes * 60
  return { years, days, hours, minutes, seconds }
}
