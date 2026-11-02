import { buttonContent, buttonLines, type ButtonPart } from "./button";
import type { TemplateId } from "./types";

export type ToastPart = "surface" | "icon" | "title" | "description";
export type BentoPart = "feature.surface" | "feature.icon" | "feature.title" | "feature.description"
  | "metric.surface" | "metric.value" | "metric.label" | "status.surface" | "status.title" | "status.description";
export type PartKey = ButtonPart | ToastPart | BentoPart;
export type PartKind = "surface" | "icon" | "text";
export type CodeToken = { id: string; text: string; syntax: "punctuation" | "tag" | "attribute" | "text"; part?: PartKey };
export type CodeLine = { id: string; tokens: readonly CodeToken[] };
export type PartDefinition = { key: PartKey; kind: PartKind; sourceLabel: string; destinationLabel: string };
export type TemplateDefinition = {
  id: TemplateId; label: string; filename: string; lines: readonly CodeLine[];
  parts: readonly PartDefinition[]; description: string; caption: string; teaching: string;
};

export const toastContent = {
  tag: "Toast", icon: "CircleCheck", title: "Changes saved", description: "Your workspace is up to date.",
} as const;
export const bentoContent = {
  feature: { tag: "Feature", icon: "Layers", title: "Build in layers", description: "Small pieces. One interface." },
  metric: { tag: "Metric", value: "12", label: "Components" },
  status: { tag: "Status", title: "Ready to ship", description: "All pieces in place." },
} as const;

const token = (id: string, text: string, syntax: CodeToken["syntax"] = "punctuation", part?: PartKey): CodeToken => ({ id, text, syntax, part });
const line = (id: string, ...tokens: CodeToken[]): CodeLine => ({ id, tokens });

const toastLines = [
  line("toast-open", token("toast-open-angle", "<"), token("toast-surface", toastContent.tag, "tag", "surface"), token("toast-open-end", ">")),
  line("toast-icon-line", token("toast-icon-open", "  <"), token("toast-icon", toastContent.icon, "tag", "icon"), token("toast-icon-end", " />")),
  line("toast-title-line", token("toast-title-open", "  <Title>", "tag"), token("toast-title", toastContent.title, "text", "title"), token("toast-title-close", "</Title>", "tag")),
  line("toast-description-open", token("toast-description-tag", "  <Description>", "tag")),
  line("toast-description-line", token("toast-description-indent", "    ", "text"), token("toast-description", toastContent.description, "text", "description")),
  line("toast-description-close", token("toast-description-end", "  </Description>", "tag")),
  line("toast-close", token("toast-close-tag", "</Toast>", "tag")),
] as const;

const bentoLines = [
  line("bento-open", token("bento-open-tag", "<Bento>", "tag")),
  line("feature-open", token("feature-open-angle", "  <"), token("feature-surface", bentoContent.feature.tag, "tag", "feature.surface"), token("feature-prop-space", " "), token("feature-icon-prop", "icon", "attribute"), token("feature-icon-open", "={<"), token("feature-icon", bentoContent.feature.icon, "tag", "feature.icon"), token("feature-open-end", " />}>")),
  line("feature-title-line", token("feature-title-open", "    <Title>", "tag"), token("feature-title", bentoContent.feature.title, "text", "feature.title"), token("feature-title-close", "</Title>", "tag")),
  line("feature-description-line", token("feature-description-open", "    <Text>", "tag"), token("feature-description", bentoContent.feature.description, "text", "feature.description"), token("feature-description-close", "</Text>", "tag")),
  line("feature-close", token("feature-close-tag", "  </Feature>", "tag")),
  line("metric-open", token("metric-open-angle", "  <"), token("metric-surface", bentoContent.metric.tag, "tag", "metric.surface"), token("metric-open-end", ">")),
  line("metric-value-line", token("metric-value-open", "    <Value>", "tag"), token("metric-value", bentoContent.metric.value, "text", "metric.value"), token("metric-value-close", "</Value>", "tag")),
  line("metric-label-line", token("metric-label-open", "    <Label>", "tag"), token("metric-label", bentoContent.metric.label, "text", "metric.label"), token("metric-label-close", "</Label>", "tag")),
  line("metric-close", token("metric-close-tag", "  </Metric>", "tag")),
  line("status-open", token("status-open-angle", "  <"), token("status-surface", bentoContent.status.tag, "tag", "status.surface"), token("status-open-end", ">")),
  line("status-title-line", token("status-title-open", "    <Title>", "tag"), token("status-title", bentoContent.status.title, "text", "status.title"), token("status-title-close", "</Title>", "tag")),
  line("status-description-line", token("status-description-open", "    <Text>", "tag"), token("status-description", bentoContent.status.description, "text", "status.description"), token("status-description-close", "</Text>", "tag")),
  line("status-close", token("status-close-tag", "  </Status>", "tag")),
  line("bento-close", token("bento-close-tag", "</Bento>", "tag")),
] as const;

