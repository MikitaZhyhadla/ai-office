'use client'

import React, { useState } from 'react'
import { Topbar } from '@/components/shared/Topbar'
import { DocOrbit } from '@/components/office/DocOrbit'
import { AgentCard } from '@/components/office/AgentCard'
import { ActivityFeed } from '@/components/office/ActivityFeed'
import { StatsTab } from '@/components/office/StatsTab'
import { useAppStore } from '@/store/useAppStore'

type SidebarTab = 'agents' | 'feed' | 'stats'

const DESK_POSITIONS: Record<string, number> = {
  alice: 22,
  bob:   115,
  qa1:   208,
  dev1:  301,
  sdet1: 394,
}

function AgentDesk({ agent }: { agent: ReturnType<typeof useAppStore.getState>['agents'][0] }) {
  const isActive = agent.status !== 'idle'
  const isSdet = agent.role === 'sdet'
  const left = DESK_POSITIONS[agent.id] ?? 22

  const MONITOR_COLORS: Record<string, string> = {
    ba:   '#534ab7',
    qa:   '#0f6e56',
    dev:  '#854f0b',
    sdet: '#185fa5',
  }
  const HEAD_COLORS: Record<string, string> = {
    ba:   '#534ab7',
    qa:   '#0f6e56',
    dev:  '#854f0b',
    sdet: '#185fa5',
  }
  const BODY_COLORS: Record<string, string> = {
    ba:   '#3c3489',
    qa:   '#085041',
    dev:  '#633806',
    sdet: '#0c3a6a',
  }
  const BUBBLE_STYLES: Record<string, { border: string; color: string; bg: string }> = {
    ba:   { border: '#312e5a', color: '#9087e0', bg: '#131225' },
    qa:   { border: '#1d4a3a', color: '#1d9e75', bg: '#0c1812' },
    dev:  { border: '#4a2e0d', color: '#ef9f27', bg: '#130e05' },
    sdet: { border: '#1a3560', color: '#378add', bg: '#090f1a' },
  }
  const monColor = MONITOR_COLORS[agent.role]
  const bubble = BUBBLE_STYLES[agent.role]

  const orbitSpeed = agent.status === 'typing' || agent.status === 'working'
    ? 'fast'
    : agent.status === 'thinking'
      ? 'medium'
      : 'slow'

  const screenLines: Record<string, string> = {
    alice: 'GWT\n▋ ok',
    bob:   'BA2\nrev▋',
    qa1:   '---',
    dev1:  'SP→5\n▋ ok',
    sdet1: '---',
  }

  return (
    <div style={{ position: 'absolute', width: '72px', left, top: '120px' }}>
      {isSdet && (
        <div style={{
          position: 'absolute', top: '-18px', left: 0,
          fontSize: '6px', padding: '1px 4px',
          background: '#0a0f1a', border: '1px solid #1a3560',
          color: '#185fa5', letterSpacing: '1px', borderRadius: '1px',
        }}>
          PHASE 5
        </div>
      )}

      <div style={{ position: 'absolute', top: '-48px', left: '50%', transform: 'translateX(-50%)', width: '40px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', opacity: isSdet ? 0.5 : 1 }}>
          <DocOrbit
            role={agent.role}
            speed={isSdet ? 'slow' : orbitSpeed}
            docCount={isActive && !isSdet ? 3 : 2}
          />

          <div style={{
            width: '12px', height: '10px', borderRadius: '1px',
            background: HEAD_COLORS[agent.role],
            animation: agent.status === 'thinking' ? 'po-headbob 1.2s ease-in-out infinite' : undefined,
          }} />
          <div style={{
            width: '14px', height: '11px', borderRadius: '1px 1px 0 0',
            background: BODY_COLORS[agent.role],
            animation: agent.status === 'typing' ? 'po-type 0.25s ease-in-out infinite alternate' : undefined,
          }} />
          <div style={{ display: 'flex', gap: '1px' }}>
            <div style={{ width: '6px', height: '7px', background: '#1e1c3a', borderRadius: '0 0 1px 1px' }} />
            <div style={{ width: '6px', height: '7px', background: '#1e1c3a', borderRadius: '0 0 1px 1px' }} />
          </div>

          {agent.currentTask && !isSdet && (
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: bubble.bg,
              border: `1px solid ${bubble.border}`,
              borderRadius: '4px',
              padding: '3px 8px',
              fontSize: '7px',
              color: bubble.color,
              whiteSpace: 'nowrap',
              zIndex: 10,
              fontFamily: 'monospace',
            }}>
              {agent.currentTask}
            </div>
          )}
        </div>
      </div>

      <div style={{
        width: '44px', height: '28px',
        background: '#0c0b1a',
        border: `1.5px solid ${isActive && !isSdet ? monColor : '#2a2848'}`,
        borderRadius: '1px',
        position: 'absolute', top: 0, left: '14px',
        boxShadow: isActive && !isSdet ? `0 0 5px ${monColor}44` : 'none',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: isSdet ? 0.4 : 1,
      }}>
        <pre style={{
          fontSize: '5px', lineHeight: '1.4', padding: '2px', margin: 0,
          color: isActive && !isSdet ? monColor : '#1a1830',
          fontFamily: 'monospace',
        }}>
          {screenLines[agent.id] || '---'}
        </pre>
      </div>

      <div style={{
        width: '72px', height: '26px',
        background: '#161428',
        border: '1px solid #252240',
        borderRadius: '2px',
        marginTop: '34px',
        opacity: isSdet ? 0.4 : 1,
        borderStyle: isSdet ? 'dashed' : 'solid',
      }} />
    </div>
  )
}

