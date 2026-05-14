"use client"
import { useAppStore } from "@/store/useAppStore"

export function ExportButton() {
  const tickets = useAppStore(s => s.tickets)

  async function handleExportXLSX() {
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickets }),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ai-office-tickets.xlsx"
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleExportJSON() {
    const blob = new Blob([JSON.stringify(tickets, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ai-office-tickets.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display:"flex", gap:8 }}>
      <button onClick={handleExportXLSX}
        style={{ background:"none", border:"1px solid #ddd", color:"#666", borderRadius:8,
          padding:"8px 14px", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
        ↓ Export XLSX
      </button>
      <button onClick={handleExportJSON}
        style={{ background:"none", border:"1px solid #ddd", color:"#666", borderRadius:8,
          padding:"8px 14px", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
        ↓ Export JSON
      </button>
    </div>
  )
}