export const templates: Record<TemplateId, TemplateDefinition> = {
  button: {
    id: "button", label: "Button", filename: "Button.tsx", lines: buttonLines,
    parts: [
      { key: "surface", kind: "surface", sourceLabel: buttonContent.tag, destinationLabel: "blue button surface" },
      { key: "icon", kind: "icon", sourceLabel: buttonContent.icon, destinationLabel: "arrow icon" },
      { key: "label", kind: "text", sourceLabel: buttonContent.label, destinationLabel: "button label" },
    ],
    description: buttonContent.description, caption: "Example component · not interactive",
    teaching: "The name becomes the surface; the label and icon find their places.",
  },
  toast: {
    id: "toast", label: "Toast", filename: "Toast.tsx", lines: toastLines,
    parts: [
      { key: "surface", kind: "surface", sourceLabel: toastContent.tag, destinationLabel: "notification surface" },
      { key: "icon", kind: "icon", sourceLabel: toastContent.icon, destinationLabel: "check icon" },
      { key: "title", kind: "text", sourceLabel: toastContent.title, destinationLabel: "notification title" },
      { key: "description", kind: "text", sourceLabel: toastContent.description, destinationLabel: "supporting text" },
    ],
    description: "Illustrative notification: Changes saved. Your workspace is up to date.",
    caption: "Example component · not interactive",
    teaching: "A surface, icon, and two lines of text keep their matching identities.",
  },
  bento: {
    id: "bento", label: "Bento", filename: "Bento.tsx", lines: bentoLines,
    parts: [
      { key: "feature.surface", kind: "surface", sourceLabel: bentoContent.feature.tag, destinationLabel: "feature card surface" },
      { key: "feature.icon", kind: "icon", sourceLabel: bentoContent.feature.icon, destinationLabel: "layers icon" },
      { key: "feature.title", kind: "text", sourceLabel: bentoContent.feature.title, destinationLabel: "feature title" },
      { key: "feature.description", kind: "text", sourceLabel: bentoContent.feature.description, destinationLabel: "feature supporting text" },
      { key: "metric.surface", kind: "surface", sourceLabel: bentoContent.metric.tag, destinationLabel: "metric card surface" },
      { key: "metric.value", kind: "text", sourceLabel: bentoContent.metric.value, destinationLabel: "large metric value" },
      { key: "metric.label", kind: "text", sourceLabel: bentoContent.metric.label, destinationLabel: "metric label" },
      { key: "status.surface", kind: "surface", sourceLabel: bentoContent.status.tag, destinationLabel: "status card surface" },
      { key: "status.title", kind: "text", sourceLabel: bentoContent.status.title, destinationLabel: "status title" },
      { key: "status.description", kind: "text", sourceLabel: bentoContent.status.description, destinationLabel: "status supporting text" },
    ],
    description: "Illustrative cards. Feature: Build in layers. Small pieces. One interface. Metric: 12 Components, fictional sample content. Status: Ready to ship. All pieces in place.",
    caption: "Example component · fictional content · not interactive",
    teaching: "Several small pieces can move together without losing their relationships.",
  },
};

export function sourceFor(template: TemplateDefinition) {
  return template.lines.map(entry => entry.tokens.map(item => item.text).join("")).join("\n");
}

export function partFor(templateId: TemplateId, key: PartKey): PartDefinition {
  const part = templates[templateId].parts.find(entry => entry.key === key);
  if (!part) throw new Error(`Missing mapped part ${templateId}:${key}`);
  return part;
}

export function validateTemplate(template: TemplateDefinition) {
  const tokens = template.lines.flatMap(entry => entry.tokens);
  const keys = template.parts.map(part => part.key);
  if (new Set(tokens.map(item => item.id)).size !== tokens.length || new Set(keys).size !== keys.length
    || new Set(template.lines.map(entry => entry.id)).size !== template.lines.length
    || template.parts.some(part => tokens.filter(item => item.part === part.key && item.text === part.sourceLabel).length !== 1)
    || tokens.some(item => item.part && !keys.includes(item.part))) {
    throw new Error(`Invalid authored mapping for ${template.id}`);
  }
}

Object.values(templates).forEach(validateTemplate);
