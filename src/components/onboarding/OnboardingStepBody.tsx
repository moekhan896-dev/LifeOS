'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useOnboardingStore } from '@/stores/onboarding-store'
import { newId } from '@/lib/id'
import type { OnboardingDraft } from './onboarding-types'
import { emptyBusinessDraft, emptyClientDraft } from './onboarding-types'
import {
  BUSINESS_TYPE_OPTIONS,
  BUSINESS_STATUS_OPTIONS,
  ROLE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  TOOL_SUGGESTIONS,
  RELATIONSHIP_OPTIONS,
  COMM_FREQ_OPTIONS,
  SAVINGS_RANGE_OPTIONS,
  HABIT_PRESETS,
  DISTRACTION_OPTIONS,
  NORTH_STAR_CHIPS,
  inputCls,
  glassPanel,
  btnPrimary,
} from './onboarding-constants'
import { AiBubble } from './AiBubble'

const variants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}
const transition = { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const }

/** Form field labels — Apple HIG: 13px, normal case (globals `.input-label`) */
const labelCls = 'input-label mb-1.5 block'

const PALETTE = ['#0A84FF', '#60A5FA', '#A78BFA', '#FB7185', '#FBBF24', '#06B6D4', '#D4A853', '#F472B6']

function emptyTeamRow() {
  return { id: newId(), name: '', title: '', whatTheyDo: '', compensation: '' }
}

