import type { QAVerdict } from "@/agents/qaAgent"
import type { DevVerdict } from "@/agents/devAgent"

export type Format = 'gwt' | 'classic'
export type Priority = 'high' | 'medium' | 'low'
export type AgentStatus = 'idle' | 'thinking' | 'working'
export type KanbanColumn = 'todo' | 'inprog' | 'review' | 'done'

export interface TicketHistoryEntry {
  id: string
  timestamp: string
  actor: string
  actorRole: 'ba' | 'qa' | 'dev' | 'human' | 'system'
  message: string
}

export interface GWTScenario {
  name: string
  given: string
  when: string
  then: string
}
export interface GWTRequirement {
  title: string
  format: "gwt"
  scenarios: GWTScenario[]
  story_points: number
  priority: Priority
  notes?: string
}
export interface ClassicRequirement {
  title: string
  format: "classic"
  objective: string
  functional_requirements: string[]
  non_functional_requirements: string[]
  acceptance_criteria: string[]
  out_of_scope: string[]
  story_points: number
  priority: Priority
  notes?: string
}
export type RequirementData = GWTRequirement | ClassicRequirement
export interface Ticket {
  id: string
  title: string
  format: Format
  priority: Priority
  points: number
  status: KanbanColumn
  data: RequirementData
  sprintId?: string
  createdAt: string
  qaVerdict?: QAVerdict
  devVerdict?: DevVerdict
  history?: TicketHistoryEntry[]
}
export interface Agent {
  id: string
  name: string
  role: 'ba' | 'qa' | 'dev'
  status: AgentStatus
  currentTask?: string
}
export interface Sprint {
  id: string
  name: string
  startDate: string
  endDate: string
  ticketIds: string[]
}
export interface LogEntry {
  id: string
  timestamp: string
  agentName: string
  agentRole: 'ba' | 'qa' | 'dev' | 'human' | 'system'
  message: string
}

export type { QAVerdict, DevVerdict }
