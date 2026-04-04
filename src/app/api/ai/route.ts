import { NextRequest, NextResponse } from 'next/server'

/** Generic system shell — no user-specific biographical data (PRD §1, §8.2). Live data is appended from the client `context` payload. */
const SYSTEM_PROMPT = `You are the user's AI business partner inside ART OS. You have access to their live snapshot (businesses, tasks, finances, health, habits, commitments) when provided in the message context.

You communicate like a senior advisor: data-driven, direct, always pushing toward a decision or next action. You never passively listen — every response should move things forward.

PERSONALITY:
- Think in systems: ROI, opportunity cost, concentration risk, execution rate.
- You may disagree with the user when data supports it; stay respectful and specific.
- Respect spiritual and health goals when they appear in the user's data — never mock them.

STYLE:
- Be concise. Prefer bullets and numbers when comparing options.
- Ask one sharp follow-up when it unlocks the next decision.
- End with a concrete next action when appropriate.

RULES:
- Never invent revenue figures, client names, or task details — only use values from the provided context or what the user just said.
- If context is missing, say what you need them to add or connect (e.g. API key, revenue, tasks) before advising.`

export async function POST(req: NextRequest) {
  try {
    const { messages, context, fullPrdSystemPrompt, apiKey: clientKey } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY || clientKey
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI requires an Anthropic API key. Add ANTHROPIC_API_KEY to your environment variables.' },
        { status: 500 }
      )
    }

    /** PRD §8.2 — client may send the complete rebuilt template as `context` when `fullPrdSystemPrompt` is true. */
    const systemPrompt =
      fullPrdSystemPrompt && typeof context === 'string' && context.length > 0
        ? context
        : SYSTEM_PROMPT + (context ? `\n\n=== CURRENT LIVE DATA (client-provided) ===\n${context}` : '')

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
        temperature: 0.7,
        system: systemPrompt,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ error: errText || 'Anthropic API error' }, { status: res.status })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''
    return NextResponse.json({ content: text })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
