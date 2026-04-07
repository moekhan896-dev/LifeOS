import type { OnboardingDraft } from '@/components/onboarding/onboarding-types'

/** Returns true when step can advance (all required fields satisfied). */
export function canProceedStep(
  step: number,
  draft: OnboardingDraft,
  identitySubStep: number,
  foundationSubStep: number,
  businessEditIndex: number,
  strugglesSubStep: number
): boolean {
  return validateStep(step, draft, identitySubStep, foundationSubStep, businessEditIndex, strugglesSubStep).ok
}

export function validateStep(
  step: number,
  draft: OnboardingDraft,
  identitySubStep: number,
  foundationSubStep: number,
  businessEditIndex: number,
  strugglesSubStep: number
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
      if (b.hasTeam) {
        const hasNamedMember = (b.team ?? []).some((m) => m.name.trim().length > 0)
        add(`business.${i}.team`, hasNamedMember)
      }
      break
    }
    case 3: {
      for (let bi = 0; bi < draft.businesses.length; bi++) {
        const b = draft.businesses[bi]
        if (!b.recurringClients) continue
        const clients = b.clients ?? []
        const hasValid = clients.some(
          (c) =>
            c.name.trim().length > 0 &&
            typeof c.monthlyPayment === 'number' &&
            c.monthlyPayment > 0
        )
        add(`business.${bi}.recurringClient`, hasValid)
      }
      break
    }
    case 4: {
      const f = draft.finance
      add('finance.plaidIntent', f.plaidIntent === 'connect' || f.plaidIntent === 'manual' || f.plaidIntent === 'later')
      add('finance.housing', f.housingFree === true || (typeof f.housing === 'number' && f.housing > 0))
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
      if (foundationSubStep === 0) {
        add('health.targetWake', !!h.targetWake.trim())
        add('health.actualWake', !!h.actualWake.trim())
      } else if (foundationSubStep === 1) {
        add('health.exercise', !!h.exercise.trim())
        add('health.dietQuality', !!h.dietQuality.trim())
      } else if (foundationSubStep === 2) {
        add('health.caffeine', !!h.caffeine.trim())
        add('health.smoking', !!h.smoking.trim())
      } else if (foundationSubStep === 3) {
        add('health.screenTimeHours', typeof h.screenTimeHours === 'number' && h.screenTimeHours >= 0)
        add('health.energy', typeof h.energy === 'number')
        add('health.stress', typeof h.stress === 'number')
      } else if (foundationSubStep === 4) {
        /* habits optional */
      } else if (foundationSubStep === 5) {
        add('schedule.workStart', !!sch.workStart.trim())
        add('schedule.workEnd', !!sch.workEnd.trim())
      }
      break
    }
    case 7:
      add(
        'faith.level',
        ['central', 'sometimes', 'spiritual', 'no', 'prefer_not'].includes(String(draft.faith.level))
      )
      if (
        draft.faith.tradition === 'Islam' &&
        (draft.faith.islamPrayerTracking === 'build' || draft.faith.islamPrayerTracking === 'consistent')
      ) {
        add('faith.prayerConsistency', !!draft.faith.prayerConsistency.trim())
      }
      break
    case 8:
      if (strugglesSubStep === 0) {
        add('struggles.procrastination', !!draft.struggles.procrastinationPattern.trim())
        add('struggles.patterns', !!draft.struggles.behaviorPatterns.trim())
      } else if (strugglesSubStep === 1) {
        add('struggles.distraction', !!draft.struggles.biggestDistraction.trim())
      }
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
