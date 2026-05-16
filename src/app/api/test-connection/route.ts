import { NextRequest, NextResponse } from "next/server"

interface TestRequest {
  provider: "jira" | "azure"
  credentials: {
    baseUrl?: string
    apiToken?: string
    userEmail?: string
    orgUrl?: string
    patToken?: string
  }
}

async function testJira(creds: TestRequest["credentials"]): Promise<{ success: boolean; message: string }> {
  const { baseUrl, apiToken, userEmail } = creds
  if (!baseUrl || !apiToken || !userEmail) {
    return { success: false, message: "Missing credentials (Base URL, API Token, User Email)" }
  }

  const auth = Buffer.from(`${userEmail}:${apiToken}`).toString("base64")

  const res = await fetch(`${baseUrl}/rest/api/3/myself`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  })

  if (!res.ok) {
    if (res.status === 401) return { success: false, message: "401 Unauthorized — check API Token and User Email" }
    if (res.status === 403) return { success: false, message: "403 Forbidden — check account permissions" }
    if (res.status === 404) return { success: false, message: "404 Not Found — check Base URL" }
    return { success: false, message: `Error ${res.status} — ${await res.text()}` }
  }

  const data = await res.json()
  const displayName = (data.displayName as string) ?? "Unknown"
  return { success: true, message: `Connected — ${displayName}` }
}

async function testAzure(creds: TestRequest["credentials"]): Promise<{ success: boolean; message: string }> {
  const { orgUrl, patToken } = creds
  if (!orgUrl || !patToken) {
    return { success: false, message: "Missing credentials (Organisation URL, PAT Token)" }
  }

  const auth = Buffer.from(`:${patToken}`).toString("base64")

  const res = await fetch(`${orgUrl}/_apis/projects?api-version=7.0`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  })

  if (!res.ok) {
    if (res.status === 401) return { success: false, message: "401 Unauthorized — check PAT Token" }
    if (res.status === 403) return { success: false, message: "403 Forbidden — check PAT scopes" }
    if (res.status === 404) return { success: false, message: "404 Not Found — check Organisation URL" }
    return { success: false, message: `Error ${res.status} — ${await res.text()}` }
  }

  const data = await res.json()
  const count = (data.count as number) ?? 0
  return { success: true, message: `Connected — ${count} project${count !== 1 ? "s" : ""} found` }
}

export async function POST(req: NextRequest) {
  let body: TestRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 })
  }

  const { provider, credentials } = body
  if (!provider || !credentials) {
    return NextResponse.json({ success: false, message: "Missing provider or credentials" }, { status: 400 })
  }

  try {
    if (provider === "jira") {
      const result = await testJira(credentials)
      return NextResponse.json(result)
    }
    if (provider === "azure") {
      const result = await testAzure(credentials)
      return NextResponse.json(result)
    }
    return NextResponse.json({ success: false, message: `Unknown provider: ${provider}` }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ success: false, message: String(err) }, { status: 500 })
  }
}
