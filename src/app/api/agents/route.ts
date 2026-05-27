import { NextRequest, NextResponse } from 'next/server'

const MODEL_MAX_TOKENS: Record<string, number> = {
  'claude-haiku-4-5-20251001': 4000,
  'claude-sonnet-4-20250514':  8000,
  'claude-opus-4-20250514':    8000,
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { system, messages, model, max_tokens } = body

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  const resolvedModel = model || 'claude-haiku-4-5-20251001'
  const resolvedMaxTokens = max_tokens || MODEL_MAX_TOKENS[resolvedModel] || 4000

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
      body: JSON.stringify({
        model:      resolvedModel,
        max_tokens: resolvedMaxTokens,
        system,
        messages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Anthropic API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Anthropic API error: ${response.status}`, details: errorText },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('API route error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
