"use client"
import { useState, useEffect, useRef } from "react"
import { useAppStore } from "@/store/useAppStore"
import type { Ticket, MoSCoWCategory } from "@/types"
import { MoSCoWBadge, MOSCOW_CONFIG } from "@/components/shared/MoSCoWBadge"

interface Props {
  ticket: Ticket
  sprintId: string
  isInSprint: boolean
}

const MOSCOW_OPTIONS: MoSCoWCategory[] = ['must', 'should', 'could', 'wont']

export function TicketRow({ ticket, sprintId, isInSprint }: Props) {
  const toggleSprint      = useAppStore(s => s.toggleSprint)
  const setSelectedTicket = useAppStore(s => s.setSelectedTicket)
  const updateTicket      = useAppStore(s => s.updateTicket)

  const priorityColor = ticket.priority === "high" ? "#E24B4A" : ticket.priority === "medium" ? "#EF9F27" : "#639922"

  const isBug = ticket.ticketType === 'bug'
  const severityColor = ticket.severity === 'critical' ? "#791F1F" : ticket.severity === 'major' ? "#854F0B" : "#666"
  const severityBg    = ticket.severity === 'critical' ? "#FCEBEB" : ticket.severity === 'major' ? "#FAEEDA" : "#f0f0f0"

  const [showOverride, setShowOverride] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showOverride) return
    function handleMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowOverride(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [showOverride])

  function handleBadgeClick(e: React.MouseEvent) {
    e.stopPropagation()
    setShowOverride(v => !v)
  }

  function handleOverrideSelect(e: React.MouseEvent, category: MoSCoWCategory) {
    e.stopPropagation()
    updateTicket(ticket.id, { moscow: category })
    setShowOverride(false)
  }

  return (
    <div onClick={() => setSelectedTicket(ticket.id)}
         style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0",
                  borderBottom:"1px solid #f0f0f7", cursor:"pointer" }}
         onMouseEnter={e => (e.currentTarget.style.background = "#fafafe")}
         onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
      <div style={{ width:3, height:30, borderRadius:2, background:priorityColor, flexShrink:0 }} />
      <div style={{ fontSize:11, color:"#aaa", width:68, fontFamily:"monospace", flexShrink:0 }}>{ticket.id}</div>
      <div style={{ fontSize:13, flex:1, display:"flex", alignItems:"center", gap:7, flexWrap:"wrap" }}>
        <span style={{ fontSize:10, fontWeight:600,
                       background: isBug ? "#FCEBEB" : "#DBEAFE",
                       color: isBug ? "#791F1F" : "#1e40af",
                       padding:"1px 7px", borderRadius:10, flexShrink:0 }}>
          {isBug ? '🐛 Bug' : 'User Story'}
        </span>
        {ticket.title}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
        {isBug && ticket.severity && (
          <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20,
            background: severityBg, color: severityColor }}>
            {ticket.severity.charAt(0).toUpperCase() + ticket.severity.slice(1)}
          </span>
        )}
        {!isBug && (
          <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20,
            background: ticket.format==="gwt" ? "#EEEDFE" : "#E1F5EE",
            color: ticket.format==="gwt" ? "#3C3489" : "#085041" }}>
            {ticket.format.toUpperCase()}
          </span>
        )}
        {isInSprint && (
          <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20,
            background:
              ticket.status === 'todo'   ? '#f0f0f0' :
              ticket.status === 'inprog' ? '#DBEAFE' :
              ticket.status === 'review' ? '#FAEEDA' :
              ticket.status === 'done'   ? '#EAF3DE' : '#f0f0f0',
            color:
              ticket.status === 'todo'   ? '#555' :
              ticket.status === 'inprog' ? '#1e40af' :
              ticket.status === 'review' ? '#854F0B' :
              ticket.status === 'done'   ? '#27500A' : '#555',
          }}>
            {ticket.status === 'todo'   ? 'Todo' :
             ticket.status === 'inprog' ? 'In Progress' :
             ticket.status === 'review' ? 'Review' :
             ticket.status === 'done'   ? 'Done' : ticket.status}
          </span>
        )}
        <span style={{ background:"#f0eff7", border:"1px solid #e0e0f0", borderRadius:5,
          fontSize:10, padding:"2px 8px", color:"#534AB7", fontWeight:600 }}>
          {ticket.points} SP
        </span>

        {/* MoSCoW badge with override dropdown */}
        {ticket.moscow && (
          <div ref={dropdownRef} style={{ position:"relative" }}>
            <div onClick={handleBadgeClick} style={{ cursor:"pointer" }}>
              <MoSCoWBadge category={ticket.moscow} justification={ticket.moscowJustification} />
            </div>
            {showOverride && (
              <div style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 4px)",
                background: "#fff",
                border: "1px solid #e8e8f0",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                zIndex: 50,
                minWidth: 100,
                padding: "4px 0",
              }}>
                {MOSCOW_OPTIONS.map(cat => (
                  <div
                    key={cat}
                    onClick={e => handleOverrideSelect(e, cat)}
                    style={{
                      padding: "6px 12px",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      background: ticket.moscow === cat ? "#f8f8fc" : "transparent",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f8f8fc")}
                    onMouseLeave={e => (e.currentTarget.style.background = ticket.moscow === cat ? "#f8f8fc" : "transparent")}
                  >
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: MOSCOW_CONFIG[cat].color,
                      flexShrink: 0,
                    }} />
                    {MOSCOW_CONFIG[cat].label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
