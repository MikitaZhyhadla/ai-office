import { callAgent } from "./callAgent"
import { buildAgentContext } from '@/lib/buildAgentContext'

const BASE_SYSTEM = `You are a senior developer writing an implementation prompt for Claude Code or GitHub Copilot. Given the ticket requirements and project context, generate a ready-to-paste prompt that a developer can use to implement this feature in their IDE. Be concrete, reference file paths if available, include acceptance criteria and edge cases. Return only the prompt text, no JSON.`

export async function devPromptAgent(requirement: string): Promise<string> {
  const contextBlock = buildAgentContext()
  const SYSTEM = contextBlock ? `${contextBlock}\n\n---\n\n${BASE_SYSTEM}` : BASE_SYSTEM
  return callAgent(SYSTEM, `Generate implementation prompt for this ticket:\n\n${requirement}`, 'devLead')
}
