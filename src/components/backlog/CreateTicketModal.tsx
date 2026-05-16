'use client'
import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { Ticket, Format, Priority, GWTRequirement, ClassicRequirement } from '@/types'

interface CreateTicketModalProps {
  onClose: () => void
  onSave: (ticket: Ticket) => void
}

const POINTS_OPTIONS = [1, 2, 3, 5, 8, 13]

export function CreateTicketModal({ onClose, onSave }: CreateTicketModalProps) {
  const currentUser = useAuthStore(s => s.currentUser)
  const [title,    setTitle]    = useState('')
  const [format,   setFormat]   = useState<Format>('gwt')
  const [priority, setPriority] = useState<Priority>('medium')
  const [points,   setPoints]   = useState<number>(3)
  const [reqText,  setReqText]  = useState('')
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  function clearError() {
    if (error) setError(null)
  }

  function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    if (!reqText.trim()) { setError('Requirements text is required'); return }
    if (points < 1 || points > 13) { setError('Story points must be between 1 and 13'); return }

    const currentTickets = useAppStore.getState().tickets
    const nextNum = currentTickets.length + 1
    const newId = `TICK-${String(nextNum).padStart(3, '0')}`

    let data: GWTRequirement | ClassicRequirement

    if (format === 'gwt') {
      const gwt: GWTRequirement = {
        title: title.trim(),
        format: 'gwt',
        scenarios: [{
          name: 'Scenario 1',
          given: 'the context is set up',
          when: reqText.trim(),
          then: 'the expected outcome occurs',
        }],
        story_points: points,
        priority,
        notes: 'Manually created ticket',
      }
      data = gwt
    } else {
      const classic: ClassicRequirement = {
        title: title.trim(),
        format: 'classic',
        objective: reqText.trim(),
        functional_requirements: [reqText.trim()],
        non_functional_requirements: [],
        acceptance_criteria: ['To be defined'],
        out_of_scope: [],
        story_points: points,
        priority,
        notes: 'Manually created ticket',
      }
      data = classic
    }

    const ticket: Ticket = {
      id: newId,
      title: title.trim(),
      format,
      priority,
      points,
      status: 'todo',
      data,
      createdAt: new Date().toISOString(),
      userId: currentUser?.username,
      history: [{
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        actor: 'Human',
        actorRole: 'human',
        message: 'Ticket created manually — added directly to backlog',
      }],
    }

    onSave(ticket)
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#f8f8fc',
    border: '1px solid #e8e8f0',
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: '#444',
    marginBottom: 6,
    display: 'block',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 12,
        width: 560,
        maxWidth: '95vw',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '18px 22px',
          borderBottom: '1px solid #e8e8f0',
        }}>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Create Ticket</span>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              fontSize: 18,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#888',
              lineHeight: 1,
              padding: 0,
            }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>
              Title <span style={{ color: '#791F1F' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => { setTitle(e.target.value); clearError() }}
              placeholder="e.g. User login with email and password"
              style={inputStyle}
            />
          </div>

          {/* Format */}
          <div>
            <label style={labelStyle}>Format</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['gwt', 'classic'] as Format[]).map(f => (
                <button
                  key={f}
                  onClick={() => { setFormat(f); clearError() }}
                  style={{
                    borderRadius: 6,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: format === f ? '#534AB7' : '#fff',
                    color: format === f ? '#fff' : '#666',
                    border: format === f ? '1px solid #534AB7' : '1px solid #e8e8f0',
                  }}
                >
                  {f === 'gwt' ? 'Given / When / Then' : 'Classic'}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label style={labelStyle}>Priority</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['high', 'medium', 'low'] as Priority[]).map(p => {
                const activeStyles: Record<Priority, React.CSSProperties> = {
                  high:   { background: '#FEF2F2', color: '#791F1F', border: '1px solid #FCA5A5' },
                  medium: { background: '#FAEEDA', color: '#854F0B', border: '1px solid #EF9F27' },
                  low:    { background: '#EAF3DE', color: '#27500A', border: '1px solid #86C040' },
                }
                const isActive = priority === p
                return (
                  <button
                    key={p}
                    onClick={() => { setPriority(p); clearError() }}
                    style={{
                      borderRadius: 6,
                      padding: '7px 14px',
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      ...(isActive ? activeStyles[p] : { background: '#fff', color: '#888', border: '1px solid #e8e8f0' }),
                    }}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Story Points */}
          <div>
            <label style={labelStyle}>Story Points</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {POINTS_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => { setPoints(p); clearError() }}
                  style={{
                    width: 38,
                    height: 32,
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    background: points === p ? '#534AB7' : '#fff',
                    color: points === p ? '#fff' : '#666',
                    border: points === p ? '1px solid #534AB7' : '1px solid #e8e8f0',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label style={labelStyle}>
              Requirements <span style={{ color: '#791F1F' }}>*</span>
            </label>
            <textarea
              value={reqText}
              onChange={e => { setReqText(e.target.value); clearError() }}
              placeholder={
                format === 'gwt'
                  ? 'Describe the feature behavior — what should happen when...'
                  : 'Describe the objective and functional requirements...'
              }
              rows={5}
              style={{
                ...inputStyle,
                resize: 'vertical',
                lineHeight: 1.6,
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: '#791F1F',
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '14px 22px',
          borderTop: '1px solid #e8e8f0',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              border: '1px solid #e8e8f0',
              color: '#666',
              background: '#fff',
              borderRadius: 8,
              padding: '9px 18px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              background: '#534AB7',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 20px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
