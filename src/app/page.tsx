'use client'

import { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '@/stores/store'

/* ─── Slide variants for onboarding ─── */
const slideVariants = {
  enter: { x: 80, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -80, opacity: 0 },
}

const slideTrans = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const }

/* ─── Confetti particle ─── */
function Confetti() {
  const colors = ['#10b981', '#06b6d4', '#ec4899', '#8b5cf6', '#f59e0b', '#3b82f6', '#f43f5e', '#fbbf24']
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 24 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 6 + Math.random() * 8,
            height: 6 + Math.random() * 8,
            left: `${8 + Math.random() * 84}%`,
            bottom: -20,
            backgroundColor: colors[i % colors.length],
          }}
          initial={{ y: 0, opacity: 1, scale: 0 }}
          animate={{
            y: -(200 + Math.random() * 500),
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.6],
            x: (Math.random() - 0.5) * 120,
          }}
          transition={{
            duration: 2.2 + Math.random() * 1.5,
            delay: Math.random() * 1.2,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════
   ONBOARDING FLOW (8 screens)
   ═══════════════════════════════════════ */
function OnboardingFlow() {
  const [step, setStep] = useState(0)
  const router = useRouter()
  const {
    setPin, completeOnboarding, setAuthenticated,
    setIncomeTarget, setTargetMonths, setExitTarget, setWakeUpTime,
  } = useStore()

  const next = () => setStep((s) => Math.min(s + 1, 7))

  return (
    <div className="min-h-screen bg-[var(--color-bg)] relative overflow-hidden flex items-center justify-center">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.04),transparent_70%)]" />

      <AnimatePresence mode="wait">
        {step === 0 && <Screen0 key="s0" next={next} />}
        {step === 1 && <Screen1 key="s1" next={next} setPin={setPin} />}
        {step === 2 && <Screen2 key="s2" next={next} />}
        {step === 3 && <Screen3 key="s3" next={next} />}
        {step === 4 && <Screen4 key="s4" next={next} setIncomeTarget={setIncomeTarget} setTargetMonths={setTargetMonths} setExitTarget={setExitTarget} />}
        {step === 5 && <Screen5 key="s5" next={next} setWakeUpTime={setWakeUpTime} />}
        {step === 6 && <Screen6 key="s6" next={next} />}
        {step === 7 && (
          <Screen7
            key="s7"
            onEnter={() => {
              completeOnboarding()
              setAuthenticated(true)
              router.push('/dashboard')
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Screen 0: Welcome ─── */
function Screen0({ next }: { next: () => void }) {
  return (
    <motion.div
      variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans}
      className="relative z-10 flex flex-col items-center gap-8 text-center px-6"
    >
      {/* Pulsing glow */}
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-[#10b981] blur-[100px]"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <h1 className="data text-[48px] font-bold tracking-[8px] text-[#10b981] relative z-10">
        ART OS
      </h1>
      <p className="text-[16px] font-light text-[var(--color-text-mid)] relative z-10">
        Your business. Your life. One system.
      </p>
      <motion.button
        onClick={next}
        className="relative z-10 mt-4 px-8 py-3.5 rounded-full bg-[var(--color-accent)] text-white text-[15px] font-semibold tracking-wide cursor-pointer"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
      >
        Let&apos;s set up your OS →
      </motion.button>
    </motion.div>
  )
}

/* ─── Screen 1: Set PIN ─── */
function Screen1({ next, setPin }: { next: () => void; setPin: (v: string) => void }) {
  const [digits, setDigits] = useState(['', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => { refs.current[0]?.focus() }, [])

  const handleChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const nd = [...digits]
    nd[i] = v
    setDigits(nd)
    if (v && i < 3) refs.current[i + 1]?.focus()
    if (v && i === 3) {
      const pin = nd.join('')
      if (pin.length === 4) {
        setPin(pin)
        setTimeout(next, 300)
      }
    }
  }

  const handleKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  return (
    <motion.div
      variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans}
      className="relative z-10 flex flex-col items-center gap-6 text-center px-6"
    >
      <h2 className="text-3xl font-bold text-[var(--color-text)]">Set Your PIN</h2>
      <p className="text-sm text-[var(--color-text-mid)]">This keeps your data private.</p>
      <div className="flex gap-4 mt-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e)}
            className="w-[72px] h-[72px] text-center text-3xl data rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-[var(--color-text)] outline-none transition-all duration-200 focus:border-[var(--color-accent)] focus:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
          />
        ))}
      </div>
      <p className="text-xs text-[var(--color-dim)] mt-2 opacity-60">You can change this later in settings</p>
    </motion.div>
  )
}

/* ─── Screen 2: Businesses ─── */
const businesses = [
  { name: 'SEO Agency (Rysen)', metric: '$26K MRR', status: 'Healthy', color: '#10b981' },
  { name: 'Honest Plumbers', metric: '~$18K', status: 'Slow', color: '#06b6d4' },
  { name: 'Madison Clark', metric: '16K followers', status: 'Pre-Revenue', color: '#ec4899' },
  { name: 'Moggley App', metric: '$0', status: 'Pre-Revenue', color: '#8b5cf6' },
  { name: 'Personal Brand', metric: '—', status: 'Dormant', color: '#f59e0b' },
  { name: 'Airbnb FL', metric: '$1K net', status: 'Active', color: '#3b82f6' },
]

function Screen2({ next }: { next: () => void }) {
  return (
    <motion.div
      variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans}
      className="relative z-10 flex flex-col items-center gap-6 text-center px-6 max-w-lg w-full"
    >
      <h2 className="text-3xl font-bold text-[var(--color-text)]">Your Businesses</h2>
      <p className="text-sm text-[var(--color-text-mid)]">Tell me about your businesses.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full mt-2">
        {businesses.map((b, i) => (
          <motion.div
            key={b.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35 }}
            className="relative bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 text-left cursor-pointer hover:border-[var(--color-border-hover)] transition-colors overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ backgroundColor: b.color }} />
            <p className="text-sm font-semibold text-[var(--color-text)] pl-2">{b.name}</p>
            <div className="flex items-center gap-2 pl-2 mt-1">
              <span className="data text-xs text-[var(--color-text-mid)]">{b.metric}</span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: b.color + '20', color: b.color }}
              >
                {b.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
      <p className="text-xs text-[var(--color-dim)] opacity-60">These are pre-loaded from your profile. Tap to edit.</p>
      <motion.button
        onClick={next}
        className="mt-2 px-8 py-3 rounded-full bg-[var(--color-accent)] text-white text-sm font-semibold cursor-pointer"
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      >
        Continue →
      </motion.button>
    </motion.div>
  )
}

/* ─── Screen 3: Clients ─── */
const clients = [
  { name: 'AWS', gross: 18000, adSpend: 10000 },
  { name: 'Slim Dental', gross: 2400, adSpend: 0 },
  { name: 'Rock Remson', gross: 1700, adSpend: 0 },
  { name: 'Gravix', gross: 1500, adSpend: 0 },
  { name: 'Tyler Family', gross: 1450, adSpend: 0 },
  { name: 'Eric', gross: 1000, adSpend: 0 },
]

function Screen3({ next }: { next: () => void }) {
  return (
    <motion.div
      variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans}
      className="relative z-10 flex flex-col items-center gap-6 text-center px-6 max-w-lg w-full"
    >
      <h2 className="text-3xl font-bold text-[var(--color-text)]">Your Clients</h2>
      <p className="text-sm text-[var(--color-text-mid)]">Let&apos;s set up your client roster.</p>
      <div className="w-full mt-2 flex flex-col gap-2">
        {clients.map((c, i) => {
          const net = c.gross - c.adSpend - c.gross * 0.03
          return (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.35 }}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <span className="text-sm font-semibold text-[var(--color-text)]">{c.name}</span>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="data text-xs text-[var(--color-text-mid)]">${c.gross.toLocaleString()} gross</p>
                  {c.adSpend > 0 && (
                    <p className="data text-[10px] text-[var(--color-dim)]">${c.adSpend.toLocaleString()} ad spend</p>
                  )}
                </div>
                <span className="data text-xs text-[#10b981] font-semibold min-w-[70px] text-right">
                  ${Math.round(net).toLocaleString()} net
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
      <p className="text-xs text-[var(--color-dim)] opacity-60">These sync with Stripe once connected.</p>
      <motion.button
        onClick={next}
        className="mt-2 px-8 py-3 rounded-full bg-[var(--color-accent)] text-white text-sm font-semibold cursor-pointer"
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      >
        Continue →
      </motion.button>
    </motion.div>
  )
}

/* ─── Screen 4: Goals ─── */
function Screen4({ next, setIncomeTarget, setTargetMonths, setExitTarget }: {
  next: () => void
  setIncomeTarget: (v: number) => void
  setTargetMonths: (v: number) => void
  setExitTarget: (v: number) => void
}) {
  const [income, setIncome] = useState(50000)
  const [months, setMonths] = useState(6)
  const [exit, setExit] = useState('1,000,000')

  const handleContinue = () => {
    setIncomeTarget(income)
    setTargetMonths(months)
    setExitTarget(parseInt(exit.replace(/,/g, '')) || 1000000)
    next()
  }

  return (
    <motion.div
      variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans}
      className="relative z-10 flex flex-col items-center gap-6 text-center px-6 max-w-md w-full"
    >
      <h2 className="text-3xl font-bold text-[var(--color-text)]">Your Goals</h2>
      <p className="text-sm text-[var(--color-text-mid)]">What are you building toward?</p>

      {/* Income target */}
      <div className="w-full text-left mt-2">
        <label className="text-xs text-[var(--color-dim)] uppercase tracking-wider">Monthly Income Target</label>
        <p className="data text-4xl font-bold text-[#10b981] mt-1">${income.toLocaleString()}</p>
        <input
          type="range" min={10000} max={100000} step={5000} value={income}
          onChange={(e) => setIncome(Number(e.target.value))}
          className="w-full mt-3 accent-[#10b981] h-2 bg-[var(--color-surface)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#10b981] [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(16,185,129,0.4)]"
        />
        <div className="flex justify-between text-[10px] text-[var(--color-dim)] mt-1">
          <span>$10K</span><span>$100K</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="w-full text-left">
        <label className="text-xs text-[var(--color-dim)] uppercase tracking-wider">Timeline</label>
        <p className="data text-2xl font-bold text-[var(--color-text)] mt-1">{months} months</p>
        <input
          type="range" min={3} max={12} step={1} value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="w-full mt-3 accent-[#10b981] h-2 bg-[var(--color-surface)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#10b981] [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(16,185,129,0.4)]"
        />
        <div className="flex justify-between text-[10px] text-[var(--color-dim)] mt-1">
          <span>3 mo</span><span>12 mo</span>
        </div>
      </div>

      {/* Exit target */}
      <div className="w-full text-left">
        <label className="text-xs text-[var(--color-dim)] uppercase tracking-wider">Agency Exit Target</label>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-lg text-[var(--color-text-mid)]">$</span>
          <input
            type="text" value={exit}
            onChange={(e) => setExit(e.target.value)}
            className="data text-xl font-bold bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] w-full transition-colors"
          />
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-mid)] italic mt-1">
        You&apos;ve been at $50K before. Let&apos;s get back there and stay.
      </p>

      <motion.button
        onClick={handleContinue}
        className="mt-2 px-8 py-3 rounded-full bg-[var(--color-accent)] text-white text-sm font-semibold cursor-pointer"
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      >
        Continue →
      </motion.button>
    </motion.div>
  )
}

