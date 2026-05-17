import { callAgent } from "./callAgent"
import { stripJsonFences } from '@/lib/parseJson'
import type { TestCase, GWTRequirement, ClassicRequirement, Format } from "@/types"

const SYSTEM = `You are a QA Lead agent. Generate comprehensive test cases for a software requirement.
You MUST return ONLY valid JSON — no explanation, no markdown, no preamble.

Return this exact JSON structure:
{
  "testCases": [
    {
      "id": "TC-001",
      "title": "TC-001: <short descriptive title>",
      "steps": ["1. <action>", "2. <action>", "3. <action>"],
      "expectedResult": "<what should happen>",
      "type": "positive"
    }
  ]
}

Rules:
- Generate exactly 3 test cases: 1 positive, 1 negative, 1 boundary
- "positive": happy path — everything works as expected
- "negative": invalid input or error condition (null values, wrong format, missing fields)
- "boundary": edge case at the limits of valid input (max length, zero values, special chars)
- Steps must be concrete and actionable (3-5 steps each)
- expectedResult must be specific and measurable
- IDs must be sequential: TC-001, TC-002, TC-003
- type field must be exactly: "positive" | "negative" | "boundary"`

export async function qaTestCaseAgent(
  ticketId: string,
  ticketTitle: string,
  requirement: GWTRequirement | ClassicRequirement,
  format: Format
): Promise<TestCase[]> {
  if (format === 'bug') return []
  const reqText = JSON.stringify(requirement)

  const userMessage = `Generate test cases for this ticket:
Title: ${ticketTitle}
Ticket ID: ${ticketId}
Format: ${format.toUpperCase()}
Requirement:
${reqText}`

  const text = await callAgent(SYSTEM, userMessage)
  try {
    const parsed = JSON.parse(stripJsonFences(text)) as { testCases: TestCase[] }
    return parsed.testCases
  } catch (e) {
    console.error('qaTestCaseAgent raw response:', text)
    throw new Error('qaTestCaseAgent: failed to parse response')
  }
}

export async function qaTestCaseAgentFromString(requirement: string): Promise<TestCase[]> {
  const userMessage = `Generate test cases for this requirement:\n${requirement}`
  const text = await callAgent(SYSTEM, userMessage)
  try {
    const parsed = JSON.parse(stripJsonFences(text)) as { testCases: TestCase[] }
    return parsed.testCases
  } catch (e) {
    console.error('qaTestCaseAgent raw response:', text)
    throw new Error('qaTestCaseAgent: failed to parse response')
  }
}
