'use client'

import { useMemo } from 'react'
import { useStore } from '@/stores/store'

const PRAYERS = [
  { key: 'fajr' as const, name: 'Fajr', time: '5:47 AM' },
  { key: 'dhuhr' as const, name: 'Dhuhr', time: '1:15 PM' },
  { key: 'asr' as const, name: 'Asr', time: '4:48 PM' },
  { key: 'maghrib' as const, name: 'Maghrib', time: '7:52 PM' },
  { key: 'isha' as const, name: 'Isha', time: '9:15 PM' },
]

function Section({ title, icon, children, delay = 0 }: { title: string; icon: string; children: React.ReactNode; delay?: number }) {
  return (
    <div
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-5 animate-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span className="text-lg">{icon}</span>
        <h2 className="text-[14px] font-bold tracking-tight text-[var(--text)] uppercase">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function HealthPage() {
  const {
    todayHealth, updateHealth, togglePrayer,
    streaks, xp, level, tasks, addXp,
  } = useStore()

  const prayerStreak = streaks.find((s) => s.habit === 'prayer')
  const gymStreak = streaks.find((s) => s.habit === 'gym')
  const sleepStreak = streaks.find((s) => s.habit === 'sleep')

  // Daily Score Calculation
  const prayerCount = Object.values(todayHealth.prayers).filter(Boolean).length
  const prayerScore = prayerCount * 7 // 35 max
  const gymScore = todayHealth.gym ? 10 : 0
  const sleepScore = (() => {
    if (!todayHealth.sleepTime) return 0
    const [h] = todayHealth.sleepTime.split(':').map(Number)
    return h < 24 && h >= 20 ? 8 : h < 20 ? 8 : 0 // before midnight
  })()
  const mealScore = todayHealth.mealQuality === 'good' ? 7 : todayHealth.mealQuality === 'okay' ? 4 : todayHealth.mealQuality === 'bad' ? 1 : 0
  const healthScore = gymScore + sleepScore + mealScore // 25 max

  const completedTasks = tasks.filter((t) => {
    if (!t.completedAt) return false
    return t.completedAt.startsWith(new Date().toISOString().split('T')[0])
  }).length
  const totalTasks = tasks.filter((t) => {
    const due = t.dueDate || t.createdAt.split('T')[0]
    return due <= new Date().toISOString().split('T')[0]
  }).length
  const productivityScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 40) : 0 // 40 max

  const dailyScore = prayerScore + healthScore + productivityScore
  const xpToNext = 500 - (xp % 500)
  const xpProgress = ((xp % 500) / 500) * 100

  return (
    <div className="p-6 md:p-10 max-w-[960px] mx-auto space-y-5">
      {/* Header */}
      <div className="animate-in mb-2">
        <h1 className="text-[22px] font-bold tracking-tight text-[var(--text)]">HEALTH & DEEN</h1>
        <p className="text-[13px] text-[var(--text-mid)] mt-1">Body, soul, and discipline. Every day counts.</p>
      </div>

      {/* ── Daily Score ── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[12px] p-6 animate-in text-center" style={{ animationDelay: '50ms' }}>
        <p className="label mb-2">Daily Score</p>
        <p className="data text-[56px] font-black text-[var(--accent)] leading-none">{dailyScore}</p>
        <p className="text-[13px] text-[var(--text-dim)] mt-1">/100</p>
        {/* Progress bar */}
        <div className="w-full max-w-[400px] mx-auto mt-4 h-2.5 bg-[var(--surface2)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${dailyScore}%`,
              background: dailyScore >= 80 ? 'var(--accent)' : dailyScore >= 50 ? 'var(--amber)' : 'var(--rose)',
            }}
          />
        </div>
        <div className="flex justify-center gap-6 mt-4 text-[11px]">
          <span className="text-[var(--text-mid)]">Prayer <span className="data text-[var(--text)]">{prayerScore}/35</span></span>
          <span className="text-[var(--text-mid)]">Health <span className="data text-[var(--text)]">{healthScore}/25</span></span>
          <span className="text-[var(--text-mid)]">Productivity <span className="data text-[var(--text)]">{productivityScore}/40</span></span>
        </div>
      </div>

      {/* ── Prayer Tracker ── */}
      <Section title="Prayer Tracker" icon="🕌" delay={100}>
        <div className="grid grid-cols-5 gap-2 md:gap-3">
          {PRAYERS.map((p) => {
            const prayed = todayHealth.prayers[p.key]
            return (
              <button
                key={p.key}
                onClick={() => togglePrayer(p.key)}
                className={`flex flex-col items-center gap-1.5 p-3 md:p-4 rounded-[10px] border transition-all duration-200 ${
                  prayed
                    ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40 shadow-[0_0_12px_var(--gold)/10]'
                    : 'bg-[var(--surface2)] border-[var(--border)] hover:border-[var(--border-glow)]'
                }`}
              >
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  prayed ? 'bg-[var(--gold)] border-[var(--gold)] text-black' : 'border-[var(--text-dim)]'
                }`}>
                  {prayed && (
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-[12px] md:text-[13px] font-semibold text-[var(--text)]">{p.name}</span>
                <span className="label text-[10px]">{p.time}</span>
              </button>
            )
          })}
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[var(--text-mid)]">Streak:</span>
            <span className="data text-[16px] font-bold text-[var(--gold)]">{prayerStreak?.currentStreak || 0} days</span>
          </div>
          <p className="text-[12px] text-[var(--text-dim)] italic max-w-[260px] text-right">
            Your dad hasn&apos;t missed a prayer in 20 years.
          </p>
        </div>
      </Section>

      {/* ── Gym Tracker ── */}
      <Section title="Gym Tracker" icon="💪" delay={150}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateHealth({ gym: !todayHealth.gym })}
              className={`px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                todayHealth.gym
                  ? 'bg-[var(--accent)] text-black shadow-[0_0_16px_var(--accent)/20]'
                  : 'bg-[var(--surface2)] border border-[var(--border)] text-[var(--text-mid)] hover:border-[var(--accent)]'
              }`}
            >
              {todayHealth.gym ? '✓ Workout Logged' : 'Log Workout'}
            </button>
            <span className="text-[13px] text-[var(--text-mid)]">
              Streak: <span className="data font-bold text-[var(--accent)]">{gymStreak?.currentStreak || 0}</span>
            </span>
          </div>
          <div className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-4 py-2">
            <p className="text-[12px] text-[var(--text-mid)] italic">Go to gym. No excuses.</p>
          </div>
        </div>
      </Section>

      {/* ── Sleep Tracker ── */}
      <Section title="Sleep Tracker" icon="😴" delay={200}>
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-4">
            <div>
              <label className="label block mb-1.5">Bed Time</label>
              <input
                type="time"
                value={todayHealth.sleepTime || ''}
                onChange={(e) => updateHealth({ sleepTime: e.target.value })}
                className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="label block mb-1.5">Wake Time</label>
              <input
                type="time"
                value={todayHealth.wakeTime || ''}
                onChange={(e) => updateHealth({ wakeTime: e.target.value })}
                className="bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[13px] text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[var(--text-dim)]">Target: <span className="text-[var(--amber)] font-semibold">Before 12 AM</span></span>
            <span className="text-[13px] text-[var(--text-mid)]">
              Streak: <span className="data font-bold text-[var(--cyan)]">{sleepStreak?.currentStreak || 0}</span>
            </span>
          </div>
        </div>
      </Section>

      {/* ── Meal Tracker ── */}
      <Section title="Meal Tracker" icon="🍽️" delay={250}>
        <div className="flex gap-3">
          {([
            { key: 'good' as const, label: 'Good', color: 'var(--accent)', emoji: '🥗' },
            { key: 'okay' as const, label: 'Okay', color: 'var(--amber)', emoji: '🍲' },
            { key: 'bad' as const, label: 'Fast Food', color: 'var(--rose)', emoji: '🍔' },
          ]).map((m) => {
            const active = todayHealth.mealQuality === m.key
            return (
              <button
                key={m.key}
                onClick={() => updateHealth({ mealQuality: m.key })}
                className={`flex-1 py-3 rounded-lg text-[13px] font-semibold transition-all duration-200 border ${
                  active
                    ? `border-transparent shadow-[0_0_12px_${m.color}/15]`
                    : 'bg-[var(--surface2)] border-[var(--border)] text-[var(--text-mid)] hover:border-[var(--border-glow)]'
                }`}
                style={active ? { background: `color-mix(in srgb, ${m.color} 15%, transparent)`, color: m.color, borderColor: `color-mix(in srgb, ${m.color} 40%, transparent)` } : undefined}
              >
                {m.emoji} {m.label}
              </button>
            )
          })}
        </div>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ── Energy Drink Counter ── */}
        <Section title="Energy Drinks" icon="⚡" delay={300}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateHealth({ energyDrinks: Math.max(0, todayHealth.energyDrinks - 1) })}
                className="w-9 h-9 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center text-lg font-bold hover:border-[var(--border-glow)] transition-colors"
              >
                -
              </button>
              <span className={`data text-[28px] font-black ${todayHealth.energyDrinks === 0 ? 'text-[var(--accent)]' : 'text-[var(--rose)]'}`}>
                {todayHealth.energyDrinks}
              </span>
              <button
                onClick={() => updateHealth({ energyDrinks: todayHealth.energyDrinks + 1 })}
                className="w-9 h-9 rounded-lg bg-[var(--surface2)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center text-lg font-bold hover:border-[var(--border-glow)] transition-colors"
              >
                +
              </button>
            </div>
            <span className="label">Target: <span className="text-[var(--accent)]">0</span></span>
          </div>
        </Section>

        {/* ── Screen Time Log ── */}
        <Section title="Screen Time" icon="📱" delay={350}>
          <div className="flex items-center justify-between gap-4">
            <input
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={todayHealth.screenTimeHours}
              onChange={(e) => updateHealth({ screenTimeHours: parseFloat(e.target.value) })}
              className="flex-1 accent-[var(--cyan)]"
            />
            <span className={`data text-[20px] font-bold min-w-[48px] text-right ${todayHealth.screenTimeHours <= 2 ? 'text-[var(--accent)]' : todayHealth.screenTimeHours <= 5 ? 'text-[var(--amber)]' : 'text-[var(--rose)]'}`}>
              {todayHealth.screenTimeHours}h
            </span>
          </div>
          <p className="label mt-2">Target: <span className="text-[var(--cyan)]">&lt; 2 hours productive</span></p>
        </Section>
      </div>

      {/* ── Gamification ── */}
      <Section title="Gamification" icon="🎮" delay={400}>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="text-center">
            <p className="label mb-1">Total XP</p>
            <p className="data text-[28px] font-black text-[var(--purple)]">{xp}</p>
          </div>
          <div className="text-center">
            <p className="label mb-1">Level</p>
            <p className="data text-[28px] font-black text-[var(--gold)]">{level}</p>
          </div>
          <div className="flex-1 w-full">
            <div className="flex justify-between mb-1.5">
              <span className="label">Progress to Level {level + 1}</span>
              <span className="label text-[var(--purple)]">{xpToNext} XP to go</span>
            </div>
            <div className="h-3 bg-[var(--surface2)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--purple)] transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
        {/* Streak Badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[var(--border)]">
          {streaks.map((s) => (
            <div
              key={s.habit}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border ${
                s.currentStreak > 0
                  ? 'bg-[var(--gold)]/10 border-[var(--gold)]/30 text-[var(--gold)]'
                  : 'bg-[var(--surface2)] border-[var(--border)] text-[var(--text-dim)]'
              }`}
            >
              🔥 {s.habit} — {s.currentStreak}d (best: {s.longestStreak}d)
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
