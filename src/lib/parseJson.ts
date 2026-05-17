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
