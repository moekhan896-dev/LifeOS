'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/store'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { OnboardingStepBody } from './OnboardingStepBody'
import { LiveDashboardPreview } from './LiveDashboardPreview'
import { OnboardingVoiceFab } from './OnboardingVoiceFab'
import { OnboardingCategorySummary } from './OnboardingCategorySummary'
import { commitOnboardingDraft, commitProfileUpdateFromDraft } from './onboarding-commit'
import { hydrateOnboardingDraftFromMainStore } from '@/lib/hydrate-onboarding-from-store'
import { toast } from 'sonner'
import { capitalizeDisplayName } from '@/lib/display-name'
import { CATEGORY_TITLES, btnPrimary, btnSecondary, glassPanel, aiBubbleCls } from './onboarding-constants'
import { validateStep, canProceedStep } from '@/lib/onboarding-validation'
import { emptyBusinessDraft } from './onboarding-types'
import { newId } from '@/lib/id'

const PALETTE = ['#0A84FF', '#60A5FA', '#A78BFA', '#FB7185', '#FBBF24', '#06B6D4', '#D4A853', '#F472B6']

export function OnboardingWizard({ mode = 'default' as 'default' | 'profileUpdate' }) {
  const router = useRouter()
  const main = useStore()
  const {
    step,
    draft,
    identitySubStep,
    setIdentitySubStep,
    nextStep,
    prevStep,
    patchDraft,
    resetWizard,
    replaceDraft,
    businessEditIndex,
    setBusinessEditIndex,
    healthScheduleSubStep,
    setHealthScheduleSubStep,
    setValidationErrors,
    clearValidationErrors,
    setStep,
  } = useOnboardingStore()
  const [pinPhase, setPinPhase] = useState<'set' | 'confirm'>('set')
  const [pinWorking, setPinWorking] = useState(['', '', '', ''])
  const [pinErr, setPinErr] = useState('')
  const [launching, setLaunching] = useState(false)
  const launchOnceRef = useRef(false)
  const [businessInterstitial, setBusinessInterstitial] = useState<number | null>(null)
  const [resumeWelcome, setResumeWelcome] = useState(false)
  const profileHydratedRef = useRef(false)
  const [profileGate, setProfileGate] = useState(mode !== 'profileUpdate')
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
  const confirmRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  useEffect(() => {
    if (step !== 11) {
      setPinPhase('set')
      setPinWorking(['', '', '', ''])
      setPinErr('')
    }
  }, [step])

  useEffect(() => {
    clearValidationErrors()
  }, [step, identitySubStep, healthScheduleSubStep, clearValidationErrors])

  useEffect(() => {
    if (mode === 'profileUpdate') return
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem('onb-resume-shown')) return
    const { step: st, draft: d } = useOnboardingStore.getState()
    if (st > 0 && (d.identity.name.trim() || st > 1)) {
      sessionStorage.setItem('onb-resume-shown', '1')
      setResumeWelcome(true)
    }
  }, [mode])

  useEffect(() => {
    if (mode !== 'profileUpdate' || profileHydratedRef.current) return
    profileHydratedRef.current = true
    const d = hydrateOnboardingDraftFromMainStore(useStore.getState())
    replaceDraft(d)
    setIdentitySubStep(0)
    setBusinessEditIndex(0)
    setHealthScheduleSubStep(0)
    setBusinessInterstitial(null)
    setStep(12)
    setProfileGate(true)
  }, [mode, replaceDraft, setStep, setIdentitySubStep, setBusinessEditIndex, setHealthScheduleSubStep])

  useEffect(() => {
    if (step !== 2) setBusinessInterstitial(null)
  }, [step])

  const launch = useCallback(async () => {
    if (launchOnceRef.current) return
    launchOnceRef.current = true
    setLaunching(true)
    try {
      if (mode === 'profileUpdate') {
        await commitProfileUpdateFromDraft(main, draft)
        toast.success('Your profile was updated.')
        router.push('/settings')
        return
      }
      await commitOnboardingDraft(main, draft)
      main.completeOnboarding()
      main.setAuthenticated(true)
      main.touchLastOpened()
      resetWizard()
      sessionStorage.removeItem('onb-resume-shown')
      router.push('/dashboard')
    } finally {
      launchOnceRef.current = false
      setLaunching(false)
    }
  }, [draft, main, mode, resetWizard, router])

  const handleVoice = useCallback(
    (text: string) => {
      const sub = useOnboardingStore.getState().identitySubStep
      const bi = useOnboardingStore.getState().businessEditIndex
      patchDraft((d) => {
        const sp = (a: string) => (a ? `${a} ` : '') + text
        if (step === 1) {
          if (sub === 0) return { ...d, identity: { ...d.identity, name: sp(d.identity.name) } }
          if (sub === 1) return { ...d, identity: { ...d.identity, location: sp(d.identity.location) } }
          if (sub === 2) {
            const n = parseInt(text.replace(/\D/g, ''), 10)
            return { ...d, identity: { ...d.identity, age: !Number.isNaN(n) && n >= 18 && n <= 99 ? n : d.identity.age } }
          }
          return { ...d, identity: { ...d.identity, selfDescription: sp(d.identity.selfDescription) } }
        }
        if (step === 2 && d.businesses[bi]) {
          const bb = [...d.businesses]
          bb[bi] = { ...bb[bi], bottleneck: sp(bb[bi].bottleneck) }
          return { ...d, businesses: bb }
        }
        if (step === 5) {
          return { ...d, goals: { ...d.goals, idealDay: sp(d.goals.idealDay) } }
        }
        if (step === 6) {
          return { ...d, health: { ...d.health, tryingToQuit: sp(d.health.tryingToQuit) } }
        }
        if (step === 7) {
          return { ...d, faith: { ...d.faith, faithOtherNotes: sp(d.faith.faithOtherNotes) } }
        }
        if (step === 8) {
          return { ...d, struggles: { ...d.struggles, procrastinationPattern: sp(d.struggles.procrastinationPattern) } }
        }
        return d
      })
    },
    [patchDraft, step]
  )

  const onPinDigit = (phase: 'set' | 'confirm', i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const arr = [...pinWorking]
    arr[i] = v
    setPinWorking(arr)
    setPinErr('')
    const refs = phase === 'set' ? pinRefs : confirmRefs
    if (v && i < 3) refs[i + 1].current?.focus()

    if (i === 3 && v) {
      const code = arr.join('')
      if (phase === 'set') {
        patchDraft((d) => ({ ...d, pin: code }))
        setPinWorking(['', '', '', ''])
        setPinPhase('confirm')
        setTimeout(() => confirmRefs[0].current?.focus(), 80)
      } else {
        const expected = useOnboardingStore.getState().draft.pin
        if (code === expected) {
          nextStep()
        } else {
          setPinErr("Codes didn't match. Try again.")
          setPinWorking(['', '', '', ''])
          setPinPhase('set')
          patchDraft((d) => ({ ...d, pin: '' }))
          setTimeout(() => pinRefs[0].current?.focus(), 100)
        }
      }
    }
  }

  const progressPct =
    step === 0
      ? 0
      : ((step >= 2 ? step - 1 : 0) + (step === 1 ? (identitySubStep + 1) / 4 : 0)) / 13 * 100

  const catLabel = CATEGORY_TITLES[step] ?? ''

  const runValidationAndAdvance = () => {
    const v = validateStep(step, draft, identitySubStep, healthScheduleSubStep, businessEditIndex)
    if (!v.ok) {
      setValidationErrors(v.errors)
      return false
    }
    clearValidationErrors()
    return true
  }

  const footerContinueDisabled =
    step === 0 || (step === 2 && businessInterstitial !== null) || step >= 11 || step === 12

  const canProceed = canProceedStep(step, draft, identitySubStep, healthScheduleSubStep, businessEditIndex)
  const continueBlockedByValidation =
    step > 0 && step < 11 && !(step === 2 && businessInterstitial !== null) && !canProceed

  const handleMainContinue = () => {
    if (!runValidationAndAdvance()) return

    if (step === 1) {
      if (identitySubStep < 3) setIdentitySubStep(identitySubStep + 1)
      else nextStep()
      return
    }

    if (step === 2) {
      setBusinessInterstitial(businessEditIndex)
      return
    }

    if (step === 6) {
      if (healthScheduleSubStep < 2) {
        setHealthScheduleSubStep(healthScheduleSubStep + 1)
        return
      }
      setHealthScheduleSubStep(0)
      nextStep()
      return
    }

    if (step < 11) nextStep()
  }

  const handleBack = () => {
    if (step === 6 && healthScheduleSubStep > 0) {
      setHealthScheduleSubStep(healthScheduleSubStep - 1)
      return
    }
    if (step === 1 && identitySubStep > 0) {
      setIdentitySubStep(identitySubStep - 1)
      return
    }
    if (step > 0) prevStep()
  }

  const interstitialName = businessInterstitial !== null ? draft.businesses[businessInterstitial]?.name?.trim() || 'This business' : ''

  if (mode === 'profileUpdate' && !profileGate) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[17px] text-[var(--color-text-dim,#888)]">
        Loading your profile…
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen text-[#F5F5F7]"
      style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(60, 55, 50, 0.12) 0%, #1C1C1E 70%)',
      }}
    >
      {step > 0 && (
        <div className="fixed left-0 right-0 top-0 z-50 h-[2px] bg-[rgba(255,255,255,0.08)]">
          <motion.div
            className="h-full bg-[var(--accent)]"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
      )}

      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 pb-28 pt-10 md:flex-row md:gap-8 md:px-8 md:pb-12 md:pt-14">
        <div className="flex min-w-0 flex-1 flex-col md:max-w-[55%]">
          {step > 0 && (
            <p className="label mb-4 text-[rgba(255,255,255,0.45)]">
              {step < 12 ? `Step ${step + 1} of 13 · ${catLabel}` : catLabel}
            </p>
          )}

          {resumeWelcome && mode !== 'profileUpdate' && step > 0 && step < 12 && (
            <div className={aiBubbleCls + ' mb-4'}>
              Welcome back. Let&apos;s pick up where you left off.
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 11 ? (
              <motion.div
                key="pin"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-auto w-full max-w-md"
              >
                <div className={glassPanel + ' text-center'}>
                  <h2 className="text-[28px] font-bold tracking-[-0.5px] text-[#F5F5F7]">Lock it down</h2>
                  <p className="mt-1 text-[17px] text-[rgba(255,255,255,0.55)]">
                    {pinPhase === 'set' ? 'Choose a 4-digit PIN' : 'Confirm your PIN'}
                  </p>
                  <div className={`mt-6 flex justify-center gap-3 ${pinErr ? 'animate-shake' : ''}`}>
                    {pinWorking.map((d, i) => (
                      <input
                        key={`${pinPhase}-${i}`}
                        ref={pinPhase === 'set' ? pinRefs[i] : confirmRefs[i]}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={(e) => onPinDigit(pinPhase, i, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !pinWorking[i] && i > 0) {
                            const r = pinPhase === 'set' ? pinRefs : confirmRefs
                            r[i - 1].current?.focus()
                          }
                        }}
                        className="data h-20 w-14 rounded-[12px] border border-[var(--border)] bg-[var(--bg-secondary)] text-center text-2xl text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-0"
                      />
                    ))}
                  </div>
                  {pinErr && <p className="mt-3 text-sm text-rose-300">{pinErr}</p>}
                  <p className="mt-4 text-[11px] text-white/30">Stored on this device. Change anytime in Settings.</p>
                  {mode === 'profileUpdate' && (
                    <button
                      type="button"
                      onClick={() => nextStep()}
                      className="mt-5 text-[15px] font-medium text-[var(--accent)]"
                    >
                      Keep current PIN
                    </button>
                  )}
                </div>
              </motion.div>
            ) : step === 12 ? (
              <motion.div key="s12" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                <OnboardingCategorySummary
                  draft={draft}
                  onLaunch={() => void launch()}
                  launching={launching}
                  primaryCtaLabel={mode === 'profileUpdate' ? 'Save changes' : undefined}
                  hideSettingsLink={mode === 'profileUpdate'}
                />
              </motion.div>
            ) : step === 2 && businessInterstitial !== null ? (
              <motion.div key="biz-int" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className={aiBubbleCls}>
                  Got it. <span className="font-semibold">{interstitialName}</span> is mapped.
                </div>
                <p className="text-[14px] text-[var(--text-secondary)]">
                  Check the preview — your business card pulses. {draft.businesses.length > 1 ? 'You can add more detail or move on.' : ''}
                </p>
              </motion.div>
            ) : (
              <OnboardingStepBody
                step={step}
                draft={draft}
                patchDraft={patchDraft}
                identitySubStep={identitySubStep}
                healthScheduleSubStep={healthScheduleSubStep}
              />
            )}
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 0 || (step === 2 && businessInterstitial !== null)}
              className={btnSecondary + ' disabled:opacity-20'}
            >
              ← Back
            </button>
            {step === 0 && (
              <button
                type="button"
                onClick={() => {
                  setResumeWelcome(false)
                  nextStep()
                }}
                className={btnPrimary}
              >
                Let&apos;s go →
              </button>
            )}
            {step > 0 && step < 11 && (
              <div className="flex flex-col items-end gap-2">
                {step === 2 && businessInterstitial !== null ? (
                  <>
                    {businessInterstitial < draft.businesses.length - 1 ? (
                      <>
                        <button
                          type="button"
                          className={btnPrimary}
                          onClick={() => {
                            setBusinessInterstitial(null)
                            setBusinessEditIndex(businessInterstitial + 1)
                          }}
                        >
                          Next business →
                        </button>
                        <button
                          type="button"
                          className="text-[15px] font-medium text-[var(--accent)]"
                          onClick={() => {
                            const idx = businessInterstitial
                            patchDraft((d) => ({
                              ...d,
                              businessCount: idx + 1,
                              businesses: d.businesses.slice(0, idx + 1),
                            }))
                            setBusinessInterstitial(null)
                            setBusinessEditIndex(0)
                            nextStep()
                          }}
                        >
                          Actually, I&apos;m done adding businesses
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className={btnPrimary}
                          onClick={() => {
                            setBusinessInterstitial(null)
                            nextStep()
                          }}
                        >
                          Continue to finances →
                        </button>
                        <button
                          type="button"
                          className="text-[15px] text-[var(--accent)]"
                          onClick={() => {
                            patchDraft((d) => {
                              const b = emptyBusinessDraft(PALETTE[d.businesses.length % PALETTE.length])
                              const nb = { ...b, id: newId() }
                              return {
                                ...d,
                                businessCount: d.businessCount + 1,
                                businesses: [...d.businesses, nb],
                              }
                            })
                            const nextIdx = draft.businesses.length
                            setBusinessEditIndex(nextIdx)
                            setBusinessInterstitial(null)
                          }}
                        >
                          + Add another business
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setResumeWelcome(false)
                        handleMainContinue()
                      }}
                      disabled={footerContinueDisabled || continueBlockedByValidation}
                      className={btnPrimary}
                    >
                      Continue →
                    </button>
                    {step === 8 && (
                      <button type="button" onClick={() => nextStep()} className="text-[15px] font-medium text-[var(--accent)]">
                        Skip this section →
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

        </div>

        <div className="mt-10 hidden min-h-[480px] flex-1 md:mt-0 md:block md:max-w-[45%]">
          <LiveDashboardPreview
            draft={draft}
            stepIndex={step}
            healthScheduleSubStep={healthScheduleSubStep}
            pulseBusinessIndex={businessInterstitial}
          />
        </div>
      </div>

      <div className="border-t border-[var(--separator)] bg-[rgba(0,0,0,0.15)] px-4 py-3 md:hidden">
        <p className="label text-center">Preview updates as you go</p>
        <p className="body mt-1 text-center text-[17px] text-[var(--accent)]">
          {draft.identity.name.trim()
            ? `${capitalizeDisplayName(draft.identity.name)} · ${draft.businesses.filter((b) => b.name.trim()).length} businesses`
            : '—'}
        </p>
      </div>

      <OnboardingVoiceFab onTranscript={handleVoice} />
    </div>
  )
}
