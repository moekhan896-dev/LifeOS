'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const cardAnim = (delay: number) => ({
  initial: { opacity: 0, y: 12 } as const,
  animate: { opacity: 1, y: 0 } as const,
  transition: { delay, duration: 0.35 },
})

const TIME_SLOTS = ['morning', 'afternoon', 'evening'] as const
const TIME_LABELS: Record<string, string> = { morning: 'Morning (6-12)', afternoon: 'Afternoon (12-6)', evening: 'Evening (6-10)' }
const LEVEL_LABELS = ['', 'Crashed', 'Low', 'Okay', 'Good', 'Peak']
const LEVEL_COLORS = ['', 'var(--rose)', 'var(--amber)', 'var(--text-dim)', 'var(--blue)', 'var(--accent)']

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[8px] border border-[var(--border)] p-2" style={{ background: 'var(--bg)' }}>
      <p className="text-[10px] text-[var(--text-dim)] mb-1">{label}</p>
      <p className="data text-[11px] font-semibold" style={{ color: 'var(--accent)' }}>
        Energy: {payload[0].value}/5
      </p>
    </div>
  )
}

const PATTERNS = [
  { icon: '🕌', text: "You're more productive on days you pray Fajr + exercise" },
  { icon: '🍔', text: 'Energy crashes 2-4pm on fast food days' },
  { icon: '🧠', text: 'Best focus hours: 9-11am after clean breakfast' },
]

