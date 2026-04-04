'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import { COLOR_SWATCHES } from '@/lib/constants'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()
  const {
    userName, userLocation, wakeUpTime, incomeTarget, targetDate, exitTarget,
    anthropicKey, stripeKey, theme, toggleTheme, trackingPrefs,
    updateProfile, setTrackingPrefs, resetAll,
  } = useStore()

  const [name, setName] = useState(userName)
  const [location, setLocation] = useState(userLocation)
  const [wake, setWake] = useState(wakeUpTime)
  const [income, setIncome] = useState(incomeTarget)
  const [tDate, setTDate] = useState(targetDate)
  const [exit, setExit] = useState(exitTarget)
  const [apiKey, setApiKey] = useState(anthropicKey)
  const [sKey, setSKey] = useState(stripeKey)
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [resetStage, setResetStage] = useState(0)

  const inputClass = 'w-full bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-[12px] py-3 px-4 text-[var(--color-text)] text-sm focus:outline-none focus:border-[var(--color-accent)] transition-colors'
  const cardClass = 'bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[16px] p-6 space-y-4'
  const btnClass = 'rounded-[8px] px-4 py-2.5 text-sm font-medium transition-colors'
  const labelClass = 'block text-[13px] font-medium text-[var(--color-text-mid)] mb-1.5'

  const saveProfile = () => {
    updateProfile({ userName: name, userLocation: location, wakeUpTime: wake, incomeTarget: income, targetDate: tDate, exitTarget: exit })
    toast.success('Profile saved')
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
    if (resetStage === 0) { setResetStage(1); return }
    if (resetStage === 1) { setResetStage(2); return }
    resetAll()
    toast.success('Everything reset')
    setResetStage(0)
  }

  const rerunOnboarding = () => {
    useStore.setState({ onboardingComplete: false })
    router.push('/')
  }

  const resetLabels = ['Reset Everything', 'Are you sure?', 'This cannot be undone — click to confirm']

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
          <motion.button whileTap={{ scale: 0.97 }} onClick={saveProfile} className={`${btnClass} bg-[var(--color-accent)] text-white`}>
            Save Profile
          </motion.button>
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
                {apiStatus === 'success' && <span className="text-emerald-500">Connected</span>}
                {apiStatus === 'error' && <span className="text-rose-500">Failed</span>}
              </div>
            </div>
            <div>
              <label className={labelClass}>Stripe Key</label>
              <input type="password" className={`${inputClass}`} value={sKey} onChange={(e) => setSKey(e.target.value)} placeholder="sk_..." />
              <p className="text-xs text-[var(--color-text-dim)] mt-1">Coming soon</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={saveKeys} className={`${btnClass} bg-[var(--color-accent)] text-white`}>
            Save Keys
          </motion.button>
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
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              onBlur={() => setResetStage(0)}
              className={`${btnClass} ${resetStage > 0 ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' : 'bg-[var(--color-surface2)] border border-[var(--color-border)] text-rose-400'}`}
            >
              {resetLabels[resetStage]}
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={rerunOnboarding} className={`${btnClass} bg-[var(--color-surface2)] border border-[var(--color-border)] text-[var(--color-text)]`}>
              Re-run Onboarding
            </motion.button>
          </div>
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
