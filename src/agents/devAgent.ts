import { callAgent } from "./callAgent"
import { stripJsonFences } from '@/lib/parseJson'

export interface DevVerdict {
  feasible: boolean
  complexity: 'low' | 'medium' | 'high'
  blockers: string[]
  sp_override: number | null
  summary: string
}

const SYSTEM = `You are a Dev Lead agent. Check if requirements are feasible.
Return ONLY valid JSON:
{
  "feasible": true,
  "complexity": "low|medium|high",
  "blockers": [],
  "sp_override": null,
  "summary": "one sentence verdict"
}`

export async function devAgent(requirement: string): Promise<DevVerdict> {
  const text = await callAgent(SYSTEM, `Check feasibility:\n\n${requirement}`)
  try {
    return JSON.parse(stripJsonFences(text)) as DevVerdict
  } catch (e) {
    console.error('devAgent raw response:', text)
    throw new Error('devAgent: failed to parse response')
  }
}
