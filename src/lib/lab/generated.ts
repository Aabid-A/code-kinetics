import type { CodeLine, CodeToken, PartDefinition, TemplateDefinition } from "./templates";

// The model never writes code or markup. It fills in this small declarative
// spec, which is validated here and then turned into the same line/token/part
// structures the hand-authored examples use. Nothing is compiled or executed.

export const ICON_NAMES = [
  "Sparkles", "Zap", "Bell", "CircleCheck", "Layers", "Star", "Heart", "Rocket", "Shield", "Lock",
  "Mail", "Calendar", "Clock", "Download", "Settings", "User", "Cloud", "Search", "Code", "Gift",
] as const;
export type IconName = (typeof ICON_NAMES)[number];
export const TEXT_STYLES = ["title", "body", "metric", "label"] as const;
export type TextStyle = (typeof TEXT_STYLES)[number];
export const LAYOUTS = ["single", "row", "stack"] as const;
export type Layout = (typeof LAYOUTS)[number];

export type GeneratedText = { element: string; style: TextStyle; text: string };
export type GeneratedCard = { tag: string; icon?: IconName; texts: GeneratedText[] };
export type GeneratedSpec = { name: string; teaching: string; layout: Layout; cards: GeneratedCard[] };

export const limits = { cards: 3, texts: 3, prompt: 200, text: 60, teaching: 120 } as const;

// JSON Schema handed to the model as its output format.
export const specSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "teaching", "layout", "cards"],
  properties: {
    name: { type: "string", description: "PascalCase component name, e.g. PricingCard" },
    teaching: { type: "string", description: "One short sentence on what the learner should notice about how the code maps to the component" },
    layout: { type: "string", enum: [...LAYOUTS], description: "single for one card; row or stack for several" },
    cards: {
      type: "array",
      minItems: 1,
      maxItems: limits.cards,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["tag", "texts"],
        properties: {
          tag: { type: "string", description: "PascalCase element name for the card surface, e.g. Plan" },
          icon: { type: "string", enum: [...ICON_NAMES] },
          texts: {
            type: "array",
            minItems: 1,
            maxItems: limits.texts,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["element", "style", "text"],
              properties: {
                element: { type: "string", description: "PascalCase element name, e.g. Title, Price, Caption" },
                style: { type: "string", enum: [...TEXT_STYLES] },
                text: { type: "string", description: "Short visible copy" },
              },
            },
          },
        },
      },
    },
  },
} as const;

function fail(message: string): never { throw new Error(message); }
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function identifier(value: unknown, fallback?: string): string {
  const cleaned = typeof value === "string" ? value.replace(/[^A-Za-z0-9]/g, "") : "";
  const result = cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1, 24) : fallback;
  if (!result || !/^[A-Z][A-Za-z0-9]*$/.test(result)) fail("Invalid element name");
  return result;
}

