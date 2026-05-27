import { useSettingsStore } from '@/store/useSettingsStore'
import { useAppStore } from '@/store/useAppStore'

type AgentId = 'aliceBA' | 'bobBA' | 'qaLead' | 'devLead' | 'sdetAgent'

const MODEL_MAX_TOKENS: Record<string, number> = {
  'claude-haiku-4-5-20251001': 4000,
  'claude-sonnet-4-20250514':  8000,
  'claude-opus-4-20250514':    8000,
}

const AGENT_ID_MAP: Record<string, string> = {
  aliceBA:   'alice',
  bobBA:     'bob',
  qaLead:    'qa1',
  devLead:   'dev1',
  sdetAgent: 'sdet1',
}

export function safeParseJson<T>(text: string, fallback?: T): T {
  if (!text || text.trim() === '') {
    if (fallback !== undefined) return fallback
    throw new Error('Empty response from agent')
  }

  const stripped = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  const clean = (start !== -1 && end !== -1 && end > start) ? stripped.slice(start, end + 1) : stripped

  try {
    return JSON.parse(clean) as T
  } catch (_) {
    const lastBrace = clean.lastIndexOf('}')
    if (lastBrace !== -1) {
      try {
        return JSON.parse(clean.slice(0, lastBrace + 1)) as T
      } catch (_) {
        // truncation recovery failed
      }
    }
    if (fallback !== undefined) return fallback
    throw new Error(`Failed to parse agent JSON response. Raw: ${text.slice(0, 200)}`)
  }
}

export async function callAgent(
  system: string,
  userMessage: string,
  agentId?: AgentId
): Promise<string> {
  const settings = useSettingsStore.getState()
  let model: string

  if (settings.agentModelOverride && agentId && settings.agentModels?.[agentId]) {
    model = settings.agentModels[agentId]
  } else {
    model = settings.model || 'claude-haiku-4-5-20251001'
  }

  const max_tokens = MODEL_MAX_TOKENS[model] || 4000

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system,
          messages: [{ role: 'user', content: userMessage }],
          model,
          max_tokens,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        console.error(`callAgent HTTP ${res.status} (attempt ${attempt}):`, errText)
        if (attempt === 3) throw new Error(`Agent API returned ${res.status}: ${errText}`)
        await new Promise(r => setTimeout(r, attempt * 1000))
        continue
      }

      const data = await res.json()

      if (data.error) {
        console.error(`callAgent Anthropic error (attempt ${attempt}):`, data.error)
        if (attempt === 3) throw new Error(`Anthropic error: ${data.error}`)
        await new Promise(r => setTimeout(r, attempt * 1000))
        continue
      }

      const text = data.content?.map((c: { text?: string }) => c.text || '').join('') ?? ''

      if (!text || text.trim() === '') {
        console.error(`callAgent empty response (attempt ${attempt}), model: ${model}`)
        if (attempt === 3) throw new Error('Agent returned empty response after 3 attempts')
        await new Promise(r => setTimeout(r, attempt * 1500))
        continue
      }

      try {
        const store = useAppStore.getState()
        const approxTokens = Math.ceil((system.length + userMessage.length + text.length) / 4)
        if (agentId) {
          const storeId = AGENT_ID_MAP[agentId]
          if (storeId) {
            store.addAgentTokens(storeId, approxTokens)
            store.addAgentActivity(storeId, 'completed task')
          }
        }
      } catch (_) {
        // Non-critical — don't break agent flow if tracking fails
      }

      return text
    } catch (err) {
      if (attempt === 3) throw err
      await new Promise(r => setTimeout(r, attempt * 1000))
    }
  }

  throw new Error('callAgent: all retry attempts failed')
}
