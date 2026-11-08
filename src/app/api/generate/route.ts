import { GoogleGenAI } from "@google/genai";
import { specSchema } from "@/lib/lab/generated";
import { SYSTEM_PROMPT } from "@/lib/lab/generate-prompt";
import { createGenerateHandler, createRateLimiter, defaultRateLimits, TIMEOUT_MS, type Generate } from "@/lib/lab/generate-server";

export const dynamic = "force-dynamic";

// Verified against Google's Gemini API docs (model, structured-output and thinking pages) on 8 Nov 2026:
// gemini-3.5-flash-lite is a stable model, Google's fastest 3.5 model, with structured output, and its default
// thinking level is "minimal". A spec is a few hundred tokens of constrained JSON, so speed matters more than depth.
const DEFAULT_MODEL = "gemini-3.5-flash-lite";

// Lowest thinking level each model accepts (docs "Thinking" table). Models not listed get "low", which every
// current Gemini 3 model accepts.
const MINIMAL_THINKING = new Set(["gemini-3.5-flash-lite", "gemini-3.6-flash"]);
function thinkingLevelFor(model: string) {
  return MINIMAL_THINKING.has(model) ? "minimal" : "low";
}

function geminiGenerate(apiKey: string): Generate {
  const client = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const thinking_level = thinkingLevelFor(model);
  return async (prompt, signal) => {
    const interaction = await client.interactions.create({
      model,
      input: prompt,
      system_instruction: SYSTEM_PROMPT,
      response_format: { type: "text", mime_type: "application/json", schema: specSchema },
      // A full spec is well under 600 tokens; the cap stops a runaway answer from costing time.
      generation_config: { thinking_level, max_output_tokens: 1024 },
    }, { timeout_ms: TIMEOUT_MS, retries: { strategy: "none" }, fetch_options: { signal } });
    return interaction.output_text ?? "";
  };
}

function dailyCap() {
  const value = Number(process.env.GENERATE_DAILY_CAP);
  return Number.isInteger(value) && value >= 0 ? value : defaultRateLimits.dailyCap;
}

const apiKey = process.env.GEMINI_API_KEY?.trim();

export const POST = createGenerateHandler({
  generate: apiKey ? geminiGenerate(apiKey) : null,
  limiter: createRateLimiter({ ...defaultRateLimits, dailyCap: dailyCap() }),
});
