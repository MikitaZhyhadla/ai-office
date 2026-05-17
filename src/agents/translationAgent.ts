interface TranslationResult {
  original:         string
  translated:       string
  detectedLanguage: string
}

export type { TranslationResult }

export async function runTranslationAgent(
  text: string,
  detectedLanguage: string
): Promise<TranslationResult> {
  const systemPrompt = `You are a professional technical translator. Translate the provided text to English. Preserve technical terms, product names, and proper nouns. Output ONLY the English translation — no explanation, no preamble, no quotation marks wrapping the output.`

  const userPrompt = `Translate this ${detectedLanguage} text to English:\n\n${text}`

  try {
    const response = await fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`)
    }

    const data = await response.json()
    const translated = (data.content?.map((c: { text?: string }) => c.text || '').join('') ?? '').trim()

    if (!translated) {
      throw new Error('Empty translation response')
    }

    return { original: text, translated, detectedLanguage }
  } catch (err) {
    throw new Error('TranslationAgent: ' + (err instanceof Error ? err.message : String(err)))
  }
}
