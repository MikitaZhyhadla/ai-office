import { callAgent } from "./callAgent"
import { stripJsonFences } from '@/lib/parseJson'
import { buildAgentContext } from '@/lib/buildAgentContext'

export interface QAVerdict {
  testable: boolean
  issues: string[]
  suggestions: string[]
  summary: string
}

const BASE_SYSTEM = `You are a QA Lead agent. Analyze if requirements are testable.
Return ONLY valid JSON:
{
  "testable": true,
  "issues": ["issue if any"],
  "suggestions": ["suggestion"],
  "summary": "one sentence verdict"
}`

export async function qaAgent(requirement: string): Promise<QAVerdict> {
  const contextBlock = buildAgentContext()
  const SYSTEM = contextBlock ? `${contextBlock}\n\n---\n\n${BASE_SYSTEM}` : BASE_SYSTEM
  const text = await callAgent(SYSTEM, `Analyze testability:\n\n${requirement}`)
  try {
    return JSON.parse(stripJsonFences(text)) as QAVerdict
  } catch (e) {
    console.error('qaAgent raw response:', text)
    throw new Error('qaAgent: failed to parse response')
  }
}
