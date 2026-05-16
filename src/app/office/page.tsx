"use client"
import { useState, useEffect } from "react"
import { Topbar } from "@/components/shared/Topbar"
import { PixelOffice } from "@/components/office/PixelOffice"
import { useAppStore } from "@/store/useAppStore"

export default function OfficePage() {
  const agents = useAppStore(s => s.agents)
  const kanban = useAppStore(s => s.kanban)
  const kanbanCounts = {
    todo:   (kanban.todo   ?? []).length,
    inprog: (kanban.inprog ?? []).length,
    review: (kanban.review ?? []).length,
    done:   (kanban.done   ?? []).length,
  }

  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const toggleBtn = (
    <button
      onClick={() => setIsFullscreen(f => !f)}
      style={{
        position:'absolute', top:12, right:12,
        background:'rgba(13,13,26,0.85)', color:'#a090f0',
        border:'1px solid #3a3a6a', borderRadius:6,
        padding:'5px 10px', fontSize:11, cursor:'pointer',
        zIndex:1001, fontFamily:'inherit',
      }}
    >
      {isFullscreen ? '✕ Exit' : '⛶ Fullscreen'}
    </button>
  )

  if (isFullscreen) {
    return (
      <div style={{
        position:'fixed', inset:0, zIndex:999,
        background:'#0d0d1a',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {toggleBtn}
        <div style={{
          width:'100%', height:'100%',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <div style={{
            width:'min(100vw, calc(100vh * 9 / 5))',
            maxWidth:'100vw', maxHeight:'100vh',
          }}>
            <PixelOffice agents={agents} kanbanCounts={kanbanCounts} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background:'#0d1117', minHeight:'100vh' }}>
      <Topbar />
      <main style={{ padding:22, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div style={{ fontSize:15, fontWeight:600, color:'#a090f0', marginBottom:20,
          letterSpacing:2, textTransform:'uppercase' }}>
          AI Office
        </div>
        <div style={{ position:'relative', maxWidth:920, width:'100%', margin:'0 auto',
          borderRadius:10, overflow:'visible' }}>
          {toggleBtn}
          <PixelOffice agents={agents} kanbanCounts={kanbanCounts} />
        </div>
        <div style={{ display:'flex', gap:24, marginTop:16, fontSize:11, color:'#6666aa' }}>
          <span>Go to <span style={{ color:'#a090f0' }}>Pipeline</span> tab to see agents activate</span>
        </div>
      </main>
    </div>
  )
}
