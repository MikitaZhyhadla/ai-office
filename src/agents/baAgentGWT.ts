import { callAgent } from "./callAgent"
import type { GWTRequirement } from "@/types"

const SYSTEM = `You are a BA agent. Convert requirements to Gherkin format.
Return ONLY valid JSON matching this schema exactly, no markdown:
{
  "title": "short feature title",
  "format": "gwt",
  "scenarios": [{"name":"string","given":"string","when":"string","then":"string"}],
  "story_points": 3,
  "priority": "high|medium|low",
  "notes": "optional string"
}
Generate 1-3 scenarios. story_points: 1-13.`

export async function baAgentGWT(rawRequirement: string): Promise<GWTRequirement> {
  const text = await callAgent(SYSTEM, `Convert this requirement:\n\n${rawRequirement}`)
  return JSON.parse(text) as GWTRequirement
}
