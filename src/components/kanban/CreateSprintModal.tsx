'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'

interface CreateSprintModalProps {
  onClose: () => void
}

export function CreateSprintModal({ onClose }: CreateSprintModalProps) {
  const sprints = useAppStore(s => s.sprints)
  const createSprint = useAppStore(s => s.createSprint)

  const nextNum = sprints.length + 1
  const [name, setName] = useState(`Sprint ${nextNum}`)

  const today = new Date().toISOString().split('T')[0]
  const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(twoWeeks)

  const isValid = name.trim().length > 0 && endDate > startDate

  const handleSubmit = () => {
    if (!isValid) return
    createSprint(name.trim(), startDate, endDate)
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: 28, width: 420,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1F3864', marginBottom: 20 }}>
          + Create New Sprint
        </h2>

        <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Sprint Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ width: '100%', border: '1px solid #e0e0f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, marginBottom: 14, boxSizing: 'border-box' }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              style={{ width: '100%', border: '1px solid #e0e0f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              style={{ width: '100%', border: '1px solid #e0e0f0', borderRadius: 6, padding: '8px 10px', fontSize: 13, boxSizing: 'border-box' }} />
          </div>
        </div>

        {endDate <= startDate && (
          <p style={{ fontSize: 11, color: '#791F1F', marginBottom: 12 }}>End date must be after start date.</p>
        )}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{ padding: '8px 18px', borderRadius: 6, border: '1px solid #e0e0f0', background: 'none', cursor: 'pointer', fontSize: 13 }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!isValid}
            style={{ padding: '8px 18px', borderRadius: 6, border: 'none', background: isValid ? '#534AB7' : '#ccc', color: '#fff', cursor: isValid ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 600 }}>
            Create Sprint
          </button>
        </div>
      </div>
    </div>
  )
}
