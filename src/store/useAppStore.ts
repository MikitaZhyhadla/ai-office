"use client"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Ticket, Agent, Sprint, LogEntry, KanbanColumn, TicketHistoryEntry, TestCase } from "@/types"

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
  addTicket: (t: Ticket) => void
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
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      tickets: [],
      testCases: {},
      generatingTcFor: [],
      sprints: [{ id: "sprint-3", name: "Sprint 3", startDate: "2026-05-12", endDate: "2026-05-25", ticketIds: [] }],
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
      moveToKanban: (ticket, col) => set(s => {
        const cols: KanbanColumn[] = ["todo","inprog","review","done"]
        const next = { ...s.kanban }
        cols.forEach(c => { next[c] = next[c].filter(t => t.id !== ticket.id) })
        next[col] = [...next[col], { ...ticket, status: col }]
        return { kanban: next }
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
      toggleSprint: (ticketId, sprintId) => set(s => ({
        sprints: s.sprints.map(sp =>
          sp.id === sprintId
            ? { ...sp, ticketIds: sp.ticketIds.includes(ticketId)
                ? sp.ticketIds.filter(id => id !== ticketId)
                : [...sp.ticketIds, ticketId] }
            : sp
        )
      })),
      setAgentStatus: (id, status, task) => set(s => ({
        agents: s.agents.map(a => a.id === id ? { ...a, status, currentTask: task } : a)
      })),
      addLog: (entry) => set(s => ({
        log: [...s.log, { ...entry, id: crypto.randomUUID(), timestamp: new Date().toISOString() }]
      })),
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
    }),
    { name: "ai-office-store" }
  )
)
