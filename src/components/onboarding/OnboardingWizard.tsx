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
import { AiBubble } from './AiBubble'
import {
  ONBOARDING_AI_TIMING,
  computeAdvanceAiOnContinue,
  financeSummaryText,
  businessesCompleteSummary,
  advanceAiLeavingStruggles,
  advanceAiPinConfirmed,
  type AdvanceAiResult,
} from '@/lib/onboarding-ai-messages'

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
    foundationSubStep,
    setFoundationSubStep,
    strugglesSubStep,
    setStrugglesSubStep,
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
  const [aiOverlayText, setAiOverlayText] = useState<string | null>(null)
  const [financeOverlay, setFinanceOverlay] = useState(false)
  const aiTimersRef = useRef<number[]>([])

  const clearAiTimers = useCallback(() => {
    aiTimersRef.current.forEach((id) => window.clearTimeout(id))
    aiTimersRef.current = []
  }, [])

  const runAiSequence = useCallback(
    (result: AdvanceAiResult, onDone: () => void) => {
      clearAiTimers()
      if (result.kind === 'none' || (result.kind === 'messages' && result.messages.length === 0)) {
        onDone()
        return
      }
      if (result.kind !== 'messages') {
        onDone()
        return
      }
      const { delayShowMs, displayMs } = ONBOARDING_AI_TIMING
      const queue = [...result.messages]
      const stepNext = () => {
        if (queue.length === 0) {
          setAiOverlayText(null)
          onDone()
          return
        }
        const line = queue.shift()!
        const t1 = window.setTimeout(() => {
          setAiOverlayText(line)
          const t2 = window.setTimeout(() => {
            setAiOverlayText(null)
            stepNext()
          }, displayMs)
          aiTimersRef.current.push(t2)
        }, delayShowMs)
        aiTimersRef.current.push(t1)
      }
      stepNext()
    },
    [clearAiTimers]
  )

  useEffect(() => {
    if (step !== 11) {
      setPinPhase('set')
      setPinWorking(['', '', '', ''])
      setPinErr('')
    }
  }, [step])

  useEffect(() => {
    clearValidationErrors()
  }, [step, identitySubStep, foundationSubStep, strugglesSubStep, clearValidationErrors])

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
    setFoundationSubStep(0)
    setStrugglesSubStep(0)
    setBusinessInterstitial(null)
    setStep(12)
    setProfileGate(true)
  }, [mode, replaceDraft, setStep, setIdentitySubStep, setBusinessEditIndex, setFoundationSubStep, setStrugglesSubStep])

  useEffect(() => {
    if (step !== 2) setBusinessInterstitial(null)
  }, [step])

  useEffect(() => () => clearAiTimers(), [clearAiTimers])

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

  const executeStepAdvance = () => {
    const st = useOnboardingStore.getState()
    const { step: stp, identitySubStep: is, foundationSubStep: fs, strugglesSubStep: ss, businessEditIndex: bi } = st
    if (stp === 1) {
      if (is < 3) setIdentitySubStep(is + 1)
      else nextStep()
      return
    }
    if (stp === 2) {
      setBusinessInterstitial(bi)
      return
    }
    if (stp === 6) {
      if (fs < 5) {
        setFoundationSubStep(fs + 1)
        return
      }
      setFoundationSubStep(0)
      nextStep()
      return
    }
    if (stp === 8) {
      if (ss < 2) {
        setStrugglesSubStep(ss + 1)
        return
      }
      setStrugglesSubStep(0)
      nextStep()
      return
    }
    if (stp < 11) nextStep()
  }

  const onPinDigit = (phase: 'set' | 'confirm', i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const arr = [...pinWorking]
    arr[i] = v
    setPinWorking(arr)
    setPinErr('')
    clearValidationErrors()
    const refs = phase === 'set' ? pinRefs : confirmRefs
    if (v && i < 3) refs[i + 1].current?.focus()

    if (i === 3 && v) {
      const code = arr.join('')
      if (phase === 'set') {
        patchDraft((d) => ({ ...d, pin: code, pinConfirm: '' }))
        clearValidationErrors()
        setPinWorking(['', '', '', ''])
        setPinPhase('confirm')
        setTimeout(() => confirmRefs[0].current?.focus(), 80)
      } else {
        const expected = useOnboardingStore.getState().draft.pin
        if (code === expected) {
          patchDraft((d) => ({ ...d, pinConfirm: code }))
          clearValidationErrors()
          runAiSequence(advanceAiPinConfirmed(), () => nextStep())
        } else {
          setPinErr("Codes didn't match. Try again.")
          setValidationErrors(['pinConfirm'])
          setPinWorking(['', '', '', ''])
          setPinPhase('set')
          patchDraft((d) => ({ ...d, pin: '', pinConfirm: '' }))
          setTimeout(() => pinRefs[0].current?.focus(), 100)
        }
      }
    }
  }

  const progressPct =
    step === 0
      ? 0
      : ((step >= 2 ? step - 1 : 0) +
          (step === 1 ? (identitySubStep + 1) / 4 : 0) +
          (step === 6 ? (foundationSubStep + 1) / 6 : 0) +
          (step === 8 ? (strugglesSubStep + 1) / 3 : 0)) /
        13 *
        100

  const catLabel = CATEGORY_TITLES[step] ?? ''

  const runValidationAndAdvance = () => {
    const v = validateStep(step, draft, identitySubStep, foundationSubStep, businessEditIndex, strugglesSubStep)
    if (!v.ok) {
      setValidationErrors(v.errors)
      return false
    }
    clearValidationErrors()
    return true
  }

  const footerContinueDisabled =
    step === 0 ||
    (step === 2 && businessInterstitial !== null) ||
    step >= 11 ||
    step === 12 ||
    !!aiOverlayText ||
    financeOverlay

  const canProceed = canProceedStep(step, draft, identitySubStep, foundationSubStep, businessEditIndex, strugglesSubStep)
  const continueBlockedByValidation =
    step > 0 && step < 11 && !(step === 2 && businessInterstitial !== null) && !canProceed

  const handleMainContinue = () => {
    if (aiOverlayText || financeOverlay) return
    if (!runValidationAndAdvance()) return

    if (step === 4) {
      setFinanceOverlay(true)
      return
    }

    if (step === 8 && strugglesSubStep === 2) {
      runAiSequence(advanceAiLeavingStruggles(), executeStepAdvance)
      return
    }

    const ai = computeAdvanceAiOnContinue({ step, draft, identitySubStep, foundationSubStep })
    runAiSequence(ai, executeStepAdvance)
  }

  const handleBack = () => {
    if (aiOverlayText || financeOverlay) return
    if (step === 6 && foundationSubStep > 0) {
      setFoundationSubStep(foundationSubStep - 1)
      return
    }
    if (step === 8 && strugglesSubStep > 0) {
      setStrugglesSubStep(strugglesSubStep - 1)
      return
    }
    if (step === 1 && identitySubStep > 0) {
      setIdentitySubStep(identitySubStep - 1)
      return
    }
    if (step > 0) prevStep()
  }

  const interstitialName = businessInterstitial !== null ? draft.businesses[businessInterstitial]?.name?.trim() || 'This business' : ''

  /** After business interstitial: recurring-clients step (3) unless no business has recurring clients. */
  const advanceAfterBusinessInterstitial = (businessesForCheck: typeof draft.businesses) => {
    const anyRecurring = businessesForCheck.some((b) => b.recurringClients === true)
    const go = () => {
      if (anyRecurring) nextStep()
      else setStep(4)
    }
    runAiSequence(
      { kind: 'messages', messages: [businessesCompleteSummary({ ...draft, businesses: businessesForCheck })] },
      go
    )
  }

  if (mode === 'profileUpdate' && !profileGate) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[17px] text-[var(--color-text-dim,#888)]">
        Loading your profile…
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]" style={{ background: 'var(--bg-warm-gradient)' }}>
      {step > 0 && (
        <div className="fixed left-0 right-0 top-0 z-50 h-[2px] bg-[var(--bg-secondary)]">
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
            <p className="label mb-4 text-[var(--text-dim)]">
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
                  <h2 className="text-[28px] font-bold tracking-[-0.5px] text-[var(--text-primary)]">Lock it down</h2>
                  <p className="mt-1 text-[17px] text-[var(--text-secondary)]">
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
                        className={`data h-20 w-14 rounded-[12px] border bg-[var(--bg-secondary)] text-center text-2xl text-[var(--text-primary)] focus:outline-none focus:ring-0 ${
                          pinErr ? 'border-[var(--negative)] focus:border-[var(--negative)]' : 'border-[var(--border)] focus:border-[var(--accent)]'
                        }`}
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
                foundationSubStep={foundationSubStep}
                strugglesSubStep={strugglesSubStep}
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
                            const trimmed = draft.businesses.slice(0, idx + 1)
                            advanceAfterBusinessInterstitial(trimmed)
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
                            advanceAfterBusinessInterstitial(draft.businesses)
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
                      <button
                        type="button"
                        onClick={() => {
                          runAiSequence(advanceAiLeavingStruggles(), () => {
                            setStrugglesSubStep(0)
                            nextStep()
                          })
                        }}
                        className="text-[15px] font-medium text-[var(--accent)]"
                      >
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
            foundationSubStep={foundationSubStep}
            pulseBusinessIndex={businessInterstitial}
          />
        </div>
      </div>

      <div className="border-t border-[var(--separator)] bg-[var(--bg-secondary)] px-4 py-3 md:hidden">
        <p className="label text-center">Preview updates as you go</p>
        <p className="body mt-1 text-center text-[17px] text-[var(--accent)]">
          {draft.identity.name.trim()
            ? `${capitalizeDisplayName(draft.identity.name)} · ${draft.businesses.filter((b) => b.name.trim()).length} businesses`
            : '—'}
        </p>
      </div>

      {aiOverlayText && (
        <div className="pointer-events-none fixed inset-0 z-[190] flex items-end justify-center pb-20 md:pb-14">
          <div className="max-w-[600px] px-4">
            <AiBubble text={aiOverlayText} />
          </div>
        </div>
      )}

      {financeOverlay && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-lg space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <p className="text-[17px] leading-relaxed text-[var(--text-primary)]">{financeSummaryText(draft)}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className={btnPrimary}
                onClick={() => {
                  setFinanceOverlay(false)
                  patchDraft((d) => ({ ...d, finance: { ...d.finance, financeConfirmed: true } }))
                  nextStep()
                }}
              >
                Looks right ✓
              </button>
              <button type="button" className={btnSecondary} onClick={() => setFinanceOverlay(false)}>
                Adjust
              </button>
            </div>
          </div>
        </div>
      )}

      <OnboardingVoiceFab onTranscript={handleVoice} />
    </div>
  )
}
