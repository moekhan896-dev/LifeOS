'use client'

import { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { useStore, getClientNet, getAgencyTotals, isArchived, type Business, type Client, type GmbProfile } from '@/stores/store'
import PageTransition from '@/components/PageTransition'
import {
  TAGS, XP_VALUES, PRIORITY_COLORS, DRIVER_STATUSES, DRIVER_STATUS_COLORS,
  BUSINESS_STATUSES, COLOR_SWATCHES, MEETING_FREQUENCIES,
} from '@/lib/constants'
import { applyTaskDollarEstimateAfterCreate } from '@/lib/task-dollar-client'
import { clientConcentrationWarnings } from '@/lib/financials-metrics'

/* ── Constants ── */

const STATUS_BADGE_COLORS: Record<string, string> = {
  active_healthy: 'bg-[rgba(48,209,88,0.15)] text-[var(--positive)]',
  active_slow: 'bg-[rgba(255,159,10,0.15)] text-[var(--warning)]',
  active_prerevenue: 'bg-[rgba(191,90,242,0.15)] text-[var(--ai)]',
  dormant: 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]',
  backburner: 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]',
  idea: 'bg-[var(--accent-bg)] text-[var(--accent)]',
}

const PRIORITY_BORDER: Record<string, string> = {
  crit: 'var(--rose)', high: 'var(--amber)', med: 'var(--blue)', low: 'var(--border)',
}

const GMB_TOP_BORDER: Record<string, string> = {
  strong: 'var(--positive)',
  medium: 'var(--warning)',
  new: 'var(--accent)',
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } }
const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

/* ── Page ── */

