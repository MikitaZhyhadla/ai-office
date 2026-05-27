import { callAgent, safeParseJson } from "./callAgent"
import { buildAgentContext } from '@/lib/buildAgentContext'
import type { ClassicRequirement } from "@/types"

const BASE_SYSTEM = `You are a BA agent. Convert requirements to classic spec format.
Return ONLY valid JSON, no markdown:
{
  "title": "string",
  "format": "classic",
  "objective": "one sentence",
  "functional_requirements": ["FR1: ...","FR2: ..."],
  "non_functional_requirements": ["NFR1: ..."],
  "acceptance_criteria": ["AC1: ...","AC2: ..."],
  "out_of_scope": ["item"],
  "story_points": 5,
  "priority": "high|medium|low",
  "notes": "optional"
}
2-4 FRs, 1-2 NFRs, 2-3 ACs.`

export async function baAgentClassic(rawRequirement: string): Promise<ClassicRequirement> {
  const contextBlock = buildAgentContext()
  const SYSTEM = contextBlock ? `${contextBlock}\n\n---\n\n${BASE_SYSTEM}` : BASE_SYSTEM
  const text = await callAgent(SYSTEM, `Convert this requirement:\n\n${rawRequirement}`, 'aliceBA')
  return safeParseJson<ClassicRequirement>(text)
}
