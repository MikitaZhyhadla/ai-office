import { callAgent } from "./callAgent"
import { stripJsonFences } from '@/lib/parseJson'
import { buildAgentContext } from '@/lib/buildAgentContext'
import type { BugReport, Severity } from "@/types"

const BASE_SYSTEM = `You are QA Lead, a senior quality assurance engineer specialising in bug classification and defect analysis.
You receive a natural-language bug report and convert it into a structured, developer-ready bug ticket.
Extract or infer all fields from the text. Be specific and actionable.
stepsToReproduce must be a numbered list of concrete steps — at least 2 items.
expectedBehavior and actualBehavior must each be one clear sentence.
severity: classify as 'critical' (data loss, security, app crash), 'major' (broken core feature), or 'minor' (cosmetic, edge case).
If the user provided a severity hint, use it unless the description clearly contradicts it.
title: a concise, developer-friendly summary under 80 characters. No "Bug:" prefix.
affectedArea: short label like 'Authentication', 'Payment Flow', 'Dashboard'.
Respond ONLY with valid JSON. No preamble, no markdown, no explanation.`

export async function runBugAgent(
  rawText: string,
  affectedArea: string,
  hintSeverity: Severity | null,
  projectDescription: string
): Promise<BugReport> {
  const userPrompt = `Project context: ${projectDescription || 'not specified'}

Bug report text:
${rawText}

Affected area hint: ${affectedArea || 'not specified'}
Severity hint: ${hintSeverity || 'not specified — you must classify'}

Return a JSON object with this exact schema:
{
  "title": string,
  "severity": "critical" | "major" | "minor",
  "stepsToReproduce": string[],
  "expectedBehavior": string,
  "actualBehavior": string,
  "affectedArea": string
}`

  const contextBlock = buildAgentContext()
  const SYSTEM = contextBlock ? `${contextBlock}\n\n---\n\n${BASE_SYSTEM}` : BASE_SYSTEM

  try {
    const raw = await callAgent(SYSTEM, userPrompt, 'qaLead')
    return JSON.parse(stripJsonFences(raw)) as BugReport
  } catch (e) {
    console.error('bugAgent raw response:', e)
    throw new Error('BugAgent: failed to parse response')
  }
}
