"use client"
import type { BugReport } from "@/types"

interface Props {
  bugReport: BugReport
}

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: "#aaa",
  letterSpacing: "0.6px",
  textTransform: "uppercase",
  marginBottom: 4,
}
const sectionWrap: React.CSSProperties = {
  borderBottom: "1px solid #f0f0f7",
  padding: "12px 0",
}

export function BugReportView({ bugReport }: Props) {
  const severityColor = bugReport.severity === 'critical' ? "#791F1F" : bugReport.severity === 'major' ? "#854F0B" : "#666"
  const severityBg    = bugReport.severity === 'critical' ? "#FCEBEB" : bugReport.severity === 'major' ? "#FAEEDA" : "#f0f0f0"

  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        🐛 Bug Report
      </div>

      <div style={sectionWrap}>
        <div style={sectionLabel}>Severity</div>
        <span style={{
          display: "inline-block",
          fontSize: 11,
          fontWeight: 600,
          padding: "3px 10px",
          borderRadius: 20,
          background: severityBg,
          color: severityColor,
        }}>
          {bugReport.severity.charAt(0).toUpperCase() + bugReport.severity.slice(1)}
        </span>
      </div>

      <div style={sectionWrap}>
        <div style={sectionLabel}>Affected Area</div>
        <span style={{
          display: "inline-block",
          fontSize: 12,
          padding: "2px 10px",
          borderRadius: 20,
          background: "#f0f0f7",
          color: "#555",
        }}>
          {bugReport.affectedArea}
        </span>
      </div>

      <div style={sectionWrap}>
        <div style={sectionLabel}>Steps to Reproduce</div>
        <ol style={{ margin: 0, paddingLeft: 18 }}>
          {bugReport.stepsToReproduce.map((step, i) => (
            <li key={i} style={{ fontSize: 13, color: "#333", lineHeight: 1.7 }}>{step}</li>
          ))}
        </ol>
      </div>

      <div style={sectionWrap}>
        <div style={sectionLabel}>Expected Behavior</div>
        <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{bugReport.expectedBehavior}</div>
      </div>

      <div style={{ padding: "12px 0" }}>
        <div style={sectionLabel}>Actual Behavior</div>
        <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{bugReport.actualBehavior}</div>
      </div>
    </div>
  )
}
