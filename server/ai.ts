// ─── Acqlerate AI: one door to Claude ─────────────────────────────────────────
// Every in-app AI feature (Study Assistant buttons, bullet expand, FAR
// translator) calls askClaude(). One place to change the model, the timeout,
// the retry rule, and the usage log that feeds the cost ledger.
//
// Needs ANTHROPIC_API_KEY in Railway. AI_MODEL overrides the first model tried.

const API_URL = "https://api.anthropic.com/v1/messages";

// Haiku 4.5 is fast and cheap for short answers. Sonnet 5 is the fallback if
// Haiku is overloaded or erroring, so a busy moment never blanks the feature.
const DEFAULT_MODELS = ["claude-haiku-4-5-20251001", "claude-sonnet-5"];

// The browser gives up after 20s, so the server stops waiting a bit sooner and
// can still send a clean error message back.
const TIMEOUT_MS = 18_000;

export class AiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface AskClaudeOptions {
  /** What the feature is, for the usage log (e.g. "explain:eli5"). */
  feature: string;
  prompt: string;
  system?: string;
  maxTokens?: number;
  /** Override the model order for one call (first is tried first). */
  models?: string[];
}

export interface AskClaudeResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export async function askClaude(opts: AskClaudeOptions): Promise<AskClaudeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new AiError("AI is not configured yet. Add ANTHROPIC_API_KEY in Railway.", 503);

  const models = opts.models
    ?? (process.env.AI_MODEL ? [process.env.AI_MODEL, ...DEFAULT_MODELS.filter(m => m !== process.env.AI_MODEL)] : DEFAULT_MODELS);

  let lastErr = "";
  let lastStatus = 500;
  for (const model of models) {
    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: opts.maxTokens ?? 1024,
          ...(opts.system ? { system: opts.system } : {}),
          messages: [{ role: "user", content: opts.prompt }],
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const data: any = await resp.json().catch(() => ({}));
      if (resp.ok) {
        const text = (data?.content ?? [])
          .filter((b: any) => b?.type === "text")
          .map((b: any) => b.text)
          .join("")
          .trim();
        if (text) {
          const inputTokens = data?.usage?.input_tokens ?? 0;
          const outputTokens = data?.usage?.output_tokens ?? 0;
          console.log(`[ai] ${opts.feature} model=${model} in=${inputTokens} out=${outputTokens}`);
          return { text, model, inputTokens, outputTokens };
        }
        lastErr = "empty response";
        lastStatus = 502;
        continue;
      }
      lastErr = data?.error?.message ?? `HTTP ${resp.status}`;
      lastStatus = resp.status;
      // 401/403 = bad key; 429 = our rate limit. Another model won't help.
      if (resp.status === 401 || resp.status === 403 || resp.status === 429) break;
    } catch (err: any) {
      lastErr = err?.name === "TimeoutError" ? "timed out" : (err?.message ?? "fetch error");
      lastStatus = 504;
      // A timeout already used most of the browser's 20s budget; don't start another call.
      if (err?.name === "TimeoutError") break;
    }
  }
  console.error(`[ai] ${opts.feature} failed: ${lastStatus} ${lastErr}`);
  throw new AiError(lastErr, lastStatus >= 500 ? lastStatus : 502);
}
