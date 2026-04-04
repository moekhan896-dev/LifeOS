'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/store'
import TabBar from '@/components/TabBar'
import VoiceMic from '@/components/VoiceMic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const authenticated = useStore((s) => s.authenticated)

  useEffect(() => {
    if (!authenticated) {
      router.replace('/')
    }
  }, [authenticated, router])

  if (!authenticated) {
    return null
  }

  return (
    <div className="min-h-screen pb-14">
      {children}
      <VoiceMic />
      <TabBar />
    </div>
  )
}
