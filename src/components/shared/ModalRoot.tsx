"use client"
import { useAppStore } from "@/store/useAppStore"
import { TicketModal } from "./TicketModal"

export function ModalRoot() {
  const selectedTicketId = useAppStore(s => s.selectedTicketId)
  const setSelectedTicket = useAppStore(s => s.setSelectedTicket)
  if (!selectedTicketId) return null
  return (
    <TicketModal
      ticketId={selectedTicketId}
      onClose={() => setSelectedTicket(null)}
    />
  )
}
