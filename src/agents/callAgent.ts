import { stripJsonFences } from '@/lib/parseJson'

function getModel(): string {
  if (typeof window === 'undefined') return 'claude-haiku-4-5-20251001'
  try {
    const raw = localStorage.getItem('ai-office-settings')
    if (raw) {
      const parsed = JSON.parse(raw)
      const model = parsed?.state?.model
      if (model) return model
    }
  } catch {}
  return 'claude-haiku-4-5-20251001'
}

export async function callAgent(system: string, userMessage: string): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: getModel(),
          system,
          messages: [{ role: "user", content: userMessage }],
        }),
      })
      const data = await res.json()
      const text = data.content?.map((c: any) => c.text || "").join("") ?? ""
      return stripJsonFences(text)
    } catch (err) {
      if (attempt === 3) throw err
      await new Promise(r => setTimeout(r, attempt * 1000))
    }
  }
  throw new Error("All retries failed")
}
