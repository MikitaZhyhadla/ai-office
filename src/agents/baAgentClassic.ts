import { callAgent } from "./callAgent"
import type { ClassicRequirement } from "@/types"

const SYSTEM = `You are a BA agent. Convert requirements to classic spec format.
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
  const text = await callAgent(SYSTEM, `Convert this requirement:\n\n${rawRequirement}`)
  return JSON.parse(text) as ClassicRequirement
}
