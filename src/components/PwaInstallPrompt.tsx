'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/stores/store'

const STORAGE_KEY = 'artos-pwa-install-dismissed'

/** Non-standard Chromium API for PWA install */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

/** PRD §4 — once after onboarding for new users */
export default function PwaInstallPrompt() {
  const onboardingComplete = useStore((s) => s.onboardingComplete)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [])

  useEffect(() => {
    if (!onboardingComplete || !deferred) {
      setVisible(false)
      return
    }
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') {
        setVisible(false)
        return
      }
    } catch {
      /* ignore */
    }
    setVisible(true)
  }, [onboardingComplete, deferred])

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    setVisible(false)
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    dismiss()
    setDeferred(null)
  }

  return (
    <AnimatePresence>
      {visible && deferred && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="fixed bottom-24 left-4 right-4 z-[250] mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-xl md:bottom-8"
        >
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">Install ART OS</p>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Add to your home screen for quick access.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => void install()}
              className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-[15px] font-semibold text-white"
            >
              Install
            </button>
            <button type="button" onClick={dismiss} className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-[15px] text-[var(--text-secondary)]">
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