export default function BusinessPage() {
  const params = useParams()
  const id = params.id as string

  const {
    businesses, clients, gmbProfiles, tasks, drivers, revenueEntries,
    updateBusiness, archiveBusiness,
    addClient, updateClient, deleteClient,
    addGmbProfile, updateGmbProfile, deleteGmbProfile,
    addTask, toggleTask, deleteTask, updateTask,
    addDriver, deleteDriver, updateDriverStatus,
    addRevenue, deleteRevenue,
  } = useStore()

  const biz = businesses.find((b) => b.id === id && !isArchived(b))

  // ── Local State ──
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editStatus, setEditStatus] = useState<string>('')
  const [editRevenue, setEditRevenue] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [notes, setNotes] = useState(biz?.notes ?? '')

  // Client inline editing
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [editingClientField, setEditingClientField] = useState<string | null>(null)
  const [editingClientValue, setEditingClientValue] = useState('')

  // New client form
  const [newClient, setNewClient] = useState({ name: '', grossMonthly: '', adSpend: '', serviceType: '', meetingFrequency: 'Monthly' })

  // GMB form
  const [newGmb, setNewGmb] = useState({ city: '', reviewCount: '', callsPerMonth: '', ranking: '', status: 'new' as GmbProfile['status'] })
  const [editingGmbId, setEditingGmbId] = useState<string | null>(null)
  const [editingGmbField, setEditingGmbField] = useState<string | null>(null)
  const [editingGmbValue, setEditingGmbValue] = useState('')

  // Task form
  const [newTaskText, setNewTaskText] = useState('')

  // Revenue form
  const [revForm, setRevForm] = useState({ date: new Date().toISOString().slice(0, 10), amount: '', notes: '' })

  // Driver form
  const [newDriverName, setNewDriverName] = useState('')

  // ── Derived Data ──
  const bizClients = useMemo(() => clients.filter((c) => c.businessId === id), [clients, id])
  const bizGmb = useMemo(() => (gmbProfiles ?? []).filter((g) => g.businessId === id), [gmbProfiles, id])
  const bizTasks = useMemo(() => tasks.filter((t) => t.businessId === id).sort((a, b) => {
    const order = { crit: 0, high: 1, med: 2, low: 3 }
    return order[a.priority] - order[b.priority]
  }), [tasks, id])
  const bizDrivers = useMemo(() => drivers.filter((d) => d.businessId === id), [drivers, id])
  const bizRevenue = useMemo(() => revenueEntries.filter((r) => r.businessId === id).sort((a, b) => a.date.localeCompare(b.date)), [revenueEntries, id])
  const incompleteTasks = bizTasks.filter((t) => !t.done).length
  const agencyTotals = biz?.type === 'agency' ? getAgencyTotals(bizClients) : null
  const globalNetTotal = useMemo(
    () => getAgencyTotals(clients.filter((c) => c.active)).net,
    [clients]
  )
  const concentrationAlertsThisBiz = useMemo(
    () => clientConcentrationWarnings(businesses, clients, 30).filter((w) => w.business.id === id),
    [businesses, clients, id]
  )

  // ── Not Found ──
  if (!biz) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center gap-4 py-32">
          <p className="text-text-dim text-lg">Business not found. It may have been deleted.</p>
          <Link href="/dashboard" className="text-accent hover:underline">Back to Dashboard</Link>
        </div>
      </PageTransition>
    )
  }

  const statusLabel = BUSINESS_STATUSES.find((s) => s.value === biz.status)?.label ?? biz.status

  // ── Handlers ──

  function startEdit() {
    setEditName(biz!.name)
    setEditStatus(biz!.status)
    setEditRevenue(String(biz!.monthlyRevenue))
    setEditColor(biz!.color)
    setEditNotes(biz!.notes ?? '')
    setEditing(true)
  }

  function saveEdit() {
    updateBusiness(biz!.id, {
      name: editName,
      status: editStatus as Business['status'],
      monthlyRevenue: Number(editRevenue) || 0,
      color: editColor,
      notes: editNotes,
    })
    setEditing(false)
    toast.success('Business updated')
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    archiveBusiness(biz!.id)
    setConfirmDelete(false)
  }

  function handleAddClient() {
    if (!newClient.name) return
    addClient({
      businessId: id,
      name: newClient.name,
      grossMonthly: Number(newClient.grossMonthly) || 0,
      adSpend: Number(newClient.adSpend) || 0,
      serviceType: newClient.serviceType,
      meetingFrequency: newClient.meetingFrequency,
      active: true,
    })
    setNewClient({ name: '', grossMonthly: '', adSpend: '', serviceType: '', meetingFrequency: 'Monthly' })
    toast.success('Client added')
  }

  function startEditClient(clientId: string, field: string, currentValue: string | number) {
    setEditingClientId(clientId)
    setEditingClientField(field)
    setEditingClientValue(String(currentValue))
  }

  function saveClientEdit() {
    if (!editingClientId || !editingClientField) return
    const numFields = ['grossMonthly', 'adSpend']
    const val = numFields.includes(editingClientField) ? Number(editingClientValue) || 0 : editingClientValue
    updateClient(editingClientId, { [editingClientField]: val })
    setEditingClientId(null)
    setEditingClientField(null)
    toast.success('Client updated')
  }

  function handleAddGmb() {
    if (!newGmb.city) return
    addGmbProfile({
      businessId: id,
      city: newGmb.city,
      reviewCount: Number(newGmb.reviewCount) || 0,
      callsPerMonth: Number(newGmb.callsPerMonth) || 0,
      ranking: newGmb.ranking,
      status: newGmb.status,
      hasAddress: true,
    })
    setNewGmb({ city: '', reviewCount: '', callsPerMonth: '', ranking: '', status: 'new' })
    toast.success('GMB profile added')
  }

  function startEditGmb(gmbId: string, field: string, currentValue: string | number) {
    setEditingGmbId(gmbId)
    setEditingGmbField(field)
    setEditingGmbValue(String(currentValue))
  }

  function saveGmbEdit() {
    if (!editingGmbId || !editingGmbField) return
    const numFields = ['reviewCount', 'callsPerMonth']
    const val = numFields.includes(editingGmbField) ? Number(editingGmbValue) || 0 : editingGmbValue
    updateGmbProfile(editingGmbId, { [editingGmbField]: val })
    setEditingGmbId(null)
    setEditingGmbField(null)
    toast.success('GMB profile updated')
  }

  function handleAddTask() {
    if (!newTaskText.trim()) return
    let text = newTaskText.trim()
    let priority: 'crit' | 'high' | 'med' | 'low' = 'med'
    let tag = 'OPS'

    const prioMatch = text.match(/^!(crit|high|med|low)\s+/)
    if (prioMatch) { priority = prioMatch[1] as typeof priority; text = text.replace(prioMatch[0], '') }
    const tagMatch = text.match(/#(\w+)\s*/)
    if (tagMatch) { tag = tagMatch[1].toUpperCase(); text = text.replace(tagMatch[0], '') }

    const tid = addTask({ businessId: id, text, tag, priority, done: false, xpValue: XP_VALUES[priority] })
    void applyTaskDollarEstimateAfterCreate(tid, text)
    setNewTaskText('')
    toast.success('Task added')
  }

  function handleAddRevenue() {
    if (!revForm.amount) return
    addRevenue({ businessId: id, amount: Number(revForm.amount), date: revForm.date, notes: revForm.notes })
    setRevForm({ date: new Date().toISOString().slice(0, 10), amount: '', notes: '' })
    toast.success('Revenue logged')
  }

  function handleAddDriver() {
    if (!newDriverName.trim()) return
    addDriver({ businessId: id, category: 'general', name: newDriverName.trim(), impact: 3, status: 'IDEA' })
    setNewDriverName('')
    toast.success('Driver added')
  }

  // ── Render ──

  return (
    <PageTransition>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">

        {/* ── Header ── */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-4">
          {!editing ? (
            <>
              <span className="text-2xl">{biz.icon}</span>
              <h1 className="text-2xl font-semibold">{biz.name}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_BADGE_COLORS[biz.status] ?? ''}`}>
                {statusLabel}
              </span>
              <span className="w-3 h-3 rounded-full" style={{ background: biz.color }} />
              <div className="ml-auto flex gap-2">
                <button onClick={startEdit} className="px-3 py-1.5 rounded-lg text-sm bg-surface hover:bg-border transition">Edit</button>
                <Link href={`/ai?business=${biz.id}`} className="px-3 py-1.5 rounded-lg text-sm bg-accent/15 text-accent hover:bg-accent/25 transition">
                  Open AI &rarr;
                </Link>
                <button onClick={handleDelete} className={`px-3 py-1.5 rounded-lg text-sm transition ${confirmDelete ? 'bg-rose text-white' : 'bg-rose/15 text-rose hover:bg-rose/25'}`}>
                  {confirmDelete ? 'Confirm Delete' : 'Delete'}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full card rounded-[16px] p-5 space-y-4">
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-lg font-semibold" />
              <div className="flex flex-wrap gap-4">
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="bg-surface border border-border rounded-lg px-3 py-2 text-sm">
                  {BUSINESS_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <input type="number" value={editRevenue} onChange={(e) => setEditRevenue(e.target.value)} placeholder="Monthly revenue" className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm w-40" />
              </div>
              <div className="flex gap-2">
                {COLOR_SWATCHES.map((c) => (
                  <button key={c} onClick={() => setEditColor(c)} className={`w-7 h-7 rounded-full transition ${editColor === c ? 'ring-2 ring-offset-2 ring-accent' : ''}`} style={{ background: c }} />
                ))}
              </div>
              <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm" placeholder="Notes..." />
              <div className="flex gap-2">
                <button onClick={saveEdit} className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent/90 transition">Save</button>
                <button onClick={() => { setEditing(false); setConfirmDelete(false) }} className="px-4 py-2 rounded-lg bg-surface text-sm hover:bg-border transition">Cancel</button>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Key Metrics ── */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card rounded-[16px] p-5">
            <p className="section-label text-xs text-text-dim mb-1">Monthly Revenue</p>
            <p className="data text-2xl font-semibold">${biz.monthlyRevenue.toLocaleString()}</p>
          </div>
          {agencyTotals && (
            <>
              <div className="card rounded-[16px] p-5">
                <p className="section-label text-xs text-text-dim mb-1">Gross MRR</p>
                <p className="data text-2xl font-semibold">${agencyTotals.gross.toLocaleString()}</p>
              </div>
              <div className="card rounded-[16px] p-5">
                <p className="section-label text-xs text-text-dim mb-1">Net MRR</p>
                <p className="data text-2xl font-semibold">${agencyTotals.net.toLocaleString()}</p>
              </div>
            </>
          )}
          <div className="card rounded-[16px] p-5">
            <p className="section-label text-xs text-text-dim mb-1">Open Tasks</p>
            <p className="data text-2xl font-semibold">{incompleteTasks}</p>
          </div>
          {biz.type === 'service' && (
            <>
              <div className="card rounded-[16px] p-5">
                <p className="section-label text-xs text-text-dim mb-1">Total Calls</p>
                <p className="data text-2xl font-semibold">{bizGmb.reduce((s, g) => s + g.callsPerMonth, 0)}</p>
              </div>
              <div className="card rounded-[16px] p-5">
                <p className="section-label text-xs text-text-dim mb-1">Total Reviews</p>
                <p className="data text-2xl font-semibold">{bizGmb.reduce((s, g) => s + g.reviewCount, 0)}</p>
              </div>
            </>
          )}
        </motion.div>

        {/* ── Revenue Chart ── */}
        <motion.div variants={fadeUp} className="card rounded-[16px] p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="section-label text-xs text-text-dim uppercase tracking-wide">Revenue</p>
            <button onClick={() => document.getElementById('rev-form')?.scrollIntoView({ behavior: 'smooth' })} className="text-xs text-accent hover:underline">Add Revenue</button>
          </div>
          {bizRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={bizRevenue}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={biz.color} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={biz.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--text-dim)" />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="amount" stroke={biz.color} fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-text-dim text-sm">No revenue entries yet.</p>
          )}
          <div id="rev-form" className="flex flex-wrap gap-2 mt-4">
            <input type="date" value={revForm.date} onChange={(e) => setRevForm({ ...revForm, date: e.target.value })} className="bg-transparent border border-border rounded-lg px-3 py-1.5 text-sm" />
            <input type="number" value={revForm.amount} onChange={(e) => setRevForm({ ...revForm, amount: e.target.value })} placeholder="Amount" className="bg-transparent border border-border rounded-lg px-3 py-1.5 text-sm w-28" />
            <input value={revForm.notes} onChange={(e) => setRevForm({ ...revForm, notes: e.target.value })} placeholder="Notes" className="bg-transparent border border-border rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[120px]" />
            <button onClick={handleAddRevenue} className="px-4 py-1.5 rounded-lg bg-accent text-white text-sm hover:bg-accent/90 transition">Log</button>
          </div>
        </motion.div>

        {/* ── Agency: Client Table ── */}
        {biz.type === 'agency' && (
          <motion.div variants={fadeUp} className="card rounded-[16px] p-5 overflow-x-auto">
            <p className="section-label text-xs text-text-dim uppercase tracking-wide mb-4">Clients</p>
            {concentrationAlertsThisBiz.length > 0 && (
              <div className="mb-4 space-y-3">
                {concentrationAlertsThisBiz.map(({ client: cl, business: bb, clientNet, pctOfTotal }) => (
                  <div
                    key={cl.id}
                    className="rounded-[14px] border border-border border-l-[3px] border-l-rose bg-surface/80 p-4"
                  >
                    <p className="text-[15px] text-text-primary">
                      ⚠ {cl.name} represents {pctOfTotal.toFixed(0)}% of net revenue from {bb.name}. If they leave, you lose $
                      {Math.round(clientNet).toLocaleString()}
                      /mo. Diversify.
                    </p>
                  </div>
                ))}
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-dim text-xs uppercase border-b border-border">
                  <th className="text-left py-2 pr-3">Name</th>
                  <th className="text-right py-2 px-2">Gross/mo</th>
                  <th className="text-right py-2 px-2">Ad Spend</th>
                  <th className="text-right py-2 px-2">Stripe 3%</th>
                  <th className="text-right py-2 px-2">Net</th>
                  <th className="text-right py-2 px-2">% of total net</th>
                  <th className="text-left py-2 px-2">Service</th>
                  <th className="text-left py-2 px-2">Meeting</th>
                  <th className="py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {bizClients.map((c) => {
                  const net = getClientNet(c)
                  const pctGlobal = globalNetTotal > 0 ? (net / globalNetTotal) * 100 : 0
                  const concentrated = pctGlobal > 30
                  return (
                    <tr key={c.id} className="border-b border-border/50 group hover:bg-surface/50">
                      {(['name', 'grossMonthly', 'adSpend'] as const).map((field) => (
                        <td key={field} className={`py-2 ${field === 'name' ? 'pr-3 text-left' : 'px-2 text-right data'}`}
                          onClick={() => startEditClient(c.id, field, c[field])}>
                          {editingClientId === c.id && editingClientField === field ? (
                            <input autoFocus value={editingClientValue} onChange={(e) => setEditingClientValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveClientEdit(); if (e.key === 'Escape') setEditingClientId(null) }}
                              onBlur={saveClientEdit}
                              className="bg-transparent border border-accent rounded px-1 py-0.5 text-sm w-full" />
                          ) : (
                            <span className="cursor-pointer hover:text-accent transition">
                              {field === 'name' ? c[field] : `$${Number(c[field]).toLocaleString()}`}
                            </span>
                          )}
                        </td>
                      ))}
                      <td className="py-2 px-2 text-right data text-text-dim">${Math.round(c.grossMonthly * 0.03).toLocaleString()}</td>
                      <td className="py-2 px-2 text-right data">
                        <span className={concentrated ? 'text-rose font-medium' : ''}>${Math.round(net).toLocaleString()}</span>
                        {concentrated && <span className="ml-1 text-[10px] bg-rose/15 text-rose px-1.5 py-0.5 rounded-full">HIGH</span>}
                      </td>
                      <td className="py-2 px-2 text-right data text-text-dim tabular-nums">
                        {globalNetTotal > 0 ? `${pctGlobal.toFixed(0)}%` : '—'}
                      </td>
                      {(['serviceType', 'meetingFrequency'] as const).map((field) => (
                        <td key={field} className="py-2 px-2 text-left" onClick={() => startEditClient(c.id, field, c[field])}>
                          {editingClientId === c.id && editingClientField === field ? (
                            field === 'meetingFrequency' ? (
                              <select autoFocus value={editingClientValue} onChange={(e) => { setEditingClientValue(e.target.value) }}
                                onBlur={saveClientEdit} className="bg-surface border border-accent rounded px-1 py-0.5 text-sm">
                                {MEETING_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                              </select>
                            ) : (
                              <input autoFocus value={editingClientValue} onChange={(e) => setEditingClientValue(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') saveClientEdit(); if (e.key === 'Escape') setEditingClientId(null) }}
                                onBlur={saveClientEdit}
                                className="bg-transparent border border-accent rounded px-1 py-0.5 text-sm w-full" />
                            )
                          ) : (
                            <span className="cursor-pointer hover:text-accent transition">{c[field]}</span>
                          )}
                        </td>
                      ))}
                      <td className="py-2">
                        <button onClick={() => { deleteClient(c.id); toast.success('Client deleted') }}
                          className="opacity-0 group-hover:opacity-100 text-rose hover:text-rose/80 transition text-xs">Del</button>
                      </td>
                    </tr>
                  )
                })}
                {/* Totals Row */}
                {agencyTotals && (
                  <tr className="font-medium border-t border-border">
                    <td className="py-2 pr-3">Totals</td>
                    <td className="py-2 px-2 text-right data">${agencyTotals.gross.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right data">${agencyTotals.adSpend.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right data text-text-dim">${Math.round(agencyTotals.gross * 0.03).toLocaleString()}</td>
                    <td className="py-2 px-2 text-right data">${agencyTotals.net.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right data text-text-dim">—</td>
                    <td colSpan={3}></td>
                  </tr>
                )}
                {/* Add Client Row */}
                <tr className="border-t border-border/50">
                  <td className="py-2 pr-3">
                    <input value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} placeholder="Client name" className="bg-transparent border border-border rounded px-2 py-1 text-sm w-full" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="number" value={newClient.grossMonthly} onChange={(e) => setNewClient({ ...newClient, grossMonthly: e.target.value })} placeholder="Gross" className="bg-transparent border border-border rounded px-2 py-1 text-sm w-full text-right" />
                  </td>
                  <td className="py-2 px-2">
                    <input type="number" value={newClient.adSpend} onChange={(e) => setNewClient({ ...newClient, adSpend: e.target.value })} placeholder="Ad $" className="bg-transparent border border-border rounded px-2 py-1 text-sm w-full text-right" />
                  </td>
                  <td colSpan={2}></td>
                  <td className="py-2 px-2">
                    <input value={newClient.serviceType} onChange={(e) => setNewClient({ ...newClient, serviceType: e.target.value })} placeholder="Service" className="bg-transparent border border-border rounded px-2 py-1 text-sm w-full" />
                  </td>
                  <td className="py-2 px-2">
                    <select value={newClient.meetingFrequency} onChange={(e) => setNewClient({ ...newClient, meetingFrequency: e.target.value })} className="bg-surface border border-border rounded px-1 py-1 text-sm">
                      {MEETING_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </td>
                  <td className="py-2">
                    <button onClick={handleAddClient} className="text-accent text-xs hover:underline">Add</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </motion.div>
        )}

        {/* ── Plumbing: GMB Profiles Grid ── */}
        {biz.type === 'service' && (
          <motion.div variants={fadeUp} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="section-label text-xs text-text-dim uppercase tracking-wide">GMB Profiles</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bizGmb.map((g) => (
                <motion.div key={g.id} className="card group relative rounded-[16px] p-5" style={{ borderTop: `3px solid ${GMB_TOP_BORDER[g.status] ?? 'var(--border)'}` }}>
                  <button onClick={() => { deleteGmbProfile(g.id); toast.success('Profile deleted') }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-rose text-xs transition">Del</button>
                  <p className="font-semibold mb-2">{g.city}</p>
                  {(['reviewCount', 'callsPerMonth', 'ranking'] as const).map((field) => (
                    <div key={field} className="flex justify-between text-sm mb-1">
                      <span className="text-text-dim">{field === 'reviewCount' ? 'Reviews' : field === 'callsPerMonth' ? 'Calls/mo' : 'Rank'}</span>
                      {editingGmbId === g.id && editingGmbField === field ? (
                        <input autoFocus value={editingGmbValue} onChange={(e) => setEditingGmbValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveGmbEdit(); if (e.key === 'Escape') setEditingGmbId(null) }}
                          onBlur={saveGmbEdit}
                          className="bg-transparent border border-accent rounded px-1 py-0.5 text-sm w-20 text-right" />
                      ) : (
                        <span className="data cursor-pointer hover:text-accent transition" onClick={() => startEditGmb(g.id, field, g[field])}>{g[field]}</span>
                      )}
                    </div>
                  ))}
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-text-dim">Status</span>
                    <select value={g.status} onChange={(e) => { updateGmbProfile(g.id, { status: e.target.value as GmbProfile['status'] }); toast.success('Status updated') }}
                      className="bg-transparent text-sm text-right cursor-pointer">
                      <option value="strong">Strong</option>
                      <option value="medium">Medium</option>
                      <option value="new">New</option>
                    </select>
                  </div>
                </motion.div>
              ))}

              {/* Add Profile Card */}
              <div className="card rounded-[16px] p-5 border-2 border-dashed border-border">
                <p className="text-xs text-text-dim mb-3 font-medium">Add Profile</p>
                <input value={newGmb.city} onChange={(e) => setNewGmb({ ...newGmb, city: e.target.value })} placeholder="City" className="bg-transparent border border-border rounded px-2 py-1 text-sm w-full mb-2" />
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input type="number" value={newGmb.reviewCount} onChange={(e) => setNewGmb({ ...newGmb, reviewCount: e.target.value })} placeholder="Reviews" className="bg-transparent border border-border rounded px-2 py-1 text-sm" />
                  <input type="number" value={newGmb.callsPerMonth} onChange={(e) => setNewGmb({ ...newGmb, callsPerMonth: e.target.value })} placeholder="Calls/mo" className="bg-transparent border border-border rounded px-2 py-1 text-sm" />
                </div>
                <input value={newGmb.ranking} onChange={(e) => setNewGmb({ ...newGmb, ranking: e.target.value })} placeholder="Rank" className="bg-transparent border border-border rounded px-2 py-1 text-sm w-full mb-2" />
                <select value={newGmb.status} onChange={(e) => setNewGmb({ ...newGmb, status: e.target.value as GmbProfile['status'] })} className="bg-surface border border-border rounded px-2 py-1 text-sm w-full mb-2">
                  <option value="strong">Strong</option>
                  <option value="medium">Medium</option>
                  <option value="new">New</option>
                </select>
                <button onClick={handleAddGmb} className="w-full px-3 py-1.5 rounded-lg bg-accent text-white text-sm hover:bg-accent/90 transition">Add Profile</button>
              </div>
            </div>

            {/* GMB Bar Chart */}
            {bizGmb.length > 0 && (
              <div className="card rounded-[16px] p-5">
                <p className="section-label text-xs text-text-dim uppercase tracking-wide mb-3">Calls by Profile</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={bizGmb.map((g) => ({ city: g.city, calls: g.callsPerMonth }))}>
                    <XAxis dataKey="city" tick={{ fontSize: 10 }} stroke="var(--text-dim)" />
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="calls" fill={biz.color} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Tasks ── */}
        <motion.div variants={fadeUp} className="card rounded-[16px] p-5">
          <div className="flex items-center gap-3 mb-4">
            <p className="section-label text-xs text-text-dim uppercase tracking-wide">Tasks</p>
            <span className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-full">{incompleteTasks}</span>
          </div>
          <div className="space-y-1">
            {bizTasks.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-1.5 group" style={{ borderLeft: `3px solid ${PRIORITY_BORDER[t.priority] ?? 'var(--border)'}`, paddingLeft: 12 }}>
                <input type="checkbox" checked={t.done} onChange={() => { toggleTask(t.id); toast.success(t.done ? 'Task reopened' : 'Task completed') }}
                  className="accent-accent" />
                <span className={`flex-1 text-sm ${t.done ? 'line-through text-text-dim' : ''}`}>{t.text}</span>
                {t.tag && <span className="text-[10px] bg-surface px-2 py-0.5 rounded-full text-text-dim">{t.tag}</span>}
                <button onClick={() => { deleteTask(t.id); toast.success('Task deleted') }}
                  className="opacity-0 group-hover:opacity-100 text-rose text-xs transition">Del</button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask() }}
              placeholder="+ Add task (!high #TAG text)" className="flex-1 bg-transparent border border-border rounded-lg px-3 py-1.5 text-sm" />
            <button onClick={handleAddTask} className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm hover:bg-accent/90 transition">Add</button>
          </div>
        </motion.div>

        {/* ── Revenue Drivers ── */}
        <motion.div variants={fadeUp} className="card rounded-[16px] p-5">
          <p className="section-label text-xs text-text-dim uppercase tracking-wide mb-4">Revenue Drivers</p>
          <div className="space-y-2">
            {bizDrivers.map((d) => (
              <div key={d.id} className={`flex items-center gap-3 py-2 group ${d.status === 'STALE' ? 'bg-rose/5 rounded-lg px-2 -mx-2' : ''}`}>
                <span className="text-sm flex-1">{d.name}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => { addDriver({ ...d }); /* impact update via workaround */ deleteDriver(d.id); addDriver({ businessId: d.businessId, category: d.category, name: d.name, impact: n, status: d.status, notes: d.notes }); toast.success('Impact updated') }}
                      className={`w-2 h-2 rounded-full transition ${n <= d.impact ? 'bg-accent' : 'bg-border'}`}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </div>
                <select value={d.status} onChange={(e) => { updateDriverStatus(d.id, e.target.value as any); toast.success('Status updated') }}
                  className={`text-[11px] rounded-full px-2 py-0.5 border-0 cursor-pointer ${DRIVER_STATUS_COLORS[d.status] ?? ''}`}>
                  {DRIVER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => { deleteDriver(d.id); toast.success('Driver deleted') }}
                  className="opacity-0 group-hover:opacity-100 text-rose text-xs transition">Del</button>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input value={newDriverName} onChange={(e) => setNewDriverName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddDriver() }}
              placeholder="Add driver..." className="flex-1 bg-transparent border border-border rounded-lg px-3 py-1.5 text-sm" />
            <button onClick={handleAddDriver} className="px-3 py-1.5 rounded-lg bg-accent text-white text-sm hover:bg-accent/90 transition">Add</button>
          </div>
        </motion.div>

        {/* ── Notes ── */}
        <motion.div variants={fadeUp} className="card rounded-[16px] p-5">
          <p className="section-label text-xs text-text-dim uppercase tracking-wide mb-3">Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => updateBusiness(biz.id, { notes })}
            rows={5}
            placeholder="Strategy notes for this business"
            className="w-full bg-transparent border border-border rounded-lg px-3 py-2 text-sm resize-y"
          />
        </motion.div>

      </motion.div>
    </PageTransition>
  )
}
