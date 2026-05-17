"use client"
import { DndContext, closestCenter, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core"
import { useState } from "react"
import { Topbar } from "@/components/shared/Topbar"
import { KanbanColumn } from "@/components/kanban/KanbanColumn"
import { KanbanCard } from "@/components/kanban/KanbanCard"
import { SprintControls } from "@/components/kanban/SprintControls"
import { DoDChecklistModal } from "@/components/shared/DoDChecklistModal"
import { useAppStore } from "@/store/useAppStore"
import { useAuthStore } from "@/store/useAuthStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { qaTestCaseAgent } from "@/agents/qaTestCaseAgent"
import type { KanbanColumn as ColType, Ticket } from "@/types"

const COLUMNS: ColType[] = ["todo", "inprog", "review", "done"]

export default function KanbanPage() {
  const { kanban, moveToKanban, sprints, setTestCases, setGeneratingTc,
          setAgentStatus, appendTicketHistory } = useAppStore()
  const currentUser = useAuthStore(s => s.currentUser)
  const activeSprint = sprints.find(s => s.status === 'active') ?? null
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null)
  const [dodModalOpen, setDodModalOpen] = useState(false)
  const [pendingDoneTicket, setPendingDoneTicket] = useState<Ticket | null>(null)

  const allTickets = Object.values(kanban).flat()
  const sprintTicketIds = activeSprint ? new Set(activeSprint.ticketIds) : new Set<string>()
  const myKanban = {
    todo:   kanban.todo.filter(t => t.userId === currentUser?.username && sprintTicketIds.has(t.id)),
    inprog: kanban.inprog.filter(t => t.userId === currentUser?.username && sprintTicketIds.has(t.id)),
    review: kanban.review.filter(t => t.userId === currentUser?.username && sprintTicketIds.has(t.id)),
    done:   kanban.done.filter(t => t.userId === currentUser?.username && sprintTicketIds.has(t.id)),
  }

  async function triggerQATestCases(ticket: Ticket) {
    setAgentStatus('qa1', 'thinking', `Generating test cases for ${ticket.id}`)
    setGeneratingTc(ticket.id, true)

    try {
      const cases = await qaTestCaseAgent(
        ticket.id,
        ticket.title,
        ticket.data,
        ticket.format
      )

      setTestCases(ticket.id, cases)
      moveToKanban(ticket, 'review')
      appendTicketHistory(ticket.id, {
        actor:     'QA Lead',
        actorRole: 'qa',
        message:   `Generated ${cases.length} test cases (positive, negative, boundary) — ticket moved to In Review`,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      console.error('QA test case generation failed:', err)
      appendTicketHistory(ticket.id, {
        actor:     'QA Lead',
        actorRole: 'qa',
        message:   'Test case generation failed — ticket remains In Progress',
        timestamp: new Date().toISOString(),
      })
    } finally {
      setGeneratingTc(ticket.id, false)
      setAgentStatus('qa1', 'idle')
    }
  }

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
      if (targetCol === 'done') {
        setPendingDoneTicket(ticket)
        setDodModalOpen(true)
        return
      }

      moveToKanban(ticket, targetCol)

      if (targetCol === 'inprog') {
        const updatedTicket = { ...ticket, status: 'inprog' as const }
        const existingCases = useAppStore.getState().testCases[ticket.id] ?? []
        if (existingCases.length === 0) {
          triggerQATestCases(updatedTicket)
        }
      }
    }
  }

  function handleDodConfirm(checkedItemIds: string[]) {
    if (!pendingDoneTicket) return
    const dodItems = useSettingsStore.getState().dodItems
    const checkedLabels = dodItems
      .filter(item => checkedItemIds.includes(item.id))
      .map(item => item.label)
    moveToKanban(pendingDoneTicket, 'done')
    appendTicketHistory(pendingDoneTicket.id, {
      timestamp: new Date().toISOString(),
      actor: "Human",
      actorRole: "human",
      message: `Definition of Done completed — checked: ${checkedLabels.join(', ')}`,
    })
    setDodModalOpen(false)
    setPendingDoneTicket(null)
  }

  function handleDodCancel() {
    setDodModalOpen(false)
    setPendingDoneTicket(null)
  }

  const totalSP = Object.values(myKanban).flat()
    .reduce((sum, t) => sum + t.points, 0)

  return (
    <div style={{ background:"#f0eff7", minHeight:"100vh" }}>
      <Topbar />
      <main style={{ padding:22, maxWidth:1100, margin:"0 auto" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <span style={{ fontSize:16, fontWeight:600 }}>Kanban Board</span>
          {activeSprint && (
            <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20,
              background:"#EEEDFE", color:"#3C3489" }}>
              {activeSprint.name}
            </span>
          )}
          <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20,
            background:"#f0eff7", color:"#534AB7", border:"1px solid #e0e0f0" }}>
            {totalSP} SP committed
          </span>
        </div>

        <SprintControls />

        <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
            {COLUMNS.map(col => (
              <KanbanColumn key={col} id={col} tickets={myKanban[col]} />
            ))}
          </div>
          <DragOverlay>
            {activeTicket ? <KanbanCard ticket={activeTicket} /> : null}
          </DragOverlay>
        </DndContext>
      </main>

      {dodModalOpen && pendingDoneTicket && (
        <DoDChecklistModal
          isOpen={dodModalOpen}
          ticketId={pendingDoneTicket.id}
          ticketTitle={pendingDoneTicket.title}
          ticketPoints={pendingDoneTicket.points}
          onConfirm={handleDodConfirm}
          onCancel={handleDodCancel}
        />
      )}
    </div>
  )
}
