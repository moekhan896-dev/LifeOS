'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { MicDictateButton } from '@/components/reflections/MicDictateButton'

function getWeekStart(d = new Date()): string {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  x.setDate(x.getDate() + diff)
  x.setHours(0, 0, 0, 0)
  return x.toISOString().split('T')[0]
}

type Keys = 'worked' | 'didnt' | 'avoided' | 'change' | 'grateful'

const FIELDS: { key: Keys; label: string; rows: number }[] = [
  { key: 'worked', label: 'What worked this week?', rows: 3 },
  { key: 'didnt', label: "What didn't work?", rows: 3 },
  { key: 'avoided', label: 'What did I avoid?', rows: 3 },
  { key: 'change', label: 'What will I change next week?', rows: 3 },
  { key: 'grateful', label: 'What am I grateful for?', rows: 2 },
]

export default function NewReflectionPage() {
  const router = useRouter()
  const { addReflection } = useStore()
  const [form, setForm] = useState<Record<Keys, string>>({
    worked: '',
    didnt: '',
    avoided: '',
    change: '',
    grateful: '',
  })

  const save = () => {
    if (!form.worked && !form.didnt && !form.avoided && !form.change && !form.grateful) {
      toast.error('Write at least one field')
      return
    }
    addReflection({ weekStart: getWeekStart(), ...form })
    toast.success('Reflection saved')
    router.push('/reflections')
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-xl space-y-6 pb-24">
        <div className="flex items-center gap-3">
          <Link href="/reflections" className="text-[14px] text-[var(--accent)]">
            ← Back
          </Link>
        </div>
        <h1 className="text-[24px] font-bold text-[var(--text)]">New reflection</h1>
        <div className="space-y-5">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-[14px] font-medium text-[var(--text)]">{f.label}</label>
              <div className="flex gap-2">
                <textarea
                  value={form[f.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  rows={f.rows}
                  className="min-h-0 flex-1 resize-y rounded-[12px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[14px] text-[var(--text)]"
                />
                <MicDictateButton onTranscript={(t) => setForm((prev) => ({ ...prev, [f.key]: prev[f.key] ? `${prev[f.key]} ${t}` : t }))} />
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={save}
          className="w-full rounded-[14px] bg-[var(--accent)] py-3.5 text-[16px] font-semibold text-black"
        >
          Save Reflection
        </button>
      </div>
    </PageTransition>
  )
}
