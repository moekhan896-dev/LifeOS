import { NextRequest, NextResponse } from 'next/server'

/** PRD GAP 13 — category + monthly-equivalent dollar estimate + reasoning (JSON only). */
const SYSTEM = `You categorize tasks for ART OS dollar-value tracking.

Categories (exact strings):
- direct_revenue — invoice, collect payment, close deal, sign contract, client-specific revenue
- revenue_generating — outreach, content, ads, marketing, pipeline, prospecting
- infrastructure — systems, SOPs, hire, automate, CRM, templates, setup
- health_correlation — gym, sleep, meal, exercise, meditation, wellness

Respond with ONLY valid JSON (no markdown):
{"category":"direct_revenue"|"revenue_generating"|"infrastructure"|"health_correlation","dollarValue":number,"reasoning":"one or two sentences, plain English"}

Rules:
- dollarValue is a positive monthly-equivalent USD impact (integer). Use conservative estimates when data is thin.
- Never invent client names or revenue numbers not in the context; you may infer reasonable ranges from business type.
- If the task is clearly non-revenue maintenance, still estimate opportunity cost using effective hourly rate when provided.`

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      taskText,
      businessSummary,
      clientsSummary,
      monthlyNetHint,
      apiKey: clientKey,
    } = body as {
      taskText?: string
      businessSummary?: string
      clientsSummary?: string
      monthlyNetHint?: number
      apiKey?: string
    }

    const apiKey = process.env.ANTHROPIC_API_KEY || clientKey
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API key required' }, { status: 400 })
    }

    const userPayload = [
      `Task: ${String(taskText ?? '').slice(0, 2000)}`,
      businessSummary ? `Business context:\n${businessSummary}` : '',
      clientsSummary ? `Clients (names only if listed):\n${clientsSummary}` : '',
      typeof monthlyNetHint === 'number' ? `Monthly net income hint (user aggregate): $${monthlyNetHint}` : '',
      'Effective hourly rate (if net is known, assume ~160 work hours/month for side math): derive conservatively.',
    ]
      .filter(Boolean)
      .join('\n\n')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        temperature: 0.3,
        system: SYSTEM,
        messages: [{ role: 'user', content: userPayload }],
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
      return NextResponse.json({ error: 'Could not parse AI response' }, { status: 422 })
    }
    let parsed: {
      category?: string
      dollarValue?: number
      reasoning?: string
    }
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return NextResponse.json({ error: 'Invalid JSON from model' }, { status: 422 })
    }

    const allowed = new Set(['direct_revenue', 'revenue_generating', 'infrastructure', 'health_correlation'])
    const category = allowed.has(String(parsed.category)) ? parsed.category : 'infrastructure'
    const dollarValue =
      typeof parsed.dollarValue === 'number' && Number.isFinite(parsed.dollarValue)
        ? Math.max(0, Math.round(parsed.dollarValue))
        : 0
    const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning.slice(0, 800) : ''

    return NextResponse.json({ category, dollarValue, reasoning })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
