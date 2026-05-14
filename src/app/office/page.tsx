"use client"
import { Topbar } from "@/components/shared/Topbar"
import { PixelOffice } from "@/components/office/PixelOffice"
import { useAppStore } from "@/store/useAppStore"

export default function OfficePage() {
  const agents = useAppStore(s => s.agents)
  return (
    <div style={{ background:"#0d1117", minHeight:"100vh" }}>
      <Topbar />
      <main style={{ padding:22, display:"flex", flexDirection:"column", alignItems:"center" }}>
        <div style={{ fontSize:15, fontWeight:600, color:"#a090f0", marginBottom:20,
          letterSpacing:2, textTransform:"uppercase" }}>
          AI Office
        </div>
        <PixelOffice agents={agents} />
        <div style={{ display:"flex", gap:24, marginTop:16, fontSize:11, color:"#6666aa" }}>
          <span>Go to <span style={{ color:"#a090f0" }}>Pipeline</span> tab and analyze a requirement to see agents activate</span>
        </div>
      </main>
    </div>
  )
}
