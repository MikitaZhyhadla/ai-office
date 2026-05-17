"use client"
import type { TranslationResult } from "@/agents/translationAgent"

interface TranslationBannerProps {
  result: TranslationResult
}

export function TranslationBanner({ result }: TranslationBannerProps) {
  const displayText = result.translated.length > 150
    ? result.translated.slice(0, 150) + '…'
    : result.translated

  return (
    <div style={{
      background: '#f0f8ff',
      border: '1px solid #b0d4f0',
      borderRadius: 8,
      padding: '12px 14px',
      display: 'flex',
      gap: 10,
      alignItems: 'flex-start',
      marginBottom: 12,
    }}>
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🌐</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1a6fa0', marginBottom: 4 }}>
          Translated from {result.detectedLanguage}
        </div>
        <div style={{ fontSize: 12, color: '#333', lineHeight: 1.5, fontStyle: 'italic' }}>
          "{displayText}"
        </div>
        <div style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
          Detected: {result.detectedLanguage} · Translated to English · Used for BA analysis
        </div>
      </div>
    </div>
  )
}
