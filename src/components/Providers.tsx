'use client'

import { useEffect } from 'react'
import { Toaster } from 'sonner'

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const apply = () => {
      const el = document.querySelector('[data-sonner-toaster]')
      if (!el) return false
      el.setAttribute('aria-live', 'polite')
      el.setAttribute('role', 'status')
      return true
    }
    if (apply()) return
    const t = window.setTimeout(apply, 150)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
            fontSize: '17px',
            borderRadius: '10px',
            boxShadow: '0 8px 32px color-mix(in srgb, var(--text-primary) 12%, transparent)',
          },
        }}
        gap={8}
      />
    </>
  )
}
