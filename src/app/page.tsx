'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/stores/store'

// ═══ Slide transition variants ═══
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
}

const slideTransition = {
  x: { type: 'spring', stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
} as const

// ═══ Onboarding Wizard ═══
function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [name, setName] = useState('')
  const [income, setIncome] = useState(50000)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')

  const { setPin: storeSetPin, completeOnboarding, updateProfile, seedDefaultData, setAuthenticated } = useStore()
  const router = useRouter()

  const next = () => {
    setDirection(1)
    setStep((s) => s + 1)
  }

  const handleFinish = () => {
    if (pin.length !== 4) {
      setPinError('Enter a 4-digit PIN')
      return
    }
    if (pin !== confirmPin) {
      setPinError('PINs do not match')
      return
    }
    storeSetPin(pin)
    if (name) updateProfile({ userName: name, incomeTarget: income })
    completeOnboarding()
    setAuthenticated(true)
    seedDefaultData()
    router.push('/home')
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <AnimatePresence mode="wait" custom={direction}>
        {step === 0 && (
          <motion.div
            key="step0"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="flex w-full max-w-sm flex-col items-center text-center"
          >
            {/* Radial emerald glow behind logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="h-[400px] w-[400px] rounded-full bg-emerald-500/[0.06] blur-[100px]" />
            </div>

            <h1 className="data relative text-[56px] font-bold tracking-[12px] text-emerald-400 glow-emerald">
              ART OS
            </h1>
            <p className="relative mt-4 text-[15px] leading-relaxed text-white/50">
              Your businesses. Your health. Your life.
              <br />
              One system.
            </p>
            <button
              onClick={next}
              className="relative mt-10 rounded-2xl bg-emerald-500 px-8 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              Set up &rarr;
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="flex w-full max-w-sm flex-col gap-6"
          >
            <div>
              <p className="label mb-3">Your Name</p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Art"
                className="w-full rounded-[14px] border border-white/[0.06] bg-[#0e1118] px-4 py-3.5 text-[15px] text-white placeholder-white/20 outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <p className="label mb-3">Monthly Income Target</p>
              <input
                type="range"
                min={10000}
                max={200000}
                step={5000}
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
              <p className="data mt-2 text-center text-2xl font-bold text-emerald-400">
                ${income.toLocaleString()}
                <span className="text-sm text-white/30">/mo</span>
              </p>
            </div>

            <button
              onClick={next}
              className="mt-4 rounded-2xl bg-emerald-500 px-8 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              Next &rarr;
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="flex w-full max-w-sm flex-col gap-6"
          >
            <div>
              <p className="label mb-3">Set a 4-digit PIN</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                  setPinError('')
                }}
                placeholder="\u2022\u2022\u2022\u2022"
                className="w-full rounded-[14px] border border-white/[0.06] bg-[#0e1118] px-4 py-3.5 text-center text-2xl tracking-[16px] text-white placeholder-white/20 outline-none focus:border-emerald-500/50"
              />
            </div>

            <div>
              <p className="label mb-3">Confirm PIN</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => {
                  setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                  setPinError('')
                }}
                placeholder="\u2022\u2022\u2022\u2022"
                className="w-full rounded-[14px] border border-white/[0.06] bg-[#0e1118] px-4 py-3.5 text-center text-2xl tracking-[16px] text-white placeholder-white/20 outline-none focus:border-emerald-500/50"
              />
            </div>

            {pinError && (
              <p className="text-center text-sm text-rose-400">{pinError}</p>
            )}

            <button
              onClick={handleFinish}
              className="mt-2 rounded-2xl bg-emerald-500 px-8 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              Enter ART OS &rarr;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══ PIN Entry ═══
function PinEntry() {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const { pin: storedPin, setAuthenticated } = useStore()

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, '').slice(-1)
      const newDigits = [...digits]
      newDigits[index] = digit
      setDigits(newDigits)
      setError(false)

      if (digit && index < 3) {
        inputRefs.current[index + 1]?.focus()
      }

      // Check full PIN
      if (index === 3 && digit) {
        const fullPin = newDigits.join('')
        if (fullPin.length === 4) {
          if (fullPin === storedPin) {
            setAuthenticated(true)
            router.push('/home')
          } else {
            setError(true)
            setTimeout(() => {
              setDigits(['', '', '', ''])
              inputRefs.current[0]?.focus()
            }, 600)
          }
        }
      }
    },
    [digits, storedPin, setAuthenticated, router]
  )

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    },
    [digits]
  )

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <h1 className="data mb-2 text-3xl font-bold tracking-[8px] text-emerald-400 glow-emerald">
        ART OS
      </h1>
      <p className="label mb-10">Enter PIN</p>

      <motion.div
        className="flex gap-3"
        animate={error ? { x: [0, -12, 12, -12, 12, 0] } : {}}
        transition={{ duration: 0.4, ease: [0.36, 0.07, 0.19, 0.97] as const }}
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el
            }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`h-14 w-14 rounded-[14px] border text-center text-2xl font-semibold outline-none transition ${
              error
                ? 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                : 'border-white/[0.06] bg-[#0e1118] text-white focus:border-emerald-500/50'
            }`}
          />
        ))}
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm text-rose-400"
        >
          Wrong PIN
        </motion.p>
      )}
    </div>
  )
}

// ═══ Root Page ═══
export default function RootPage() {
  const { authenticated, onboardingComplete } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (authenticated) {
      router.replace('/home')
    }
  }, [authenticated, router])

  if (authenticated) return null

  if (!onboardingComplete) {
    return <OnboardingWizard onComplete={() => {}} />
  }

  return <PinEntry />
}
