import Anthropic from "@anthropic-ai/sdk";
import { limits, parseSpec, specSchema } from "@/lib/lab/generated";

export const dynamic = "force-dynamic";

const system = `You design tiny teaching examples for a "code to component" morph lab.
Given what the learner wants to see, return a spec for one small UI component: 1-3 cards, each with an optional icon and 1-3 short text lines.
Rules:
- Element names are PascalCase and describe the role (Title, Price, Caption, Badge).
- Keep copy short, concrete and illustrative; invent plausible sample content, never real people or brands.
- Use style "title" for headings, "metric" for one large number or price, "body" for sentences, "label" for small captions.
- Use layout "single" for one card, "row" or "stack" for several.
- "teaching" is one short sentence about what the learner should notice when the code becomes the component.
Stay on UI components; if the request is unrelated, make the closest simple component.`;

function reply(status: number, error: string) {
  return Response.json({ error }, { status });
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const prompt = typeof body === "object" && body !== null && "prompt" in body && typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return reply(400, "Describe what you want to see.");
  if (prompt.length > limits.prompt) return reply(400, `Keep the request under ${limits.prompt} characters.`);
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return reply(503, "Generation is not configured. Set ANTHROPIC_API_KEY on the server to enable it.");
  }

  try {
    const client = new Anthropic();
    const message = await client.messages.create({
      model: process.env.LAB_MODEL ?? "claude-opus-5-5",
      max_tokens: 4000,
      output_config: { effort: "low", format: { type: "json_schema", schema: specSchema } },
      system,
      messages: [{ role: "user", content: prompt }],
    });
    if (message.stop_reason === "refusal") return reply(422, "That request couldn't be turned into an example. Try rephrasing it.");
    const text = message.content.find(block => block.type === "text");
    if (!text || text.type !== "text") return reply(502, "The model returned no example. Try again.");
    // Validate server-side too; the client re-validates what it receives.
    return Response.json({ spec: parseSpec(JSON.parse(text.text)) });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return reply(429, "Too many requests. Try again in a moment.");
    if (error instanceof Anthropic.AuthenticationError) return reply(503, "Generation credentials were rejected by the API.");
    if (error instanceof SyntaxError || (error instanceof Error && !(error instanceof Anthropic.APIError))) {
      return reply(502, "The model returned an unusable example. Try again.");
    }
    return reply(502, "Generation failed. Try again.");
  }
}
