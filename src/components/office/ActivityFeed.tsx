'use client'

import React, { useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'

const ROLE_COLORS: Record<string, string> = {
  ba:   '#9087e0',
  qa:   '#1d9e75',
  dev:  '#ef9f27',
  sdet: '#378add',
}

function formatTime(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function ActivityFeed() {
  const agents = useAppStore(s => s.agents)
  const ref = useRef<HTMLDivElement>(null)

  const items = agents
    .filter(a => a.lastActivity && a.lastActivityAt)
    .sort((a, b) => (b.lastActivityAt || '').localeCompare(a.lastActivityAt || ''))
    .slice(0, 20)

  return (
    <div ref={ref} style={{ overflowY: 'auto', flex: 1 }}>
      <div style={{ fontSize: '8px', color: '#2a2848', letterSpacing: '2px', marginBottom: '8px', fontFamily: 'monospace' }}>
        ACTIVITY FEED
      </div>
      {items.length === 0 && (
        <div style={{ fontSize: '9px', color: '#2a2848', fontFamily: 'monospace' }}>
          No activity yet. Run a pipeline to see agent actions.
        </div>
      )}
      {items.map((agent, i) => (
        <div key={i} style={{ display: 'flex', gap: '5px', fontSize: '8px', lineHeight: '1.4', marginBottom: '6px', alignItems: 'flex-start' }}>
          <span style={{ color: '#2a2848', whiteSpace: 'nowrap', fontSize: '7px', fontFamily: 'monospace' }}>
            {formatTime(agent.lastActivityAt)}
          </span>
          <span style={{ color: '#3d3a6e' }}>●</span>
          <span style={{ color: '#666', fontFamily: 'monospace' }}>
            <span style={{ color: ROLE_COLORS[agent.role] }}>{agent.name}</span>{' '}
            {agent.lastActivity}
          </span>
        </div>
      ))}
    </div>
  )
}
