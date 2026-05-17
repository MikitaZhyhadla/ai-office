"use client"
import { useState } from "react"
import { Topbar } from "@/components/shared/Topbar"
import { PipelineStages } from "@/components/pipeline/PipelineStages"
import { RequirementInput } from "@/components/pipeline/RequirementInput"
import { ReviewCard } from "@/components/pipeline/ReviewCard"
import { RevisionBanner } from "@/components/pipeline/RevisionBanner"
import { ActivityLog } from "@/components/pipeline/ActivityLog"
import { useAppStore } from "@/store/useAppStore"
import { useSettingsStore } from "@/store/useSettingsStore"
import { baAgentGWT } from "@/agents/baAgentGWT"
import { baAgentClassic } from "@/agents/baAgentClassic"
import { baAgentRevise } from "@/agents/baAgentRevise"
import { qaAgent } from "@/agents/qaAgent"
import { devAgent } from "@/agents/devAgent"
import { runBugAgent } from "@/agents/bugAgent"
import { runTranslationAgent } from "@/agents/translationAgent"
import { needsTranslation, detectLanguageName } from "@/lib/detectLanguage"
import { TranslationBanner } from "@/components/pipeline/TranslationBanner"
import { useAuthStore } from "@/store/useAuthStore"
import type { Format, RequirementData, Ticket, TicketHistoryEntry, Severity } from "@/types"
import type { QAVerdict } from "@/agents/qaAgent"
import type { DevVerdict } from "@/agents/devAgent"
import type { TranslationResult } from "@/agents/translationAgent"

type PipelineMode = 'idle' | 'analyzing' | 'review' | 'qa_check' | 'revision' | 'done'
type PipelineInputMode = 'feature' | 'bug'

