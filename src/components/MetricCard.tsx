'use client'

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  color?: string
  icon?: string
}

export default function MetricCard({ label, value, sub, color, icon }: MetricCardProps) {
  return (
    <div
      className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 transition-all duration-200 hover:border-[var(--border-glow)] hover:scale-[1.01] group"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="label text-[10px] text-[var(--text-dim)]">{label}</span>
        {icon && <span className="text-sm opacity-60 group-hover:opacity-100 transition-opacity">{icon}</span>}
      </div>
      <div className="data text-2xl font-bold" style={{ color: color || 'var(--text)' }}>
        {value}
      </div>
      {sub && (
        <div className="text-[12px] text-[var(--text-mid)] mt-1">{sub}</div>
      )}
    </div>
  )
}
