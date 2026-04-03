'use client'

import { useState } from 'react'
import MetricCard from '@/components/MetricCard'
import StreakCard from '@/components/StreakCard'
import PrayerBar from '@/components/PrayerBar'
import InsightCard from '@/components/InsightCard'
import TaskItem from '@/components/TaskItem'
import CommandInput from '@/components/CommandInput'
import { useStore } from '@/stores/store'
import { CLIENTS, GMB_PROFILES } from '@/lib/constants'

const PRAYER_TIMES: Record<string, string> = {
  fajr: '5:47',
  dhuhr: '1:15',
  asr: '4:48',
  maghrib: '7:52',
  isha: '9:15',
}

const STREAK_META: Record<string, { label: string; icon: string }> = {
  prayer: { label: 'Prayer', icon: '🕌' },
  gym: { label: 'Gym', icon: '🏋️' },
  sleep: { label: 'Sleep Before 12am', icon: '😴' },
  no_gamble: { label: 'No Gambling', icon: '🚫' },
  cold_email: { label: 'Cold Email Active', icon: '📧' },
}

const COST_OF_INACTION = [
  { label: 'Sleeping until noon (missed calls × $700)', amount: 2100 },
  { label: 'Phone scrolling 5hrs × $0/hr earned', amount: 0 },
  { label: 'Not doing cold email (est 2 clients × $2K)', amount: 4000 },
  { label: 'Not SEO-ing GMBs (est 10 leads/mo × $700)', amount: 7000 },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function daysUntilTarget() {
  const target = new Date('2026-10-01')
  const now = new Date()
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

const GMB_STATUS_STYLES: Record<string, string> = {
  strong: 'bg-[var(--accent)]/20 text-[var(--accent)]',
  medium: 'bg-[var(--amber)]/20 text-[var(--amber)]',
  new: 'bg-[var(--text-dim)]/20 text-[var(--text-dim)]',
}

export default function DashboardPage() {
  const { tasks, insights, todayHealth, streaks, addTask } = useStore()
  const [newTaskText, setNewTaskText] = useState('')

  const todayStr = new Date().toISOString().split('T')[0]
  const tasksDoneToday = tasks.filter(
    (t) => t.done && t.completedAt?.startsWith(todayStr)
  ).length
  const prayersDone = Object.values(todayHealth.prayers).filter(Boolean).length

  const priorityOrder: Record<string, number> = { crit: 0, high: 1, med: 2, low: 3 }
  const incompleteTasks = [...tasks]
    .filter((t) => !t.done)
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  const theOneThing = incompleteTasks[0]

  const clientTotals = CLIENTS.reduce(
    (acc, c) => ({
      gross: acc.gross + c.gross,
      adSpend: acc.adSpend + c.adSpend,
      stripe: acc.stripe + c.stripe,
      net: acc.net + c.net,
    }),
    { gross: 0, adSpend: 0, stripe: 0, net: 0 }
  )

  const awsConcentration = ((CLIENTS[0].net / clientTotals.net) * 100).toFixed(0)

  const coiTotal = COST_OF_INACTION.reduce((s, c) => s + c.amount, 0)

  const activeInsights = insights
    .filter((i) => !i.snoozedUntil || new Date(i.snoozedUntil) < new Date())
    .slice(0, 5)

  let animIdx = 0

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskText.trim()) return
    addTask({
      businessId: 'agency',
      text: newTaskText.trim(),
      tag: '',
      priority: 'med',
      done: false,
      xpValue: 20,
    })
    setNewTaskText('')
  }

  return (
    <div className="space-y-6 pb-24">
      {/* ── Top Bar ── */}
      <div className="animate-in flex flex-col gap-4 md:flex-row md:items-center md:justify-between" style={{ animationDelay: `${0.05 * animIdx++}s` }}>
        <h1 className="text-2xl font-bold text-[var(--text)]">
          {getGreeting()}, Art
        </h1>
        <span className="data text-sm text-[var(--text-dim)]">{formatDate()}</span>
      </div>

      <div className="animate-in" style={{ animationDelay: `${0.05 * animIdx++}s` }}>
        <PrayerBar times={PRAYER_TIMES} />
      </div>

      {/* ── THE ONE THING ── */}
      <div
        className="animate-in relative rounded-[12px] p-[1px]"
        style={{
          animationDelay: `${0.05 * animIdx++}s`,
          background: 'linear-gradient(135deg, var(--accent), var(--cyan))',
        }}
      >
        <div className="bg-[var(--bg)] rounded-[11px] p-6">
          <span className="label text-[10px] tracking-widest text-[var(--accent)]">THE ONE THING</span>
          <p className="text-[12px] text-[var(--text-dim)] mt-1 mb-3">
            If you do only one thing today, do this.
          </p>
          <p className="data text-xl font-bold text-[var(--text)]">
            {theOneThing ? theOneThing.text : 'Add your first task to get started.'}
          </p>
        </div>
      </div>

      {/* ── Metrics Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'NET TAKE-HOME', value: '$15,268', sub: 'March 2026', color: 'var(--accent)', icon: '💰' },
          { label: 'AGENCY NET MRR', value: '$15,269', sub: '6 clients', color: 'var(--accent)', icon: '⬡' },
          { label: 'PLUMBING REV', value: '~$18K', sub: '9 GMB profiles', color: 'var(--cyan)', icon: '🔧' },
          { label: 'TASKS DONE TODAY', value: tasksDoneToday, sub: `${incompleteTasks.length} remaining`, color: 'var(--blue)', icon: '✓' },
          { label: 'PRAYERS TODAY', value: `${prayersDone}/5`, sub: prayersDone === 5 ? 'All prayed' : `${5 - prayersDone} remaining`, color: 'var(--gold)', icon: '🕌' },
        ].map((m, i) => (
          <div key={m.label} className="animate-in" style={{ animationDelay: `${0.05 * (animIdx + i)}s` }}>
            <MetricCard {...m} />
          </div>
        ))}
      </div>
      {(animIdx += 5) && null}

      {/* ── Streaks Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {streaks.map((s, i) => {
          const meta = STREAK_META[s.habit] || { label: s.habit, icon: '🔥' }
          return (
            <div key={s.habit} className="animate-in" style={{ animationDelay: `${0.05 * (animIdx + i)}s` }}>
              <StreakCard habit={meta.label} streak={s.currentStreak} longest={s.longestStreak} icon={meta.icon} />
            </div>
          )
        })}
      </div>
      {(animIdx += 5) && null}

      {/* ── Days of Execution + Cost of Inaction ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Days of Execution */}
        <div className="animate-in bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-5" style={{ animationDelay: `${0.05 * animIdx++}s` }}>
          <span className="label text-[10px] text-[var(--text-dim)]">DAYS OF EXECUTION REMAINING</span>
          <div className="data text-4xl font-bold text-[var(--accent)] mt-2">{daysUntilTarget()}</div>
          <p className="text-[12px] text-[var(--text-mid)] mt-1">
            days to <span className="text-[var(--text)] font-semibold">$50K/mo</span> target (Oct 1, 2026)
          </p>
          <div className="mt-3 flex items-center gap-3 text-[11px]">
            <span className="text-[var(--text-dim)]">Current: <span className="data text-[var(--amber)] font-semibold">$15K/mo</span></span>
            <span className="text-[var(--text-dim)]">→</span>
            <span className="text-[var(--text-dim)]">Target: <span className="data text-[var(--accent)] font-semibold">$50K/mo</span></span>
          </div>
        </div>

        {/* Cost of Inaction */}
        <div className="animate-in bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-5" style={{ animationDelay: `${0.05 * animIdx++}s` }}>
          <span className="label text-[10px] text-[var(--text-dim)]">COST OF INACTION</span>
          <div className="space-y-2 mt-3">
            {COST_OF_INACTION.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-[12px]">
                <span className="text-[var(--text-mid)]">{item.label}</span>
                <span className="data font-semibold text-[var(--rose)]">
                  {item.amount > 0 ? `-$${item.amount.toLocaleString()}/mo` : '$0'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="label text-[11px] text-[var(--text-dim)]">TOTAL LOST / MONTH</span>
            <span className="data text-lg font-bold text-[var(--rose)]">-${coiTotal.toLocaleString()}/mo</span>
          </div>
        </div>
      </div>

      {/* ── Two-Column: Insights + Tasks ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
        {/* Insights Feed */}
        <div className="animate-in space-y-3" style={{ animationDelay: `${0.05 * animIdx++}s` }}>
          <h2 className="label text-[10px] text-[var(--text-dim)] tracking-widest">PROACTIVE INSIGHTS</h2>
          {activeInsights.length > 0 ? (
            activeInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))
          ) : (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-6 text-center text-[13px] text-[var(--text-dim)]">
              Insights will appear here once the AI engine runs.
            </div>
          )}
        </div>

        {/* Today's Priority Tasks */}
        <div className="animate-in space-y-2" style={{ animationDelay: `${0.05 * animIdx++}s` }}>
          <h2 className="label text-[10px] text-[var(--text-dim)] tracking-widest">TODAY&apos;S PRIORITY TASKS</h2>
          {incompleteTasks.slice(0, 8).map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
          {incompleteTasks.length === 0 && (
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-6 text-center text-[13px] text-[var(--text-dim)]">
              No tasks yet. Add one below.
            </div>
          )}
          <form onSubmit={handleAddTask} className="mt-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="+ Add a task..."
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[10px] px-3 py-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text-dim)] outline-none transition-all duration-200 focus:border-[var(--border-glow)]"
            />
          </form>
        </div>
      </div>

      {/* ── Client Financial Table ── */}
      <div className="animate-in" style={{ animationDelay: `${0.05 * animIdx++}s` }}>
        <h2 className="label text-[10px] text-[var(--text-dim)] tracking-widest mb-3">CLIENT FINANCIALS</h2>
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[10px] overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['Client', 'Gross/mo', 'Ad Spend', 'Stripe 3%', 'Net to Art', 'Service', 'Meeting Freq'].map((h) => (
                  <th key={h} className="label text-[10px] text-[var(--text-dim)] text-left px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map((c, i) => (
                <tr key={c.name} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface2)] transition-colors">
                  <td className="px-4 py-3 text-[var(--text)] font-medium">
                    {c.name}
                    {i === 0 && (
                      <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--rose)]/15 text-[var(--rose)] border border-[var(--rose)]/30">
                        {awsConcentration}% CONCENTRATION RISK
                      </span>
                    )}
                  </td>
                  <td className="data px-4 py-3 text-[var(--text-mid)]">${c.gross.toLocaleString()}</td>
                  <td className="data px-4 py-3 text-[var(--text-mid)]">{c.adSpend > 0 ? `$${c.adSpend.toLocaleString()}` : '—'}</td>
                  <td className="data px-4 py-3 text-[var(--text-mid)]">${c.stripe.toLocaleString()}</td>
                  <td className="data px-4 py-3 text-[var(--accent)] font-semibold">${c.net.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[var(--text-dim)]">{c.service}</td>
                  <td className="px-4 py-3 text-[var(--text-dim)]">{c.meeting}</td>
                </tr>
              ))}
              {/* Total row */}
              <tr className="bg-[var(--surface2)]">
                <td className="px-4 py-3 text-[var(--text)] font-bold">TOTAL</td>
                <td className="data px-4 py-3 text-[var(--text)] font-bold">${clientTotals.gross.toLocaleString()}</td>
                <td className="data px-4 py-3 text-[var(--text)] font-bold">${clientTotals.adSpend.toLocaleString()}</td>
                <td className="data px-4 py-3 text-[var(--text)] font-bold">${clientTotals.stripe.toLocaleString()}</td>
                <td className="data px-4 py-3 text-[var(--accent)] font-bold">${clientTotals.net.toLocaleString()}</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Plumbing GMB Grid ── */}
      <div className="animate-in" style={{ animationDelay: `${0.05 * animIdx++}s` }}>
        <h2 className="label text-[10px] text-[var(--text-dim)] tracking-widest mb-3">PLUMBING GMB PROFILES</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GMB_PROFILES.map((g, i) => (
            <div
              key={g.city}
              className="animate-in bg-[var(--surface)] border border-[var(--border)] rounded-[10px] p-4 hover:border-[var(--border-glow)] transition-all duration-200"
              style={{ animationDelay: `${0.05 * (animIdx + i)}s` }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[14px] font-semibold text-[var(--text)]">{g.city}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${GMB_STATUS_STYLES[g.status]}`}>
                  {g.status.toUpperCase()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="data text-lg font-bold text-[var(--text)]">{g.reviews}</div>
                  <div className="label text-[10px] text-[var(--text-dim)]">Reviews</div>
                </div>
                <div>
                  <div className="data text-lg font-bold text-[var(--cyan)]">{g.calls}</div>
                  <div className="label text-[10px] text-[var(--text-dim)]">Calls/mo</div>
                </div>
                <div>
                  <div className="data text-lg font-bold text-[var(--text-mid)]">{g.rank}</div>
                  <div className="label text-[10px] text-[var(--text-dim)]">Rank</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Command Input ── */}
      <CommandInput />
    </div>
  )
}
