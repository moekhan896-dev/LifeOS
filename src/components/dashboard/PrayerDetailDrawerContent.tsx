'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import type { HealthLog } from '@/stores/store'
import { getPrayerWindows12, type PrayerNameKey } from '@/lib/prayer-times'

const PRAYER_ORDER: PrayerNameKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']
const LABELS: Record<PrayerNameKey, string> = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
}

export interface PrayerDetailDrawerContentProps {
  todayStr: string
  todayHealth: HealthLog
  healthHistory: HealthLog[]
  trackPrayers: boolean
  togglePrayer: (p: PrayerNameKey) => void
  userLat: number | null
  userLng: number | null
  prayerCalcMethod: string
  prayerAsrHanafi: boolean
}

function prayerCount(h: HealthLog) {
  return Object.values(h.prayers).filter(Boolean).length
}

export default function PrayerDetailDrawerContent(p: PrayerDetailDrawerContentProps) {
  const windows = useMemo(() => {
    if (p.userLat == null || p.userLng == null) return null
    return getPrayerWindows12(p.userLat, p.userLng, new Date(), p.prayerCalcMethod, p.prayerAsrHanafi)
  }, [p.userLat, p.userLng, p.prayerCalcMethod, p.prayerAsrHanafi, p.todayStr])

  const prayerStreakStats = useMemo(() => {
    let current = 0
    let d = new Date(p.todayStr + 'T12:00:00')
    for (let i = 0; i < 400; i++) {
      const ds = d.toISOString().split('T')[0]
      const log = p.healthHistory.find((h) => h.date === ds)
      const c = log ? prayerCount(log) : 0
      if (c >= 5) {
        current++
        d.setDate(d.getDate() - 1)
      } else break
    }
    let run = 0
    let best = 0
    const byDate = [...p.healthHistory].filter((h) => h.date).sort((a, b) => a.date.localeCompare(b.date))
    for (const h of byDate) {
      if (prayerCount(h) >= 5) {
        run++
        best = Math.max(best, run)
      } else run = 0
    }
    best = Math.max(best, current)
    return { current, best }
  }, [p.healthHistory, p.todayStr])

  const heatmapDays = useMemo(() => {
    const out: { date: string; count: number; isToday: boolean }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const log = p.healthHistory.find((h) => h.date === ds)
      const count = log ? prayerCount(log) : 0
      out.push({ date: ds, count, isToday: ds === p.todayStr })
    }
    return out
  }, [p.healthHistory, p.todayStr])

  const aiCorr = useMemo(() => {
    const days = p.healthHistory.filter((h) => h.date && typeof h.dailyScore === 'number')
    if (days.length < 14) return null
    let fullScore = 0
    let fullN = 0
    let missScore = 0
    let missN = 0
    for (const h of days) {
      const c = prayerCount(h)
      if (c >= 5) {
        fullScore += h.dailyScore
        fullN++
      } else {
        missScore += h.dailyScore
        missN++
      }
    }
    if (fullN < 3 || missN < 3) return null
    return {
      fullAvg: fullScore / fullN,
      missAvg: missScore / missN,
    }
  }, [p.healthHistory])

  const weeklyPrayers = useMemo(() => {
    let n = 0
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const ds = d.toISOString().split('T')[0]
      const log = p.healthHistory.find((h) => h.date === ds)
      if (log) n += prayerCount(log)
    }
    return n
  }, [p.healthHistory])

  const monthlyTrend = useMemo(() => {
    return heatmapDays.map((d) => ({
      day: d.date.slice(8),
      count: d.count,
      date: d.date,
    }))
  }, [heatmapDays])

  const lastMiss = useMemo(() => {
    const sorted = [...p.healthHistory]
      .filter((h) => h.date)
      .sort((a, b) => b.date.localeCompare(a.date))
    for (const h of sorted) {
      if (prayerCount(h) < 5) return h.date
    }
    return null
  }, [p.healthHistory])

  if (!p.trackPrayers) {
    return (
      <p className="text-[14px] text-[var(--text-secondary)]">
        Enable prayer tracking in Settings to use this detail view.
      </p>
    )
  }

  return (
    <div className="space-y-6 pb-4">
      {!windows && (
        <p className="text-[13px] text-[var(--text-dim)]">
          Set your location in Settings so adhan.js can compute time windows.
        </p>
      )}

      <div className="space-y-3">
        {PRAYER_ORDER.map((key) => {
          const win = windows?.[key]
          const line = win ? `${LABELS[key]}: ${win.start} – ${win.end}` : `${LABELS[key]}: —`
          return (
            <div
              key={key}
              className="flex min-h-[80px] w-full flex-col justify-center rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-3"
            >
              <p className="text-[16px] font-semibold text-[var(--text-primary)]">{LABELS[key]}</p>
              <p className="mt-1 font-mono text-[12px] text-[var(--text-secondary)]">{line}</p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  p.togglePrayer(key)
                  toast.success(
                    p.todayHealth.prayers[key] ? `${LABELS[key]} unmarked` : `${LABELS[key]} marked as prayed`
                  )
                }}
                className="mt-3 w-full rounded-[10px] bg-[var(--accent)]/20 py-2.5 text-[14px] font-semibold text-[var(--accent)]"
              >
                {p.todayHealth.prayers[key] ? 'Unmark' : 'Mark as prayed'}
              </motion.button>
            </div>
          )
        })}
      </div>

      <div>
        <p className="mb-2 text-[13px] font-semibold text-[var(--text-secondary)]">30-day consistency</p>
        <div className="grid grid-cols-5 gap-1.5">
          {heatmapDays.map((d) => {
            let bg = 'var(--surface2)'
            if (d.count >= 5) bg = 'rgba(255, 215, 0, 0.55)'
            else if (d.count >= 3) bg = 'rgba(255, 215, 0, 0.28)'
            else if (d.count >= 1) bg = 'rgba(255, 215, 0, 0.12)'
            else bg = 'rgba(100, 100, 100, 0.35)'
            return (
              <div
                key={d.date}
                title={`${d.date}: ${d.count}/5`}
                className="aspect-square rounded-md"
                style={{
                  background: bg,
                  boxShadow: d.isToday ? '0 0 0 2px var(--accent)' : undefined,
                }}
              />
            )
          })}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--border)] p-3">
          <p className="text-[11px] text-[var(--text-tertiary)]">Current streak</p>
          <p className="font-mono text-[20px] text-[var(--gold)]">{prayerStreakStats.current}d</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] p-3">
          <p className="text-[11px] text-[var(--text-tertiary)]">Best ever</p>
          <p className="font-mono text-[20px] text-[var(--text-primary)]">{prayerStreakStats.best}d</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] p-3">
          <p className="text-[11px] text-[var(--text-tertiary)]">Last miss (5/5)</p>
          <p className="text-[14px] text-[var(--text-secondary)]">{lastMiss ?? '—'}</p>
        </div>
      </div>

      {aiCorr && (
        <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
          On days you pray all 5: score averages {aiCorr.fullAvg.toFixed(0)}%. On days you miss: {aiCorr.missAvg.toFixed(0)}%.
        </p>
      )}

      <p className="text-[13px] text-[var(--text-secondary)]">
        This week: <span className="font-mono font-semibold text-[var(--gold)]">{weeklyPrayers}</span> prayers logged
        (max 35).
      </p>

      <div>
        <p className="mb-2 text-[13px] font-semibold text-[var(--text-secondary)]">30-day trend</p>
        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient id="prayerFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="day" tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} />
              <YAxis domain={[0, 5]} tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-[12px]">
                      <p className="font-mono">{payload[0].payload.date}</p>
                      <p>{payload[0].value}/5 prayers</p>
                    </div>
                  ) : null
                }
              />
              <Area type="monotone" dataKey="count" stroke="var(--gold)" fill="url(#prayerFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
