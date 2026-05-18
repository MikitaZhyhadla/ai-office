export function stripJsonFences(text: string): string {
  let clean = text.trim()
  clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/, '')
  clean = clean.replace(/\s*```$/, '').trim()
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    return clean.slice(start, end + 1)
  }
  return clean
}

/**
 * Attempts to recover a truncated JSON string by finding the last
 * complete object. Returns fallback if recovery fails.
 */
export function safeParseJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(stripJsonFences(text)) as T
  } catch {
    const clean = stripJsonFences(text)
    const lastBrace = clean.lastIndexOf('}')
    if (lastBrace !== -1) {
      try {
        return JSON.parse(clean.slice(0, lastBrace + 1)) as T
      } catch {
        // truncation recovery failed
      }
    }
    console.warn('safeParseJson: could not recover JSON, using fallback. Raw text length:', text.length)
    return fallback
  }
}
