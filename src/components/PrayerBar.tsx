'use client'

import { useStore } from '@/stores/store'
import type { HealthLog } from '@/stores/store'

const PRAYERS: { key: keyof HealthLog['prayers']; label: string }[] = [
  { key: 'fajr', label: 'Fajr' },
  { key: 'dhuhr', label: 'Dhuhr' },
  { key: 'asr', label: 'Asr' },
  { key: 'maghrib', label: 'Maghrib' },
  { key: 'isha', label: 'Isha' },
]

interface PrayerBarProps {
  times?: Record<string, string>
}

export default function PrayerBar({ times = {} }: PrayerBarProps) {
  const { todayHealth, togglePrayer } = useStore()
  const prayers = todayHealth.prayers
  const count = Object.values(prayers).filter(Boolean).length

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="label text-[10px] text-[var(--text-dim)]">PRAYERS</span>
        <span className="data text-[12px] font-semibold" style={{ color: count === 5 ? 'var(--gold)' : 'var(--text-mid)' }}>
          {count}/5
        </span>
      </div>
      <div className="flex gap-2">
        {PRAYERS.map(({ key, label }) => {
          const active = prayers[key]
          return (
            <button
              key={key}
              onClick={() => togglePrayer(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border transition-all duration-200 hover:scale-[1.04] ${
                active
                  ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40 text-[var(--gold)]'
                  : 'bg-[var(--surface2)] border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text-mid)]'
              }`}
            >
              <span className="text-[12px] font-medium">{label}</span>
              {times[key] && (
                <span className="data text-[10px] opacity-70">{times[key]}</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
