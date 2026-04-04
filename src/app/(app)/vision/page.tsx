'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useStore, type IdentityStatus } from '@/stores/store'
import PageTransition from '@/components/PageTransition'

const STATUS_CYCLE: IdentityStatus[] = ['aspirational', 'developing', 'integrated']
const STATUS_STYLE: Record<IdentityStatus, string> = {
  aspirational: 'bg-[rgba(191,90,242,0.15)] text-[var(--ai)]',
  developing: 'bg-[rgba(255,159,10,0.15)] text-[var(--warning)]',
  integrated: 'bg-[rgba(48,209,88,0.15)] text-[var(--positive)]',
}

/** PRD §1 — starter chips are generic; north star defaults use onboarding income target when set. */
const IDENTITY_SEEDS = [
  'I am a disciplined entrepreneur who finishes what I start',
  'I am clear on my priorities and say no to the rest',
  'I am physically energized and consistent with recovery',
  'I build assets and systems, not just income',
  'I am focused — I protect deep work',
]

const VISION_SEEDS = [
  'A portfolio of businesses that fit my strengths',
  'Financial clarity — I know my numbers every week',
  'Strong routines for body, mind, and relationships',
  'Leverage: team and systems handle repetition',
]

const ANTI_VISION_SEEDS = [
  'Stuck at the same revenue two years from now',
  'Burned out, scattered across too many half-built projects',
  'Health and sleep sacrificed for busywork',
  'Drifting from the identity I want to embody',
]

const card = 'bg-[var(--bg-elevated)] border border-[var(--border)] rounded-2xl p-5'
const label = 'label text-[var(--text-secondary)]'
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }
const fadeUp = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }

