"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/stores/store'
import type { BusinessType, BusinessStatus } from '@/stores/store'

// ── Transition variants ──
const slideVariants = {
  enter: { x: 80, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -80, opacity: 0 },
}
const slideTrans = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }

// ── Suggested data ──
const SUGGESTED_BUSINESSES = [
  { name: 'Rysen (SEO Agency)', type: 'agency' as BusinessType, status: 'active_healthy' as BusinessStatus, monthlyRevenue: 26000, color: '#10b981', icon: '⬡', notes: '' },
  { name: 'Honest Plumbers', type: 'service' as BusinessType, status: 'active_slow' as BusinessStatus, monthlyRevenue: 18000, color: '#06b6d4', icon: '🔧', notes: '' },
  { name: 'Madison Clark', type: 'agency' as BusinessType, status: 'active_prerevenue' as BusinessStatus, monthlyRevenue: 0, color: '#ec4899', icon: '✦', notes: '' },
  { name: 'Moggley App', type: 'app' as BusinessType, status: 'active_prerevenue' as BusinessStatus, monthlyRevenue: 0, color: '#8b5cf6', icon: '📱', notes: '' },
  { name: 'Personal Brand', type: 'content' as BusinessType, status: 'dormant' as BusinessStatus, monthlyRevenue: 0, color: '#f59e0b', icon: '🎙', notes: '' },
  { name: 'Airbnb FL', type: 'real_estate' as BusinessType, status: 'active_healthy' as BusinessStatus, monthlyRevenue: 1000, color: '#3b82f6', icon: '🏠', notes: '' },
]

const SUGGESTED_CLIENTS = [
  { name: 'AWS Law Firm', grossMonthly: 18000, adSpend: 10000, serviceType: 'GMB + ADS', meetingFrequency: 'Biweekly' },
  { name: 'Slim Dental', grossMonthly: 2400, adSpend: 0, serviceType: 'SEO', meetingFrequency: 'Weekly' },
  { name: 'Rock Remson Law', grossMonthly: 1700, adSpend: 0, serviceType: 'GMB SEO', meetingFrequency: 'None' },
  { name: 'Gravix Security', grossMonthly: 1500, adSpend: 0, serviceType: 'GMB SEO', meetingFrequency: 'None' },
  { name: 'Tyler Family Law', grossMonthly: 1450, adSpend: 0, serviceType: 'GMB SEO', meetingFrequency: 'Monthly' },
  { name: 'Eric (Plumbing)', grossMonthly: 1000, adSpend: 0, serviceType: 'SEO', meetingFrequency: 'None' },
]

const inputCls = 'w-full bg-[#0e1018] border border-[#1e2338] rounded-[12px] text-sm py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors'
const btnPrimary = 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-medium rounded-[12px] px-8 py-3 cursor-pointer select-none'

function sixMonthsFromNow() {
  const d = new Date()
  d.setMonth(d.getMonth() + 6)
  return d.toISOString().split('T')[0]
}