function copy(value: unknown, max: number): string {
  // Angle brackets and braces would break the illusion of readable JSX.
  const cleaned = typeof value === "string" ? value.replace(/[<>{}`]/g, "").replace(/\s+/g, " ").trim() : "";
  if (!cleaned) fail("Empty text");
  return cleaned.length > max ? `${cleaned.slice(0, max - 1).trimEnd()}…` : cleaned;
}

// Validates untrusted input (model output, or a response crossing the network).
export function parseSpec(input: unknown): GeneratedSpec {
  if (!isRecord(input) || !Array.isArray(input.cards)) fail("Spec has no cards");
  if (input.cards.length < 1 || input.cards.length > limits.cards) fail("Spec needs 1–3 cards");
  const cards = input.cards.map((raw, index): GeneratedCard => {
    if (!isRecord(raw) || !Array.isArray(raw.texts)) fail(`Card ${index + 1} has no texts`);
    if (raw.texts.length < 1 || raw.texts.length > limits.texts) fail(`Card ${index + 1} needs 1–3 texts`);
    const icon = ICON_NAMES.find(name => name === raw.icon);
    return {
      tag: identifier(raw.tag, "Card"),
      ...(icon ? { icon } : {}),
      texts: raw.texts.map((entry): GeneratedText => {
        if (!isRecord(entry)) fail("Invalid text");
        const style = TEXT_STYLES.find(name => name === entry.style) ?? "body";
        return { element: identifier(entry.element, "Text"), style, text: copy(entry.text, limits.text) };
      }),
    };
  });
  const requested = LAYOUTS.find(name => name === input.layout);
  const layout: Layout = cards.length === 1 ? "single" : requested && requested !== "single" ? requested : "row";
  return {
    name: identifier(input.name, "Component"),
    teaching: copy(input.teaching ?? "Each piece of code finds its place in the component.", limits.teaching),
    layout,
    cards,
  };
}

export type CustomKind = "surface" | "icon" | "text";
export function customKey(card: number, kind: "surface" | "icon" | number) {
  return (typeof kind === "number" ? `c${card}.t${kind}` : `c${card}.${kind}`) as `c${number}.${string}`;
}

const token = (id: string, text: string, syntax: CodeToken["syntax"] = "punctuation", part?: CodeToken["part"]): CodeToken => ({ id, text, syntax, part });

export function buildTemplate(spec: GeneratedSpec): TemplateDefinition {
  const lines: CodeLine[] = [];
  const parts: PartDefinition[] = [];
  const nested = spec.cards.length > 1;
  const pad = nested ? "  " : "";
  if (nested) lines.push({ id: "root-open", tokens: [token("root-open-tag", `<${spec.name}>`, "tag")] });
  spec.cards.forEach((card, c) => {
    const surface = customKey(c, "surface");
    const openers: CodeToken[] = [token(`c${c}-open-angle`, `${pad}<`), token(`c${c}-surface`, card.tag, "tag", surface)];
    parts.push({ key: surface, kind: "surface", sourceLabel: card.tag, destinationLabel: `${card.tag} card surface` });
    if (card.icon) {
      const icon = customKey(c, "icon");
      openers.push(token(`c${c}-icon-space`, " "), token(`c${c}-icon-prop`, "icon", "attribute"), token(`c${c}-icon-open`, "={<"),
        token(`c${c}-icon`, card.icon, "tag", icon), token(`c${c}-icon-end`, " />}>"));
      parts.push({ key: icon, kind: "icon", sourceLabel: card.icon, destinationLabel: `${card.icon} icon` });
    } else openers.push(token(`c${c}-open-end`, ">"));
    lines.push({ id: `c${c}-open`, tokens: openers });
    card.texts.forEach((entry, t) => {
      const key = customKey(c, t);
      lines.push({ id: `c${c}-t${t}`, tokens: [
        token(`c${c}-t${t}-open`, `${pad}  <${entry.element}>`, "tag"),
        token(`c${c}-t${t}-text`, entry.text, "text", key),
        token(`c${c}-t${t}-close`, `</${entry.element}>`, "tag"),
      ] });
      parts.push({ key, kind: "text", sourceLabel: entry.text, destinationLabel: `${entry.element} text` });
    });
    lines.push({ id: `c${c}-close`, tokens: [token(`c${c}-close-tag`, `${pad}</${card.tag}>`, "tag")] });
  });
  if (nested) lines.push({ id: "root-close", tokens: [token("root-close-tag", `</${spec.name}>`, "tag")] });
  const copyText = spec.cards.map(card => card.texts.map(entry => entry.text).join(". ")).join(" | ");
  return {
    id: "custom", label: spec.name, filename: `${spec.name}.tsx`, lines, parts,
    description: `Illustrative generated component, ${spec.name}: ${copyText}`,
    caption: "Generated example · not interactive",
    teaching: spec.teaching,
    generated: spec,
  };
}
