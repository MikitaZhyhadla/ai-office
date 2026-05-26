"use client"
import { useAppStore } from "@/store/useAppStore"
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"

export function VelocityChart() {
  const sprints   = useAppStore(s => s.sprints)
  const closedSprints = useAppStore(s => s.closedSprints)
  const tickets   = useAppStore(s => s.tickets)

  const closedSprintData = sprints
    .filter(s => s.status === 'closed')
    .slice(-10)
    .map(sprint => {
      const sprintTickets = tickets.filter(t => t.resolvedInSprint === sprint.id)
      const completedSP = sprintTickets.reduce((sum, t) => sum + (t.points ?? 0), 0)
      const allInSprint = sprint.ticketIds?.length > 0
        ? tickets.filter(t => sprint.ticketIds.includes(t.id) || t.resolvedInSprint === sprint.id)
        : sprintTickets
      const committedSP = allInSprint.reduce((sum, t) => sum + (t.points ?? 0), 0) || completedSP
      const retro = closedSprints.find(cs => cs.sprintId === sprint.id)
      return {
        name: sprint.name,
        committed: retro ? (retro.retro.velocity + (retro.retro.completedTickets < retro.retro.totalTickets ? Math.round(retro.retro.velocity * 0.15) : 0)) : committedSP,
        completed: retro ? retro.retro.velocity : completedSP,
      }
    })

  if (closedSprintData.length < 2) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: 120, color: "#bbb", fontSize: 13,
      }}>
        Complete sprints to see velocity trends
      </div>
    )
  }

  return (
    <div style={{ paddingTop: 8 }}>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={closedSprintData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value, name) => [`${value ?? 0} SP`, name === 'completed' ? 'Completed' : 'Committed']}
            labelStyle={{ fontWeight: 600, fontSize: 12 }}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend formatter={(value) => value === 'completed' ? 'Completed' : 'Committed'} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="committed" fill="#C7D2FE" radius={[3, 3, 0, 0]} name="committed" />
          <Bar dataKey="completed" fill="#4F46E5" radius={[3, 3, 0, 0]} name="completed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
