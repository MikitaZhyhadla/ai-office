"use client"
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core"
import { useState } from "react"
import { Topbar } from "@/components/shared/Topbar"
import { KanbanColumn } from "@/components/kanban/KanbanColumn"
import { KanbanCard } from "@/components/kanban/KanbanCard"
import { useAppStore } from "@/store/useAppStore"
import type { KanbanColumn as ColType, Ticket } from "@/types"

const COLUMNS: ColType[] = ["todo", "inprog", "review", "done"]

export default function KanbanPage() {
  const { kanban, moveToKanban, sprints } = useAppStore()
  const sprint = sprints[0]
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)

  const allTickets = Object.values(kanban).flat()

  function handleDragStart(event: DragStartEvent) {
    const ticket = allTickets.find(t => t.id === event.active.id)
    if (ticket) setActiveTicket(ticket)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTicket(null)
    if (!over) return
    const ticket = allTickets.find(t => t.id === active.id)
    if (!ticket) return

    // over.id is either a column key or a ticket id inside a column
    const overId = String(over.id)
    const targetCol = (COLUMNS as string[]).includes(overId)
      ? (overId as ColType)
      : COLUMNS.find(col => kanban[col].some(t => t.id === overId))

    if (targetCol && targetCol !== ticket.status) {
      moveToKanban(ticket, targetCol)
    }
  }

  const sprintTicketIds = new Set(sprint.ticketIds)
  const totalSP = allTickets
    .filter(t => sprintTicketIds.has(t.id))
    .reduce((sum, t) => sum + t.points, 0)

  return (
    <div style={{ background:"#f0eff7", minHeight:"100vh" }}>
      <Topbar />
      <main style={{ padding:22, maxWidth:1100, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <span style={{ fontSize:16, fontWeight:600 }}>Kanban Board</span>
          <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20,
            background:"#EEEDFE", color:"#3C3489" }}>
            {sprint.name}
          </span>
          <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20,
            background:"#f0eff7", color:"#534AB7", border:"1px solid #e0e0f0" }}>
            {totalSP} SP committed
          </span>
        </div>

        <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {COLUMNS.map(col => (
              <KanbanColumn key={col} id={col} tickets={kanban[col]} />
            ))}
          </div>
          <DragOverlay>
            {activeTicket ? <KanbanCard ticket={activeTicket} /> : null}
          </DragOverlay>
        </DndContext>
      </main>
    </div>
  )
}
