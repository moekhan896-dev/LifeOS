'use client'

import { useEffect, useState } from 'react'

/** PRD §4 — persistent when offline */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const sync = () => setOffline(typeof navigator !== 'undefined' && !navigator.onLine)
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  if (!offline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[300] w-full border-b border-[var(--warning)]/30 px-4 py-2 text-center text-[14px] font-medium text-[var(--warning)]"
      style={{
        background: 'color-mix(in srgb, var(--warning) 10%, transparent)',
      }}
    >
      You&apos;re offline. Changes will sync when you reconnect.
    </div>
  )
}
