'use client'

import React from 'react'
import type { Agent } from '@/types'

interface AgentCardProps {
  agent: Agent
  isComingSoon?: boolean
  onClick?: () => void
}

const ROLE_COLORS = {
  ba:   { border: '#3c3489', dot: '#534ab7', badge_bg: '#1a1840', badge_text: '#7f77dd', bar: '#534ab7', active_text: '#9087e0' },
  qa:   { border: '#0a4a38', dot: '#0f6e56', badge_bg: '#081510', badge_text: '#1d9e75', bar: '#0f6e56', active_text: '#1d9e75' },
  dev:  { border: '#5a3408', dot: '#854f0b', badge_bg: '#150d03', badge_text: '#ef9f27', bar: '#854f0b', active_text: '#ef9f27' },
  sdet: { border: '#0c3a6a', dot: '#185fa5', badge_bg: '#070e1a', badge_text: '#378add', bar: '#185fa5', active_text: '#378add' },
}

const ROLE_LABELS = { ba: 'BA', qa: 'QA', dev: 'DEV', sdet: 'SDET' }

const STATUS_DOT_COLORS: Record<string, string> = {
  idle:    '#2a2848',
  thinking:'#534ab7',
  typing:  '#0f6e56',
  working: '#854f0b',
}

const MAX_SESSION_TOKENS = 3000

export function AgentCard({ agent, isComingSoon = false, onClick }: AgentCardProps) {
  const rc = ROLE_COLORS[agent.role]
  const isActive = agent.status !== 'idle' && !isComingSoon
  const pct = Math.min(100, Math.round(((agent.sessionTokens || 0) / MAX_SESSION_TOKENS) * 100))
  const dotColor = STATUS_DOT_COLORS[agent.status] || '#2a2848'

  return (
    <div
      onClick={onClick}
      style={{
        background: '#111120',
        border: `1px solid ${isActive ? rc.border : (isComingSoon ? '#0c2040' : '#1e1c3a')}`,
        borderRadius: '4px',
        padding: '8px 10px',
        marginBottom: '6px',
        cursor: onClick ? 'pointer' : 'default',
        opacity: isComingSoon ? 0.45 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isActive && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(90deg, transparent, ${rc.dot}0F, transparent)`,
          animation: 'po-shimmer 2.5s infinite',
        }} />
      )}
      <style>{`
        @keyframes po-shimmer { 100% { transform: translateX(200%); } }
        @keyframes po-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.4;transform:scale(1.5);} }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: dotColor,
            animation: isActive ? 'po-pulse 0.9s infinite' : undefined,
          }} />
          <span style={{ fontSize: '14px', color: '#c8c4f0', fontFamily: 'monospace' }}>{agent.name}</span>
        </div>
        <span style={{
          fontSize: '11px', padding: '1px 5px', borderRadius: '2px', letterSpacing: '1px',
          background: rc.badge_bg, color: rc.badge_text,
          border: `1px solid ${rc.border}`, fontFamily: 'monospace',
        }}>
          {ROLE_LABELS[agent.role]}
        </span>
      </div>

      {!isComingSoon ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 6px', marginBottom: '4px' }}>
            {([
              ['MODEL', agent.currentTask ? (agent.role === 'dev' ? 'sonnet-4' : 'haiku-4-5') : 'haiku-4-5', isActive],
              ['STATUS', agent.status, isActive],
              ['TOKENS', (agent.sessionTokens || 0).toLocaleString(), false],
              ['TASK', agent.currentTask || '—', false],
            ] as [string, string, boolean][]).map(([label, value, highlight]) => (
              <div key={label}>
                <div style={{ fontSize: '11px', color: '#2a2848', letterSpacing: '1px', fontFamily: 'monospace' }}>{label}</div>
                <div style={{
                  fontSize: '13px',
                  color: highlight ? rc.active_text : '#666',
                  fontFamily: 'monospace',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {value}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '3px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#2a2848', marginBottom: '2px', fontFamily: 'monospace' }}>
              <span>usage</span><span>{pct}%</span>
            </div>
            <div style={{ height: '2px', background: '#1a1830', borderRadius: '1px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: rc.bar, borderRadius: '1px', transition: 'width 1.2s' }} />
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 6px', marginBottom: '4px' }}>
            <div>
              <div style={{ fontSize: '11px', color: '#2a2848', letterSpacing: '1px', fontFamily: 'monospace' }}>PHASE</div>
              <div style={{ fontSize: '13px', color: '#185fa5', fontFamily: 'monospace' }}>5.0</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#2a2848', letterSpacing: '1px', fontFamily: 'monospace' }}>STATUS</div>
              <div style={{ fontSize: '13px', color: '#1a3560', fontFamily: 'monospace' }}>coming soon</div>
            </div>
          </div>
          <div style={{
            fontSize: '11px', color: '#1a3560', padding: '3px 5px',
            background: '#070e1a', border: '1px dashed #0c2040', borderRadius: '2px',
            fontFamily: 'monospace',
          }}>
            Playwright · Cypress · Jest · pytest verdict
          </div>
        </>
      )}
    </div>
  )
}
