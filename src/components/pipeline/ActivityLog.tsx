"use client"
import { useAppStore } from "@/store/useAppStore"

const tagStyle = (role: string): React.CSSProperties => ({
  fontSize:10, fontWeight:600, padding:"1px 7px", borderRadius:4,
  background: role==="ba" ? "#EEEDFE" : role==="qa" ? "#E1F5EE" : role==="dev" ? "#FAEEDA" : role==="translator" ? "#f0f8ff" : "#f0f0f0",
  color: role==="ba" ? "#3C3489" : role==="qa" ? "#085041" : role==="dev" ? "#633806" : role==="translator" ? "#1a6fa0" : "#888",
})

export function ActivityLog() {
  const log = useAppStore(s => s.log)
  return (
    <div style={{ background:"#fff", border:"1px solid #e8e8f0", borderRadius:10, padding:14, maxHeight:220, overflowY:"auto" }}>
      <div style={{ fontSize:10, fontWeight:600, color:"#aaa", letterSpacing:.6, textTransform:"uppercase", marginBottom:10 }}>
        Activity Log
      </div>
      {log.length === 0 && <div style={{ fontSize:12, color:"#ccc" }}>No activity yet</div>}
      {log.map(e => (
        <div key={e.id} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"flex-start" }}>
          <span style={{ fontSize:10, color:"#bbb", fontFamily:"monospace", whiteSpace:"nowrap", paddingTop:2 }}>
            {new Date(e.timestamp).toLocaleTimeString()}
          </span>
          <span style={tagStyle(e.agentRole)}>{e.agentName}</span>
          <span style={{ fontSize:12, color:"#666", lineHeight:1.5 }}>{e.message}</span>
        </div>
      ))}
    </div>
  )
}
