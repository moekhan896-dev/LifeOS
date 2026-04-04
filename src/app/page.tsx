'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useStore } from '@/stores/store'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { hashPin, verifyPin } from '@/lib/pin-hash'
import { PinKeypad } from '@/components/PinKeypad'

function PinEntry() {
  const [, setTick] = useState(0)
  const { setAuthenticated, recordPinFailure, resetPinSecurity, pinLockoutUntil } = useStore()
  const router = useRouter()
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [migrating, setMigrating] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const s = useStore.getState()
      if (s.pin && s.pin.length === 4 && !s.pinHash) {
        const h = await hashPin(s.pin)
        if (!cancelled) useStore.setState({ pinHash: h, pin: '' })
      }
      if (!cancelled) setMigrating(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const lockoutRemainingMs = Math.max(0, pinLockoutUntil - Date.now())
    if (lockoutRemainingMs <= 0) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [pinLockoutUntil])

  const lockoutRemainingMs = Math.max(0, pinLockoutUntil - Date.now())
  const locked = lockoutRemainingMs > 0

  const submitPin = useCallback(
    async (next: string[]) => {
      const entered = next.join('')
      if (entered.length !== 4) return
      const hash = useStore.getState().pinHash
      const ok = await verifyPin(entered, hash)
      if (ok) {
        resetPinSecurity()
        setTimeout(() => {
          setAuthenticated(true)
          router.push('/dashboard')
        }, 200)
      } else {
        recordPinFailure()
        setError(true)
        setTimeout(() => {
          setDigits(['', '', '', ''])
          setError(false)
        }, 500)
      }
    },
    [recordPinFailure, resetPinSecurity, router, setAuthenticated]
  )

  const pushDigit = (d: string) => {
    if (locked) return
    const idx = digits.findIndex((x) => x === '')
    if (idx === -1) return
    const next = [...digits]
    next[idx] = d
    setDigits(next)
    setError(false)
    if (idx === 3) void submitPin(next)
  }

  const backspace = () => {
    if (locked) return
    const last = [...digits]
    for (let i = 3; i >= 0; i--) {
      if (last[i]) {
        last[i] = ''
        break
      }
    }
    setDigits(last)
    setError(false)
  }

  if (migrating) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 text-[17px] text-[rgba(255,255,255,0.55)]"
        style={{
          backgroundColor: '#1C1C1E',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(60,55,50,0.12) 0%, #1C1C1E 70%)',
        }}
      >
        Preparing security…
      </div>
    )
  }

  const effectiveHash = useStore.getState().pinHash
  if (!effectiveHash || effectiveHash.length < 64) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-4 text-center text-[rgba(255,255,255,0.55)]"
        style={{
          backgroundColor: '#1C1C1E',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(60,55,50,0.12) 0%, #1C1C1E 70%)',
        }}
      >
        <p className="max-w-sm text-[17px]">Finish onboarding to set a PIN, or reset the app from Settings.</p>
      </div>
    )
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        backgroundColor: '#1C1C1E',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(60,55,50,0.12) 0%, #1C1C1E 70%)',
      }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-[16px] border border-[rgba(255,255,255,0.06)] bg-[rgba(44,44,46,0.85)] p-8 text-center shadow-2xl backdrop-blur-[40px]"
      >
        <h2 className="text-[28px] font-bold tracking-[-0.5px] text-[#F5F5F7]">Enter your PIN</h2>
        <p className="mt-1 text-[17px] text-[rgba(255,255,255,0.55)]">Access ART OS</p>
        {locked ? (
          <p className="mt-6 text-[15px] text-[rgba(255,255,255,0.35)]">
            Too many attempts. Try again in {Math.ceil(lockoutRemainingMs / 1000)}s.
          </p>
        ) : (
          <>
            <motion.div
              className="mt-6 flex justify-center gap-3"
              animate={error ? { x: [0, -8, 8, -4, 4, 0] } : {}}
              transition={{ duration: 0.4 }}
              aria-hidden
            >
              {digits.map((d, i) => (
                <div
                  key={i}
                  className={`h-4 w-4 shrink-0 rounded-full border ${
                    error ? 'border-[#FF453A] bg-[#FF453A]' : d ? 'border-[#0A84FF] bg-[#0A84FF]' : 'border-[rgba(255,255,255,0.12)] bg-transparent'
                  }`}
                />
              ))}
            </motion.div>
            <p className="sr-only" aria-live="polite">
              {digits.filter(Boolean).length} of 4 digits entered
            </p>
            <PinKeypad disabled={locked} onDigit={pushDigit} onBackspace={backspace} />
            {error && <p className="mt-3 text-[15px] text-[#FF453A]">Incorrect PIN</p>}
          </>
        )}
      </motion.div>
    </div>
  )
}

export default function Page() {
  const { authenticated, onboardingComplete, pinHash, pin } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (authenticated) router.push('/dashboard')
  }, [authenticated, router])

  if (authenticated) return null
  if (onboardingComplete && !authenticated) {
    const hasPin = (pinHash && pinHash.length >= 64) || (pin && pin.length === 4)
    if (hasPin) return <PinEntry />
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center px-4 text-center text-[rgba(255,255,255,0.55)]"
        style={{
          backgroundColor: '#1C1C1E',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(60,55,50,0.12) 0%, #1C1C1E 70%)',
        }}
      >
        <p className="max-w-sm text-[17px]">Finish onboarding to set a PIN, or reset the app from Settings.</p>
      </div>
    )
  }
  if (!onboardingComplete) return <OnboardingWizard />

  return null
}
