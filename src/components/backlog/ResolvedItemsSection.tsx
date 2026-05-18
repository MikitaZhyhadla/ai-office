'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function ResolvedItemsSection() {
  const [isOpen, setIsOpen] = useState(false)
  const tickets = useAppStore(s => s.tickets)
  const sprints = useAppStore(s => s.sprints)
  const setSelectedTicket = useAppStore(s => s.setSelectedTicket)
  const reopenTicket = useAppStore(s => s.reopenTicket)

  const resolvedTickets = tickets.filter(t => !!t.resolvedInSprint)

  const closedSprints = sprints
    .filter(s => s.status === 'closed')
    .sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''))

  const totalResolved = resolvedTickets.length

  if (totalResolved === 0 && closedSprints.length === 0) {
    return (
      <div style={{ marginTop: 24, padding: '16px', background: '#f8f8fc', borderRadius: 8, textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: '#aaa', margin: 0 }}>No resolved items yet. Close a sprint to archive completed tickets.</p>
      </div>
    )
  }

  return (
    <div style={{ marginTop: 24 }}>
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#f0f0f7', borderRadius: 8, border: 'none', cursor: 'pointer', marginBottom: isOpen ? 12 : 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#27500A' }}>
          ✓ Resolved Items
          <span style={{ marginLeft: 8, background: '#E1F5EE', color: '#085041', padding: '1px 8px', borderRadius: 12, fontSize: 11 }}>{totalResolved}</span>
        </span>
        <span style={{ color: '#888', fontSize: 16 }}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div>
          {closedSprints.map(sprint => {
            const sprintResolved = resolvedTickets.filter(t => t.resolvedInSprint === sprint.id)
            if (sprintResolved.length === 0) return null
            const sprintVelocity = sprintResolved.reduce((sum, t) => sum + (t.points ?? 0), 0)

            return (
              <div key={sprint.id} style={{ marginBottom: 16, border: '1px solid #e8e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <div style={{ background: '#f8f8fc', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e8e8f0' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1F3864' }}>{sprint.name}</span>
                  <span style={{ fontSize: 11, color: '#888' }}>
                    closed {sprint.closedAt?.split('T')[0] ?? ''} · {sprintVelocity} SP · {sprintResolved.length} tickets
                  </span>
                </div>

                {sprintResolved.map(ticket => (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #f0f0f7', borderLeft: '3px solid #27500A', cursor: 'pointer', background: 'transparent', transition: 'background 0.1s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f5f5fa' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ width: 3, height: 28, borderRadius: 2, background: ticket.priority === 'high' ? '#E24B4A' : ticket.priority === 'medium' ? '#EF9F27' : '#639922', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace', width: 72, flexShrink: 0 }}>{ticket.id}</span>
                    <span style={{ fontSize: 13, flex: 1 }}>{ticket.title}</span>
                    <span style={{ fontSize: 10, background: ticket.ticketType === 'bug' ? '#fee2e2' : '#ede9fe', color: ticket.ticketType === 'bug' ? '#991b1b' : '#4c1d95', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>
                      {ticket.ticketType === 'bug' ? 'Bug' : 'User Story'}
                    </span>
                    <span style={{ fontSize: 10, background: '#f0eff7', color: '#534AB7', padding: '2px 8px', borderRadius: 5, fontWeight: 600 }}>{ticket.points} SP</span>
                    <span style={{ fontSize: 10, background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>Resolved</span>
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        reopenTicket(ticket.id)
                      }}
                      style={{
                        padding: '3px 10px', borderRadius: 6,
                        border: '1px solid #27500A',
                        background: 'none', color: '#27500A',
                        cursor: 'pointer', fontSize: 11, fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      ↩ Reopen
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
