import { callAgent, safeParseJson } from "./callAgent"
import { buildAgentContext } from '@/lib/buildAgentContext'

export interface DevVerdict {
  feasible: boolean
  complexity: 'low' | 'medium' | 'high'
  blockers: string[]
  sp_override: number | null
  summary: string
}

const BASE_SYSTEM = `You are a Dev Lead agent. Check if requirements are feasible.
Return ONLY valid JSON:
{
  "feasible": true,
  "complexity": "low|medium|high",
  "blockers": [],
  "sp_override": null,
  "summary": "one sentence verdict"
}`

export async function devAgent(requirement: string): Promise<DevVerdict> {
  const contextBlock = buildAgentContext()
  const SYSTEM = contextBlock ? `${contextBlock}\n\n---\n\n${BASE_SYSTEM}` : BASE_SYSTEM
  const text = await callAgent(SYSTEM, `Check feasibility:\n\n${requirement}`, 'devLead')
  return safeParseJson<DevVerdict>(text)
}
