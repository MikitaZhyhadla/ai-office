"use client"
import { useEffect, useRef } from "react"
import type { Agent } from "@/types"

// ── Canvas dimensions ──────────────────────────────────────────────────────
const W = 900
const H = 500

// ── BFS grid ───────────────────────────────────────────────────────────────
const CELL = 10
const GW = Math.floor(W / CELL)  // 90
const GH = Math.floor(H / CELL)  // 50

// ── Colour palette ─────────────────────────────────────────────────────────
const P = {
  floorA:'#c8a87a', floorB:'#b89868',
  tileA:'#1e1e2e',  tileB:'#222236',
  wallDark:'#1a0a2e', wallMid:'#2a1a4a', wallTop:'#6a5a8a',
  deskTop:'#8b6040', deskFront:'#6a4828', deskLight:'#a07850', deskShadow:'#3a2010',
  monBack:'#303040', monScreen:'#1a3a5a', monScreenOn:'#204060', monGlow:'#4090c0',
  chairSeat:'#c8a0d8', chairDark:'#9870a8', chairBack:'#b090c8',
  skin1:'#f0c8a0', skin1d:'#d0a870', skin1h:'#ffdcb8',
  skin2:'#c89060', skin2d:'#a06840', skin2h:'#e0b080',
  hairBk:'#201818', hairBr:'#503820', hairBl:'#c8a030', hairGy:'#e0dcd8',
  red:'#d03030',   redD:'#a01818',
  blue:'#3050d0',  blueD:'#1830a0',
  teal:'#2090a0',  tealD:'#106878',
  purple:'#8040c0',purpleD:'#602090',
  leaf:'#3a8040',  leafLight:'#5aaa60', leafDark:'#2a6030',
  pot:'#c86040',   potDark:'#a04030',
  coolerBody:'#5070b8', coolerTank:'#8ab0e8', coolerBase:'#303060',
  vendBody:'#404060', vendScreen:'#1a2535', vendItem:'#c84040',
}

// ── Named locations (pixel coords) ─────────────────────────────────────────
const DESK_POS = {
  alice: { x:106, y:110 },
  bob:   { x:265, y:110 },
  qa:    { x:106, y:310 },
  dev:   { x:750, y:400 },   // right side of meeting room, below dev desk
}
const WATER_COOLER = { x:548, y:82 }
const VENDING      = { x:502, y:82 }

// ── Obstacle rectangles (define walls, furniture the BFS cannot cross) ──────
const OBSTACLES = [
  // outer walls
  { x:0,   y:0,   w:8,   h:H   },
  { x:892, y:0,   w:8,   h:H   },
  { x:0,   y:0,   w:W,   h:28  },
  { x:0,   y:492, w:W,   h:8   },
  // vertical divider — doorway at y=90..140 (gy=9..13)
  { x:448, y:28,  w:8,   h:62  },
  { x:448, y:140, w:8,   h:352 },
  // left horizontal divider — doorway at x=215..265 (gx=22..26)
  { x:8,   y:236, w:207, h:8   },
  { x:265, y:236, w:183, h:8   },
  // right horizontal divider — doorway at x=680..730 (gx=68..72)
  { x:456, y:215, w:224, h:8   },
  { x:730, y:215, w:162, h:8   },
  // desks (generous padding so agents don't clip corners)
  { x:36,  y:52,  w:142, h:44  },  // Alice
  { x:200, y:52,  w:142, h:44  },  // Bob
  { x:36,  y:252, w:142, h:44  },  // QA
  { x:718, y:348, w:134, h:44  },  // Dev (right side of meeting room)
  // vending machine
  { x:456, y:28,  w:40,  h:54  },
  // fridge / storage
  { x:800, y:28,  w:90,  h:170 },
  // meeting table (left-centre of meeting room — clear of the doorway path)
  { x:456, y:328, w:162, h:62  },
]

// ── Build walkable boolean grid (once at module level) ──────────────────────
function buildGrid(): boolean[][] {
  const g = Array.from({ length: GH }, () => Array<boolean>(GW).fill(true))
  for (const o of OBSTACLES) {
    const x1 = Math.floor(o.x / CELL)
    const y1 = Math.floor(o.y / CELL)
    const x2 = Math.ceil((o.x + o.w) / CELL)
    const y2 = Math.ceil((o.y + o.h) / CELL)
    for (let gy = y1; gy < y2; gy++)
      for (let gx = x1; gx < x2; gx++)
        if (gy >= 0 && gy < GH && gx >= 0 && gx < GW) g[gy][gx] = false
  }
  return g
}
const WALKABLE = buildGrid()

