import { NextRequest, NextResponse } from 'next/server'

const SYSTEM = `You are the Decision Lab clarifying-question generator for ART OS (PRD §7.2).
Given the user's decision statement and optional life/business context, output ONLY valid JSON (no markdown fences, no prose) with this exact shape:
{"questions":[{"id":"q1","text":"string","placeholder":"optional short hint"}]}
Generate between 3 and 6 questions. Adapt to the decision type:
- Financial (lease, hire, purchase): term, cash flow, which business, replacement expense, exit clause.
- Strategic (pivot, partnership): time, revenue, risk, bandwidth, goal alignment.
- Personal: timeline, cost, work impact, reversibility.
Questions must be specific and answerable in 1–3 sentences each. Use neutral wording — no fake names or dollar amounts in questions.`

function parseQuestionsJson(text: string): { questions: { id: string; text: string; placeholder?: string }[] } {
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Invalid response shape')
  const parsed = JSON.parse(jsonMatch[0]) as { questions?: unknown }
  if (!Array.isArray(parsed.questions)) throw new Error('Missing questions array')
  const questions = parsed.questions.map((q, i) => {
    const o = q as { id?: string; text?: string; placeholder?: string }
    return {
      id: typeof o.id === 'string' ? o.id : `q${i + 1}`,
      text: typeof o.text === 'string' ? o.text : '',
      placeholder: typeof o.placeholder === 'string' ? o.placeholder : undefined,
    }
  }).filter((q) => q.text.length > 0)
  if (questions.length < 3) throw new Error('Too few questions')
  return { questions: questions.slice(0, 8) }
}

export async function POST(req: NextRequest) {
  try {
    const { decision, context, apiKey: clientKey } = await req.json()
    const apiKey = process.env.ANTHROPIC_API_KEY || clientKey
    if (!apiKey) {
      return NextResponse.json({ error: 'Add ANTHROPIC_API_KEY or your key in Settings.' }, { status: 400 })
    }
    if (!decision || typeof decision !== 'string' || !decision.trim()) {
      return NextResponse.json({ error: 'Decision text required.' }, { status: 400 })
    }

    const userContent = [
      `Decision to analyze:\n${decision.trim()}`,
      context ? `\nUser context (for tailoring only):\n${context.slice(0, 14000)}` : '',
    ].join('')

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
        temperature: 0.6,
        system: SYSTEM,
        messages: [{ role: 'user', content: userContent }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err || 'API error' }, { status: res.status })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''
    const { questions } = parseQuestionsJson(text)
    return NextResponse.json({ questions })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
