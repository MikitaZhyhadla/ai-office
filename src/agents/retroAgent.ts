import { callAgent, safeParseJson } from "./callAgent"
import { buildAgentContext } from '@/lib/buildAgentContext'
import type { RetroReport } from "@/types"

interface SprintAgentInput {
  sprintName:         string
  startDate:          string
  endDate:            string
  projectName:        string
  projectDescription: string
  tickets: Array<{
    id:          string
    title:       string
    format:      string
    points:      number
    status:      string
    baRevisions: number
    qaIssues:    number
    devBlockers: number
    cycleTimeMs: number
  }>
}

const BASE_SYSTEM = `You are Alice BA, a senior business analyst specialising in agile retrospectives.
You receive sprint data from AI Office — a requirements pipeline tool.
Analyse the sprint and produce a structured retrospective report.
Your tone is professional, constructive, and specific. Avoid generic advice.
Always reference actual ticket counts and percentages from the data.
Respond ONLY with valid JSON matching the schema provided. No preamble, no markdown, no explanation.`

function buildUserPrompt(sprintData: SprintAgentInput): string {
  const { sprintName, startDate, endDate, projectName, projectDescription, tickets } = sprintData
  const totalCount = tickets.length
  const completedTickets = tickets.filter(t => t.status === 'done')
  const completedCount = completedTickets.length
  const velocitySP = completedTickets.reduce((sum, t) => sum + t.points, 0)
  const revisedCount = tickets.filter(t => t.baRevisions > 0).length

  const ticketLines = tickets.map(t => {
    const cycleTimeDays = t.cycleTimeMs === 0 ? 'N/A' : Math.round(t.cycleTimeMs / (1000 * 60 * 60 * 24))
    return `- ${t.id}: ${t.title} | ${t.points} SP | status: ${t.status} | BA revisions: ${t.baRevisions} | QA issues: ${t.qaIssues} | Dev blockers: ${t.devBlockers} | Cycle time: ${cycleTimeDays}d`
  }).join('\n')

  return `Sprint: ${sprintName} (${startDate} → ${endDate})
Project: ${projectName}
Context: ${projectDescription}

Tickets (${totalCount} total):
${ticketLines}

Completed tickets (status=done): ${completedCount} of ${totalCount}
Total velocity: ${velocitySP} SP
BA revision rate: ${revisedCount} of ${totalCount} tickets had at least one BA revision

Return a JSON object with this exact schema:
{
  "sprintName": string,
  "totalTickets": number,
  "completedTickets": number,
  "velocity": number,
  "revisionRate": string,
  "highlights": string[],
  "blockers": string[],
  "suggestions": string[],
  "agentInsights": string
}

highlights: 3-5 specific things that went well this sprint.
blockers: 2-4 specific patterns that caused delays or rework.
suggestions: 3-5 actionable recommendations for the next sprint.
agentInsights: A 3-5 sentence paragraph with your overall assessment of the sprint health.`
}

export async function runRetroAgent(sprintData: SprintAgentInput): Promise<RetroReport> {
  const userPrompt = buildUserPrompt(sprintData)
  const contextBlock = buildAgentContext()
  const SYSTEM = contextBlock ? `${contextBlock}\n\n---\n\n${BASE_SYSTEM}` : BASE_SYSTEM
  const raw = await callAgent(SYSTEM, userPrompt, 'aliceBA')
  return safeParseJson<RetroReport>(raw)
}

export type { SprintAgentInput }
