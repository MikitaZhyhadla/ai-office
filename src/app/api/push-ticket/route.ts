import { NextRequest, NextResponse } from "next/server"
import type { Priority } from "@/types"

interface TicketPayload {
  id: string
  title: string
  format: string
  data: Record<string, unknown>
  priority: Priority
  points: number
}

interface Credentials {
  baseUrl?: string
  projectKey?: string
  apiToken?: string
  userEmail?: string
  orgUrl?: string
  project?: string
  patToken?: string
}

interface PushRequest {
  provider: "jira" | "azure"
  ticket: TicketPayload
  credentials: Credentials
}

function formatTicketText(ticket: TicketPayload): string {
  const { format, data } = ticket
  if (format === "gwt") {
    const d = data as { scenarios?: Array<{ name: string; given: string; when: string; then: string }> }
    const scenarios = d.scenarios ?? []
    return scenarios.map((sc, i) =>
      `Scenario ${i + 1}: ${sc.name}\nGiven ${sc.given}\nWhen ${sc.when}\nThen ${sc.then}`
    ).join("\n\n")
  }
  if (format === "classic") {
    const d = data as {
      objective?: string
      functional_requirements?: string[]
      non_functional_requirements?: string[]
      acceptance_criteria?: string[]
      out_of_scope?: string[]
      notes?: string
    }
    const lines: string[] = []
    if (d.objective) lines.push(`Objective:\n${d.objective}`)
    if (d.functional_requirements?.length) lines.push(`Functional Requirements:\n${d.functional_requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}`)
    if (d.non_functional_requirements?.length) lines.push(`Non-Functional Requirements:\n${d.non_functional_requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}`)
    if (d.acceptance_criteria?.length) lines.push(`Acceptance Criteria:\n${d.acceptance_criteria.map((r, i) => `${i + 1}. ${r}`).join("\n")}`)
    if (d.out_of_scope?.length) lines.push(`Out of Scope:\n${d.out_of_scope.map((r, i) => `${i + 1}. ${r}`).join("\n")}`)
    if (d.notes) lines.push(`Notes:\n${d.notes}`)
    return lines.join("\n\n")
  }
  if (format === "jobs") {
    const d = data as { jobStory?: string; notes?: string }
    return [d.jobStory, d.notes].filter(Boolean).join("\n\n")
  }
  return JSON.stringify(data, null, 2)
}

function jiraPriorityName(p: Priority): string {
  return p === "high" ? "High" : p === "medium" ? "Medium" : "Low"
}

async function pushToJira(ticket: TicketPayload, creds: Credentials): Promise<{ issueUrl: string; issueKey: string }> {
  const { baseUrl, projectKey, apiToken, userEmail } = creds
  if (!baseUrl || !projectKey || !apiToken || !userEmail) {
    throw new Error("Missing Jira credentials")
  }

  const auth = Buffer.from(`${userEmail}:${apiToken}`).toString("base64")
  const bodyText = `FORMAT: ${ticket.format.toUpperCase()}\n\n${formatTicketText(ticket)}`

  const body = {
    fields: {
      project: { key: projectKey },
      summary: ticket.title,
      issuetype: { name: "Story" },
      priority: { name: jiraPriorityName(ticket.priority) },
      customfield_10016: ticket.points,
      labels: ["ai-office", ticket.id],
      description: {
        version: 1,
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: bodyText }],
          },
        ],
      },
    },
  }

  const res = await fetch(`${baseUrl}/rest/api/3/issue`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Jira API error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const issueKey = data.key as string
  return { issueUrl: `${baseUrl}/browse/${issueKey}`, issueKey }
}

function azurePriority(p: Priority): number {
  return p === "high" ? 1 : p === "medium" ? 2 : 3
}

function formatDescriptionHtml(ticket: TicketPayload): string {
  const text = formatTicketText(ticket)
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>")
  return `<p><strong>FORMAT: ${ticket.format.toUpperCase()}</strong></p><p>${escaped}</p>`
}

async function pushToAzure(ticket: TicketPayload, creds: Credentials): Promise<{ issueUrl: string; issueKey: string }> {
  const { orgUrl, project, patToken } = creds
  if (!orgUrl || !project || !patToken) {
    throw new Error("Missing Azure DevOps credentials")
  }

  const auth = Buffer.from(`:${patToken}`).toString("base64")
  const url = `${orgUrl}/${encodeURIComponent(project)}/_apis/wit/workitems/$Story?api-version=7.0`

  const patchBody = [
    { op: "add", path: "/fields/System.Title", value: ticket.title },
    { op: "add", path: "/fields/System.Description", value: formatDescriptionHtml(ticket) },
    { op: "add", path: "/fields/Microsoft.VSTS.Scheduling.StoryPoints", value: ticket.points },
    { op: "add", path: "/fields/Microsoft.VSTS.Common.Priority", value: azurePriority(ticket.priority) },
    { op: "add", path: "/fields/System.Tags", value: `ai-office; ${ticket.id}` },
  ]

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json-patch+json",
      Accept: "application/json",
    },
    body: JSON.stringify(patchBody),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Azure DevOps API error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const issueUrl = (data._links?.html?.href as string) ?? `${orgUrl}/${project}`
  const issueKey = String(data.id)
  return { issueUrl, issueKey }
}

export async function POST(req: NextRequest) {
  let body: PushRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 })
  }

  const { provider, ticket, credentials } = body
  if (!provider || !ticket || !credentials) {
    return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
  }

  try {
    if (provider === "jira") {
      const result = await pushToJira(ticket, credentials)
      return NextResponse.json({ success: true, ...result })
    }
    if (provider === "azure") {
      const result = await pushToAzure(ticket, credentials)
      return NextResponse.json({ success: true, ...result })
    }
    return NextResponse.json({ success: false, error: `Unknown provider: ${provider}` }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
  }
}
