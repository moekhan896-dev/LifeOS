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
  /** Step 6: 0 wake, 1 exercise+diet, 2 caffeine+smoke, 3 sliders, 4 habits+quit, 5 work schedule */
  foundationSubStep: number
  setFoundationSubStep: (n: number) => void
  /** Step 8 struggles: 0–2 */
  strugglesSubStep: number
  setStrugglesSubStep: (n: number) => void
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
      foundationSubStep: 0,
      setFoundationSubStep: (n) => set({ foundationSubStep: Math.max(0, Math.min(5, n)) }),
      strugglesSubStep: 0,
      setStrugglesSubStep: (n) => set({ strugglesSubStep: Math.max(0, Math.min(2, n)) }),
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
          ...(next !== 6 ? { foundationSubStep: 0 } : {}),
          ...(next !== 8 ? { strugglesSubStep: 0 } : {}),
        })
      },
      prevStep: () => {
        const { step, identitySubStep, foundationSubStep, strugglesSubStep } = get()
        if (step === 1 && identitySubStep > 0) {
          set({ identitySubStep: identitySubStep - 1 })
          return
        }
        if (step === 6 && foundationSubStep > 0) {
          set({ foundationSubStep: foundationSubStep - 1 })
          return
        }
        if (step === 8 && strugglesSubStep > 0) {
          set({ strugglesSubStep: strugglesSubStep - 1 })
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
          foundationSubStep: 0,
          strugglesSubStep: 0,
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
        if (typeof base.foundationSubStep !== 'number') {
          const legacy = (base as { healthScheduleSubStep?: number }).healthScheduleSubStep
          if (legacy === 1) base.foundationSubStep = 5
          else if (legacy === 2) base.foundationSubStep = 4
          else base.foundationSubStep = 0
        }
        if (typeof base.strugglesSubStep !== 'number') base.strugglesSubStep = 0
        if (!Array.isArray(base.validationErrors)) base.validationErrors = []
        const fd = base.draft as { faith?: { level?: string } }
        if (fd.faith && (fd.faith.level === undefined || fd.faith.level === null)) {
          fd.faith.level = ''
        }
        return base
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Onboarding draft hydration failed:', error)
          try {
            localStorage.removeItem('art-os-onboarding-draft')
          } catch {
            /* ignore */
          }
          if (typeof window !== 'undefined') window.location.reload()
          return
        }
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
