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
      draft: createInitialDraft(),
      setStep: (n) => set({ step: Math.max(0, Math.min(ONBOARDING_STEPS.length - 1, n)) }),
      nextStep: () => {
        const { step } = get()
        const next = Math.min(ONBOARDING_STEPS.length - 1, step + 1)
        set({
          step: next,
          ...(step === 1 && next !== 1 ? { identitySubStep: 0 } : {}),
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
      resetWizard: () => set({ step: 0, identitySubStep: 0, draft: createInitialDraft() }),
    }),
    {
      name: 'art-os-onboarding-draft',
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
