import { callAgent } from "./callAgent"
import { safeParseJson } from '@/lib/parseJson'
import { buildAgentContext } from '@/lib/buildAgentContext'
import type { Ticket, TechNotes } from "@/types"

const FALLBACK_TECH_NOTES: TechNotes = {
  proposedStack: [],
  implementationSteps: [],
  edgeCases: [],
  patterns: [],
  estimateNote: '',
}

const BASE_SYSTEM = `You are Bob Dev, a senior full-stack developer working on AI Office — a requirements pipeline tool.
You receive a structured software requirement and generate concise, actionable technical implementation notes.
Your output is for developers — be specific, reference concrete technologies, patterns, and libraries.
proposedStack: list the exact technologies, libraries, or frameworks needed. Be specific (e.g. 'Zustand persist middleware', not just 'state management').
implementationSteps: numbered list of concrete dev tasks in order of execution. Each step is one clear action. Minimum 3, maximum 8 steps.
edgeCases: specific edge cases the developer must handle. Reference the actual requirement content. Minimum 2, maximum 5.
patterns: relevant design patterns or architectural patterns to apply. Be specific.
estimateNote: one sentence assessing if the story point estimate looks correct, too high, or too low, and why.
Respond ONLY with valid JSON matching the schema provided. No preamble, no markdown backticks, no explanation.`

function buildUserPrompt(ticket: Ticket, projectDescription: string): string {
  const requirementText = ticket.data
    ? JSON.stringify(ticket.data, null, 2)
    : 'No structured data available'

  const qaSection = ticket.qaVerdict
    ? `\nQA Verdict:\n${JSON.stringify(ticket.qaVerdict, null, 2)}`
    : ''

  const devSection = ticket.devVerdict
    ? `\nDev Verdict:\n${JSON.stringify(ticket.devVerdict, null, 2)}`
    : ''

  return `Project context: ${projectDescription || 'No project description provided'}

Ticket: ${ticket.id}
Title: ${ticket.title}
Type: ${ticket.ticketType || 'feature'}
Format: ${ticket.format}
Story Points: ${ticket.points}
Priority: ${ticket.priority}

Requirement data:
${requirementText}
${qaSection}${devSection}

Return a JSON object with this exact schema:
{
  "proposedStack": string[],
  "implementationSteps": string[],
  "edgeCases": string[],
  "patterns": string[],
  "estimateNote": string
}`
}

export async function runDevTechNotesAgent(ticket: Ticket, projectDescription: string): Promise<TechNotes> {
  const contextBlock = buildAgentContext()
  const SYSTEM = contextBlock ? `${contextBlock}\n\n---\n\n${BASE_SYSTEM}` : BASE_SYSTEM
  const raw = await callAgent(SYSTEM, buildUserPrompt(ticket, projectDescription), 4000)
  const parsed = safeParseJson<TechNotes>(raw, FALLBACK_TECH_NOTES)
  if (parsed === FALLBACK_TECH_NOTES) {
    throw new Error('Generation incomplete — response was too long for this requirement.')
  }
  return parsed
}
