"use client"
import type { RequirementData, GWTRequirement, ClassicRequirement } from "@/types"
import type { QAVerdict } from "@/agents/qaAgent"
import type { DevVerdict } from "@/agents/devAgent"

interface Props {
  data: RequirementData
  qaVerdict: QAVerdict | null
  devVerdict: DevVerdict | null
  onApprove: () => void
  onRequestChanges: () => void
  revisionCount?: number
}

export function ReviewCard({ data, qaVerdict, devVerdict, onApprove, onRequestChanges, revisionCount }: Props) {
  const priorityColor = data.priority === "high" ? "#791F1F" : data.priority === "medium" ? "#633806" : "#27500A"
  const priorityBg = data.priority === "high" ? "#FCEBEB" : data.priority === "medium" ? "#FAEEDA" : "#EAF3DE"

  return (
    <div style={{ background:"#fff", border:"1.5px solid #e0ddf7", borderRadius:10, padding:16, marginBottom:16 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        <span style={{ fontSize:10, fontWeight:600, padding:"3px 9px", borderRadius:20, background:"#FAEEDA", color:"#633806" }}>
          Awaiting review
        </span>
        <span style={{ fontSize:14, fontWeight:600, flex:1 }}>{data.title}</span>
        <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20, background:priorityBg, color:priorityColor }}>
          {data.priority}
        </span>
        <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20, background:"#f0eff7", color:"#534AB7", border:"1px solid #ddd" }}>
          {data.story_points} SP
        </span>
        <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20, background:"#EEEDFE", color:"#3C3489" }}>
          {data.format.toUpperCase()}
        </span>
        {revisionCount != null && revisionCount > 0 && (
          <span style={{ fontSize:10, fontWeight:700, padding:"3px 9px", borderRadius:20, background:"#FFF3DC", color:"#854F0B", border:"1px solid #e8c97a" }}>
            Revision #{revisionCount}
          </span>
        )}
      </div>

      {data.format === "gwt" && (data as GWTRequirement).scenarios.map((sc, i) => (
        <div key={i}>
          <div style={{ fontSize:11, fontWeight:500, color:"#888", margin:"10px 0 5px" }}>Scenario {i+1}: {sc.name}</div>
          <div style={{ background:"#f8f8fc", borderLeft:"3px solid #7F77DD", borderRadius:"0 8px 8px 0",
                        padding:"12px 15px", fontSize:12, lineHeight:2, fontFamily:"monospace" }}>
            <span style={{ color:"#0F6E56", fontWeight:700 }}>Given </span>{sc.given}<br/>
            <span style={{ color:"#854F0B", fontWeight:700 }}>When </span>{sc.when}<br/>
            <span style={{ color:"#3B6D11", fontWeight:700 }}>Then </span>{sc.then}
          </div>
        </div>
      ))}

      {data.format === "classic" && (() => {
        const c = data as ClassicRequirement
        return (
          <div style={{ fontSize:12, lineHeight:1.8 }}>
            <div style={{ marginBottom:8 }}><strong>Objective:</strong> {c.objective}</div>
            <div><strong>Functional Requirements:</strong></div>
            {c.functional_requirements.map((fr, i) => <div key={i} style={{ color:"#555", paddingLeft:12 }}>• {fr}</div>)}
            <div style={{ marginTop:8 }}><strong>Acceptance Criteria:</strong></div>
            {c.acceptance_criteria.map((ac, i) => <div key={i} style={{ color:"#555", paddingLeft:12 }}>• {ac}</div>)}
          </div>
        )
      })()}

      {(qaVerdict || devVerdict) && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:12 }}>
          {qaVerdict && (
            <div style={{ background:"#f8fff8", border:"1px solid #b8e8b8", borderRadius:8, padding:10 }}>
              <div style={{ fontSize:10, fontWeight:600, color:"#aaa", textTransform:"uppercase", marginBottom:4 }}>QA Verdict</div>
              <div style={{ fontSize:11, color:"#555" }}>{qaVerdict.summary}</div>
            </div>
          )}
          {devVerdict && (
            <div style={{ background:"#f8fff8", border:"1px solid #b8e8b8", borderRadius:8, padding:10 }}>
              <div style={{ fontSize:10, fontWeight:600, color:"#aaa", textTransform:"uppercase", marginBottom:4 }}>Dev Verdict</div>
              <div style={{ fontSize:11, color:"#555" }}>{devVerdict.summary}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ display:"flex", gap:8, marginTop:14 }}>
        <button onClick={onApprove}
          style={{ background:"#3B6D11", color:"#EAF3DE", border:"none", borderRadius:8,
                   padding:"9px 18px", fontSize:12, fontWeight:500, cursor:"pointer" }}>
          ✓ Approve & add to backlog
        </button>
        <button onClick={onRequestChanges}
          style={{ background:"none", border:"1px solid #ddd", color:"#666", borderRadius:8,
                   padding:"9px 14px", fontSize:12, cursor:"pointer" }}>
          ✎ Request changes
        </button>
      </div>
    </div>
  )
}
