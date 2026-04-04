import { NextRequest, NextResponse } from 'next/server'
import { parseDecisionAnalysisJson } from '@/lib/decision-analysis-types'

/** Force a single JSON object — client renders cards per section. */
const DECISION_SYSTEM_JSON = `You are the Decision Impact engine inside ART OS. The user stated a decision and answered clarifying questions.

Respond with ONLY a single JSON object (no markdown, no prose before or after). Use this exact shape and string fields (use "" if unknown):

{
  "decisionSummary": "Restate the decision in one short paragraph.",
  "optionA": {
    "financialImpact": "Monthly/annual effects, cash flow. Never invent dollar amounts or names — only from context.",
    "nonFinancialImpact": "Time, stress, relationships, reversibility.",
    "timeline": "When effects land; milestones.",
    "riskFactors": "Main risks and mitigations in one paragraph.",
    "confidence": "Low/Medium/High plus brief rationale."
  },
  "optionB": {
    "statusQuo": "What staying the course looks like.",
    "costOfInaction": "Opportunity cost, trajectory, qualitative cost."
  },
  "optionC": {
    "alternative": "Smaller step, different timing, or negotiated variant — include tradeoffs."
  },
  "aiRecommendation": {
    "verdict": "YES | NO | CONDITIONAL — one short phrase",
    "confidencePercent": 0,
    "reasoning": "Tight paragraph; cite only facts from answers/context."
  }
}

Rules: confidencePercent is 0-100. Use only facts from the user's answers and context. If data is missing, say so in the relevant strings rather than guessing.`

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

    const system = lensBlock ? `${DECISION_SYSTEM_JSON}\n\n${lensBlock}` : DECISION_SYSTEM_JSON

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
    const structured = parseDecisionAnalysisJson(text)
    if (structured) {
      return NextResponse.json({ structured })
    }
    return NextResponse.json({
      structured: null,
      content: text,
      parseError: 'Model did not return valid JSON; showing raw response.',
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
