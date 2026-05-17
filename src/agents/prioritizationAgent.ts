import { callAgent } from "./callAgent"
import type { Ticket, PrioritizationReport } from "@/types"

const SYSTEM = `You are Alice BA, a senior business analyst and agile coach specialising in backlog prioritization.
You receive a list of backlog tickets and sprint context, and assign MoSCoW categories to each.
MoSCoW definitions:
- must: Critical for the sprint goal. Without this, the sprint fails. Deliver at all costs.
- should: High value, but the sprint succeeds without it. Schedule next if not done.
- could: Nice to have. Only if time and capacity allow.
- wont: Explicitly out of scope for this sprint. Not a priority now.
Rules:
- No more than 60% of tickets should be 'must'. Force ranking — not everything is critical.
- At least one ticket should be 'could' or 'wont' unless there are 3 or fewer tickets total.
- suggestedSP: Your own story point estimate. Use the current estimate as a reference — adjust only if clearly wrong. Return the same value if you agree.
- justification: 1-2 sentences. Be specific — reference the ticket title and sprint goal. No generic phrases like "this is important".
- summary: 2-3 sentences on the overall prioritization rationale and sprint capacity.
- Respond ONLY with valid JSON. No preamble, no markdown backticks, no explanation outside the JSON.`

function buildUserPrompt(
  tickets: Ticket[],
  sprintName: string,
  sprintDates: string,
  projectDescription: string,
  totalSprintSP: number
): string {
  const context = projectDescription || 'No project description provided — prioritization will be based on ticket content only'
  const ticketLines = tickets.map(
    (t, i) =>
      `${i + 1}. [${t.id}] "${t.title}" | type: ${t.ticketType || 'feature'} | format: ${t.format} | current priority: ${t.priority} | ${t.points} SP | status: ${t.status}`
  ).join('\n')

  return `Sprint: ${sprintName} (${sprintDates})
Total sprint capacity: ${totalSprintSP} story points
Project context: ${context}

Backlog tickets to prioritize (${tickets.length} total):
${ticketLines}

Return a JSON object with this exact schema:
{
  "results": [
    {
      "ticketId": string,
      "moscow": "must" | "should" | "could" | "wont",
      "justification": string,
      "suggestedSP": number
    }
  ],
  "summary": string,
  "generatedAt": string
}

The results array must contain exactly one entry per ticket in the input list.
ticketId must exactly match the id values provided.
generatedAt must be a valid ISO timestamp.`
}

export async function runPrioritizationAgent(
  tickets: Ticket[],
  sprintName: string,
  sprintDates: string,
  projectDescription: string,
  totalSprintSP: number
): Promise<PrioritizationReport> {
  const userPrompt = buildUserPrompt(tickets, sprintName, sprintDates, projectDescription, totalSprintSP)
  const raw = await callAgent(SYSTEM, userPrompt)
  const clean = raw.replace(/```json|```/g, '').trim()
  try {
    const parsed = JSON.parse(clean) as PrioritizationReport
    if (!parsed.results || parsed.results.length !== tickets.length) {
      throw new Error('result count mismatch')
    }
    return parsed
  } catch (err) {
    throw new Error('PrioritizationAgent: ' + (err instanceof Error ? err.message : String(err)))
  }
}
