import type { ProactiveMessage } from '@/stores/store'

/** Scheduled check-ins use `revealAt` — hide until that time. */
export function isProactiveMessageVisible(m: ProactiveMessage): boolean {
  if (!m.revealAt) return true
  return new Date(m.revealAt).getTime() <= Date.now()
}
