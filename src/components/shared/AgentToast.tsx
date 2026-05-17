'use client'
import { useEffect, useState } from 'react'

interface AgentToastProps {
  agentName: string
  isVisible: boolean
  onSettingsClick?: () => void
}

export function AgentToast({ agentName, isVisible, onSettingsClick }: AgentToastProps) {
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)

  useEffect(() => {
    if (!isVisible) {
      setShowTimeoutWarning(false)
      return
    }
    const timer = setTimeout(() => setShowTimeoutWarning(true), 60000)
    return () => clearTimeout(timer)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 50,
      maxWidth: 340, background: '#fff', border: '1px solid #e8e8f0',
      borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 20, height: 20, flexShrink: 0, marginTop: 2,
          border: '2.5px solid #534AB7', borderTopColor: 'transparent',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
            🪄 {agentName} is doing their magic...
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: '#888' }}>
            This may take a moment. Please wait.
          </p>
          {showTimeoutWarning && (
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#92400e' }}>
              Still thinking...{' '}
              <button
                onClick={onSettingsClick}
                style={{
                  background: 'none', border: 'none', padding: 0,
                  fontSize: 11, color: '#92400e', cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Try a lighter model in Settings
              </button>
            </p>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
