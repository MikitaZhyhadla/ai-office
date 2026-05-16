"use client"
import { useState } from "react"
import { Topbar } from "@/components/shared/Topbar"
import { PipelineStages } from "@/components/pipeline/PipelineStages"
import { RequirementInput } from "@/components/pipeline/RequirementInput"
import { ReviewCard } from "@/components/pipeline/ReviewCard"
import { RevisionBanner } from "@/components/pipeline/RevisionBanner"
import { ActivityLog } from "@/components/pipeline/ActivityLog"
import { useAppStore } from "@/store/useAppStore"
import { baAgentGWT } from "@/agents/baAgentGWT"
import { baAgentClassic } from "@/agents/baAgentClassic"
import { baAgentRevise } from "@/agents/baAgentRevise"
import { qaAgent } from "@/agents/qaAgent"
import { devAgent } from "@/agents/devAgent"
import { useAuthStore } from "@/store/useAuthStore"
import type { Format, RequirementData, Ticket, TicketHistoryEntry } from "@/types"
import type { QAVerdict } from "@/agents/qaAgent"
import type { DevVerdict } from "@/agents/devAgent"

type PipelineMode = 'idle' | 'analyzing' | 'review' | 'qa_check' | 'revision' | 'done'

export default function PipelinePage() {
  const { setAgentStatus, addLog, addTicket, incPipeline } = useAppStore()
  const currentUser = useAuthStore(s => s.currentUser)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<PipelineMode>('idle')
  const [pendingReview, setPendingReview] = useState<RequirementData | null>(null)
  const [pendingFormat, setPendingFormat] = useState<Format>('gwt')
  const [qaVerdict, setQaVerdict] = useState<QAVerdict | null>(null)
  const [devVerdict, setDevVerdict] = useState<DevVerdict | null>(null)
  const [isRevising, setIsRevising] = useState(false)
  const [revisionCount, setRevisionCount] = useState(0)

  async function handleSubmit(text: string, format: Format) {
    setLoading(true)
    setPendingReview(null)
    setQaVerdict(null)
    setDevVerdict(null)
    setRevisionCount(0)
    setMode('analyzing')
    setPendingFormat(format)
    try {
      if (format === "gwt") {
        setAgentStatus("alice", "thinking", "Analyzing requirement")
        addLog({ agentName: "Alice BA", agentRole: "ba", message: "Starting GWT analysis..." })
        const result = await baAgentGWT(text)
        setAgentStatus("alice", "idle")
        addLog({ agentName: "Alice BA", agentRole: "ba", message: `Generated ${result.scenarios.length} scenarios for "${result.title}"` })
        incPipeline("ba", 1)
        setPendingReview(result)
      } else {
        setAgentStatus("bob", "thinking", "Analyzing requirement")
        addLog({ agentName: "Bob BA", agentRole: "ba", message: "Starting Classic spec analysis..." })
        const result = await baAgentClassic(text)
        setAgentStatus("bob", "idle")
        addLog({ agentName: "Bob BA", agentRole: "ba", message: `Generated Classic spec for "${result.title}"` })
        incPipeline("ba", 1)
        setPendingReview(result)
      }
      setMode('review')
      incPipeline("review", 1)
      addLog({ agentName: "System", agentRole: "system", message: "Awaiting human review decision." })
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    if (!pendingReview) return
    setMode('qa_check')
    setAgentStatus("qa1", "thinking", "Reviewing testability")
    setAgentStatus("dev1", "thinking", "Checking feasibility")
    addLog({ agentName: "QA Lead", agentRole: "qa", message: "Analyzing testability..." })
    addLog({ agentName: "Dev Lead", agentRole: "dev", message: "Checking feasibility..." })
    incPipeline("review", -1)
    incPipeline("qa", 1)
    const reqText = JSON.stringify(pendingReview)
    const [qa, dev] = await Promise.all([qaAgent(reqText), devAgent(reqText)])
    setAgentStatus("qa1", "idle")
    setAgentStatus("dev1", "idle")
    setQaVerdict(qa)
    setDevVerdict(dev)
    addLog({ agentName: "QA Lead", agentRole: "qa", message: qa.summary })
    addLog({ agentName: "Dev Lead", agentRole: "dev", message: dev.summary })

    const hasIssues = !qa.testable || !dev.feasible || qa.issues.length > 0 || dev.blockers.length > 0

    if (hasIssues) {
      incPipeline("qa", -1)
      setMode('revision')
      addLog({
        agentName: "System",
        agentRole: "system",
        message: `QA/Dev flagged issues. Revision required — ${qa.issues.length} QA issue(s), ${dev.blockers.length} Dev blocker(s).`,
      })
      return
    }

    createTicket(pendingReview, qa, dev)
  }

  async function handleSendToBA() {
    if (!pendingReview || !qaVerdict || !devVerdict) return
    setIsRevising(true)
    const round = revisionCount + 1
    addLog({ agentName: "Alice BA", agentRole: "ba", message: "BA agent is revising requirement based on QA/Dev feedback..." })
    try {
      const revised = await baAgentRevise(pendingReview, pendingFormat, qaVerdict.issues, devVerdict.blockers)
      setPendingReview(revised)
      setQaVerdict(null)
      setDevVerdict(null)
      setRevisionCount(round)
      setMode('review')
      incPipeline("review", 1)
      addLog({ agentName: "Alice BA", agentRole: "ba", message: `BA revision complete. Round #${round} — please review the updated requirement.` })
    } finally {
      setIsRevising(false)
    }
  }

  function handleApproveAnyway() {
    if (!pendingReview || !qaVerdict || !devVerdict) return
    const allIssues = [...qaVerdict.issues, ...devVerdict.blockers]
    const issueNote = allIssues.length > 0 ? `Approved with known issues: ${allIssues.join('; ')}` : undefined
    createTicket(pendingReview, qaVerdict, devVerdict, issueNote)
    addLog({ agentName: "System", agentRole: "system", message: "Ticket created with noted issues. Approved by human override." })
  }

  function createTicket(req: RequirementData, qa: QAVerdict, dev: DevVerdict, issueNote?: string) {
    const points = dev.sp_override ?? req.story_points
    const id = `TICK-${Date.now().toString().slice(-4)}`
    const now = new Date().toISOString()
    const baName = req.format === "gwt" ? "Alice BA" : "Bob BA"
    const baRole: TicketHistoryEntry["actorRole"] = "ba"

    const history: TicketHistoryEntry[] = [
      { id: crypto.randomUUID(), timestamp: now, actor: baName, actorRole: baRole, message: "Generated requirement" },
      { id: crypto.randomUUID(), timestamp: now, actor: "Human", actorRole: "human", message: "Approved requirement for QA/Dev check" },
      { id: crypto.randomUUID(), timestamp: now, actor: "QA Lead", actorRole: "qa", message: qa.summary },
      { id: crypto.randomUUID(), timestamp: now, actor: "Dev Lead", actorRole: "dev", message: dev.summary },
    ]
    if (issueNote) {
      history.push({ id: crypto.randomUUID(), timestamp: now, actor: "Human", actorRole: "human", message: "Approved with known issues" })
    }
    if (revisionCount > 0) {
      history.splice(1, 0, { id: crypto.randomUUID(), timestamp: now, actor: baName, actorRole: baRole, message: `Revised requirement (${revisionCount} round${revisionCount > 1 ? 's' : ''})` })
    }
    history.push({ id: crypto.randomUUID(), timestamp: now, actor: "System", actorRole: "system", message: `Ticket ${id} created` })

    const ticket: Ticket = {
      id,
      title: req.title,
      format: req.format,
      priority: req.priority,
      points,
      status: "todo",
      data: req,
      createdAt: now,
      userId: currentUser?.username,
      qaVerdict: qa,
      devVerdict: dev,
      history,
    }
    addTicket(ticket)
    incPipeline("qa", -1)
    incPipeline("done", 1)
    setMode('done')
    addLog({
      agentName: "System",
      agentRole: "system",
      message: issueNote
        ? `Ticket ${ticket.id} created. ${issueNote}`
        : `Ticket ${ticket.id} created and added to backlog.`,
    })
    setPendingReview(null)
    setQaVerdict(null)
    setDevVerdict(null)
  }

  return (
    <div style={{ background: "#f0eff7", minHeight: "100vh" }}>
      <Topbar />
      <main style={{ padding: 22, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>Requirements Pipeline</div>
        <PipelineStages />
        <RequirementInput onSubmit={handleSubmit} loading={loading} />
        {pendingReview && (
          <>
            <ReviewCard
              data={pendingReview}
              qaVerdict={mode === 'revision' ? qaVerdict : null}
              devVerdict={mode === 'revision' ? devVerdict : null}
              onApprove={handleApprove}
              onRequestChanges={() => { setPendingReview(null); setMode('idle') }}
              revisionCount={revisionCount}
            />
            {mode === 'revision' && qaVerdict && devVerdict && (
              <RevisionBanner
                qaIssues={qaVerdict.issues}
                devBlockers={devVerdict.blockers}
                onSendToBA={handleSendToBA}
                onApproveAnyway={handleApproveAnyway}
                isRevising={isRevising}
              />
            )}
          </>
        )}
        <ActivityLog />
      </main>
    </div>
  )
}
