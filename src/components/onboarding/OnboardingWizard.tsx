'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/store'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { OnboardingStepBody } from './OnboardingStepBody'
import { LiveDashboardPreview } from './LiveDashboardPreview'
import { OnboardingVoiceFab } from './OnboardingVoiceFab'
import { commitOnboardingDraft } from './onboarding-commit'
import { capitalizeDisplayName } from '@/lib/display-name'
import { CATEGORY_TITLES, btnPrimary, btnSecondary, glassPanel } from './onboarding-constants'

function canProceed(
  step: number,
  draft: ReturnType<typeof useOnboardingStore.getState>['draft'],
  identitySubStep: number
): boolean {
  switch (step) {
    case 0:
      return true
    case 1:
      switch (identitySubStep) {
        case 0:
          return !!draft.identity.name.trim()
        case 1:
          return !!draft.identity.location.trim()
        case 2:
          return draft.identity.age !== ''
        case 3:
          return true
        default:
          return false
      }
    case 2:
      return draft.businesses.every((b) => b.name.trim() && b.type && b.status && b.role)
    case 3:
      return true
    case 4:
      return true
    case 5:
      return !!(
        draft.goals.incomeTarget >= 5000 &&
        draft.goals.targetYearMonth &&
        draft.goals.exitIntent &&
        (draft.goals.northStarMetric !== 'Something else' || !!draft.goals.northStarCustom?.trim())
      )
    case 6:
      return !!(
        draft.health.targetWake &&
        draft.health.actualWake &&
        draft.schedule?.workStart &&
        draft.schedule?.workEnd
      )
    case 7:
      return true
    case 8:
      return true
    case 9:
      return !!(draft.ai.communicationStyle && draft.ai.frequency && draft.ai.reasoningDisplay)
    case 10:
      return true
    case 11:
      return draft.pin.length === 4
    case 12:
      return true
    default:
      return false
  }
}

export function OnboardingWizard() {
  const router = useRouter()
  const main = useStore()
  const { step, draft, identitySubStep, setIdentitySubStep, nextStep, prevStep, patchDraft, resetWizard } =
    useOnboardingStore()
  const [pinPhase, setPinPhase] = useState<'set' | 'confirm'>('set')
  const [pinWorking, setPinWorking] = useState(['', '', '', ''])
  const [pinErr, setPinErr] = useState('')
  const [launching, setLaunching] = useState(false)
  const launchOnceRef = useRef(false)
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
  const confirmRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  useEffect(() => {
    if (step !== 11) {
      setPinPhase('set')
      setPinWorking(['', '', '', ''])
      setPinErr('')
    }
  }, [step])

  const launch = useCallback(async () => {
    if (launchOnceRef.current) return
    launchOnceRef.current = true
    setLaunching(true)
    try {
      await commitOnboardingDraft(main, draft)
      main.completeOnboarding()
      main.setAuthenticated(true)
      main.touchLastOpened()
      resetWizard()
      router.push('/dashboard')
    } finally {
      launchOnceRef.current = false
      setLaunching(false)
    }
  }, [draft, main, resetWizard, router])

  const handleVoice = useCallback(
    (text: string) => {
      const sub = useOnboardingStore.getState().identitySubStep
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
        if (step === 2 && d.businesses[0]) {
          const bb = [...d.businesses]
          bb[0] = { ...bb[0], bottleneck: sp(bb[0].bottleneck) }
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

  /* 13 categories (steps 0–12); identity uses 4 substeps */
  const progressPct =
    step === 0
      ? 0
      : ((step >= 2 ? step - 1 : 0) + (step === 1 ? (identitySubStep + 1) / 4 : 0)) / 13 * 100

  const catLabel = CATEGORY_TITLES[step] ?? ''

  const handleMainContinue = () => {
    if (step === 1) {
      if (!canProceed(step, draft, identitySubStep)) return
      if (identitySubStep < 3) setIdentitySubStep(identitySubStep + 1)
      else nextStep()
      return
    }
    if (step < 11) nextStep()
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
                </div>
              </motion.div>
            ) : (
              <OnboardingStepBody step={step} draft={draft} patchDraft={patchDraft} identitySubStep={identitySubStep} />
            )}
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => (step > 0 ? prevStep() : undefined)}
              disabled={step === 0}
              className={btnSecondary + ' disabled:opacity-20'}
            >
              ← Back
            </button>
            {step === 0 && (
              <button type="button" onClick={() => nextStep()} className={btnPrimary}>
                Let&apos;s go →
              </button>
            )}
            {step > 0 && step < 11 && (
              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={handleMainContinue}
                  disabled={!canProceed(step, draft, identitySubStep)}
                  className={btnPrimary}
                >
                  Continue →
                </button>
                {step === 8 && (
                  <button type="button" onClick={() => nextStep()} className="text-[15px] font-medium text-[var(--accent)]">
                    Skip this section →
                  </button>
                )}
              </div>
            )}
            {step === 12 && (
              <button
                type="button"
                onClick={() => void launch()}
                disabled={launching}
                className={btnPrimary + ' w-full sm:w-auto'}
              >
                {launching ? 'Starting…' : 'Enter ART OS →'}
              </button>
            )}
          </div>

        </div>

        <div className="mt-10 hidden min-h-[480px] flex-1 md:mt-0 md:block md:max-w-[45%]">
          <LiveDashboardPreview draft={draft} stepIndex={step} />
        </div>
      </div>

      {/* Mobile: compact preview strip */}
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
