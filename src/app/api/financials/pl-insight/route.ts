import { NextRequest, NextResponse } from 'next/server'

const MODEL = 'claude-sonnet-4-20250514'

export async function POST(req: NextRequest) {
  try {
    const { apiKey, context } = (await req.json()) as { apiKey?: string; context?: string }
    const key = process.env.ANTHROPIC_API_KEY || apiKey
    if (!key) {
      return NextResponse.json({ error: 'No API key' }, { status: 400 })
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 180,
        temperature: 0.4,
        messages: [
          {
            role: 'user',
            content: `In exactly one clear sentence, describe the most important month-over-month change in this P&L comparison. No bullet points or preamble.\n\n${context ?? ''}`,
          },
        ],
      }),
    })
    if (!res.ok) {
      const t = await res.text()
      return NextResponse.json({ error: t || 'Anthropic error' }, { status: res.status })
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] }
    const text = data.content?.find((c) => c.type === 'text')?.text?.trim() ?? ''
    return NextResponse.json({ sentence: text })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
