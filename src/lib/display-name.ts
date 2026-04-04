/** Title-case display for person names (e.g. multi-word input → capitalized words). */
export function capitalizeDisplayName(raw: string): string {
  const s = raw.trim()
  if (!s) return ''
  return s
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}
