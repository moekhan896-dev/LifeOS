import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 text-[var(--color-text)]">
      <Link href="/settings" className="text-sm text-[var(--color-accent)]">
        ← Back to settings
      </Link>
      <h1 className="mt-6 text-2xl font-bold">Privacy policy</h1>
      <p className="mt-4 text-[15px] text-[var(--color-text-mid)]">
        Placeholder. Replace with your privacy policy before production.
      </p>
    </div>
  )
}
