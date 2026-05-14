"use client"
import { useAppStore } from "@/store/useAppStore"

export function PipelineStages() {
  const pipeline = useAppStore(s => s.pipeline)
  const stages = [
    { label: "BA Analysis",  key: "ba",     color: "#534AB7" },
    { label: "Human Review", key: "review", color: "#854F0B" },
    { label: "QA + Dev",     key: "qa",     color: "#0F6E56" },
    { label: "Backlog",      key: "done",   color: "#27500A" },
  ] as const
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:20 }}>
      {stages.map(s => (
        <div key={s.key} style={{ background:"#fff", border:"1px solid #e8e8f0",
                                  borderRadius:8, padding:"12px 14px" }}>
          <div style={{ fontSize:10, color:"#aaa" }}>Stage</div>
          <div style={{ fontSize:12, fontWeight:500, margin:"2px 0 8px" }}>{s.label}</div>
          <div style={{ fontSize:26, fontWeight:600, color:s.color }}>
            {pipeline[s.key]}
          </div>
        </div>
      ))}
    </div>
  )
}
