"use client"
import { useState } from "react"
import { useAppStore } from "@/store/useAppStore"
import { useAuthStore } from "@/store/useAuthStore"
import { Topbar } from "@/components/shared/Topbar"
import { SprintPanel } from "@/components/backlog/SprintPanel"
import { TicketRow } from "@/components/backlog/TicketRow"
import { ExportButton } from "@/components/shared/ExportButton"
import { CreateTicketModal } from "@/components/backlog/CreateTicketModal"
import type { Ticket } from "@/types"

export default function BacklogPage() {
  const { tickets, sprints, addTicket } = useAppStore()
  const currentUser = useAuthStore(s => s.currentUser)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const sprint = sprints[0]
  const myTickets = tickets.filter(t => t.userId === currentUser?.username)
  const sprintTickets = myTickets.filter(t => sprint.ticketIds.includes(t.id))
  const backlogTickets = myTickets.filter(t => !sprint.ticketIds.includes(t.id))

  function handleCreateTicket(ticket: Ticket) {
    addTicket(ticket)
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
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateTicket}
        />
      )}
    </div>
  )
}
