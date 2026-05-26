'use client'

import React from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useSettingsStore } from '@/store/useSettingsStore'

const COST_PER_TOKEN: Record<string, number> = {
  'claude-haiku-4-5-20251001': 0.00000035,
  'claude-sonnet-4-20250514':  0.00000088,
  'claude-opus-4-20250514':    0.0000045,
}

const ROLE_BAR_COLORS: Record<string, string> = {
  ba:   '#534ab7',
  qa:   '#0f6e56',
  dev:  '#854f0b',
  sdet: '#185fa5',
}

const MAX_SESSION_TOKENS = 3000

export function StatsTab() {
  const agents = useAppStore(s => s.agents)
  const model = useSettingsStore(s => s.model) || 'claude-haiku-4-5-20251001'

  const activeAgents = agents.filter(a => a.role !== 'sdet')
  const totalTokens = activeAgents.reduce((s, a) => s + (a.sessionTokens || 0), 0)
  const totalCost = activeAgents.reduce((s, a) => {
    const costRate = COST_PER_TOKEN[model] || 0.00000035
    return s + (a.sessionTokens || 0) * costRate
  }, 0)

  return (
    <div style={{ fontFamily: 'monospace' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginBottom: '12px' }}>
        {[
          { label: 'TOTAL TOKENS', value: totalTokens.toLocaleString(), color: '#9087e0' },
          { label: 'SESSION COST', value: `$${totalCost.toFixed(4)}`, color: '#ef9f27' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ background: '#111120', border: '1px solid #1e1c3a', borderRadius: '4px', padding: '8px' }}>
            <div style={{ fontSize: '7px', color: '#2a2848', letterSpacing: '1px', marginBottom: '2px' }}>{label}</div>
            <div style={{ fontSize: '16px', color, fontWeight: 500 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: '8px', color: '#2a2848', letterSpacing: '2px', marginBottom: '6px' }}>TOKEN HEATMAP</div>
      <div style={{ background: '#111120', border: '1px solid #1e1c3a', borderRadius: '4px', padding: '8px', marginBottom: '12px' }}>
        {agents.map(agent => {
          const pct = Math.min(100, Math.round(((agent.sessionTokens || 0) / MAX_SESSION_TOKENS) * 100))
          const isPhase5 = agent.role === 'sdet'
          return (
            <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
              <div style={{ fontSize: '8px', color: isPhase5 ? '#1a3560' : '#444', width: '52px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {agent.name.split(' ')[0]}
              </div>
              <div style={{ flex: 1, height: '5px', background: isPhase5 ? '#0a0f1a' : '#1a1830', borderRadius: '1px', overflow: 'hidden', border: isPhase5 ? '1px dashed #0c2040' : 'none' }}>
                {!isPhase5 && (
                  <div style={{ height: '100%', width: `${pct}%`, background: ROLE_BAR_COLORS[agent.role], borderRadius: '1px', transition: 'width 1s' }} />
                )}
              </div>
              <div style={{ fontSize: '8px', color: isPhase5 ? '#1a3560' : ROLE_BAR_COLORS[agent.role], width: '28px', textAlign: 'right' }}>
                {isPhase5 ? 'ph5' : `${pct}%`}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: '8px', color: '#2a2848', letterSpacing: '2px', marginBottom: '6px' }}>COST BREAKDOWN</div>
      <div style={{ background: '#111120', border: '1px solid #1e1c3a', borderRadius: '4px', padding: '8px' }}>
        {activeAgents.map(agent => {
          const costRate = COST_PER_TOKEN[model] || 0.00000035
          const cost = (agent.sessionTokens || 0) * costRate
          return (
            <div key={agent.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '4px' }}>
              <span style={{ color: '#444' }}>{agent.name}</span>
              <span style={{ color: '#666' }}>{(agent.sessionTokens || 0).toLocaleString()} tok · ${cost.toFixed(4)}</span>
            </div>
          )
        })}
        <div style={{ borderTop: '1px solid #1e1c3a', marginTop: '4px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 500 }}>
          <span style={{ color: '#c8c4f0' }}>Total</span>
          <span style={{ color: '#9087e0' }}>${totalCost.toFixed(4)}</span>
        </div>
      </div>
    </div>
  )
}