function Chip({
  children,
  onClick,
  selected,
}: {
  children: React.ReactNode
  onClick: () => void
  selected?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-[15px] font-medium transition ${
        selected
          ? 'border-[var(--accent)]/45 bg-[var(--accent-bg)] text-[var(--text-primary)]'
          : 'border-[var(--border)] bg-[rgba(255,255,255,0.05)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]'
      }`}
    >
      {children}
    </button>
  )
}

function fieldErrClass(show: boolean) {
  return show ? ' border-[var(--negative)]' : ''
}

export function OnboardingStepBody({
  step,
  draft,
  patchDraft,
  identitySubStep = 0,
  foundationSubStep = 0,
  strugglesSubStep = 0,
}: {
  step: number
  draft: OnboardingDraft
  patchDraft: (fn: (d: OnboardingDraft) => OnboardingDraft) => void
  identitySubStep?: number
  foundationSubStep?: number
  strugglesSubStep?: number
}) {
  const validationErrors = useOnboardingStore((s) => s.validationErrors)
  const bizEdit = useOnboardingStore((s) => s.businessEditIndex)
  const setBizEdit = useOnboardingStore((s) => s.setBusinessEditIndex)
  const fe = (key: string) => validationErrors.includes(key)

  const businesses = draft.businesses
  const b = businesses[bizEdit] ?? businesses[0]

  if (step === 0) {
    return (
      <motion.div
        key="s0"
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={transition}
        className="flex flex-col items-center justify-center py-8 text-center md:py-12"
      >
        <AiBubble>
          Welcome to ART OS. I&apos;m going to be your AI business partner — but first, I need to learn everything
          about you. Your businesses, finances, health, goals, and struggles. The more honest you are, the smarter I
          get.
          <br />
          <br />
          This takes about 10–15 minutes. It&apos;s the most important time you&apos;ll spend in this app.
          <br />
          <br />
          Ready?
        </AiBubble>
        <p className="body max-w-md text-[var(--text-secondary)]">
          Everything is stored locally and never shared.
        </p>
      </motion.div>
    )
  }

  if (step === 1) {
    const identityBubbles = [
      "Let's start with the basics.",
      'Where are you based?',
      'How old are you?',
      'In one or two sentences — where are you in life right now?',
    ]
    return (
      <motion.div key="s1" variants={variants} initial="enter" animate="center" exit="exit" transition={transition} className="space-y-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={identitySubStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={transition}
            className="flex flex-col gap-8"
          >
            <AiBubble>{identityBubbles[identitySubStep]}</AiBubble>
            {identitySubStep === 0 && <h2 className="title-small">What&apos;s your first name?</h2>}
            {identitySubStep === 0 && (
              <div>
                <input
                  className={inputCls + fieldErrClass(fe('identity.name'))}
                  value={draft.identity.name}
                  onChange={(e) => patchDraft((d) => ({ ...d, identity: { ...d.identity, name: e.target.value } }))}
                  placeholder="First name"
                  autoFocus
                  aria-label="First name"
                />
                {fe('identity.name') && (
                  <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
                )}
              </div>
            )}
            {identitySubStep === 1 && (
              <>
                <div>
                  <input
                    className={inputCls + fieldErrClass(fe('identity.location'))}
                    value={draft.identity.location}
                    onChange={(e) => patchDraft((d) => ({ ...d, identity: { ...d.identity, location: e.target.value } }))}
                    placeholder="City, state or region"
                    autoFocus
                    aria-label="Location"
                  />
                  {fe('identity.location') && (
                    <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
                  )}
                </div>
                <p className="subheadline">Used for time zone and local context.</p>
              </>
            )}
            {identitySubStep === 2 && (
              <div>
                <input
                  type="number"
                  min={18}
                  max={99}
                  className={inputCls + fieldErrClass(fe('identity.age'))}
                  value={draft.identity.age === '' ? '' : draft.identity.age}
                  onChange={(e) =>
                    patchDraft((d) => ({
                      ...d,
                      identity: { ...d.identity, age: e.target.value ? Number(e.target.value) : '' },
                    }))
                  }
                  placeholder="Age"
                  autoFocus
                  aria-label="Age"
                />
                {fe('identity.age') && (
                  <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
                )}
              </div>
            )}
            {identitySubStep === 3 && (
              <textarea
                className={inputCls + ' min-h-[140px] resize-none'}
                value={draft.identity.selfDescription}
                onChange={(e) =>
                  patchDraft((d) => ({ ...d, identity: { ...d.identity, selfDescription: e.target.value } }))
                }
                placeholder="Describe your season honestly — no performance."
                autoFocus
                aria-label="About you"
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    )
  }

  if (step === 2) {
    const count = draft.businessCount
    const ensure = (n: number) => {
      patchDraft((d) => {
        const next = [...d.businesses]
        while (next.length < n) {
          const b = emptyBusinessDraft(PALETTE[next.length % PALETTE.length])
          next.push({ ...b, id: newId() })
        }
        while (next.length > n) next.pop()
        return {
          ...d,
          businessCount: n,
          businesses: next.map((biz) => ({ ...biz, id: biz.id || newId() })),
        }
      })
    }

    return (
      <motion.div key="s2" variants={variants} initial="enter" animate="center" exit="exit" transition={transition} className="space-y-4">
        <AiBubble>
          Now let&apos;s map out your empire. How many businesses or projects are you actively running? Include side
          projects and ideas you&apos;re working on.
        </AiBubble>
        <div className={glassPanel}>
          <label className={labelCls}>How many?</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <Chip key={n} selected={count === n} onClick={() => ensure(n)}>
                {n}
              </Chip>
            ))}
            <Chip selected={count > 6} onClick={() => ensure(Math.max(count, 7))}>
              6+
            </Chip>
          </div>
          {count > 6 && (
            <input
              type="number"
              min={7}
              max={20}
              className={inputCls + ' mt-3'}
              value={count}
              onChange={(e) => ensure(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
            />
          )}
        </div>

        <p className="text-xs text-white/40">
          Business {bizEdit + 1} of {businesses.length}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {businesses.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setBizEdit(i)}
              className={`h-2 w-8 shrink-0 rounded-full ${bizEdit === i ? 'bg-[var(--accent)]' : 'bg-white/10'}`}
            />
          ))}
        </div>

        <div className={`${glassPanel} space-y-3`}>
          <div>
            <label className={labelCls}>Business name</label>
            <input
              className={inputCls + fieldErrClass(fe(`business.${bizEdit}.name`))}
              value={b?.name ?? ''}
              onChange={(e) =>
                patchDraft((d) => {
                  const bb = [...d.businesses]
                  bb[bizEdit] = { ...bb[bizEdit], name: e.target.value }
                  return { ...d, businesses: bb }
                })
              }
              placeholder="Name"
            />
            {fe(`business.${bizEdit}.name`) && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <select
              className={inputCls + fieldErrClass(fe(`business.${bizEdit}.type`))}
              value={b?.type ?? ''}
              onChange={(e) =>
                patchDraft((d) => {
                  const bb = [...d.businesses]
                  bb[bizEdit] = { ...bb[bizEdit], type: e.target.value }
                  return { ...d, businesses: bb }
                })
              }
            >
              <option value="">Select…</option>
              {BUSINESS_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {fe(`business.${bizEdit}.type`) && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {BUSINESS_STATUS_OPTIONS.map((s) => (
                <Chip
                  key={s}
                  selected={b?.status === s}
                  onClick={() =>
                    patchDraft((d) => {
                      const bb = [...d.businesses]
                      bb[bizEdit] = { ...bb[bizEdit], status: s }
                      return { ...d, businesses: bb }
                    })
                  }
                >
                  {s}
                </Chip>
              ))}
            </div>
            {fe(`business.${bizEdit}.status`) && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Monthly revenue ($)</label>
            <input
              type="number"
              min={0}
              className={inputCls + fieldErrClass(fe(`business.${bizEdit}.revenue`))}
              value={b?.monthlyRevenue || ''}
              onChange={(e) =>
                patchDraft((d) => {
                  const bb = [...d.businesses]
                  bb[bizEdit] = { ...bb[bizEdit], monthlyRevenue: Number(e.target.value) || 0 }
                  return { ...d, businesses: bb }
                })
              }
              placeholder="0 if pre-revenue"
            />
            {fe(`business.${bizEdit}.revenue`) && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
            )}
          </div>
          <div>
            <label className={labelCls}>What do you do day-to-day?</label>
            <textarea
              className={inputCls + ' min-h-[88px] resize-none'}
              value={b?.dayToDay ?? ''}
              onChange={(e) =>
                patchDraft((d) => {
                  const bb = [...d.businesses]
                  bb[bizEdit] = { ...bb[bizEdit], dayToDay: e.target.value }
                  return { ...d, businesses: bb }
                })
              }
              placeholder="Typical day running this business"
            />
          </div>
          <div>
            <label className={labelCls}>Your role</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <Chip
                  key={r}
                  selected={b?.role === r}
                  onClick={() =>
                    patchDraft((d) => {
                      const bb = [...d.businesses]
                      bb[bizEdit] = { ...bb[bizEdit], role: r }
                      return { ...d, businesses: bb }
                    })
                  }
                >
                  {r}
                </Chip>
              ))}
            </div>
            {fe(`business.${bizEdit}.role`) && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Team?</label>
            <div className="mt-2 flex gap-2">
              <Chip
                selected={!b?.hasTeam}
                onClick={() =>
                  patchDraft((d) => {
                    const bb = [...d.businesses]
                    bb[bizEdit] = { ...bb[bizEdit], hasTeam: false, team: [] }
                    return { ...d, businesses: bb }
                  })
                }
              >
                No
              </Chip>
              <Chip
                selected={!!b?.hasTeam}
                onClick={() =>
                  patchDraft((d) => {
                    const bb = [...d.businesses]
                    bb[bizEdit] = { ...bb[bizEdit], hasTeam: true }
                    return { ...d, businesses: bb }
                  })
                }
              >
                Yes
              </Chip>
            </div>
            {b?.hasTeam && (
              <div className="mt-3 space-y-2">
                {(b.team ?? []).map((m, ti) => (
                  <div key={m.id || ti} className="rounded-[12px] border border-white/[0.06] bg-black/20 p-3">
                    <input
                      className={inputCls + ' mb-2'}
                      placeholder="Name / title"
                      value={m.name}
                      onChange={(e) =>
                        patchDraft((d) => {
                          const bb = [...d.businesses]
                          const team = [...(bb[bizEdit].team ?? [])]
                          team[ti] = { ...team[ti], name: e.target.value }
                          bb[bizEdit] = { ...bb[bizEdit], team }
                          return { ...d, businesses: bb }
                        })
                      }
                    />
                    <input
                      className={inputCls + ' mb-2'}
                      placeholder="What they do"
                      value={m.whatTheyDo}
                      onChange={(e) =>
                        patchDraft((d) => {
                          const bb = [...d.businesses]
                          const team = [...(bb[bizEdit].team ?? [])]
                          team[ti] = { ...team[ti], whatTheyDo: e.target.value }
                          bb[bizEdit] = { ...bb[bizEdit], team }
                          return { ...d, businesses: bb }
                        })
                      }
                    />
                    <input
                      className={inputCls}
                      placeholder="Compensation (salary, hourly, %)"
                      value={m.compensation}
                      onChange={(e) =>
                        patchDraft((d) => {
                          const bb = [...d.businesses]
                          const team = [...(bb[bizEdit].team ?? [])]
                          team[ti] = { ...team[ti], compensation: e.target.value }
                          bb[bizEdit] = { ...bb[bizEdit], team }
                          return { ...d, businesses: bb }
                        })
                      }
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm text-[var(--accent)] hover:opacity-90"
                  onClick={() =>
                    patchDraft((d) => {
                      const bb = [...d.businesses]
                      const team = [...(bb[bizEdit].team ?? []), emptyTeamRow()]
                      bb[bizEdit] = { ...bb[bizEdit], team }
                      return { ...d, businesses: bb }
                    })
                  }
                >
                  + Add team member
                </button>
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Tools & apps</label>
            <input
              className={inputCls}
              value={b?.tools ?? ''}
              onChange={(e) =>
                patchDraft((d) => {
                  const bb = [...d.businesses]
                  bb[bizEdit] = { ...bb[bizEdit], tools: e.target.value }
                  return { ...d, businesses: bb }
                })
              }
              placeholder="List tools you use"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {TOOL_SUGGESTIONS.map((t) => (
                <Chip
                  key={t}
                  selected={(b?.tools ?? '').includes(t)}
                  onClick={() =>
                    patchDraft((d) => {
                      const bb = [...d.businesses]
                      const cur = bb[bizEdit].tools ?? ''
                      const next = cur.includes(t) ? cur : cur ? `${cur}, ${t}` : t
                      bb[bizEdit] = { ...bb[bizEdit], tools: next }
                      return { ...d, businesses: bb }
                    })
                  }
                >
                  {t}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>How do you get paid?</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PAYMENT_METHOD_OPTIONS.map((p) => (
                <Chip
                  key={p}
                  selected={b?.revenueModel === p}
                  onClick={() =>
                    patchDraft((d) => {
                      const bb = [...d.businesses]
                      bb[bizEdit] = { ...bb[bizEdit], revenueModel: p }
                      return { ...d, businesses: bb }
                    })
                  }
                >
                  {p}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Recurring clients?</label>
            <div className="mt-2 flex gap-2">
              <Chip
                selected={!!b?.recurringClients}
                onClick={() =>
                  patchDraft((d) => {
                    const bb = [...d.businesses]
                    bb[bizEdit] = { ...bb[bizEdit], recurringClients: true }
                    return { ...d, businesses: bb }
                  })
                }
              >
                Yes — I&apos;ll add them next step
              </Chip>
              <Chip
                selected={!b?.recurringClients}
                onClick={() =>
                  patchDraft((d) => {
                    const bb = [...d.businesses]
                    bb[bizEdit] = { ...bb[bizEdit], recurringClients: false, clients: [] }
                    return { ...d, businesses: bb }
                  })
                }
              >
                No — per project/job
              </Chip>
            </div>
            {!b?.recurringClients && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Avg job value ($)</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={b?.avgJobValue || ''}
                    onChange={(e) =>
                      patchDraft((d) => {
                        const bb = [...d.businesses]
                        bb[bizEdit] = { ...bb[bizEdit], avgJobValue: Number(e.target.value) || 0 }
                        return { ...d, businesses: bb }
                      })
                    }
                  />
                </div>
                <div>
                  <label className={labelCls}>Jobs / month</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={b?.jobsPerMonth || ''}
                    onChange={(e) =>
                      patchDraft((d) => {
                        const bb = [...d.businesses]
                        bb[bizEdit] = { ...bb[bizEdit], jobsPerMonth: Number(e.target.value) || 0 }
                        return { ...d, businesses: bb }
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Biggest bottleneck right now</label>
            <textarea
              className={inputCls + ' min-h-[72px] resize-none'}
              value={b?.bottleneck ?? ''}
              onChange={(e) =>
                patchDraft((d) => {
                  const bb = [...d.businesses]
                  bb[bizEdit] = { ...bb[bizEdit], bottleneck: e.target.value }
                  return { ...d, businesses: bb }
                })
              }
            />
          </div>
          <div>
            <label className={labelCls}>Brand color</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() =>
                    patchDraft((d) => {
                      const bb = [...d.businesses]
                      bb[bizEdit] = { ...bb[bizEdit], color: c }
                      return { ...d, businesses: bb }
                    })
                  }
                  className={`h-9 w-9 rounded-full border-2 ${b?.color === c ? 'border-white' : 'border-transparent'}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            {fe(`business.${bizEdit}.color`) && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
            )}
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <button
            type="button"
            className="rounded-[12px] border border-white/10 px-4 py-2 text-sm text-white/60"
            disabled={bizEdit === 0}
            onClick={() => setBizEdit(Math.max(0, bizEdit - 1))}
          >
            ← Previous business
          </button>
          <button
            type="button"
            className="rounded-[12px] border border-white/10 px-4 py-2 text-sm text-white/60"
            disabled={bizEdit >= businesses.length - 1}
            onClick={() => setBizEdit(Math.min(businesses.length - 1, bizEdit + 1))}
          >
            Next business →
          </button>
        </div>

        <p className="text-xs text-white/30">
          Revenue, bottlenecks, and tools shape task impact — only from what you enter here.
        </p>
      </motion.div>
    )
  }

  if (step === 3) {
    return (
      <motion.div key="s3" variants={variants} initial="enter" animate="center" exit="exit" transition={transition} className="space-y-4">
        <AiBubble>For each business with recurring revenue, add your clients. Skip any that don&apos;t apply.</AiBubble>
        {draft.businesses.map((biz, bi) => {
          if (!biz.recurringClients) return null
          return (
            <div key={biz.id || bi} className={glassPanel + ' space-y-3'}>
              <p className="text-sm font-semibold text-white">{biz.name || `Business ${bi + 1}`}</p>
              {(biz.clients ?? []).map((c, ci) => (
                <div key={c.id || ci} className="space-y-2 rounded-[14px] border border-white/[0.06] bg-black/25 p-3">
                  <input
                    placeholder="Client name"
                    className={inputCls}
                    value={c.name}
                    onChange={(e) =>
                      patchDraft((d) => {
                        const bb = [...d.businesses]
                        const clients = [...(bb[bi].clients ?? [])]
                        clients[ci] = { ...clients[ci], name: e.target.value }
                        bb[bi] = { ...bb[bi], clients }
                        return { ...d, businesses: bb }
                      })
                    }
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="$ / mo"
                      className={inputCls}
                      value={c.monthlyPayment || ''}
                      onChange={(e) =>
                        patchDraft((d) => {
                          const bb = [...d.businesses]
                          const clients = [...(bb[bi].clients ?? [])]
                          clients[ci] = { ...clients[ci], monthlyPayment: Number(e.target.value) || 0 }
                          bb[bi] = { ...bb[bi], clients }
                          return { ...d, businesses: bb }
                        })
                      }
                    />
                    <input
                      type="number"
                      placeholder="Ad spend / mo"
                      className={inputCls}
                      value={c.adSpend || ''}
                      onChange={(e) =>
                        patchDraft((d) => {
                          const bb = [...d.businesses]
                          const clients = [...(bb[bi].clients ?? [])]
                          clients[ci] = { ...clients[ci], adSpend: Number(e.target.value) || 0 }
                          bb[bi] = { ...bb[bi], clients }
                          return { ...d, businesses: bb }
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      className={inputCls}
                      value={c.relationshipHealth}
                      onChange={(e) =>
                        patchDraft((d) => {
                          const bb = [...d.businesses]
                          const clients = [...(bb[bi].clients ?? [])]
                          clients[ci] = { ...clients[ci], relationshipHealth: e.target.value }
                          bb[bi] = { ...bb[bi], clients }
                          return { ...d, businesses: bb }
                        })
                      }
                    >
                      <option value="">Relationship</option>
                      {RELATIONSHIP_OPTIONS.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                    <input
                      type="month"
                      className={inputCls}
                      value={c.startYearMonth}
                      onChange={(e) =>
                        patchDraft((d) => {
                          const bb = [...d.businesses]
                          const clients = [...(bb[bi].clients ?? [])]
                          clients[ci] = { ...clients[ci], startYearMonth: e.target.value }
                          bb[bi] = { ...bb[bi], clients }
                          return { ...d, businesses: bb }
                        })
                      }
                    />
                  </div>
                  <select
                    className={inputCls}
                    value={c.communicationFrequency}
                    onChange={(e) =>
                      patchDraft((d) => {
                        const bb = [...d.businesses]
                        const clients = [...(bb[bi].clients ?? [])]
                        clients[ci] = { ...clients[ci], communicationFrequency: e.target.value }
                        bb[bi] = { ...bb[bi], clients }
                        return { ...d, businesses: bb }
                      })
                    }
                  >
                    <option value="">Communication frequency</option>
                    {COMM_FREQ_OPTIONS.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="text-xs text-rose-300/80"
                    onClick={() =>
                      patchDraft((d) => {
                        const bb = [...d.businesses]
                        const clients = (bb[bi].clients ?? []).filter((_, j) => j !== ci)
                        bb[bi] = { ...bb[bi], clients }
                        return { ...d, businesses: bb }
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-[var(--accent)]"
                onClick={() =>
                  patchDraft((d) => {
                    const bb = [...d.businesses]
                    const clients = [...(bb[bi].clients ?? []), { ...emptyClientDraft(), id: newId() }]
                    bb[bi] = { ...bb[bi], clients }
                    return { ...d, businesses: bb }
                  })
                }
              >
                + Add client
              </button>
            </div>
          )
        })}
      </motion.div>
    )
  }

  if (step === 4) {
    const f = draft.finance
    return (
      <motion.div key="s4" variants={variants} initial="enter" animate="center" exit="exit" transition={transition} className="space-y-4">
        <AiBubble>Let&apos;s get real about money in and money out. This powers every financial impact view.</AiBubble>
        <div className={glassPanel + ' space-y-4'}>
          <div>
            <label className={labelCls}>Connect bank</label>
            <div className="flex flex-wrap gap-2">
              <Chip selected={f.plaidIntent === 'connect'} onClick={() => patchDraft((d) => ({ ...d, finance: { ...d.finance, plaidIntent: 'connect' } }))}>
                Yes — connect via Plaid (soon)
              </Chip>
              <Chip selected={f.plaidIntent === 'manual'} onClick={() => patchDraft((d) => ({ ...d, finance: { ...d.finance, plaidIntent: 'manual' } }))}>
                I&apos;ll enter manually
              </Chip>
              <Chip selected={f.plaidIntent === 'later'} onClick={() => patchDraft((d) => ({ ...d, finance: { ...d.finance, plaidIntent: 'later' } }))}>
                Maybe later
              </Chip>
            </div>
          </div>
          <div>
            <label className={labelCls}>Housing ($ / mo)</label>
            <div className="flex gap-2">
              <Chip selected={f.housingFree} onClick={() => patchDraft((d) => ({ ...d, finance: { ...d.finance, housingFree: true, housing: 0 } }))}>
                Rent-free
              </Chip>
            </div>
            {!f.housingFree && (
              <input
                type="number"
                min={1}
                className={inputCls + ' mt-2' + fieldErrClass(fe('finance.housing'))}
                value={f.housing || ''}
                onChange={(e) =>
                  patchDraft((d) => ({ ...d, finance: { ...d.finance, housing: Number(e.target.value) || 0 } }))
                }
              />
            )}
            {fe('finance.housing') && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">Choose rent-free or enter your monthly housing cost</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Car payments</label>
            {(f.cars ?? []).map((car, i) => (
              <div key={car.id} className="mb-2 flex gap-2">
                <input
                  type="number"
                  className={inputCls}
                  placeholder="$ / mo"
                  value={car.payment || ''}
                  onChange={(e) =>
                    patchDraft((d) => {
                      const cars = [...d.finance.cars]
                      cars[i] = { ...cars[i], payment: Number(e.target.value) || 0 }
                      return { ...d, finance: { ...d.finance, cars } }
                    })
                  }
                />
                <button
                  type="button"
                  className="text-xs text-white/40"
                  onClick={() =>
                    patchDraft((d) => ({
                      ...d,
                      finance: { ...d.finance, cars: d.finance.cars.filter((_, j) => j !== i) },
                    }))
                  }
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-sm text-[var(--accent)]"
              onClick={() =>
                patchDraft((d) => ({
                  ...d,
                  finance: { ...d.finance, cars: [...d.finance.cars, { id: newId(), payment: 0 }] },
                }))
              }
            >
              + Car payment
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Car insurance</label>
              <input
                type="number"
                className={inputCls}
                value={f.carInsurance || ''}
                onChange={(e) =>
                  patchDraft((d) => ({ ...d, finance: { ...d.finance, carInsurance: Number(e.target.value) || 0 } }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                type="number"
                className={inputCls}
                value={f.phone || ''}
                onChange={(e) =>
                  patchDraft((d) => ({ ...d, finance: { ...d.finance, phone: Number(e.target.value) || 0 } }))
                }
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Subscriptions (total $ / mo)</label>
            <input
              type="number"
              className={inputCls}
              value={f.subscriptions || ''}
              onChange={(e) =>
                patchDraft((d) => ({ ...d, finance: { ...d.finance, subscriptions: Number(e.target.value) || 0 } }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>Food & dining ($ / mo)</label>
            <input
              type="number"
              className={inputCls}
              value={f.food || ''}
              onChange={(e) =>
                patchDraft((d) => ({ ...d, finance: { ...d.finance, food: Number(e.target.value) || 0 } }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>Other recurring</label>
            {(f.otherExpenses ?? []).map((o, i) => (
              <div key={o.id} className="mb-2 flex gap-2">
                <input
                  className={inputCls}
                  placeholder="Label"
                  value={o.label}
                  onChange={(e) =>
                    patchDraft((d) => {
                      const otherExpenses = [...d.finance.otherExpenses]
                      otherExpenses[i] = { ...otherExpenses[i], label: e.target.value }
                      return { ...d, finance: { ...d.finance, otherExpenses } }
                    })
                  }
                />
                <input
                  type="number"
                  className={inputCls}
                  placeholder="$"
                  value={o.amount || ''}
                  onChange={(e) =>
                    patchDraft((d) => {
                      const otherExpenses = [...d.finance.otherExpenses]
                      otherExpenses[i] = { ...otherExpenses[i], amount: Number(e.target.value) || 0 }
                      return { ...d, finance: { ...d.finance, otherExpenses } }
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="text-sm text-[var(--accent)]"
              onClick={() =>
                patchDraft((d) => ({
                  ...d,
                  finance: {
                    ...d.finance,
                    otherExpenses: [...d.finance.otherExpenses, { id: newId(), label: '', amount: 0 }],
                  },
                }))
              }
            >
              + Add expense
            </button>
          </div>
          <div>
            <label className={labelCls}>Debts</label>
            {(f.debts ?? []).map((debt, i) => (
              <div key={debt.id} className="mb-2 grid grid-cols-3 gap-2">
                <input
                  className={inputCls}
                  placeholder="Type"
                  value={debt.label}
                  onChange={(e) =>
                    patchDraft((d) => {
                      const debts = [...d.finance.debts]
                      debts[i] = { ...debts[i], label: e.target.value }
                      return { ...d, finance: { ...d.finance, debts } }
                    })
                  }
                />
                <input
                  type="number"
                  className={inputCls}
                  placeholder="Payment/mo"
                  value={debt.monthlyPayment || ''}
                  onChange={(e) =>
                    patchDraft((d) => {
                      const debts = [...d.finance.debts]
                      debts[i] = { ...debts[i], monthlyPayment: Number(e.target.value) || 0 }
                      return { ...d, finance: { ...d.finance, debts } }
                    })
                  }
                />
                <input
                  type="number"
                  className={inputCls}
                  placeholder="Balance"
                  value={debt.balance || ''}
                  onChange={(e) =>
                    patchDraft((d) => {
                      const debts = [...d.finance.debts]
                      debts[i] = { ...debts[i], balance: Number(e.target.value) || 0 }
                      return { ...d, finance: { ...d.finance, debts } }
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="text-sm text-[var(--accent)]"
              onClick={() =>
                patchDraft((d) => ({
                  ...d,
                  finance: { ...d.finance, debts: [...d.finance.debts, { id: newId(), label: '', monthlyPayment: 0, balance: 0 }] },
                }))
              }
            >
              + Add debt
            </button>
          </div>
          <div>
            <label className={labelCls}>Liquid savings (range)</label>
            <div
              className={`flex flex-wrap gap-2 rounded-[14px] p-2 ${fe('finance.savingsRange') ? 'border border-[var(--negative)]' : ''}`}
            >
              {SAVINGS_RANGE_OPTIONS.map((s) => (
                <Chip
                  key={s}
                  selected={f.savingsRange === s}
                  onClick={() => patchDraft((d) => ({ ...d, finance: { ...d.finance, savingsRange: s } }))}
                >
                  {s}
                </Chip>
              ))}
            </div>
            {fe('finance.savingsRange') && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Assets to track</label>
            {(f.assets ?? []).map((a, i) => (
              <div key={a.id} className="mb-2 grid grid-cols-3 gap-2">
                <input
                  className={inputCls}
                  placeholder="Name"
                  value={a.name}
                  onChange={(e) =>
                    patchDraft((d) => {
                      const assets = [...d.finance.assets]
                      assets[i] = { ...assets[i], name: e.target.value }
                      return { ...d, finance: { ...d.finance, assets } }
                    })
                  }
                />
                <input
                  className={inputCls}
                  placeholder="Type"
                  value={a.type}
                  onChange={(e) =>
                    patchDraft((d) => {
                      const assets = [...d.finance.assets]
                      assets[i] = { ...assets[i], type: e.target.value }
                      return { ...d, finance: { ...d.finance, assets } }
                    })
                  }
                />
                <input
                  type="number"
                  className={inputCls}
                  placeholder="Value"
                  value={a.value || ''}
                  onChange={(e) =>
                    patchDraft((d) => {
                      const assets = [...d.finance.assets]
                      assets[i] = { ...assets[i], value: Number(e.target.value) || 0 }
                      return { ...d, finance: { ...d.finance, assets } }
                    })
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="text-sm text-[var(--accent)]"
              onClick={() =>
                patchDraft((d) => ({
                  ...d,
                  finance: { ...d.finance, assets: [...d.finance.assets, { id: newId(), name: '', type: '', value: 0 }] },
                }))
              }
            >
              + Add asset
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (step === 5) {
    const g = draft.goals
    return (
      <motion.div key="s5" variants={variants} initial="enter" animate="center" exit="exit" transition={transition} className="space-y-4">
        <AiBubble>Where are you trying to go? This becomes your north star inside ART OS.</AiBubble>
        <div className={glassPanel + ' space-y-4'}>
          <div>
            <label className={labelCls}>Monthly income target ($)</label>
            <p className="data mb-2 text-center text-4xl font-semibold tabular-nums text-[var(--positive)]">
              ${g.incomeTarget.toLocaleString()}
            </p>
            <input
              type="range"
              min={5000}
              max={500000}
              step={1000}
              value={g.incomeTarget || 5000}
              onChange={(e) =>
                patchDraft((d) => ({ ...d, goals: { ...d.goals, incomeTarget: Number(e.target.value) } }))
              }
              className={'w-full accent-[var(--accent)]' + (fe('goals.incomeTarget') ? ' opacity-90 ring-2 ring-[var(--negative)] rounded-full' : '')}
            />
            {fe('goals.incomeTarget') && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required (minimum $5,000/mo)</p>
            )}
            <div className="flex justify-between text-[10px] text-white/25">
              <span>$5K</span>
              <span>$500K</span>
            </div>
          </div>
          <div>
            <label className={labelCls}>Target month</label>
            <input
              type="month"
              className={inputCls + fieldErrClass(fe('goals.targetYearMonth'))}
              value={g.targetYearMonth}
              onChange={(e) =>
                patchDraft((d) => ({ ...d, goals: { ...d.goals, targetYearMonth: e.target.value } }))
              }
            />
            {fe('goals.targetYearMonth') && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Why this number — what changes when you hit it?</label>
            <textarea
              className={inputCls + ' min-h-[88px] resize-none'}
              value={g.whyThisMatters}
              onChange={(e) =>
                patchDraft((d) => ({ ...d, goals: { ...d.goals, whyThisMatters: e.target.value } }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>North star metric</label>
            <div className="flex flex-wrap gap-2">
              {NORTH_STAR_CHIPS.map((n) => (
                <Chip
                  key={n}
                  selected={g.northStarMetric === n}
                  onClick={() =>
                    patchDraft((d) => ({ ...d, goals: { ...d.goals, northStarMetric: n } }))
                  }
                >
                  {n}
                </Chip>
              ))}
            </div>
            {g.northStarMetric === 'Something else' && (
              <input
                className={inputCls + ' mt-2' + fieldErrClass(fe('goals.northStarCustom'))}
                placeholder="Describe your metric"
                value={g.northStarCustom}
                onChange={(e) =>
                  patchDraft((d) => ({ ...d, goals: { ...d.goals, northStarCustom: e.target.value } }))
                }
              />
            )}
            {fe('goals.northStarCustom') && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
            )}
          </div>
          <div>
            <label className={labelCls}>Exit plans</label>
            <div
              className={`flex flex-wrap gap-2 rounded-[14px] p-2 ${fe('goals.exitIntent') ? 'border border-[var(--negative)]' : ''}`}
            >
              {(['yes', 'maybe', 'no'] as const).map((ex) => (
                <Chip
                  key={ex}
                  selected={g.exitIntent === ex}
                  onClick={() => patchDraft((d) => ({ ...d, goals: { ...d.goals, exitIntent: ex } }))}
                >
                  {ex === 'yes' ? 'Yes — sell / exit' : ex === 'maybe' ? 'Maybe someday' : 'Run long-term'}
                </Chip>
              ))}
            </div>
            {fe('goals.exitIntent') && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
            )}
            {g.exitIntent !== 'no' && (
              <div className="mt-3 space-y-2">
                <select
                  className={inputCls}
                  value={g.exitBusinessId}
                  onChange={(e) =>
                    patchDraft((d) => ({ ...d, goals: { ...d.goals, exitBusinessId: e.target.value } }))
                  }
                >
                  <option value="">Which business?</option>
                  {draft.businesses.map((biz) => (
                    <option key={biz.id} value={biz.name}>
                      {biz.name || 'Untitled'}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  className={inputCls}
                  placeholder="Target price (optional)"
                  value={g.exitPrice || ''}
                  onChange={(e) =>
                    patchDraft((d) => ({ ...d, goals: { ...d.goals, exitPrice: Number(e.target.value) || 0 } }))
                  }
                />
                <input
                  className={inputCls}
                  placeholder="Timeline notes"
                  value={g.exitTimeline}
                  onChange={(e) =>
                    patchDraft((d) => ({ ...d, goals: { ...d.goals, exitTimeline: e.target.value } }))
                  }
                />
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Describe your ideal day</label>
            <textarea
              className={inputCls + ' min-h-[120px] resize-none'}
              value={g.idealDay}
              onChange={(e) => patchDraft((d) => ({ ...d, goals: { ...d.goals, idealDay: e.target.value } }))}
              placeholder="Wake time → work blocks → health → family → sleep"
            />
          </div>
        </div>
      </motion.div>
    )
  }

  if (step === 6) {
    const h = draft.health
    const sch = draft.schedule ?? {
      workStart: '',
      workEnd: '',
      deepFocus: '',
      focusDuration: '',
      commitments: [] as import('./onboarding-types').OnboardingScheduleCommitmentDraft[],
    }
    const fs = foundationSubStep
    return (
      <motion.div key="s6" variants={variants} initial="enter" animate="center" exit="exit" transition={transition} className="space-y-4">
        {fs === 0 && (
          <>
            <AiBubble>Your body and mind run the business. First, when do you actually wake?</AiBubble>
            <div className={glassPanel + ' space-y-3'}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Target wake</label>
                  <input
                    type="time"
                    className={inputCls + fieldErrClass(fe('health.targetWake'))}
                    value={h.targetWake}
                    onChange={(e) =>
                      patchDraft((d) => ({ ...d, health: { ...d.health, targetWake: e.target.value } }))
                    }
                  />
                  {fe('health.targetWake') && (
                    <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Actual wake (honest)</label>
                  <input
                    type="time"
                    className={inputCls + fieldErrClass(fe('health.actualWake'))}
                    value={h.actualWake}
                    onChange={(e) =>
                      patchDraft((d) => ({ ...d, health: { ...d.health, actualWake: e.target.value } }))
                    }
                  />
                  {fe('health.actualWake') && (
                    <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {fs === 5 && (
          <>
            <AiBubble>When are you generally available for deep work?</AiBubble>
            <div className={glassPanel + ' space-y-3'}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Work day starts</label>
                  <input
                    type="time"
                    className={inputCls + fieldErrClass(fe('schedule.workStart'))}
                    value={sch.workStart}
                    onChange={(e) =>
                      patchDraft((d) => ({ ...d, schedule: { ...d.schedule, workStart: e.target.value } }))
                    }
                  />
                  {fe('schedule.workStart') && (
                    <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Work day ends</label>
                  <input
                    type="time"
                    className={inputCls + fieldErrClass(fe('schedule.workEnd'))}
                    value={sch.workEnd}
                    onChange={(e) =>
                      patchDraft((d) => ({ ...d, schedule: { ...d.schedule, workEnd: e.target.value } }))
                    }
                  />
                  {fe('schedule.workEnd') && (
                    <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
                  )}
                </div>
              </div>
              {(() => {
                const dayOpts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                return (
                  <>
                    <div>
                      <label className={labelCls}>Fixed commitments (optional)</label>
                      {(sch.commitments ?? []).map((row, idx) => (
                        <div key={row.id || idx} className="mb-2 grid gap-2 rounded-xl border border-[var(--border)] p-3">
                          <input
                            className={inputCls}
                            placeholder="Title"
                            value={row.title}
                            onChange={(e) =>
                              patchDraft((d) => {
                                const c = [...d.schedule.commitments]
                                c[idx] = { ...c[idx], title: e.target.value }
                                return { ...d, schedule: { ...d.schedule, commitments: c } }
                              })
                            }
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="time"
                              className={inputCls}
                              value={row.time}
                              onChange={(e) =>
                                patchDraft((d) => {
                                  const c = [...d.schedule.commitments]
                                  c[idx] = { ...c[idx], time: e.target.value }
                                  return { ...d, schedule: { ...d.schedule, commitments: c } }
                                })
                              }
                            />
                            <input
                              type="number"
                              className={inputCls}
                              placeholder="Minutes"
                              min={15}
                              value={row.durationMin || ''}
                              onChange={(e) =>
                                patchDraft((d) => {
                                  const c = [...d.schedule.commitments]
                                  c[idx] = { ...c[idx], durationMin: Number(e.target.value) || 0 }
                                  return { ...d, schedule: { ...d.schedule, commitments: c } }
                                })
                              }
                            />
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {dayOpts.map((day) => (
                              <Chip
                                key={day}
                                selected={row.days?.includes(day)}
                                onClick={() =>
                                  patchDraft((d) => {
                                    const c = [...d.schedule.commitments]
                                    const days = new Set(c[idx].days ?? [])
                                    if (days.has(day)) days.delete(day)
                                    else days.add(day)
                                    c[idx] = { ...c[idx], days: [...days] }
                                    return { ...d, schedule: { ...d.schedule, commitments: c } }
                                  })
                                }
                              >
                                {day}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="text-[15px] font-medium text-[var(--accent)]"
                        onClick={() =>
                          patchDraft((d) => ({
                            ...d,
                            schedule: {
                              ...d.schedule,
                              commitments: [
                                ...d.schedule.commitments,
                                {
                                  id: newId(),
                                  title: '',
                                  time: '12:00',
                                  durationMin: 60,
                                  days: [],
                                },
                              ],
                            },
                          }))
                        }
                      >
                        + Add commitment
                      </button>
                    </div>
                    <div>
                      <label className={labelCls}>Deep focus preference</label>
                      <div className="flex flex-wrap gap-2">
                        {['Morning', 'Afternoon', 'Evening', 'Late night', 'No preference'].map((x) => (
                          <Chip
                            key={x}
                            selected={sch.deepFocus === x}
                            onClick={() =>
                              patchDraft((d) => ({ ...d, schedule: { ...d.schedule, deepFocus: x } }))
                            }
                          >
                            {x}
                          </Chip>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Preferred focus block length</label>
                      <div className="flex flex-wrap gap-2">
                        {['15', '30', '45', '60', '90+'].map((x) => (
                          <Chip
                            key={x}
                            selected={sch.focusDuration === x}
                            onClick={() =>
                              patchDraft((d) => ({ ...d, schedule: { ...d.schedule, focusDuration: x } }))
                            }
                          >
                            {x} min
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          </>
        )}

        {fs === 1 && (
          <>
            <AiBubble>Let&apos;s baseline movement and fuel.</AiBubble>
            <div className={glassPanel + ' space-y-3'}>
          <div>
            <label className={labelCls}>Exercise</label>
            <div className="flex flex-wrap gap-2">
              {['Yes — consistently', 'Sometimes', 'Rarely', 'Never'].map((x) => (
                <Chip
                  key={x}
                  selected={h.exercise === x}
                  onClick={() => patchDraft((d) => ({ ...d, health: { ...d.health, exercise: x } }))}
                >
                  {x}
                </Chip>
              ))}
            </div>
            {fe('health.exercise') && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">Pick one option</p>
            )}
            {h.exercise && h.exercise !== 'Never' && (
              <input
                className={inputCls + ' mt-2'}
                placeholder="What kind / how often?"
                value={h.exerciseDetail}
                onChange={(e) =>
                  patchDraft((d) => ({ ...d, health: { ...d.health, exerciseDetail: e.target.value } }))
                }
              />
            )}
            {h.exercise === 'Never' && (
              <div className="mt-2 flex gap-2">
                <Chip
                  selected={h.gymEquipment === 'yes'}
                  onClick={() => patchDraft((d) => ({ ...d, health: { ...d.health, gymEquipment: 'yes' } }))}
                >
                  Gym / equipment
                </Chip>
                <Chip
                  selected={h.gymEquipment === 'no'}
                  onClick={() => patchDraft((d) => ({ ...d, health: { ...d.health, gymEquipment: 'no' } }))}
                >
                  None
                </Chip>
              </div>
            )}
          </div>
          <div>
            <label className={labelCls}>Diet</label>
            <div className="flex flex-wrap gap-2">
              {['Excellent', 'Good', 'Okay', 'Bad', 'Terrible'].map((x) => (
                <Chip
                  key={x}
                  selected={h.dietQuality === x}
                  onClick={() => patchDraft((d) => ({ ...d, health: { ...d.health, dietQuality: x } }))}
                >
                  {x}
                </Chip>
              ))}
            </div>
            {fe('health.dietQuality') && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">Pick one option</p>
            )}
          </div>
            </div>
          </>
        )}

        {fs === 2 && (
          <>
            <AiBubble>Caffeine and smoking — honesty here improves your energy model.</AiBubble>
            <div className={glassPanel + ' space-y-3'}>
          <div>
            <label className={labelCls}>Caffeine</label>
            <div className={`flex flex-wrap gap-2 ${fe('health.caffeine') ? 'rounded-[14px] border border-[var(--negative)] p-2' : ''}`}>
              {['None', 'Coffee', 'Energy drinks', 'Tea', 'Multiple'].map((x) => (
                <Chip
                  key={x}
                  selected={h.caffeine === x}
                  onClick={() => patchDraft((d) => ({ ...d, health: { ...d.health, caffeine: x } }))}
                >
                  {x}
                </Chip>
              ))}
            </div>
            {fe('health.caffeine') && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">Pick one option</p>
            )}
            <input
              className={inputCls + ' mt-2'}
              placeholder="Amount / day"
              value={h.caffeineDetail}
              onChange={(e) =>
                patchDraft((d) => ({ ...d, health: { ...d.health, caffeineDetail: e.target.value } }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>Smoking / vaping</label>
            <div className={`flex flex-wrap gap-2 ${fe('health.smoking') ? 'rounded-[14px] border border-[var(--negative)] p-2' : ''}`}>
              {['No', 'Cigarettes', 'Vape', 'Other', 'Trying to quit'].map((x) => (
                <Chip
                  key={x}
                  selected={h.smoking === x}
                  onClick={() => patchDraft((d) => ({ ...d, health: { ...d.health, smoking: x } }))}
                >
                  {x}
                </Chip>
              ))}
            </div>
            {fe('health.smoking') && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">Pick one option</p>
            )}
          </div>
            </div>
          </>
        )}

        {fs === 3 && (
          <>
            <AiBubble>Energy, stress, and screen time — sliders update your dashboard model.</AiBubble>
            <div className={glassPanel + ' space-y-3'}>
          <div>
            <label className={labelCls}>Non-productive phone time (hrs/day): {h.screenTimeHours}</label>
            <input
              type="range"
              min={0}
              max={12}
              step={0.5}
              value={h.screenTimeHours}
              onChange={(e) =>
                patchDraft((d) => ({ ...d, health: { ...d.health, screenTimeHours: Number(e.target.value) } }))
              }
              className="w-full accent-[var(--accent)]"
            />
          </div>
          <div>
            <label className={labelCls}>Energy {h.energy}/10</label>
            <input
              type="range"
              min={1}
              max={10}
              value={h.energy}
              onChange={(e) =>
                patchDraft((d) => ({ ...d, health: { ...d.health, energy: Number(e.target.value) } }))
              }
              className="w-full accent-[var(--accent)]"
            />
          </div>
          <div>
            <label className={labelCls}>Stress {h.stress}/10</label>
            <input
              type="range"
              min={1}
              max={10}
              value={h.stress}
              onChange={(e) =>
                patchDraft((d) => ({ ...d, health: { ...d.health, stress: Number(e.target.value) } }))
              }
              className="w-full accent-[var(--negative)]"
            />
          </div>
            </div>
          </>
        )}

        {fs === 4 && (
          <>
            <AiBubble>Habits you want to build — and what you&apos;re trying to leave behind.</AiBubble>
            <div className={glassPanel + ' space-y-3'}>
          <div>
            <label className={labelCls}>Habits to build</label>
            <div className="flex flex-wrap gap-2">
              {HABIT_PRESETS.map((hab) => (
                <Chip
                  key={hab}
                  selected={h.habitsToBuild.includes(hab)}
                  onClick={() =>
                    patchDraft((d) => {
                      const set = new Set(d.health.habitsToBuild)
                      if (set.has(hab)) set.delete(hab)
                      else set.add(hab)
                      return { ...d, health: { ...d.health, habitsToBuild: [...set] } }
                    })
                  }
                >
                  {hab}
                </Chip>
              ))}
            </div>
            <input
              className={inputCls + ' mt-2'}
              placeholder="Custom habit"
              value={h.customHabit}
              onChange={(e) =>
                patchDraft((d) => ({ ...d, health: { ...d.health, customHabit: e.target.value } }))
              }
            />
          </div>
          <div>
            <label className={labelCls}>Habits to quit / reduce (private)</label>
            <textarea
              className={inputCls + ' min-h-[72px] resize-none'}
              value={h.tryingToQuit}
              onChange={(e) =>
                patchDraft((d) => ({ ...d, health: { ...d.health, tryingToQuit: e.target.value } }))
              }
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-white/50">
              <input
                type="checkbox"
                checked={h.quitPrivate}
                onChange={(e) =>
                  patchDraft((d) => ({ ...d, health: { ...d.health, quitPrivate: e.target.checked } }))
                }
              />
              Keep private (AI-only summaries)
            </label>
          </div>
        </div>
          </>
        )}
      </motion.div>
    )
  }

  if (step === 7) {
    const fa = draft.faith
    return (
      <motion.div key="s7" variants={variants} initial="enter" animate="center" exit="exit" transition={transition} className="space-y-4">
        <AiBubble>Do you have a spiritual or religious practice that matters to you?</AiBubble>
        <div className={glassPanel + ' space-y-3'}>
          <div
            className={`flex flex-wrap gap-2 rounded-[14px] p-2 ${fe('faith.level') ? 'border border-[var(--negative)]' : ''}`}
          >
            {[
              ['central', 'Yes — central'],
              ['sometimes', 'Yes — sometimes'],
              ['spiritual', 'Spiritual, not religious'],
              ['no', 'No'],
              ['prefer_not', 'Prefer not to say'],
            ].map(([k, lab]) => (
              <Chip
                key={k}
                selected={fa.level === k}
                onClick={() =>
                  patchDraft((d) => ({
                    ...d,
                    faith: { ...d.faith, level: k as import('./onboarding-types').FaithLevel },
                  }))
                }
              >
                {lab}
              </Chip>
            ))}
          </div>
          {fe('faith.level') && (
            <p className="text-[13px] text-[var(--negative)]">This field is required</p>
          )}
          {(fa.level === 'central' || fa.level === 'sometimes' || fa.level === 'spiritual') && (
            <>
              <div>
                <label className={labelCls}>Tradition</label>
                <select
                  className={inputCls}
                  value={fa.tradition}
                  onChange={(e) =>
                    patchDraft((d) => ({ ...d, faith: { ...d.faith, tradition: e.target.value } }))
                  }
                >
                  <option value="">Select…</option>
                  {['Islam', 'Christianity', 'Judaism', 'Buddhism', 'Hinduism', 'Sikh', 'Spiritual / non-denominational', 'Other', 'Prefer not to specify'].map(
                    (t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    )
                  )}
                </select>
              </div>
              {fa.tradition === 'Islam' && (
                <div>
                  <label className={labelCls}>Do you want to track daily prayers?</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ['build', 'Build consistency'],
                      ['consistent', 'Already consistent'],
                      ['not_now', 'Not now'],
                    ].map(([k, lab]) => (
                      <Chip
                        key={k}
                        selected={fa.islamPrayerTracking === k}
                        onClick={() =>
                          patchDraft((d) => ({
                            ...d,
                            faith: { ...d.faith, islamPrayerTracking: k as typeof fa.islamPrayerTracking },
                          }))
                        }
                      >
                        {lab}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
              {fa.tradition === 'Islam' && (fa.islamPrayerTracking === 'build' || fa.islamPrayerTracking === 'consistent') && (
                <div>
                  <label className={labelCls}>Current consistency?</label>
                  <div className={`flex flex-wrap gap-2 ${fe('faith.prayerConsistency') ? 'rounded-[14px] border border-[var(--negative)] p-2' : ''}`}>
                    {['All 5 daily', '3-4 prayers', '1-2 prayers', 'Rarely', 'Want to start'].map((lab) => (
                      <Chip
                        key={lab}
                        selected={fa.prayerConsistency === lab}
                        onClick={() =>
                          patchDraft((d) => ({
                            ...d,
                            faith: { ...d.faith, prayerConsistency: lab },
                          }))
                        }
                      >
                        {lab}
                      </Chip>
                    ))}
                  </div>
                  {fe('faith.prayerConsistency') && (
                    <p className="mt-1 text-[13px] text-[var(--negative)]">Pick one option</p>
                  )}
                </div>
              )}
              {(fa.level === 'central' || fa.level === 'sometimes' || fa.level === 'spiritual') &&
                fa.tradition &&
                fa.tradition !== 'Islam' && (
                  <div>
                    <label className={labelCls}>Consistency (self-assessment)</label>
                    <input
                      className={inputCls}
                      value={fa.prayerConsistency}
                      onChange={(e) =>
                        patchDraft((d) => ({ ...d, faith: { ...d.faith, prayerConsistency: e.target.value } }))
                      }
                      placeholder="How it looks today"
                    />
                  </div>
                )}
              <div>
                <label className={labelCls}>Someone who models the consistency you want (optional)</label>
                <input
                  className={inputCls}
                  value={fa.roleModel}
                  onChange={(e) =>
                    patchDraft((d) => ({ ...d, faith: { ...d.faith, roleModel: e.target.value } }))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>Dashboard visibility</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    ['prominent', 'Prominent'],
                    ['small', 'Small tile'],
                    ['health_only', 'Health section only'],
                  ].map(([k, lab]) => (
                    <Chip
                      key={k}
                      selected={fa.dashboardVisibility === k}
                      onClick={() =>
                        patchDraft((d) => ({
                          ...d,
                          faith: { ...d.faith, dashboardVisibility: k as typeof fa.dashboardVisibility },
                        }))
                      }
                    >
                      {lab}
                    </Chip>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    )
  }

  if (step === 8) {
    const s = draft.struggles
    const ss = strugglesSubStep
    return (
      <motion.div key="s8" variants={variants} initial="enter" animate="center" exit="exit" transition={transition} className="space-y-4">
        <AiBubble>Real talk — what actually holds you back? This stays private and sharpens coaching.</AiBubble>
        <div className={glassPanel + ' space-y-3'}>
          {ss === 0 && (
            <>
              <div>
                <label className={labelCls}>Procrastination pattern</label>
                <textarea
                  className={inputCls + ' min-h-[72px] resize-none' + fieldErrClass(fe('struggles.procrastination'))}
                  value={s.procrastinationPattern}
                  onChange={(e) =>
                    patchDraft((d) => ({
                      ...d,
                      struggles: { ...d.struggles, procrastinationPattern: e.target.value },
                    }))
                  }
                />
                {fe('struggles.procrastination') && (
                  <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Patterns you wish you could change</label>
                <textarea
                  className={inputCls + ' min-h-[72px] resize-none' + fieldErrClass(fe('struggles.patterns'))}
                  value={s.behaviorPatterns}
                  onChange={(e) =>
                    patchDraft((d) => ({
                      ...d,
                      struggles: { ...d.struggles, behaviorPatterns: e.target.value },
                    }))
                  }
                />
                {fe('struggles.patterns') && (
                  <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
                )}
              </div>
            </>
          )}
          {ss === 1 && (
            <>
              <div>
                <label className={labelCls}>Biggest distraction</label>
                <div className={`flex flex-wrap gap-2 ${fe('struggles.distraction') ? 'rounded-[14px] border border-[var(--negative)] p-2' : ''}`}>
                  {DISTRACTION_OPTIONS.map((x) => (
                    <Chip
                      key={x}
                      selected={
                        s.biggestDistraction === x ||
                        (x === 'Other' && (s.biggestDistraction === 'Other' || s.biggestDistraction.startsWith('Other:')))
                      }
                      onClick={() =>
                        patchDraft((d) => ({
                          ...d,
                          struggles: { ...d.struggles, biggestDistraction: x },
                        }))
                      }
                    >
                      {x}
                    </Chip>
                  ))}
                </div>
                {(s.biggestDistraction === 'Other' ||
                  (s.biggestDistraction.length > 0 && s.biggestDistraction.startsWith('Other:'))) && (
                  <input
                    className={inputCls + ' mt-2'}
                    placeholder="Describe"
                    value={s.biggestDistraction.startsWith('Other:') ? s.biggestDistraction.slice(7).trim() : ''}
                    onChange={(e) =>
                      patchDraft((d) => ({
                        ...d,
                        struggles: { ...d.struggles, biggestDistraction: `Other: ${e.target.value}` },
                      }))
                    }
                  />
                )}
                {fe('struggles.distraction') && (
                  <p className="mt-1 text-[13px] text-[var(--negative)]">Pick one option</p>
                )}
              </div>
              <div>
                <label className={labelCls}>Trying to quit — impact on your life</label>
                <textarea
                  className={inputCls + ' min-h-[72px] resize-none'}
                  value={s.tryingToQuitDetail}
                  onChange={(e) =>
                    patchDraft((d) => ({
                      ...d,
                      struggles: { ...d.struggles, tryingToQuitDetail: e.target.value },
                    }))
                  }
                />
                <label className="mt-1 flex items-center gap-2 text-xs text-white/45">
                  <input
                    type="checkbox"
                    checked={s.tryingToQuitPrivate}
                    onChange={(e) =>
                      patchDraft((d) => ({
                        ...d,
                        struggles: { ...d.struggles, tryingToQuitPrivate: e.target.checked },
                      }))
                    }
                  />
                  Private — AI only
                </label>
              </div>
            </>
          )}
          {ss === 2 && (
            <>
              <div>
                <label className={labelCls}>Last time you felt truly locked in</label>
                <textarea
                  className={inputCls + ' min-h-[80px] resize-none'}
                  value={s.lastLockedIn}
                  onChange={(e) =>
                    patchDraft((d) => ({
                      ...d,
                      struggles: { ...d.struggles, lastLockedIn: e.target.value },
                    }))
                  }
                />
              </div>
              <div>
                <label className={labelCls}>What would need to be true to feel in control?</label>
                <textarea
                  className={inputCls + ' min-h-[80px] resize-none'}
                  value={s.whatNeedsToBeTrue}
                  onChange={(e) =>
                    patchDraft((d) => ({
                      ...d,
                      struggles: { ...d.struggles, whatNeedsToBeTrue: e.target.value },
                    }))
                  }
                />
              </div>
            </>
          )}
        </div>
      </motion.div>
    )
  }

  if (step === 9) {
    const a = draft.ai
    return (
      <motion.div key="s9" variants={variants} initial="enter" animate="center" exit="exit" transition={transition} className="space-y-4">
        <AiBubble>How should your AI partner communicate with you?</AiBubble>
        <div className={glassPanel + ' space-y-4'}>
          <div>
            <label className={labelCls}>When you avoid something important…</label>
            <div
              className={`space-y-2 rounded-[14px] p-2 ${fe('ai.communicationStyle') ? 'border border-[var(--negative)]' : ''}`}
            >
              {[
                ['mix', 'Mix — balanced (default)'],
                ['data', 'Show me the data and ask what it would take'],
                ['direct', 'Be direct — call me out'],
                ['gentle', 'Start gentle, get tougher over time'],
                ['block', "Ask what's really blocking me"],
              ].map(([k, lab]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() =>
                    patchDraft((d) => ({ ...d, ai: { ...d.ai, communicationStyle: k as string } }))
                  }
                  className={`w-full rounded-[12px] border px-4 py-3 text-left text-sm ${
                    a.communicationStyle === k
                      ? 'border-[var(--accent)]/35 bg-[var(--accent-bg)] text-[var(--text-primary)]'
                      : 'border-white/[0.06] text-white/55 hover:bg-white/[0.03]'
                  }`}
                >
                  {lab}
                </button>
              ))}
            </div>
            {fe('ai.communicationStyle') && (
              <p className="mt-1 text-[13px] text-[var(--negative)]">This field is required</p>
            )}
          </div>
          <div>
            <label className={labelCls}>What motivates you?</label>
            <div className="flex flex-wrap gap-2">
              {[
                'Money earned',
                'Money left on table',
                'Ideal self competition',
                'Streaks',
                'All of the above',
              ].map((m) => (
                <Chip
                  key={m}
                  selected={a.motivators.includes(m)}
                  onClick={() =>
                    patchDraft((d) => {
                      const set = new Set(d.ai.motivators)
                      if (set.has(m)) set.delete(m)
                      else set.add(m)
                      return { ...d, ai: { ...d.ai, motivators: [...set] } }
                    })
                  }
                >
                  {m}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>How often should I message you?</label>
            <div className="flex flex-wrap gap-2">
              {[
                'As much as possible',
                'A few times a day',
                'Once a day max',
                'Only when urgent',
              ].map((m) => (
                <Chip
                  key={m}
                  selected={a.frequency === m}
                  onClick={() => patchDraft((d) => ({ ...d, ai: { ...d.ai, frequency: m } }))}
                >
                  {m}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Decision analysis detail</label>
            <div className="flex flex-wrap gap-2">
              {[
                ['short', 'Conclusion first — tap for reasoning'],
                ['full', 'Always show full reasoning'],
                ['minimal', 'Short — tell me what to do'],
              ].map(([k, lab]) => (
                <Chip
                  key={k}
                  selected={a.reasoningDisplay === k}
                  onClick={() =>
                    patchDraft((d) => ({
                      ...d,
                      ai: { ...d.ai, reasoningDisplay: k as string },
                    }))
                  }
                >
                  {lab}
                </Chip>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Chip
              selected={a.factorHealthInBusiness}
              onClick={() =>
                patchDraft((d) => ({
                  ...d,
                  ai: { ...d.ai, factorHealthInBusiness: !d.ai.factorHealthInBusiness },
                }))
              }
            >
              Factor health into business advice
            </Chip>
          </div>
        </div>
      </motion.div>
    )
  }

  if (step === 10) {
    const c = draft.connections
    return (
      <motion.div key="s10" variants={variants} initial="enter" animate="center" exit="exit" transition={transition} className="space-y-4">
        <AiBubble>Optional connections — add them now or from Settings later.</AiBubble>
        <div className="space-y-3">
          <div className={glassPanel}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg">🧠</span>
              <span className="font-semibold">Anthropic API</span>
            </div>
            <p className="mb-2 text-xs text-white/45">Unlock in-app AI analysis when you add a key.</p>
            <input
              type="password"
              className={inputCls}
              placeholder="sk-ant-..."
              value={c.anthropicKey}
              onChange={(e) =>
                patchDraft((d) => ({
                  ...d,
                  connections: { ...d.connections, anthropicKey: e.target.value },
                }))
              }
            />
            <p className="mt-1 text-[10px] text-white/30">
              Or use Copy Context from Settings later — no key required for manual workflows.
            </p>
          </div>
          <div className={glassPanel}>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-lg">💳</span>
              <span className="font-semibold">Stripe</span>
            </div>
            <label className="flex items-center gap-2 text-sm text-white/60">
              <input
                type="checkbox"
                checked={c.stripeConnected}
                onChange={(e) =>
                  patchDraft((d) => ({
                    ...d,
                    connections: { ...d.connections, stripeConnected: e.target.checked },
                  }))
                }
              />
              I&apos;ll connect Stripe when available
            </label>
          </div>
          <div className={glassPanel}>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-lg">🏦</span>
              <span className="font-semibold">Banking (Plaid)</span>
            </div>
            <label className="flex items-center gap-2 text-sm text-white/60">
              <input
                type="checkbox"
                checked={c.plaidIntent === 'connect'}
                onChange={(e) =>
                  patchDraft((d) => ({
                    ...d,
                    connections: {
                      ...d.connections,
                      plaidIntent: e.target.checked ? 'connect' : 'later',
                    },
                  }))
                }
              />
              Connect bank when available
            </label>
          </div>
          <div className={glassPanel}>
            <div className="mb-1 flex items-center gap-2">
              <span className="text-lg">📅</span>
              <span className="font-semibold">Google Calendar</span>
            </div>
            <label className="flex items-center gap-2 text-sm text-white/60">
              <input
                type="checkbox"
                checked={c.calendarConnected}
                onChange={(e) =>
                  patchDraft((d) => ({
                    ...d,
                    connections: { ...d.connections, calendarConnected: e.target.checked },
                  }))
                }
              />
              Sync calendar when available
            </label>
          </div>
        </div>
      </motion.div>
    )
  }

  if (step === 12) {
    const id = draft.identity
    const totalRev = draft.businesses.reduce((s, b) => s + (b.monthlyRevenue || 0), 0)
    return (
      <motion.div key="s12" variants={variants} initial="enter" animate="center" exit="exit" transition={transition} className="space-y-4">
        <AiBubble>
          Here&apos;s everything I know so far, {id.name.trim() || 'friend'}. Tap any card on the preview to see what
          feeds it — it&apos;s all from your answers.
        </AiBubble>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ['Businesses', String(draft.businesses.filter((x) => x.name.trim()).length)],
            ['Monthly revenue (entered)', `$${totalRev.toLocaleString()}`],
            ['Income target', `$${draft.goals.incomeTarget.toLocaleString()}`],
            ['Savings range', draft.finance.savingsRange || '—'],
          ].map(([k, v]) => (
            <div key={k} className={glassPanel + ' p-4'}>
              <p className="label text-white/35">{k}</p>
              <p className="data mt-1 text-lg text-white">{v}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-white/35">
          When you continue, we&apos;ll save your PIN and open your dashboard.
        </p>
      </motion.div>
    )
  }

  return null
}
