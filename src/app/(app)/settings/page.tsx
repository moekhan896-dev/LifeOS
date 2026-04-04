'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { useRouter } from 'next/navigation'
import { hashPin, verifyPin } from '@/lib/pin-hash'
import { PRAYER_CALC_METHOD_OPTIONS } from '@/lib/prayer-times'
import { geocodeAndUpdate } from '@/lib/geocode-client'

export default function SettingsPage() {
  const router = useRouter()
  const {
    userName, userLocation, wakeUpTime, workDayStart, workDayEnd, incomeTarget, targetDate, exitTarget,
    anthropicKey, stripeKey, theme, toggleTheme, trackingPrefs, notificationPrefs,
    plaidConnected,
    updateProfile,
    setTrackingPrefs,
    setNotificationPrefs,
    setPinHash,
    resetAll,
    userLat,
    userLng,
    prayerCalcMethod,
    prayerAsrHanafi,
    estimatedIncomeTaxRatePct,
  } = useStore()

  const [name, setName] = useState(userName)
  const [location, setLocation] = useState(userLocation)
  const [wake, setWake] = useState(wakeUpTime)
  const [income, setIncome] = useState(incomeTarget)
  const [tDate, setTDate] = useState(targetDate)
  const [exit, setExit] = useState(exitTarget)
  const [apiKey, setApiKey] = useState(anthropicKey)
  const [sKey, setSKey] = useState(stripeKey)
  const [ws, setWs] = useState(workDayStart || '09:00')
  const [we, setWe] = useState(workDayEnd || '17:00')
  const [pinCurrent, setPinCurrent] = useState('')
  const [pinNew, setPinNew] = useState('')
  const [pinNew2, setPinNew2] = useState('')
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  /** PRD §27 — two-step warning, then PIN + RESET + 5s countdown. */
  const [resetStage, setResetStage] = useState(0)
  const [fullResetPin, setFullResetPin] = useState('')
  const [fullResetPhrase, setFullResetPhrase] = useState('')
  const [resetCountdown, setResetCountdown] = useState<number | null>(null)

  const inputClass = 'w-full bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-[12px] py-3 px-4 text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors'
  const cardClass = 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[16px] p-6 space-y-4'
  const btnClass = 'rounded-[8px] px-4 py-2.5 text-sm font-medium transition-colors'
  const labelClass = 'block text-[13px] font-medium text-[var(--color-text-mid)] mb-1.5'

  const saveProfile = async () => {
    updateProfile({
      userName: name,
      userLocation: location,
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
      if (res.ok) { setApiStatus('success'); toast.success('API key works') }
      else { setApiStatus('error'); toast.error('API key test failed') }
    } catch { setApiStatus('error'); toast.error('API key test failed') }
  }

  const exportData = () => {
    const state = useStore.getState()
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `art-os-backup-${new Date().toISOString().split('T')[0]}.json`
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

        {/* ── Profile ── */}
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Profile</h2>
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
              <label className={labelClass}>Wake Up Time</label>
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
              <label className={labelClass}>Target Date</label>
              <input type="date" className={inputClass} value={tDate} onChange={(e) => setTDate(e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Monthly Income Target: ${income.toLocaleString()}</label>
              <input type="range" min={0} max={200000} step={1000} value={income} onChange={(e) => setIncome(Number(e.target.value))} className="w-full accent-[var(--color-accent)]" />
            </div>
            <div>
              <label className={labelClass}>Exit Target ($)</label>
              <input type="number" className={inputClass} value={exit} onChange={(e) => setExit(Number(e.target.value))} />
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => void saveProfile()} className={`${btnClass} bg-[var(--color-accent)] text-white`}>
            Save Profile
          </motion.button>
        </div>

        {/* ── Prayer times (GAP 4) + tax assumption (financials) ── */}
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Prayer times &amp; tax assumption</h2>
          <p className="text-xs text-[var(--color-text-dim)]">
            Times use <strong className="text-[var(--color-text)]">adhan.js</strong> with your saved coordinates. Default
            method ISNA (North America); enable Hanafi for Asr shadow length.
          </p>
          <div className="mt-3 space-y-3">
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
            <label className="flex cursor-pointer items-center gap-3">
              <button
                type="button"
                onClick={() => updateProfile({ prayerAsrHanafi: !prayerAsrHanafi })}
                className={`relative h-6 w-10 rounded-full transition-colors ${prayerAsrHanafi ? 'bg-[var(--color-accent)]' : 'border border-[var(--color-border)] bg-[var(--color-surface2)]'}`}
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
                  <span>not set — save profile with a location, or use refresh below</span>
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
              <label className={labelClass}>Assumed income tax rate (financials estimator) — {estimatedIncomeTaxRatePct}%</label>
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

        {/* ── Theme ── */}
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Theme</h2>
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { if (theme !== 'dark') toggleTheme() }}
              className={`${btnClass} border ${theme === 'dark' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-mid)]'}`}
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#0a0a0a] border border-white/20" />
                Dark
              </div>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { if (theme !== 'light') toggleTheme() }}
              className={`${btnClass} border ${theme === 'light' ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-text-mid)]'}`}
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#f5f5f5] border border-black/10" />
                Light
              </div>
            </motion.button>
          </div>
        </div>

        {/* ── Integrations ── */}
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Integrations</h2>
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Anthropic API Key</label>
              <div className="flex gap-2">
                <input type="password" className={`${inputClass} flex-1`} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-ant-..." />
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { saveKeys(); testAnthropicKey() }} className={`${btnClass} bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)]`}>
                  Test
                </motion.button>
              </div>
              <div className="mt-1.5 text-xs">
                {apiStatus === 'testing' && <span className="text-[var(--color-text-mid)]">Testing...</span>}
                {apiStatus === 'success' && <span className="text-[var(--positive)]">Connected</span>}
                {apiStatus === 'error' && <span className="text-rose-500">Failed</span>}
              </div>
            </div>
            <div>
              <label className={labelClass}>Stripe Key</label>
              <input type="password" className={`${inputClass}`} value={sKey} onChange={(e) => setSKey(e.target.value)} placeholder="sk_test_..." />
              <p className="text-xs text-[var(--color-text-dim)] mt-1">
                Store a restricted key for future payout / subscription flows (test mode recommended).
              </p>
            </div>
            <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface2)]/40 p-4">
              <p className="text-sm font-medium text-[var(--color-text)]">Banking (Plaid)</p>
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
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={saveKeys} className={`${btnClass} bg-[var(--color-accent)] text-white`}>
            Save Keys
          </motion.button>
        </div>

        {/* ── Notifications (prefs only) ── */}
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Notifications</h2>
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
              <label key={key} className="flex cursor-pointer items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNotificationPrefs({ [key]: !notificationPrefs[key] })}
                  className={`relative h-6 w-10 rounded-full transition-colors ${notificationPrefs[key] ? 'bg-[var(--color-accent)]' : 'border border-[var(--color-border)] bg-[var(--color-surface2)]'}`}
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
        </div>

        {/* ── Security ── */}
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Security</h2>
          <p className="text-xs text-[var(--color-text-dim)]">Change your 4-digit PIN. Stored as a hash on this device.</p>
          <p className="text-xs text-amber-500/90 mt-2 max-w-md">
            If you forget your PIN, your only recovery option is to erase this browser&apos;s data for the app or use Reset
            below — there is no cloud recovery in v1. Write your PIN down somewhere safe.
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

        {/* ── Health Tracking ── */}
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Health Tracking</h2>
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(trackingPrefs) as (keyof typeof trackingPrefs)[]).map((key) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <button
                  onClick={() => setTrackingPrefs({ [key]: !trackingPrefs[key] })}
                  className={`w-10 h-6 rounded-full transition-colors relative ${trackingPrefs[key] ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-surface2)] border border-[var(--color-border)]'}`}
                >
                  <motion.div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
                    animate={{ left: trackingPrefs[key] ? 18 : 2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                </button>
                <span className="text-sm text-[var(--color-text)] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── Data Management ── */}
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Data Management</h2>
          <div className="flex flex-wrap gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={exportData} className={`${btnClass} bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)]`}>
              Export Data
            </motion.button>
            {resetStage < 2 ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleReset}
                className={`${btnClass} ${resetStage > 0 ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-[var(--color-surface2)] border border-[var(--color-border)] text-rose-400'}`}
              >
                {resetLabels[resetStage]}
              </motion.button>
            ) : null}
            <motion.button whileTap={{ scale: 0.95 }} onClick={rerunOnboarding} className={`${btnClass} bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)]`}>
              Re-run Onboarding
            </motion.button>
          </div>
          {resetStage === 2 && resetCountdown === null && (
            <div className="mt-4 max-w-md space-y-3 rounded-[12px] border border-rose-500/25 bg-rose-500/5 p-4">
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
                  className={`${btnClass} bg-rose-600 text-white border border-rose-500`}
                >
                  Erase all data
                </motion.button>
                <button type="button" onClick={() => { setResetStage(0); setFullResetPin(''); setFullResetPhrase('') }} className={`${btnClass} border border-[var(--color-border)] text-[var(--color-text-mid)]`}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {resetCountdown !== null && resetCountdown > 0 && (
            <p className="mt-4 text-sm font-medium text-rose-400" role="status" aria-live="assertive">
              Erasing in {resetCountdown}s…
            </p>
          )}
        </div>

        {/* ── About ── */}
        <div className={cardClass}>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">About</h2>
          <p className="text-sm text-[var(--color-text-mid)]">ART OS v1.0</p>
          <p className="text-xs text-[var(--color-text-dim)]">Built with Claude</p>
        </div>
      </div>
    </PageTransition>
  )
}
