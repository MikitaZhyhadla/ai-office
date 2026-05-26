import React from 'react'

interface CostRow {
  name: string
  model: string
  cost: number
}

interface CostEstimatorProps {
  rows: CostRow[]
}

const COST_MAP: Record<string, number> = {
  'claude-haiku-4-5-20251001': 0.00000035,
  'claude-sonnet-4-20250514':  0.00000088,
  'claude-opus-4-20250514':    0.0000045,
}

const MODEL_SHORT: Record<string, string> = {
  'claude-haiku-4-5-20251001': 'haiku-4-5',
  'claude-sonnet-4-20250514':  'sonnet-4',
  'claude-opus-4-20250514':    'opus-4',
}

const TOKENS_PER_CALL = 1200

export function computeCost(model: string): number {
  return (COST_MAP[model] || 0.00000035) * TOKENS_PER_CALL
}

export function CostEstimator({ rows }: CostEstimatorProps) {
  const total = rows.reduce((s, r) => s + r.cost, 0)

  return (
    <div style={{
      background: '#F5F4FB', borderRadius: '6px',
      padding: '12px 14px', marginTop: '12px',
    }}>
      <div style={{
        fontSize: '10px', color: '#999AAA', letterSpacing: '0.05em',
        textTransform: 'uppercase', marginBottom: '8px',
      }}>
        Estimated cost per full pipeline run
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '12px', marginBottom: '4px',
        }}>
          <span style={{ color: '#555566' }}>
            {row.name} ({MODEL_SHORT[row.model] || row.model})
          </span>
          <span style={{ color: '#1A1A2E', fontWeight: 500 }}>
            ~${row.cost.toFixed(4)}
          </span>
        </div>
      ))}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        fontSize: '13px', fontWeight: 600,
        paddingTop: '7px', borderTop: '1px solid #EEEDF8', marginTop: '3px',
      }}>
        <span style={{ color: '#1A1A2E' }}>Total</span>
        <span style={{ color: '#534AB7' }}>~${total.toFixed(4)}</span>
      </div>
    </div>
  )
}