// ── Floating particles for welcome screen ──
function Particles() {
  const dots = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 3 + Math.random() * 4,
    dur: 4 + Math.random() * 4,
    delay: Math.random() * 3,
  })), [])
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map(d => (
        <motion.div
          key={d.id}
          className="absolute rounded-full bg-emerald-500/20"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ── Confetti for final screen ──
function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ['#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6', '#06b6d4'][i % 6],
    size: 6 + Math.random() * 6,
    dur: 2 + Math.random() * 3,
    delay: Math.random() * 2,
  })), [])
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{ left: `${p.x}%`, bottom: -20, width: p.size, height: p.size, backgroundColor: p.color }}
          animate={{ y: [-20, -500], opacity: [1, 0], x: [0, (Math.random() - 0.5) * 100] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// ── Toggle switch ──
function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-3 w-full py-2 text-left">
      <motion.div
        className={`relative w-12 h-6 rounded-full flex-shrink-0 ${on ? 'bg-emerald-600' : 'bg-[#1e2338]'}`}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
          animate={{ left: on ? 26 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.div>
      <span className="text-sm text-gray-300">{label}</span>
    </button>
  )
}

// ══════════════════════════════════════════
// PIN Entry Component
// ══════════════════════════════════════════
function PinEntry() {
  const { pin, setAuthenticated } = useStore()
  const router = useRouter()
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  const handleChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const next = [...digits]
    next[i] = v
    setDigits(next)
    setError(false)
    if (v && i < 3) refs[i + 1].current?.focus()
    if (i === 3 && v) {
      const entered = next.join('')
      if (entered === pin) {
        setTimeout(() => { setAuthenticated(true); router.push('/dashboard') }, 400)
      } else {
        setError(true)
        setTimeout(() => { setDigits(['', '', '', '']); refs[0].current?.focus() }, 600)
      }
    }
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1].current?.focus()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080a10]">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
        className="card p-8 text-center max-w-sm w-full"
      >
        <h2 className="text-xl font-semibold text-white mb-2">Enter PIN</h2>
        <p className="text-sm text-gray-400 mb-6">Access your ART OS</p>
        <motion.div
          className="flex justify-center gap-3 mb-4"
          animate={error ? { x: [0, -10, 10, -10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="password"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className={`w-16 h-16 text-center text-2xl font-bold bg-[#0e1018] border ${error ? 'border-red-500' : d ? 'border-emerald-500' : 'border-[#1e2338]'} rounded-[12px] text-white focus:outline-none focus:border-emerald-500/50 transition-colors`}
            />
          ))}
        </motion.div>
        {error && <p className="text-red-400 text-sm">Incorrect PIN</p>}
      </motion.div>
    </div>
  )
}

