import { callAgent } from "./callAgent"

export interface QAVerdict {
  testable: boolean
  issues: string[]
  suggestions: string[]
  summary: string
}

const SYSTEM = `You are a QA Lead agent. Analyze if requirements are testable.
Return ONLY valid JSON:
{
  "testable": true,
  "issues": ["issue if any"],
  "suggestions": ["suggestion"],
  "summary": "one sentence verdict"
}`

export async function qaAgent(requirement: string): Promise<QAVerdict> {
  const text = await callAgent(SYSTEM, `Analyze testability:\n\n${requirement}`)
  return JSON.parse(text) as QAVerdict
}
