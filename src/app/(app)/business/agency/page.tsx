'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useStore, getClientNet, type PipelineDeal } from '@/stores/store'
import { DRIVER_STATUS_COLORS } from '@/lib/constants'
import Link from 'next/link'
import PageTransition from '@/components/PageTransition'
import { StaggerContainer, StaggerItem } from '@/components/Stagger'
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts'

const revenueData = Array.from({length: 6}, (_, i) => ({ month: ['Oct','Nov','Dec','Jan','Feb','Mar'][i], agency: [22,24,28,30,27,26][i] * 1000, plumbing: [15,18,21,19,20,18][i] * 1000 }))

const STAGES: { key: PipelineDeal['stage']; label: string }[] = [
  { key: 'lead', label: 'Lead' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'call_booked', label: 'Call Booked' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'signed', label: 'Signed' },
  { key: 'onboarding', label: 'Onboarding' },
]

const EXIT_SCORECARD = [
  { category: 'Revenue Concentration', score: 15, max: 20 },
  { category: 'Owner Dependency', score: 8, max: 20 },
  { category: 'SOPs', score: 0, max: 20 },
  { category: 'Revenue Trend', score: 10, max: 20 },
  { category: 'Team', score: 2, max: 20 },
]

const AGENCY_DRIVERS = [
  { name: 'Cold Email UMich Alumni', status: 'STALE' },
  { name: 'SEO Own 3 GMBs', status: 'NEVER TRIED' },
  { name: 'LinkedIn DM', status: 'IDEA' },
  { name: 'Referral Program', status: 'IDEA' },
  { name: 'PPC Upsell', status: 'IDEA' },
]

const AGENCY_GMBS = [
  { city: 'San Antonio', status: 'Not optimized' },
  { city: 'Phoenix', status: 'Not optimized' },
  { city: 'Houston', status: 'Not optimized' },
]

const STATUS_LABELS: Record<string, string> = { active_healthy: 'Active', active_slow: 'Slow', active_prerevenue: 'Pre-Revenue', dormant: 'Dormant', backburner: 'Backburner', idea: 'Idea' }