export default function PipelinePage() {
  const { setAgentStatus, addLog, addTicket, incPipeline } = useAppStore()
  const currentUser = useAuthStore(s => s.currentUser)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<PipelineMode>('idle')
  const [pendingReview, setPendingReview] = useState<RequirementData | null>(null)
  const [pendingFormat, setPendingFormat] = useState<Format>('gwt')
  const [qaVerdict, setQaVerdict] = useState<QAVerdict | null>(null)
  const [devVerdict, setDevVerdict] = useState<DevVerdict | null>(null)
  const [isRevising, setIsRevising] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [revisionCount, setRevisionCount] = useState(0)

  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null)

  const [inputMode, setInputMode] = useState<PipelineInputMode>('feature')
  const [bugText, setBugText] = useState('')
  const [bugAffectedArea, setBugAffectedArea] = useState('')
  const [bugSeverityHint, setBugSeverityHint] = useState<Severity | null>(null)

  async function handleSubmit(text: string, format: Format) {
    setLoading(true)
    setPendingReview(null)
    setQaVerdict(null)
    setDevVerdict(null)
    setRevisionCount(0)
    setMode('analyzing')
    setPendingFormat(format)
    setTranslationResult(null)

    // === TRANSLATION INTERCEPT — Phase 3.8 ===
    let textToAnalyze = text
    const { autoTranslate } = useSettingsStore.getState()

    if (autoTranslate && needsTranslation(textToAnalyze)) {
      const langName = detectLanguageName(textToAnalyze)
      addLog({ agentName: "Translator", agentRole: "translator", message: `Detected ${langName} text — translating to English…` })
      try {
        const result = await runTranslationAgent(textToAnalyze, langName)
        textToAnalyze = result.translated
        setTranslationResult(result)
        addLog({ agentName: "Translator", agentRole: "translator", message: `Translated from ${langName} to English successfully` })
      } catch {
        addLog({ agentName: "Translator", agentRole: "translator", message: `Translation failed — proceeding with original text` })
      }
    }
    // === END TRANSLATION INTERCEPT ===

    try {
      incPipeline("ba", 1)
      if (format === "gwt") {
        setAgentStatus("alice", "thinking", "Analyzing requirement")
        addLog({ agentName: "Alice BA", agentRole: "ba", message: "Starting GWT analysis..." })
        const result = await baAgentGWT(textToAnalyze)
        setAgentStatus("alice", "idle")
        addLog({ agentName: "Alice BA", agentRole: "ba", message: `Generated ${result.scenarios.length} scenarios for "${result.title}"` })
        setPendingReview(result)
      } else {
        setAgentStatus("bob", "thinking", "Analyzing requirement")
        addLog({ agentName: "Bob BA", agentRole: "ba", message: "Starting Classic spec analysis..." })
        const result = await baAgentClassic(textToAnalyze)
        setAgentStatus("bob", "idle")
        addLog({ agentName: "Bob BA", agentRole: "ba", message: `Generated Classic spec for "${result.title}"` })
        setPendingReview(result)
      }
      setMode('review')
      incPipeline("review", 1)
      addLog({ agentName: "System", agentRole: "system", message: "Awaiting human review decision." })
    } finally {
      incPipeline("ba", -1)
      setLoading(false)
    }
  }

  async function handleApprove() {
    if (!pendingReview) return
    setIsApproving(true)
    try {
      setMode('qa_check')
      setAgentStatus("qa1", "thinking", "Reviewing testability")
      setAgentStatus("dev1", "thinking", "Checking feasibility")
      addLog({ agentName: "QA Lead", agentRole: "qa", message: "Analyzing testability..." })
      addLog({ agentName: "Dev Lead", agentRole: "dev", message: "Checking feasibility..." })
      incPipeline("review", -1)
      incPipeline("qa", 1)
      const reqText = JSON.stringify(pendingReview)
      const [qa, dev] = await Promise.all([qaAgent(reqText), devAgent(reqText)])
      setAgentStatus("qa1", "idle")
      setAgentStatus("dev1", "idle")
      setQaVerdict(qa)
      setDevVerdict(dev)
      addLog({ agentName: "QA Lead", agentRole: "qa", message: qa.summary })
      addLog({ agentName: "Dev Lead", agentRole: "dev", message: dev.summary })

      const hasIssues = !qa.testable || !dev.feasible || qa.issues.length > 0 || dev.blockers.length > 0

      if (hasIssues) {
        incPipeline("qa", -1)
        setMode('revision')
        addLog({
          agentName: "System",
          agentRole: "system",
          message: `QA/Dev flagged issues. Revision required — ${qa.issues.length} QA issue(s), ${dev.blockers.length} Dev blocker(s).`,
        })
        return
      }

      createTicket(pendingReview, qa, dev)
    } finally {
      setIsApproving(false)
    }
  }

  async function handleSendToBA() {
    if (!pendingReview || !qaVerdict || !devVerdict) return
    setIsRevising(true)
    const round = revisionCount + 1
    addLog({ agentName: "Alice BA", agentRole: "ba", message: "BA agent is revising requirement based on QA/Dev feedback..." })
    try {
      const revised = await baAgentRevise(pendingReview, pendingFormat as 'gwt' | 'classic', qaVerdict.issues, devVerdict.blockers)
      setPendingReview(revised)
      setQaVerdict(null)
      setDevVerdict(null)
      setRevisionCount(round)
      setMode('review')
      incPipeline("review", 1)
      addLog({ agentName: "Alice BA", agentRole: "ba", message: `BA revision complete. Round #${round} — please review the updated requirement.` })
    } finally {
      setIsRevising(false)
    }
  }

  function handleApproveAnyway() {
    if (!pendingReview || !qaVerdict || !devVerdict) return
    const allIssues = [...qaVerdict.issues, ...devVerdict.blockers]
    const issueNote = allIssues.length > 0 ? `Approved with known issues: ${allIssues.join('; ')}` : undefined
    createTicket(pendingReview, qaVerdict, devVerdict, issueNote)
    addLog({ agentName: "System", agentRole: "system", message: "Ticket created with noted issues. Approved by human override." })
  }

  function createTicket(req: RequirementData, qa: QAVerdict, dev: DevVerdict, issueNote?: string) {
    const points = dev.sp_override ?? req.story_points
    const id = `TICK-${Date.now().toString().slice(-4)}`
    const now = new Date().toISOString()
    const baName = req.format === "gwt" ? "Alice BA" : "Bob BA"
    const baRole: TicketHistoryEntry["actorRole"] = "ba"

    const history: TicketHistoryEntry[] = [
      { id: crypto.randomUUID(), timestamp: now, actor: baName, actorRole: baRole, message: "Generated requirement" },
      { id: crypto.randomUUID(), timestamp: now, actor: "Human", actorRole: "human", message: "Approved requirement for QA/Dev check" },
      { id: crypto.randomUUID(), timestamp: now, actor: "QA Lead", actorRole: "qa", message: qa.summary },
      { id: crypto.randomUUID(), timestamp: now, actor: "Dev Lead", actorRole: "dev", message: dev.summary },
    ]
    if (issueNote) {
      history.push({ id: crypto.randomUUID(), timestamp: now, actor: "Human", actorRole: "human", message: "Approved with known issues" })
    }
    if (revisionCount > 0) {
      history.splice(1, 0, { id: crypto.randomUUID(), timestamp: now, actor: baName, actorRole: baRole, message: `Revised requirement (${revisionCount} round${revisionCount > 1 ? 's' : ''})` })
    }
    history.push({ id: crypto.randomUUID(), timestamp: now, actor: "System", actorRole: "system", message: `Ticket ${id} created` })

    const ticket: Ticket = {
      id,
      title: req.title,
      format: req.format,
      priority: req.priority,
      points,
      status: "todo",
      data: req,
      createdAt: now,
      userId: currentUser?.username,
      qaVerdict: qa,
      devVerdict: dev,
      history,
    }
    addTicket(ticket)
    incPipeline("qa", -1)
    incPipeline("done", 1)
    setMode('done')
    addLog({
      agentName: "System",
      agentRole: "system",
      message: issueNote
        ? `Ticket ${ticket.id} created. ${issueNote}`
        : `Ticket ${ticket.id} created and added to backlog.`,
    })
    setPendingReview(null)
    setQaVerdict(null)
    setDevVerdict(null)
  }

  async function handleAnalyzeBug() {
    if (bugText.trim().length < 20) return
    setLoading(true)
    setMode('analyzing')
    incPipeline("ba", 1)
    addLog({ agentName: "Alice BA", agentRole: "ba", message: "🐛 Bug Report received — Alice BA analyzing..." })

    try {
      const projectDescription = useSettingsStore.getState().projectDescription
      const bugReport = await runBugAgent(bugText, bugAffectedArea, bugSeverityHint, projectDescription)

      const id = `BUG-${Date.now().toString().slice(-6)}`
      const now = new Date().toISOString()

      const history: TicketHistoryEntry[] = [{
        id: crypto.randomUUID(),
        timestamp: now,
        actor: "Alice BA",
        actorRole: "ba",
        message: `Bug ticket created — Severity: ${bugReport.severity} | Area: ${bugReport.affectedArea}`,
      }]

      const newTicket: Ticket = {
        id,
        title: bugReport.title,
        ticketType: 'bug',
        format: 'bug',
        data: bugReport as unknown as RequirementData,
        bugReport,
        severity: bugReport.severity,
        priority: bugReport.severity === 'critical' ? 'high' : bugReport.severity === 'major' ? 'medium' : 'low',
        points: bugReport.severity === 'critical' ? 3 : bugReport.severity === 'major' ? 2 : 1,
        status: 'todo',
        sprintId: undefined,
        history,
        createdAt: now,
        userId: currentUser?.username,
        pushedTo: null,
      }

      addTicket(newTicket)
      incPipeline("done", 1)
      addLog({ agentName: "System", agentRole: "system", message: `✅ Bug ticket created: ${bugReport.title} [${bugReport.severity}]` })

      setBugText('')
      setBugAffectedArea('')
      setBugSeverityHint(null)
      setMode('done')
    } catch (err) {
      console.error(err)
      addLog({ agentName: "System", agentRole: "system", message: `❌ Bug analysis failed: ${String(err)}` })
      setMode('idle')
    } finally {
      incPipeline("ba", -1)
      setLoading(false)
    }
  }

  const severityButtons: { value: Severity; label: string; selectedBg: string; selectedColor: string; selectedBorder: string }[] = [
    { value: 'critical', label: '🔴 Critical', selectedBg: '#FCEBEB', selectedColor: '#791F1F', selectedBorder: '#FCA5A5' },
    { value: 'major',    label: '🟡 Major',    selectedBg: '#FAEEDA', selectedColor: '#854F0B', selectedBorder: '#EF9F27' },
    { value: 'minor',    label: '⚪ Minor',    selectedBg: '#f0f0f0', selectedColor: '#666',    selectedBorder: '#e0e0e0' },
  ]

  return (
    <div style={{ background: "#f0eff7", minHeight: "100vh" }}>
      <Topbar />
      <main style={{ padding: 22, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 18 }}>Requirements Pipeline</div>
        <PipelineStages />

        {/* Mode toggle */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ background: "#f0eff7", borderRadius: 8, padding: 3, display: "flex", width: "fit-content", gap: 3 }}>
            {([
              { m: 'feature', label: '✦ User Story' },
              { m: 'bug',     label: '🐛 Bug Report' },
            ] as { m: PipelineInputMode; label: string }[]).map(({ m, label }) => (
              <button
                key={m}
                onClick={() => setInputMode(m)}
                style={{
                  padding: "7px 18px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  background: inputMode === m ? "#fff" : "transparent",
                  color: inputMode === m ? "#534AB7" : "#888",
                  boxShadow: inputMode === m ? "0 1px 4px rgba(0,0,0,0.10)" : "none",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {inputMode === 'feature' ? (
          <RequirementInput
            onSubmit={handleSubmit}
            loading={loading}
            onTextChange={() => setTranslationResult(null)}
          />
        ) : (
          <div style={{
            background: "#fff",
            border: "1.5px solid #FCA5A5",
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>New Bug Report</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>
              BA agent will classify severity and create a ticket
            </div>

            {/* Severity */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#666", marginBottom: 8 }}>
                Severity{" "}
                <span style={{ color: "#aaa", fontWeight: 400 }}>
                  (optional — agent will classify if not set)
                </span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {severityButtons.map(({ value, label, selectedBg, selectedColor, selectedBorder }) => (
                  <button
                    key={value}
                    onClick={() => setBugSeverityHint(bugSeverityHint === value ? null : value)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      background: bugSeverityHint === value ? selectedBg : "#fff",
                      color: bugSeverityHint === value ? selectedColor : "#aaa",
                      border: `2px solid ${bugSeverityHint === value ? selectedBorder : "#e8e8f0"}`,
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#666", marginBottom: 6 }}>
                Bug Description <span style={{ color: "#E24B4A" }}>*</span>
              </div>
              <textarea
                value={bugText}
                onChange={e => setBugText(e.target.value)}
                placeholder="Describe the bug — what happened, what was expected, steps to reproduce"
                rows={5}
                style={{
                  width: "100%",
                  background: "#f8f8fc",
                  border: "1px solid #e8e8f0",
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 12,
                  lineHeight: 1.6,
                  resize: "none",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Affected area */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#666", marginBottom: 6 }}>Affected Area</div>
              <input
                value={bugAffectedArea}
                onChange={e => setBugAffectedArea(e.target.value)}
                placeholder="e.g. Authentication / Login Form"
                style={{
                  width: "100%",
                  background: "#f8f8fc",
                  border: "1px solid #e8e8f0",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Submit */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                onClick={handleAnalyzeBug}
                disabled={loading || bugText.trim().length < 20}
                style={{
                  background: loading || bugText.trim().length < 20 ? "#ccc" : "#534AB7",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "9px 18px",
                  fontSize: 12,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  cursor: loading || bugText.trim().length < 20 ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Analyzing..." : "🐛 Analyze Bug with BA Agent"}
              </button>
              <span style={{ fontSize: 11, color: "#aaa" }}>● Agents ready</span>
            </div>
          </div>
        )}

        {translationResult && inputMode === 'feature' && (
          <TranslationBanner result={translationResult} />
        )}

        {pendingReview && (
          <>
            <ReviewCard
              data={pendingReview}
              qaVerdict={mode === 'revision' ? qaVerdict : null}
              devVerdict={mode === 'revision' ? devVerdict : null}
              onApprove={handleApprove}
              onRequestChanges={() => { setPendingReview(null); setMode('idle') }}
              revisionCount={revisionCount}
              isApproving={isApproving}
            />
            {mode === 'revision' && qaVerdict && devVerdict && (
              <RevisionBanner
                qaIssues={qaVerdict.issues}
                devBlockers={devVerdict.blockers}
                onSendToBA={handleSendToBA}
                onApproveAnyway={handleApproveAnyway}
                isRevising={isRevising}
              />
            )}
          </>
        )}
        <ActivityLog />
      </main>
    </div>
  )
}
