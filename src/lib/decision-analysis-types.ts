/** Parsed output from /api/decision-analysis — matches Claude JSON contract. */

export interface DecisionAnalysisStructured {
  decisionSummary: string
  optionA: {
    financialImpact: string
    nonFinancialImpact: string
    timeline: string
    riskFactors: string
    confidence: string
  }
  optionB: {
    statusQuo: string
    costOfInaction: string
  }
  optionC: {
    alternative: string
  }
  aiRecommendation: {
    verdict: string
    confidencePercent: number
    reasoning: string
  }
}

export function parseDecisionAnalysisJson(raw: string): DecisionAnalysisStructured | null {
  const text = raw.trim()
  if (!text) return null
  let jsonStr = text
  const fence = text.match(/^```(?:json)?\s*([\s\S]*?)```\s*$/m)
  if (fence) jsonStr = fence[1].trim()
  try {
    const o = JSON.parse(jsonStr) as unknown
    if (!o || typeof o !== 'object') return null
    const x = o as Record<string, unknown>
    const a = x.optionA as Record<string, unknown> | undefined
    const b = x.optionB as Record<string, unknown> | undefined
    const c = x.optionC as Record<string, unknown> | undefined
    const r = x.aiRecommendation as Record<string, unknown> | undefined
    if (!a || !b || !c || !r) return null
    return {
      decisionSummary: String(x.decisionSummary ?? ''),
      optionA: {
        financialImpact: String(a.financialImpact ?? ''),
        nonFinancialImpact: String(a.nonFinancialImpact ?? ''),
        timeline: String(a.timeline ?? ''),
        riskFactors: String(a.riskFactors ?? ''),
        confidence: String(a.confidence ?? ''),
      },
      optionB: {
        statusQuo: String(b.statusQuo ?? ''),
        costOfInaction: String(b.costOfInaction ?? ''),
      },
      optionC: {
        alternative: String(c.alternative ?? ''),
      },
      aiRecommendation: {
        verdict: String(r.verdict ?? ''),
        confidencePercent: typeof r.confidencePercent === 'number' ? r.confidencePercent : Number(r.confidencePercent) || 0,
        reasoning: String(r.reasoning ?? ''),
      },
    }
  } catch {
    return null
  }
}

export function formatDecisionAnalysisForChat(d: DecisionAnalysisStructured): string {
  return [
    `Decision: ${d.decisionSummary}`,
    '',
    'OPTION A',
    `Financial: ${d.optionA.financialImpact}`,
    `Non-financial: ${d.optionA.nonFinancialImpact}`,
    `Timeline: ${d.optionA.timeline}`,
    `Risks: ${d.optionA.riskFactors}`,
    `Confidence: ${d.optionA.confidence}`,
    '',
    'OPTION B',
    `Status quo: ${d.optionB.statusQuo}`,
    `Cost of inaction: ${d.optionB.costOfInaction}`,
    '',
    'OPTION C',
    d.optionC.alternative,
    '',
    'AI RECOMMENDATION',
    `${d.aiRecommendation.verdict} (${d.aiRecommendation.confidencePercent}%)`,
    d.aiRecommendation.reasoning,
  ].join('\n')
}
