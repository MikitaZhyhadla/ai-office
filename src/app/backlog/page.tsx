"use client"
import { useAppStore } from "@/store/useAppStore"
import { Topbar } from "@/components/shared/Topbar"
import { SprintPanel } from "@/components/backlog/SprintPanel"
import { TicketRow } from "@/components/backlog/TicketRow"
import { ExportButton } from "@/components/shared/ExportButton"

export default function BacklogPage() {
  const { tickets, sprints } = useAppStore()
  const sprint = sprints[0]
  const sprintTickets = tickets.filter(t => sprint.ticketIds.includes(t.id))
  const backlogTickets = tickets.filter(t => !sprint.ticketIds.includes(t.id))

  return (
    <div style={{ background:"#f0eff7", minHeight:"100vh" }}>
      <Topbar />
      <main style={{ padding:22, maxWidth:900, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <span style={{ fontSize:16, fontWeight:600 }}>Product Backlog</span>
          <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20, background:"#EEEDFE", color:"#3C3489" }}>
            {tickets.length} tickets
          </span>
          <div style={{ marginLeft:"auto" }}>
            <ExportButton />
          </div>
        </div>

        <SprintPanel sprint={sprint} tickets={sprintTickets} />

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
    </div>
  )
}
