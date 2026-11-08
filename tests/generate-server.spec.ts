import { expect, test } from "@playwright/test";
import { createGenerateHandler, createRateLimiter, MAX_BODY_BYTES, type Generate } from "../src/lib/lab/generate-server";

// The /api/generate policy, exercised directly with a stand-in model. No network and no API key.

const validSpec = JSON.stringify({
  name: "Pricing", teaching: "The plan name becomes the card.", layout: "single",
  cards: [{ tag: "Plan", icon: "Rocket", texts: [{ element: "Title", style: "title", text: "Starter" }] }],
});

const roomy = () => createRateLimiter({ perMinute: 100, perDay: 1000, dailyCap: 1000 });

function post(prompt: unknown, headers: Record<string, string> = {}) {
  return new Request("http://lab.test/api/generate", {
    method: "POST",
    headers: { "content-type": "application/json", host: "lab.test", ...headers },
    body: JSON.stringify({ prompt }),
  });
}

function failingWith(status: number): Generate {
  return async () => { throw Object.assign(new Error(`HTTP ${status}`), { statusCode: status }); };
}

test("a valid model response is validated and returned as a spec", async () => {
  const seen: string[] = [];
  const handler = createGenerateHandler({ generate: async prompt => { seen.push(prompt); return validSpec; }, limiter: roomy() });
  const response = await handler(post("  a pricing card  ", { origin: "http://lab.test" }));
  expect(response.status).toBe(200);
  expect((await response.json()).spec.cards[0]).toEqual({ tag: "Plan", icon: "Rocket", texts: [{ element: "Title", style: "title", text: "Starter" }] });
  expect(seen).toEqual(["a pricing card"]);
});

test("cross-site requests are refused before any model call", async () => {
  let calls = 0;
  const handler = createGenerateHandler({ generate: async () => { calls += 1; return validSpec; }, limiter: roomy() });
  expect((await handler(post("a card", { origin: "https://elsewhere.example" }))).status).toBe(403);
  expect((await handler(post("a card", { "sec-fetch-site": "cross-site" }))).status).toBe(403);
  expect(calls).toBe(0);
});

test("oversize bodies, empty and overlong prompts are rejected", async () => {
  const handler = createGenerateHandler({ generate: async () => validSpec, limiter: roomy() });
  expect((await handler(post("x".repeat(MAX_BODY_BYTES + 10)))).status).toBe(413);
  expect((await handler(post("   "))).status).toBe(400);
  expect((await handler(post(42))).status).toBe(400);
  expect((await handler(post("x".repeat(201)))).status).toBe(400);
});

test("without a key the route answers 503 and never counts against the limit", async () => {
  const limiter = createRateLimiter({ perMinute: 1, perDay: 1, dailyCap: 1 });
  const handler = createGenerateHandler({ generate: null, limiter });
  for (let i = 0; i < 3; i++) {
    const response = await handler(post("a card"));
    expect(response.status).toBe(503);
    expect((await response.json()).error).toMatch(/not configured/i);
  }
  expect(limiter.take("someone")).toEqual({ ok: true });
});

test("per-client minute and day limits answer 429 with Retry-After, per client", async () => {
  let time = 0;
  const handler = createGenerateHandler({ generate: async () => validSpec,
    limiter: createRateLimiter({ perMinute: 2, perDay: 3, dailyCap: 100 }, () => time) });
  const from = (ip: string) => post("a card", { "x-forwarded-for": `${ip}, 10.0.0.1` });
  expect((await handler(from("1.1.1.1"))).status).toBe(200);
  expect((await handler(from("1.1.1.1"))).status).toBe(200);
  const limited = await handler(from("1.1.1.1"));
  expect(limited.status).toBe(429);
  expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
  expect((await handler(from("2.2.2.2"))).status).toBe(200);
  time += 61_000;
  expect((await handler(from("1.1.1.1"))).status).toBe(200);
  time += 61_000;
  expect((await handler(from("1.1.1.1"))).status).toBe(429);
  time += 24 * 60 * 60_000;
  expect((await handler(from("1.1.1.1"))).status).toBe(200);
});

