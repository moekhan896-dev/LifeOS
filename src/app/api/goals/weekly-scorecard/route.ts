import { NextRequest, NextResponse } from 'next/server'

const SYSTEM = `You grade weekly goal execution for ART OS. Output ONLY valid JSON (no markdown):
{"grades":[{"goalId":"string","grade":"A"|"B"|"C"|"D"|"F","feedback":"2-4 sentences, specific"}]}

Rules:
- Base grades on task completion data and progress vs target when provided.
- Be direct; cite patterns (e.g. stalled tasks, strong follow-through).
- One entry per goal id provided. Match goalId exactly.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { goalsPayload, tasksPayload, apiKey: clientKey } = body as {
      goalsPayload?: unknown
      tasksPayload?: unknown
      apiKey?: string
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || clientKey
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key required' }, { status: 400 })
    }

    const userContent = `Goals:\n${JSON.stringify(goalsPayload ?? [], null, 0).slice(0, 8000)}\n\nTasks (recent / linked):\n${JSON.stringify(tasksPayload ?? [], null, 0).slice(0, 8000)}`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        temperature: 0.4,
        system: SYSTEM,
        messages: [{ role: 'user', content: userContent }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ error: errText || 'Anthropic error' }, { status: res.status })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse grade JSON' }, { status: 422 })
    }
    const parsed = JSON.parse(jsonMatch[0]) as { grades?: { goalId: string; grade: string; feedback: string }[] }
    const grades = Array.isArray(parsed.grades) ? parsed.grades : []

    const letterToRate = (g: string) => {
      const x = g.toUpperCase()
      if (x === 'A') return 100
      if (x === 'B') return 85
      if (x === 'C') return 70
      if (x === 'D') return 55
      if (x === 'F') return 35
      return 60
    }

    const normalized = grades.map((g) => ({
      goalId: String(g.goalId ?? ''),
      grade: String(g.grade ?? 'C').toUpperCase().slice(0, 1),
      feedback: String(g.feedback ?? '').slice(0, 1200),
    }))

    const rate =
      normalized.length > 0
        ? Math.round(normalized.reduce((s, g) => s + letterToRate(g.grade), 0) / normalized.length)
        : 0

    return NextResponse.json({ grades: normalized, rate })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
