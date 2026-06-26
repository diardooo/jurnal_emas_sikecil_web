/**
 * Single swappable LLM entry point for the app. Default provider: Google
 * Gemini (free tier) via REST — no SDK dependency. To move to another provider
 * (Groq, Claude, …) only this file changes; callers use `generateAnswer`.
 *
 * The API key lives ONLY in server env (`GEMINI_API_KEY`) and is never sent to
 * the client. When it's absent, `aiConfigured()` is false and callers should
 * respond 503 (mirrors the Cloudinary/Midtrans "not configured" pattern).
 */

/** Thrown when no API key is configured — the route maps this to 503. */
export class AiNotConfiguredError extends Error {
  constructor() {
    super("AI belum dikonfigurasi");
    this.name = "AiNotConfiguredError";
  }
}

export function aiConfigured(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

/**
 * Generate one grounded answer. `system` carries the guardrails, `user` carries
 * the child context + the parent's question.
 */
export async function generateAnswer(system: string, user: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiNotConfiguredError();

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 800 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Gemini error ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim() ?? "";
  if (!text) throw new Error("Jawaban kosong dari AI");
  return text;
}
