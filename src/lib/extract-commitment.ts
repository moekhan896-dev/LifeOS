/**
 * Detect commitment language in AI Partner user messages (PRD Batch 2).
 * Returns trimmed commitment text lines (no duplicates).
 */
export function extractCommitmentsFromUserMessage(text: string): string[] {
  const raw = text.trim()
  if (!raw) return []

  const patterns: RegExp[] = [
    /\bI(?:'|\s)?ll\s+(?:do|complete|finish|send|make|handle|take care of)\s+(.+?)(?:[.!?\n]|$)/gi,
    /\bI\s+commit\s+to\s+(.+?)(?:[.!?\n]|$)/gi,
    /\bI\s+(?:promise|pledge)\s+to\s+(.+?)(?:[.!?\n]|$)/gi,
    /\bI(?:'|\s)?m\s+committing\s+to\s+(.+?)(?:[.!?\n]|$)/gi,
    /\bcommit(?:ted)?\s*:\s*(.+?)(?:[.!?\n]|$)/gi,
  ]

  const seen = new Set<string>()
  const out: string[] = []

  for (const re of patterns) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(raw)) !== null) {
      const line = m[1]?.replace(/\s+/g, ' ').trim()
      if (line && line.length > 2 && !seen.has(line.toLowerCase())) {
        seen.add(line.toLowerCase())
        out.push(line.slice(0, 500))
      }
    }
  }

  return out
}
