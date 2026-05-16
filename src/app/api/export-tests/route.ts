import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import type { TestCase } from "@/types"

export async function POST(req: NextRequest) {
  const { ticketId, ticketTitle, testCases } = await req.json() as {
    ticketId:    string
    ticketTitle: string
    testCases:   TestCase[]
  }

  const rows: Record<string, string>[] = []

  testCases.forEach(tc => {
    tc.steps.forEach((step, idx) => {
      rows.push({
        'Ticket ID':        idx === 0 ? ticketId    : '',
        'Ticket Title':     idx === 0 ? ticketTitle : '',
        'TC ID':            idx === 0 ? tc.id       : '',
        'TC Title':         idx === 0 ? tc.title    : '',
        'Type':             idx === 0 ? tc.type     : '',
        'Step #':           String(idx + 1),
        'Step Description': step,
        'Expected Result':  idx === tc.steps.length - 1 ? tc.expectedResult : '',
      })
    })
    rows.push({} as Record<string, string>)
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  ws['!cols'] = [
    { wch: 12 }, { wch: 30 }, { wch: 10 }, { wch: 40 },
    { wch: 12 }, { wch: 8  }, { wch: 50 }, { wch: 50 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, `${ticketId} Test Cases`)
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=test-cases-${ticketId}.xlsx`,
    },
  })
}
