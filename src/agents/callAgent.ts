export async function callAgent(system: string, userMessage: string): Promise<string> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system,
          messages: [{ role: "user", content: userMessage }],
        }),
      })
      const data = await res.json()
      const text = data.content?.map((c: any) => c.text || "").join("") ?? ""
      return text.replace(/```json|```/g, "").trim()
    } catch (err) {
      if (attempt === 3) throw err
      await new Promise(r => setTimeout(r, attempt * 1000))
    }
  }
  throw new Error("All retries failed")
}
