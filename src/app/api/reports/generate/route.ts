import { NextRequest, NextResponse } from 'next/server'

export type ReportGenType = 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom' | 'daily'

/** PRD §22 — template + data; AI fills narrative when key present */
export function buildReportPrompt(
  type: ReportGenType,
  dataJson: string,
  customTopic?: string
): { system: string; user: string } {
  const data = dataJson || '{}'

  const shells: Record<ReportGenType, string> = {
    daily: `Daily Debrief (template)
- Performance summary
- Wins / misses
- Letter grade (A–F)
DATA:\n${data}`,

    weekly: `Weekly Report (PRD §22)
Sections:
1. Score overview (avg, high, low, trend)
2. Task stats
3. Revenue summary
4. Top achievement
5. Biggest struggle
6. Three recommendations
DATA:\n${data}`,

    monthly: `Monthly Report (PRD §22)
Sections:
1. Aggregated weekly highlights
2. Revenue trend narrative
3. Expense analysis
4. Goal progress
5. Habit consistency rates
6. AI narrative
7. Energy analysis
8. Commitment rate
DATA:\n${data}`,

    quarterly: `Quarterly Strategy Report (PRD §22)
Sections:
1. 12-week scorecard summary
2. Financial trajectory (start vs end)
3. Decision accuracy (if data present)
4. Identity evolution notes
5. Next-cycle planning
DATA:\n${data}`,

    annual: `Annual Review (PRD §22)
Sections:
1. Year narrative
2. Numbers summary (revenue, net worth, tasks, points, best month/day, longest streak, decision accuracy)
3. Goals review
4. Next-year recommendations
DATA:\n${data}`,

    custom: `Custom report requested by user.
TOPIC: ${customTopic || '(unspecified)'}
Use DATA below. Structure the answer with clear headings.
DATA:\n${data}`,
  }

  const user = shells[type] ?? shells.custom

  const system = `You are generating an ART OS analytics report. Use ONLY facts present in DATA; do not invent revenue, names, or tasks. If DATA is sparse, say what's missing. Keep structured headings. End with a letter grade line when applicable: "Grade: X".`

  return { system, user }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const reportType = body.reportType as ReportGenType
    const customTopic = typeof body.customTopic === 'string' ? body.customTopic : undefined
    const context = typeof body.context === 'string' ? body.context : JSON.stringify(body.context ?? {})
    const apiKey = (body.apiKey as string | undefined) || process.env.ANTHROPIC_API_KEY

    if (!reportType || !['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'custom'].includes(reportType)) {
      return NextResponse.json({ error: 'Invalid reportType' }, { status: 400 })
    }

    const { system, user } = buildReportPrompt(reportType, context, customTopic)

    if (!apiKey?.trim()) {
      return NextResponse.json({
        content: `${user}\n\n---\n(No API key — raw template + data above. Add ANTHROPIC_API_KEY or Settings key for AI narrative.)`,
        grade: undefined,
        rawTemplate: true,
      })
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
        max_tokens: 4096,
        temperature: 0.5,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ error: errText || 'Anthropic error' }, { status: res.status })
    }

    const data = await res.json()
    const text = data.content?.[0]?.text ?? ''
    const gradeMatch = text.match(/Grade:\s*([A-F][+-]?)/i)
    return NextResponse.json({
      content: text,
      grade: gradeMatch?.[1],
      rawTemplate: false,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
