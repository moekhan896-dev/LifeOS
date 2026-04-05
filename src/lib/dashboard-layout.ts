/**
 * PRD §9.18 — dashboard tile registry & persisted layout (12-col grid).
 */

export const DASHBOARD_SPANS = [3, 4, 6, 8, 12] as const
export type DashboardGridSpan = (typeof DASHBOARD_SPANS)[number]

export interface DashboardTileConfig {
  tileId: string
  /** Column span on md+ (mobile is always full width). */
  gridColumn: DashboardGridSpan
  order: number
  visible: boolean
}

export interface DashboardLayoutState {
  tiles: DashboardTileConfig[]
  lastModified: string
}

export const DASHBOARD_TILE_CATALOG: { id: string; label: string; defaultSpan: DashboardGridSpan }[] = [
  { id: 'morning_brief', label: 'Morning briefing', defaultSpan: 12 },
  { id: 'one_thing', label: 'The one thing', defaultSpan: 12 },
  { id: 'net_income', label: 'Net income', defaultSpan: 3 },
  { id: 'execution', label: 'Execution score', defaultSpan: 3 },
  { id: 'energy', label: 'Energy', defaultSpan: 3 },
  { id: 'prayers', label: 'Prayers', defaultSpan: 3 },
  { id: 'habits', label: 'Habits', defaultSpan: 6 },
  { id: 'life_horizon', label: 'Life horizon', defaultSpan: 12 },
  { id: 'schedule', label: "Today's schedule", defaultSpan: 12 },
  { id: 'active_projects', label: 'Active projects', defaultSpan: 6 },
  { id: 'ai_insights', label: 'AI Insights', defaultSpan: 6 },
  { id: 'cost_inaction', label: 'Cost of inaction', defaultSpan: 6 },
  { id: 'days_tasks', label: 'Days to target & tasks', defaultSpan: 6 },
  { id: 'clients', label: 'Clients', defaultSpan: 6 },
  { id: 'gmb', label: 'GMB profiles', defaultSpan: 6 },
]

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayoutState = {
  lastModified: new Date(0).toISOString(),
  tiles: DASHBOARD_TILE_CATALOG.map((t, i) => ({
    tileId: t.id,
    gridColumn: t.defaultSpan,
    order: i,
    visible: true,
  })),
}

export function spanToClass(span: DashboardGridSpan): string {
  const map: Record<DashboardGridSpan, string> = {
    3: 'col-span-12 md:col-span-3',
    4: 'col-span-12 md:col-span-4',
    6: 'col-span-12 md:col-span-6',
    8: 'col-span-12 md:col-span-8',
    12: 'col-span-12',
  }
  return map[span] ?? 'col-span-12'
}

export function cycleSpan(current: DashboardGridSpan): DashboardGridSpan {
  const i = DASHBOARD_SPANS.indexOf(current)
  const next = i < 0 ? 0 : (i + 1) % DASHBOARD_SPANS.length
  return DASHBOARD_SPANS[next]
}

export function normalizeDashboardLayout(raw: unknown): DashboardLayoutState {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_DASHBOARD_LAYOUT, lastModified: new Date().toISOString() }
  const r = raw as Partial<DashboardLayoutState>
  const validIds = new Set(DASHBOARD_TILE_CATALOG.map((t) => t.id))
  let tiles = Array.isArray(r.tiles)
    ? r.tiles.filter((t) => t && validIds.has(String((t as DashboardTileConfig).tileId)))
    : []
  if (tiles.length === 0) tiles = DEFAULT_DASHBOARD_LAYOUT.tiles.map((x) => ({ ...x }))
  const seen = new Set<string>()
  tiles = tiles
    .map((t) => ({
      tileId: t.tileId,
      gridColumn: ((): DashboardGridSpan => {
        const g = t.gridColumn as number
        if (g === 5 || g === 7) return 6
        return (DASHBOARD_SPANS as readonly number[]).includes(g) ? (g as DashboardGridSpan) : 12
      })(),
      order: typeof t.order === 'number' ? t.order : 0,
      visible: t.visible !== false,
    }))
    .filter((t) => {
      if (seen.has(t.tileId)) return false
      seen.add(t.tileId)
      return true
    })
  for (const cat of DASHBOARD_TILE_CATALOG) {
    if (!seen.has(cat.id)) {
      tiles.push({
        tileId: cat.id,
        gridColumn: cat.defaultSpan,
        order: tiles.length,
        visible: true,
      })
    }
  }
  tiles.sort((a, b) => a.order - b.order)
  return {
    tiles,
    lastModified: typeof r.lastModified === 'string' ? r.lastModified : new Date().toISOString(),
  }
}
