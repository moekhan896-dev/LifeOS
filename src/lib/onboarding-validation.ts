import type { OnboardingDraft } from '@/components/onboarding/onboarding-types'

/** Returns true when step can advance (all required fields satisfied). */
export function canProceedStep(
  step: number,
  draft: OnboardingDraft,
  identitySubStep: number,
  healthScheduleSubStep: number,
  businessEditIndex: number
): boolean {
  return validateStep(step, draft, identitySubStep, healthScheduleSubStep, businessEditIndex).ok
}

export function validateStep(
  step: number,
  draft: OnboardingDraft,
  identitySubStep: number,
  healthScheduleSubStep: number,
  businessEditIndex: number
): { ok: boolean; errors: string[] } {
  const errors: string[] = []

  const add = (key: string, cond: boolean) => {
    if (!cond) errors.push(key)
  }

  switch (step) {
    case 0:
      break
    case 1:
      if (identitySubStep === 0) add('identity.name', !!draft.identity.name.trim())
      else if (identitySubStep === 1) add('identity.location', !!draft.identity.location.trim())
      else if (identitySubStep === 2)
        add('identity.age', draft.identity.age !== '' && Number(draft.identity.age) >= 18 && Number(draft.identity.age) <= 99)
      break
    case 2: {
      add('business.count', draft.businessCount >= 1 && draft.businesses.length >= 1)
      const i = Math.min(Math.max(0, businessEditIndex), draft.businesses.length - 1)
      const b = draft.businesses[i]
      if (!b) {
        errors.push('business.0.name')
        break
      }
      add(`business.${i}.name`, !!b.name.trim())
      add(`business.${i}.type`, !!b.type.trim())
      add(`business.${i}.status`, !!b.status.trim())
      add(`business.${i}.revenue`, typeof b.monthlyRevenue === 'number' && b.monthlyRevenue >= 0)
      add(`business.${i}.role`, !!b.role.trim())
      add(`business.${i}.color`, !!b.color.trim())
      break
    }
    case 3:
      break
    case 4: {
      const f = draft.finance
      add('finance.plaidIntent', f.plaidIntent === 'connect' || f.plaidIntent === 'manual' || f.plaidIntent === 'later')
      add('finance.housing', f.housingFree || (typeof f.housing === 'number' && f.housing >= 0))
      add('finance.savingsRange', !!f.savingsRange.trim())
      break
    }
    case 5: {
      const g = draft.goals
      add('goals.incomeTarget', g.incomeTarget >= 5000)
      add('goals.targetYearMonth', !!g.targetYearMonth.trim())
      add('goals.exitIntent', g.exitIntent === 'yes' || g.exitIntent === 'maybe' || g.exitIntent === 'no')
      if (g.northStarMetric === 'Something else') add('goals.northStarCustom', !!g.northStarCustom?.trim())
      break
    }
    case 6: {
      const h = draft.health
      const sch = draft.schedule
      if (healthScheduleSubStep === 0) {
        add('health.targetWake', !!h.targetWake.trim())
        add('health.actualWake', !!h.actualWake.trim())
      } else if (healthScheduleSubStep === 1) {
        add('schedule.workStart', !!sch.workStart.trim())
        add('schedule.workEnd', !!sch.workEnd.trim())
      }
      break
    }
    case 7:
      add('faith.level', !!draft.faith.level)
      break
    case 8:
      break
    case 9:
      add('ai.communicationStyle', !!draft.ai.communicationStyle.trim())
      break
    case 10:
      break
    case 11:
      add('pin', draft.pin.length === 4)
      break
    case 12:
      break
    default:
      break
  }

  return { ok: errors.length === 0, errors }
}
