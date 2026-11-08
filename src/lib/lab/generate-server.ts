import { limits, parseSpec, type GeneratedSpec } from "./generated";

// Server-side policy for /api/generate, kept free of any provider SDK so it can be tested directly.
// The provider call is injected as `generate`: it receives the learner's request and returns the model's raw
// JSON text. Everything else here (origin, size, prompt, rate limits, timeout, error mapping, validation) is
// the same whichever model sits behind it.

export type Generate = (prompt: string, signal: AbortSignal) => Promise<string>;

export const MAX_BODY_BYTES = 2048;
export const TIMEOUT_MS = 30_000;

export type RateLimits = { perMinute: number; perDay: number; dailyCap: number };
export const defaultRateLimits: RateLimits = { perMinute: 5, perDay: 30, dailyCap: 200 };

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const MAX_TRACKED_CLIENTS = 10_000;

export type RateDecision = { ok: true } | { ok: false; retryAfterSeconds: number };

// In-memory, per server instance. It bounds cost on a single long-running server; on serverless hosts each
// instance keeps its own counts, so the provider-side quota and a billing alert remain the hard ceiling.
export function createRateLimiter(config: RateLimits, now: () => number = Date.now) {
  const clients = new Map<string, number[]>();
  let day = { start: now(), count: 0 };

  return {
    take(client: string): RateDecision {
      const time = now();
      if (time - day.start >= DAY) day = { start: time, count: 0 };
      if (day.count >= config.dailyCap) return { ok: false, retryAfterSeconds: Math.ceil((day.start + DAY - time) / 1000) };

      const recent = (clients.get(client) ?? []).filter(stamp => time - stamp < DAY);
      const lastMinute = recent.filter(stamp => time - stamp < MINUTE);
      if (lastMinute.length >= config.perMinute) {
        clients.set(client, recent);
        return { ok: false, retryAfterSeconds: Math.ceil((lastMinute[0] + MINUTE - time) / 1000) };
      }
      if (recent.length >= config.perDay) {
        clients.set(client, recent);
        return { ok: false, retryAfterSeconds: Math.ceil((recent[0] + DAY - time) / 1000) };
      }

      if (!clients.has(client) && clients.size >= MAX_TRACKED_CLIENTS) {
        const oldest = clients.keys().next().value;
        if (oldest !== undefined) clients.delete(oldest);
      }
      recent.push(time);
      clients.set(client, recent);
      day.count += 1;
      return { ok: true };
    },
  };
}

function reply(status: number, error: string, headers?: Record<string, string>) {
  return Response.json({ error }, { status, headers });
}

// The first address a proxy reports. Only trustworthy behind a host that overwrites the header (as Vercel and
// most managed hosts do); otherwise a client could rotate it, which is why the global daily cap also exists.
export function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown";
}

// Browsers send Origin on cross-origin POSTs. A mismatched Origin, or Sec-Fetch-Site: cross-site, is refused so
// other sites cannot spend this deployment's quota from their visitors' browsers.
function sameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  try { return new URL(origin).host === host; } catch { return false; }
}

function statusOf(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const record = error as { status?: unknown; statusCode?: unknown };
  const value = typeof record.statusCode === "number" ? record.statusCode : record.status;
  return typeof value === "number" ? value : undefined;
}

// Only the SDK's own request timeout counts as a timeout here; our deadline is detected through the abort signal.
function timedOut(error: unknown) {
  return error instanceof Error && /^(RequestTimeoutError|APIConnectionTimeoutError)$/.test(error.name);
}

// Server log only: the error's class, HTTP status and first line of its message, never the request or the key.
function logFailure(stage: string, error: unknown) {
  const name = error instanceof Error ? error.name : typeof error;
  const message = error instanceof Error ? error.message.split("\n")[0].slice(0, 300) : "";
  console.error(`[generate] ${stage}: ${name}${statusOf(error) ? ` (HTTP ${statusOf(error)})` : ""}${message ? `: ${message}` : ""}`);
}

export function createGenerateHandler(options: {
  generate: Generate | null;
  limiter: { take(client: string): RateDecision };
  timeoutMs?: number;
  notConfiguredMessage?: string;
}) {
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;

  return async function POST(request: Request): Promise<Response> {
    if (!sameOrigin(request)) return reply(403, "Requests must come from this site.");

    const declared = Number(request.headers.get("content-length") ?? "0");
    if (declared > MAX_BODY_BYTES) return reply(413, "That request is too large.");
    const raw = await request.text().catch(() => "");
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) return reply(413, "That request is too large.");

    let body: unknown = null;
    try { body = JSON.parse(raw); } catch { body = null; }
    const prompt = typeof body === "object" && body !== null && "prompt" in body && typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) return reply(400, "Describe what you want to see.");
    if (prompt.length > limits.prompt) return reply(400, `Keep the request under ${limits.prompt} characters.`);

    if (!options.generate) {
      return reply(503, options.notConfiguredMessage ?? "Generation is not configured. Set GEMINI_API_KEY on the server to enable it.");
    }

    const decision = options.limiter.take(clientAddress(request));
    if (!decision.ok) {
      return reply(429, "You've made a lot of requests. Try again in a little while.", { "retry-after": String(decision.retryAfterSeconds) });
    }

    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(new Error("Generation timed out")), timeoutMs);
    try {
      const text = await Promise.race([
        options.generate(prompt, abort.signal),
        new Promise<never>((_, reject) => abort.signal.addEventListener("abort", () => reject(new Error("Generation timed out")), { once: true })),
      ]);
      if (!text) { logFailure("empty output", new Error("no output_text")); return reply(502, "The model returned no example. Try again."); }
      let spec: GeneratedSpec;
      try { spec = parseSpec(JSON.parse(text)); } catch (error) { logFailure("invalid output", error); return reply(502, "The model returned an unusable example. Try again."); }
      return Response.json({ spec });
    } catch (error) {
      logFailure(abort.signal.aborted ? `timed out after ${timeoutMs} ms` : "provider error", error);
      if (abort.signal.aborted || timedOut(error)) return reply(504, "Generation took too long. Try again.");
      const status = statusOf(error);
      if (status === 429) return reply(429, "The example service is busy. Try again in a moment.");
      if (status === 401 || status === 403) return reply(503, "Generation credentials were rejected by the API.");
      if (status === 400) return reply(422, "That request couldn't be turned into an example. Try rephrasing it.");
      return reply(502, "Generation failed. Try again.");
    } finally {
      clearTimeout(timer);
    }
  };
}
