"use client"
import { useState, useEffect, useCallback } from "react"
import { useAppStore } from "@/store/useAppStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { pushTicketToJira, pushTicketToAzure } from "@/lib/pushTicket"
import { qaTestCaseAgent } from "@/agents/qaTestCaseAgent"
import { DoDChecklistModal } from "./DoDChecklistModal"
import { TestCasePanel } from "./TestCasePanel"
import { BugReportView } from "./BugReportView"
import { TechNotesPanel } from "./TechNotesPanel"
import { MoSCoWBadge } from "./MoSCoWBadge"
import type { GWTRequirement, ClassicRequirement, KanbanColumn, TicketHistoryEntry } from "@/types"

interface TicketModalProps {
  ticketId: string
  onClose: () => void
}

type Tab = "requirements" | "verdicts" | "testcases" | "technotes" | "history"

const NEXT_STATUS: Record<KanbanColumn, KanbanColumn | null> = {
  todo: "inprog",
  inprog: "review",
  review: "done",
  done: null,
}
const STATUS_LABEL: Record<KanbanColumn, string> = {
  todo: "To Do",
  inprog: "In Progress",
  review: "Review",
  done: "Done",
}
const STATUS_COLOR: Record<KanbanColumn, { color: string; bg: string }> = {
  todo:   { color: "#888", bg: "#f0f0f0" },
  inprog: { color: "#3C3489", bg: "#EEEDFE" },
  review: { color: "#854F0B", bg: "#FAEEDA" },
  done:   { color: "#27500A", bg: "#EAF3DE" },
}
const ROLE_DOT_COLOR: Record<TicketHistoryEntry["actorRole"], string> = {
  ba:     "#7F77DD",
  qa:     "#1D9E75",
  dev:    "#BA7517",
  human:  "#534AB7",
  system: "#888",
}

