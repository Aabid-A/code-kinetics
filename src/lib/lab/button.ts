export type ButtonPart = "surface" | "icon" | "label";
type Token = {
  id: string;
  text: string;
  syntax: "punctuation" | "tag" | "attribute" | "text";
  part?: ButtonPart;
};
type Line = { id: string; tokens: readonly Token[] };

export const buttonContent = {
  tag: "Button",
  label: "Explore",
  icon: "ArrowUpRight",
  description: "Example button labelled Explore, with an up-right arrow.",
} as const;

export const buttonLines: readonly Line[] = [
  { id: "opening", tokens: [
    { id: "open-angle", text: "<", syntax: "punctuation" },
    { id: "surface-name", text: buttonContent.tag, syntax: "tag", part: "surface" },
  ] },
  { id: "icon-prop", tokens: [
    { id: "icon-indent", text: "  ", syntax: "text" },
    { id: "icon-attribute", text: "icon", syntax: "attribute" },
    { id: "icon-open", text: "={<", syntax: "punctuation" },
    { id: "icon-name", text: buttonContent.icon, syntax: "tag", part: "icon" },
    { id: "icon-close", text: " />}", syntax: "punctuation" },
  ] },
  { id: "opening-end", tokens: [
    { id: "end-angle", text: ">", syntax: "punctuation" },
  ] },
  { id: "label", tokens: [
    { id: "label-indent", text: "  ", syntax: "text" },
    { id: "label-content", text: buttonContent.label, syntax: "text", part: "label" },
  ] },
  { id: "closing", tokens: [
    { id: "closing-tag", text: "</", syntax: "punctuation" },
    { id: "closing-name", text: "Button", syntax: "tag" },
    { id: "closing-angle", text: ">", syntax: "punctuation" },
  ] },
];

export const buttonSource = buttonLines.map(line => line.tokens.map(token => token.text).join("")).join("\n");

export const buttonParts: readonly ButtonPart[] = ["surface", "icon", "label"];

// Both endpoint trees use this contract. Reference text never receives an ID.
export function sharedId(part: ButtonPart) { return `button:${part}`; }

export const morphSpring = {
  type: "spring", stiffness: 200, damping: 20, mass: 0.8,
} as const;