export default function EnergyPage() {
  const { energyLogs, addEnergyLog, todayHealth, healthHistory } = useStore()
  const [selectedLevel, setSelectedLevel] = useState(3)
  const [selectedSlot, setSelectedSlot] = useState<typeof TIME_SLOTS[number]>(() => {
    const h = new Date().getHours()
    if (h < 12) return 'morning'
    if (h < 18) return 'afternoon'
    return 'evening'
  })

  const todayStr = new Date().toISOString().split('T')[0]
  const todayLogs = energyLogs.filter(l => l.date === todayStr)
  const latestLog = todayLogs.length > 0 ? todayLogs[todayLogs.length - 1] : null

  // Build chart data for today's arc
  const timePoints = [
    { time: '6am', hour: 6 }, { time: '8am', hour: 8 }, { time: '10am', hour: 10 },
    { time: '12pm', hour: 12 }, { time: '2pm', hour: 14 }, { time: '4pm', hour: 16 },
    { time: '6pm', hour: 18 }, { time: '8pm', hour: 20 }, { time: '10pm', hour: 22 },
  ]

  const chartData = timePoints.map(tp => {
    const slotForHour = tp.hour < 12 ? 'morning' : tp.hour < 18 ? 'afternoon' : 'evening'
    const log = todayLogs.find(l => l.timeOfDay === slotForHour)
    return { name: tp.time, energy: log ? log.level : null }
  })

  const handleLog = () => {
    addEnergyLog({ date: todayStr, timeOfDay: selectedSlot, level: selectedLevel })
    toast.success(`Logged ${LEVEL_LABELS[selectedLevel]} energy for ${selectedSlot}`)
  }

  const hasEnoughHistory = healthHistory.length >= 7
  const prayers = todayHealth.prayers

  return (
    <PageTransition>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div {...cardAnim(0)}>
          <h1 className="text-[22px] font-bold text-[var(--text)]">Energy Dashboard</h1>
          <p className="text-[13px] text-[var(--text-dim)] mt-1">Track your energy to find your peak hours</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Today's Energy Arc */}
          <motion.div {...cardAnim(0.05)} className="rounded-[16px] border border-[#1e2338] bg-[#0e1018] p-5 space-y-3">
            <h3 className="text-[14px] font-semibold text-[var(--text)]">Today&apos;s Energy Arc</h3>
            {todayLogs.length === 0 ? (
              <div className="h-[160px] flex items-center justify-center">
                <p className="text-[12px] text-[var(--text-dim)]">Log your energy to see the arc</p>
              </div>
            ) : (
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData.filter(d => d.energy !== null)}>
                    <defs>
                      <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-dim)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="energy" stroke="var(--accent)" fill="url(#energyGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>

          {/* Current Energy + Log */}
          <motion.div {...cardAnim(0.1)} className="rounded-[16px] border border-[#1e2338] bg-[#0e1018] p-5 space-y-4">
            <h3 className="text-[14px] font-semibold text-[var(--text)]">Log Energy Now</h3>

            {latestLog && (
              <div className="flex items-center gap-3 p-3 rounded-[10px] bg-[var(--surface2)]">
                <span className="data text-[28px] font-bold" style={{ color: LEVEL_COLORS[latestLog.level] }}>{latestLog.level}/5</span>
                <div>
                  <p className="text-[13px] font-semibold text-[var(--text)]">{LEVEL_LABELS[latestLog.level]}</p>
                  <p className="text-[11px] text-[var(--text-dim)]">Last: {latestLog.timeOfDay}</p>
                </div>
              </div>
            )}

            {/* Time slot selector */}
            <div className="flex gap-2">
              {TIME_SLOTS.map(slot => (
                <button key={slot} onClick={() => setSelectedSlot(slot)} className={`flex-1 px-3 py-2 rounded-[8px] text-[11px] font-semibold border transition-colors ${selectedSlot === slot ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] text-[var(--text-dim)]'}`}>
                  {slot.charAt(0).toUpperCase() + slot.slice(1)}
                </button>
              ))}
            </div>

            {/* Level selector */}
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(lvl => (
                <button key={lvl} onClick={() => setSelectedLevel(lvl)} className={`flex-1 py-2.5 rounded-[8px] text-[13px] font-bold border transition-colors ${selectedLevel === lvl ? 'border-[var(--accent)] text-black bg-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-dim)]'}`}>
                  {lvl}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--text-dim)] text-center">{LEVEL_LABELS[selectedLevel]}</p>

            <button onClick={handleLog} className="w-full px-4 py-2.5 rounded-[10px] text-[13px] font-semibold bg-[var(--accent)] text-black hover:opacity-90 transition-opacity">
              Log Energy
            </button>
          </motion.div>
        </div>

        {/* Energy Inputs */}
        <motion.div {...cardAnim(0.15)} className="rounded-[16px] border border-[#1e2338] bg-[#0e1018] p-5 space-y-3">
          <h3 className="text-[14px] font-semibold text-[var(--text)]">Today&apos;s Energy Inputs</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <InputCard label="Fajr" value={prayers.fajr} type="check" />
            <InputCard label="Gym" value={todayHealth.gym} type="check" />
            <InputCard label="Sleep" value={todayHealth.sleepTime ? `${todayHealth.sleepTime} - ${todayHealth.wakeTime || '?'}` : 'Not logged'} type="text" />
            <InputCard label="Meals" value={todayHealth.mealQuality || 'Not logged'} type="text" />
            <InputCard label="Energy Drinks" value={`${todayHealth.energyDrinks}`} type="text" />
            <InputCard label="Screen Time" value={`${todayHealth.screenTimeHours}h`} type="text" />
          </div>
        </motion.div>

        {/* Patterns */}
        <motion.div {...cardAnim(0.2)} className="rounded-[16px] border border-[#1e2338] bg-[#0e1018] p-5 space-y-3">
          <h3 className="text-[14px] font-semibold text-[var(--text)]">Patterns Detected</h3>
          {!hasEnoughHistory && (
            <p className="text-[12px] text-[var(--text-dim)]">Log 7+ days of health data to unlock real pattern detection. Showing example insights:</p>
          )}
          <div className="space-y-2">
            {PATTERNS.map((p, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-[10px] bg-[var(--surface2)] border border-[var(--border)]">
                <span className="text-[20px]">{p.icon}</span>
                <p className="text-[13px] text-[var(--text)] leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PageTransition>
  )
}

function InputCard({ label, value, type }: { label: string; value: any; type: 'check' | 'text' }) {
  return (
    <div className="rounded-[10px] bg-[var(--surface2)] border border-[var(--border)] p-3 text-center">
      <p className="text-[11px] text-[var(--text-dim)] mb-1">{label}</p>
      {type === 'check' ? (
        <span className={`text-[16px] font-bold ${value ? 'text-[var(--accent)]' : 'text-[var(--text-dim)]'}`}>
          {value ? '✓' : '—'}
        </span>
      ) : (
        <span className="data text-[13px] font-semibold text-[var(--text)]">{value}</span>
      )}
    </div>
  )
}
