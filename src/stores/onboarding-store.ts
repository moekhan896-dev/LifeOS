import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  createInitialDraft,
  type OnboardingDraft,
} from '@/components/onboarding/onboarding-types'

export const ONBOARDING_STEPS = [
  'welcome',
  'identity',
  'businesses',
  'clients',
  'finances',
  'goals',
  'health',
  'faith',
  'struggles',
  'ai',
  'tools',
  'security',
  'review',
] as const

export type OnboardingStepId = (typeof ONBOARDING_STEPS)[number]

interface OnboardingWizardState {
  step: number
  /** Sub-step for conversational identity flow (step 1): 0–3 */
  identitySubStep: number
  setIdentitySubStep: (n: number) => void
  /** Which business card is being edited (step 2) */
  businessEditIndex: number
  setBusinessEditIndex: (n: number) => void
  /** Step 6: 0 = wake times, 1 = work hours, 2 = optional health + schedule */
  healthScheduleSubStep: number
  setHealthScheduleSubStep: (n: number) => void
  /** Inline validation keys (empty = none) */
  validationErrors: string[]
  setValidationErrors: (keys: string[]) => void
  clearValidationErrors: () => void
  draft: OnboardingDraft
  setStep: (n: number) => void
  nextStep: () => void
  prevStep: () => void
  setDraft: (partial: Partial<OnboardingDraft>) => void
  patchDraft: (fn: (d: OnboardingDraft) => OnboardingDraft) => void
  replaceDraft: (draft: OnboardingDraft) => void
  resetWizard: () => void
}

export const useOnboardingStore = create<OnboardingWizardState>()(
  persist(
    (set, get) => ({
      step: 0,
      identitySubStep: 0,
      setIdentitySubStep: (n) => set({ identitySubStep: Math.max(0, Math.min(3, n)) }),
      businessEditIndex: 0,
      setBusinessEditIndex: (n) => set({ businessEditIndex: Math.max(0, n) }),
      healthScheduleSubStep: 0,
      setHealthScheduleSubStep: (n) => set({ healthScheduleSubStep: Math.max(0, Math.min(2, n)) }),
      validationErrors: [],
      setValidationErrors: (keys) => set({ validationErrors: keys }),
      clearValidationErrors: () => set({ validationErrors: [] }),
      draft: createInitialDraft(),
      setStep: (n) => set({ step: Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, n)) }),
      nextStep: () => {
        const { step } = get()
        const next = Math.min(ONBOARDING_STEPS.length - 1, step + 1)
        set({
          step: next,
          ...(step === 1 && next !== 1 ? { identitySubStep: 0 } : {}),
          ...(next !== 6 ? { healthScheduleSubStep: 0 } : {}),
        })
      },
      prevStep: () => {
        const { step, identitySubStep } = get()
        if (step === 1 && identitySubStep > 0) {
          set({ identitySubStep: identitySubStep - 1 })
          return
        }
        set({ step: Math.max(0, step - 1) })
      },
      setDraft: (partial) =>
        set((s) => ({
          draft: { ...s.draft, ...partial } as OnboardingDraft,
        })),
      patchDraft: (fn) => set((s) => ({ draft: fn(s.draft) })),
      replaceDraft: (draft) => set({ draft }),
      resetWizard: () =>
        set({
          step: 0,
          identitySubStep: 0,
          businessEditIndex: 0,
          healthScheduleSubStep: 0,
          validationErrors: [],
          draft: createInitialDraft(),
        }),
    }),
    {
      name: 'art-os-onboarding-draft',
      merge: (persisted, current) => {
        const p = persisted as Partial<OnboardingWizardState> | undefined
        const base = { ...current, ...p } as OnboardingWizardState
        if (typeof base.businessEditIndex !== 'number') base.businessEditIndex = 0
        if (typeof base.healthScheduleSubStep !== 'number') base.healthScheduleSubStep = 0
        if (!Array.isArray(base.validationErrors)) base.validationErrors = []
        return base
      },
      onRehydrateStorage: () => (state) => {
        if (!state?.draft) return
        const d = state.draft as unknown as Record<string, unknown>
        if (!d.schedule) {
          d.schedule = {
            workStart: '',
            workEnd: '',
            deepFocus: '',
            focusDuration: '',
            commitments: [] as { id: string; title: string; time: string; durationMin: number; days: string[] }[],
          }
        }
      },
    }
  )
)
