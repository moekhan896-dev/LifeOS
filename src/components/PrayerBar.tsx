'use client'

import { motion, AnimatePresence } from 'framer-motion'
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

  const allActive = count === 5

  return (
    <div className="card-sacred relative bg-[var(--surface)] border border-[var(--border)] rounded-[16px] p-4 overflow-hidden">
      {/* Golden shimmer when all 5 prayed */}
      <AnimatePresence>
        {allActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.15, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-[16px] pointer-events-none"
            style={{ background: 'linear-gradient(135deg, transparent 30%, rgba(234,179,8,0.3) 50%, transparent 70%)' }}
          />
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-3">
        <span className="label text-[10px]" style={{ color: 'var(--gold, #d4a017)' }}>PRAYERS</span>
        <motion.span
          key={count}
          className="data text-[12px] font-semibold"
          style={{ color: count === 5 ? 'var(--gold)' : 'var(--text-mid)' }}
          initial={{ scale: 1.3, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {count}/5
        </motion.span>
      </div>

      <div className="flex gap-2">
        {PRAYERS.map(({ key, label }) => {
          const active = prayers[key]
          return (
            <motion.button
              key={key}
              onClick={() => handleToggle(key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-[12px] border relative ${
                active
                  ? 'border-[var(--gold)]/40 text-[var(--gold)]'
                  : 'bg-[var(--surface2)] border-[var(--gold)]/20 text-[var(--gold)]/60 hover:text-[var(--gold)]/80'
              }`}
              style={active ? {
                backgroundColor: 'rgba(234,179,8,0.1)',
                boxShadow: '0 0 16px rgba(234,179,8,0.3), 0 0 4px rgba(234,179,8,0.15)',
              } : undefined}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <span className="relative text-[12px] font-semibold">{label}</span>
              {times[key] && (
                <span className="relative data text-[10px] opacity-60">{times[key]}</span>
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
