import { stripJsonFences } from '@/lib/parseJson'
import { useAppStore } from '@/store/useAppStore'
function getModel(agentId?: string): string {
  if (typeof window === 'undefined') return 'claude-haiku-4-5-20251001'
  try {
    const raw = localStorage.getItem('ai-office-settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      const state = parsed?.state
      if (state?.agentModelOverride && agentId && state?.agentModels?.[agentId]) {
        return state.agentModels[agentId]
      }
      const model = state?.model
      if (model) return model
    }
  } catch {}
  return 'claude-haiku-4-5-20251001'
}

const AGENT_ID_MAP: Record<string, string> = {
  aliceBA: 'alice',
  bobBA: 'bob',
  qaLead: 'qa1',
  devLead: 'dev1',
}

export async function callAgent(
  system: string,
  userMessage: string,
  agentId?: string,
  maxTokens = 1000
): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: getModel(agentId),
          max_tokens: maxTokens,
          system,
          messages: [{ role: "user", content: userMessage }],
        }),
      })
      const data = await res.json()
      const text = data.content?.map((c: { text?: string }) => c.text || "").join("") ?? ""
      const result = stripJsonFences(text)

      try {
        const store = useAppStore.getState()
        const approxTokens = Math.ceil((system.length + userMessage.length + result.length) / 4)
        if (agentId) {
          const storeId = AGENT_ID_MAP[agentId]
          if (storeId) {
            store.addAgentTokens(storeId, approxTokens)
            store.addAgentActivity(storeId, `completed task`)
          }
        }
      } catch (_) {
        // Non-critical — don't break agent flow if tracking fails
      }

      return result
    } catch (err) {
      if (attempt === 3) throw err
      await new Promise(r => setTimeout(r, attempt * 1000))
    }
  }
  throw new Error("All retries failed")
}
