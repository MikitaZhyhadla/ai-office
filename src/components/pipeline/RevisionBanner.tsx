"use client"

interface RevisionBannerProps {
  qaIssues: string[]
  devBlockers: string[]
  onSendToBA: () => void
  onApproveAnyway: () => void
  isRevising: boolean
}

export function RevisionBanner({ qaIssues, devBlockers, onSendToBA, onApproveAnyway, isRevising }: RevisionBannerProps) {
  return (
    <div style={{ background: "#fffbf0", border: "1.5px solid #e8c97a", borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#633806" }}>
          QA &amp; Dev agents flagged issues — revision required
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {qaIssues.length > 0 && (
          <div style={{ background: "#f0faf7", border: "1px solid #a8d8cc", borderRadius: 8, padding: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                background: "#0F6E56", color: "#fff"
              }}>
                QA Lead
              </span>
            </div>
            {qaIssues.map((issue, i) => (
              <div key={i} style={{ fontSize: 12, color: "#2a5a47", lineHeight: 1.6, paddingLeft: 4 }}>
                • {issue}
              </div>
            ))}
          </div>
        )}

        {devBlockers.length > 0 && (
          <div style={{ background: "#fffbf0", border: "1px solid #e8c97a", borderRadius: 8, padding: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                background: "#854F0B", color: "#fff"
              }}>
                Dev Lead
              </span>
            </div>
            {devBlockers.map((blocker, i) => (
              <div key={i} style={{ fontSize: 12, color: "#5a3a0a", lineHeight: 1.6, paddingLeft: 4 }}>
                • {blocker}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onSendToBA}
          disabled={isRevising}
          style={{
            background: isRevising ? "#a09fd0" : "#534AB7",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "9px 18px",
            fontSize: 12,
            fontWeight: 500,
            cursor: isRevising ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {isRevising && (
            <span style={{
              display: "inline-block",
              width: 12,
              height: 12,
              border: "2px solid #fff",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.7s linear infinite",
            }} />
          )}
          ↩ Send to BA for revision
        </button>

        <button
          onClick={onApproveAnyway}
          disabled={isRevising}
          style={{
            background: "none",
            border: "1.5px solid #27500A",
            color: "#27500A",
            borderRadius: 8,
            padding: "9px 14px",
            fontSize: 12,
            fontWeight: 500,
            cursor: isRevising ? "not-allowed" : "pointer",
            opacity: isRevising ? 0.5 : 1,
          }}
        >
          ✓ Approve anyway
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
