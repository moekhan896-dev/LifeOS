'use client'

import { Toaster } from 'sonner'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#0e1118',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#f1f3f9',
            fontFamily: 'var(--font-sans), system-ui, sans-serif',
          },
        }}
      />
    </>
  )
}
