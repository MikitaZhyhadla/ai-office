"use client"
import { useState } from "react"
import { useAppStore } from "@/store/useAppStore"
import { useAuthStore } from "@/store/useAuthStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { Topbar } from "@/components/shared/Topbar"
import { SprintPanel } from "@/components/backlog/SprintPanel"
import { TicketRow } from "@/components/backlog/TicketRow"
import { ResolvedItemsSection } from "@/components/backlog/ResolvedItemsSection"
import { ExportButton } from "@/components/shared/ExportButton"
import { CloseSprintAndRetroButton } from "@/components/shared/CloseSprintAndRetroButton"
import { CreateTicketModal } from "@/components/backlog/CreateTicketModal"
import { CreateSprintModal } from "@/components/kanban/CreateSprintModal"
import { runPrioritizationAgent } from "@/agents/prioritizationAgent"
import { VelocityChart } from "@/components/backlog/VelocityChart"
import { CollapsiblePanel } from "@/components/shared/CollapsiblePanel"
import type { Ticket } from "@/types"

export default function BacklogPage() {
  const { tickets, sprints, addTicket, updateTicket } = useAppStore()
  const currentUser = useAuthStore(s => s.currentUser)
  const { projectDescription } = useSettingsStore()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [showCreateSprintModal, setShowCreateSprintModal] = useState(false)
  const [isPrioritizing, setIsPrioritizing] = useState(false)
  const [prioritizationSummary, setPrioritizationSummary] = useState<string | null>(null)
  const [prioritizationError, setPrioritizationError] = useState<string | null>(null)

  const activeSprint = sprints.find(s => s.status === 'active') ?? null
  const myTickets = tickets.filter(t => t.userId === currentUser?.username)
  const sprintTickets = activeSprint ? myTickets.filter(t => activeSprint.ticketIds.includes(t.id)) : []
  const backlogTickets = myTickets.filter(t => !activeSprint?.ticketIds.includes(t.id) && !t.resolvedInSprint)

  function handleCreateTicket(ticket: Ticket) {
    addTicket(ticket)
  }

  async function handlePrioritize() {
    if (isPrioritizing || backlogTickets.length === 0) return

    setIsPrioritizing(true)
    setPrioritizationSummary(null)
    setPrioritizationError(null)

    try {
      const { projectDescription: desc } = useSettingsStore.getState()

      const sprintName = activeSprint?.name ?? 'Current Sprint'
      const sprintDates = activeSprint
        ? `${activeSprint.startDate ?? 'TBD'} – ${activeSprint.endDate ?? 'TBD'}`
        : 'Dates not set'

      const totalSprintSP = backlogTickets.reduce((sum, t) => sum + (t.points ?? 0), 0)

      const report = await runPrioritizationAgent(
        backlogTickets,
        sprintName,
        sprintDates,
        desc,
        totalSprintSP
      )

      report.results.forEach(result => {
        updateTicket(result.ticketId, {
          moscow:              result.moscow,
          moscowJustification: result.justification,
          suggestedSP:         result.suggestedSP,
        })
      })

      setPrioritizationSummary(report.summary)
    } catch (err) {
      setPrioritizationError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsPrioritizing(false)
    }
  }

  return (
    <div style={{ background:"#f0eff7", minHeight:"100vh" }}>
      <Topbar />
      <main style={{ padding:22, maxWidth:900, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <span style={{ fontSize:16, fontWeight:600 }}>Product Backlog</span>
          <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20, background:"#EEEDFE", color:"#3C3489" }}>
            {myTickets.length} tickets
          </span>
          <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
            <ExportButton />
            <CloseSprintAndRetroButton disabled={!activeSprint} />
            <button
              onClick={handlePrioritize}
              disabled={isPrioritizing || backlogTickets.length === 0}
              title={backlogTickets.length === 0 ? "No tickets to prioritize" : undefined}
              style={{
                background: isPrioritizing || backlogTickets.length === 0 ? "#a09de0" : "#534AB7",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 500,
                cursor: isPrioritizing || backlogTickets.length === 0 ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
                opacity: backlogTickets.length === 0 ? 0.6 : 1,
              }}
            >
              {isPrioritizing ? (
                <>
                  <span style={{ display:"inline-block", animation:"spin 1s linear infinite" }}>⟳</span>
                  Prioritizing...
                </>
              ) : (
                '✦ AI Prioritize Backlog'
              )}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: "#534AB7",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
              }}
            >
              ＋ Create Ticket
            </button>
          </div>
        </div>

        {/* Success banner */}
        {prioritizationSummary && (
          <div style={{
            background: "linear-gradient(135deg, #EEEDFE, #f8f0ff)",
            border: "1px solid #d4c8f0",
            borderRadius: 8,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
            color: "#534AB7",
            marginBottom: 14,
          }}>
            <span style={{ fontWeight: 700, flexShrink: 0 }}>✦ Alice BA · MoSCoW applied</span>
            <span style={{ color: "#555", flex: 1 }}>{prioritizationSummary}</span>
            <button
              onClick={() => setPrioritizationSummary(null)}
              style={{ background:"none", border:"none", color:"#aaa", cursor:"pointer", fontSize:14, padding:0, lineHeight:1 }}
            >✕</button>
          </div>
        )}

        {/* Error banner */}
        {prioritizationError && (
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: 8,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
            color: "#791F1F",
            marginBottom: 14,
          }}>
            <span style={{ flex: 1 }}>⚠ Prioritization failed: {prioritizationError}</span>
            <button
              onClick={() => setPrioritizationError(null)}
              style={{ background:"none", border:"none", color:"#aaa", cursor:"pointer", fontSize:14, padding:0, lineHeight:1 }}
            >✕</button>
          </div>
        )}

        {activeSprint ? (
          <SprintPanel
            sprint={activeSprint}
            tickets={sprintTickets}
          />
        ) : (
          <div style={{ background:"#fff", border:"1px solid #e8e8f0", borderRadius:10, padding:14, marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:12, color:"#aaa" }}>No active sprint.</span>
            <button
              onClick={() => setShowCreateSprintModal(true)}
              style={{ padding:"7px 16px", borderRadius:6, border:"1.5px solid #534AB7", background:"none", color:"#534AB7", cursor:"pointer", fontSize:13, fontWeight:600 }}
            >
              + New Sprint
            </button>
          </div>
        )}

        <div style={{ background:"#fff", border:"1px solid #e8e8f0", borderRadius:10, padding:14 }}>
          {activeSprint && sprintTickets.length > 0 && (
            <>
              <div style={{ fontSize:11, fontWeight:600, color:"#aaa", letterSpacing:.6, textTransform:"uppercase", marginBottom:10 }}>
                In Sprint — {sprintTickets.length} tickets
              </div>
              {sprintTickets.map(t => (
                <TicketRow key={t.id} ticket={t} sprintId={activeSprint.id} isInSprint={true} />
              ))}
              <div style={{ marginBottom:16 }} />
            </>
          )}

          <div style={{ fontSize:11, fontWeight:600, color:"#aaa", letterSpacing:.6, textTransform:"uppercase", marginBottom:10 }}>
            Backlog — {backlogTickets.length} tickets
          </div>
          {backlogTickets.length === 0 && (
            <div style={{ fontSize:12, color:"#ccc", padding:"12px 0" }}>
              No tickets in backlog yet. Create some in the Pipeline tab.
            </div>
          )}
          {backlogTickets.map(t => (
            <TicketRow key={t.id} ticket={t} sprintId={activeSprint?.id ?? ''} isInSprint={false} />
          ))}
        </div>

        <ResolvedItemsSection />

        <CollapsiblePanel title="📊 Sprint Analytics" defaultOpen={false}>
          <VelocityChart />
        </CollapsiblePanel>
      </main>

      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateTicket}
        />
      )}

      {showCreateSprintModal && (
        <CreateSprintModal onClose={() => setShowCreateSprintModal(false)} />
      )}
    </div>
  )
}
