import type { Business, Client } from '@/stores/store'

export interface EcosystemEdge {
  fromId: string
  toId: string
  label: string
}

/** PRD GAP 21 — edges from shared tools, same type, shared client names (case-insensitive). */
export function buildEcosystemEdges(businesses: Business[], clients: Client[]): EcosystemEdge[] {
  const pairLabels = new Map<string, { fromId: string; toId: string; parts: Set<string> }>()

  const addPair = (fromId: string, toId: string, label: string) => {
    const a = fromId < toId ? fromId : toId
    const b = fromId < toId ? toId : fromId
    const pk = `${a}|${b}`
    const cur = pairLabels.get(pk)
    if (cur) {
      cur.parts.add(label)
    } else {
      pairLabels.set(pk, { fromId: a, toId: b, parts: new Set([label]) })
    }
  }

  for (let i = 0; i < businesses.length; i++) {
    for (let j = i + 1; j < businesses.length; j++) {
      const A = businesses[i]
      const B = businesses[j]
      const parseTools = (t?: string) =>
        new Set(
          (t || '')
            .split(',')
            .map((x) => x.trim().toLowerCase())
            .filter(Boolean)
        )
      const tA = parseTools(A.tools)
      const tB = parseTools(B.tools)
      const sharedTools = [...tA].filter((x) => tB.has(x))
      if (sharedTools.length) {
        addPair(A.id, B.id, `Shared tool: ${sharedTools[0]}`)
      }
      if (A.type === B.type) {
        addPair(A.id, B.id, 'Same business type')
      }

      const namesA = clients
        .filter((c) => c.businessId === A.id)
        .map((c) => c.name.trim().toLowerCase())
      const namesB = new Set(clients.filter((c) => c.businessId === B.id).map((c) => c.name.trim().toLowerCase()))
      for (const n of namesA) {
        if (n && namesB.has(n)) {
          addPair(A.id, B.id, `Shared client: ${n}`)
        }
      }
    }
  }

  return [...pairLabels.values()].map(({ fromId, toId, parts }) => ({
    fromId,
    toId,
    label: [...parts].join(' · '),
  }))
}
