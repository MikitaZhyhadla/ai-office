import type { QAVerdict } from "@/agents/qaAgent"
import type { DevVerdict } from "@/agents/devAgent"

export interface User {
  username:    string
  role:        'Admin' | 'QA' | 'Developer'
  displayName: string
  projectName: string
}

export interface TestCase {
  id:             string
  title:          string
  steps:          string[]
  expectedResult: string
  type:           'positive' | 'negative' | 'boundary'
}

export type Format = 'gwt' | 'classic' | 'bug'
export type Priority = 'high' | 'medium' | 'low'
export type AgentStatus = 'idle' | 'thinking' | 'working'
export type KanbanColumn = 'todo' | 'inprog' | 'review' | 'done'
export type TicketType = 'feature' | 'bug'
export type Severity = 'critical' | 'major' | 'minor'

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
export interface BugReport {
  title:            string
  severity:         Severity
  stepsToReproduce: string[]
  expectedBehavior: string
  actualBehavior:   string
  affectedArea:     string
}

export interface TechNotes {
  proposedStack:       string[]
  implementationSteps: string[]
  edgeCases:           string[]
  patterns:            string[]
  estimateNote:        string
}

export type MoSCoWCategory = 'must' | 'should' | 'could' | 'wont'

export interface PrioritizationResult {
  ticketId:      string
  moscow:        MoSCoWCategory
  justification: string
  suggestedSP:   number
}

export interface PrioritizationReport {
  results:     PrioritizationResult[]
  summary:     string
  generatedAt: string
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
  userId?: string
  qaVerdict?: QAVerdict
  devVerdict?: DevVerdict
  history?: TicketHistoryEntry[]
  pushedTo?: 'jira' | 'azure' | null
  pushedAt?: string
  pushedUrl?: string
  ticketType?: TicketType
  bugReport?:  BugReport
  severity?:   Severity
  techNotes?:  TechNotes
  moscow?:              MoSCoWCategory
  moscowJustification?: string
  suggestedSP?:         number
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
  status?: 'active' | 'closed'
  closedAt?: string
}

export interface RetroReport {
  sprintName:       string
  totalTickets:     number
  completedTickets: number
  velocity:         number
  revisionRate:     string
  highlights:       string[]
  blockers:         string[]
  suggestions:      string[]
  agentInsights:    string
}
export interface LogEntry {
  id: string
  timestamp: string
  agentName: string
  agentRole: 'ba' | 'qa' | 'dev' | 'human' | 'system' | 'translator'
  message: string
}

export type { QAVerdict, DevVerdict }
