"use client"
import type { MoSCoWCategory } from "@/types"

interface MoSCoWBadgeProps {
  category:      MoSCoWCategory
  justification?: string
}

const CONFIG: Record<MoSCoWCategory, { label: string; bg: string; color: string; border: string }> = {
  must:   { label: 'Must',   bg: '#EEEDFE', color: '#534AB7', border: '#c4bff0' },
  should: { label: 'Should', bg: '#E1F5EE', color: '#085041', border: '#a8dcc8' },
  could:  { label: 'Could',  bg: '#FAEEDA', color: '#854F0B', border: '#f0c890' },
  wont:   { label: "Won't",  bg: '#F0F0F0', color: '#666666', border: '#d0d0d0' },
}

export function MoSCoWBadge({ category, justification }: MoSCoWBadgeProps) {
  const { label, bg, color, border } = CONFIG[category]
  return (
    <span
      title={justification || label}
      style={{
        fontSize: '10px',
        fontWeight: 700,
        background: bg,
        color: color,
        border: `1px solid ${border}`,
        padding: '2px 8px',
        borderRadius: '20px',
        display: 'inline-block',
        cursor: justification ? 'help' : 'default',
        letterSpacing: '0.2px',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  )
}

export { CONFIG as MOSCOW_CONFIG }
