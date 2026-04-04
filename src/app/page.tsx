"use client"

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useStore } from '@/stores/store'
import type { BusinessType, BusinessStatus } from '@/stores/store'
import { BUSINESS_TYPES, BUSINESS_STATUSES, COLOR_SWATCHES, MEETING_FREQUENCIES } from '@/lib/constants'

// ── Styling constants ──
const inputCls = 'w-full bg-[#0e1018] border border-white/[0.06] rounded-[14px] text-[15px] py-3.5 px-4 text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all'
const labelCls = 'block text-[11px] font-mono uppercase tracking-[2px] text-[#8892b0] mb-1.5'
const btnPrimary = 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold rounded-[14px] px-8 py-3.5 text-[15px] hover:shadow-[0_8px_24px_rgba(16,185,129,0.25)] transition-all'
const btnSecondary = 'border border-white/[0.08] text-white/50 rounded-[14px] px-6 py-3 text-[14px] hover:bg-white/[0.03] transition-all'

// ── Slide transition ──
const variants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
}
const transition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }

// ── Default emoji for business type ──
const defaultIcon: Record<string, string> = {
  agency: '⬡', service: '🔧', app: '📱', content: '🎙', real_estate: '🏠', coaching: '🎯', other: '📦',
}

// ── Floating particles ──
function Particles() {
  const dots = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: 3 + Math.random() * 4, dur: 4 + Math.random() * 4, delay: Math.random() * 3,
  })), [])
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map(d => (
        <motion.div key={d.id} className="absolute rounded-full bg-emerald-500/20"
          style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.size, height: d.size }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ── Confetti ──
function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i, x: Math.random() * 100,
    color: ['#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6', '#06b6d4'][i % 6],
    size: 6 + Math.random() * 6, dur: 2 + Math.random() * 3, delay: Math.random() * 2,
  })), [])
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map(p => (
        <motion.div key={p.id} className="absolute rounded-full"
          style={{ left: `${p.x}%`, bottom: -20, width: p.size, height: p.size, backgroundColor: p.color }}
          animate={{ y: [-20, -500], opacity: [1, 0], x: [0, (Math.random() - 0.5) * 100] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  )
}

// ── Toggle ──
function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-3 w-full py-3 text-left">
      <motion.div className={`relative w-11 h-6 rounded-full flex-shrink-0 ${on ? 'bg-emerald-600' : 'bg-[#1e2338]'}`} transition={{ duration: 0.2 }}>
        <motion.div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow"
          animate={{ left: on ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, #07080d 70%)' }}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
        className="bg-[#0e1018] border border-white/[0.06] rounded-[16px] p-8 text-center max-w-sm w-full">
        <h2 className="text-xl font-semibold text-white mb-2">Enter PIN</h2>
        <p className="text-sm text-gray-400 mb-6">Access your ART OS</p>
        <motion.div className="flex justify-center gap-3 mb-4"
          animate={error ? { x: [0, -10, 10, -10, 0] } : {}} transition={{ duration: 0.4 }}>
          {digits.map((d, i) => (
            <input key={i} ref={refs[i]} type="password" maxLength={1} value={d}
              onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)}
              className={`w-16 h-20 text-center text-2xl font-bold bg-[#0e1018] border-2 ${error ? 'border-red-500' : d ? 'border-emerald-500' : 'border-white/[0.06]'} rounded-[16px] text-white focus:outline-none focus:border-emerald-500/50 transition-colors`}
            />
          ))}
        </motion.div>
        {error && <p className="text-red-400 text-sm">Incorrect PIN</p>}
      </motion.div>
    </div>
  )
}

// ══════════════════════════════════════════
// Business form local type
// ══════════════════════════════════════════
interface LocalBusiness {
  name: string; type: BusinessType; status: BusinessStatus
  monthlyRevenue: number; role: string; color: string; icon: string; notes: string
  expanded: boolean
}

interface LocalClient {
  name: string; grossMonthly: number; adSpend: number; serviceType: string
  meetingFrequency: string; health: string
}

interface LocalExpense {
  name: string; amount: number; recurring: boolean
}