export default function AgencyPage() {
  const { businesses, clients, pipeline, addDeal, updateDealStage, deleteDeal, drivers } = useStore()
  const agencyBiz = businesses.find(b => b.type === 'agency' || b.name.toLowerCase().includes('agency'))
  const agencyClients = clients.filter(c => c.businessId === agencyBiz?.id)

  const clientLTVData = agencyClients.map(c => ({ name: c.name.split(' ')[0], ltv: getClientNet(c) * 12 }))
  const totalGross = agencyClients.reduce((s, c) => s + c.grossMonthly, 0)
  const totalNet = agencyClients.reduce((s, c) => s + getClientNet(c), 0)
  const awsClient = agencyClients.find((c) => c.name.includes('AWS'))
  const awsGross = awsClient?.grossMonthly ?? 0
  const awsConcentration = totalGross > 0 ? Math.round((awsGross / totalGross) * 100) : 0
  const [showAddDeal, setShowAddDeal] = useState(false)
  const [newDeal, setNewDeal] = useState({ companyName: '', dealValue: '', stage: 'lead' as PipelineDeal['stage'] })

  const storeDrivers = drivers.filter((d) => d.businessId === agencyBiz?.id)
  const displayDrivers = storeDrivers.length > 0 ? storeDrivers : null

  const handleAddDeal = () => {
    if (!newDeal.companyName.trim()) return
    addDeal({ companyName: newDeal.companyName, stage: newDeal.stage, dealValue: newDeal.dealValue ? Number(newDeal.dealValue) : undefined })
    setNewDeal({ companyName: '', dealValue: '', stage: 'lead' })
    setShowAddDeal(false)
    toast.success(`Deal "${newDeal.companyName}" added to pipeline`)
  }

  if (!agencyBiz) return (
    <PageTransition><div className="p-4 md:p-7 max-w-[960px] mx-auto"><p className="text-[var(--text-dim)]">No agency business found. Add businesses in Settings or re-run onboarding.</p></div></PageTransition>
  )

  return (
    <PageTransition>
      <div className="p-4 md:p-7 max-w-[960px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-bold tracking-tight text-[var(--text)]">{agencyBiz.name.toUpperCase()}</h1>
            <span className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] px-2.5 py-0.5 rounded-full bg-[var(--accent)]/15">
              {STATUS_LABELS[agencyBiz.status] || agencyBiz.status}
            </span>
          </div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/ai?business=agency" className="text-[13px] bg-[var(--surface2)] border border-[var(--border)] rounded-[8px] px-3 py-1.5 hover:bg-[var(--surface)] transition-colors">
              AI Context
            </Link>
          </motion.div>
        </div>

        {/* MRR - Sticky metrics */}
        <div className="sticky top-0 z-10 glass rounded-[16px] p-3 mb-5">
          <StaggerContainer className="grid grid-cols-2 gap-2">
            <StaggerItem>
              <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3">
                <p className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-1">Gross MRR</p>
                <p className="data text-[28px] font-bold text-[var(--text)]">${totalGross.toLocaleString()}</p>
              </motion.div>
            </StaggerItem>
            <StaggerItem>
              <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3">
                <p className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-1">Net MRR</p>
                <p className="data text-[28px] font-bold text-[var(--accent)]">${totalNet.toLocaleString()}</p>
              </motion.div>
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* Revenue Trend Chart */}
        <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3 mb-5">
          <p className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-3">Revenue Trend (6 Months)</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="agencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="agency" stroke="var(--accent)" fill="url(#agencyGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Client LTV Chart */}
        <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3 mb-5">
          <p className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-3">Client LTV (Annual Net)</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={clientLTVData}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="ltv" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <StaggerContainer>
          {/* Client Table */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3 mb-5 overflow-x-auto">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-3">Clients</h2>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2 pr-3 text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">Client</th>
                    <th className="pb-2 pr-3 text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">Gross</th>
                    <th className="pb-2 pr-3 text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">Ad Spend</th>
                    <th className="pb-2 pr-3 text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">Stripe</th>
                    <th className="pb-2 pr-3 text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">Net</th>
                    <th className="pb-2 pr-3 text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">Service</th>
                    <th className="pb-2 text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">Meeting</th>
                  </tr>
                </thead>
                <tbody>
                  {agencyClients.map((c) => (
                    <tr key={c.name} className="border-t border-[var(--border)]">
                      <td className="py-2 pr-3 text-[14px] text-[var(--text-mid)] font-medium flex items-center gap-2">
                        {c.name}
                        {c.name.includes('AWS') && (
                          <span className="text-[11px] bg-[var(--rose)]/15 text-[var(--rose)] px-1.5 py-0.5 rounded-full font-semibold">
                            {awsConcentration}% concentration
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3 data text-[14px]">${c.grossMonthly.toLocaleString()}</td>
                      <td className="py-2 pr-3 text-[14px] text-[var(--text-mid)]">${c.adSpend.toLocaleString()}</td>
                      <td className="py-2 pr-3 text-[14px] text-[var(--text-mid)]">${Math.round(c.grossMonthly * 0.03)}</td>
                      <td className="py-2 pr-3 data text-[14px] text-[var(--accent)]">${getClientNet(c).toLocaleString()}</td>
                      <td className="py-2 pr-3 text-[14px] text-[var(--text-mid)]">{c.serviceType}</td>
                      <td className="py-2 text-[14px] text-[var(--text-mid)]">{c.meetingFrequency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </StaggerItem>

          {/* Pipeline / CRM */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">Pipeline / CRM</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddDeal(true)}
                  className="text-[12px] font-semibold px-3 py-1 rounded-[8px] bg-[var(--accent)]/15 text-[var(--accent)] hover:bg-[var(--accent)]/25 transition-colors"
                >
                  + Add Deal
                </motion.button>
              </div>

              {showAddDeal && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 mb-4 p-3 bg-[var(--surface2)] rounded-[12px]"
                >
                  <input value={newDeal.companyName} onChange={(e) => setNewDeal({ ...newDeal, companyName: e.target.value })} placeholder="Company name" className="bg-[var(--bg)] border border-[var(--border)] rounded-[8px] px-3 py-1.5 text-[13px] text-[var(--text)] flex-1 min-w-[140px]" />
                  <input value={newDeal.dealValue} onChange={(e) => setNewDeal({ ...newDeal, dealValue: e.target.value })} placeholder="Deal value" type="number" className="bg-[var(--bg)] border border-[var(--border)] rounded-[8px] px-3 py-1.5 text-[13px] text-[var(--text)] w-[100px]" />
                  <select value={newDeal.stage} onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value as PipelineDeal['stage'] })} className="bg-[var(--bg)] border border-[var(--border)] rounded-[8px] px-3 py-1.5 text-[13px] text-[var(--text)]">
                    {STAGES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleAddDeal} className="text-[12px] font-semibold px-3 py-1.5 rounded-[8px] bg-[var(--accent)] text-white">Save</motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAddDeal(false)} className="text-[12px] px-3 py-1.5 rounded-[8px] text-[var(--text-dim)]">Cancel</motion.button>
                </motion.div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {STAGES.map((stage) => {
                  const deals = pipeline.filter((d) => d.stage === stage.key)
                  return (
                    <div key={stage.key} className="bg-[var(--surface2)] rounded-[12px] p-2.5 min-h-[100px]">
                      <p className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-2">{stage.label} ({deals.length})</p>
                      {deals.map((d) => (
                        <motion.div
                          key={d.id}
                          whileHover={{ scale: 1.03, y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          className="bg-[var(--surface)] border border-[var(--border)] rounded-[8px] p-2 mb-1.5 text-[12px] cursor-pointer"
                        >
                          <p className="text-[var(--text)] font-medium truncate">{d.companyName}</p>
                          {d.dealValue && <p className="text-[var(--accent)] data">${d.dealValue.toLocaleString()}/mo</p>}
                        </motion.div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </StaggerItem>

          {/* Revenue Drivers */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3 mb-5">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-3">Revenue Drivers</h2>
              <div className="flex flex-col gap-1.5">
                {(displayDrivers || AGENCY_DRIVERS).map((d, i) => (
                  <motion.div key={i} whileHover={{ x: 2 }} className="flex items-center justify-between bg-[var(--surface2)] rounded-[12px] px-3 py-2">
                    <span className="text-[14px] text-[var(--text-mid)]">{d.name}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${DRIVER_STATUS_COLORS[d.status] || 'bg-[var(--surface)] text-[var(--text-dim)]'}`}>
                      {d.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </StaggerItem>

          {/* Exit Readiness Scorecard */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)]">Exit Readiness Scorecard</h2>
                <span className="data text-[28px] font-bold text-[var(--rose)]">35/100</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {EXIT_SCORECARD.map((item) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[14px] text-[var(--text-mid)]">{item.category}</span>
                      <span className="data text-[12px] text-[var(--text)]">{item.score}/{item.max}</span>
                    </div>
                    <div className="h-2 bg-[var(--surface2)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.score / item.max) * 100}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: item.score / item.max >= 0.5 ? 'var(--accent)' : item.score / item.max >= 0.25 ? 'var(--amber, #f59e0b)' : 'var(--rose)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </StaggerItem>

          {/* Agency GMB Profiles */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3 mb-5">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-3">Agency GMB Profiles</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {AGENCY_GMBS.map((g) => (
                  <motion.div key={g.city} whileHover={{ scale: 1.02, y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} className="bg-[var(--surface2)] rounded-[12px] p-3">
                    <p className="text-[14px] font-semibold text-[var(--text)] mb-1">{g.city}</p>
                    <span className="text-[11px] bg-[var(--rose)]/15 text-[var(--rose)] px-2 py-0.5 rounded-full font-medium">{g.status}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </StaggerItem>

          {/* Cold Email Tracker Placeholder */}
          <StaggerItem>
            <motion.div whileHover={{ y: -1, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }} className="card p-3">
              <h2 className="text-[10px] font-mono uppercase tracking-[2px] text-[var(--text-dim)] mb-2">Cold Email Tracker</h2>
              <p className="text-[14px] text-[var(--text-mid)]">Connect Instantly to see open rates, reply rates, and booked calls.</p>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
