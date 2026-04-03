'use client'

import { motion } from 'framer-motion'
import { useStore } from '@/stores/store'
import type { HealthLog } from '@/stores/store'
import { toast } from 'sonner'

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

  const handleToggle = (key: keyof HealthLog['prayers']) => {
    togglePrayer(key)
    const willBeActive = !prayers[key]
    if (willBeActive) toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} prayed`)
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="label text-[10px] text-[var(--text-dim)]">PRAYERS</span>
        <motion.span
          key={count}
          className="data text-[12px] font-semibold"
          style={{ color: count === 5 ? 'var(--gold)' : 'var(--text-mid)' }}
          initial={{ scale: 1.3, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        >
          {count}/5
        </motion.span>
      </div>
      <div className="flex gap-1.5">
        {PRAYERS.map(({ key, label }) => {
          const active = prayers[key]
          return (
            <motion.button
              key={key}
              onClick={() => handleToggle(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg border ${
                active
                  ? 'border-[var(--gold)]/40 text-[var(--gold)]'
                  : 'bg-[var(--surface2)] border-[var(--border)] text-[var(--text-dim)] hover:text-[var(--text-mid)]'
              }`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <motion.div
                className="absolute inset-0 rounded-lg"
                animate={{
                  backgroundColor: active ? 'rgba(234,179,8,0.1)' : 'rgba(0,0,0,0)',
                }}
                transition={{ duration: 0.25 }}
                style={{ position: 'absolute', inset: 0, borderRadius: '0.5rem' }}
              />
              <span className="relative text-[12px] font-medium">{label}</span>
              {times[key] && (
                <span className="relative data text-[10px] opacity-70">{times[key]}</span>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
