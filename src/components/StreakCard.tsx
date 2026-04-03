'use client'

interface StreakCardProps {
  habit: string
  streak: number
  longest: number
  icon: string
}

export default function StreakCard({ habit, streak, longest, icon }: StreakCardProps) {
  return (
    <div
      className={`bg-[var(--surface)] border rounded-[10px] p-4 transition-all duration-200 hover:scale-[1.02] ${
        streak > 0
          ? 'border-[var(--border-glow)] animate-pulse-border'
          : 'border-[var(--border)]'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[var(--text)] font-medium truncate">
            {habit}
            {streak > 7 && <span className="ml-1.5">🔥</span>}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="data text-2xl font-bold text-[var(--accent)]">{streak}</span>
            <span className="data text-xs text-[var(--text-dim)]">days</span>
          </div>
          <div className="data text-[10px] text-[var(--text-dim)] mt-0.5">
            best: {longest}
          </div>
        </div>
      </div>
    </div>
  )
}
