"use client"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanCard } from "./KanbanCard"
import type { Ticket, KanbanColumn as ColType } from "@/types"

const COL_LABELS: Record<ColType, string> = {
  todo: "To Do", inprog: "In Progress", review: "In Review", done: "Done"
}
const COL_COLORS: Record<ColType, string> = {
  todo: "#888", inprog: "#534AB7", review: "#854F0B", done: "#27500A"
}

interface Props { id: ColType; tickets: Ticket[] }

export function KanbanColumn({ id, tickets }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} style={{ background: isOver ? "#f0eff7" : "#f8f8fc",
      border:`1px solid ${isOver ? "#AFA9EC" : "#e8e8f0"}`,
      borderRadius:10, padding:12, minHeight:200, transition:"background .15s" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:11, fontWeight:600, color:COL_COLORS[id],
          textTransform:"uppercase", letterSpacing:.6 }}>
          {COL_LABELS[id]}
        </span>
        <span style={{ background:"#fff", border:"1px solid #e0e0f0", borderRadius:4,
          fontSize:10, padding:"1px 6px", color:"#aaa", fontWeight:600 }}>
          {tickets.length}
        </span>
      </div>
      <SortableContext items={tickets.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tickets.map(t => <KanbanCard key={t.id} ticket={t} />)}
      </SortableContext>
      {tickets.length === 0 && (
        <div style={{ border:"1.5px dashed #e0e0f0", borderRadius:8, height:52,
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#ccc", fontSize:11 }}>
          Drop here
        </div>
      )}
    </div>
  )
}
