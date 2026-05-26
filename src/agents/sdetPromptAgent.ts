import { callAgent } from "./callAgent"
import { buildAgentContext } from '@/lib/buildAgentContext'
import type { TestCase, SDETVerdict } from '@/types'

const BASE_SYSTEM = `You are an SDET engineer writing a test automation prompt for Claude Code. Given the ticket, its test cases, and the SDET verdict, generate a ready-to-paste prompt that an SDET can use to write automated tests. Reference existing test file conventions if available from context. Return only the prompt text, no JSON.`

export async function sdetPromptAgent(
  requirement: string,
  testCases: TestCase[],
  sdetVerdict: SDETVerdict | undefined
): Promise<string> {
  const contextBlock = buildAgentContext()
  const SYSTEM = contextBlock ? `${contextBlock}\n\n---\n\n${BASE_SYSTEM}` : BASE_SYSTEM
  const payload = [
    `Ticket requirements:\n${requirement}`,
    testCases.length > 0 ? `Test cases:\n${JSON.stringify(testCases, null, 2)}` : '',
    sdetVerdict ? `SDET verdict:\n${JSON.stringify(sdetVerdict, null, 2)}` : '',
  ].filter(Boolean).join('\n\n')
  return callAgent(SYSTEM, `Generate test automation prompt:\n\n${payload}`, undefined, 1500)
}
