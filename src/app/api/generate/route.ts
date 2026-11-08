import { GoogleGenAI } from "@google/genai";
import { specSchema } from "@/lib/lab/generated";
import { SYSTEM_PROMPT } from "@/lib/lab/generate-prompt";
import { createGenerateHandler, createRateLimiter, defaultRateLimits, TIMEOUT_MS, type Generate } from "@/lib/lab/generate-server";

export const dynamic = "force-dynamic";

// Verified against Google's Gemini API docs (models and structured-output pages) on 8 Nov 2026:
// gemini-3.8-flash is a stable model with structured output and thinking levels low/medium/high.
const DEFAULT_MODEL = "gemini-3.8-flash";

function geminiGenerate(apiKey: string): Generate {
  const client = new GoogleGenAI({ apiKey });
  const model = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  return async (prompt, signal) => {
    const interaction = await client.interactions.create({
      model,
      input: prompt,
      system_instruction: SYSTEM_PROMPT,
      response_format: { type: "text", mime_type: "application/json", schema: specSchema },
      generation_config: { thinking_level: "low", max_output_tokens: 2048 },
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
