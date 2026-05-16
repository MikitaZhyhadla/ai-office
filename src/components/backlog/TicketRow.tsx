"use client"
import { useAppStore } from "@/store/useAppStore"
import type { Ticket } from "@/types"

interface Props {
  ticket: Ticket
  sprintId: string
  isInSprint: boolean
}

export function TicketRow({ ticket, sprintId, isInSprint }: Props) {
  const toggleSprint      = useAppStore(s => s.toggleSprint)
  const setSelectedTicket = useAppStore(s => s.setSelectedTicket)
  const priorityColor = ticket.priority === "high" ? "#E24B4A" : ticket.priority === "medium" ? "#EF9F27" : "#639922"

  return (
    <div onClick={() => setSelectedTicket(ticket.id)}
         style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0",
                  borderBottom:"1px solid #f0f0f7", cursor:"pointer" }}
         onMouseEnter={e => (e.currentTarget.style.background = "#fafafe")}
         onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      <div style={{ width:3, height:30, borderRadius:2, background:priorityColor, flexShrink:0 }} />
      <div style={{ fontSize:11, color:"#aaa", width:68, fontFamily:"monospace", flexShrink:0 }}>{ticket.id}</div>
      <div style={{ fontSize:13, flex:1 }}>{ticket.title}</div>
      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
        <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20,
          background: ticket.format==="gwt" ? "#EEEDFE" : "#E1F5EE",
          color: ticket.format==="gwt" ? "#3C3489" : "#085041" }}>
          {ticket.format.toUpperCase()}
        </span>
        <span style={{ background:"#f0eff7", border:"1px solid #e0e0f0", borderRadius:5,
          fontSize:10, padding:"2px 8px", color:"#534AB7", fontWeight:600 }}>
          {ticket.points} SP
        </span>
        <button onClick={e => { e.stopPropagation(); toggleSprint(ticket.id, sprintId) }}
          style={{ fontSize:11, padding:"4px 12px", borderRadius:20, cursor:"pointer", fontFamily:"inherit",
            background: isInSprint ? "#EEEDFE" : "none",
            border: isInSprint ? "1px solid #AFA9EC" : "1px solid #ddd",
            color: isInSprint ? "#3C3489" : "#888" }}>
          {isInSprint ? "In sprint" : "+ Sprint"}
        </button>
      </div>
    </div>
  )
}
