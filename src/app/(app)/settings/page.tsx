'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { useRouter } from 'next/navigation'
import { hashPin, verifyPin } from '@/lib/pin-hash'
import { PRAYER_CALC_METHOD_OPTIONS } from '@/lib/prayer-times'
import { geocodeAndUpdate } from '@/lib/geocode-client'

function serializeStoreForExport(): Record<string, unknown> {
  const s = useStore.getState()
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(s)) {
    if (typeof v !== 'function') out[k] = v
  }
  return out
}

export default function SettingsPage() {
  const router = useRouter()
  const {
    userName,
    userLocation,
    userAge,
    userSituation,
    wakeUpTime,
    workDayStart,
    workDayEnd,
    incomeTarget,
    targetDate,
    exitTarget,
    anthropicKey,
    stripeKey,
    theme,
    toggleTheme,
    trackingPrefs,
    notificationPrefs,
    plaidConnected,
    calendarConnected,
    updateProfile,
    setTrackingPrefs,
    setNotificationPrefs,
    setPinHash,
    resetAll,
    clearAiMessages,
    resetDashboardLayout,
    userLat,
    userLng,
    prayerCalcMethod,
    prayerAsrHanafi,
    estimatedIncomeTaxRatePct,
    aiAvoidanceStyle,
    aiPushStyle,
    aiMotivators,
    aiFrequency,
    aiReasoningDisplay,
    factorHealthInBusiness,
    faithDashboardVisibility,
  } = useStore()

  const [name, setName] = useState(userName)
  const [location, setLocation] = useState(userLocation)
  const [age, setAge] = useState(userAge ? String(userAge) : '')
  const [situation, setSituation] = useState(userSituation || '')
  const [wake, setWake] = useState(wakeUpTime)
  const [income, setIncome] = useState(incomeTarget)
  const [tDate, setTDate] = useState(targetDate)
  const [exit, setExit] = useState(exitTarget)
  const [apiKey, setApiKey] = useState(anthropicKey)
  const [sKey, setSKey] = useState(stripeKey)
  const [ws, setWs] = useState(workDayStart || '09:00')
  const [we, setWe] = useState(workDayEnd || '17:00')
  const [motivatorsStr, setMotivatorsStr] = useState(aiMotivators.join(', '))
  const [pinCurrent, setPinCurrent] = useState('')
  const [pinNew, setPinNew] = useState('')
  const [pinNew2, setPinNew2] = useState('')
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [resetStage, setResetStage] = useState(0)
  const [fullResetPin, setFullResetPin] = useState('')
  const [fullResetPhrase, setFullResetPhrase] = useState('')
  const [resetCountdown, setResetCountdown] = useState<number | null>(null)

  useEffect(() => {
    setMotivatorsStr(aiMotivators.join(', '))
  }, [aiMotivators])

  const inputClass =
    'w-full bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-[12px] py-3 px-4 text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors'
  const cardClass = 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[16px] p-6 space-y-4'
  const btnClass = 'rounded-[8px] px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] inline-flex items-center justify-center'
  const labelClass = 'block text-[13px] font-medium text-[var(--color-text-mid)] mb-1.5'
  const sectionTitle = 'text-lg font-semibold text-[var(--color-text)]'

  const saveProfile = async () => {
    const ageNum = parseInt(age, 10)
    updateProfile({
      userName: name,
      userLocation: location,
      userAge: Number.isFinite(ageNum) ? ageNum : 0,
      userSituation: situation,
      wakeUpTime: wake,
      workDayStart: ws,
      workDayEnd: we,
      incomeTarget: income,
      targetDate: tDate,
      exitTarget: exit,
    })
    const geo = await geocodeAndUpdate(location, (u) => updateProfile(u))
    toast.success(geo ? 'Profile saved — coordinates updated for prayer times' : 'Profile saved')
  }

  const saveAiPrefs = () => {
    const parts = motivatorsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    updateProfile({
      aiAvoidanceStyle,
      aiPushStyle,
      aiMotivators: parts,
      aiFrequency,
      aiReasoningDisplay,
      factorHealthInBusiness,
    })
    toast.success('AI preferences saved')
  }

  const applyPinChange = async () => {
    if (pinNew.length !== 4 || pinNew2.length !== 4 || pinCurrent.length !== 4) {
      toast.error('Use 4 digits for each field.')
      return
    }
    if (pinNew !== pinNew2) {
      toast.error('New PIN and confirmation do not match.')
      return
    }
    const hash = useStore.getState().pinHash
    const ok = await verifyPin(pinCurrent, hash)
    if (!ok) {
      toast.error('Current PIN is incorrect.')
      return
    }
    const next = await hashPin(pinNew)
    setPinHash(next)
    setPinCurrent('')
    setPinNew('')
    setPinNew2('')
    toast.success('PIN updated')
  }

  const saveKeys = () => {
    updateProfile({ anthropicKey: apiKey, stripeKey: sKey })
    toast.success('Keys saved')
  }

  const testAnthropicKey = async () => {
    setApiStatus('testing')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Say "connected" in one word.' }] }),
      })
      if (res.ok) {
        setApiStatus('success')
        toast.success('API key works')
      } else {
        setApiStatus('error')
        toast.error('API key test failed')
      }
    } catch {
      setApiStatus('error')
      toast.error('API key test failed')
    }
  }

  const exportData = () => {
    const data = serializeStoreForExport()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const d = new Date().toISOString().split('T')[0]
    a.download = `art-os-export-${d}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported')
  }

  const handleReset = () => {
    if (resetStage === 0) {
      setResetStage(1)
      return
    }
    if (resetStage === 1) {
      setResetStage(2)
      return
    }
  }

  const startFullReset = async () => {
    if (fullResetPin.length !== 4) {
      toast.error('Enter your 4-digit PIN.')
      return
    }
    if (fullResetPhrase.trim() !== 'RESET') {
      toast.error('Type RESET in uppercase to confirm.')
      return
    }
    const hash = useStore.getState().pinHash
    const ok = await verifyPin(fullResetPin, hash)
    if (!ok) {
      toast.error('PIN is incorrect.')
      return
    }
    setResetCountdown(5)
  }

  useEffect(() => {
    if (resetCountdown === null) return
    if (resetCountdown === 0) {
      resetAll()
      toast.success('All local data cleared')
      setResetStage(0)
      setFullResetPin('')
      setFullResetPhrase('')
      setResetCountdown(null)
      return
    }
    const t = window.setTimeout(() => setResetCountdown((c) => (c === null || c <= 1 ? 0 : c - 1)), 1000)
    return () => window.clearTimeout(t)
  }, [resetCountdown, resetAll])

  const rerunOnboarding = () => {
    useStore.setState({ onboardingComplete: false })
    router.push('/')
  }

  const resetLabels = ['Reset everything', 'Are you sure?']

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Settings</h1>

        {/* ── 1. Profile ── */}
        <div className={cardClass}>
          <h2 className={sectionTitle}>Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Age</label>
              <input
                className={inputClass}
                inputMode="numeric"
                value={age}
                onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Self-description</label>
              <textarea
                className={`${inputClass} min-h-[88px] resize-y`}
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="How you describe your season, priorities, constraints…"
              />
            </div>
            <div>
              <label className={labelClass}>Wake up time</label>
              <input type="time" className={inputClass} value={wake} onChange={(e) => setWake(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Work day start</label>
              <input type="time" className={inputClass} value={ws} onChange={(e) => setWs(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Work day end</label>
              <input type="time" className={inputClass} value={we} onChange={(e) => setWe(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Target date</label>
              <input type="date" className={inputClass} value={tDate} onChange={(e) => setTDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Monthly income target: ${income.toLocaleString()}</label>
              <input
                type="range"
                min={0}
                max={200000}
                step={1000}
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>
            <div>
              <label className={labelClass}>Exit target ($)</label>
              <input type="number" className={inputClass} value={exit} onChange={(e) => setExit(Number(e.target.value))} />
            </div>
          </div>

          <div className="border-t border-[var(--color-border)] pt-4 space-y-2">
            <h3 className="text-[15px] font-semibold text-[var(--color-text)]">Daily health tracking</h3>
            <p className="text-xs text-[var(--color-text-dim)]">Choose what you log on the Health &amp; Deen screen (separate from private habits in Privacy).</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(Object.keys(trackingPrefs) as (keyof typeof trackingPrefs)[])
                .filter((k) => k !== 'gambling' && k !== 'coldEmail')
                .map((key) => (
                <label key={key} className="flex min-h-[44px] cursor-pointer items-center gap-3">
                  <button
                    type="button"
                    aria-pressed={trackingPrefs[key]}
                    onClick={() => setTrackingPrefs({ [key]: !trackingPrefs[key] })}
                    className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${trackingPrefs[key] ? 'bg-[var(--color-accent)]' : 'border border-[var(--color-border)] bg-[var(--color-surface2)]'}`}
                  >
                    <motion.div
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                      animate={{ left: trackingPrefs[key] ? 18 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                  <span className="text-sm text-[var(--color-text)] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-[var(--color-text-dim)]">
            <button type="button" onClick={() => void saveProfile()} className="text-[var(--color-accent)] underline-offset-2 hover:underline">
              Update profile
            </button>{' '}
            saves name, location, age, description, schedule, and targets.
          </p>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => void saveProfile()}
            className={`${btnClass} bg-[var(--color-accent)] text-white`}
          >
            Save profile
          </motion.button>

          <div className="border-t border-[var(--color-border)] pt-4 space-y-3">
            <h3 className="text-[15px] font-semibold text-[var(--color-text)]">Prayer times &amp; tax assumption</h3>
            <p className="text-xs text-[var(--color-text-dim)]">
              Times use <strong className="text-[var(--color-text)]">adhan.js</strong> with your saved coordinates. Default
              method ISNA (North America); enable Hanafi for Asr shadow length.
            </p>
            <div>
              <label className={labelClass}>Calculation method</label>
              <select
                className={inputClass}
                value={prayerCalcMethod}
                onChange={(e) => updateProfile({ prayerCalcMethod: e.target.value })}
              >
                {PRAYER_CALC_METHOD_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-3 min-h-[44px]">
              <button
                type="button"
                aria-pressed={prayerAsrHanafi}
                onClick={() => updateProfile({ prayerAsrHanafi: !prayerAsrHanafi })}
                className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${prayerAsrHanafi ? 'bg-[var(--color-accent)]' : 'border border-[var(--color-border)] bg-[var(--color-surface2)]'}`}
              >
                <motion.div
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                  animate={{ left: prayerAsrHanafi ? 18 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
              <span className="text-sm text-[var(--color-text)]">Hanafi Asr</span>
            </label>
            <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface2)]/50 p-3 text-sm text-[var(--color-text-mid)]">
              <p>
                Coordinates:{' '}
                {userLat != null && userLng != null ? (
                  <span className="font-mono text-[var(--color-text)]">
                    {userLat.toFixed(4)}, {userLng.toFixed(4)}
                  </span>
                ) : (
                  <span>not set — save profile with a location, or refresh below</span>
                )}
              </p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  void geocodeAndUpdate(location, (u) => updateProfile(u)).then((ok) =>
                    ok ? toast.success('Coordinates updated') : toast.error('Could not geocode this location')
                  )
                }
                className={`${btnClass} mt-2 border border-[var(--color-border)] bg-[var(--color-surface2)] text-[var(--color-text)]`}
              >
                Refresh coordinates from location field
              </motion.button>
            </div>
            <div>
              <label className={labelClass}>
                Assumed income tax rate (financials estimator) — {estimatedIncomeTaxRatePct}%
              </label>
              <input
                type="range"
                min={0}
                max={55}
                step={1}
                value={estimatedIncomeTaxRatePct}
                onChange={(e) => updateProfile({ estimatedIncomeTaxRatePct: Number(e.target.value) })}
                className="w-full accent-[var(--color-accent)]"
              />
            </div>
          </div>
        </div>

        {/* ── 2. Appearance ── */}
        <div className={cardClass}>
          <h2 className={sectionTitle}>Appearance</h2>
          <div className="flex flex-wrap items-center gap-4">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (theme !== 'dark') toggleTheme()
              }}
              className={`${btnClass} border ${theme === 'dark' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-mid)]'}`}
            >
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border border-[var(--color-border)] bg-[var(--bg-primary)]" />
                Dark
              </span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (theme !== 'light') toggleTheme()
              }}
              className={`${btnClass} border ${theme === 'light' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-mid)]'}`}
            >
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border border-[var(--color-border)] bg-[var(--bg-elevated)]" />
                Light
              </span>
            </motion.button>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className={`${btnClass} border border-[var(--color-border)] bg-[var(--color-surface2)] text-[var(--color-text)]`}
            >
              Customize dashboard
            </Link>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                resetDashboardLayout()
                toast.success('Dashboard layout reset to defaults')
              }}
              className={`${btnClass} border border-[var(--color-border)] bg-[var(--color-surface2)] text-[var(--color-text)]`}
            >
              Reset layout
            </motion.button>
          </div>
        </div>

        {/* ── 3. Connections ── */}
        <div className={cardClass}>
          <h2 className={sectionTitle}>Connections</h2>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Anthropic API key</label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="password"
                  className={`${inputClass} flex-1 min-w-[200px]`}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                />
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    saveKeys()
                    void testAnthropicKey()
                  }}
                  className={`${btnClass} shrink-0 bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)]`}
                >
                  Test key
                </motion.button>
              </div>
              <div className="mt-1.5 text-xs" aria-live={apiStatus === 'error' ? 'assertive' : undefined}>
                {apiStatus === 'testing' && <span className="text-[var(--color-text-mid)]">Testing…</span>}
                {apiStatus === 'success' && <span className="text-[var(--positive)]">Connected</span>}
                {apiStatus === 'error' && <span className="text-[var(--negative)]">Key test failed</span>}
              </div>
            </div>
            <div>
              <label className={labelClass}>Stripe</label>
              <input
                type="password"
                className={inputClass}
                value={sKey}
                onChange={(e) => setSKey(e.target.value)}
                placeholder="sk_test_..."
              />
              <p className="text-xs text-[var(--color-text-dim)] mt-1">
                Store a restricted key for future payout / subscription flows (test mode recommended).
              </p>
            </div>
            <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface2)]/40 p-4">
              <p className="text-sm font-medium text-[var(--color-text)]">Plaid</p>
              <p className="mt-1 text-xs text-[var(--color-text-dim)]">
                Live Plaid Link is not bundled in this build. Use the button to mark intent for demos and UI testing.
              </p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  updateProfile({ plaidConnected: true })
                  toast.success(plaidConnected ? 'Still marked as connected' : 'Marked as connected (demo)')
                }}
                className={`${btnClass} mt-3 border ${plaidConnected ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] bg-[var(--color-surface2)] text-[var(--color-text)]'}`}
              >
                {plaidConnected ? 'Bank link (demo) — connected' : 'Simulate bank connection'}
              </motion.button>
            </div>
            <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface2)]/40 p-4">
              <p className="text-sm font-medium text-[var(--color-text)]">Calendar</p>
              <p className="mt-1 text-xs text-[var(--color-text-dim)]">
                OAuth calendar sync is not bundled in v1. Toggle status for planning and demos.
              </p>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const next = !calendarConnected
                  updateProfile({ calendarConnected: next })
                  toast.success(next ? 'Calendar marked connected (demo)' : 'Calendar marked disconnected')
                }}
                className={`${btnClass} mt-3 border ${calendarConnected ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] bg-[var(--color-surface2)] text-[var(--color-text)]'}`}
              >
                {calendarConnected ? 'Calendar — connected (demo)' : 'Simulate calendar connection'}
              </motion.button>
            </div>
          </div>
          <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={saveKeys} className={`${btnClass} bg-[var(--color-accent)] text-white`}>
            Save connection keys
          </motion.button>
        </div>

        {/* ── 4. Notifications ── */}
        <div className={cardClass}>
          <h2 className={sectionTitle}>Notifications</h2>
          <p className="text-xs text-[var(--color-text-dim)]">
            Preferences for in-app surfaces. Browser push can be added in a later release.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(
              [
                ['proactiveInbox', 'Proactive AI inbox'] as const,
                ['morningBrief', 'Morning brief (future)'] as const,
                ['weeklyDigest', 'Weekly digest (future)'] as const,
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-3 min-h-[44px]">
                <button
                  type="button"
                  aria-pressed={notificationPrefs[key]}
                  onClick={() => setNotificationPrefs({ [key]: !notificationPrefs[key] })}
                  className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${notificationPrefs[key] ? 'bg-[var(--color-accent)]' : 'border border-[var(--color-border)] bg-[var(--color-surface2)]'}`}
                >
                  <motion.div
                    className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                    animate={{ left: notificationPrefs[key] ? 18 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
                <span className="text-sm text-[var(--color-text)]">{label}</span>
              </label>
            ))}
          </div>
          <div className="border-t border-[var(--color-border)] pt-4 space-y-3">
            <label className="flex cursor-pointer items-center gap-3 min-h-[44px]">
              <button
                type="button"
                aria-pressed={notificationPrefs.quietHoursEnabled}
                onClick={() => setNotificationPrefs({ quietHoursEnabled: !notificationPrefs.quietHoursEnabled })}
                className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${notificationPrefs.quietHoursEnabled ? 'bg-[var(--color-accent)]' : 'border border-[var(--color-border)] bg-[var(--color-surface2)]'}`}
              >
                <motion.div
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                  animate={{ left: notificationPrefs.quietHoursEnabled ? 18 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
              <span className="text-sm text-[var(--color-text)]">Quiet hours</span>
            </label>
            <div className={`grid grid-cols-2 gap-3 ${notificationPrefs.quietHoursEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
              <div>
                <label className={labelClass}>Start</label>
                <input
                  type="time"
                  className={inputClass}
                  value={notificationPrefs.quietHoursStart}
                  onChange={(e) => setNotificationPrefs({ quietHoursStart: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>End</label>
                <input
                  type="time"
                  className={inputClass}
                  value={notificationPrefs.quietHoursEnd}
                  onChange={(e) => setNotificationPrefs({ quietHoursEnd: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── 5. AI preferences ── */}
        <div className={cardClass}>
          <h2 className={sectionTitle}>AI preferences</h2>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelClass}>Style — avoidance</label>
              <input
                className={inputClass}
                value={aiAvoidanceStyle}
                onChange={(e) => updateProfile({ aiAvoidanceStyle: e.target.value })}
                placeholder="e.g. direct, gentle"
              />
            </div>
            <div>
              <label className={labelClass}>Style — push</label>
              <input
                className={inputClass}
                value={aiPushStyle}
                onChange={(e) => updateProfile({ aiPushStyle: e.target.value })}
                placeholder="e.g. accountability, encouraging"
              />
            </div>
            <div>
              <label className={labelClass}>Motivators (comma-separated)</label>
              <input
                className={inputClass}
                value={motivatorsStr}
                onChange={(e) => setMotivatorsStr(e.target.value)}
                placeholder="family, legacy, freedom"
              />
            </div>
            <div>
              <label className={labelClass}>Frequency</label>
              <input
                className={inputClass}
                value={aiFrequency}
                onChange={(e) => updateProfile({ aiFrequency: e.target.value })}
                placeholder="e.g. daily check-in"
              />
            </div>
            <div>
              <label className={labelClass}>Reasoning display</label>
              <input
                className={inputClass}
                value={aiReasoningDisplay}
                onChange={(e) => updateProfile({ aiReasoningDisplay: e.target.value })}
                placeholder="e.g. show steps, terse"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-3 min-h-[44px]">
              <button
                type="button"
                aria-pressed={factorHealthInBusiness}
                onClick={() => updateProfile({ factorHealthInBusiness: !factorHealthInBusiness })}
                className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${factorHealthInBusiness ? 'bg-[var(--color-accent)]' : 'border border-[var(--color-border)] bg-[var(--color-surface2)]'}`}
              >
                <motion.div
                  className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                  animate={{ left: factorHealthInBusiness ? 18 : 2 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>
              <span className="text-sm text-[var(--color-text)]">Factor health into business advice</span>
            </label>
          </div>
          <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={saveAiPrefs} className={`${btnClass} bg-[var(--color-accent)] text-white`}>
            Save AI preferences
          </motion.button>
        </div>

        {/* ── 6. Privacy ── */}
        <div className={cardClass}>
          <h2 className={sectionTitle}>Privacy</h2>
          <p className="text-xs text-[var(--color-text-dim)]">Control how faith appears on your dashboard and which sensitive habits you track privately.</p>
          <div>
            <label className={labelClass}>Faith on dashboard</label>
            <select
              className={inputClass}
              value={faithDashboardVisibility || 'health_only'}
              onChange={(e) =>
                updateProfile({ faithDashboardVisibility: e.target.value as 'prominent' | 'small' | 'health_only' })
              }
            >
              <option value="prominent">Prominent</option>
              <option value="small">Small</option>
              <option value="health_only">Health only</option>
            </select>
          </div>
          <div>
            <p className={labelClass}>Private habits (local only)</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(['gambling', 'coldEmail'] as const).map((key) => (
                <label key={key} className="flex cursor-pointer items-center gap-3 min-h-[44px]">
                  <button
                    type="button"
                    aria-pressed={trackingPrefs[key]}
                    onClick={() => setTrackingPrefs({ [key]: !trackingPrefs[key] })}
                    className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${trackingPrefs[key] ? 'bg-[var(--color-accent)]' : 'border border-[var(--color-border)] bg-[var(--color-surface2)]'}`}
                  >
                    <motion.div
                      className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
                      animate={{ left: trackingPrefs[key] ? 18 : 2 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                  <span className="text-sm text-[var(--color-text)] capitalize">{key === 'coldEmail' ? 'Cold email' : key}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ── 7. Data ── */}
        <div className={cardClass}>
          <h2 className={sectionTitle}>Data</h2>
          <div className="flex flex-wrap gap-3">
            <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={exportData} className={`${btnClass} bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)]`}>
              Export all data
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={rerunOnboarding}
              className={`${btnClass} bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)]`}
            >
              Re-run onboarding
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                clearAiMessages()
                toast.success('AI chat history cleared')
              }}
              className={`${btnClass} bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)]`}
            >
              Clear AI history
            </motion.button>
          </div>
          <div className="border-t border-[var(--color-border)] pt-4">
            <p className="text-xs text-[var(--color-text-dim)] mb-3">Destructive: erase all local data (PRD §27).</p>
            <div className="flex flex-wrap gap-3">
              {resetStage < 2 ? (
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className={`${btnClass} ${resetStage > 0 ? 'bg-[var(--negative)]/15 text-[var(--negative)] border border-[var(--negative)]/30' : 'bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--negative)]'}`}
                >
                  {resetLabels[resetStage]}
                </motion.button>
              ) : null}
            </div>
            {resetStage === 2 && resetCountdown === null && (
              <div className="mt-4 max-w-md space-y-3 rounded-[12px] border border-[var(--negative)]/25 bg-[var(--negative)]/5 p-4">
                <p className="text-sm text-[var(--color-text)]">
                  Enter your PIN, type RESET, then confirm. A 5-second countdown runs before data is erased (PRD §27).
                </p>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="PIN"
                  className={inputClass}
                  value={fullResetPin}
                  onChange={(e) => setFullResetPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="Type RESET"
                  className={inputClass}
                  value={fullResetPhrase}
                  onChange={(e) => setFullResetPhrase(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => void startFullReset()}
                    className={`${btnClass} bg-[var(--negative)] text-white border border-[var(--negative)]`}
                  >
                    Erase all data
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetStage(0)
                      setFullResetPin('')
                      setFullResetPhrase('')
                    }}
                    className={`${btnClass} border border-[var(--color-border)] text-[var(--color-text-mid)]`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {resetCountdown !== null && resetCountdown > 0 && (
              <p className="mt-4 text-sm font-medium text-[var(--negative)]" role="status" aria-live="assertive">
                Erasing in {resetCountdown}s…
              </p>
            )}
          </div>
        </div>

        {/* ── 8. Security ── */}
        <div className={cardClass}>
          <h2 className={sectionTitle}>Security</h2>
          <p className="text-xs text-[var(--color-text-dim)]">Change your 4-digit PIN. Stored as a hash on this device.</p>
          <p className="text-xs text-[var(--warning)]/90 mt-2 max-w-md">
            If you forget your PIN, your only recovery option is to erase this browser&apos;s data for the app or use reset
            in Data — there is no cloud recovery in v1. Write your PIN down somewhere safe.
          </p>
          <div className="mt-3 grid max-w-md grid-cols-1 gap-3">
            <div>
              <label className={labelClass}>Current PIN</label>
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                className={inputClass}
                value={pinCurrent}
                onChange={(e) => setPinCurrent(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>
            <div>
              <label className={labelClass}>New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                className={inputClass}
                value={pinNew}
                onChange={(e) => setPinNew(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>
            <div>
              <label className={labelClass}>Confirm new PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                className={inputClass}
                value={pinNew2}
                onChange={(e) => setPinNew2(e.target.value.replace(/\D/g, '').slice(0, 4))}
              />
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => void applyPinChange()}
              className={`${btnClass} w-fit bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)]`}
            >
              Update PIN
            </motion.button>
          </div>
        </div>

        {/* ── 9. About ── */}
        <div className={cardClass}>
          <h2 className={sectionTitle}>About</h2>
          <p className="text-sm text-[var(--color-text-mid)]">ART OS v1.0</p>
          <p className="text-xs text-[var(--color-text-dim)]">Built with Claude</p>
          <div className="flex flex-col gap-2 pt-2">
            <a
              href="mailto:feedback@art-os.app?subject=ART%20OS%20feedback"
              className="text-sm text-[var(--color-accent)] underline-offset-2 hover:underline w-fit"
            >
              Send feedback
            </a>
            <Link href="/terms" className="text-sm text-[var(--color-accent)] underline-offset-2 hover:underline w-fit">
              Terms of service
            </Link>
            <Link href="/privacy" className="text-sm text-[var(--color-accent)] underline-offset-2 hover:underline w-fit">
              Privacy policy
            </Link>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
