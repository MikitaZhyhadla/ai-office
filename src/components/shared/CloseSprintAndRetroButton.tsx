'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useSettingsStore } from '@/store/useSettingsStore'
import { CloseSprintModal } from '@/components/kanban/CloseSprintModal'
import { RetroModal } from '@/components/backlog/RetroModal'
import { runRetroAgent } from '@/agents/retroAgent'
import type { RetroReport } from '@/types'

interface Props {
  disabled?: boolean
}

type FlowState = 'idle' | 'confirmModal' | 'retroModal'

export function CloseSprintAndRetroButton({ disabled }: Props) {
  const { tickets, sprints, closeSprint, closeSprintWithRetro } = useAppStore()
  const currentUser = useAuthStore(s => s.currentUser)
  const { projectName, projectDescription } = useSettingsStore()

  const [flowState, setFlowState] = useState<FlowState>('idle')
  const [retroLoading, setRetroLoading] = useState(false)
  const [retroReport, setRetroReport] = useState<RetroReport | null>(null)
  const [avgCycleTimeDays, setAvgCycleTimeDays] = useState<number | null>(null)
  const [capturedSprintName, setCapturedSprintName] = useState('')

  const activeSprint = sprints.find(s => s.status === 'active') ?? null
  const allSprintTickets = activeSprint
    ? tickets.filter(t => activeSprint.ticketIds.includes(t.id))
    : []

  const isDisabled = disabled || !activeSprint

  async function handleCloseConfirm() {
    if (!activeSprint) return

    // Capture sprint data BEFORE closing so store state is preserved
    const mySprintTickets = tickets.filter(
      t => activeSprint.ticketIds.includes(t.id) && t.userId === currentUser?.username
    )

    const agentTickets = mySprintTickets.map(t => {
      const history = t.history ?? []
      const timestamps = history.map(h => new Date(h.timestamp).getTime()).filter(n => !isNaN(n))
      const cycleTimeMs = timestamps.length >= 2
        ? Math.max(...timestamps) - Math.min(...timestamps)
        : 0
      return {
        id:          t.id,
        title:       t.title,
        format:      t.format,
        points:      t.points,
        status:      t.status,
        baRevisions: history.filter(h => h.actorRole === 'ba').length,
        qaIssues:    t.qaVerdict?.issues?.length ?? 0,
        devBlockers: t.devVerdict?.blockers?.length ?? 0,
        cycleTimeMs,
      }
    })

    const doneCycleTimes = agentTickets
      .filter(t => t.status === 'done' && t.cycleTimeMs > 0)
      .map(t => t.cycleTimeMs)
    const avgMs = doneCycleTimes.length > 0
      ? doneCycleTimes.reduce((a, b) => a + b, 0) / doneCycleTimes.length
      : null
    const avgDays = avgMs != null ? Math.round(avgMs / (1000 * 60 * 60 * 24)) : null

    const sprintId = activeSprint.id
    const sprintName = activeSprint.name
    const startDate = activeSprint.startDate
    const endDate = activeSprint.endDate

    // Step A: execute sprint close (moves tickets, marks sprint closed)
    closeSprint(sprintId)

    // Step B: open retro modal and generate retrospective
    setCapturedSprintName(sprintName)
    setAvgCycleTimeDays(avgDays)
    setRetroLoading(true)
    setRetroReport(null)
    setFlowState('retroModal')

    try {
      const result = await runRetroAgent({
        sprintName,
        startDate,
        endDate,
        projectName:        projectName || 'AI Office Project',
        projectDescription: projectDescription || 'A requirements pipeline tool.',
        tickets:            agentTickets,
      })
      setRetroReport(result)
      closeSprintWithRetro(sprintId, result)
    } catch (err) {
      console.error('Retro generation failed:', err)
      setFlowState('idle')
      alert('Failed to generate retrospective. Please try again.')
    } finally {
      setRetroLoading(false)
    }
  }

  async function handleExportTxt() {
    if (!retroReport) return
    try {
      const res = await fetch('/api/export-retro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: retroReport, sprintName: capturedSprintName }),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `retro-${capturedSprintName.replace(/\s+/g, '-')}.txt`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  return (
    <>
      <button
        onClick={() => { if (!isDisabled) setFlowState('confirmModal') }}
        disabled={isDisabled}
        style={{
          background:  isDisabled ? '#a09de0' : '#534AB7',
          color:       '#fff',
          border:      'none',
          borderRadius: 8,
          padding:     '7px 14px',
          fontSize:    12,
          fontWeight:  500,
          cursor:      isDisabled ? 'not-allowed' : 'pointer',
          display:     'flex',
          alignItems:  'center',
          gap:         6,
          fontFamily:  'inherit',
          opacity:     isDisabled ? 0.6 : 1,
          whiteSpace:  'nowrap',
        }}
      >
        📊 Close Sprint &amp; Generate Retro
      </button>

      {flowState === 'confirmModal' && activeSprint && (
        <CloseSprintModal
          sprint={activeSprint}
          sprintTickets={allSprintTickets}
          onConfirm={handleCloseConfirm}
          onClose={() => setFlowState('idle')}
        />
      )}

      <RetroModal
        isOpen={flowState === 'retroModal'}
        report={retroReport}
        sprintName={capturedSprintName}
        isLoading={retroLoading}
        avgCycleTimeDays={avgCycleTimeDays}
        onClose={() => { setFlowState('idle'); setRetroReport(null) }}
        onExport={handleExportTxt}
        onStartNextSprint={() => { setFlowState('idle'); setRetroReport(null) }}
      />
    </>
  )
}
