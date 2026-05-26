"use client"
import { useAppStore } from "@/store/useAppStore"
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ReferenceLine, ResponsiveContainer } from "recharts"
import type { Ticket } from "@/types"

function formatDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400000)
}

function ticketDoneDate(ticket: Ticket): Date | null {
  const doneEntry = (ticket.history ?? []).find(h =>
    h.message.includes('Definition of Done completed') ||
    h.message.includes('Moved to Done')
  )
  return doneEntry ? new Date(doneEntry.timestamp) : null
}

export function BurndownChart() {
  const sprints = useAppStore(s => s.sprints)
  const tickets = useAppStore(s => s.tickets)

  const activeSprint = sprints.find(s => s.status === 'active') ?? null

  if (!activeSprint) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: 120, color: "#bbb", fontSize: 13,
      }}>
        No active sprint
      </div>
    )
  }

  const sprintTickets = tickets.filter(t => activeSprint.ticketIds.includes(t.id))
  if (sprintTickets.length === 0) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: 120, color: "#bbb", fontSize: 13,
      }}>
        No tickets in active sprint
      </div>
    )
  }

  const startDate = new Date(activeSprint.startDate)
  const endDate   = new Date(activeSprint.endDate)
  const today     = new Date()
  const totalSP   = sprintTickets.reduce((sum, t) => sum + (t.points ?? 0), 0)
  const totalDays = Math.max(daysBetween(startDate, endDate), 1)
  const daysToShow = Math.min(daysBetween(startDate, today) + 1, totalDays + 1)

  const data: { date: string; ideal: number; actual: number | null }[] = []

  for (let d = 0; d <= totalDays; d++) {
    const day = new Date(startDate)
    day.setDate(day.getDate() + d)

    const ideal = Math.round(totalSP * (1 - d / totalDays))

    let actual: number | null = null
    if (d < daysToShow) {
      const completedSP = sprintTickets
        .filter(t => {
          const doneDate = ticketDoneDate(t)
          return (doneDate && doneDate <= day) || (t.status === 'done' && !doneDate && d === daysToShow - 1)
        })
        .reduce((sum, t) => sum + (t.points ?? 0), 0)
      actual = Math.max(totalSP - completedSP, 0)
    }

    data.push({ date: formatDate(day), ideal, actual })
  }

  const todayLabel = formatDate(today)

  return (
    <div style={{ paddingTop: 8 }}>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(totalDays / 5)} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value, name) => [`${value ?? 0} SP`, name === 'actual' ? 'Actual remaining' : 'Ideal burndown']}
            labelStyle={{ fontWeight: 600, fontSize: 12 }}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend
            formatter={(value) => value === 'actual' ? 'Actual remaining' : value === 'ideal' ? 'Ideal burndown' : value}
            iconSize={10}
            wrapperStyle={{ fontSize: 11 }}
          />
          <ReferenceLine x={todayLabel} stroke="#F59E0B" strokeDasharray="4 4" label={{ value: "Today", fill: "#F59E0B", fontSize: 10 }} />
          <Line type="monotone" dataKey="ideal" stroke="#CBD5E0" strokeDasharray="5 5" dot={false} strokeWidth={1.5} name="ideal" connectNulls />
          <Line type="monotone" dataKey="actual" stroke="#4F46E5" dot={false} strokeWidth={2} name="actual" connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
