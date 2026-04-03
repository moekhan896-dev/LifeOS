'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore, type IdentityStatus } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const STATUS_CYCLE: IdentityStatus[] = ['aspirational', 'developing', 'integrated']
const STATUS_STYLE: Record<IdentityStatus, string> = {
  aspirational: 'bg-purple-500/15 text-purple-400',
  developing: 'bg-amber-500/15 text-amber-400',
  integrated: 'bg-emerald-500/15 text-emerald-400',
}

const IDENTITY_SEEDS = [
  'I am a disciplined entrepreneur who finishes what he starts',
  'I am a man of faith who prays 5 times daily',
  'I am physically fit and energized',
  'I am a $50K/mo earner who builds assets',
  'I am focused — I say no to distractions',
]

const VISION_SEEDS = [
  'Running a $50K/mo portfolio of businesses from anywhere',
  'Financially free — no debt, assets cashflowing',
  'Strong body, clear mind, consistent prayers',
  'Team handling operations while I focus on growth',
]

const ANTI_VISION_SEEDS = [
  'Still stuck at $19K/mo in 2 years',
  'Burned out, scattered across 6 half-built projects',
  'Health declining from energy drinks and no sleep',
  'Missing prayers and feeling spiritually empty',
]

const NORTH_STAR_SEEDS = [
  { label: 'Monthly net income', current: 19400, target: 50000, unit: '$' },
  { label: 'Agency MRR', current: 15300, target: 25000, unit: '$' },
  { label: 'Plumbing calls/day', current: 2, target: 5, unit: '' },
  { label: 'Execution score', current: 40, target: 80, unit: '%' },
  { label: 'Prayer consistency', current: 10, target: 95, unit: '%' },
]

const card = 'bg-[#0e1018] border border-[#1e2338] rounded-[16px] p-5'
const label = 'text-[10px] font-mono uppercase tracking-widest text-slate-500'
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }
const fadeUp = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }

