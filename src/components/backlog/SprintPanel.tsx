"use client"
import type { Sprint, Ticket } from "@/types"

interface Props {
  sprint: Sprint
  tickets: Ticket[]
}

export function SprintPanel({ sprint, tickets }: Props) {
  const totalPoints = tickets.reduce((sum, t) => sum + t.points, 0)
  const velocityTarget = 21
  const progress = Math.min(100, Math.round(totalPoints / velocityTarget * 100))

  return (
    <div style={{ background:"#fff", border:"1.5px solid #EF9F27", borderRadius:10, padding:14, marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:13, fontWeight:600 }}>🏃 {sprint.name}</span>
          <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20, background:"#EAF3DE", color:"#27500A" }}>
            Active
          </span>
        </div>
        <div style={{ fontSize:11, color:"#aaa" }}>
          {sprint.startDate} – {sprint.endDate} · velocity {velocityTarget} SP
        </div>
      </div>
      <div style={{ height:4, background:"#ededf7", borderRadius:2, overflow:"hidden", marginBottom:8 }}>
        <div style={{ height:"100%", background:"#534AB7", borderRadius:2, width:`${progress}%` }} />
      </div>
      <div style={{ display:"flex", gap:16, fontSize:11, color:"#aaa" }}>
        <span>Committed: <strong style={{ color:"#534AB7" }}>{totalPoints} SP</strong></span>
        <span>Remaining: <strong style={{ color:"#534AB7" }}>{Math.max(0, velocityTarget - totalPoints)} SP</strong></span>
        <span>Progress: <strong style={{ color:"#534AB7" }}>{progress}%</strong></span>
      </div>
      {tickets.length === 0 && (
        <div style={{ fontSize:12, color:"#ccc", marginTop:8 }}>No tickets in sprint yet</div>
      )}
    </div>
  )
}
