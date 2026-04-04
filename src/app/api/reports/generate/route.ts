import { NextRequest, NextResponse } from 'next/server'
import { buildReportPrompt, type ReportGenType } from '@/lib/reports-generate-prompt'

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
