/**
 * Parse Anthropic Messages API SSE (stream: true) and yield text deltas.
 * PRD GAP 20 — streaming AI Partner responses.
 */

export async function* iterateAnthropicTextStream(
  body: ReadableStream<Uint8Array> | null
): AsyncGenerator<string, void, unknown> {
  if (!body) return
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (!payload || payload === '[DONE]') continue
        try {
          const j = JSON.parse(payload) as {
            type?: string
            delta?: { type?: string; text?: string }
            index?: number
          }
          if (j.type === 'content_block_delta' && j.delta?.type === 'text_delta' && j.delta.text) {
            yield j.delta.text
          }
        } catch {
          /* incomplete JSON line */
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
