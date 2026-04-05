'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { MicDictateButton } from '@/components/reflections/MicDictateButton'

type Keys = 'worked' | 'didnt' | 'avoided' | 'change' | 'grateful'

const FIELDS: { key: Keys; label: string; rows: number }[] = [
  { key: 'worked', label: 'What worked this week?', rows: 3 },
  { key: 'didnt', label: "What didn't work?", rows: 3 },
  { key: 'avoided', label: 'What did I avoid?', rows: 3 },
  { key: 'change', label: 'What will I change next week?', rows: 3 },
  { key: 'grateful', label: 'What am I grateful for?', rows: 2 },
]

function weekLabel(weekStart: string) {
  const s = new Date(weekStart + 'T12:00:00')
  return s.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export default function ReflectionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const { weeklyReflections, updateReflection, deleteReflection } = useStore()
  const r = useMemo(() => weeklyReflections.find((x) => x.id === id), [weeklyReflections, id])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<Keys, string> | null>(null)

  if (!r) {
    return (
      <PageTransition>
        <p className="text-[var(--text-dim)]">Reflection not found.</p>
        <Link href="/reflections" className="mt-4 text-[var(--accent)]">
          Back
        </Link>
      </PageTransition>
    )
  }

  if (editing && form) {
    return (
      <PageTransition>
        <div className="mx-auto max-w-xl space-y-6 pb-24">
          <Link href="/reflections" className="text-[14px] text-[var(--accent)]">
            ← Back
          </Link>
          <h1 className="text-[22px] font-bold text-[var(--text)]">Edit reflection</h1>
          <div className="space-y-5">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="mb-1.5 block text-[14px] font-medium text-[var(--text)]">{f.label}</label>
                <div className="flex gap-2">
                  <textarea
                    value={form[f.key]}
                    onChange={(e) => setForm((prev) => (prev ? { ...prev, [f.key]: e.target.value } : prev))}
                    rows={f.rows}
                    className="min-h-0 flex-1 resize-y rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[14px] text-[var(--text)]"
                  />
                  <MicDictateButton
                    onTranscript={(t) =>
                      setForm((prev) => (prev ? { ...prev, [f.key]: prev[f.key] ? `${prev[f.key]} ${t}` : t } : prev))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              updateReflection(id, form)
              setEditing(false)
              setForm(null)
              toast.success('Saved')
            }}
            className="w-full rounded-[14px] bg-[var(--accent)] py-3.5 text-[16px] font-semibold text-black"
          >
            Save Reflection
          </button>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-xl space-y-6 pb-24">
        <Link href="/reflections" className="text-[14px] text-[var(--accent)]">
          ← Back
        </Link>
        <div>
          <h1 className="headline text-[20px] font-semibold text-[var(--text)]">Week of {weekLabel(r.weekStart)}</h1>
          <p className="caption mt-1 text-[12px] text-[var(--text-dim)]">{new Date(r.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="space-y-4 text-[15px] leading-relaxed text-[var(--text-secondary)]">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[var(--text-dim)]">{f.label}</p>
              <p className="whitespace-pre-wrap text-[var(--text)]">{r[f.key] || '—'}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setForm({
                worked: r.worked,
                didnt: r.didnt,
                avoided: r.avoided,
                change: r.change,
                grateful: r.grateful,
              })
              setEditing(true)
            }}
            className="rounded-[12px] border border-[var(--border)] px-5 py-2.5 text-[14px] font-medium text-[var(--text)]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && !window.confirm('Delete this reflection?')) return
              deleteReflection(id)
              toast.success('Deleted')
              router.push('/reflections')
            }}
            className="rounded-[12px] border border-[var(--negative)]/50 px-5 py-2.5 text-[14px] font-medium text-[var(--negative)]"
          >
            Delete
          </button>
        </div>
      </div>
    </PageTransition>
  )
}