export function TicketModal({ ticketId, onClose }: TicketModalProps) {
  const ticket    = useAppStore(s => s.tickets.find(t => t.id === ticketId))
  const sprints   = useAppStore(s => s.sprints)
  const moveTicket           = useAppStore(s => s.moveTicket)
  const removeTicket         = useAppStore(s => s.removeTicket)
  const updateTicket         = useAppStore(s => s.updateTicket)
  const appendTicketHistory  = useAppStore(s => s.appendTicketHistory)
  const reopenTicket         = useAppStore(s => s.reopenTicket)
  const setTestCases         = useAppStore(s => s.setTestCases)
  const setGeneratingTc      = useAppStore(s => s.setGeneratingTc)
  const setAgentStatus       = useAppStore(s => s.setAgentStatus)
  const testCases = useAppStore(s => s.testCases)
  const tcCount   = testCases[ticketId]?.length ?? 0

  const jira  = useSettingsStore(s => s.jira)
  const azure = useSettingsStore(s => s.azure)

  const isJiraConfigured  = jira.enabled  && !!jira.baseUrl  && !!jira.projectKey && !!jira.apiToken  && !!jira.userEmail
  const isAzureConfigured = azure.enabled && !!azure.orgUrl  && !!azure.project   && !!azure.patToken

  const [activeTab, setActiveTab] = useState<Tab>("requirements")
  const [isReopening, setIsReopening] = useState(false)
  const [jiraPushState,  setJiraPushState]  = useState<"idle" | "loading" | "error">("idle")
  const [azurePushState, setAzurePushState] = useState<"idle" | "loading" | "error">("idle")
  const [jiraError,  setJiraError]  = useState<string | null>(null)
  const [azureError, setAzureError] = useState<string | null>(null)
  const [dodModalOpen, setDodModalOpen] = useState(false)

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose()
  }, [onClose])

  useEffect(() => {
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleKey])

  if (!ticket) return null

  const isResolved = !!ticket.resolvedInSprint
  const getSprintName = (sprintId: string) =>
    sprints.find(s => s.id === sprintId)?.name ?? sprintId

  const handleReopen = () => {
    setIsReopening(true)
    reopenTicket(ticket.id)
    setTimeout(() => {
      onClose()
      setIsReopening(false)
    }, 300)
  }

  const sprint = ticket.sprintId ? sprints.find(s => s.id === ticket.sprintId) : null
  const nextSt  = NEXT_STATUS[ticket.status]
  const { color: stColor, bg: stBg } = STATUS_COLOR[ticket.status]
  const prioColor = ticket.priority === "high" ? "#791F1F" : ticket.priority === "medium" ? "#854F0B" : "#27500A"
  const prioBg    = ticket.priority === "high" ? "#FEF2F2" : ticket.priority === "medium" ? "#FAEEDA" : "#EAF3DE"

  const handlePushJira = async () => {
    if (!ticket) return
    setJiraPushState("loading")
    setJiraError(null)
    try {
      const { issueUrl, issueKey } = await pushTicketToJira(ticket)
      updateTicket(ticket.id, { pushedTo: "jira", pushedAt: new Date().toISOString(), pushedUrl: issueUrl })
      appendTicketHistory(ticket.id, {
        timestamp: new Date().toISOString(),
        actor: "Human",
        actorRole: "human",
        message: `Pushed to Jira — ${issueKey}`,
      })
      setJiraPushState("idle")
    } catch (err) {
      setJiraError(String(err).replace(/^Error:\s*/, ""))
      setJiraPushState("error")
    }
  }

  const handlePushAzure = async () => {
    if (!ticket) return
    setAzurePushState("loading")
    setAzureError(null)
    try {
      const { issueUrl, issueKey } = await pushTicketToAzure(ticket)
      updateTicket(ticket.id, { pushedTo: "azure", pushedAt: new Date().toISOString(), pushedUrl: issueUrl })
      appendTicketHistory(ticket.id, {
        timestamp: new Date().toISOString(),
        actor: "Human",
        actorRole: "human",
        message: `Pushed to Azure DevOps — #${issueKey}`,
      })
      setAzurePushState("idle")
    } catch (err) {
      setAzureError(String(err).replace(/^Error:\s*/, ""))
      setAzurePushState("error")
    }
  }

  const triggerQATestCases = async () => {
    if (!ticket) return
    setAgentStatus('qa1', 'thinking', `Generating test cases for ${ticket.id}`)
    setGeneratingTc(ticket.id, true)
    try {
      const cases = await qaTestCaseAgent(ticket.id, ticket.title, ticket.data, ticket.format)
      setTestCases(ticket.id, cases)
      moveTicket(ticket.id, 'review')
      appendTicketHistory(ticket.id, {
        actor: 'QA Lead',
        actorRole: 'qa',
        message: `Generated ${cases.length} test cases (positive, negative, boundary) — ticket moved to In Review`,
        timestamp: new Date().toISOString(),
      })
    } catch (err) {
      console.error('QA test case generation failed:', err)
      appendTicketHistory(ticket.id, {
        actor: 'QA Lead',
        actorRole: 'qa',
        message: 'Test case generation failed — ticket remains In Progress',
        timestamp: new Date().toISOString(),
      })
    } finally {
      setGeneratingTc(ticket.id, false)
      setAgentStatus('qa1', 'idle')
    }
  }

  const handleMove = () => {
    if (!nextSt) return
    if (nextSt === "done") {
      setDodModalOpen(true)
      return
    }
    moveTicket(ticket.id, nextSt)
    appendTicketHistory(ticket.id, {
      timestamp: new Date().toISOString(),
      actor: "Human",
      actorRole: "human",
      message: `Moved to ${STATUS_LABEL[nextSt]}`,
    })
    if (nextSt === 'inprog') {
      const existingCases = useAppStore.getState().testCases[ticket.id] ?? []
      if (existingCases.length === 0) {
        triggerQATestCases()
      }
    }
  }

  const handleDodConfirm = (checkedItemIds: string[]) => {
    const dodItems = useSettingsStore.getState().dodItems
    const checkedLabels = dodItems
      .filter(item => checkedItemIds.includes(item.id))
      .map(item => item.label)
    moveTicket(ticket.id, "done")
    appendTicketHistory(ticket.id, {
      timestamp: new Date().toISOString(),
      actor: "Human",
      actorRole: "human",
      message: `Definition of Done completed — checked: ${checkedLabels.join(', ')}`,
    })
    setDodModalOpen(false)
  }

  const handleDelete = () => {
    removeTicket(ticket.id)
    onClose()
  }

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(ticket, null, 2))
  }

  const sortedHistory = [...(ticket.history ?? [])].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  return (
    <div
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", zIndex:1000,
               display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background:"#fff", borderRadius:12, width:780, maxWidth:"95vw",
                    maxHeight:"88vh", display:"flex", flexDirection:"column", overflow:"hidden",
                    boxShadow:"0 20px 60px rgba(0,0,0,0.25)" }}>

        {/* ── Header ── */}
        <div style={{ display:"flex", alignItems:"center", padding:"18px 22px",
                      borderBottom:"1px solid #e8e8f0", gap:0, flexShrink:0 }}>
          <span style={{ fontSize:11, fontWeight:600, padding:"2px 8px", borderRadius:5,
                         background:"#EEEDFE", color:"#3C3489", marginRight:14, flexShrink:0 }}>
            {ticket.id}
          </span>
          <span style={{ fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:10,
                         background: ticket.ticketType === 'bug' ? "#FCEBEB" : "#DBEAFE",
                         color: ticket.ticketType === 'bug' ? "#791F1F" : "#1e40af",
                         marginRight:10, flexShrink:0 }}>
            {ticket.ticketType === 'bug' ? '🐛 Bug' : 'User Story'}
          </span>
          <span style={{ fontSize:16, fontWeight:600, flex:1, lineHeight:1.3 }}>{ticket.title}</span>
          <button onClick={onClose}
            style={{ background:"none", border:"none", cursor:"pointer", color:"#888",
                     fontSize:18, lineHeight:1, padding:"0 0 0 16px", flexShrink:0 }}
            onMouseEnter={e => (e.currentTarget.style.color = "#333")}
            onMouseLeave={e => (e.currentTarget.style.color = "#888")}
          >✕</button>
        </div>

        {/* ── Meta bar ── */}
        <div style={{ display:"flex", gap:8, padding:"10px 22px", background:"#fafafa",
                      borderBottom:"1px solid #f0f0f0", flexWrap:"wrap", flexShrink:0 }}>
          <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20,
                         background:prioBg, color:prioColor }}>
            {ticket.priority}
          </span>
          {ticket.ticketType !== 'bug' && (
            <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20,
                           background: ticket.format === "gwt" ? "#EEEDFE" : "#FAEEDA",
                           color: ticket.format === "gwt" ? "#3C3489" : "#854F0B" }}>
              {ticket.format.toUpperCase()}
            </span>
          )}
          {ticket.ticketType === 'bug' && ticket.severity && (
            <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20,
                           background: ticket.severity === 'critical' ? "#FCEBEB" : ticket.severity === 'major' ? "#FAEEDA" : "#f0f0f0",
                           color: ticket.severity === 'critical' ? "#791F1F" : ticket.severity === 'major' ? "#854F0B" : "#666" }}>
              {ticket.severity.charAt(0).toUpperCase() + ticket.severity.slice(1)}
            </span>
          )}
          <span style={{ fontSize:10, fontWeight:600, padding:"3px 9px", borderRadius:20,
                         background:"#f0eff7", color:"#534AB7", border:"1px solid #ddd" }}>
            {ticket.points} SP
          </span>
          <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20,
                         background:stBg, color:stColor }}>
            {STATUS_LABEL[ticket.status]}
          </span>
          {sprint && (
            <span style={{ fontSize:10, fontWeight:500, padding:"3px 9px", borderRadius:20,
                           background:"#f0f8ff", color:"#1a6fa8", border:"1px solid #bde0f7" }}>
              {sprint.name}
            </span>
          )}
          {ticket.moscow && (
            <MoSCoWBadge category={ticket.moscow} justification={ticket.moscowJustification} />
          )}
          {ticket.suggestedSP !== undefined && ticket.suggestedSP !== ticket.points && (
            <span style={{ fontSize:'10px', color:'#854F0B', background:'#FAEEDA',
                           padding:'2px 7px', borderRadius:'10px', fontWeight:500 }}>
              AI suggests: {ticket.suggestedSP} SP
            </span>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:"flex", padding:"0 22px", borderBottom:"1px solid #e8e8f0", flexShrink:0 }}>
          {(["requirements","verdicts","testcases","technotes","history"] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ background:"none", border:"none", cursor:"pointer", padding:"12px 14px",
                       fontSize:13, fontWeight:500, fontFamily:"inherit",
                       borderBottom: activeTab === tab ? "2px solid #534AB7" : "2px solid transparent",
                       color: activeTab === tab ? "#534AB7" : "#888",
                       marginBottom:-1, display:"flex", alignItems:"center", gap:4 }}>
              {tab === "testcases" ? (
                <>
                  <span>Test Cases</span>
                  {tcCount > 0 && (
                    <span style={{
                      background: '#E1F5EE', color: '#085041',
                      fontSize: 9, padding: '1px 5px',
                      borderRadius: 10, fontWeight: 600,
                    }}>
                      {tcCount}
                    </span>
                  )}
                </>
              ) : tab === "technotes" ? (
                <>
                  <span>Tech Notes</span>
                  {ticket.techNotes && (
                    <span style={{
                      background: '#E1F5EE', color: '#085041',
                      fontSize: 9, padding: '1px 5px',
                      borderRadius: 10, fontWeight: 600,
                      marginLeft: 3,
                    }}>
                      ✓
                    </span>
                  )}
                </>
              ) : (
                tab.charAt(0).toUpperCase() + tab.slice(1)
              )}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div style={{ flex:1, overflowY:"auto", padding:22 }}>

          {/* Resolved banner */}
          {isResolved && (
            <div style={{
              background: '#E1F5EE', border: '1px solid #A7F3D0',
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 8,
            }}>
              <span style={{ fontSize: 12, color: '#085041', fontWeight: 500 }}>
                ✓ Resolved in{' '}
                <strong>{getSprintName(ticket.resolvedInSprint!)}</strong>
                {ticket.resolvedAt ? ` · ${ticket.resolvedAt.split('T')[0]}` : ''}
              </span>
              <button
                onClick={handleReopen}
                disabled={isReopening}
                style={{
                  padding: '5px 14px', borderRadius: 6,
                  border: '1.5px solid #27500A',
                  background: 'none', color: '#27500A',
                  cursor: isReopening ? 'not-allowed' : 'pointer',
                  fontSize: 12, fontWeight: 600, flexShrink: 0,
                }}
              >
                {isReopening ? 'Reopening…' : '↩ Reopen'}
              </button>
            </div>
          )}

          {/* Requirements tab */}
          {activeTab === "requirements" && (
            <div>
              {ticket.ticketType === 'bug' && ticket.bugReport ? (
                <BugReportView bugReport={ticket.bugReport} />
              ) : (
                <>
                  {ticket.data.format === "gwt" && (ticket.data as GWTRequirement).scenarios.map((sc, i) => (
                    <div key={i} style={{ marginBottom:16 }}>
                      <div style={{ fontSize:11, fontWeight:500, color:"#888", marginBottom:6 }}>
                        Scenario {i + 1}: {sc.name}
                      </div>
                      <div style={{ background:"#f8f8fc", borderLeft:"3px solid #7F77DD",
                                    borderRadius:"0 8px 8px 0", padding:"12px 15px",
                                    fontSize:12, lineHeight:2, fontFamily:"monospace" }}>
                        <span style={{ color:"#0F6E56", fontWeight:700 }}>Given </span>{sc.given}<br/>
                        <span style={{ color:"#854F0B", fontWeight:700 }}>When </span>{sc.when}<br/>
                        <span style={{ color:"#27500A", fontWeight:700 }}>Then </span>{sc.then}
                      </div>
                    </div>
                  ))}

                  {ticket.data.format === "classic" && (() => {
                    const c = ticket.data as ClassicRequirement
                    const Section = ({ label, items }: { label: string; items: string[] }) => (
                      <div style={{ marginBottom:14 }}>
                        <div style={{ fontSize:10, fontWeight:600, color:"#aaa", textTransform:"uppercase",
                                      letterSpacing:"0.05em", marginBottom:6 }}>{label}</div>
                        {items.map((item, i) => (
                          <div key={i} style={{ fontSize:12, color:"#444", lineHeight:1.7, paddingLeft:4 }}>
                            {i + 1}. {item}
                          </div>
                        ))}
                      </div>
                    )
                    return (
                      <>
                        <div style={{ marginBottom:14 }}>
                          <div style={{ fontSize:10, fontWeight:600, color:"#aaa", textTransform:"uppercase",
                                        letterSpacing:"0.05em", marginBottom:6 }}>Objective</div>
                          <div style={{ fontSize:12, color:"#444", lineHeight:1.7 }}>{c.objective}</div>
                        </div>
                        <Section label="Functional Requirements" items={c.functional_requirements} />
                        <Section label="Non-Functional Requirements" items={c.non_functional_requirements} />
                        <Section label="Acceptance Criteria" items={c.acceptance_criteria} />
                        {c.out_of_scope.length > 0 && <Section label="Out of Scope" items={c.out_of_scope} />}
                      </>
                    )
                  })()}

                  {ticket.data.notes && (
                    <div style={{ marginTop:14, padding:"10px 14px", background:"#fffbf0",
                                  borderRadius:8, border:"1px solid #f0e0b0", fontSize:12, color:"#666" }}>
                      <span style={{ fontWeight:600, color:"#854F0B" }}>Notes: </span>{ticket.data.notes}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Verdicts tab */}
          {activeTab === "verdicts" && (
            <div>
              {(ticket.qaVerdict || ticket.devVerdict) ? (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>

                  {/* QA card */}
                  {ticket.qaVerdict ? (
                    <div style={{ background:"#f8fff8", border:"1px solid #b8e8b8", borderRadius:10, padding:14 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                        <div style={{ width:34, height:34, borderRadius:"50%", background:"#0F6E56",
                                      display:"flex", alignItems:"center", justifyContent:"center",
                                      fontSize:11, fontWeight:700, color:"#fff", flexShrink:0 }}>QL</div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:600 }}>QA Lead</div>
                          <div style={{ fontSize:11, color: ticket.qaVerdict.testable ? "#0F6E56" : "#791F1F" }}>
                            {ticket.qaVerdict.testable ? "✓ Testable" : "✗ Not testable"}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize:12, color:"#555", lineHeight:1.6, marginBottom:10 }}>
                        {ticket.qaVerdict.summary}
                      </div>
                      {ticket.qaVerdict.issues.length > 0 && (
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                          {ticket.qaVerdict.issues.map((issue, i) => (
                            <span key={i} style={{ fontSize:10, padding:"2px 8px", borderRadius:20,
                                                   background:"#FAEEDA", color:"#854F0B", border:"1px solid #e8c97a" }}>
                              {issue}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ background:"#f8fff8", border:"1px solid #b8e8b8", borderRadius:10,
                                  padding:14, display:"flex", alignItems:"center", justifyContent:"center",
                                  color:"#aaa", fontSize:12 }}>No QA verdict</div>
                  )}

                  {/* Dev card */}
                  {ticket.devVerdict ? (
                    <div style={{ background:"#FFF8F0", border:"1px solid #f0c070", borderRadius:10, padding:14 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                        <div style={{ width:34, height:34, borderRadius:"50%", background:"#854F0B",
                                      display:"flex", alignItems:"center", justifyContent:"center",
                                      fontSize:11, fontWeight:700, color:"#fff", flexShrink:0 }}>DL</div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:600 }}>Dev Lead</div>
                          <div style={{ fontSize:11, color: ticket.devVerdict.feasible ? "#0F6E56" : "#791F1F" }}>
                            {ticket.devVerdict.feasible ? "✓ Feasible" : "✗ Not feasible"}
                          </div>
                        </div>
                        <span style={{ marginLeft:"auto", fontSize:10, fontWeight:600, padding:"2px 8px",
                                       borderRadius:20, background:"#fff3dc", color:"#854F0B",
                                       border:"1px solid #e8c97a", flexShrink:0 }}>
                          {ticket.devVerdict.complexity}
                        </span>
                      </div>
                      <div style={{ fontSize:12, color:"#555", lineHeight:1.6, marginBottom:10 }}>
                        {ticket.devVerdict.summary}
                      </div>
                      {ticket.devVerdict.blockers.length > 0 && (
                        <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                          {ticket.devVerdict.blockers.map((b, i) => (
                            <span key={i} style={{ fontSize:10, padding:"2px 8px", borderRadius:20,
                                                   background:"#FCEBEB", color:"#791F1F", border:"1px solid #f5b8b8" }}>
                              {b}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ background:"#FFF8F0", border:"1px solid #f0c070", borderRadius:10,
                                  padding:14, display:"flex", alignItems:"center", justifyContent:"center",
                                  color:"#aaa", fontSize:12 }}>No Dev verdict</div>
                  )}
                </div>
              ) : (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                              height:120, color:"#aaa", fontSize:13 }}>
                  No verdict data available
                </div>
              )}
            </div>
          )}

          {/* Test Cases tab */}
          {activeTab === "testcases" && (
            <TestCasePanel ticketId={ticketId} ticketTitle={ticket.title} />
          )}

          {/* Tech Notes tab */}
          {activeTab === "technotes" && (
            <TechNotesPanel
              ticket={ticket}
              onGenerated={(notes) => updateTicket(ticket.id, { techNotes: notes })}
            />
          )}

          {/* History tab */}
          {activeTab === "history" && (
            <div>
              {sortedHistory.length === 0 ? (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                              height:120, color:"#aaa", fontSize:13 }}>
                  No history available
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column" }}>
                  {sortedHistory.map((entry, i) => {
                    const dotColor = ROLE_DOT_COLOR[entry.actorRole]
                    const isLast = i === sortedHistory.length - 1
                    return (
                      <div key={entry.id} style={{ display:"flex", gap:14, position:"relative" }}>
                        {/* Dot + vertical line */}
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0, width:16 }}>
                          <div style={{ width:10, height:10, borderRadius:"50%", background:dotColor,
                                        marginTop:4, flexShrink:0, zIndex:1 }} />
                          {!isLast && (
                            <div style={{ width:2, flex:1, background:"#e8e8f0", minHeight:24, marginTop:2 }} />
                          )}
                        </div>
                        {/* Content */}
                        <div style={{ paddingBottom: isLast ? 0 : 16, flex:1 }}>
                          <div style={{ fontSize:10, color:"#bbb", fontFamily:"monospace", marginBottom:3 }}>
                            {new Date(entry.timestamp).toLocaleString()}
                          </div>
                          <div style={{ fontSize:12, lineHeight:1.5 }}>
                            <span style={{ fontWeight:600, color:"#333" }}>{entry.actor}</span>
                            <span style={{ color:"#555" }}> — {entry.message}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:0, borderTop:"1px solid #e8e8f0", flexShrink:0 }}>
          {/* Push result cards */}
          {(ticket.pushedTo === "jira" && ticket.pushedUrl) && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 22px",
                          background:"#f0fff8", borderBottom:"1px solid #b3e8d0", fontSize:12 }}>
              <span style={{ color:"#0F6E56", fontWeight:700 }}>✓ Pushed to Jira</span>
              <a href={ticket.pushedUrl} target="_blank" rel="noreferrer"
                style={{ color:"#0F6E56", fontWeight:500, textDecoration:"underline" }}>
                Open in Jira ↗
              </a>
              <span style={{ color:"#888", marginLeft:"auto", fontSize:10 }}>
                {ticket.pushedAt ? new Date(ticket.pushedAt).toLocaleString() : ""}
              </span>
            </div>
          )}
          {(ticket.pushedTo === "azure" && ticket.pushedUrl) && (
            <div style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 22px",
                          background:"#f0f4ff", borderBottom:"1px solid #b3c8f0", fontSize:12 }}>
              <span style={{ color:"#1a3fa8", fontWeight:700 }}>✓ Pushed to Azure DevOps</span>
              <a href={ticket.pushedUrl} target="_blank" rel="noreferrer"
                style={{ color:"#1a3fa8", fontWeight:500, textDecoration:"underline" }}>
                Open in Azure ↗
              </a>
              <span style={{ color:"#888", marginLeft:"auto", fontSize:10 }}>
                {ticket.pushedAt ? new Date(ticket.pushedAt).toLocaleString() : ""}
              </span>
            </div>
          )}
          {jiraError && (
            <div style={{ padding:"6px 22px", background:"#fff5f5", borderBottom:"1px solid #f5b8b8",
                          fontSize:11, color:"#791F1F" }}>
              Jira: {jiraError}
            </div>
          )}
          {azureError && (
            <div style={{ padding:"6px 22px", background:"#fff5f5", borderBottom:"1px solid #f5b8b8",
                          fontSize:11, color:"#791F1F" }}>
              Azure: {azureError}
            </div>
          )}

          {/* Action row */}
          <div style={{ display:"flex", gap:8, padding:"14px 22px", flexWrap:"wrap" }}>
            {nextSt && !isResolved && (
              <button onClick={handleMove}
                style={{ background:"#534AB7", color:"#fff", border:"none", borderRadius:8,
                         padding:"8px 16px", fontSize:12, fontWeight:500, cursor:"pointer" }}>
                → Move to {STATUS_LABEL[nextSt]}
              </button>
            )}
            <button onClick={handleCopyJSON}
              style={{ background:"none", border:"1.5px solid #ddd", color:"#555", borderRadius:8,
                       padding:"8px 14px", fontSize:12, cursor:"pointer" }}>
              ⎘ Copy JSON
            </button>

            {/* Jira push button */}
            {ticket.pushedTo === "jira" ? (
              <button disabled
                style={{ background:"#0F6E56", color:"#fff", border:"none", borderRadius:8,
                         padding:"8px 14px", fontSize:12, cursor:"not-allowed", opacity:0.85 }}>
                ✓ Pushed to Jira
              </button>
            ) : !isJiraConfigured ? (
              <button disabled title="Configure Jira in Settings"
                style={{ background:"none", border:"1.5px solid #ccc", color:"#aaa", borderRadius:8,
                         padding:"8px 14px", fontSize:12, cursor:"not-allowed" }}>
                [J] Push to Jira
              </button>
            ) : jiraPushState === "loading" ? (
              <button disabled
                style={{ background:"none", border:"1.5px solid #0F6E56", color:"#0F6E56", borderRadius:8,
                         padding:"8px 14px", fontSize:12, cursor:"not-allowed", opacity:0.6 }}>
                Pushing…
              </button>
            ) : jiraPushState === "error" ? (
              <button onClick={handlePushJira}
                style={{ background:"none", border:"1.5px solid #791F1F", color:"#791F1F", borderRadius:8,
                         padding:"8px 14px", fontSize:12, cursor:"pointer" }}>
                ✗ Failed — Retry Jira
              </button>
            ) : (
              <button onClick={handlePushJira}
                style={{ background:"none", border:"1.5px solid #0F6E56", color:"#0F6E56", borderRadius:8,
                         padding:"8px 14px", fontSize:12, cursor:"pointer", fontWeight:500 }}>
                [J] Push to Jira
              </button>
            )}

            {/* Azure push button */}
            {ticket.pushedTo === "azure" ? (
              <button disabled
                style={{ background:"#1a3fa8", color:"#fff", border:"none", borderRadius:8,
                         padding:"8px 14px", fontSize:12, cursor:"not-allowed", opacity:0.85 }}>
                ✓ Pushed to Azure
              </button>
            ) : !isAzureConfigured ? (
              <button disabled title="Configure Azure DevOps in Settings"
                style={{ background:"none", border:"1.5px solid #ccc", color:"#aaa", borderRadius:8,
                         padding:"8px 14px", fontSize:12, cursor:"not-allowed" }}>
                [A] Push to Azure
              </button>
            ) : azurePushState === "loading" ? (
              <button disabled
                style={{ background:"none", border:"1.5px solid #1a3fa8", color:"#1a3fa8", borderRadius:8,
                         padding:"8px 14px", fontSize:12, cursor:"not-allowed", opacity:0.6 }}>
                Pushing…
              </button>
            ) : azurePushState === "error" ? (
              <button onClick={handlePushAzure}
                style={{ background:"none", border:"1.5px solid #791F1F", color:"#791F1F", borderRadius:8,
                         padding:"8px 14px", fontSize:12, cursor:"pointer" }}>
                ✗ Failed — Retry Azure
              </button>
            ) : (
              <button onClick={handlePushAzure}
                style={{ background:"none", border:"1.5px solid #1a3fa8", color:"#1a3fa8", borderRadius:8,
                         padding:"8px 14px", fontSize:12, cursor:"pointer", fontWeight:500 }}>
                [A] Push to Azure
              </button>
            )}

            {!isResolved && (
              <button onClick={handleDelete}
                style={{ background:"none", border:"1.5px solid #f5b8b8", color:"#791F1F", borderRadius:8,
                         padding:"8px 14px", fontSize:12, cursor:"pointer", marginLeft:"auto" }}>
                🗑 Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {dodModalOpen && (
        <DoDChecklistModal
          isOpen={dodModalOpen}
          ticketId={ticket.id}
          ticketTitle={ticket.title}
          ticketPoints={ticket.points}
          onConfirm={handleDodConfirm}
          onCancel={() => setDodModalOpen(false)}
        />
      )}
    </div>
  )
}