export default function VisionPage() {
  const {
    identityStatements, addIdentity, updateIdentity, deleteIdentity,
    visionItems, addVisionItem, deleteVisionItem,
    northStars, addNorthStar, updateNorthStar,
    incomeTarget,
  } = useStore()

  const northStarSuggestions = useMemo(
    () => [
      {
        label: 'Monthly net income',
        current: 0,
        target: incomeTarget > 0 ? incomeTarget : 10000,
        unit: '$',
      },
      { label: 'Average execution score', current: 0, target: 80, unit: '%' },
    ],
    [incomeTarget]
  )

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
          <h1 className="title">Vision &amp; Identity</h1>
          <p className="subheadline mt-1">Define who you are becoming and where you are going.</p>
        </div>

        {/* ── Section 1: Higher Self ── */}
        <section className="space-y-4">
          <div>
            <p className={label}>Higher Self</p>
            <p className="headline mt-1">Who are you becoming?</p>
          </div>

          {identityStatements.length === 0 ? (
            <div className={`${card} space-y-3`}>
              <p className="callout">Tap to add an identity statement:</p>
              <div className="flex flex-wrap gap-2">
                {IDENTITY_SEEDS.map(s => (
                  <motion.button key={s} type="button" whileTap={{ scale: 0.97 }}
                    onClick={() => addIdentityStatement(s)}
                    className="callout rounded-full border border-[color-mix(in_srgb,var(--ai)_35%,transparent)] bg-[rgba(191,90,242,0.1)] px-3 py-2 text-[var(--ai)] hover:bg-[rgba(191,90,242,0.18)] transition-colors"
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
                    <p className="body flex-1">{st.text}</p>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => cycleStatus(st.id, st.status)}
                        className={`caption rounded-md px-2 py-1 capitalize ${STATUS_STYLE[st.status]}`}
                      >{st.status.replace('_', ' ')}</button>
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
              className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-[border-color] duration-200 focus:border-[var(--accent)]"
            />
            <motion.button type="button" whileTap={{ scale: 0.97 }}
              onClick={() => addIdentityStatement(idInput)}
              className="btn-primary shrink-0 !px-6 !py-3"
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
              <p className="headline">Where I&apos;m going</p>
              {visions.length === 0 ? (
                <div className={`${card} space-y-3`}>
                  <p className="callout">Tap to add:</p>
                  <div className="flex flex-wrap gap-2">
                    {VISION_SEEDS.map(s => (
                      <button key={s} type="button" onClick={() => { addVisionItem(s, 'vision'); toast.success('Added') }}
                        className="callout rounded-full border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[var(--accent-bg)] px-3 py-2 text-[var(--accent)] hover:bg-[rgba(10,132,255,0.2)] transition-colors"
                      >{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
                  {visions.map(v => (
                    <motion.div key={v.id} variants={fadeUp} className={`${card} flex items-center justify-between group`}>
                      <p className="body">{v.text}</p>
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
                  className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-3 text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-[border-color] duration-200 focus:border-[var(--accent)]"
                />
                <button type="button" onClick={() => addVision(visionInput, 'vision')}
                  className="btn-text min-h-[44px] px-3 text-[22px] font-medium">+</button>
              </div>
            </div>

            {/* Anti-Vision */}
            <div className="space-y-3">
              <p className="headline">Anti-vision</p>
              {antiVisions.length === 0 ? (
                <div className={`${card} border-rose-500/20 space-y-3`}>
                  <p className="callout">Tap to add:</p>
                  <div className="flex flex-wrap gap-2">
                    {ANTI_VISION_SEEDS.map(s => (
                      <button key={s} type="button" onClick={() => { addVisionItem(s, 'anti_vision'); toast.success('Added') }}
                        className="callout rounded-full border border-[color-mix(in_srgb,var(--negative)_35%,transparent)] bg-[rgba(255,69,58,0.1)] px-3 py-2 text-[var(--negative)] hover:bg-[rgba(255,69,58,0.18)] transition-colors"
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
                  className="min-h-[44px] flex-1 rounded-xl border border-[color-mix(in_srgb,var(--negative)_35%,transparent)] bg-[var(--bg-secondary)] px-3 py-3 text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none transition-[border-color] duration-200 focus:border-[var(--negative)]"
                />
                <button type="button" onClick={() => addVision(antiInput, 'anti_vision')}
                  className="min-h-[44px] px-3 text-[22px] font-medium text-[var(--negative)] hover:opacity-90">+</button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 3: North Star Metrics ── */}
        <section className="space-y-4">
          <div>
            <p className={label}>North Star Metrics</p>
            <p className="headline mt-1">The numbers that matter most</p>
          </div>

          {northStars.length === 0 ? (
            <div className={`${card} space-y-3`}>
              <p className="callout">Start tracking what matters:</p>
              <div className="flex flex-wrap gap-2">
                {northStarSuggestions.map(s => (
                  <button key={s.label} type="button" onClick={() => { addNorthStar(s); toast.success(`Added: ${s.label}`) }}
                    className="callout rounded-full border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[var(--accent-bg)] px-3 py-2 text-[var(--accent)] hover:bg-[rgba(10,132,255,0.2)] transition-colors"
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
                      <p className="headline">{ns.label}</p>
                      <span className="caption text-[var(--text-tertiary)]">{ns.unit}</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      {editingNs === ns.id ? (
                        <input autoFocus value={editNsVal}
                          onChange={e => setEditNsVal(e.target.value)}
                          onBlur={() => saveNsEdit(ns.id)}
                          onKeyDown={e => e.key === 'Enter' && saveNsEdit(ns.id)}
                          className="data w-24 bg-transparent border-b border-[var(--accent)] text-[var(--text-primary)] text-xl font-semibold outline-none"
                        />
                      ) : (
                        <span className="data cursor-pointer text-xl font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors"
                          onClick={() => { setEditingNs(ns.id); setEditNsVal(String(ns.current)) }}
                        >{ns.unit === '$' ? `$${ns.current.toLocaleString()}` : ns.current}{ns.unit === '%' ? '%' : ''}</span>
                      )}
                      <span className="body text-[var(--text-secondary)]">/ {ns.unit === '$' ? `$${ns.target.toLocaleString()}` : ns.target}{ns.unit === '%' ? '%' : ''}</span>
                    </div>
                    <div className="progress-bar">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const }}
                        className="progress-fill"
                      />
                    </div>
                    <p className="caption text-right text-[var(--text-tertiary)]">{pct}%</p>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* Add North Star */}
          <div className={`${card} space-y-3`}>
            <p className="footnote font-medium text-[var(--text-secondary)]">Add North Star</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <input value={nsForm.label} onChange={e => setNsForm(p => ({ ...p, label: e.target.value }))}
                placeholder="Label" className="min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)]" />
              <input value={nsForm.current} onChange={e => setNsForm(p => ({ ...p, current: e.target.value }))}
                placeholder="Current" type="number" className="min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)]" />
              <input value={nsForm.target} onChange={e => setNsForm(p => ({ ...p, target: e.target.value }))}
                placeholder="Target" type="number" className="min-h-[44px] rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)]" />
              <div className="flex gap-2">
                <input value={nsForm.unit} onChange={e => setNsForm(p => ({ ...p, unit: e.target.value }))}
                  placeholder="Unit ($, %)" className="min-h-[44px] flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[17px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--accent)]" />
                <motion.button type="button" whileTap={{ scale: 0.97 }}
                  onClick={submitNorthStar}
                  className="btn-primary shrink-0 !px-5 !py-3">+</motion.button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageTransition>
  )
}
