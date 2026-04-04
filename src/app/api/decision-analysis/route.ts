import { NextRequest, NextResponse } from 'next/server'

/** PRD §7.2 — Option A/B/C with explicit financial vs non-financial sections. */
const DECISION_SYSTEM = `You are the Decision Impact engine inside ART OS. The user stated a decision and answered clarifying questions.

Output markdown with EXACTLY this structure (use these headings):

## Decision
Restate the question clearly in one short paragraph.

## Option A — The proposed action
### Financial impact
Monthly and annual effects, net cash flow, payback or runway if applicable. Use only numbers from context or user answers — never invent dollar amounts or client names.

### Non-financial impact
Time commitment, bandwidth, reputation, stress, relationships, lock-in, reversibility.

### Risks and mitigations
2–4 bullet risks with a concrete mitigation each.

### Confidence
State Low / Medium / Medium-High / High and 2–3 sentences why.

## Option B — Status quo (do nothing)
### Cost of inaction
Opportunity left on table, trajectory, qualitative cost.

### Financial and non-financial
Brief notes on staying the course.

## Option C — Alternative
A smaller step, different timing, or negotiated variant — include financial and non-financial angles.

## Recommendation
Verdict: YES / NO / CONDITIONAL. One tight paragraph plus any conditions.

Rules: Use only facts from the user's answers and context snapshot. If data is missing, say what is unknown rather than guessing.`

export async function POST(req: NextRequest) {
  try {
    const { decision, answers, context, apiKey: clientKey, mentorLens } = await req.json()
    const apiKey = process.env.ANTHROPIC_API_KEY || clientKey
    if (!apiKey) {
      return NextResponse.json({ error: 'Add ANTHROPIC_API_KEY or your key in Settings.' }, { status: 400 })
    }

    const lensBlock =
      mentorLens && typeof mentorLens.name === 'string'
        ? `Mentor lens — respond as if advising in the spirit of "${mentorLens.name}". Perspective: ${mentorLens.description || ''}. ${Array.isArray(mentorLens.sourceUrls) && mentorLens.sourceUrls.length ? `Reference style only (no need to fetch URLs): ${mentorLens.sourceUrls.join(', ')}` : ''}`
        : ''

    const system = lensBlock ? `${DECISION_SYSTEM}\n\n${lensBlock}` : DECISION_SYSTEM

    const userBlock = [
      `Decision: ${decision || ''}`,
      answers ? `Clarifying answers:\n${JSON.stringify(answers, null, 2)}` : '',
      context ? `Context snapshot:\n${context}` : '',
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
        max_tokens: 4096,
        temperature: 0.7,
        system,
        messages: [{ role: 'user', content: userBlock }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err || 'API error' }, { status: res.status })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''
    return NextResponse.json({ content: text })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
