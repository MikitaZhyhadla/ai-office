"use client"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Ticket, Agent, Sprint, LogEntry, KanbanColumn } from "@/types"

interface AppState {
  tickets: Ticket[]
  sprints: Sprint[]
  agents: Agent[]
  log: LogEntry[]
  pipeline: { ba: number; review: number; qa: number; done: number }
  kanban: { todo: Ticket[]; inprog: Ticket[]; review: Ticket[]; done: Ticket[] }
  addTicket: (t: Ticket) => void
  moveToKanban: (ticket: Ticket, col: KanbanColumn) => void
  toggleSprint: (ticketId: string, sprintId: string) => void
  setAgentStatus: (id: string, status: Agent["status"], task?: string) => void
  addLog: (entry: Omit<LogEntry, "id" | "timestamp">) => void
  incPipeline: (stage: keyof AppState["pipeline"], delta: number) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      tickets: [],
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
    }),
    { name: "ai-office-store" }
  )
)
