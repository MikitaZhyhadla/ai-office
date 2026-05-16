"use client"
import { useRef, useEffect } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useAppStore } from "@/store/useAppStore"
import type { Ticket } from "@/types"

export function KanbanCard({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ticket.id })
  const setSelectedTicket = useAppStore(s => s.setSelectedTicket)
  const generatingTcFor   = useAppStore(s => s.generatingTcFor)
  const testCases         = useAppStore(s => s.testCases)
  const isGenerating      = generatingTcFor.includes(ticket.id)
  const hasCases          = (testCases[ticket.id]?.length ?? 0) > 0
  const style = { transform: CSS.Transform.toString(transform), transition }
  const priorityColor = ticket.priority === "high" ? "#E24B4A" : ticket.priority === "medium" ? "#EF9F27" : "#639922"
  const priorityBg = ticket.priority === "high" ? "#FCEBEB" : ticket.priority === "medium" ? "#FAEEDA" : "#EAF3DE"

  // Track whether a drag occurred during the current pointer interaction
  const didDragRef = useRef(false)
  useEffect(() => {
    if (isDragging) didDragRef.current = true
  }, [isDragging])

  // Intercept onPointerDown from listeners to reset the drag flag
  const enhancedListeners = {
    ...listeners,
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      didDragRef.current = false
      ;(listeners as Record<string, (e: React.PointerEvent<HTMLDivElement>) => void>).onPointerDown?.(e)
    },
  }

  return (
    <div ref={setNodeRef}
         style={{ ...style, background:"#fff", border:"1px solid #e8e8f0",
                  borderRadius:8, padding:10, marginBottom:7,
                  cursor: isDragging ? "grabbing" : "grab",
                  opacity: isDragging ? 0.5 : 1 }}
         {...attributes}
         {...enhancedListeners}
         onClick={() => { if (!didDragRef.current) setSelectedTicket(ticket.id) }}
    >
      <div style={{ fontSize:12, fontWeight:500, marginBottom:7, lineHeight:1.4 }}>{ticket.title}</div>
      <div style={{ display:"flex", gap:5, marginBottom:5 }}>
        <span style={{ fontSize:10, fontWeight:500, padding:"2px 7px", borderRadius:20,
          background: ticket.format==="gwt" ? "#EEEDFE" : "#E1F5EE",
          color: ticket.format==="gwt" ? "#3C3489" : "#085041" }}>
          {ticket.format.toUpperCase()}
        </span>
        <span style={{ fontSize:10, background:"#f0eff7", border:"1px solid #e0e0f0",
          borderRadius:4, padding:"1px 7px", color:"#534AB7", fontWeight:600 }}>
          {ticket.points} SP
        </span>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:10, color:"#aaa", fontFamily:"monospace" }}>{ticket.id}</span>
        <span style={{ fontSize:10, fontWeight:500, padding:"2px 7px", borderRadius:20,
          background:priorityBg, color:priorityColor }}>
          {ticket.priority}
        </span>
      </div>

      {isGenerating && (
        <div style={{
          marginTop: 6,
          padding: '3px 8px',
          background: '#E1F5EE',
          border: '1px solid #5DCAA5',
          borderRadius: 4,
          fontSize: 10,
          color: '#0F6E56',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
          Generating test cases...
        </div>
      )}

      {!isGenerating && hasCases && ticket.status !== 'todo' && (
        <div style={{
          marginTop: 6,
          padding: '2px 8px',
          background: '#E1F5EE',
          border: '1px solid #0F6E56',
          borderRadius: 4,
          fontSize: 10,
          color: '#0F6E56',
          fontWeight: 600,
        }}>
          🔬 {testCases[ticket.id].length} test cases ready
        </div>
      )}
    </div>
  )
}
