'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/store'
import Sidebar from '@/components/Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { authenticated, theme } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (!authenticated) {
      router.replace('/')
    }
  }, [authenticated, router])

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
  }, [theme])

  if (!authenticated) return null

  return (
    <div className="scanline flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-[232px] min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  )
}
