'use client'

import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold text-white/80">Settings</h1>
      <button
        onClick={() => router.back()}
        className="text-sm text-emerald-400 hover:text-emerald-300"
      >
        &larr; Back
      </button>
    </div>
  )
}
