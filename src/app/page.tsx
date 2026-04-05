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
        className="flex min-h-screen items-center justify-center px-4 text-[17px] text-[var(--text-secondary)]"
        style={{
          backgroundColor: 'var(--bg-primary)',
          backgroundImage: 'var(--bg-warm-gradient)',
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
        className="flex min-h-screen flex-col items-center justify-center px-4 text-center text-[var(--text-secondary)]"
        style={{
          backgroundColor: 'var(--bg-primary)',
          backgroundImage: 'var(--bg-warm-gradient)',
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
        backgroundColor: 'var(--bg-primary)',
        backgroundImage: 'var(--bg-warm-gradient)',
      }}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="card-floating w-full max-w-sm rounded-[16px] p-8 text-center"
      >
        <h2 className="text-[28px] font-bold tracking-[-0.5px] text-[var(--text-primary)]">Enter your PIN</h2>
        <p className="mt-1 text-[17px] text-[var(--text-secondary)]">Access ART OS</p>
        {locked ? (
          <p className="mt-6 text-[15px] text-[var(--text-tertiary)]">
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
                    error
                      ? 'border-[var(--negative)] bg-[var(--negative)]'
                      : d
                        ? 'border-[var(--accent)] bg-[var(--accent)]'
                        : 'border-[var(--border-hover)] bg-transparent'
                  }`}
                />
              ))}
            </motion.div>
            <p className="sr-only" aria-live="polite">
              {digits.filter(Boolean).length} of 4 digits entered
            </p>
            <PinKeypad disabled={locked} onDigit={pushDigit} onBackspace={backspace} />
            {error && <p className="mt-3 text-[15px] text-[var(--negative)]">Incorrect PIN</p>}
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
        className="flex min-h-screen flex-col items-center justify-center px-4 text-center text-[var(--text-secondary)]"
        style={{
          backgroundColor: 'var(--bg-primary)',
          backgroundImage: 'var(--bg-warm-gradient)',
        }}
      >
        <p className="max-w-sm text-[17px]">Finish onboarding to set a PIN, or reset the app from Settings.</p>
      </div>
    )
  }
  if (!onboardingComplete) return <OnboardingWizard />

  return null
}
