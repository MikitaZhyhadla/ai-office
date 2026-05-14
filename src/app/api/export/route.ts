import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function POST(req: NextRequest) {
  const { tickets } = await req.json()
  const rows = tickets.map((t: any) => ({
    ID:       t.id,
    Title:    t.title,
    Format:   t.format.toUpperCase(),
    Priority: t.priority,
    Points:   t.points,
    Status:   t.status,
    Created:  t.createdAt,
  }))
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  XLSX.utils.book_append_sheet(wb, ws, "Tickets")
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=ai-office-tickets.xlsx"
    }
  })
}
