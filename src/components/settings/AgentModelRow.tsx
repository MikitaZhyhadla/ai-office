import React from 'react'

export interface AgentModelRowProps {
  dotColor: string
  name: string
  role: string
  roleBg: string
  roleColor: string
  modelValue: string
  onModelChange: (val: string) => void
  estimatedCost: string
  disabled?: boolean
  isPhase5?: boolean
}

const MODEL_OPTIONS = [
  { value: 'claude-haiku-4-5-20251001', label: 'claude-haiku-4-5' },
  { value: 'claude-sonnet-4-20250514',  label: 'claude-sonnet-4' },
  { value: 'claude-opus-4-20250514',    label: 'claude-opus-4' },
]

export function AgentModelRow({
  dotColor, name, role, roleBg, roleColor,
  modelValue, onModelChange, estimatedCost,
  disabled = false, isPhase5 = false,
}: AgentModelRowProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px 100px 46px 1fr 80px',
      gap: '8px',
      padding: '8px 0',
      borderBottom: '1px solid #EEEDF8',
      alignItems: 'center',
      opacity: isPhase5 ? 0.45 : 1,
    }}>
      <div style={{
        width: '9px', height: '9px', borderRadius: '2px',
        background: dotColor, justifySelf: 'center',
      }} />

      <span style={{ fontSize: '13px', color: isPhase5 ? '#999AAA' : '#1A1A2E' }}>{name}</span>

      <span style={{
        fontSize: '10px', padding: '2px 0', borderRadius: '10px',
        textAlign: 'center', fontWeight: 600,
        background: roleBg, color: roleColor,
      }}>
        {role}
      </span>

      <select
        value={modelValue}
        onChange={e => onModelChange(e.target.value)}
        disabled={disabled || isPhase5}
        style={{
          fontSize: '12px', padding: '5px 8px',
          border: '1px solid #EEEDF8', borderRadius: '6px',
          background: '#FAFAFA', color: isPhase5 ? '#999' : '#1A1A2E',
          fontFamily: 'inherit', cursor: disabled || isPhase5 ? 'not-allowed' : 'pointer',
          width: '100%', opacity: disabled ? 0.6 : 1,
        }}
      >
        {MODEL_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <span style={{
        textAlign: 'right', fontSize: isPhase5 ? '11px' : '12px',
        color: isPhase5 ? '#999' : (estimatedCost.includes('0012') ? '#854F0B' : '#555566'),
        fontWeight: isPhase5 ? 400 : 500,
      }}>
        {estimatedCost}
      </span>
    </div>
  )
}
