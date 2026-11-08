// Times three requests to Gemini so a slow "Try your own" can be traced to the network, the model or the request.
// Usage: node scripts/gemini-check.mjs        (reads GEMINI_API_KEY and GEMINI_MODEL from .env.local)
// Prints timings and error classes only; never the key.
import { readFileSync } from "node:fs";
import { GoogleGenAI } from "@google/genai";

const env = {};
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
} catch { /* fall back to the shell environment */ }
const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const model = env.GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
if (!apiKey) { console.log("No GEMINI_API_KEY in .env.local or the environment."); process.exit(1); }

async function timed(label, run) {
  const start = Date.now();
  try {
    const detail = await run();
    console.log(`ok    ${String(Date.now() - start).padStart(6)} ms  ${label}${detail ? `  (${detail})` : ""}`);
  } catch (error) {
    const status = error?.statusCode ?? error?.status;
    console.log(`FAIL  ${String(Date.now() - start).padStart(6)} ms  ${label}  ${error?.name ?? "Error"}${status ? ` HTTP ${status}` : ""}: ${String(error?.message ?? error).split("\n")[0].slice(0, 160)}`);
  }
}

const client = new GoogleGenAI({ apiKey });
const options = { timeout_ms: 20_000, retries: { strategy: "none" } };
const thinking_level = ["gemini-3.5-flash-lite", "gemini-3.6-flash"].includes(model) ? "minimal" : "low";
console.log(`Model: ${model}, thinking: ${thinking_level}, Node ${process.version}\n`);

await timed("1. network: reach generativelanguage.googleapis.com", async () => {
  const response = await fetch("https://generativelanguage.googleapis.com/", { signal: AbortSignal.timeout(10_000) });
  return `HTTP ${response.status}`;
});
await timed("2. tiny text answer", async () => {
  const result = await client.interactions.create({ model, input: "Reply with the single word OK.",
    generation_config: { thinking_level, max_output_tokens: 16 } }, options);
  return JSON.stringify(result.output_text ?? "").slice(0, 40);
});
await timed("3. small structured JSON answer", async () => {
  const result = await client.interactions.create({ model, input: "A card with a title and a price.",
    response_format: { type: "text", mime_type: "application/json", schema: { type: "object", additionalProperties: false,
      required: ["title", "price"], properties: { title: { type: "string" }, price: { type: "string" } } } },
    generation_config: { thinking_level, max_output_tokens: 256 } }, options);
  return String(result.output_text ?? "").slice(0, 60);
});
console.log("\nIf step 1 fails or takes seconds, it is the network. If 1 is fast but 2 and 3 time out, it is the model or account.");
