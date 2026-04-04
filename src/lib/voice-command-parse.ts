import type { Task } from '@/stores/store'

export type VoiceParsed =
  | { kind: 'add_task'; text: string }
  | { kind: 'complete_task'; query: string }
  | { kind: 'focus_prompt' }
  | { kind: 'log_habit'; raw: string }
  | { kind: 'log_prayer'; prayer: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' }
  | { kind: 'should_i'; query: string }
  | { kind: 'can_afford'; query: string }
  | { kind: 'search'; query: string }
  | { kind: 'brain_dump'; text: string }
  | { kind: 'schedule'; title: string; timeRaw: string }
  | { kind: 'note'; text: string }
  | { kind: 'navigate'; pageQuery: string }
  | { kind: 'financial_summary' }
  | { kind: 'execution_score' }
  | { kind: 'unrecognized'; text: string }

const PRAYER_NAMES = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const

function norm(s: string) {
  return s.toLowerCase().trim()
}

/** Fuzzy score: substring + token overlap */
export function scoreTaskMatch(query: string, task: Task): number {
  const q = norm(query).replace(/^the\s+/, '')
  const t = norm(task.text)
  if (!q || !t) return 0
  if (t.includes(q) || q.includes(t)) return 100
  const qTokens = q.split(/\s+/).filter(Boolean)
  const hits = qTokens.filter((w) => w.length > 2 && t.includes(w)).length
  return hits * 20 + (t.split(/\s+/).some((w) => q.includes(w) && w.length > 3) ? 15 : 0)
}

export function findMatchingTasks(query: string, tasks: Task[], limit = 3): Task[] {
  const open = tasks.filter((t) => !t.done)
  const scored = open
    .map((t) => ({ t, s: scoreTaskMatch(query, t) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
  return scored.slice(0, limit).map((x) => x.t)
}

export function parsePrayerName(fragment: string): (typeof PRAYER_NAMES)[number] | null {
  const x = norm(fragment)
  for (const p of PRAYER_NAMES) {
    if (x.includes(p)) return p
  }
  return null
}

/**
 * PRD §20.3 — first match wins (ordered checks).
 */
export function parseVoiceCommand(raw: string): VoiceParsed {
  const t = raw.trim()
  const lower = norm(t)

  if (/^what should i focus on\??$/i.test(t) || /^what'?s my top priority\??$/i.test(t)) {
    return { kind: 'focus_prompt' }
  }
  if (lower.includes('how much did i make') || (lower.includes('revenue') && lower.includes('what'))) {
    return { kind: 'financial_summary' }
  }
  if (/^show me my score\??$/i.test(t) || /^what'?s my score\??$/i.test(t)) {
    return { kind: 'execution_score' }
  }

  const mSearch = t.match(/^(?:search for|find)\s+(.+)/i)
  if (mSearch) return { kind: 'search', query: mSearch[1].trim() }

  const mGo = t.match(/^(?:go to|open)\s+(.+)/i)
  if (mGo) return { kind: 'navigate', pageQuery: mGo[1].trim() }

  const mShould = t.match(/^should i\s+(.+)\??$/i)
  if (mShould) return { kind: 'should_i', query: mShould[1].trim() }

  const mAfford = t.match(/^can i afford\s+(.+)\??$/i)
  if (mAfford) return { kind: 'can_afford', query: mAfford[1].trim() }

  const mBrain = t.match(/^(?:brain dump|idea:|new idea)\s*(.*)$/i)
  if (mBrain && (lower.startsWith('brain dump') || lower.startsWith('idea:') || lower.startsWith('new idea'))) {
    const text = (mBrain[1] || '').trim()
    if (text) return { kind: 'brain_dump', text }
  }

  const mNote = t.match(/^(?:note:|remember)\s*(.+)$/i)
  if (mNote) return { kind: 'note', text: mNote[1].trim() }

  const mSched = t.match(/^schedule\s+(.+?)\s+at\s+(.+)$/i)
  if (mSched) return { kind: 'schedule', title: mSched[1].trim(), timeRaw: mSched[2].trim() }

  const mAdd = t.match(/^(?:add|new|create)\s+task:?\s*(.+)$/i)
  if (mAdd?.[1]?.trim()) return { kind: 'add_task', text: mAdd[1].trim() }

  const mDone =
    t.match(/^(?:complete|done with|finish)\s+(?:the\s+)?(.+)$/i) ||
    t.match(/^mark\s+(?:the\s+)?(.+?)\s+(?:as\s+)?(?:done|complete)$/i)
  if (mDone && mDone[1]?.trim()) {
    return { kind: 'complete_task', query: mDone[1].trim() }
  }

  const mPrayPhrase = t.match(
    /(?:log\s+)?(fajr|dhuhr|asr|maghrib|isha)\s+prayer|i\s+prayed\s+(fajr|dhuhr|asr|maghrib|isha)/i
  )
  if (mPrayPhrase) {
    const p = (mPrayPhrase[1] || mPrayPhrase[2]).toLowerCase() as (typeof PRAYER_NAMES)[number]
    if (PRAYER_NAMES.includes(p)) return { kind: 'log_prayer', prayer: p }
  }

  if (/^i went to the gym/i.test(t) || /^log\s+gym/i.test(lower)) {
    return { kind: 'log_habit', raw: 'gym' }
  }

  const mLog = t.match(/^(?:log|i did)\s+(.+)/i)
  if (mLog) {
    const frag = mLog[1].trim()
    const pr = parsePrayerName(frag.replace(/\s+prayer$/i, ''))
    if (pr) return { kind: 'log_prayer', prayer: pr }
    return { kind: 'log_habit', raw: frag }
  }

  if (lower.includes('i prayed')) {
    const pr = parsePrayerName(t)
    if (pr) return { kind: 'log_prayer', prayer: pr }
  }

  return { kind: 'unrecognized', text: t }
}

/** Parse "9am", "9:30 pm", "14:00" to HH:mm 24h */
export function parseTimeToHHMM(timeRaw: string): string | null {
  const s = timeRaw.trim().toLowerCase()
  const ampm = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)$/)
  if (ampm) {
    let h = parseInt(ampm[1], 10)
    const m = parseInt(ampm[2] || '0', 10)
    const ap = ampm[3].replace(/\./g, '')
    if (ap.startsWith('p') && h < 12) h += 12
    if (ap.startsWith('a') && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  const hm = s.match(/^(\d{1,2}):(\d{2})$/)
  if (hm) {
    return `${String(Math.min(23, parseInt(hm[1], 10))).padStart(2, '0')}:${hm[2]}`
  }
  const honly = s.match(/^(\d{1,2})\s*$/)
  if (honly) {
    const h = Math.min(23, parseInt(honly[1], 10))
    return `${String(h).padStart(2, '0')}:00`
  }
  return null
}