test("the global daily cap stops all clients until the day rolls over", async () => {
  let time = 0;
  const handler = createGenerateHandler({ generate: async () => validSpec,
    limiter: createRateLimiter({ perMinute: 100, perDay: 100, dailyCap: 2 }, () => time) });
  expect((await handler(post("a", { "x-forwarded-for": "1.1.1.1" }))).status).toBe(200);
  expect((await handler(post("b", { "x-forwarded-for": "2.2.2.2" }))).status).toBe(200);
  expect((await handler(post("c", { "x-forwarded-for": "3.3.3.3" }))).status).toBe(429);
  time += 24 * 60 * 60_000;
  expect((await handler(post("d", { "x-forwarded-for": "3.3.3.3" }))).status).toBe(200);
});

test("a slow model times out with 504 and its signal is aborted", async () => {
  let aborted = false;
  const handler = createGenerateHandler({ timeoutMs: 50, limiter: roomy(), generate: (_, signal) => new Promise(() => {
    signal.addEventListener("abort", () => { aborted = true; });
  }) });
  const response = await handler(post("a card"));
  expect(response.status).toBe(504);
  expect(aborted).toBe(true);
});

test("provider errors map to the user-facing messages", async () => {
  const cases: [number, number][] = [[429, 429], [401, 503], [403, 503], [400, 422], [500, 502]];
  for (const [provider, expected] of cases) {
    const response = await createGenerateHandler({ generate: failingWith(provider), limiter: roomy() })(post("a card"));
    expect(response.status, `provider ${provider}`).toBe(expected);
    const { error } = await response.json();
    expect(error).not.toMatch(/HTTP \d+/);
  }
});

test("empty, non-JSON and invalid model output is rejected with 502", async () => {
  for (const output of ["", "not json", JSON.stringify({ cards: [] }), JSON.stringify({ name: "X", cards: Array(4).fill({ tag: "A", texts: [{ element: "T", style: "body", text: "x" }] }) })]) {
    const response = await createGenerateHandler({ generate: async () => output, limiter: roomy() })(post("a card"));
    expect(response.status, output.slice(0, 20)).toBe(502);
  }
});

test("the prompt's worked example passes validation unchanged and respects the stated limits", async () => {
  const { EXAMPLE_SPEC, SYSTEM_PROMPT } = await import("../src/lib/lab/generate-prompt");
  const { parseSpec, buildTemplate } = await import("../src/lib/lab/generated");
  const { validateTemplate } = await import("../src/lib/lab/templates");
  expect(parseSpec(JSON.parse(JSON.stringify(EXAMPLE_SPEC)))).toEqual(EXAMPLE_SPEC);
  expect(() => validateTemplate(buildTemplate(EXAMPLE_SPEC))).not.toThrow();
  expect(EXAMPLE_SPEC.name.length).toBeLessThanOrEqual(20);
  expect(EXAMPLE_SPEC.teaching.length).toBeLessThanOrEqual(100);
  expect(EXAMPLE_SPEC.cards.flatMap(card => card.texts).every(entry => entry.text.length <= 40)).toBe(true);
  expect(SYSTEM_PROMPT).toContain(JSON.stringify(EXAMPLE_SPEC));
  expect(SYSTEM_PROMPT).not.toContain("${");
});

test("only a real timeout is reported as too slow; other failures are not mislabelled", async () => {
  const fails = (error: Error): Generate => async () => { throw error; };
  const misleading = Object.assign(new Error("The connection was aborted by the peer"), { name: "ConnectionError" });
  expect((await createGenerateHandler({ generate: fails(misleading), limiter: roomy() })(post("a card"))).status).toBe(502);
  const sdkTimeout = Object.assign(new Error("Request timed out"), { name: "APIConnectionTimeoutError" });
  expect((await createGenerateHandler({ generate: fails(sdkTimeout), limiter: roomy() })(post("a card"))).status).toBe(504);
});
