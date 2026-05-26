import { callAgent } from "./callAgent"
import { stripJsonFences } from '@/lib/parseJson'
import { buildAgentContext } from '@/lib/buildAgentContext'
import type { SDETVerdict } from '@/types'

const BASE_SYSTEM = `You are an SDET (Software Development Engineer in Test) agent. Analyze the given ticket and provide an automation feasibility verdict. Return ONLY valid JSON with no markdown, no explanation.
{
  "automationFeasibility": "Yes|Partial|No",
  "feasibilityReason": "brief explanation",
  "recommendedTestTypes": ["E2E","Integration","Unit","API","Performance"],
  "existingTestImpact": "what existing tests need updating",
  "automationPriority": "High|Medium|Low",
  "suggestedFramework": "e.g. Playwright"
}`

export async function sdetAgent(requirement: string): Promise<SDETVerdict> {
  const contextBlock = buildAgentContext()
  const SYSTEM = contextBlock ? `${contextBlock}\n\n---\n\n${BASE_SYSTEM}` : BASE_SYSTEM
  const text = await callAgent(SYSTEM, `Analyze automation feasibility:\n\n${requirement}`)
  try {
    return JSON.parse(stripJsonFences(text)) as SDETVerdict
  } catch (e) {
    console.error('sdetAgent raw response:', text)
    throw new Error('sdetAgent: failed to parse response')
  }
}