// ══════════════════════════════════════════
// Onboarding Wizard (13 screens)
// ══════════════════════════════════════════
function OnboardingWizard() {
  const store = useStore()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const totalSteps = 13

  // ── Screen 1: About You ──
  const [firstName, setFirstName] = useState('')
  const [location, setLocation] = useState('')
  const [age, setAge] = useState<number | ''>('')
  const [situation, setSituation] = useState('')

  // ── Screen 2: Businesses ──
  const [businesses, setBusinesses] = useState<LocalBusiness[]>([{
    name: '', type: 'agency', status: 'active_healthy', monthlyRevenue: 0, role: 'Owner-Operator',
    color: '#10b981', icon: '⬡', notes: '', expanded: true,
  }])

  // ── Screen 3: Revenue / Clients ──
  const [clientsByBiz, setClientsByBiz] = useState<Record<number, { hasRecurring: boolean; clients: LocalClient[] }>>({})

  // ── Screen 4: Expenses ──
  const [expenses, setExpenses] = useState<LocalExpense[]>([
    { name: 'Housing', amount: 0, recurring: true },
    { name: 'Car payment(s)', amount: 0, recurring: true },
    { name: 'Insurance', amount: 0, recurring: true },
    { name: 'Phone', amount: 0, recurring: true },
    { name: 'Subscriptions', amount: 0, recurring: true },
    { name: 'Food', amount: 0, recurring: true },
    { name: 'Other', amount: 0, recurring: true },
  ])
  const [savingsRange, setSavingsRange] = useState('Under $5K')

  // ── Screen 5: Goals ──
  const [incomeTarget, setIncomeTarget] = useState(50000)
  const [targetDate, setTargetDate] = useState('')
  const [incomeWhy, setIncomeWhy] = useState('')
  const [planToSell, setPlanToSell] = useState(false)
  const [sellBizIdx, setSellBizIdx] = useState(0)
  const [sellPrice, setSellPrice] = useState<number | ''>('')
  const [northStar, setNorthStar] = useState('')

  // ── Screen 6: Habits ──
  const [desiredWake, setDesiredWake] = useState('06:00')
  const [actualWake, setActualWake] = useState('08:00')
  const [exerciseFreq, setExerciseFreq] = useState('')
  const [dietQuality, setDietQuality] = useState('')
  const [caffeineType, setCaffeineType] = useState('')
  const [caffeineAmount, setCaffeineAmount] = useState(2)
  const [screenTime, setScreenTime] = useState(4)
  const [energyLevel, setEnergyLevel] = useState(5)
  const [stressLevel, setStressLevel] = useState(5)

  // ── Screen 7: Faith ──
  const [hasFaith, setHasFaith] = useState(false)
  const [faithTradition, setFaithTradition] = useState('')
  const [trackPrayers, setTrackPrayers] = useState(false)
  const [faithConsistency, setFaithConsistency] = useState('')
  const [faithRoleModel, setFaithRoleModel] = useState('')

  // ── Screen 8: Struggles ──
  const [procrastination, setProcrastination] = useState('')
  const [patterns, setPatterns] = useState('')
  const [biggestDistraction, setBiggestDistraction] = useState('')
  const [tryingToQuit, setTryingToQuit] = useState('')
  const [lockedInMemory, setLockedInMemory] = useState('')

  // ── Screen 9: AI prefs ──
  const [aiAvoidance, setAiAvoidance] = useState('')
  const [aiPush, setAiPush] = useState('')
  const [aiMotivators, setAiMotivators] = useState<string[]>([])

  // ── Screen 10: Tools ──
  const [anthropicKey, setAnthropicKey] = useState('')
  const [stripeKey, setStripeKey] = useState('')
  const [aiTestResult, setAiTestResult] = useState<'idle' | 'loading' | 'pass' | 'fail'>('idle')

  // ── Screen 11: PIN ──
  const [pinDigits, setPinDigits] = useState(['', '', '', ''])
  const [confirmDigits, setConfirmDigits] = useState(['', '', '', ''])
  const [pinPhase, setPinPhase] = useState<'set' | 'confirm'>('set')
  const [pinError, setPinError] = useState('')
  const pinRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]
  const confirmRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  // ── Derived data ──
  const qualifyingBizIndices = useMemo(() => {
    return businesses.map((b, i) => ({ b, i }))
      .filter(({ b }) => b.monthlyRevenue > 0 || b.type === 'agency' || b.type === 'service' || b.type === 'coaching')
      .map(({ i }) => i)
  }, [businesses])

  const totalMRR = useMemo(() => {
    let sum = 0
    Object.values(clientsByBiz).forEach(entry => {
      entry.clients.forEach(c => { sum += c.grossMonthly })
    })
    return sum
  }, [clientsByBiz])

  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses])

  const totalBizRevenue = useMemo(() => businesses.reduce((s, b) => s + b.monthlyRevenue, 0), [businesses])

  // ── Navigation ──
  const next = useCallback(() => {
    // Skip revenue screen if no qualifying businesses
    if (step === 2 && qualifyingBizIndices.length === 0) {
      setStep(4)
      return
    }
    setStep(s => Math.min(s + 1, totalSteps - 1))
  }, [step, qualifyingBizIndices.length, totalSteps])

  const prev = useCallback(() => {
    if (step === 4 && qualifyingBizIndices.length === 0) {
      setStep(2)
      return
    }
    setStep(s => Math.max(0, s - 1))
  }, [step, qualifyingBizIndices.length])

  // ── Business helpers ──
  const addBusiness = useCallback(() => {
    setBusinesses(prev => [...prev, {
      name: '', type: 'other', status: 'idea', monthlyRevenue: 0, role: 'Owner-Operator',
      color: COLOR_SWATCHES[prev.length % COLOR_SWATCHES.length], icon: '📦', notes: '', expanded: true,
    }])
  }, [])

  const updateBiz = useCallback((idx: number, updates: Partial<LocalBusiness>) => {
    setBusinesses(prev => prev.map((b, i) => i === idx ? { ...b, ...updates } : b))
  }, [])

  const deleteBiz = useCallback((idx: number) => {
    setBusinesses(prev => prev.filter((_, i) => i !== idx))
  }, [])

  // ── Client helpers ──
  const toggleRecurring = useCallback((bizIdx: number) => {
    setClientsByBiz(prev => {
      const entry = prev[bizIdx] || { hasRecurring: false, clients: [] }
      return { ...prev, [bizIdx]: { ...entry, hasRecurring: !entry.hasRecurring, clients: entry.hasRecurring ? [] : entry.clients } }
    })
  }, [])

  const addClientToBiz = useCallback((bizIdx: number) => {
    setClientsByBiz(prev => {
      const entry = prev[bizIdx] || { hasRecurring: true, clients: [] }
      return { ...prev, [bizIdx]: { ...entry, clients: [...entry.clients, { name: '', grossMonthly: 0, adSpend: 0, serviceType: '', meetingFrequency: 'Monthly', health: 'Good' }] } }
    })
  }, [])

  const updateClientInBiz = useCallback((bizIdx: number, clientIdx: number, updates: Partial<LocalClient>) => {
    setClientsByBiz(prev => {
      const entry = prev[bizIdx]
      if (!entry) return prev
      const clients = entry.clients.map((c, i) => i === clientIdx ? { ...c, ...updates } : c)
      return { ...prev, [bizIdx]: { ...entry, clients } }
    })
  }, [])

  const deleteClientFromBiz = useCallback((bizIdx: number, clientIdx: number) => {
    setClientsByBiz(prev => {
      const entry = prev[bizIdx]
      if (!entry) return prev
      return { ...prev, [bizIdx]: { ...entry, clients: entry.clients.filter((_, i) => i !== clientIdx) } }
    })
  }, [])

  // ── Expense helpers ──
  const updateExpense = useCallback((idx: number, updates: Partial<LocalExpense>) => {
    setExpenses(prev => prev.map((e, i) => i === idx ? { ...e, ...updates } : e))
  }, [])

  const addExpense = useCallback(() => {
    setExpenses(prev => [...prev, { name: '', amount: 0, recurring: true }])
  }, [])

  const deleteExpense = useCallback((idx: number) => {
    setExpenses(prev => prev.filter((_, i) => i !== idx))
  }, [])

  // ── PIN handling ──
  const handlePinInput = useCallback((phase: 'set' | 'confirm', i: number, v: string) => {
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
          setStep(12)
        } else {
          setPinError("PINs don't match")
          setConfirmDigits(['', '', '', ''])
          setTimeout(() => confirmRefs[0].current?.focus(), 300)
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinDigits, confirmDigits, store])

  const handlePinKeyDown = useCallback((phase: 'set' | 'confirm', i: number, e: React.KeyboardEvent) => {
    const arr = phase === 'set' ? pinDigits : confirmDigits
    const refsArr = phase === 'set' ? pinRefs : confirmRefs
    if (e.key === 'Backspace' && !arr[i] && i > 0) refsArr[i - 1].current?.focus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinDigits, confirmDigits])

  // ── AI test ──
  const testAi = useCallback(async () => {
    setAiTestResult('loading')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: 'Say hello in 5 words.' }], apiKey: anthropicKey }),
      })
      setAiTestResult(res.ok ? 'pass' : 'fail')
    } catch { setAiTestResult('fail') }
  }, [anthropicKey])

  // ── Motivator toggle ──
  const toggleMotivator = useCallback((m: string) => {
    setAiMotivators(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m])
  }, [])

  // ── Final save & launch ──
  const launchApp = useCallback(() => {
    // 1. Add businesses
    const bizIds: string[] = []
    businesses.forEach(b => {
      if (b.name) {
        const noteWithRole = b.role ? `Role: ${b.role}\n${b.notes}` : b.notes
        store.addBusiness({
          name: b.name, type: b.type, status: b.status,
          monthlyRevenue: b.monthlyRevenue, color: b.color, icon: b.icon, notes: noteWithRole,
        })
      }
    })
    // Get stored biz ids after adding
    const storedBiz = store.businesses

    // 2. Add clients
    Object.entries(clientsByBiz).forEach(([bizIdxStr, entry]) => {
      const bizIdx = parseInt(bizIdxStr)
      const matchedBiz = storedBiz.find(sb => sb.name === businesses[bizIdx]?.name)
      if (matchedBiz) {
        entry.clients.forEach(c => {
          if (c.name) {
            store.addClient({
              businessId: matchedBiz.id, name: c.name, grossMonthly: c.grossMonthly,
              adSpend: c.adSpend, serviceType: c.serviceType,
              meetingFrequency: c.meetingFrequency, active: true,
            })
          }
        })
      }
    })

    // 3. Add expenses
    const today = new Date().toISOString().split('T')[0]
    expenses.forEach(exp => {
      if (exp.amount > 0) {
        store.addExpense({
          category: exp.name, amount: exp.amount, date: today,
          recurring: exp.recurring, notes: '',
        })
      }
    })

    // 4. Save profile
    store.updateProfile({
      userName: firstName,
      userLocation: location,
      userAge: typeof age === 'number' ? age : 0,
      userSituation: situation,
      incomeTarget,
      targetDate,
      incomeWhy,
      exitTarget: typeof sellPrice === 'number' ? sellPrice : 0,
      exitBusinessId: planToSell && businesses[sellBizIdx] ? businesses[sellBizIdx].name : '',
      northStarMetric: northStar,
      wakeUpTime: desiredWake,
      actualWakeTime: actualWake,
      exercise: exerciseFreq,
      dietQuality,
      caffeineType,
      caffeineAmount,
      phoneScreenTime: screenTime,
      energyLevel,
      stressLevel,
      hasFaith,
      faithTradition,
      trackPrayers,
      faithConsistency,
      faithRoleModel,
      procrastination,
      patterns,
      biggestDistraction,
      tryingToQuit,
      lockedInMemory,
      aiAvoidanceStyle: aiAvoidance,
      aiPushStyle: aiPush,
      aiMotivators,
      savingsRange,
      anthropicKey,
      stripeKey,
    })

    // 5. Complete
    store.completeOnboarding()
    store.setAuthenticated(true)
    router.push('/dashboard')
  }, [businesses, clientsByBiz, expenses, firstName, location, age, situation, incomeTarget, targetDate, incomeWhy, planToSell, sellBizIdx, sellPrice, northStar, desiredWake, actualWake, exerciseFreq, dietQuality, caffeineType, caffeineAmount, screenTime, energyLevel, stressLevel, hasFaith, faithTradition, trackPrayers, faithConsistency, faithRoleModel, procrastination, patterns, biggestDistraction, tryingToQuit, lockedInMemory, aiAvoidance, aiPush, aiMotivators, savingsRange, anthropicKey, stripeKey, store, router])

  // ── Render ──
  const renderScreen = () => {
    switch (step) {

      // ════════════════════════════════════
      // Screen 0: Welcome
      // ════════════════════════════════════
      case 0:
        return (
          <motion.div key="s0" variants={variants} initial="enter" animate="center" exit="exit" transition={transition}
            className="min-h-screen flex flex-col items-center justify-center relative">
            <Particles />
            <h1 className="data text-[56px] font-[800] tracking-[12px] text-[#10b981] relative z-10">ART OS</h1>
            <div className="w-32 h-1 bg-emerald-500/30 blur-xl mx-auto mt-2" />
            <p className="text-[18px] text-[#8892b0] mt-6 relative z-10 text-center max-w-md">
              The operating system for ambitious entrepreneurs.
            </p>
            <p className="text-[14px] text-white/30 mt-4 relative z-10 text-center max-w-sm">
              I&apos;ll ask you a lot of questions. The more honest you are, the smarter I get.
            </p>
            <p className="text-[14px] text-white/30 mt-2 relative z-10 text-center max-w-sm">
              This takes about 10 minutes. It&apos;s worth it.
            </p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={next} className={`${btnPrimary} mt-12 relative z-10`}>
              Let&apos;s go &rarr;
            </motion.button>
          </motion.div>
        )

      // ════════════════════════════════════
      // Screen 1: About You
      // ════════════════════════════════════
      case 1:
        return (
          <motion.div key="s1" variants={variants} initial="enter" animate="center" exit="exit" transition={transition}
            className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-xl w-full mx-auto space-y-6">
              <h2 className="text-[28px] font-semibold text-white">Let&apos;s start with you.</h2>
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>FIRST NAME</label>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} className={inputCls} placeholder="Your first name" />
                </div>
                <div>
                  <label className={labelCls}>LOCATION (CITY, STATE)</label>
                  <input value={location} onChange={e => setLocation(e.target.value)} className={inputCls} placeholder="Westland, MI" />
                </div>
                <div>
                  <label className={labelCls}>AGE</label>
                  <input type="number" value={age} onChange={e => setAge(e.target.value ? Number(e.target.value) : '')} className={inputCls} placeholder="28" />
                </div>
                <div>
                  <label className={labelCls}>DESCRIBE YOUR CURRENT SITUATION IN 2-3 SENTENCES</label>
                  <textarea value={situation} onChange={e => setSituation(e.target.value)} className={`${inputCls} min-h-[100px] resize-none`}
                    placeholder="What's your life look like right now? Be honest." />
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={next} className={btnPrimary} disabled={!firstName}>Next &rarr;</motion.button>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════════════════
      // Screen 2: Your Businesses
      // ════════════════════════════════════
      case 2:
        return (
          <motion.div key="s2" variants={variants} initial="enter" animate="center" exit="exit" transition={transition}
            className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-xl w-full mx-auto space-y-5">
              <h2 className="text-[28px] font-semibold text-white">Your Businesses</h2>
              <p className="text-[14px] text-[#8892b0]">How many businesses do you run? Add them all.</p>

              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {businesses.map((biz, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] as const }}
                    className="bg-[#0e1018] border border-white/[0.06] rounded-[16px] p-4">
                    {/* Header row */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => updateBiz(idx, { expanded: !biz.expanded })}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-base" style={{ backgroundColor: `${biz.color}22` }}>
                        {biz.icon || defaultIcon[biz.type] || '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-white truncate">{biz.name || `Business ${idx + 1}`}</p>
                        {biz.monthlyRevenue > 0 && <p className="text-[12px] text-emerald-400 font-mono">${biz.monthlyRevenue.toLocaleString()}/mo</p>}
                      </div>
                      <span className="text-white/30 text-xs">{biz.expanded ? '▾' : '▸'}</span>
                      {businesses.length > 1 && (
                        <button onClick={e => { e.stopPropagation(); deleteBiz(idx) }}
                          className="text-red-400/50 hover:text-red-400 text-xs ml-1">✕</button>
                      )}
                    </div>

                    {/* Expanded form */}
                    {biz.expanded && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className={labelCls}>NAME</label>
                          <input value={biz.name} onChange={e => updateBiz(idx, { name: e.target.value })} className={inputCls} placeholder="Business name" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>TYPE</label>
                            <select value={biz.type} onChange={e => updateBiz(idx, { type: e.target.value as BusinessType, icon: defaultIcon[e.target.value] || biz.icon })} className={inputCls}>
                              {BUSINESS_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>STATUS</label>
                            <select value={biz.status} onChange={e => updateBiz(idx, { status: e.target.value as BusinessStatus })} className={inputCls}>
                              {BUSINESS_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={labelCls}>MONTHLY REVENUE ($)</label>
                            <input type="number" value={biz.monthlyRevenue || ''} onChange={e => updateBiz(idx, { monthlyRevenue: Number(e.target.value) })} className={inputCls} placeholder="0" />
                          </div>
                          <div>
                            <label className={labelCls}>YOUR ROLE</label>
                            <select value={biz.role} onChange={e => updateBiz(idx, { role: e.target.value })} className={inputCls}>
                              {['Owner-Operator', 'Manager', 'Passive', 'Partner'].map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>COLOR</label>
                          <div className="flex gap-2 mt-1">
                            {COLOR_SWATCHES.map(c => (
                              <button key={c} onClick={() => updateBiz(idx, { color: c })}
                                className={`w-7 h-7 rounded-full border-2 transition-all ${biz.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={labelCls}>ICON / EMOJI</label>
                          <input value={biz.icon} onChange={e => updateBiz(idx, { icon: e.target.value })} className={`${inputCls} w-24`} placeholder="📦" />
                        </div>
                        <div>
                          <label className={labelCls}>WHAT DO YOU DO DAY-TO-DAY FOR THIS BUSINESS?</label>
                          <textarea value={biz.notes} onChange={e => updateBiz(idx, { notes: e.target.value })}
                            className={`${inputCls} min-h-[70px] resize-none`} placeholder="Sales, fulfillment, operations..." />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <button onClick={addBusiness} className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                + Add another business
              </button>

              <div className="flex justify-between pt-2">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={next} className={btnPrimary}>Next &rarr;</motion.button>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════════════════
      // Screen 3: Revenue Details / Clients
      // ════════════════════════════════════
      case 3:
        return (
          <motion.div key="s3" variants={variants} initial="enter" animate="center" exit="exit" transition={transition}
            className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-xl w-full mx-auto space-y-5">
              <h2 className="text-[28px] font-semibold text-white">Revenue Details</h2>
              <p className="text-[14px] text-[#8892b0]">Tell me about recurring revenue for each qualifying business.</p>

              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {qualifyingBizIndices.map(bizIdx => {
                  const biz = businesses[bizIdx]
                  const entry = clientsByBiz[bizIdx] || { hasRecurring: false, clients: [] }
                  return (
                    <div key={bizIdx} className="bg-[#0e1018] border border-white/[0.06] rounded-[16px] p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: `${biz.color}22` }}>{biz.icon}</div>
                        <p className="text-[15px] font-semibold text-white">{biz.name || `Business ${bizIdx + 1}`}</p>
                      </div>

                      <Toggle on={entry.hasRecurring} onToggle={() => toggleRecurring(bizIdx)} label="Do you have recurring clients?" />

                      {entry.hasRecurring && (
                        <div className="space-y-3 pl-2">
                          {entry.clients.map((client, ci) => (
                            <div key={ci} className="bg-white/[0.02] border border-white/[0.04] rounded-[12px] p-3 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[12px] text-[#8892b0] font-mono">Client {ci + 1}</span>
                                <button onClick={() => deleteClientFromBiz(bizIdx, ci)} className="text-red-400/50 hover:text-red-400 text-xs">✕</button>
                              </div>
                              <input value={client.name} onChange={e => updateClientInBiz(bizIdx, ci, { name: e.target.value })}
                                className={inputCls} placeholder="Client name" />
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className={labelCls}>MONTHLY FEE ($)</label>
                                  <input type="number" value={client.grossMonthly || ''} onChange={e => updateClientInBiz(bizIdx, ci, { grossMonthly: Number(e.target.value) })}
                                    className={inputCls} placeholder="0" />
                                </div>
                                <div>
                                  <label className={labelCls}>AD SPEND ($)</label>
                                  <input type="number" value={client.adSpend || ''} onChange={e => updateClientInBiz(bizIdx, ci, { adSpend: Number(e.target.value) })}
                                    className={inputCls} placeholder="0" />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className={labelCls}>SERVICE</label>
                                  <input value={client.serviceType} onChange={e => updateClientInBiz(bizIdx, ci, { serviceType: e.target.value })}
                                    className={inputCls} placeholder="SEO, Ads..." />
                                </div>
                                <div>
                                  <label className={labelCls}>MEETINGS</label>
                                  <select value={client.meetingFrequency} onChange={e => updateClientInBiz(bizIdx, ci, { meetingFrequency: e.target.value })} className={inputCls}>
                                    {MEETING_FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className={labelCls}>HEALTH</label>
                                  <select value={client.health} onChange={e => updateClientInBiz(bizIdx, ci, { health: e.target.value })} className={inputCls}>
                                    {['Great', 'Good', 'Okay', 'At risk'].map(h => <option key={h} value={h}>{h}</option>)}
                                  </select>
                                </div>
                              </div>
                            </div>
                          ))}
                          <button onClick={() => addClientToBiz(bizIdx)}
                            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">+ Add client</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {totalMRR > 0 && (
                <div className="bg-[#0e1018] border border-white/[0.06] rounded-[12px] p-3 text-center">
                  <p className="font-mono text-[14px] text-[#8892b0]">
                    MRR: <span className="text-emerald-400 font-semibold">${totalMRR.toLocaleString()}</span>
                    {' '}&middot; Net after 3% fees: <span className="text-emerald-400">${Math.round(totalMRR * 0.97).toLocaleString()}</span>
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={next} className={btnPrimary}>Next &rarr;</motion.button>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════════════════
      // Screen 4: Expenses
      // ════════════════════════════════════
      case 4:
        return (
          <motion.div key="s4" variants={variants} initial="enter" animate="center" exit="exit" transition={transition}
            className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-xl w-full mx-auto space-y-5">
              <h2 className="text-[28px] font-semibold text-white">Your Expenses</h2>
              <p className="text-[14px] text-[#8892b0]">Let&apos;s understand where your money goes.</p>

              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                {expenses.map((exp, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, ease: [0.22, 1, 0.36, 1] as const }}
                    className="flex items-center gap-3 bg-[#0e1018] border border-white/[0.06] rounded-[14px] p-3">
                    <input value={exp.name} onChange={e => updateExpense(idx, { name: e.target.value })}
                      className="bg-transparent text-white text-[14px] w-36 focus:outline-none placeholder-white/20" placeholder="Category" />
                    <div className="flex items-center gap-1 flex-1">
                      <span className="text-white/30 text-sm">$</span>
                      <input type="number" value={exp.amount || ''} onChange={e => updateExpense(idx, { amount: Number(e.target.value) })}
                        className="bg-transparent text-white text-[14px] w-full focus:outline-none placeholder-white/20" placeholder="0" />
                    </div>
                    <button onClick={() => updateExpense(idx, { recurring: !exp.recurring })}
                      className={`text-[10px] px-2 py-1 rounded-md border ${exp.recurring ? 'border-emerald-500/30 text-emerald-400' : 'border-white/10 text-white/30'}`}>
                      {exp.recurring ? 'REC' : 'ONE'}
                    </button>
                    <button onClick={() => deleteExpense(idx)} className="text-red-400/40 hover:text-red-400 text-xs">✕</button>
                  </motion.div>
                ))}
              </div>

              <button onClick={addExpense} className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                + Add expense
              </button>

              <div className="bg-[#0e1018] border border-white/[0.06] rounded-[12px] p-3 text-center">
                <p className="font-mono text-[14px] text-[#8892b0]">
                  Total: <span className="text-rose-400 font-semibold">${totalExpenses.toLocaleString()}/mo</span>
                </p>
              </div>

              <div>
                <label className={labelCls}>SAVINGS?</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['Under $5K', '$5-20K', '$20-50K', '$50-100K', '$100K+'].map(r => (
                    <button key={r} onClick={() => setSavingsRange(r)}
                      className={`px-3 py-1.5 rounded-[10px] text-[13px] border transition-all ${savingsRange === r ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/[0.06] text-white/40 hover:bg-white/[0.03]'}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={next} className={btnPrimary}>Next &rarr;</motion.button>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════════════════
      // Screen 5: Goals
      // ════════════════════════════════════
      case 5:
        return (
          <motion.div key="s5" variants={variants} initial="enter" animate="center" exit="exit" transition={transition}
            className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-xl w-full mx-auto space-y-5">
              <h2 className="text-[28px] font-semibold text-white">What are you building toward?</h2>

              <div>
                <label className={labelCls}>MONTHLY INCOME TARGET</label>
                <p className="text-[36px] font-mono font-bold text-emerald-400 mb-2">${incomeTarget.toLocaleString()}/mo</p>
                <input type="range" min={10000} max={200000} step={5000} value={incomeTarget}
                  onChange={e => setIncomeTarget(Number(e.target.value))}
                  className="w-full h-2 rounded-full bg-[#1e2338] appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer" />
                <div className="flex justify-between text-[11px] text-white/20 mt-1"><span>$10K</span><span>$200K</span></div>
              </div>

              <div>
                <label className={labelCls}>TARGET DATE</label>
                <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>WHY THIS NUMBER?</label>
                <textarea value={incomeWhy} onChange={e => setIncomeWhy(e.target.value)}
                  className={`${inputCls} min-h-[80px] resize-none`} placeholder="What changes when you hit this?" />
              </div>

              <div>
                <Toggle on={planToSell} onToggle={() => setPlanToSell(!planToSell)} label="Do you plan to sell any business?" />
                {planToSell && (
                  <div className="space-y-3 pl-2 mt-2">
                    <div>
                      <label className={labelCls}>WHICH BUSINESS?</label>
                      <select value={sellBizIdx} onChange={e => setSellBizIdx(Number(e.target.value))} className={inputCls}>
                        {businesses.map((b, i) => <option key={i} value={i}>{b.name || `Business ${i + 1}`}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>TARGET SALE PRICE ($)</label>
                      <input type="number" value={sellPrice} onChange={e => setSellPrice(e.target.value ? Number(e.target.value) : '')} className={inputCls} placeholder="1000000" />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>WHAT&apos;S YOUR ONE NORTH STAR METRIC?</label>
                <input value={northStar} onChange={e => setNorthStar(e.target.value)} className={inputCls}
                  placeholder="e.g. Monthly recurring revenue, # of clients, net profit..." />
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={next} className={btnPrimary}>Next &rarr;</motion.button>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════════════════
      // Screen 6: Habits
      // ════════════════════════════════════
      case 6:
        return (
          <motion.div key="s6" variants={variants} initial="enter" animate="center" exit="exit" transition={transition}
            className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-xl w-full mx-auto space-y-5">
              <h2 className="text-[28px] font-semibold text-white">Your Habits</h2>
              <p className="text-[14px] text-[#8892b0]">Your body runs your business.</p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>DESIRED WAKE TIME</label>
                  <input type="time" value={desiredWake} onChange={e => setDesiredWake(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>ACTUAL WAKE TIME</label>
                  <input type="time" value={actualWake} onChange={e => setActualWake(e.target.value)} className={inputCls} />
                </div>
              </div>
              {desiredWake !== actualWake && (
                <p className="text-[12px] text-amber-400/70 italic">Be honest. The gap shows the problem.</p>
              )}

              <div>
                <label className={labelCls}>EXERCISE</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['Yes regularly', 'Sometimes', 'Rarely', 'Never'].map(o => (
                    <button key={o} onClick={() => setExerciseFreq(o)}
                      className={`px-3 py-1.5 rounded-[10px] text-[13px] border transition-all ${exerciseFreq === o ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/[0.06] text-white/40 hover:bg-white/[0.03]'}`}>{o}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>DIET QUALITY</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {['Excellent', 'Good', 'Okay', 'Bad'].map(o => (
                    <button key={o} onClick={() => setDietQuality(o)}
                      className={`px-3 py-1.5 rounded-[10px] text-[13px] border transition-all ${dietQuality === o ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/[0.06] text-white/40 hover:bg-white/[0.03]'}`}>{o}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>CAFFEINE TYPE</label>
                  <input value={caffeineType} onChange={e => setCaffeineType(e.target.value)} className={inputCls} placeholder="Coffee, energy drinks..." />
                </div>
                <div>
                  <label className={labelCls}>PER DAY</label>
                  <input type="number" value={caffeineAmount} onChange={e => setCaffeineAmount(Number(e.target.value))} className={inputCls} placeholder="2" />
                </div>
              </div>

              <div>
                <label className={labelCls}>PHONE SCREEN TIME (HRS/DAY): {screenTime}h</label>
                <input type="range" min={0} max={10} step={0.5} value={screenTime} onChange={e => setScreenTime(Number(e.target.value))}
                  className="w-full h-2 rounded-full bg-[#1e2338] appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer" />
                <div className="flex justify-between text-[11px] text-white/20 mt-1"><span>0h</span><span>10h</span></div>
              </div>

              <div>
                <label className={labelCls}>ENERGY LEVEL: {energyLevel}/10</label>
                <input type="range" min={1} max={10} value={energyLevel} onChange={e => setEnergyLevel(Number(e.target.value))}
                  className="w-full h-2 rounded-full bg-[#1e2338] appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer" />
              </div>

              <div>
                <label className={labelCls}>STRESS LEVEL: {stressLevel}/10</label>
                <input type="range" min={1} max={10} value={stressLevel} onChange={e => setStressLevel(Number(e.target.value))}
                  className="w-full h-2 rounded-full bg-[#1e2338] appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer" />
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={next} className={btnPrimary}>Next &rarr;</motion.button>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════════════════
      // Screen 7: Faith
      // ════════════════════════════════════
      case 7:
        return (
          <motion.div key="s7" variants={variants} initial="enter" animate="center" exit="exit" transition={transition}
            className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-xl w-full mx-auto space-y-5">
              <h2 className="text-[28px] font-semibold text-white">Your Faith</h2>

              <Toggle on={hasFaith} onToggle={() => setHasFaith(!hasFaith)} label="Do you have a spiritual practice?" />

              {hasFaith && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>WHICH TRADITION?</label>
                    <select value={faithTradition} onChange={e => setFaithTradition(e.target.value)} className={inputCls}>
                      <option value="">Select...</option>
                      {['Islam', 'Christianity', 'Judaism', 'Hinduism', 'Buddhism', 'Sikhism', 'Spiritual (non-religious)', 'Other'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <Toggle on={trackPrayers} onToggle={() => setTrackPrayers(!trackPrayers)} label="Track prayers?" />

                  <div>
                    <label className={labelCls}>HOW CONSISTENT?</label>
                    <select value={faithConsistency} onChange={e => setFaithConsistency(e.target.value)} className={inputCls}>
                      <option value="">Select...</option>
                      {['Very consistent', 'Mostly consistent', 'Inconsistent', 'Just starting', 'Trying to restart'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelCls}>ANYONE WHO MODELS THE CONSISTENCY YOU WANT?</label>
                    <input value={faithRoleModel} onChange={e => setFaithRoleModel(e.target.value)} className={inputCls}
                      placeholder="A person, scholar, community leader..." />
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={next} className={btnPrimary}>Next &rarr;</motion.button>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════════════════
      // Screen 8: Struggles
      // ════════════════════════════════════
      case 8:
        return (
          <motion.div key="s8" variants={variants} initial="enter" animate="center" exit="exit" transition={transition}
            className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-xl w-full mx-auto space-y-5">
              <h2 className="text-[28px] font-semibold text-white">Your Struggles</h2>
              <p className="text-[14px] text-[#8892b0]">I need to understand what&apos;s holding you back.</p>

              <div>
                <label className={labelCls}>#1 THING YOU PROCRASTINATE ON?</label>
                <input value={procrastination} onChange={e => setProcrastination(e.target.value)} className={inputCls}
                  placeholder="Be specific..." />
              </div>

              <div>
                <label className={labelCls}>PATTERNS YOU NOTICE?</label>
                <input value={patterns} onChange={e => setPatterns(e.target.value)} className={inputCls}
                  placeholder="e.g. I always stall after initial momentum..." />
              </div>

              <div>
                <label className={labelCls}>BIGGEST DISTRACTION?</label>
                <select value={biggestDistraction} onChange={e => setBiggestDistraction(e.target.value)} className={inputCls}>
                  <option value="">Select...</option>
                  {['Phone', 'Social media', 'New ideas', 'Gaming', 'Gambling', 'Other'].map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>TRYING TO QUIT OR REDUCE ANYTHING?</label>
                <input value={tryingToQuit} onChange={e => setTryingToQuit(e.target.value)} className={inputCls}
                  placeholder="This stays private." />
                <p className="text-[11px] text-white/20 mt-1">Stored privately. Only used by your AI strategist.</p>
              </div>

              <div>
                <label className={labelCls}>LAST TIME YOU FELT &quot;LOCKED IN&quot; &mdash; WHAT WAS DIFFERENT?</label>
                <textarea value={lockedInMemory} onChange={e => setLockedInMemory(e.target.value)}
                  className={`${inputCls} min-h-[80px] resize-none`}
                  placeholder="Describe that moment or period..." />
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={next} className={btnPrimary}>Next &rarr;</motion.button>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════════════════
      // Screen 9: AI Preferences
      // ════════════════════════════════════
      case 9:
        return (
          <motion.div key="s9" variants={variants} initial="enter" animate="center" exit="exit" transition={transition}
            className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-xl w-full mx-auto space-y-6">
              <h2 className="text-[28px] font-semibold text-white">AI Preferences</h2>

              <div>
                <label className={labelCls}>HOW SHOULD I TALK TO YOU WHEN YOU&apos;RE AVOIDING SOMETHING?</label>
                <div className="space-y-2 mt-2">
                  {[
                    { value: 'data', label: 'Show data + ask' },
                    { value: 'direct', label: 'Be direct' },
                    { value: 'escalate', label: 'Start gentle, get tougher' },
                    { value: 'explore', label: "Ask what's blocking" },
                  ].map(o => (
                    <button key={o.value} onClick={() => setAiAvoidance(o.value)}
                      className={`w-full text-left px-4 py-3 rounded-[12px] border text-[14px] transition-all ${aiAvoidance === o.value ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/[0.06] text-white/50 hover:bg-white/[0.03]'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>PUSH TOWARD ACTION OR SOMETIMES JUST LISTEN?</label>
                <div className="space-y-2 mt-2">
                  {[
                    { value: 'always', label: 'Always push' },
                    { value: 'mostly', label: 'Mostly push' },
                    { value: 'read', label: 'Read my mood' },
                  ].map(o => (
                    <button key={o.value} onClick={() => setAiPush(o.value)}
                      className={`w-full text-left px-4 py-3 rounded-[12px] border text-[14px] transition-all ${aiPush === o.value ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/[0.06] text-white/50 hover:bg-white/[0.03]'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>WHAT MOTIVATES YOU?</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Money earned', 'Money lost', 'Competition', 'Streaks', 'All'].map(m => (
                    <button key={m} onClick={() => toggleMotivator(m)}
                      className={`px-4 py-2 rounded-[10px] text-[13px] border transition-all ${aiMotivators.includes(m) ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' : 'border-white/[0.06] text-white/40 hover:bg-white/[0.03]'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={next} className={btnPrimary}>Next &rarr;</motion.button>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════════════════
      // Screen 10: Connect Tools
      // ════════════════════════════════════
      case 10:
        return (
          <motion.div key="s10" variants={variants} initial="enter" animate="center" exit="exit" transition={transition}
            className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-xl w-full mx-auto space-y-5">
              <h2 className="text-[28px] font-semibold text-white">Connect Tools</h2>

              <div className="space-y-4">
                {/* Anthropic */}
                <div className="bg-[#0e1018] border border-white/[0.06] rounded-[16px] p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-lg">🧠</div>
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold text-white">Anthropic API</p>
                      <p className="text-[12px] text-[#8892b0]">Powers your AI strategist</p>
                    </div>
                    {aiTestResult === 'pass' && <span className="text-emerald-400 text-sm font-medium">Connected</span>}
                    {aiTestResult === 'fail' && <span className="text-red-400 text-sm">Failed</span>}
                  </div>
                  <input value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} placeholder="sk-ant-..." className={inputCls} type="password" />
                  <button onClick={testAi} disabled={!anthropicKey || aiTestResult === 'loading'}
                    className="text-xs text-emerald-400 hover:text-emerald-300 disabled:text-gray-600 transition-colors">
                    {aiTestResult === 'loading' ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>

                {/* Stripe */}
                <div className="bg-[#0e1018] border border-white/[0.06] rounded-[16px] p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-lg">💳</div>
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold text-white">Stripe</p>
                      <p className="text-[12px] text-[#8892b0]">Coming soon</p>
                    </div>
                  </div>
                  <input value={stripeKey} onChange={e => setStripeKey(e.target.value)} placeholder="sk_live_..." className={inputCls} type="password" />
                </div>

                {/* Plaid */}
                <div className="bg-[#0e1018] border border-white/[0.06] rounded-[16px] p-5 opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-lg">🏦</div>
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold text-white">Plaid</p>
                      <p className="text-[12px] text-[#8892b0]">Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <div className="flex gap-3 items-center">
                  <button onClick={() => setStep(11)} className="text-[13px] text-[#8892b0] hover:text-white transition-colors">Skip all &rarr;</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={next} className={btnPrimary}>Next &rarr;</motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════════════════
      // Screen 11: PIN
      // ════════════════════════════════════
      case 11:
        return (
          <motion.div key="s11" variants={variants} initial="enter" animate="center" exit="exit" transition={transition}
            className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-xl w-full mx-auto text-center space-y-6">
              <h2 className="text-[28px] font-semibold text-white">Set Your PIN</h2>
              <p className="text-[14px] text-[#8892b0]">
                {pinPhase === 'set' ? 'Choose a 4-digit PIN' : 'Confirm your PIN'}
              </p>

              <motion.div className="flex justify-center gap-4"
                animate={pinError ? { x: [0, -10, 10, -10, 0] } : {}} transition={{ duration: 0.4 }}>
                {(pinPhase === 'set' ? pinDigits : confirmDigits).map((d, i) => (
                  <input key={`${pinPhase}-${i}`}
                    ref={(pinPhase === 'set' ? pinRefs : confirmRefs)[i]}
                    type="password" maxLength={1} value={d}
                    onChange={e => handlePinInput(pinPhase, i, e.target.value)}
                    onKeyDown={e => handlePinKeyDown(pinPhase, i, e)}
                    className={`w-16 h-20 bg-[#0e1018] border-2 ${d ? 'border-emerald-500/50' : 'border-white/[0.06]'} rounded-[16px] text-center font-mono text-[28px] font-bold text-white focus:border-emerald-500 focus:outline-none transition-all`}
                  />
                ))}
              </motion.div>
              {pinError && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-sm">{pinError}</motion.p>}
              <p className="text-[12px] text-white/20">You can change this later in Settings</p>

              <div className="flex justify-between pt-2">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <div />
              </div>
            </div>
          </motion.div>
        )

      // ════════════════════════════════════
      // Screen 12: Review & Launch
      // ════════════════════════════════════
      case 12: {
        const bizCount = businesses.filter(b => b.name).length
        const clientCount = Object.values(clientsByBiz).reduce((sum, e) => sum + e.clients.filter(c => c.name).length, 0)
        const mrrDisplay = totalMRR + totalBizRevenue
        return (
          <motion.div key="s12" variants={variants} initial="enter" animate="center" exit="exit" transition={transition}
            className="min-h-screen flex items-center justify-center p-6 relative">
            <Confetti />
            <div className="max-w-xl w-full mx-auto text-center space-y-6 relative z-10">
              <h2 className="text-[36px] font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                ART OS is ready.
              </h2>
              <p className="text-[14px] text-[#8892b0]">Everything look right?</p>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="bg-[#0e1018] border border-white/[0.06] rounded-[16px] p-4">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-[#8892b0]">Businesses</p>
                  <p className="text-[28px] font-bold text-white mt-1">{bizCount}</p>
                </div>
                <div className="bg-[#0e1018] border border-white/[0.06] rounded-[16px] p-4">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-[#8892b0]">Clients</p>
                  <p className="text-[28px] font-bold text-white mt-1">{clientCount}</p>
                </div>
                <div className="bg-[#0e1018] border border-white/[0.06] rounded-[16px] p-4">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-[#8892b0]">MRR</p>
                  <p className="text-[28px] font-bold text-emerald-400 mt-1">${mrrDisplay.toLocaleString()}</p>
                </div>
                <div className="bg-[#0e1018] border border-white/[0.06] rounded-[16px] p-4">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-[#8892b0]">Income Target</p>
                  <p className="text-[28px] font-bold text-emerald-400 mt-1">${incomeTarget.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {exerciseFreq && (
                  <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[12px] text-[#8892b0]">
                    Exercise: {exerciseFreq}
                  </span>
                )}
                {hasFaith && faithTradition && (
                  <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[12px] text-[#8892b0]">
                    Faith: {faithTradition}
                  </span>
                )}
                {northStar && (
                  <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[12px] text-[#8892b0]">
                    North Star: {northStar}
                  </span>
                )}
                {aiAvoidance && (
                  <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-[12px] text-[#8892b0]">
                    AI style set
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center pt-4">
                <button onClick={prev} className="text-gray-400 text-sm hover:text-white transition-colors">&larr; Back</button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={launchApp} className={`${btnPrimary} text-[16px] font-bold py-4 px-12`}>
                  Enter ART OS &rarr;
                </motion.button>
              </div>
            </div>
          </motion.div>
        )
      }

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen text-white" style={{ background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, #07080d 70%)' }}>
      {/* Progress bar */}
      {step > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-white/[0.04]">
          <motion.div className="h-full bg-emerald-500" animate={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }} />
        </div>
      )}
      {/* Back button */}
      {step > 0 && step < totalSteps - 1 && (
        <button onClick={prev} className="fixed top-4 left-4 z-50 text-white/30 hover:text-white transition-colors text-lg">&larr;</button>
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
  const { authenticated, onboardingComplete } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (authenticated) router.push('/dashboard')
  }, [authenticated, router])

  if (authenticated) return null
  if (onboardingComplete && !authenticated) return <PinEntry />
  if (!onboardingComplete) return <OnboardingWizard />

  return null
}