// ══════════════════════════════════════════
// Onboarding Wizard
// ══════════════════════════════════════════
function OnboardingWizard() {
  const store = useStore()
  const router = useRouter()
  const [step, setStep] = useState(0)

  // Screen 1 state
  const [name, setName] = useState(store.userName || 'Art')
  const [location, setLocation] = useState(store.userLocation || 'Westland, MI')
  const [wakeUp, setWakeUp] = useState(store.wakeUpTime || '07:00')
  const [income, setIncome] = useState(store.incomeTarget || 50000)
  const [targetDate, setTargetDate] = useState(store.targetDate || sixMonthsFromNow())

  // Screen 2 state
  const [pinDigits, setPinDigits] = useState(['', '', '', ''])
  const [confirmDigits, setConfirmDigits] = useState(['', '', '', ''])
  const [pinPhase, setPinPhase] = useState<'set' | 'confirm'>('set')
  const [pinError, setPinError] = useState('')
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
  const confirmRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  // Screen 3 state
  const [addedBiz, setAddedBiz] = useState<Set<number>>(new Set())
  const [showCustomBiz, setShowCustomBiz] = useState(false)
  const [customBiz, setCustomBiz] = useState({ name: '', type: 'other' as BusinessType, status: 'idea' as BusinessStatus, monthlyRevenue: 0, color: '#10b981', icon: '📦', notes: '' })

  // Screen 4 state
  const [addedClients, setAddedClients] = useState<Set<number>>(new Set())
  const [showCustomClient, setShowCustomClient] = useState(false)
  const [customClient, setCustomClient] = useState({ name: '', grossMonthly: 0, adSpend: 0, serviceType: '', meetingFrequency: 'None' })

  // Screen 5 state
  const [anthropicKey, setAnthropicKey] = useState('')
  const [stripeKey, setStripeKey] = useState('')
  const [aiTestResult, setAiTestResult] = useState<'idle' | 'loading' | 'pass' | 'fail'>('idle')

  // Screen 6 state
  const [trackingPrefs, setLocalTrackingPrefs] = useState(store.trackingPrefs)

  // Check if we need clients screen
  const hasAgencyOrService = useMemo(() => {
    const addedBusinesses = SUGGESTED_BUSINESSES.filter((_, i) => addedBiz.has(i))
    return addedBusinesses.some(b => b.type === 'agency' || b.type === 'service')
  }, [addedBiz])

  // Computed: first agency/service business name
  const agencyBizName = useMemo(() => {
    const found = SUGGESTED_BUSINESSES.filter((_, i) => addedBiz.has(i)).find(b => b.type === 'agency' || b.type === 'service')
    return found?.name || ''
  }, [addedBiz])

  const totalScreens = hasAgencyOrService ? 9 : 8

  const next = useCallback(() => {
    // Save per-screen data
    if (step === 1) {
      store.updateProfile({ userName: name, userLocation: location, wakeUpTime: wakeUp, incomeTarget: income, targetDate })
    }
    if (step === 3) {
      // Add businesses
      const bizzes = SUGGESTED_BUSINESSES.filter((_, i) => addedBiz.has(i))
      bizzes.forEach(b => store.addBusiness(b))
    }
    if (step === 4 && hasAgencyOrService) {
      // Add clients
      const agencyBiz = store.businesses.find(b => b.type === 'agency' || b.type === 'service')
      if (agencyBiz) {
        SUGGESTED_CLIENTS.filter((_, i) => addedClients.has(i)).forEach(c => {
          store.addClient({ businessId: agencyBiz.id, name: c.name, grossMonthly: c.grossMonthly, adSpend: c.adSpend, serviceType: c.serviceType, meetingFrequency: c.meetingFrequency, active: true })
        })
      }
    }

    // Skip clients screen if no agency/service
    if (step === 3 && !hasAgencyOrService) {
      setStep(5)
      return
    }

    setStep(s => s + 1)
  }, [step, name, location, wakeUp, income, targetDate, addedBiz, addedClients, hasAgencyOrService, store])

  const prev = () => {
    if (step === 5 && !hasAgencyOrService) {
      setStep(3)
      return
    }
    setStep(s => Math.max(0, s - 1))
  }

  // PIN handling
  const handlePinInput = (phase: 'set' | 'confirm', i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const arr = phase === 'set' ? [...pinDigits] : [...confirmDigits]
    const setter = phase === 'set' ? setPinDigits : setConfirmDigits
    const refsArr = phase === 'set' ? pinRefs : confirmRefs
    arr[i] = v
    setter(arr)
    setPinError('')
    if (v && i < 3) refsArr[i + 1].current?.focus()
    if (i === 3 && v) {
      if (phase === 'set') {
        setPinPhase('confirm')
        setTimeout(() => confirmRefs[0].current?.focus(), 100)
      } else {
        const pin1 = pinDigits.join('')
        const pin2 = arr.join('')
        if (pin1 === pin2) {
          store.setPin(pin1)
          next()
        } else {
          setPinError("PINs don't match")
          setConfirmDigits(['', '', '', ''])
          setTimeout(() => confirmRefs[0].current?.focus(), 300)
        }
      }
    }
  }

  const handlePinKeyDown = (phase: 'set' | 'confirm', i: number, e: React.KeyboardEvent) => {
    const arr = phase === 'set' ? pinDigits : confirmDigits
    const refsArr = phase === 'set' ? pinRefs : confirmRefs
    if (e.key === 'Backspace' && !arr[i] && i > 0) refsArr[i - 1].current?.focus()
  }

  // AI test
  const testAi = async () => {
    setAiTestResult('loading')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Say hello in 5 words.' }], apiKey: anthropicKey }),
      })
      setAiTestResult(res.ok ? 'pass' : 'fail')
    } catch {
      setAiTestResult('fail')
    }
  }

  // Final screen stats
  const addedBizCount = addedBiz.size
  const addedClientCount = addedClients.size
  const totalMRR = SUGGESTED_BUSINESSES.filter((_, i) => addedBiz.has(i)).reduce((s, b) => s + b.monthlyRevenue, 0)
    + SUGGESTED_CLIENTS.filter((_, i) => addedClients.has(i)).reduce((s, c) => s + c.grossMonthly, 0)

  // Color swatches for custom business
  const colorSwatches = ['#10b981', '#06b6d4', '#ec4899', '#8b5cf6', '#f59e0b', '#3b82f6', '#ef4444', '#f97316']

  // ── Render each screen ──
  const renderScreen = () => {
    switch (step) {
      // ════════════════════════
      // Screen 0: Welcome
      // ════════════════════════
      case 0:
        return (
          <motion.div key="s0" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans} className="min-h-screen flex flex-col items-center justify-center relative">
            <Particles />
            <motion.div
              className="absolute w-64 h-64 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)' }}
            />
            <motion.div
              className="absolute w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
            <h1 className="font-mono text-[48px] font-bold tracking-[8px] text-[#10b981] relative z-10">ART OS</h1>
            <p className="mt-4 text-[18px] text-gray-400 font-light relative z-10 text-center max-w-md">Your businesses. Your health. Your life. One system.</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={next}
              className={`${btnPrimary} mt-10 relative z-10`}
            >
              Set up my OS →
            </motion.button>
          </motion.div>
        )

      // ════════════════════════
      // Screen 1: Identity
      // ════════════════════════
      case 1:
        return (
          <motion.div key="s1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans} className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-lg w-full space-y-6">
              <h2 className="text-[28px] font-semibold text-white">Let&apos;s start with you.</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Location</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} className={inputCls} placeholder="City, State" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Wake up time</label>
                  <input type="time" value={wakeUp} onChange={e => setWakeUp(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Monthly income target</label>
                  <p className="text-3xl font-bold text-emerald-400 mb-2">${income.toLocaleString()}</p>
                  <input type="range" min={10000} max={200000} step={5000} value={income} onChange={e => setIncome(Number(e.target.value))} className="w-full accent-emerald-500" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1"><span>$10K</span><span>$200K</span></div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Target date</label>
                  <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className={inputCls} />
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.03 }} onClick={next} className={btnPrimary}>Next &rarr;</motion.button>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════
      // Screen 2: PIN
      // ════════════════════════
      case 2:
        return (
          <motion.div key="s2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans} className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
              <h2 className="text-[28px] font-semibold text-white">Set Your PIN</h2>
              <p className="text-gray-400 text-sm">Keep your data private.</p>

              <div>
                <p className="text-xs text-gray-500 mb-3">{pinPhase === 'set' ? 'Choose a 4-digit PIN' : 'Confirm your PIN'}</p>
                <motion.div
                  className="flex justify-center gap-3"
                  animate={pinError ? { x: [0, -10, 10, -10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                >
                  {(pinPhase === 'set' ? pinDigits : confirmDigits).map((d, i) => (
                    <input
                      key={`${pinPhase}-${i}`}
                      ref={(pinPhase === 'set' ? pinRefs : confirmRefs)[i]}
                      type="password"
                      maxLength={1}
                      value={d}
                      onChange={e => handlePinInput(pinPhase, i, e.target.value)}
                      onKeyDown={e => handlePinKeyDown(pinPhase, i, e)}
                      className="w-[72px] h-[72px] text-center text-2xl font-bold bg-[#0e1018] border border-[#1e2338] rounded-[12px] text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                    />
                  ))}
                </motion.div>
                {pinError && <p className="text-red-400 text-sm mt-3">{pinError}</p>}
              </div>

              <p className="text-xs text-gray-600">You can change this later in Settings</p>
              <div className="flex justify-between pt-2">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <div />
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════
      // Screen 3: Businesses
      // ════════════════════════
      case 3:
        return (
          <motion.div key="s3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans} className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-2xl w-full space-y-6">
              <h2 className="text-[28px] font-semibold text-white">Tell me about your businesses.</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SUGGESTED_BUSINESSES.map((biz, i) => {
                  const added = addedBiz.has(i)
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, ease: [0.22, 1, 0.36, 1] as const }}
                      className={`card p-4 flex items-center justify-between border ${added ? 'border-emerald-500/50' : 'border-[#1e2338]'} rounded-[16px]`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl" style={{ color: biz.color }}>{biz.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-white">{biz.name}</p>
                          <p className="text-xs text-gray-500">{biz.status.replace(/_/g, ' ')} &middot; ${biz.monthlyRevenue.toLocaleString()}/mo</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const n = new Set(addedBiz)
                          if (added) n.delete(i); else n.add(i)
                          setAddedBiz(n)
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${added ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1e2338] text-gray-300 hover:bg-[#2a3050]'}`}
                      >
                        {added ? '✓ Added' : 'Add'}
                      </button>
                    </motion.div>
                  )
                })}
              </div>

              {!showCustomBiz && (
                <button onClick={() => setShowCustomBiz(true)} className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">+ Add custom business</button>
              )}
              {showCustomBiz && (
                <div className="card p-4 rounded-[16px] space-y-3">
                  <input value={customBiz.name} onChange={e => setCustomBiz({ ...customBiz, name: e.target.value })} placeholder="Business name" className={inputCls} />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={customBiz.type} onChange={e => setCustomBiz({ ...customBiz, type: e.target.value as BusinessType })} className={inputCls}>
                      {['agency', 'service', 'app', 'content', 'real_estate', 'coaching', 'other'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select value={customBiz.status} onChange={e => setCustomBiz({ ...customBiz, status: e.target.value as BusinessStatus })} className={inputCls}>
                      {['active_healthy', 'active_slow', 'active_prerevenue', 'dormant', 'backburner', 'idea'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                  <input type="number" value={customBiz.monthlyRevenue || ''} onChange={e => setCustomBiz({ ...customBiz, monthlyRevenue: Number(e.target.value) })} placeholder="Monthly revenue" className={inputCls} />
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-gray-400">Color:</span>
                    {colorSwatches.map(c => (
                      <button key={c} onClick={() => setCustomBiz({ ...customBiz, color: c })} className={`w-6 h-6 rounded-full border-2 ${customBiz.color === c ? 'border-white' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  <input value={customBiz.icon} onChange={e => setCustomBiz({ ...customBiz, icon: e.target.value })} placeholder="Icon/emoji" className={`${inputCls} w-20`} />
                  <button
                    onClick={() => {
                      if (customBiz.name) {
                        store.addBusiness(customBiz)
                        setCustomBiz({ name: '', type: 'other', status: 'idea', monthlyRevenue: 0, color: '#10b981', icon: '📦', notes: '' })
                        setShowCustomBiz(false)
                      }
                    }}
                    className={`${btnPrimary} text-sm px-4 py-2`}
                  >
                    Add Business
                  </button>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.03 }} onClick={next} className={btnPrimary}>Next &rarr;</motion.button>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════
      // Screen 4: Clients
      // ════════════════════════
      case 4:
        return (
          <motion.div key="s4" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans} className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-2xl w-full space-y-6">
              <h2 className="text-[28px] font-semibold text-white">Who pays you every month?</h2>
              {agencyBizName && <p className="text-sm text-gray-400">{agencyBizName}</p>}
              <div className="space-y-3">
                {SUGGESTED_CLIENTS.map((client, i) => {
                  const added = addedClients.has(i)
                  const net = client.grossMonthly - client.adSpend - client.grossMonthly * 0.03
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, ease: [0.22, 1, 0.36, 1] as const }}
                      className={`card p-4 flex items-center justify-between border ${added ? 'border-emerald-500/50' : 'border-[#1e2338]'} rounded-[16px]`}
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{client.name}</p>
                        <p className="text-xs text-gray-500">
                          ${client.grossMonthly.toLocaleString()} gross &middot; ${client.adSpend.toLocaleString()} ads &middot; <span className="text-emerald-400">${Math.round(net).toLocaleString()} net</span>
                        </p>
                        <p className="text-xs text-gray-600">{client.serviceType} &middot; {client.meetingFrequency}</p>
                      </div>
                      <button
                        onClick={() => {
                          const n = new Set(addedClients)
                          if (added) n.delete(i); else n.add(i)
                          setAddedClients(n)
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${added ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#1e2338] text-gray-300 hover:bg-[#2a3050]'}`}
                      >
                        {added ? '✓ Added' : 'Add'}
                      </button>
                    </motion.div>
                  )
                })}
              </div>

              {!showCustomClient && (
                <button onClick={() => setShowCustomClient(true)} className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">+ Add custom client</button>
              )}
              {showCustomClient && (
                <div className="card p-4 rounded-[16px] space-y-3">
                  <input value={customClient.name} onChange={e => setCustomClient({ ...customClient, name: e.target.value })} placeholder="Client name" className={inputCls} />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={customClient.grossMonthly || ''} onChange={e => setCustomClient({ ...customClient, grossMonthly: Number(e.target.value) })} placeholder="Gross monthly" className={inputCls} />
                    <input type="number" value={customClient.adSpend || ''} onChange={e => setCustomClient({ ...customClient, adSpend: Number(e.target.value) })} placeholder="Ad spend" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={customClient.serviceType} onChange={e => setCustomClient({ ...customClient, serviceType: e.target.value })} placeholder="Service type" className={inputCls} />
                    <select value={customClient.meetingFrequency} onChange={e => setCustomClient({ ...customClient, meetingFrequency: e.target.value })} className={inputCls}>
                      {['None', 'Weekly', 'Biweekly', 'Monthly'].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      if (customClient.name) {
                        const agencyBiz = store.businesses.find(b => b.type === 'agency' || b.type === 'service')
                        if (agencyBiz) {
                          store.addClient({ businessId: agencyBiz.id, name: customClient.name, grossMonthly: customClient.grossMonthly, adSpend: customClient.adSpend, serviceType: customClient.serviceType, meetingFrequency: customClient.meetingFrequency, active: true })
                        }
                        setCustomClient({ name: '', grossMonthly: 0, adSpend: 0, serviceType: '', meetingFrequency: 'None' })
                        setShowCustomClient(false)
                      }
                    }}
                    className={`${btnPrimary} text-sm px-4 py-2`}
                  >
                    Add Client
                  </button>
                </div>
              )}

              {addedClients.size > 0 && (
                <div className="card p-3 rounded-[12px] text-center">
                  <p className="text-sm text-gray-400">Running total: <span className="text-emerald-400 font-semibold">
                    ${SUGGESTED_CLIENTS.filter((_, i) => addedClients.has(i)).reduce((s, c) => s + c.grossMonthly, 0).toLocaleString()}/mo gross
                  </span></p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.03 }} onClick={next} className={btnPrimary}>Next &rarr;</motion.button>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════
      // Screen 5: Connect Tools
      // ════════════════════════
      case 5:
        return (
          <motion.div key="s5" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans} className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-lg w-full space-y-6">
              <h2 className="text-[28px] font-semibold text-white">Connect Your Tools</h2>
              <p className="text-gray-400 text-sm">Let&apos;s connect your data sources.</p>

              <div className="space-y-4">
                {/* Anthropic */}
                <div className="card p-4 rounded-[16px] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">🧠 Anthropic API</span>
                    {aiTestResult === 'pass' && <span className="text-emerald-400 text-sm">✅ Connected</span>}
                    {aiTestResult === 'fail' && <span className="text-red-400 text-sm">❌ Failed</span>}
                  </div>
                  <input value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} placeholder="sk-ant-..." className={inputCls} type="password" />
                  <button onClick={testAi} disabled={!anthropicKey || aiTestResult === 'loading'} className="text-xs text-emerald-400 hover:text-emerald-300 disabled:text-gray-600 transition-colors">
                    {aiTestResult === 'loading' ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>

                {/* Stripe */}
                <div className="card p-4 rounded-[16px] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">💳 Stripe</span>
                    <span className="text-xs text-gray-600">Coming soon — enter for later</span>
                  </div>
                  <input value={stripeKey} onChange={e => setStripeKey(e.target.value)} placeholder="sk_live_..." className={inputCls} type="password" />
                </div>

                {/* Plaid */}
                <div className="card p-4 rounded-[16px] opacity-50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">🏦 Plaid</span>
                    <span className="text-xs text-gray-600">Coming soon</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <div className="flex gap-3 items-center">
                  <button onClick={() => { setStep(s => s + 1) }} className="text-gray-400 text-sm hover:text-white transition-colors">Skip for now</button>
                  <motion.button whileHover={{ scale: 1.03 }} onClick={() => { store.updateProfile({ anthropicKey, stripeKey }); next() }} className={btnPrimary}>Next &rarr;</motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════
      // Screen 6: Health & Faith
      // ════════════════════════
      case 6:
        return (
          <motion.div key="s6" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans} className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-lg w-full space-y-6">
              <h2 className="text-[28px] font-semibold text-white">Your Health &amp; Faith</h2>
              <p className="text-gray-400 text-sm">Your body runs your business.</p>

              <div className="card p-5 rounded-[16px] space-y-2">
                <Toggle on={trackingPrefs.prayers} onToggle={() => setLocalTrackingPrefs(p => ({ ...p, prayers: !p.prayers }))} label="☪ Prayer tracking" />
                <Toggle on={trackingPrefs.gym} onToggle={() => setLocalTrackingPrefs(p => ({ ...p, gym: !p.gym }))} label="💪 Gym" />
                <Toggle on={trackingPrefs.sleep} onToggle={() => setLocalTrackingPrefs(p => ({ ...p, sleep: !p.sleep }))} label="😴 Sleep" />
                <Toggle on={trackingPrefs.meals} onToggle={() => setLocalTrackingPrefs(p => ({ ...p, meals: !p.meals }))} label="🍎 Meals" />
                <Toggle on={trackingPrefs.energyDrinks} onToggle={() => setLocalTrackingPrefs(p => ({ ...p, energyDrinks: !p.energyDrinks }))} label="⚡ Energy drinks" />
                <Toggle on={trackingPrefs.screenTime} onToggle={() => setLocalTrackingPrefs(p => ({ ...p, screenTime: !p.screenTime }))} label="📱 Screen time" />
                <Toggle on={trackingPrefs.gambling} onToggle={() => setLocalTrackingPrefs(p => ({ ...p, gambling: !p.gambling }))} label="🚫 Gambling-free streak (private)" />
                <Toggle on={trackingPrefs.coldEmail} onToggle={() => setLocalTrackingPrefs(p => ({ ...p, coldEmail: !p.coldEmail }))} label="📧 Cold email streak" />
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.03 }} onClick={() => { store.setTrackingPrefs(trackingPrefs); next() }} className={btnPrimary}>Next &rarr;</motion.button>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════
      // Screen 7: AI Partner
      // ════════════════════════
      case 7:
        return (
          <motion.div key="s7" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans} className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-lg w-full space-y-6 text-center">
              <h2 className="text-[28px] font-semibold text-white">Meet your AI strategist.</h2>

              <motion.div
                className="w-24 h-24 mx-auto rounded-full flex items-center justify-center text-4xl"
                style={{ background: 'linear-gradient(135deg, #10b981, #8b5cf6)' }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                🧠
              </motion.div>

              <div className="space-y-3 text-left max-w-md mx-auto">
                {[
                  "You're doing it again. You have 3 proven channels sitting stale...",
                  "$700 avg ticket × 4 calls/day = $61,600/mo. The gap is lead flow.",
                  "Before we discuss this new idea — have you restarted cold email?",
                ].map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.2, ease: [0.22, 1, 0.36, 1] as const }}
                    className="card p-3 rounded-[12px] text-sm text-gray-300 border-l-2 border-emerald-500/50"
                  >
                    {msg}
                  </motion.div>
                ))}
              </div>

              <p className="text-sm text-gray-400 italic">I&apos;ll be direct with you. I&apos;ll call out when you&apos;re spreading thin.</p>

              <div className="flex items-center justify-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${anthropicKey ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                <span className="text-gray-500">{anthropicKey ? 'API connected' : 'API not connected'}</span>
              </div>

              <div className="flex justify-between pt-4">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.03 }} onClick={next} className={btnPrimary}>Next &rarr;</motion.button>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════
      // Screen 8: You're Ready
      // ════════════════════════
      case 8:
        return (
          <motion.div key="s8" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans} className="min-h-screen flex items-center justify-center p-6 relative">
            <Confetti />
            <div className="max-w-lg w-full text-center space-y-6 relative z-10">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">ART OS is ready.</h2>
              <p className="text-gray-400">
                {addedBizCount} business{addedBizCount !== 1 ? 'es' : ''} &middot; {addedClientCount} client{addedClientCount !== 1 ? 's' : ''} &middot; ${totalMRR.toLocaleString()} MRR
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  store.completeOnboarding()
                  store.setAuthenticated(true)
                  router.push('/dashboard')
                }}
                className={`${btnPrimary} text-lg px-10 py-4`}
              >
                Enter ART OS &rarr;
              </motion.button>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#080a10] text-white" style={{ background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.04) 0%, #080a10 70%)' }}>
      {/* Progress bar */}
      {step > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#1e2338]">
          <motion.div
            className="h-full bg-emerald-500"
            animate={{ width: `${(step / (totalScreens - 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}
      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>
    </div>
  )
}

// ══════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════
export default function Page() {
  const { authenticated, onboardingComplete, seedDefaultData } = useStore()
  const router = useRouter()

  useEffect(() => {
    seedDefaultData()
  }, [seedDefaultData])

  useEffect(() => {
    if (authenticated) router.push('/dashboard')
  }, [authenticated, router])

  if (authenticated) return null

  if (onboardingComplete) return <PinEntry />

  return <OnboardingWizard />
}
