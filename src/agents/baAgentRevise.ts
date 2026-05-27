import { callAgent } from "./callAgent"
import { stripJsonFences } from '@/lib/parseJson'
import { buildAgentContext } from '@/lib/buildAgentContext'
import type { GWTRequirement, ClassicRequirement } from "@/types"

const BASE_SYSTEM = `You are a Senior BA agent. You receive an original software requirement and a list of issues flagged by QA and Dev agents. Rewrite the requirement to address ALL listed issues. Return ONLY valid JSON matching the original format exactly, no markdown.`

export async function baAgentRevise(
  original: GWTRequirement | ClassicRequirement,
  format: 'gwt' | 'classic',
  qaIssues: string[],
  devBlockers: string[]
): Promise<GWTRequirement | ClassicRequirement> {
  const issueList = [
    qaIssues.length > 0 ? `QA Issues:\n${qaIssues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}` : null,
    devBlockers.length > 0 ? `Dev Blockers:\n${devBlockers.map((blocker, i) => `${i + 1}. ${blocker}`).join('\n')}` : null,
  ].filter(Boolean).join('\n\n')

  const schemaHint = format === 'gwt'
    ? `Return JSON matching: {"title":"string","format":"gwt","scenarios":[{"name":"string","given":"string","when":"string","then":"string"}],"story_points":3,"priority":"high|medium|low","notes":"optional"}`
    : `Return JSON matching: {"title":"string","format":"classic","objective":"string","functional_requirements":["FR1: ..."],"non_functional_requirements":["NFR1: ..."],"acceptance_criteria":["AC1: ..."],"out_of_scope":["item"],"story_points":5,"priority":"high|medium|low","notes":"optional"}`

  const userMessage = `Original requirement:\n${JSON.stringify(original, null, 2)}\n\n${issueList}\n\nRewrite the requirement to address all issues above.\n${schemaHint}`

  const contextBlock = buildAgentContext()
  const SYSTEM = contextBlock ? `${contextBlock}\n\n---\n\n${BASE_SYSTEM}` : BASE_SYSTEM
  const text = await callAgent(SYSTEM, userMessage, 'bobBA')
  try {
    return JSON.parse(stripJsonFences(text)) as GWTRequirement | ClassicRequirement
  } catch (e) {
    console.error('baAgentRevise raw response:', text)
    throw new Error('baAgentRevise: failed to parse response')
  }
}
