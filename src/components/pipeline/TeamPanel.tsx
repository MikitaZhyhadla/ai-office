'use client'
import { useAuthStore } from '@/store/useAuthStore'
import { TeamMemberRow } from './TeamMemberRow'

const AI_AGENTS = [
  { name: 'Alice BA',  role: 'BA',  type: 'ai' as const },
  { name: 'Bob BA',    role: 'BA',  type: 'ai' as const },
  { name: 'QA Lead',   role: 'QA',  type: 'ai' as const },
  { name: 'Dev Lead',  role: 'Dev', type: 'ai' as const },
]

const DEPARTMENT_LABELS: Record<string, string> = {
  BA:             'BA Team',
  QA:             'QA Department',
  Dev:            'Dev Team',
  Developer:      'Dev Team',
  Manager:        'Management',
  Administration: 'Administration',
  Admin:          'Administration',
}

export function TeamPanel() {
  const allUsers = useAuthStore(s => s.users)
  const currentUser = useAuthStore(s => s.currentUser)

  // Only show users from the same project; backward compat for users without projectId
  const users = allUsers.filter(u =>
    !u.projectId ||
    u.projectId === currentUser?.projectId
  )

  const aiByDept = AI_AGENTS.reduce((acc, agent) => {
    const dept = DEPARTMENT_LABELS[agent.role] || agent.role
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(agent)
    return acc
  }, {} as Record<string, typeof AI_AGENTS>)

  const humansByDept = users.reduce((acc, user) => {
    const dept = DEPARTMENT_LABELS[user.role] || 'Management'
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(user)
    return acc
  }, {} as Record<string, typeof users>)

  const allDepts = Array.from(new Set([...Object.keys(aiByDept), ...Object.keys(humansByDept)]))
  const totalMembers = AI_AGENTS.length + users.length

  return (
    <div style={{
      width: 220, flexShrink: 0,
      background: '#fff', border: '1px solid #e8e8f0',
      borderRadius: 10, padding: '14px 10px',
      height: 'fit-content', maxHeight: '80vh',
      overflowY: 'auto', position: 'sticky', top: 80,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f0f0f7' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1F3864' }}>👥 Team</span>
        <span style={{ fontSize: 11, background: '#EDE9FE', color: '#4C1D95', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>
          {totalMembers}
        </span>
      </div>

      {allDepts.map(dept => {
        const aiMembers = aiByDept[dept] || []
        const humanMembers = humansByDept[dept] || []
        const allMembers = [...aiMembers, ...humanMembers]
        if (allMembers.length === 0) return null

        return (
          <div key={dept} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6, paddingLeft: 4 }}>
              {dept} ({allMembers.length})
            </div>
            {aiMembers.map(agent => (
              <TeamMemberRow
                key={agent.name}
                name={agent.name}
                role={agent.role}
                type="ai"
                isOnline={true}
              />
            ))}
            {humanMembers.map(user => (
              <TeamMemberRow
                key={user.username}
                name={user.displayName || user.username}
                role={user.role}
                type="human"
                isOnline={user.username === currentUser?.username}
              />
            ))}
          </div>
        )
      })}

      {users.length === 0 && (
        <p style={{ fontSize: 11, color: '#bbb', textAlign: 'center', paddingTop: 8 }}>
          Register team members to see them here
        </p>
      )}
    </div>
  )
}
