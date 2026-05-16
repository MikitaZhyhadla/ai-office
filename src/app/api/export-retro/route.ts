import type { RetroReport } from "@/types"

function formatRetroAsText(report: RetroReport): string {
  return `Sprint ${report.sprintName} Retrospective
================================
Velocity: ${report.velocity} SP | Tickets: ${report.completedTickets}/${report.totalTickets} | Revision rate: ${report.revisionRate}

What went well:
${report.highlights.map(h => `- ${h}`).join('\n')}

Blockers:
${report.blockers.map(b => `- ${b}`).join('\n')}

Suggestions:
${report.suggestions.map(s => `- ${s}`).join('\n')}

Agent Insights:
${report.agentInsights}`
}

export async function POST(req: Request) {
  const { report, sprintName } = await req.json() as { report: RetroReport; sprintName: string }
  const text = formatRetroAsText(report)
  const safeName = sprintName.replace(/\s+/g, '-')
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain',
      'Content-Disposition': `attachment; filename="retro-${safeName}.txt"`,
    },
  })
}
