'use client'

interface TeamMemberRowProps {
  name: string
  role: string
  type: 'ai' | 'human'
  isOnline?: boolean
  label?: string
}

const roleColors: Record<string, string> = {
  BA: '#534AB7', QA: '#2E74B5', Dev: '#27500A',
  Developer: '#27500A', Manager: '#854F0B',
  Administration: '#555555', Admin: '#555555',
}

export function TeamMemberRow({ name, role, type, isOnline = true, label }: TeamMemberRowProps) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const color = type === 'ai' ? '#534AB7' : (roleColors[role] || '#888')
  const badgeLabel = label || (type === 'ai' ? 'AI Agent' : role)
  const badgeBg = type === 'ai' ? '#EDE9FE' : '#f0f4ff'
  const badgeColor = type === 'ai' ? '#4C1D95' : color

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px', borderRadius: 6,
      borderLeft: `3px solid ${color}`,
      marginBottom: 4, background: '#fafafa',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, flexShrink: 0,
      }}>
        {initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1F3864', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </div>
        <span style={{
          fontSize: 9, fontWeight: 600, padding: '1px 5px',
          borderRadius: 8, background: badgeBg, color: badgeColor,
        }}>
          {badgeLabel}
        </span>
      </div>

      <div style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: isOnline ? '#22C55E' : '#D1D5DB',
      }} />
    </div>
  )
}
