"use client"
import { useState } from "react"

interface GeneratedPromptPanelProps {
  title: string
  content: string
  onClose: () => void
  accentColor?: 'indigo' | 'purple'
}

export function GeneratedPromptPanel({ title, content, onClose, accentColor = 'indigo' }: GeneratedPromptPanelProps) {
  const [copied, setCopied] = useState(false)

  const accent = accentColor === 'purple' ? '#7C3AED' : '#4F46E5'

  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{
      background: "#1E1B4B",
      borderRadius: 10,
      overflow: "hidden",
      marginTop: 12,
      border: `1px solid ${accent}40`,
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderBottom: "1px solid #2D2A5E",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#C7D2FE" }}>{title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? "#10B981" : accent,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#9CA3AF",
              cursor: "pointer",
              fontSize: 12,
              padding: 0,
              fontFamily: "inherit",
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{
        background: "#13112A",
        padding: "14px 16px",
        maxHeight: 320,
        overflowY: "auto",
      }}>
        <pre style={{
          margin: 0,
          fontSize: 12,
          lineHeight: 1.7,
          color: "#9CA3AF",
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}>
          {content}
        </pre>
      </div>
    </div>
  )
}
