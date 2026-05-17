export function needsTranslation(text: string): boolean {
  if (!text || text.trim().length === 0) return false
  const cyrillicChars = (text.match(/[Ѐ-ӿ]/g) || []).length
  const totalChars = text.replace(/\s/g, '').length
  if (totalChars === 0) return false
  return cyrillicChars / totalChars > 0.3
}

export function detectLanguageName(text: string): string {
  const cyrillicChars = (text.match(/[Ѐ-ӿ]/g) || []).length
  const totalChars = text.replace(/\s/g, '').length
  if (totalChars > 0 && cyrillicChars / totalChars > 0.3) return 'Russian'
  return 'Unknown'
}
