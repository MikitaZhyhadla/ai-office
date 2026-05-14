"use client"
import { useEffect, useRef } from "react"
import type { Agent } from "@/types"

interface Props {
  agents: Agent[]
}

const P = {
  floorA: '#c8a87a', floorB: '#b89868',
  wallTop: '#6a5a8a', wallSide: '#4a3a6a', wallDark: '#2a1a4a',
  deskTop: '#8b6040', deskFront: '#6a4828', deskLight: '#a07850', deskShadow: '#3a2010',
  monBack: '#303040', monScreen: '#1a3a5a', monScreenOn: '#204060', monGlow: '#4090c0',
  kbBase: '#d0ccc0', kbKey: '#b0aca0',
  chairSeat: '#c8a0d8', chairDark: '#9870a8', chairBack: '#b090c8',
  skin1: '#f0c8a0', skin1d: '#d0a870', skin1h: '#ffdcb8',
  skin2: '#c89060', skin2d: '#a06840', skin2h: '#e0b080',
  hairBk: '#201818', hairBr: '#503820', hairBl: '#c8a030', hairGy: '#e0dcd8',
  red: '#d03030', redD: '#a01818',
  blue: '#3050d0', blueD: '#1830a0',
  teal: '#2090a0', tealD: '#106878',
  purple: '#8040c0', purpleD: '#602090',
  leaf: '#3a8040', leafLight: '#5aaa60', leafDark: '#2a6030',
  pot: '#c86040', potDark: '#a04030',
  shelfBody: '#8b6040', shelfDark: '#5a3820',
  bookR: '#d04040', bookB: '#4060c0', bookG: '#40a050', bookY: '#d0a030',
}

