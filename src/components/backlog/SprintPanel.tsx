"use client"
import type { Sprint, Ticket } from "@/types"

interface Props {
  sprint:          Sprint
  tickets:         Ticket[]
  onCloseSprint?:  () => void
  retroLoading?:   boolean
}

export function SprintPanel({ sprint, tickets, onCloseSprint, retroLoading }: Props) {
  const totalPoints = tickets.reduce((sum, t) => sum + t.points, 0)
  const velocityTarget = 21
  const progress = Math.min(100, Math.round(totalPoints / velocityTarget * 100))
  const hasDoneTickets = tickets.some(t => t.status === 'done')
  const isClosed = sprint.status === 'closed'

  return (
    <div style={{ background:"#fff", border:"1.5px solid #EF9F27", borderRadius:10, padding:14, marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:13, fontWeight:600 }}>🏃 {sprint.name}</span>
          <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20,
            background: isClosed ? "#f0f0f7" : "#EAF3DE",
            color: isClosed ? "#666" : "#27500A",
          }}>
            {isClosed ? 'Closed' : 'Active'}
          </span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ fontSize:11, color:"#aaa" }}>
            {sprint.startDate} – {sprint.endDate} · velocity {velocityTarget} SP
          </div>
          {!isClosed && hasDoneTickets && onCloseSprint && (
            <button
              onClick={onCloseSprint}
              disabled={retroLoading}
              style={{
                background: "#534AB7",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "7px 14px",
                fontSize: 12,
                fontWeight: 500,
                cursor: retroLoading ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "inherit",
                opacity: retroLoading ? 0.7 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {retroLoading ? (
                <>
                  <span style={{
                    width: 11, height: 11, border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    display: "inline-block",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  Generating…
                </>
              ) : (
                <>📊 Close Sprint &amp; Generate Retro</>
              )}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
