'use client'

import Link from 'next/link'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'

export default function OnboardingUpdatePage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Update my info</h1>
        <Link href="/settings" className="text-sm text-[var(--color-accent)]">
          ← Back to Settings
        </Link>
      </div>
      <p className="text-sm text-[var(--color-text-dim)] max-w-xl">
        Review what ART OS knows about you. Tap Edit on any section to change it, then save.
      </p>
      <div className="-mx-4 max-w-[1280px] md:-mx-5">
        <OnboardingWizard mode="profileUpdate" />
      </div>
    </div>
  )
}