export function PixelOffice({ agents }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const agentsRef = useRef(agents)

  useEffect(() => {
    agentsRef.current = agents
  }, [agents])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const cx = canvas.getContext('2d')
    if (!cx) return

    function px(x: number, y: number, w: number, h: number, col: string) {
      cx!.fillStyle = col; cx!.fillRect(x, y, w, h)
    }

    function drawFloor(x: number, y: number, w: number, h: number) {
      px(x, y, w, h, P.floorA)
      for (let fy = y; fy < y + h; fy += 8) { cx!.fillStyle = P.floorB; cx!.fillRect(x, fy, w, 1) }
      for (let fx = x; fx < x + w; fx += 24) { cx!.fillStyle = 'rgba(0,0,0,0.07)'; cx!.fillRect(fx, y, 1, h) }
    }

    function drawDesk(x: number, y: number, w: number, h: number) {
      px(x + 3, y + h + 2, w, 4, 'rgba(0,0,0,0.2)')
      px(x, y + h - 8, w, 8, P.deskFront)
      px(x, y, w, h - 8, P.deskTop)
      px(x, y, w, 3, P.deskLight)
      px(x, y, 3, h - 8, P.deskLight)
      px(x + w - 3, y, 3, h - 8, P.deskShadow)
    }

    function drawMonitor(x: number, y: number, active: boolean, frame: number) {
      px(x + 11, y + 28, 6, 4, P.monBack)
      px(x + 8, y + 30, 12, 3, P.monBack)
      px(x, y, 28, 26, P.monBack)
      px(x + 1, y + 1, 26, 24, '#202030')
      const sc = active && frame % 60 < 30 ? P.monScreenOn : P.monScreen
      px(x + 3, y + 3, 22, 20, sc)
      if (active) {
        const t = frame % 40
        px(x + 5, y + 6, t < 20 ? 10 : 16, 2, '#2a6090')
        px(x + 5, y + 10, 8, 2, '#1a5070')
        if (frame % 20 < 10) px(x + 5 + (t < 20 ? 10 : 16), y + 6, 1, 2, '#80d0ff')
      }
    }

    function drawChair(x: number, y: number) {
      px(x + 2, y + 18, 16, 3, 'rgba(0,0,0,0.18)')
      px(x + 2, y, 12, 10, P.chairBack)
      px(x + 2, y + 8, 12, 2, P.chairDark)
      px(x, y + 10, 16, 8, P.chairSeat)
      px(x, y + 16, 16, 2, P.chairDark)
      px(x + 1, y + 18, 3, 4, P.chairDark)
      px(x + 12, y + 18, 3, 4, P.chairDark)
    }

    function drawPlant(x: number, y: number) {
      px(x + 3, y + 12, 10, 8, P.pot)
      px(x + 3, y + 12, 10, 2, P.potDark)
      px(x + 7, y + 7, 2, 6, P.leafDark)
      px(x + 2, y + 2, 6, 8, P.leaf)
      px(x + 8, y + 4, 6, 7, P.leaf)
      px(x + 5, y, 6, 6, P.leafLight)
    }

    function drawChar(
      x: number, y: number,
      skinC: string, skinD: string, skinH: string,
      hairC: string, shirt: string, shirtD: string,
      state: string, frame: number
    ) {
      const bob = state === 'thinking' ? (frame % 12 < 6 ? 1 : 0) : 0
      const by = y + bob
      px(x + 1, by + 22, 14, 3, 'rgba(0,0,0,0.15)')
      px(x + 3, by + 16, 4, 7, shirtD)
      px(x + 9, by + 16, 4, 7, shirtD)
      px(x + 2, by + 22, 5, 2, P.hairBk)
      px(x + 9, by + 22, 5, 2, P.hairBk)
      px(x + 2, by + 8, 12, 9, shirt)
      px(x + 2, by + 8, 12, 2, 'rgba(255,255,255,0.12)')
      px(x + 2, by + 15, 12, 2, shirtD)
      px(x, by + 9, 3, 7, shirt)
      px(x + 13, by + 9, 3, 7, shirt)
      px(x + 6, by + 5, 4, 4, skinC)
      px(x + 3, by - 2, 10, 10, skinC)
      px(x + 3, by - 2, 10, 2, skinH)
      px(x + 5, by + 1, 2, 2, P.hairBk)
      px(x + 3, by - 2, 10, 4, hairC)
      if (state === 'working') {
        px(x + 2, by + 9, 8, 1, 'rgba(255,255,255,0.3)')
      }
      void skinD
    }

    function drawBubble(x: number, y: number, text: string, color: string) {
      const bw = text.length * 5 + 12
      px(x, y, bw, 16, '#0d0d1a')
      px(x, y, bw, 1, 'rgba(255,255,255,0.2)')
      px(x + 8, y + 16, 4, 2, '#0d0d1a')
      cx!.fillStyle = color
      cx!.font = 'bold 6px "Courier New"'
      cx!.fillText(text, x + 6, y + 10)
    }

    function drawKanbanWall(x: number, y: number) {
      px(x, y, 300, 90, '#0d0d20')
      px(x, y, 300, 2, '#2a2a5a')
      cx!.fillStyle = '#4040aa'
      cx!.font = 'bold 7px "Courier New"'
      cx!.fillText('KANBAN WALL', x + 8, y + 12)
      const cols = ['TODO', 'IN PROG', 'REVIEW', 'DONE']
      const colColors = ['#6060aa', '#8060cc', '#cc8030', '#40aa60']
      cols.forEach((col, i) => {
        const cx2 = x + 8 + i * 72
        px(cx2, y + 16, 66, 68, '#12122a')
        px(cx2, y + 16, 66, 2, colColors[i])
        cx!.fillStyle = colColors[i]
        cx!.font = 'bold 6px "Courier New"'
        cx!.fillText(col, cx2 + 4, y + 27)
        px(cx2 + 4, y + 32, 56, 10, '#1a1a35')
        cx!.fillStyle = '#8888cc'
        cx!.font = '5px "Courier New"'
        cx!.fillText('1 ticket', cx2 + 8, y + 40)
      })
    }

    const agentConfigs = [
      { id: 'alice', x: 60,  y: 120, skin: P.skin2, skinD: P.skin2d, skinH: P.skin2h, hair: P.hairBr, shirt: P.red,    shirtD: P.redD,    label: 'Alice BA' },
      { id: 'bob',   x: 200, y: 120, skin: P.skin1, skinD: P.skin1d, skinH: P.skin1h, hair: P.hairBk, shirt: P.blue,   shirtD: P.blueD,   label: 'Bob BA' },
      { id: 'qa1',   x: 340, y: 120, skin: P.skin1, skinD: P.skin1d, skinH: P.skin1h, hair: P.hairBl, shirt: P.teal,   shirtD: P.tealD,   label: 'QA Lead' },
      { id: 'dev1',  x: 480, y: 120, skin: P.skin1, skinD: P.skin1d, skinH: P.skin1h, hair: P.hairGy, shirt: P.purple, shirtD: P.purpleD, label: 'Dev Lead' },
    ]

    function draw() {
      const frame = frameRef.current
      cx!.clearRect(0, 0, 680, 380)

      cx!.fillStyle = '#0d1117'
      cx!.fillRect(0, 0, 680, 380)

      agentConfigs.forEach(a => {
        drawFloor(a.x - 20, 60, 120, 120)
      })

      agentConfigs.forEach(a => {
        const agent = agentsRef.current.find(ag => ag.id === a.id)
        const isActive = agent?.status === 'thinking' || agent?.status === 'working'
        drawDesk(a.x - 10, 80, 100, 32)
        drawMonitor(a.x + 6, 58, isActive, frame)
        drawChair(a.x + 2, 108)
      })

      drawPlant(620, 60)
      drawPlant(620, 200)
      drawPlant(20, 200)

      drawKanbanWall(20, 260)

      agentConfigs.forEach(a => {
        const agent = agentsRef.current.find(ag => ag.id === a.id)
        const state = agent?.status ?? 'idle'
        drawChar(a.x, a.y, a.skin, a.skinD, a.skinH, a.hair, a.shirt, a.shirtD, state, frame)

        if (state === 'thinking' || state === 'working') {
          const bubbleText = state === 'thinking' ? 'thinking...' : 'working...'
          const bubbleColor = a.id === 'alice' || a.id === 'bob' ? '#b0a0ff' : a.id === 'qa1' ? '#60d4c8' : '#ffd080'
          drawBubble(a.x + 16, a.y - 30, bubbleText, bubbleColor)
        }

        cx!.fillStyle = 'rgba(0,0,0,0.6)'
        cx!.fillRect(a.x, a.y + 26, 60, 10)
        const tagColor = a.id === 'alice' || a.id === 'bob' ? '#b0a0ff' : a.id === 'qa1' ? '#60d4c8' : '#ffd080'
        cx!.fillStyle = tagColor
        cx!.font = '5px "Courier New"'
        cx!.fillText(a.label, a.x + 2, a.y + 34)

        const dotColor = state === 'thinking' ? '#a090f0' : state === 'working' ? '#60d4c8' : '#555577'
        cx!.fillStyle = dotColor
        cx!.beginPath()
        cx!.arc(a.x + 56, a.y + 30, 3, 0, Math.PI * 2)
        cx!.fill()
      })

      frameRef.current++
      animRef = requestAnimationFrame(draw)
    }

    let animRef = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef)
  }, [])

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
      <div style={{ display:"flex", gap:16, marginBottom:12, padding:"6px 16px",
        background:"#0d0d1a", borderRadius:8, border:"1px solid #2a2a4a" }}>
        {agents.map(a => (
          <div key={a.id} style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#8888aa" }}>
            <div style={{
              width:7, height:7, borderRadius:"50%",
              background: a.status === "thinking" ? "#a090f0" : a.status === "working" ? "#60d4c8" : "#555577",
              boxShadow: a.status !== "idle" ? "0 0 6px currentColor" : "none"
            }} />
            {a.name}
            <span style={{ fontSize:9, color: a.status === "idle" ? "#555" : "#9090cc" }}>
              {a.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={680}
        height={380}
        style={{ imageRendering:"pixelated", borderRadius:8, border:"1px solid #2a2a4a" }}
      />
    </div>
  )
}
