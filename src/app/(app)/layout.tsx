'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/store'
import Sidebar from '@/components/Sidebar'
import CommandPalette from '@/components/CommandPalette'
import VoiceButton from '@/components/VoiceButton'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { authenticated, theme } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (!authenticated) router.replace('/')
  }, [authenticated, router])

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  if (!authenticated) return null

  return (
    <div className="scanline flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-[240px] min-h-screen overflow-x-hidden">
        <div className="p-4 md:p-5 max-w-[1200px] mx-auto">
          {children}
        </div>
      </main>
      <CommandPalette />
      <VoiceButton />
    </div>
  )
}