// ── BFS pathfinding ─────────────────────────────────────────────────────────
function bfsPath(
  sx: number, sy: number, ex: number, ey: number, grid: boolean[][]
): Array<{ x: number; y: number }> {
  const sgx = Math.max(0, Math.min(GW - 1, Math.floor(sx / CELL)))
  const sgy = Math.max(0, Math.min(GH - 1, Math.floor(sy / CELL)))
  const egx = Math.max(0, Math.min(GW - 1, Math.floor(ex / CELL)))
  const egy = Math.max(0, Math.min(GH - 1, Math.floor(ey / CELL)))
  if (!grid[egy]?.[egx]) return []

  const parent = new Map<number, number>()
  const encode = (gx: number, gy: number) => gy * GW + gx
  const startKey = encode(sgx, sgy)
  const endKey   = encode(egx, egy)
  parent.set(startKey, -1)
  const queue: number[] = [startKey]
  const dirs = [-1, 1, -GW, GW]
  let found = false

  outer: while (queue.length > 0) {
    const cur = queue.shift()!
    const cgx = cur % GW, cgy = Math.floor(cur / GW)
    for (const d of dirs) {
      const nk = cur + d
      const ngx = nk % GW, ngy = Math.floor(nk / GW)
      if (ngy < 0 || ngy >= GH || ngx < 0 || ngx >= GW) continue
      if (d === 1 && cgx === GW - 1) continue
      if (d === -1 && cgx === 0) continue
      if (!grid[ngy][ngx] || parent.has(nk)) continue
      parent.set(nk, cur)
      if (nk === endKey) { found = true; break outer }
      queue.push(nk)
    }
  }
  if (!found) return []

  const path: Array<{ x: number; y: number }> = []
  let k = endKey
  while (k !== startKey) {
    const gx = k % GW, gy = Math.floor(k / GW)
    path.unshift({ x: gx * CELL + CELL / 2, y: gy * CELL + CELL / 2 })
    k = parent.get(k)!
  }
  if (path.length > 0) path[path.length - 1] = { x: ex, y: ey }
  return path
}

// ── Local canvas-agent type (NOT the global Agent interface) ────────────────
type CState = 'idle' | 'typing' | 'thinking' | 'walking'
type CDir   = 'up' | 'down' | 'left' | 'right'
interface CAgent {
  id: string; x: number; y: number
  state: CState; dir: CDir
  path: Array<{ x: number; y: number }>
  onBreak: boolean; breakReturnAt: number | undefined; bubble: string | null
  pendingState: CState | null
  skin: string; skinD: string; skinH: string
  hair: string; shirt: string; shirtD: string; label: string
  homeKey: keyof typeof DESK_POS
}

// ── Initial canvas-agent configs ────────────────────────────────────────────
function makeAgents(): CAgent[] {
  return [
    { id:'alice', homeKey:'alice', x:DESK_POS.alice.x, y:DESK_POS.alice.y,
      skin:P.skin2,  skinD:P.skin2d, skinH:P.skin2h, hair:P.hairBr,
      shirt:P.red,   shirtD:P.redD,  label:'Alice BA',
      state:'idle', dir:'down', path:[], onBreak:false, breakReturnAt:undefined, bubble:null, pendingState:null },
    { id:'bob',   homeKey:'bob',   x:DESK_POS.bob.x,   y:DESK_POS.bob.y,
      skin:P.skin1,  skinD:P.skin1d, skinH:P.skin1h, hair:P.hairBk,
      shirt:P.blue,  shirtD:P.blueD, label:'Bob BA',
      state:'idle', dir:'down', path:[], onBreak:false, breakReturnAt:undefined, bubble:null, pendingState:null },
    { id:'qa1',   homeKey:'qa',    x:DESK_POS.qa.x,    y:DESK_POS.qa.y,
      skin:P.skin1,  skinD:P.skin1d, skinH:P.skin1h, hair:P.hairBl,
      shirt:P.teal,  shirtD:P.tealD, label:'QA Lead',
      state:'idle', dir:'down', path:[], onBreak:false, breakReturnAt:undefined, bubble:null, pendingState:null },
    { id:'dev1',  homeKey:'dev',   x:DESK_POS.dev.x,   y:DESK_POS.dev.y,
      skin:P.skin1,  skinD:P.skin1d, skinH:P.skin1h, hair:P.hairGy,
      shirt:P.purple,shirtD:P.purpleD,label:'Dev Lead',
      state:'idle', dir:'down', path:[], onBreak:false, breakReturnAt:undefined, bubble:null, pendingState:null },
  ]
}

