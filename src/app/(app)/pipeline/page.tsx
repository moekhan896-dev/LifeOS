'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { motion } from 'framer-motion'
import PageTransition from '@/components/PageTransition'
import { useStore, type PipelineDeal } from '@/stores/store'

const STAGES: { id: PipelineDeal['stage']; label: string }[] = [
  { id: 'lead', label: 'Lead' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'call_booked', label: 'Call' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'signed', label: 'Signed' },
  { id: 'onboarding', label: 'Onboarding' },
]

function DealPreview({ deal, className = '' }: { deal: PipelineDeal; className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-surface2)] p-3 ${className}`}>
      <p className="text-[15px] font-semibold text-[var(--color-text)]">{deal.companyName}</p>
      {deal.contactName && (
        <p className="mt-1 text-[13px] text-[var(--color-text-mid)]">{deal.contactName}</p>
      )}
      {deal.dealValue != null && deal.dealValue > 0 && (
        <p className="mt-2 font-mono text-[13px] text-[var(--accent)]">${deal.dealValue.toLocaleString()}</p>
      )}
    </div>
  )
}

function DraggableDealCard({ deal }: { deal: PipelineDeal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="cursor-grab touch-none active:cursor-grabbing"
      animate={{ opacity: isDragging ? 0.35 : 1 }}
    >
      <DealPreview deal={deal} />
    </motion.div>
  )
}

function StageColumn({
  stage,
  deals,
}: {
  stage: (typeof STAGES)[number]
  deals: PipelineDeal[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[280px] w-[min(100%,200px)] shrink-0 flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 ${
        isOver ? 'ring-2 ring-[var(--accent)]/40' : ''
      }`}
    >
      <div className="px-1 pb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">
          {stage.label}
        </span>
        <span className="ml-2 font-mono text-[11px] text-[var(--color-text-mid)]">{deals.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {deals.map((d) => (
          <DraggableDealCard key={d.id} deal={d} />
        ))}
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const { pipeline, addDeal, updateDealStage } = useStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('')
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const byStage = useMemo(() => {
    const m = new Map<PipelineDeal['stage'], PipelineDeal[]>()
    for (const s of STAGES) m.set(s.id, [])
    for (const d of pipeline) {
      const list = m.get(d.stage) ?? []
      list.push(d)
      m.set(d.stage, list)
    }
    return m
  }, [pipeline])

  const activeDeal = activeId ? pipeline.find((d) => d.id === activeId) : null

  const onDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id))
  }

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null)
    const overId = e.over?.id
    if (!overId || e.active.id === overId) return
    const stage = STAGES.find((s) => s.id === overId)
    if (stage) updateDealStage(String(e.active.id), stage.id)
  }

  return (
    <PageTransition>
      <div className="space-y-6 pb-24">
        <div>
          <h1 className="text-[22px] font-bold tracking-[-0.2px] text-[var(--color-text)]">Pipeline</h1>
          <p className="mt-1 text-[15px] text-[var(--color-text-mid)]">Kanban — drag deals between stages.</p>
        </div>

        <form
          className="flex flex-wrap items-end gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface2)] p-4"
          onSubmit={(ev) => {
            ev.preventDefault()
            const name = companyName.trim()
            if (!name) return
            addDeal({ companyName: name, stage: 'lead' })
            setCompanyName('')
          }}
        >
          <div className="min-w-[200px] flex-1">
            <label className="label mb-1 block text-[11px] uppercase text-[var(--color-text-dim)]">New deal</label>
            <input
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-[17px]"
              placeholder="Company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] rounded-xl bg-[var(--accent)] px-4 text-[15px] font-semibold text-white"
          >
            Add
          </button>
        </form>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className="flex gap-3 overflow-x-auto pb-2">
            {STAGES.map((stage) => (
              <StageColumn key={stage.id} stage={stage} deals={byStage.get(stage.id) ?? []} />
            ))}
          </div>
          <DragOverlay>{activeDeal ? <DealPreview deal={activeDeal} className="shadow-lg ring-2 ring-[var(--accent)]/30" /> : null}</DragOverlay>
        </DndContext>
      </div>
    </PageTransition>
  )
}
