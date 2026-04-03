'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/store'

export default function PinEntry() {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const { pin, setAuthenticated, authenticated } = useStore()

  useEffect(() => {
    if (authenticated) {
      router.replace('/dashboard')
    }
  }, [authenticated, router])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return

    const newDigits = [...digits]
    newDigits[index] = value
    setDigits(newDigits)
    setError(false)

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    if (value && index === 3) {
      const entered = newDigits.join('')
      if (entered === pin) {
        setSuccess(true)
        setTimeout(() => {
          setAuthenticated(true)
          router.replace('/dashboard')
        }, 400)
      } else {
        setError(true)
        setTimeout(() => {
          setDigits(['', '', '', ''])
          inputRefs.current[0]?.focus()
        }, 600)
      }
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg)] via-[var(--color-surface)] to-[var(--color-bg)] opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,136,0.04),transparent_70%)]" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Title */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)] font-[family-name:var(--font-general-sans)]">
            ART OS
          </h1>
          <p className="mt-2 text-sm text-[var(--color-dim)] font-mono">
            Personal Business Operating System
          </p>
        </div>

        {/* PIN Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl shadow-black/20 w-[320px]">
          <p className="text-center text-sm text-[var(--color-dim)] mb-6">
            Enter your PIN
          </p>

          <div className="flex justify-center gap-3">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`
                  w-14 h-14 text-center text-2xl font-mono rounded-xl
                  bg-[var(--color-bg)] border-2 outline-none
                  transition-all duration-200
                  ${error
                    ? 'border-red-500 animate-shake'
                    : success
                      ? 'border-[var(--color-accent)]'
                      : digit
                        ? 'border-[var(--color-accent)]/50'
                        : 'border-[var(--color-border)]'
                  }
                  text-[var(--color-text)]
                  focus:border-[var(--color-accent)] focus:shadow-[0_0_12px_rgba(0,255,136,0.15)]
                `}
              />
            ))}
          </div>

          {error && (
            <p className="text-center text-xs text-red-500 mt-4">
              Incorrect PIN
            </p>
          )}

          {success && (
            <p className="text-center text-xs text-[var(--color-accent)] mt-4">
              Access granted
            </p>
          )}
        </div>

        {/* Subtle footer */}
        <p className="text-[10px] text-[var(--color-dim)]/40 font-mono tracking-widest uppercase">
          Secure Entry
        </p>
      </div>
    </div>
  )
}
