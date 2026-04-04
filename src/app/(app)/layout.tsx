'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/store'
import { runWeeklyAiScorecardIfDue } from '@/lib/weekly-scorecard'
import { runWeeklyReportIfDue } from '@/lib/weekly-report'
import Sidebar from '@/components/Sidebar'
import CommandPalette from '@/components/CommandPalette'
import VoiceCommandFab from '@/components/VoiceCommandFab'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const {
    authenticated,
    theme,
    touchLastOpened,
    appendDailyNetSnapshot,
    runProactiveEvaluation,
    notificationPrefs,
    syncScoreZoneFromExecution,
    todayHealth,
    tasks,
    focusSessions,
    trackPrayers,
  } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (!authenticated) router.replace('/')
  }, [authenticated, router])

  useEffect(() => {
    if (authenticated) touchLastOpened()
  }, [authenticated, touchLastOpened])

  useEffect(() => {
    if (!authenticated) return
    syncScoreZoneFromExecution()
  }, [authenticated, syncScoreZoneFromExecution, todayHealth, tasks, focusSessions, trackPrayers])

  useEffect(() => {
    if (!authenticated) return
    void runWeeklyAiScorecardIfDue()
    void runWeeklyReportIfDue()
  }, [authenticated])

  useEffect(() => {
    if (!authenticated) return
    appendDailyNetSnapshot()
    if (notificationPrefs.proactiveInbox) runProactiveEvaluation()
  }, [authenticated, appendDailyNetSnapshot, runProactiveEvaluation, notificationPrefs.proactiveInbox])

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
      <VoiceCommandFab />
    </div>
  )
}
