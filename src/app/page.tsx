"use client"
import { useState } from "react"
import { Topbar } from "@/components/shared/Topbar"
import { PipelineStages } from "@/components/pipeline/PipelineStages"
import { RequirementInput } from "@/components/pipeline/RequirementInput"
import { ReviewCard } from "@/components/pipeline/ReviewCard"
import { ActivityLog } from "@/components/pipeline/ActivityLog"
import { useAppStore } from "@/store/useAppStore"
import { baAgentGWT } from "@/agents/baAgentGWT"
import { baAgentClassic } from "@/agents/baAgentClassic"
import { qaAgent } from "@/agents/qaAgent"
import { devAgent } from "@/agents/devAgent"
import type { Format, RequirementData, Ticket } from "@/types"
import type { QAVerdict } from "@/agents/qaAgent"
import type { DevVerdict } from "@/agents/devAgent"

export default function PipelinePage() {
  const { setAgentStatus, addLog, addTicket, incPipeline } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [pendingReview, setPendingReview] = useState<RequirementData | null>(null)
  const [qaVerdict, setQaVerdict] = useState<QAVerdict | null>(null)
  const [devVerdict, setDevVerdict] = useState<DevVerdict | null>(null)

  async function handleSubmit(text: string, format: Format) {
    setLoading(true)
    setPendingReview(null)
    setQaVerdict(null)
    setDevVerdict(null)
    try {
      if (format === "gwt") {
        setAgentStatus("alice", "thinking", "Analyzing requirement")
        addLog({ agentName:"Alice BA", agentRole:"ba", message:"Starting GWT analysis..." })
        const result = await baAgentGWT(text)
        setAgentStatus("alice", "idle")
        addLog({ agentName:"Alice BA", agentRole:"ba", message:`Generated ${result.scenarios.length} scenarios for "${result.title}"` })
        incPipeline("ba", 1)
        setPendingReview(result)
      } else {
        setAgentStatus("bob", "thinking", "Analyzing requirement")
        addLog({ agentName:"Bob BA", agentRole:"ba", message:"Starting Classic spec analysis..." })
        const result = await baAgentClassic(text)
        setAgentStatus("bob", "idle")
        addLog({ agentName:"Bob BA", agentRole:"ba", message:`Generated Classic spec for "${result.title}"` })
        incPipeline("ba", 1)
        setPendingReview(result)
      }
      incPipeline("review", 1)
      addLog({ agentName:"System", agentRole:"system", message:"Awaiting human review decision." })
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove() {
    if (!pendingReview) return
    setAgentStatus("qa1", "thinking", "Reviewing testability")
    setAgentStatus("dev1", "thinking", "Checking feasibility")
    addLog({ agentName:"QA Lead", agentRole:"qa", message:"Analyzing testability..." })
    addLog({ agentName:"Dev Lead", agentRole:"dev", message:"Checking feasibility..." })
    incPipeline("review", -1)
    incPipeline("qa", 1)
    const reqText = JSON.stringify(pendingReview)
    const [qa, dev] = await Promise.all([qaAgent(reqText), devAgent(reqText)])
    setAgentStatus("qa1", "idle")
    setAgentStatus("dev1", "idle")
    setQaVerdict(qa)
    setDevVerdict(dev)
    addLog({ agentName:"QA Lead", agentRole:"qa", message:qa.summary })
    addLog({ agentName:"Dev Lead", agentRole:"dev", message:dev.summary })
    const points = dev.sp_override ?? pendingReview.story_points
    const ticket: Ticket = {
      id: `TICK-${Date.now().toString().slice(-4)}`,
      title: pendingReview.title,
      format: pendingReview.format,
      priority: pendingReview.priority,
      points,
      status: "todo",
      data: pendingReview,
      createdAt: new Date().toISOString(),
    }
    addTicket(ticket)
    incPipeline("qa", -1)
    incPipeline("done", 1)
    addLog({ agentName:"System", agentRole:"system", message:`Ticket ${ticket.id} created and added to backlog.` })
    setPendingReview(null)
  }

  return (
    <div style={{ background:"#f0eff7", minHeight:"100vh" }}>
      <Topbar />
      <main style={{ padding:22, maxWidth:900, margin:"0 auto" }}>
        <div style={{ fontSize:15, fontWeight:600, marginBottom:18 }}>Requirements Pipeline</div>
        <PipelineStages />
        <RequirementInput onSubmit={handleSubmit} loading={loading} />
        {pendingReview && (
          <ReviewCard
            data={pendingReview}
            qaVerdict={qaVerdict}
            devVerdict={devVerdict}
            onApprove={handleApprove}
            onRequestChanges={() => setPendingReview(null)}
          />
        )}
        <ActivityLog />
      </main>
    </div>
  )
}
