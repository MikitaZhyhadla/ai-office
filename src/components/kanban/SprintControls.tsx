'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { CreateSprintModal } from './CreateSprintModal'
import { CloseSprintModal } from './CloseSprintModal'

export function SprintControls() {
  const sprints = useAppStore(s => s.sprints)
  const tickets = useAppStore(s => s.tickets)
  const closeSprint = useAppStore(s => s.closeSprint)

  const [showCreate, setShowCreate] = useState(false)
  const [showClose, setShowClose] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const activeSprint = sprints.find(s => s.status === 'active') ?? null

  const sprintTickets = activeSprint
    ? tickets.filter(t => activeSprint.ticketIds.includes(t.id))
    : []

  const doneCount = sprintTickets.filter(t => t.status === 'done').length
  const totalSP = sprintTickets.reduce((sum, t) => sum + (t.points ?? 0), 0)
  const doneSP = sprintTickets.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.points ?? 0), 0)

  const handleCloseConfirm = () => {
    if (!activeSprint) return
    const result = closeSprint(activeSprint.id)
    setShowClose(false)
    setToastMsg(`Sprint closed. ${result.resolvedCount} tickets resolved, ${result.returnedCount} returned to backlog.`)
    setTimeout(() => setToastMsg(null), 5000)
  }

  if (!activeSprint) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', marginBottom: 16, borderBottom: '1px solid #e8e8f0' }}>
          <span style={{ fontSize: 13, color: '#aaa' }}>No active sprint — create one to start tracking work</span>
          <button onClick={() => setShowCreate(true)}
            style={{ padding: '7px 16px', borderRadius: 6, border: '1.5px solid #534AB7', background: 'none', color: '#534AB7', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            + New Sprint
          </button>
        </div>
        {showCreate && <CreateSprintModal onClose={() => setShowCreate(false)} />}
      </>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', marginBottom: 16, borderBottom: '1px solid #e8e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1F3864' }}>🏃 {activeSprint.name}</span>
          <span style={{ fontSize: 11, background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Active</span>
          <span style={{ fontSize: 11, color: '#aaa' }}>{activeSprint.startDate} → {activeSprint.endDate}</span>
          <span style={{ fontSize: 11, color: '#534AB7', fontWeight: 600 }}>{doneSP} / {totalSP} SP Done</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            disabled
            title="Only one active sprint at a time"
            style={{ padding: '7px 14px', borderRadius: 6, border: '1.5px solid #ddd', background: 'none', color: '#bbb', cursor: 'not-allowed', fontSize: 12 }}>
            + New Sprint
          </button>
          {activeSprint && (
            <button onClick={() => setShowClose(true)}
              style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: '#791F1F', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              ✕ Close Sprint
            </button>
          )}
        </div>
      </div>

      {showCreate && <CreateSprintModal onClose={() => setShowCreate(false)} />}

      {showClose && (
        <CloseSprintModal
          sprint={activeSprint}
          sprintTickets={sprintTickets}
          onConfirm={handleCloseConfirm}
          onClose={() => setShowClose(false)}
        />
      )}

      {toastMsg && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1F3864', color: '#fff', padding: '12px 20px', borderRadius: 10, fontSize: 13, zIndex: 2000, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
          ✓ {toastMsg}
        </div>
      )}
    </>
  )
}