// ── Props ───────────────────────────────────────────────────────────────────
interface Props {
  agents: Agent[]
  kanbanCounts: { todo: number; inprog: number; review: number; done: number }
}

// ── Component ───────────────────────────────────────────────────────────────
export function PixelOffice({ agents, kanbanCounts }: Props) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const frameRef     = useRef(0)
  const agentsRef    = useRef(agents)
  const kanbanRef    = useRef(kanbanCounts)
  const cAgentsRef   = useRef<CAgent[]>(makeAgents())
  const tickRef      = useRef(0)

  useEffect(() => { agentsRef.current = agents },       [agents])
  useEffect(() => { kanbanRef.current = kanbanCounts }, [kanbanCounts])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const cx = canvas.getContext('2d')
    if (!cx) return

    // ── Draw helpers ────────────────────────────────────────────────────────
    function px(x: number, y: number, w: number, h: number, col: string) {
      cx!.fillStyle = col; cx!.fillRect(x, y, w, h)
    }

    function drawFloorWood(x: number, y: number, w: number, h: number) {
      px(x, y, w, h, P.floorA)
      for (let fy = y; fy < y + h; fy += 10) { cx!.fillStyle = P.floorB; cx!.fillRect(x, fy, w, 1) }
      for (let fx = x; fx < x + w; fx += 28) { cx!.fillStyle = 'rgba(0,0,0,0.06)'; cx!.fillRect(fx, y, 1, h) }
    }

    function drawFloorTile(x: number, y: number, w: number, h: number) {
      px(x, y, w, h, P.tileA)
      for (let ty = y; ty < y + h; ty += 16)
        for (let tx = x; tx < x + w; tx += 16)
          if ((Math.floor((ty - y) / 16) + Math.floor((tx - x) / 16)) % 2 === 0)
            px(tx, ty, Math.min(16, x + w - tx), Math.min(16, y + h - ty), P.tileB)
    }

    function drawDesk(x: number, y: number, w = 120, h = 32) {
      px(x + 3, y + h + 2, w, 4, 'rgba(0,0,0,0.2)')
      px(x, y + h - 8, w, 8, P.deskFront)
      px(x, y, w, h - 8, P.deskTop)
      px(x, y, w, 3, P.deskLight)
      px(x, y, 3, h - 8, P.deskLight)
      px(x + w - 3, y, 3, h - 8, P.deskShadow)
    }

    function drawMonitor(x: number, y: number, active: boolean) {
      const frame = frameRef.current
      px(x + 11, y + 28, 6, 4, P.monBack)
      px(x + 8,  y + 30, 12, 3, P.monBack)
      px(x, y, 28, 26, P.monBack)
      px(x + 1, y + 1, 26, 24, '#202030')
      const sc = active && frame % 60 < 30 ? P.monScreenOn : P.monScreen
      px(x + 3, y + 3, 22, 20, sc)
      if (active) {
        const t = frame % 40
        px(x + 5, y + 6,  t < 20 ? 10 : 16, 2, '#2a6090')
        px(x + 5, y + 10, 8, 2, '#1a5070')
        if (frame % 20 < 10) px(x + 5 + (t < 20 ? 10 : 16), y + 6, 1, 2, '#80d0ff')
      }
    }

    function drawChair(x: number, y: number) {
      px(x + 2, y + 18, 16, 3, 'rgba(0,0,0,0.18)')
      px(x + 2, y,      12, 10, P.chairBack)
      px(x + 2, y + 8,  12, 2,  P.chairDark)
      px(x,     y + 10, 16, 8,  P.chairSeat)
      px(x,     y + 16, 16, 2,  P.chairDark)
      px(x + 1, y + 18, 3,  4,  P.chairDark)
      px(x + 12,y + 18, 3,  4,  P.chairDark)
    }

    function drawPlant(x: number, y: number) {
      px(x + 3, y + 12, 10, 8, P.pot)
      px(x + 3, y + 12, 10, 2, P.potDark)
      px(x + 7, y + 7,  2,  6, P.leafDark)
      px(x + 2, y + 2,  6,  8, P.leaf)
      px(x + 8, y + 4,  6,  7, P.leaf)
      px(x + 5, y,      6,  6, P.leafLight)
    }

    function drawWaterCooler(x: number, y: number) {
      px(x,     y + 6,  18, 26, P.coolerBody)
      px(x + 2, y,      14, 10, P.coolerTank)
      px(x + 3, y + 1,  12, 6,  P.coolerTank)
      px(x + 5, y + 2,  8,  4,  '#c0e0ff')
      px(x + 4, y + 16, 10, 4,  '#303060')
      px(x + 1, y + 32, 16, 4,  P.coolerBase)
    }

    function drawVending(x: number, y: number) {
      px(x,     y,      30, 52, P.vendBody)
      px(x + 2, y + 2,  26, 28, P.vendScreen)
      px(x + 4, y + 4,  10, 8,  '#c05050')
      px(x + 16,y + 4,  10, 8,  '#50a050')
      px(x + 4, y + 14, 10, 8,  '#5050c0')
      px(x + 16,y + 14, 10, 8,  P.vendItem)
      px(x + 4, y + 32, 22, 16, '#303050')
      px(x + 6, y + 46, 18, 4,  '#202040')
    }

    function drawMeetingTable(x: number, y: number) {
      px(x + 4, y + 68, 160, 8, 'rgba(0,0,0,0.25)')
      px(x, y,      168, 60, '#5a3820')
      px(x, y,      168, 4,  '#8b6040')
      px(x, y,      4,   60, '#8b6040')
      px(x + 164, y, 4,  60, '#3a2010')
      for (let i = 30; i < 168; i += 30)
        px(x + i, y + 6, 1, 48, 'rgba(0,0,0,0.12)')
    }

    function drawKanbanWall(counts: { todo:number; inprog:number; review:number; done:number }) {
      const bx = 460, by = 232, bw = 426, bh = 66
      px(bx, by, bw, bh, '#0d1120')
      px(bx, by, bw, 3,  '#2a2a5a')
      cx!.fillStyle = '#5050a0'
      cx!.font = 'bold 7px "Courier New"'
      cx!.fillText('KANBAN WALL', bx + 8, by + 13)

      const cols = [
        { label:'TODO',    count: counts.todo,   color:'#6060aa', bg:'#12122a' },
        { label:'IN PROG', count: counts.inprog,  color:'#c8a030', bg:'#1a1508' },
        { label:'REVIEW',  count: counts.review, color:'#c86030', bg:'#1a1008' },
        { label:'DONE',    count: counts.done,   color:'#40aa60', bg:'#081a10' },
      ]
      cols.forEach((col, i) => {
        const colX = bx + 4 + i * 106
        px(colX, by + 18, 100, 44, col.bg)
        px(colX, by + 18, 100, 2,  col.color + '99')
        cx!.fillStyle = col.color
        cx!.font = 'bold 6px "Courier New"'
        cx!.fillText(col.label, colX + 4, by + 30)
        cx!.font = 'bold 18px "Courier New"'
        cx!.fillText(String(col.count), colX + 38, by + 54)
      })
    }

    function drawChar(
      x: number, y: number, ca: CAgent, frame: number
    ) {
      const { skin, skinD, skinH, hair, shirt, shirtD, state } = ca
      const bob = state === 'thinking' ? (frame % 12 < 6 ? 1 : 0) : 0
      const by2 = y + bob
      void skinD; void skinH
      px(x + 1,  by2 + 22, 14, 3, 'rgba(0,0,0,0.15)')
      px(x + 3,  by2 + 16, 4,  7, shirtD)
      px(x + 9,  by2 + 16, 4,  7, shirtD)
      px(x + 2,  by2 + 8,  12, 9, shirt)
      px(x + 2,  by2 + 8,  12, 2, 'rgba(255,255,255,0.12)')
      px(x + 2,  by2 + 15, 12, 2, shirtD)
      px(x,      by2 + 9,  3,  7, shirt)
      px(x + 13, by2 + 9,  3,  7, shirt)
      px(x + 6,  by2 + 5,  4,  4, skin)
      px(x + 3,  by2 - 2,  10, 10, skin)
      px(x + 3,  by2 - 2,  10, 4, hair)
      if (state === 'typing') px(x + 2, by2 + 9, 8, 1, 'rgba(255,255,255,0.3)')
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

    // ── Desk layout for fixed drawing ────────────────────────────────────────
    const deskLayout = [
      { id:'alice', deskX:46,  deskY:60,  monX:62,  monY:38,  chairX:58,  chairY:90  },
      { id:'bob',   deskX:210, deskY:60,  monX:226, monY:38,  chairX:222, chairY:90  },
      { id:'qa1',   deskX:46,  deskY:260, monX:62,  monY:238, chairX:58,  chairY:290 },
      { id:'dev1',  deskX:720, deskY:355, monX:736, monY:333, chairX:732, chairY:385 },
    ]

    // ── Update canvas agents ─────────────────────────────────────────────────
    function updateAgents() {
      const tick = tickRef.current

      // Break room events — every 7200 ticks (~2 min at 60fps)
      if (tick % 7200 === 0 && tick > 0) {
        const candidates = cAgentsRef.current.filter(a => !a.onBreak && a.state !== 'walking')
        if (candidates.length > 0) {
          const ca = candidates[Math.floor(Math.random() * candidates.length)]
          ca.onBreak = true
          ca.bubble  = '☕'
          const dest = Math.random() > 0.5 ? WATER_COOLER : VENDING
          ca.path  = bfsPath(ca.x, ca.y, dest.x, dest.y, WALKABLE)
          ca.state = 'walking'
        }
      }

      cAgentsRef.current.forEach(ca => {
        // Sync Zustand status → canvas state (unless on break)
        const zustand = agentsRef.current.find(a => a.id === ca.id)
        const want: CState = zustand?.status === 'thinking' ? 'thinking'
          : zustand?.status === 'working' ? 'typing' : 'idle'

        if (!ca.onBreak && ca.state !== 'walking') {
          ca.state        = want
          ca.pendingState = null
        } else if (ca.onBreak) {
          ca.pendingState = want
        }

        // Break return timer
        if (ca.onBreak && ca.state !== 'walking') {
          if (ca.breakReturnAt === undefined) {
            ca.breakReturnAt = tick + 300
          } else if (tick >= ca.breakReturnAt) {
            const home = DESK_POS[ca.homeKey]
            ca.path          = bfsPath(ca.x, ca.y, home.x, home.y, WALKABLE)
            ca.state         = 'walking'
            ca.onBreak       = false
            ca.breakReturnAt = undefined
            ca.bubble        = null
            if (ca.pendingState) { ca.state = 'walking' } // finish walk first
          }
        }

        // Movement along path
        if (ca.state === 'walking' && ca.path.length > 0) {
          const next = ca.path[0]
          const dx = next.x - ca.x, dy = next.y - ca.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 2) {
            ca.x = next.x; ca.y = next.y
            ca.path.shift()
            if (ca.path.length === 0) {
              // arrived
              ca.state = ca.pendingState ?? 'idle'
              ca.pendingState = null
            }
          } else {
            const speed = 1.5
            ca.x += (dx / dist) * speed
            ca.y += (dy / dist) * speed
            ca.dir = Math.abs(dx) > Math.abs(dy)
              ? (dx > 0 ? 'right' : 'left')
              : (dy > 0 ? 'down' : 'up')
          }
        }
      })

      tickRef.current++
    }

    // ── Main draw loop ───────────────────────────────────────────────────────
    function draw() {
      const frame = frameRef.current
      updateAgents()

      // Background
      px(0, 0, W, H, '#0d1117')

      // Floors
      drawFloorWood(8,   28,  440, 208) // left top
      drawFloorWood(8,   244, 440, 248) // left bottom
      drawFloorTile(456, 28,  436, 187) // right top
      drawFloorTile(456, 223, 436, 269) // right bottom

      // Walls — outer border
      px(0, 0, W, 28, P.wallMid)
      px(0, 0, 8, H,  P.wallMid)
      px(892,0, 8, H,  P.wallMid)
      px(0, 492, W, 8, P.wallMid)
      px(0, 0, W, 4, P.wallTop)

      // Vertical divider (with gap at y=90..140)
      px(448, 28,  8, 62,  P.wallMid)
      px(448, 140, 8, 352, P.wallMid)
      px(448, 28,  2, 62,  P.wallTop)
      px(448, 140, 2, 352, P.wallTop)

      // Left horizontal divider (gap at x=215..265)
      px(8,   236, 207, 8, P.wallMid)
      px(265, 236, 183, 8, P.wallMid)
      px(8,   236, 207, 2, P.wallTop)
      px(265, 236, 183, 2, P.wallTop)

      // Right horizontal divider (gap at x=680..730)
      px(456, 215, 224, 8, P.wallMid)
      px(730, 215, 162, 8, P.wallMid)
      px(456, 215, 224, 2, P.wallTop)
      px(730, 215, 162, 2, P.wallTop)

      // ── Fixed furniture ──────────────────────────────────────────────────
      deskLayout.forEach(dl => {
        const zustand = agentsRef.current.find(a => a.id === dl.id)
        const active = zustand?.status === 'thinking' || zustand?.status === 'working'
        drawDesk(dl.deskX, dl.deskY)
        drawMonitor(dl.monX, dl.monY, active)
        drawChair(dl.chairX, dl.chairY)
      })

      // Break-room items (right top room)
      drawVending(466, 32)
      drawWaterCooler(516, 32)

      // Plants
      drawPlant(410, 50)
      drawPlant(410, 160)
      drawPlant(16,  50)
      drawPlant(860, 50)

      // Meeting table (right bottom)
      drawMeetingTable(558, 265)

      // Kanban wall panel
      drawKanbanWall(kanbanRef.current)

      // ── Characters ───────────────────────────────────────────────────────
      cAgentsRef.current.forEach(ca => {
        drawChar(Math.round(ca.x), Math.round(ca.y), ca, frame)

        // Thought / break bubble
        const bubbleText = ca.bubble ?? (
          ca.state === 'thinking' ? 'thinking...' :
          ca.state === 'typing'   ? 'working...'  : null
        )
        if (bubbleText) {
          const bColor = ca.id === 'alice' || ca.id === 'bob'
            ? '#b0a0ff' : ca.id === 'qa1' ? '#60d4c8' : '#ffd080'
          drawBubble(Math.round(ca.x) + 16, Math.round(ca.y) - 30, bubbleText, bColor)
        }

        // Name tag
        const tagColor = ca.id === 'alice' || ca.id === 'bob'
          ? '#b0a0ff' : ca.id === 'qa1' ? '#60d4c8' : '#ffd080'
        cx!.fillStyle = 'rgba(0,0,0,0.6)'
        cx!.fillRect(Math.round(ca.x), Math.round(ca.y) + 26, 60, 10)
        cx!.fillStyle = tagColor
        cx!.font = '5px "Courier New"'
        cx!.fillText(ca.label, Math.round(ca.x) + 2, Math.round(ca.y) + 34)

        // Status dot
        const dotColor = ca.state === 'thinking' ? '#a090f0'
          : ca.state === 'typing' || ca.state === 'walking' ? '#60d4c8' : '#555577'
        cx!.fillStyle = dotColor
        cx!.beginPath()
        cx!.arc(Math.round(ca.x) + 56, Math.round(ca.y) + 30, 3, 0, Math.PI * 2)
        cx!.fill()
      })

      frameRef.current++
      animRef = requestAnimationFrame(draw)
    }

    let animRef = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef)
  }, [])

  const zustandAgents = agentsRef.current

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ display:'flex', gap:16, marginBottom:12, padding:'6px 16px',
        background:'#0d0d1a', borderRadius:8, border:'1px solid #2a2a4a' }}>
        {zustandAgents.map(a => (
          <div key={a.id} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#8888aa' }}>
            <div style={{
              width:7, height:7, borderRadius:'50%',
              background: a.status === 'thinking' ? '#a090f0' : a.status === 'working' ? '#60d4c8' : '#555577',
              boxShadow: a.status !== 'idle' ? '0 0 6px currentColor' : 'none',
            }} />
            {a.name}
            <span style={{ fontSize:9, color: a.status === 'idle' ? '#555' : '#9090cc' }}>
              {a.status.toUpperCase()}
            </span>
          </div>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        style={{ imageRendering:'pixelated', borderRadius:8, border:'1px solid #2a2a4a' }}
      />
    </div>
  )
}
