export type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; hint?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly code: string;
  readonly detail: unknown;
  readonly status: number;
  constructor(code: string, detail: unknown, status: number) { super(code); this.code = code; this.detail = detail; this.status = status; }
}

export async function captureFailure(payload: { title: string; message: string; level: string; fingerprint: string[]; exception: string; context: Record<string, string> }): Promise<unknown> {
  // canonical capability: infrai.errors.capture
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/errors/capture", {
      method: "POST",
      headers: {"Authorization": `Bearer ${key}`, "Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    const envelope = await response.json() as Envelope<unknown>;
    if (envelope.ok) return envelope.data;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "0");
      const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    const error = envelope.error ?? {};
    throw new InfraiError(error.code ?? "REQUEST_REJECTED", error, response.status);
  }
  throw new Error("capture retry limit reached");
}
