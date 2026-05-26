"use client"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Ticket, Agent, Sprint, LogEntry, KanbanColumn, TicketHistoryEntry, TestCase, RetroReport, SDETVerdict } from "@/types"

function getStoreKey(): string {
  if (typeof window === 'undefined') return 'ai-office-store-guest'
  try {
    const raw = localStorage.getItem('ai-office-auth')
    if (raw) {
      const parsed = JSON.parse(raw)
      const username = parsed?.state?.currentUser?.username
      if (username) return `ai-office-store-${username}`
    }
  } catch {}
  return 'ai-office-store-guest'
}

interface AppState {
  tickets: Ticket[]
  sprints: Sprint[]
  agents: Agent[]
  log: LogEntry[]
  pipeline: { ba: number; review: number; qa: number; done: number }
  kanban: { todo: Ticket[]; inprog: Ticket[]; review: Ticket[]; done: Ticket[] }
  selectedTicketId: string | null
  testCases: Record<string, TestCase[]>
  generatingTcFor: string[]
  closedSprints: Array<{ sprintId: string; closedAt: string; retro: RetroReport }>
  addTicket: (t: Ticket) => void
  updateTicket: (ticketId: string, patch: Partial<Ticket>) => void
  moveToKanban: (ticket: Ticket, col: KanbanColumn) => void
  moveTicket: (ticketId: string, status: KanbanColumn) => void
  removeTicket: (ticketId: string) => void
  toggleSprint: (ticketId: string, sprintId: string) => void
  setAgentStatus: (id: string, status: Agent["status"], task?: string) => void
  addLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void
  incPipeline: (stage: keyof AppState["pipeline"], delta: number) => void
  setSelectedTicket: (id: string | null) => void
  appendTicketHistory: (ticketId: string, entry: Omit<TicketHistoryEntry, "id">) => void
  setTestCases: (ticketId: string, cases: TestCase[]) => void
  setGeneratingTc: (ticketId: string, loading: boolean) => void
  closeSprintWithRetro: (sprintId: string, retro: RetroReport) => void
  createSprint: (name: string, startDate: string, endDate: string) => void
  closeSprint: (sprintId: string) => { resolvedCount: number; returnedCount: number; velocity: number }
  reopenTicket: (ticketId: string) => void
  resetStore: () => void
  generateSDETVerdict: (ticketId: string) => Promise<void>
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      tickets: [],
      testCases: {},
      generatingTcFor: [],
      closedSprints: [],
      sprints: [{ id: "sprint-3", name: "Sprint 3", startDate: "2026-05-12", endDate: "2026-05-25", ticketIds: [], status: 'active' as const }],
      agents: [
        { id: "alice", name: "Alice BA", role: "ba", status: "idle" },
        { id: "bob", name: "Bob BA", role: "ba", status: "idle" },
        { id: "qa1", name: "QA Lead", role: "qa", status: "idle" },
        { id: "dev1", name: "Dev Lead", role: "dev", status: "idle" },
      ],
      log: [],
      pipeline: { ba: 0, review: 0, qa: 0, done: 0 },
      kanban: { todo: [], inprog: [], review: [], done: [] },
      selectedTicketId: null,
      addTicket: (ticket) => set(s => ({
        tickets: [...s.tickets, ticket],
        kanban: { ...s.kanban, todo: [...s.kanban.todo, ticket] },
      })),
      updateTicket: (ticketId, patch) => set(s => {
        const updatedTickets = s.tickets.map(t => t.id === ticketId ? { ...t, ...patch } : t)
        const cols: KanbanColumn[] = ["todo","inprog","review","done"]
        const next = { ...s.kanban }
        cols.forEach(c => { next[c] = next[c].map(t => t.id === ticketId ? { ...t, ...patch } : t) })
        return { tickets: updatedTickets, kanban: next }
      }),
      moveToKanban: (ticket, col) => set(s => {
        const cols: KanbanColumn[] = ["todo","inprog","review","done"]
        const next = { ...s.kanban }
        cols.forEach(c => { next[c] = next[c].filter(t => t.id !== ticket.id) })
        next[col] = [...next[col], { ...ticket, status: col }]
        const updatedTickets = s.tickets.map(t => t.id === ticket.id ? { ...t, status: col } : t)
        return { kanban: next, tickets: updatedTickets }
      }),
      moveTicket: (ticketId, status) => set(s => {
        const cols: KanbanColumn[] = ["todo","inprog","review","done"]
        const updatedTickets = s.tickets.map(t => t.id === ticketId ? { ...t, status } : t)
        const next = { ...s.kanban }
        cols.forEach(c => { next[c] = next[c].filter(t => t.id !== ticketId) })
        const moved = updatedTickets.find(t => t.id === ticketId)
        if (moved) next[status] = [...next[status], moved]
        return { tickets: updatedTickets, kanban: next }
      }),
      removeTicket: (ticketId) => set(s => ({
        tickets: s.tickets.filter(t => t.id !== ticketId),
        kanban: {
          todo:   s.kanban.todo.filter(t => t.id !== ticketId),
          inprog: s.kanban.inprog.filter(t => t.id !== ticketId),
          review: s.kanban.review.filter(t => t.id !== ticketId),
          done:   s.kanban.done.filter(t => t.id !== ticketId),
        },
        sprints: s.sprints.map(sp => ({
          ...sp,
          ticketIds: sp.ticketIds.filter(id => id !== ticketId),
        })),
        selectedTicketId: s.selectedTicketId === ticketId ? null : s.selectedTicketId,
      })),
      toggleSprint: (ticketId, sprintId) => set(s => {
        const sprint = s.sprints.find(sp => sp.id === sprintId)
        const isCurrentlyIn = sprint?.ticketIds.includes(ticketId) ?? false
        const willBeIn = !isCurrentlyIn
        const cols: KanbanColumn[] = ["todo","inprog","review","done"]
        const nextKanban = { ...s.kanban }
        cols.forEach(c => {
          nextKanban[c] = nextKanban[c].map(t => t.id === ticketId ? { ...t, inSprint: willBeIn } : t)
        })
        return {
          sprints: s.sprints.map(sp =>
            sp.id === sprintId
              ? { ...sp, ticketIds: isCurrentlyIn
                  ? sp.ticketIds.filter(id => id !== ticketId)
                  : [...sp.ticketIds, ticketId] }
              : sp
          ),
          tickets: s.tickets.map(t => t.id === ticketId ? { ...t, inSprint: willBeIn } : t),
          kanban: nextKanban,
        }
      }),
      setAgentStatus: (id, status, task) => set(s => ({
        agents: s.agents.map(a => a.id === id ? { ...a, status, currentTask: task } : a)
      })),
      addLog: (entry) => set(s => {
        const now = Date.now()
        const thirtySecondsAgo = now - 30000
        const isDuplicate = s.log.some(
          existing =>
            existing.agentRole === entry.agentRole &&
            existing.message === entry.message &&
            new Date(existing.timestamp).getTime() > thirtySecondsAgo
        )
        if (isDuplicate) return s
        return {
          log: [...s.log, { ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() }]
        }
      }),
      incPipeline: (stage, delta) => set(s => ({
        pipeline: { ...s.pipeline, [stage]: Math.max(0, s.pipeline[stage] + delta) }
      })),
      setSelectedTicket: (id) => set({ selectedTicketId: id }),
      setTestCases: (ticketId, cases) =>
        set(s => ({ testCases: { ...s.testCases, [ticketId]: cases } })),
      setGeneratingTc: (ticketId, loading) =>
        set(s => ({
          generatingTcFor: loading
            ? [...s.generatingTcFor, ticketId]
            : s.generatingTcFor.filter(id => id !== ticketId)
        })),
      appendTicketHistory: (ticketId, entry) => set(s => ({
        tickets: s.tickets.map(t =>
          t.id === ticketId
            ? { ...t, history: [...(t.history ?? []), { ...entry, id: crypto.randomUUID() }] }
            : t
        ),
      })),
      createSprint: (name, startDate, endDate) => set(s => ({
        sprints: [...s.sprints, {
          id: crypto.randomUUID(),
          name,
          startDate,
          endDate,
          ticketIds: [],
          status: 'active' as const,
        }],
      })),
      closeSprint: (sprintId) => {
        let resolvedCount = 0, returnedCount = 0, velocity = 0
        set(s => {
          const sprint = s.sprints.find(sp => sp.id === sprintId)
          if (!sprint) return s

          const sprintTickets = s.tickets.filter(t => sprint.ticketIds.includes(t.id))
          const done = sprintTickets.filter(t => t.status === 'done')
          const unfinished = sprintTickets.filter(t => t.status !== 'done')

          resolvedCount = done.length
          returnedCount = unfinished.length
          velocity = done.reduce((sum, t) => sum + (t.points ?? 0), 0)

          const now = new Date().toISOString()
          const doneIds = new Set(done.map(t => t.id))
          const unfinishedIds = new Set(unfinished.map(t => t.id))
          const allSprintIds = new Set([...doneIds, ...unfinishedIds])

          const updatedTickets = s.tickets.map(t => {
            if (doneIds.has(t.id)) return { ...t, resolvedInSprint: sprintId, resolvedAt: now, inSprint: false, sprintId: undefined }
            if (unfinishedIds.has(t.id)) return { ...t, inSprint: false, sprintId: undefined, status: 'todo' as const, resolvedInSprint: undefined, resolvedAt: undefined }
            return t
          })

          const cols: KanbanColumn[] = ['todo', 'inprog', 'review', 'done']
          const nextKanban = { ...s.kanban }
          cols.forEach(c => { nextKanban[c] = nextKanban[c].filter(t => !allSprintIds.has(t.id)) })
          const returning = unfinished.map(t => ({ ...t, inSprint: false, sprintId: undefined, status: 'todo' as const }))
          nextKanban.todo = [...nextKanban.todo, ...returning]

          const updatedSprints = s.sprints.map(sp =>
            sp.id === sprintId
              ? { ...sp, status: 'closed' as const, closedAt: now, velocity, ticketIds: [] }
              : sp
          )

          return { tickets: updatedTickets, kanban: nextKanban, sprints: updatedSprints }
        })
        return { resolvedCount, returnedCount, velocity }
      },
      closeSprintWithRetro: (sprintId, retro) => set(state => ({
        closedSprints: [
          ...state.closedSprints,
          { sprintId, closedAt: new Date().toISOString(), retro }
        ],
        sprints: state.sprints.map(s =>
          s.id === sprintId
            ? { ...s, status: 'closed', closedAt: new Date().toISOString() }
            : s
        )
      })),
      reopenTicket: (ticketId) => set(s => {
        const updatedTickets = s.tickets.map(t =>
          t.id === ticketId
            ? { ...t, resolvedInSprint: undefined, resolvedAt: undefined, inSprint: false, status: 'todo' as const, sprintId: undefined }
            : t
        )
        const reopened = updatedTickets.find(t => t.id === ticketId)
        const cols: KanbanColumn[] = ['todo', 'inprog', 'review', 'done']
        const nextKanban = { ...s.kanban }
        cols.forEach(c => { nextKanban[c] = nextKanban[c].filter(t => t.id !== ticketId) })
        if (reopened) nextKanban.todo = [...nextKanban.todo, reopened]
        return { tickets: updatedTickets, kanban: nextKanban }
      }),
      resetStore: () => set({
        tickets: [],
        kanban: { todo: [], inprog: [], review: [], done: [] },
        log: [],
        pipeline: { ba: 0, review: 0, qa: 0, done: 0 },
        testCases: {},
        generatingTcFor: [],
        selectedTicketId: null,
      }),
      generateSDETVerdict: async (ticketId: string) => {
        const { sdetAgent } = await import('@/agents/sdetAgent')
        const ticket = useAppStore.getState().tickets.find(t => t.id === ticketId)
        if (!ticket) return
        const verdict: SDETVerdict = await sdetAgent(JSON.stringify(ticket.data))
        useAppStore.getState().updateTicket(ticketId, { sdetVerdict: verdict })
      },
    }),
    { name: getStoreKey() }
  )
)
