import { NextRequest, NextResponse } from 'next/server'

const SYSTEM = `You suggest concrete tasks for ART OS. Output ONLY valid JSON array (no markdown), 3 to 5 objects:
[{"text":"string","priority":"crit"|"high"|"med"|"low","tag":"short label or empty string","rationale":"one line"}]

Rules:
- Tasks must be actionable in one sitting where possible.
- Align with the user's stated goals, projects, and bottlenecks from context.
- No placeholder names; use generic wording if a name is unknown.
- Prioritize revenue and unblockers.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { context, apiKey: clientKey } = body as { context?: string; apiKey?: string }

    const apiKey = process.env.ANTHROPIC_API_KEY || clientKey
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key required' }, { status: 400 })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        temperature: 0.5,
        system: SYSTEM,
        messages: [
          {
            role: 'user',
            content:
              (context && context.length > 0 ? `Context:\n${context.slice(0, 12000)}\n\n` : '') +
              'Propose 3-5 recommended tasks as JSON array only.',
          },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ error: errText || 'Anthropic error' }, { status: res.status })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse tasks JSON' }, { status: 422 })
    }
    const arr = JSON.parse(jsonMatch[0]) as unknown
    if (!Array.isArray(arr)) {
      return NextResponse.json({ error: 'Invalid tasks shape' }, { status: 422 })
    }

    const tasks = arr
      .slice(0, 8)
      .map((row: any) => ({
        text: String(row.text ?? '').slice(0, 500),
        priority: ['crit', 'high', 'med', 'low'].includes(row.priority) ? row.priority : 'med',
        tag: String(row.tag ?? '').slice(0, 32),
        rationale: String(row.rationale ?? '').slice(0, 400),
      }))
      .filter((t) => t.text.length > 0)

    return NextResponse.json({ tasks })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
