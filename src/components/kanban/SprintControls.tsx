'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { CreateSprintModal } from './CreateSprintModal'
import { CloseSprintAndRetroButton } from '@/components/shared/CloseSprintAndRetroButton'

export function SprintControls() {
  const sprints = useAppStore(s => s.sprints)
  const tickets = useAppStore(s => s.tickets)

  const [showCreate, setShowCreate] = useState(false)

  const activeSprint = sprints.find(s => s.status === 'active') ?? null

  const sprintTickets = activeSprint
    ? tickets.filter(t => activeSprint.ticketIds.includes(t.id))
    : []

  const totalSP = sprintTickets.reduce((sum, t) => sum + (t.points ?? 0), 0)
  const doneSP = sprintTickets.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.points ?? 0), 0)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', marginBottom: 16, borderBottom: '1px solid #e8e8f0' }}>
        {activeSprint ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1F3864' }}>🏃 {activeSprint.name}</span>
            <span style={{ fontSize: 11, background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Active</span>
            <span style={{ fontSize: 11, color: '#aaa' }}>{activeSprint.startDate} → {activeSprint.endDate}</span>
            <span style={{ fontSize: 11, color: '#534AB7', fontWeight: 600 }}>{doneSP} / {totalSP} SP Done</span>
          </div>
        ) : (
          <span style={{ fontSize: 13, color: '#aaa' }}>No active sprint — create one to start tracking work</span>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={!activeSprint ? () => setShowCreate(true) : undefined}
            disabled={!!activeSprint}
            title={activeSprint ? 'Only one active sprint at a time' : undefined}
            style={{
              padding: '7px 14px', borderRadius: 6, background: 'none', fontSize: 12, fontWeight: 600,
              border: activeSprint ? '1.5px solid #ddd' : '1.5px solid #534AB7',
              color: activeSprint ? '#bbb' : '#534AB7',
              cursor: activeSprint ? 'not-allowed' : 'pointer',
            }}>
            + New Sprint
          </button>
          {/* Always mounted so RetroModal state survives sprint closure */}
          <CloseSprintAndRetroButton disabled={!activeSprint} />
        </div>
      </div>

      {showCreate && <CreateSprintModal onClose={() => setShowCreate(false)} />}
    </>
  )
}