/* ─── Screen 5: Health ─── */
function Screen5({ next, setWakeUpTime }: { next: () => void; setWakeUpTime: (v: string) => void }) {
  const [wake, setWake] = useState('07:00')
  const [prayer, setPrayer] = useState(true)
  const [gym, setGym] = useState(true)
  const [habits, setHabits] = useState([
    { label: 'Sleep schedule', on: true },
    { label: 'Clean eating', on: true },
    { label: 'No gambling', on: true },
    { label: 'Cold email consistency', on: true },
    { label: 'Screen time reduction', on: true },
  ])

  const toggleHabit = (i: number) => {
    const nh = [...habits]
    nh[i] = { ...nh[i], on: !nh[i].on }
    setHabits(nh)
  }

  const handleContinue = () => {
    setWakeUpTime(wake)
    next()
  }

  return (
    <motion.div
      variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans}
      className="relative z-10 flex flex-col items-center gap-5 text-center px-6 max-w-md w-full"
    >
      <h2 className="text-3xl font-bold text-[var(--color-text)]">Your Health</h2>
      <p className="text-sm text-[var(--color-text-mid)]">Your body runs your business.</p>

      {/* Wake time */}
      <div className="w-full text-left">
        <label className="text-xs text-[var(--color-dim)] uppercase tracking-wider">Wake Up Time</label>
        <input
          type="time" value={wake}
          onChange={(e) => setWake(e.target.value)}
          className="data mt-2 w-full text-lg bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] transition-colors cursor-pointer"
        />
      </div>

      {/* Toggles */}
      <div className="w-full flex flex-col gap-3">
        <div className="flex items-center justify-between bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3">
          <div className="text-left">
            <p className="text-sm font-medium text-[var(--color-text)]">Prayer Tracking</p>
            <p className="text-[10px] text-[var(--color-dim)]">Westland, MI · ISNA method</p>
          </div>
          <button
            onClick={() => setPrayer(!prayer)}
            className={`w-11 h-6 rounded-full transition-colors duration-200 relative cursor-pointer ${prayer ? 'bg-[#10b981]' : 'bg-[var(--color-border)]'}`}
          >
            <motion.div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
              animate={{ left: prayer ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>

        <div className="flex items-center justify-between bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-[var(--color-text)]">Gym Tracking</p>
          <button
            onClick={() => setGym(!gym)}
            className={`w-11 h-6 rounded-full transition-colors duration-200 relative cursor-pointer ${gym ? 'bg-[#10b981]' : 'bg-[var(--color-border)]'}`}
          >
            <motion.div
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
              animate={{ left: gym ? 22 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>

      {/* Habits */}
      <div className="w-full flex flex-col gap-2">
        {habits.map((h, i) => (
          <label key={h.label} className="flex items-center gap-3 cursor-pointer group">
            <div
              onClick={() => toggleHabit(i)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${h.on ? 'bg-[#10b981] border-[#10b981]' : 'border-[var(--color-border)] bg-transparent'}`}
            >
              {h.on && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm text-[var(--color-text)] group-hover:text-[var(--color-text-mid)] transition-colors">{h.label}</span>
          </label>
        ))}
      </div>

      <motion.button
        onClick={handleContinue}
        className="mt-2 px-8 py-3 rounded-full bg-[var(--color-accent)] text-white text-sm font-semibold cursor-pointer"
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      >
        Continue →
      </motion.button>
    </motion.div>
  )
}

/* ─── Screen 6: AI Partner ─── */
const aiSnippets = [
  "You're doing it again. You have 3 proven channels sitting stale...",
  "$700 avg ticket × 4 calls/day = $61,600/mo. The gap is lead flow.",
  "Before we discuss this new idea — have you restarted cold email?",
]

function Screen6({ next }: { next: () => void }) {
  return (
    <motion.div
      variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans}
      className="relative z-10 flex flex-col items-center gap-6 text-center px-6 max-w-md w-full"
    >
      <h2 className="text-3xl font-bold text-[var(--color-text)]">Your AI Partner</h2>
      <p className="text-sm text-[var(--color-text-mid)]">Meet your AI strategist.</p>

      {/* Avatar */}
      <motion.div
        className="w-20 h-20 rounded-full bg-gradient-to-br from-[#10b981] to-[#06b6d4] flex items-center justify-center text-3xl"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        🧠
      </motion.div>

      {/* Chat bubbles */}
      <div className="w-full flex flex-col gap-3 mt-2">
        {aiSnippets.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.4 }}
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl rounded-bl-sm px-4 py-3 text-left text-sm text-[var(--color-text-mid)]"
          >
            {s}
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-[var(--color-dim)] italic mt-1">
        I&apos;ll be direct with you. I&apos;ll call out when you&apos;re spreading thin.
      </p>

      <div className="flex gap-3 mt-2">
        <motion.button
          onClick={next}
          className="px-6 py-2.5 rounded-full border border-[var(--color-border)] text-[var(--color-text-mid)] text-sm font-medium cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        >
          Add API Key Later
        </motion.button>
        <motion.button
          onClick={next}
          className="px-6 py-2.5 rounded-full bg-[var(--color-accent)] text-white text-sm font-semibold cursor-pointer"
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        >
          Skip for Now
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ─── Screen 7: Ready ─── */
function Screen7({ onEnter }: { onEnter: () => void }) {
  return (
    <motion.div
      variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTrans}
      className="relative z-10 flex flex-col items-center gap-6 text-center px-6"
    >
      <Confetti />
      <h2 className="text-4xl font-bold text-[var(--color-text)] relative z-10">Your OS is loaded.</h2>
      <div className="flex flex-wrap justify-center gap-4 data text-xs text-[var(--color-text-mid)] relative z-10">
        <span>6 businesses</span>
        <span className="text-[var(--color-border)]">·</span>
        <span>6 clients</span>
        <span className="text-[var(--color-border)]">·</span>
        <span>$26K MRR</span>
        <span className="text-[var(--color-border)]">·</span>
        <span>227,500 followers</span>
      </div>
      <p className="data text-lg text-[#10b981] font-semibold relative z-10">Let&apos;s get to $50K.</p>
      <motion.button
        onClick={onEnter}
        className="relative z-10 mt-4 px-10 py-4 rounded-full bg-[var(--color-accent)] text-white text-base font-bold tracking-wide cursor-pointer shadow-[0_0_30px_rgba(16,185,129,0.3)]"
        whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(16,185,129,0.45)' }}
        whileTap={{ scale: 0.97 }}
      >
        Enter ART OS →
      </motion.button>
    </motion.div>
  )
}

/* ═══════════════════════════════════════
   PIN ENTRY (post-onboarding)
   ═══════════════════════════════════════ */
function PinEntry() {
  const [digits, setDigits] = useState(['', '', '', ''])
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()
  const { pin, setAuthenticated } = useStore()

  useEffect(() => { inputRefs.current[0]?.focus() }, [])

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return

    const newDigits = [...digits]
    newDigits[index] = value
    setDigits(newDigits)
    setError(false)

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }

    if (value && index === 3) {
      const entered = newDigits.join('')
      if (entered === pin) {
        setSuccess(true)
        setTimeout(() => {
          setAuthenticated(true)
          router.replace('/dashboard')
        }, 400)
      } else {
        setError(true)
        setTimeout(() => {
          setDigits(['', '', '', ''])
          inputRefs.current[0]?.focus()
        }, 600)
      }
    }
  }, [digits, pin, router, setAuthenticated])

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-bg)] via-[var(--color-surface)] to-[var(--color-bg)] opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.04),transparent_70%)]" />

      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
        className="relative z-10 flex flex-col items-center gap-8"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-text)] font-[family-name:var(--font-general-sans)]">
            ART OS
          </h1>
          <p className="mt-2 text-sm text-[var(--color-dim)] font-mono">
            Personal Business Operating System
          </p>
        </div>

        <motion.div
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl shadow-black/20 w-[320px]"
          animate={error ? { x: [0, -10, 10, -10, 10, 0] } : success ? { scale: [1, 1.02, 1] } : {}}
          transition={error ? { duration: 0.4 } : { duration: 0.3 }}
        >
          <p className="text-center text-sm text-[var(--color-dim)] mb-6">Enter your PIN</p>

          <div className="flex justify-center gap-3">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`
                  w-14 h-14 text-center text-2xl font-mono rounded-xl
                  bg-[var(--color-bg)] border-2 outline-none
                  transition-all duration-200
                  ${error
                    ? 'border-red-500'
                    : success
                      ? 'border-[var(--color-accent)]'
                      : digit
                        ? 'border-[var(--color-accent)]/50'
                        : 'border-[var(--color-border)]'
                  }
                  text-[var(--color-text)]
                  focus:border-[var(--color-accent)] focus:shadow-[0_0_12px_rgba(16,185,129,0.15)]
                `}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-xs text-red-500 mt-4"
              >
                Incorrect PIN
              </motion.p>
            )}
            {success && (
              <motion.p
                key="success"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center text-xs text-[var(--color-accent)] mt-4"
              >
                Access granted
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-[10px] text-[var(--color-dim)]/40 font-mono tracking-widest uppercase">
          Secure Entry
        </p>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════
   PAGE ROOT
   ═══════════════════════════════════════ */
export default function Page() {
  const { authenticated, onboardingComplete } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (authenticated) {
      router.replace('/dashboard')
    }
  }, [authenticated, router])

  if (authenticated) return null

  if (!onboardingComplete) return <OnboardingFlow />

  return <PinEntry />
}
