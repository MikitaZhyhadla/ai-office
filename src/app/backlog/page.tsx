"use client"
import { useState } from "react"
import { useAppStore } from "@/store/useAppStore"
import { useAuthStore } from "@/store/useAuthStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { Topbar } from "@/components/shared/Topbar"
import { SprintPanel } from "@/components/backlog/SprintPanel"
import { TicketRow } from "@/components/backlog/TicketRow"
import { ExportButton } from "@/components/shared/ExportButton"
import { CreateTicketModal } from "@/components/backlog/CreateTicketModal"
import { RetroModal } from "@/components/backlog/RetroModal"
import { runRetroAgent } from "@/agents/retroAgent"
import { runPrioritizationAgent } from "@/agents/prioritizationAgent"
import type { Ticket, RetroReport } from "@/types"

export default function BacklogPage() {
  const { tickets, sprints, addTicket, updateTicket, closeSprintWithRetro } = useAppStore()
  const currentUser = useAuthStore(s => s.currentUser)
  const { projectName, projectDescription } = useSettingsStore()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [retroLoading, setRetroLoading] = useState(false)
  const [retroModalOpen, setRetroModalOpen] = useState(false)
  const [retroReport, setRetroReport] = useState<RetroReport | null>(null)
  const [avgCycleTimeDays, setAvgCycleTimeDays] = useState<number | null>(null)

  const [isPrioritizing, setIsPrioritizing] = useState(false)
  const [prioritizationSummary, setPrioritizationSummary] = useState<string | null>(null)
  const [prioritizationError, setPrioritizationError] = useState<string | null>(null)

  const sprint = sprints[0]
  const myTickets = tickets.filter(t => t.userId === currentUser?.username)
  const sprintTickets = myTickets.filter(t => sprint.ticketIds.includes(t.id))
  const backlogTickets = myTickets.filter(t => !sprint.ticketIds.includes(t.id))

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

      const activeSprint = sprints[0]
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

  async function handleCloseSprintAndRetro() {
    setRetroLoading(true)
    setRetroModalOpen(true)
    setRetroReport(null)

    try {
      const agentTickets = sprintTickets.map(t => {
        const history = t.history ?? []
        const timestamps = history.map(h => new Date(h.timestamp).getTime()).filter(n => !isNaN(n))
        const cycleTimeMs = timestamps.length >= 2
          ? Math.max(...timestamps) - Math.min(...timestamps)
          : 0
        return {
          id:          t.id,
          title:       t.title,
          format:      t.format,
          points:      t.points,
          status:      t.status,
          baRevisions: history.filter(h => h.actorRole === 'ba').length,
          qaIssues:    t.qaVerdict?.issues?.length ?? 0,
          devBlockers: t.devVerdict?.blockers?.length ?? 0,
          cycleTimeMs,
        }
      })

      const doneCycleTimes = agentTickets
        .filter(t => t.status === 'done' && t.cycleTimeMs > 0)
        .map(t => t.cycleTimeMs)
      const avgMs = doneCycleTimes.length > 0
        ? doneCycleTimes.reduce((a, b) => a + b, 0) / doneCycleTimes.length
        : null
      const avgDays = avgMs != null ? Math.round(avgMs / (1000 * 60 * 60 * 24)) : null
      setAvgCycleTimeDays(avgDays)

      const result = await runRetroAgent({
        sprintName:         sprint.name,
        startDate:          sprint.startDate,
        endDate:            sprint.endDate,
        projectName:        projectName || 'AI Office Project',
        projectDescription: projectDescription || 'A requirements pipeline tool.',
        tickets:            agentTickets,
      })

      setRetroReport(result)
      closeSprintWithRetro(sprint.id, result)
    } catch (err) {
      console.error('Retro generation failed:', err)
      setRetroModalOpen(false)
      alert('Failed to generate retrospective. Please try again.')
    } finally {
      setRetroLoading(false)
    }
  }

  async function handleExportTxt() {
    if (!retroReport) return
    try {
      const res = await fetch('/api/export-retro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: retroReport, sprintName: sprint.name }),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `retro-${sprint.name.replace(/\s+/g, '-')}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  function handleStartNextSprint() {
    setRetroModalOpen(false)
    setRetroReport(null)
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

        <SprintPanel
          sprint={sprint}
          tickets={sprintTickets}
          onCloseSprint={handleCloseSprintAndRetro}
          retroLoading={retroLoading}
        />

        <div style={{ background:"#fff", border:"1px solid #e8e8f0", borderRadius:10, padding:14 }}>
          {sprintTickets.length > 0 && (
            <>
              <div style={{ fontSize:11, fontWeight:600, color:"#aaa", letterSpacing:.6, textTransform:"uppercase", marginBottom:10 }}>
                In Sprint — {sprintTickets.length} tickets
              </div>
              {sprintTickets.map(t => (
                <TicketRow key={t.id} ticket={t} sprintId={sprint.id} isInSprint={true} />
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
            <TicketRow key={t.id} ticket={t} sprintId={sprint.id} isInSprint={false} />
          ))}
        </div>
      </main>

      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateTicket}
        />
      )}

      <RetroModal
        isOpen={retroModalOpen}
        report={retroReport}
        sprintName={sprint?.name ?? ''}
        isLoading={retroLoading}
        avgCycleTimeDays={avgCycleTimeDays}
        onClose={() => { setRetroModalOpen(false); setRetroReport(null) }}
        onExport={handleExportTxt}
        onStartNextSprint={handleStartNextSprint}
      />
    </div>
  )
}
