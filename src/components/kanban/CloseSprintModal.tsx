'use client'
import type { Sprint, Ticket } from '@/types'

interface CloseSprintModalProps {
  sprint: Sprint
  sprintTickets: Ticket[]
  onConfirm: () => void
  onClose: () => void
}

export function CloseSprintModal({ sprint, sprintTickets, onConfirm, onClose }: CloseSprintModalProps) {
  const doneTickets = sprintTickets.filter(t => t.status === 'done')
  const unfinishedTickets = sprintTickets.filter(t => t.status !== 'done')
  const velocity = doneTickets.reduce((sum, t) => sum + (t.points ?? 0), 0)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 520, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>

        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#791F1F', marginBottom: 4 }}>
          Close {sprint.name}?
        </h2>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
          {sprint.startDate} → {sprint.endDate}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total Tickets', value: sprintTickets.length, color: '#1F3864' },
            { label: 'Completed ✓', value: doneTickets.length, color: '#27500A' },
            { label: 'Velocity', value: `${velocity} SP`, color: '#534AB7' },
          ].map(s => (
            <div key={s.label} style={{ background: '#f8f8fc', borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#aaa' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {doneTickets.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#27500A', marginBottom: 6 }}>
              ✓ Moving to Resolved ({doneTickets.length})
            </p>
            <div style={{ borderLeft: '3px solid #27500A', paddingLeft: 10, marginBottom: 16 }}>
              {doneTickets.map(t => (
                <div key={t.id} style={{ fontSize: 12, color: '#333', padding: '3px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t.title}</span>
                  <span style={{ color: '#888', fontSize: 11 }}>{t.points} SP</span>
                </div>
              ))}
            </div>
          </>
        )}

        {unfinishedTickets.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#854F0B', marginBottom: 6 }}>
              ↩ Returning to Backlog ({unfinishedTickets.length})
            </p>
            <div style={{ borderLeft: '3px solid #EF9F27', paddingLeft: 10, marginBottom: 16 }}>
              {unfinishedTickets.map(t => (
                <div key={t.id} style={{ fontSize: 12, color: '#333', padding: '3px 0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t.title}</span>
                  <span style={{ color: '#888', fontSize: 11, textTransform: 'capitalize' }}>{t.status}</span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#854F0B', background: '#FAEEDA', borderRadius: 6, padding: '8px 12px', marginBottom: 16 }}>
              ⚠ {unfinishedTickets.length} unfinished ticket{unfinishedTickets.length > 1 ? 's' : ''} will return to the backlog without a sprint.
            </p>
          </>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #e0e0f0', background: 'none', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
          <button onClick={onConfirm}
            style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: '#791F1F', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            Close Sprint
          </button>
        </div>
      </div>
    </div>
  )
}
