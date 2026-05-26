'use client'

import React from 'react'

type AgentRole = 'ba' | 'qa' | 'dev' | 'sdet'
type OrbitSpeed = 'slow' | 'medium' | 'fast'

interface DocOrbitProps {
  role: AgentRole
  speed: OrbitSpeed
  docCount?: number
}

const ROLE_STYLES: Record<AgentRole, { border: string; color: string; bg: string }> = {
  ba:   { border: '#312e5a', color: '#534ab7', bg: '#1a1830' },
  qa:   { border: '#1d4a3a', color: '#1d9e75', bg: '#0c1812' },
  dev:  { border: '#4a2e0d', color: '#ef9f27', bg: '#130e05' },
  sdet: { border: '#1a3560', color: '#185fa5', bg: '#090f1a' },
}

const SPEED_DURATION: Record<OrbitSpeed, string> = {
  slow:   '5s',
  medium: '3s',
  fast:   '1.5s',
}

const DOC_ICONS = ['📄', '📋', '📝']
const DEV_ICONS = ['⚙️', '📐', '🔢']

export function DocOrbit({ role, speed, docCount = 3 }: DocOrbitProps) {
  const styles = ROLE_STYLES[role]
  const duration = SPEED_DURATION[speed]
  const icons = role === 'dev' ? DEV_ICONS : DOC_ICONS
  const opacity = speed === 'slow' ? 0.25 : 1

  return (
    <>
      <style>{`
        @keyframes po-orbit1 {
          from { transform: rotate(0deg) translateX(18px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(18px) rotate(-360deg); }
        }
        @keyframes po-orbit2 {
          from { transform: rotate(120deg) translateX(18px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(18px) rotate(-480deg); }
        }
        @keyframes po-orbit3 {
          from { transform: rotate(240deg) translateX(18px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(18px) rotate(-600deg); }
        }
      `}</style>
      <div style={{
        position: 'absolute',
        top: '-52px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '52px',
        height: '52px',
        pointerEvents: 'none',
        opacity,
      }}>
        {Array.from({ length: docCount }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '8px',
              height: '10px',
              background: styles.bg,
              border: `1px solid ${styles.border}`,
              borderRadius: '1px',
              fontSize: '4px',
              color: styles.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transformOrigin: '26px 26px',
              left: '22px',
              top: '20px',
              animation: `po-orbit${i + 1} ${duration} linear infinite`,
            }}
          >
            {icons[i] || '📄'}
          </div>
        ))}
      </div>
    </>
  )
}