export default function PixelOfficePage() {
  const agents = useAppStore(s => s.agents)
  const [tab, setTab] = useState<SidebarTab>('agents')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const totalTokens = agents.reduce((s, a) => s + (a.sessionTokens || 0), 0)
  const activeCount = agents.filter(a => a.status !== 'idle').length

  const kanban = useAppStore(s => s.kanban)
  const kanbanSummary = [
    { label: 'TODO',    color: '#444',    tickets: kanban.todo?.length || 0 },
    { label: 'IN PROG', color: '#534ab7', tickets: kanban.inprog?.length || 0 },
    { label: 'REVIEW',  color: '#854f0b', tickets: kanban.review?.length || 0 },
    { label: 'DONE',    color: '#0f6e56', tickets: kanban.done?.length || 0 },
  ]

  return (
    <div>
      <style>{`
        @keyframes po-headbob { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-2px);} }
        @keyframes po-type { from{transform:scaleX(1);} to{transform:scaleX(0.94);} }
        @keyframes po-dotpulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.4;transform:scale(1.5);} }
      `}</style>

      <Topbar />

      <div style={{
        fontFamily: 'monospace',
        background: '#0b0b14',
        minHeight: 'calc(100vh - 48px)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 14px',
          background: '#111120',
          borderBottom: '1px solid #1e1c3a',
          fontSize: '10px',
        }}>
          <div style={{ color: '#7c6ef0', fontSize: '12px', letterSpacing: '3px' }}>AI OFFICE</div>
          <div style={{ display: 'flex', gap: '16px' }}>
            {([
              ['AGENTS', `${agents.length}/${agents.length}`],
              ['ACTIVE', String(activeCount)],
              ['SESSION', `${totalTokens.toLocaleString()} tokens`],
              ['COST', `$${(totalTokens * 0.00000035).toFixed(4)}`],
            ] as [string, string][]).map(([label, val]) => (
              <span key={label} style={{ color: '#444' }}>
                {label} <b style={{ color: '#9087e0' }}>{val}</b>
              </span>
            ))}
            <button
              onClick={() => setIsFullscreen(f => !f)}
              style={{
                background: '#1a1830', border: '1px solid #2d2a50', color: '#7c6ef0',
                padding: '2px 8px', fontSize: '9px', cursor: 'pointer',
                fontFamily: 'monospace', letterSpacing: '1px', borderRadius: '2px',
              }}
            >
              {isFullscreen ? '✕ EXIT' : '⛶ FULLSCREEN'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', flex: 1 }}>
          <div style={{
            position: 'relative', background: '#09090f',
            borderRight: '1px solid #1e1c3a',
            minHeight: '420px', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'linear-gradient(rgba(83,74,183,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(83,74,183,0.04) 1px,transparent 1px)',
              backgroundSize: '20px 20px',
            }} />
            <div style={{ position: 'absolute', top: '6px', left: '10px', fontSize: '8px', color: '#2a2848', letterSpacing: '3px' }}>
              PIXEL OFFICE · FLOOR 1
            </div>

            {agents.map(agent => (
              <AgentDesk key={agent.id} agent={agent} />
            ))}

            <div style={{
              position: 'absolute', bottom: '8px', left: '8px', right: '8px',
              background: '#0d0c18', border: '1px solid #1e1c3a', borderRadius: '3px', padding: '6px',
            }}>
              <div style={{ fontSize: '7px', color: '#2a2848', letterSpacing: '2px', marginBottom: '4px' }}>KANBAN WALL</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '3px' }}>
                {kanbanSummary.map(({ label, color, tickets }) => (
                  <div key={label} style={{ background: '#0a0918', borderRadius: '2px', padding: '3px' }}>
                    <div style={{ fontSize: '6px', textAlign: 'center', marginBottom: '3px', letterSpacing: '1px', color }}>{label}</div>
                    {Array.from({ length: Math.min(tickets, 5) }).map((_, i) => (
                      <div key={i} style={{ height: '4px', borderRadius: '1px', marginBottom: '2px', background: color, opacity: 0.8 }} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', background: '#0b0b14' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #1e1c3a' }}>
              {(['agents', 'feed', 'stats'] as SidebarTab[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    flex: 1, padding: '7px', fontSize: '9px', textAlign: 'center',
                    cursor: 'pointer', letterSpacing: '1px',
                    background: 'none', border: 'none',
                    borderBottom: `2px solid ${tab === t ? '#534ab7' : 'transparent'}`,
                    color: tab === t ? '#9087e0' : '#444',
                    fontFamily: 'monospace',
                  }}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
              {tab === 'agents' && (
                <>
                  <div style={{ fontSize: '8px', color: '#2a2848', letterSpacing: '2px', marginBottom: '8px' }}>
                    TEAM — {agents.length} AGENTS
                  </div>
                  {agents.map(agent => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      isComingSoon={agent.role === 'sdet'}
                    />
                  ))}
                </>
              )}
              {tab === 'feed' && <ActivityFeed />}
              {tab === 'stats' && <StatsTab />}
            </div>

            <div style={{
              padding: '5px 10px', background: '#111120',
              borderTop: '1px solid #1e1c3a',
              display: 'flex', justifyContent: 'space-between', fontSize: '8px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1d9e75' }}>
                <div style={{ width: '5px', height: '5px', background: '#0f6e56', borderRadius: '50%', animation: 'po-dotpulse 1.5s infinite' }} />
                live
              </div>
              <div style={{ color: '#2a2848' }}>v5.5</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
