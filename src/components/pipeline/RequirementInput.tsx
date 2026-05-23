"use client"
import { useState, useEffect } from "react"
import type { Format } from "@/types"

interface Props {
  onSubmit: (text: string, format: Format) => void
  loading: boolean
  onTextChange?: (text: string, format: Format) => void
  initialText?: string
  initialFormat?: Format
}

export function RequirementInput({ onSubmit, loading, onTextChange, initialText, initialFormat }: Props) {
  const [text, setText] = useState(initialText ?? "")
  const [format, setFormat] = useState<Format>(initialFormat ?? "gwt")

  useEffect(() => {
    if (initialText === '') {
      setText('')
    }
  }, [initialText])
  return (
    <div style={{ background:"#fff", border:"1px solid #e8e8f0", borderRadius:10, padding:16, marginBottom:16 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:13, fontWeight:500 }}>New requirement</span>
        <div style={{ display:"flex", background:"#f0eff7", borderRadius:6, padding:2 }}>
          {(["gwt","classic"] as Format[]).map(f => (
            <button key={f} onClick={() => {
              setFormat(f)
              onTextChange?.(text, f)
            }}
              style={{ fontSize:11, padding:"5px 12px", borderRadius:5, border:"none", cursor:"pointer",
                       background: format===f ? "#fff" : "none",
                       color: format===f ? "#534AB7" : "#888",
                       fontWeight: format===f ? 500 : 400 }}>
              {f === "gwt" ? "Given / When / Then" : "Classic"}
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={text} onChange={e => {
          setText(e.target.value)
          onTextChange?.(e.target.value, format)
        }}
        placeholder="Describe the feature or user story..."
        rows={4}
        style={{ width:"100%", background:"#f8f8fc", border:"1px solid #e8e8f0", borderRadius:8,
                 padding:10, fontSize:12, lineHeight:1.6, resize:"none", outline:"none" }}
      />
      <button
        onClick={() => text.trim() && onSubmit(text.trim(), format)}
        disabled={loading || !text.trim()}
        style={{ marginTop:12, background: loading ? "#ccc" : "#534AB7", color:"#fff",
                 border:"none", borderRadius:8, padding:"9px 18px", fontSize:12,
                 fontWeight:500, cursor: loading ? "not-allowed" : "pointer",
                 display:"inline-flex", alignItems:"center", gap:6 }}>
        {loading ? (
          <>
            <svg style={{ animation:"spin 0.8s linear infinite", width:14, height:14, flexShrink:0 }}
                 viewBox="0 0 24 24" fill="none">
              <circle style={{ opacity:0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path style={{ opacity:0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            Analyzing...
          </>
        ) : "▶ Analyze with BA Agents"}
      </button>
    </div>
  )
}
