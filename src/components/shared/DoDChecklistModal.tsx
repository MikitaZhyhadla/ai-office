"use client"
import { useState, useEffect, useCallback } from "react"
import { useSettingsStore } from "@/store/useSettingsStore"

interface DoDChecklistModalProps {
  isOpen: boolean
  ticketId: string
  ticketTitle: string
  ticketPoints: number
  onConfirm: (checkedItemIds: string[]) => void
  onCancel: () => void
}

export function DoDChecklistModal({
  isOpen,
  ticketId,
  ticketTitle,
  ticketPoints,
  onConfirm,
  onCancel,
}: DoDChecklistModalProps) {
  const dodItems = useSettingsStore(s => s.dodItems)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (isOpen) setChecked({})
  }, [isOpen])

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onCancel()
  }, [onCancel])

  useEffect(() => {
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleKey])

  if (!isOpen) return null

  const allRequiredChecked = dodItems
    .filter(item => item.required)
    .every(item => checked[item.id])

  const checkedCount = Object.values(checked).filter(Boolean).length
  const totalCount = dodItems.length
  const progressPct = totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100)

  function toggle(id: string) {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  function handleConfirm() {
    if (!allRequiredChecked) return
    onConfirm(Object.keys(checked).filter(id => checked[id]))
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{
        background: "#fff", borderRadius: 12, width: 480, maxWidth: "95vw",
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          padding: "18px 22px", borderBottom: "1px solid #e8e8f0",
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a2e", marginBottom: 4 }}>
              ✅ Definition of Done
            </div>
            <div style={{ fontSize: 11, color: "#888" }}>
              <span style={{
                fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                background: "#EEEDFE", color: "#3C3489", marginRight: 6,
              }}>{ticketId}</span>
              {ticketTitle}
              <span style={{
                marginLeft: 8, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                background: "#f0eff7", color: "#534AB7", border: "1px solid #e0e0f0",
              }}>{ticketPoints} SP</span>
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#888", fontSize: 18, lineHeight: 1, padding: "0 0 0 16px", flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "#333")}
            onMouseLeave={e => (e.currentTarget.style.color = "#888")}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px" }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 10 }}>
            Check all required items to move this ticket to Done.
          </div>

          {/* Progress */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{
              flex: 1, height: 4, background: "#f0f0f7", borderRadius: 2, overflow: "hidden",
            }}>
              <div style={{
                height: "100%", width: `${progressPct}%`,
                background: "#534AB7", borderRadius: 2, transition: "width 0.2s",
              }} />
            </div>
            <span style={{ fontSize: 11, color: "#888", flexShrink: 0, fontFamily: "monospace" }}>
              {checkedCount} / {totalCount}
            </span>
          </div>

          {/* Checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dodItems.map(item => (
              <div
                key={item.id}
                onClick={() => toggle(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 12px", borderRadius: 7, cursor: "pointer",
                  background: checked[item.id] ? "#f7f6ff" : "#fafafa",
                  border: `1px solid ${checked[item.id] ? "#AFA9EC" : "#e8e8f0"}`,
                  transition: "background 0.1s, border-color 0.1s",
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: checked[item.id] ? "#534AB7" : "#fff",
                  border: checked[item.id] ? "2px solid #534AB7" : "2px solid #e8e8f0",
                  transition: "background 0.15s, border-color 0.15s",
                }}>
                  {checked[item.id] && (
                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, lineHeight: 1 }}>✓</span>
                  )}
                </div>

                <span style={{
                  flex: 1, fontSize: 13, color: checked[item.id] ? "#534AB7" : "#333",
                  textDecoration: checked[item.id] ? "line-through" : "none",
                  transition: "color 0.1s",
                }}>
                  {item.label}
                </span>

                {item.required && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: "#791F1F",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                    padding: "1px 5px", borderRadius: 3,
                    background: "#FEF2F2", border: "1px solid #f5b8b8",
                    flexShrink: 0,
                  }}>
                    Req
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Warning */}
          {!allRequiredChecked && checkedCount > 0 && (
            <div style={{
              marginTop: 12, padding: "8px 12px", borderRadius: 6,
              background: "#FEF2F2", border: "1px solid #f5b8b8",
              fontSize: 11, color: "#791F1F",
            }}>
              ⚠ {dodItems.filter(i => i.required && !checked[i.id]).length} required item(s) still unchecked
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 8,
          padding: "14px 22px", borderTop: "1px solid #e8e8f0",
        }}>
          <button
            onClick={onCancel}
            style={{
              background: "#fff", border: "1.5px solid #e8e8f0", color: "#555",
              borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer",
              fontWeight: 500,
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#aaa")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#e8e8f0")}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!allRequiredChecked}
            title={allRequiredChecked ? undefined : "Check all required items first"}
            style={{
              background: allRequiredChecked ? "#534AB7" : "#d4d4e8",
              color: allRequiredChecked ? "#fff" : "#aaa",
              border: "none", borderRadius: 8, padding: "8px 20px",
              fontSize: 13, fontWeight: 600,
              cursor: allRequiredChecked ? "pointer" : "not-allowed",
              transition: "background 0.15s",
            }}
          >
            Confirm Done
          </button>
        </div>
      </div>
    </div>
  )
}