export default function VisionPage() {
  const {
    identityStatements, addIdentity, updateIdentity, deleteIdentity,
    visionItems, addVisionItem, deleteVisionItem,
    northStars, addNorthStar, updateNorthStar,
  } = useStore()

  const [idInput, setIdInput] = useState('')
  const [visionInput, setVisionInput] = useState('')
  const [antiInput, setAntiInput] = useState('')
  const [nsForm, setNsForm] = useState({ label: '', current: '', target: '', unit: '' })
  const [editingNs, setEditingNs] = useState<string | null>(null)
  const [editNsVal, setEditNsVal] = useState('')

  const visions = visionItems.filter(v => v.type === 'vision')
  const antiVisions = visionItems.filter(v => v.type === 'anti_vision')

  function cycleStatus(id: string, current: IdentityStatus) {
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % 3]
    updateIdentity(id, { status: next })
    toast.success(`Status: ${next}`)
  }

  function addIdentityStatement(text: string) {
    if (!text.trim()) return
    addIdentity(text.trim())
    setIdInput('')
    toast.success('Identity statement added')
  }

  function addVision(text: string, type: 'vision' | 'anti_vision') {
    if (!text.trim()) return
    addVisionItem(text.trim(), type)
    type === 'vision' ? setVisionInput('') : setAntiInput('')
    toast.success('Added')
  }

  function submitNorthStar() {
    if (!nsForm.label || !nsForm.target) return
    addNorthStar({ label: nsForm.label, current: Number(nsForm.current) || 0, target: Number(nsForm.target), unit: nsForm.unit })
    setNsForm({ label: '', current: '', target: '', unit: '' })
    toast.success('North Star added')
  }

  function saveNsEdit(id: string) {
    updateNorthStar(id, { current: Number(editNsVal) || 0 })
    setEditingNs(null)
    toast.success('Updated')
  }

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto space-y-10 pb-20">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-white">Vision & Identity</h1>
          <p className="text-sm text-slate-400 mt-1">Define who you are becoming and where you are going.</p>
        </div>

        {/* ── Section 1: Higher Self ── */}
        <section className="space-y-4">
          <div>
            <p className={label}>Higher Self</p>
            <p className="text-white font-medium mt-1">Who are you becoming?</p>
          </div>

          {identityStatements.length === 0 ? (
            <div className={`${card} space-y-3`}>
              <p className="text-sm text-slate-400">Tap to add an identity statement:</p>
              <div className="flex flex-wrap gap-2">
                {IDENTITY_SEEDS.map(s => (
                  <motion.button key={s} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => addIdentityStatement(s)}
                    className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full px-3 py-1.5 hover:bg-purple-500/20 transition"
                  >{s}</motion.button>
                ))}
              </div>
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
              <AnimatePresence>
                {identityStatements.map(st => (
                  <motion.div key={st.id} variants={fadeUp} layout
                    className={`${card} flex items-center justify-between gap-3 group`}
                  >
                    <p className="text-sm text-white flex-1">{st.text}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => cycleStatus(st.id, st.status)}
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md ${STATUS_STYLE[st.status]}`}
                      >{st.status}</button>
                      <button onClick={() => { deleteIdentity(st.id); toast('Removed') }}
                        className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition text-sm">✕</button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          <div className="flex gap-2">
            <input value={idInput} onChange={e => setIdInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addIdentityStatement(idInput)}
              placeholder="I am..."
              className="flex-1 bg-[#0e1018] border border-[#1e2338] rounded-[12px] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-purple-500/50"
            />
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => addIdentityStatement(idInput)}
              className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-4 rounded-[12px] transition"
            >Add</motion.button>
          </div>
        </section>

        {/* ── Section 2: Vision Board ── */}
        <section className="space-y-4">
          <div>
            <p className={label}>Vision Board</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Where I'm Going */}
            <div className="space-y-3">
              <p className="text-white font-medium text-sm">Where I&apos;m Going</p>
              {visions.length === 0 ? (
                <div className={`${card} space-y-3`}>
                  <p className="text-xs text-slate-500">Tap to add:</p>
                  <div className="flex flex-wrap gap-2">
                    {VISION_SEEDS.map(s => (
                      <button key={s} onClick={() => { addVisionItem(s, 'vision'); toast.success('Added') }}
                        className="text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full px-3 py-1.5 hover:bg-emerald-500/20 transition"
                      >{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
                  {visions.map(v => (
                    <motion.div key={v.id} variants={fadeUp} className={`${card} flex items-center justify-between group`}>
                      <p className="text-sm text-white">{v.text}</p>
                      <button onClick={() => { deleteVisionItem(v.id); toast('Removed') }}
                        className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition text-sm ml-2">✕</button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
              <div className="flex gap-2">
                <input value={visionInput} onChange={e => setVisionInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addVision(visionInput, 'vision')}
                  placeholder="Add a vision..."
                  className="flex-1 bg-[#0e1018] border border-[#1e2338] rounded-[12px] px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/50"
                />
                <button onClick={() => addVision(visionInput, 'vision')}
                  className="text-emerald-400 text-sm font-medium px-3 hover:text-emerald-300 transition">+</button>
              </div>
            </div>

            {/* Anti-Vision */}
            <div className="space-y-3">
              <p className="text-white font-medium text-sm">Anti-Vision</p>
              {antiVisions.length === 0 ? (
                <div className={`${card} border-rose-500/20 space-y-3`}>
                  <p className="text-xs text-slate-500">Tap to add:</p>
                  <div className="flex flex-wrap gap-2">
                    {ANTI_VISION_SEEDS.map(s => (
                      <button key={s} onClick={() => { addVisionItem(s, 'anti_vision'); toast.success('Added') }}
                        className="text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-full px-3 py-1.5 hover:bg-rose-500/20 transition"
                      >{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
                  {antiVisions.map(v => (
                    <motion.div key={v.id} variants={fadeUp}
                      className={`${card} border-rose-500/20 bg-rose-500/[0.03] flex items-center justify-between group`}>
                      <p className="text-sm text-rose-300">{v.text}</p>
                      <button onClick={() => { deleteVisionItem(v.id); toast('Removed') }}
                        className="text-slate-600 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition text-sm ml-2">✕</button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
              <div className="flex gap-2">
                <input value={antiInput} onChange={e => setAntiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addVision(antiInput, 'anti_vision')}
                  placeholder="What you want to avoid..."
                  className="flex-1 bg-[#0e1018] border border-rose-500/20 rounded-[12px] px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-rose-500/40"
                />
                <button onClick={() => addVision(antiInput, 'anti_vision')}
                  className="text-rose-400 text-sm font-medium px-3 hover:text-rose-300 transition">+</button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: North Star Metrics ── */}
        <section className="space-y-4">
          <div>
            <p className={label}>North Star Metrics</p>
            <p className="text-white font-medium mt-1">The numbers that matter most</p>
          </div>

          {northStars.length === 0 ? (
            <div className={`${card} space-y-3`}>
              <p className="text-sm text-slate-400">Start tracking what matters:</p>
              <div className="flex flex-wrap gap-2">
                {NORTH_STAR_SEEDS.map(s => (
                  <button key={s.label} onClick={() => { addNorthStar(s); toast.success(`Added: ${s.label}`) }}
                    className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-full px-3 py-1.5 hover:bg-blue-500/20 transition"
                  >{s.label} ({s.unit}{s.current} → {s.unit}{s.target})</button>
                ))}
              </div>
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {northStars.map(ns => {
                const pct = Math.min(100, Math.round((ns.current / ns.target) * 100))
                return (
                  <motion.div key={ns.id} variants={fadeUp} className={`${card} space-y-3`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white font-medium">{ns.label}</p>
                      <span className={`${label} text-slate-400`}>{ns.unit}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      {editingNs === ns.id ? (
                        <input autoFocus value={editNsVal}
                          onChange={e => setEditNsVal(e.target.value)}
                          onBlur={() => saveNsEdit(ns.id)}
                          onKeyDown={e => e.key === 'Enter' && saveNsEdit(ns.id)}
                          className="w-20 bg-transparent border-b border-blue-500 text-white text-lg font-semibold outline-none"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-white cursor-pointer hover:text-blue-400 transition"
                          onClick={() => { setEditingNs(ns.id); setEditNsVal(String(ns.current)) }}
                        >{ns.unit === '$' ? `$${ns.current.toLocaleString()}` : ns.current}{ns.unit === '%' ? '%' : ''}</span>
                      )}
                      <span className="text-sm text-slate-500">/ {ns.unit === '$' ? `$${ns.target.toLocaleString()}` : ns.target}{ns.unit === '%' ? '%' : ''}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 text-right">{pct}%</p>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* Add North Star */}
          <div className={`${card} space-y-3`}>
            <p className="text-xs text-slate-400 font-medium">Add North Star</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input value={nsForm.label} onChange={e => setNsForm(p => ({ ...p, label: e.target.value }))}
                placeholder="Label" className="bg-slate-900/50 border border-[#1e2338] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none" />
              <input value={nsForm.current} onChange={e => setNsForm(p => ({ ...p, current: e.target.value }))}
                placeholder="Current" type="number" className="bg-slate-900/50 border border-[#1e2338] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none" />
              <input value={nsForm.target} onChange={e => setNsForm(p => ({ ...p, target: e.target.value }))}
                placeholder="Target" type="number" className="bg-slate-900/50 border border-[#1e2338] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none" />
              <div className="flex gap-2">
                <input value={nsForm.unit} onChange={e => setNsForm(p => ({ ...p, unit: e.target.value }))}
                  placeholder="Unit ($, %)" className="flex-1 bg-slate-900/50 border border-[#1e2338] rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none" />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={submitNorthStar}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 rounded-lg transition">+</motion.button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
