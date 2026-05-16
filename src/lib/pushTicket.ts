import { useSettingsStore } from "@/store/useSettingsStore"
import type { Ticket } from "@/types"

interface PushResult {
  issueUrl: string
  issueKey: string
}

function ticketPayload(ticket: Ticket) {
  return {
    id: ticket.id,
    title: ticket.title,
    format: ticket.format,
    data: ticket.data as unknown as Record<string, unknown>,
    priority: ticket.priority,
    points: ticket.points,
  }
}

export async function pushTicketToJira(ticket: Ticket): Promise<PushResult> {
  const { jira } = useSettingsStore.getState()

  const res = await fetch("/api/push-ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "jira",
      ticket: ticketPayload(ticket),
      credentials: {
        baseUrl: jira.baseUrl,
        projectKey: jira.projectKey,
        apiToken: jira.apiToken,
        userEmail: jira.userEmail,
      },
    }),
  })

  const data = await res.json()
  if (!data.success) {
    throw new Error(data.error ?? "Failed to push to Jira")
  }
  return { issueUrl: data.issueUrl, issueKey: data.issueKey }
}

export async function pushTicketToAzure(ticket: Ticket): Promise<PushResult> {
  const { azure } = useSettingsStore.getState()

  const res = await fetch("/api/push-ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "azure",
      ticket: ticketPayload(ticket),
      credentials: {
        orgUrl: azure.orgUrl,
        project: azure.project,
        patToken: azure.patToken,
      },
    }),
  })

  const data = await res.json()
  if (!data.success) {
    throw new Error(data.error ?? "Failed to push to Azure DevOps")
  }
  return { issueUrl: data.issueUrl, issueKey: data.issueKey }
}
