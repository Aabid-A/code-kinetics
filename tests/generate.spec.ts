import { expect, test, type Page } from "@playwright/test";
import { buildTemplate, parseSpec } from "../src/lib/lab/generated";
import { sourceFor, validateTemplate } from "../src/lib/lab/templates";
import { initialState, transition } from "../src/lib/lab/types";

const pricing = {
  name: "Pricing", teaching: "The plan name becomes the card; each line lands in its slot.", layout: "row",
  cards: [
    { tag: "Plan", icon: "Rocket", texts: [{ element: "Title", style: "title", text: "Starter" }, { element: "Price", style: "metric", text: "$9" }] },
    { tag: "Plan", texts: [{ element: "Title", style: "title", text: "Team" }, { element: "Caption", style: "label", text: "Per seat, billed monthly" }] },
  ],
};

test("a spec becomes valid code lines and a unique part mapping", () => {
  const template = buildTemplate(parseSpec(pricing));
  expect(() => validateTemplate(template)).not.toThrow();
  expect(template.parts.map(part => part.key)).toEqual(["c0.surface", "c0.icon", "c0.t0", "c0.t1", "c1.surface", "c1.t0", "c1.t1"]);
  expect(sourceFor(template)).toBe([
    "<Pricing>", "  <Plan icon={<Rocket />}>", "    <Title>Starter</Title>", "    <Price>$9</Price>", "  </Plan>",
    "  <Plan>", "    <Title>Team</Title>", "    <Caption>Per seat, billed monthly</Caption>", "  </Plan>", "</Pricing>",
  ].join("\n"));
});

test("untrusted specs are sanitized or rejected", () => {
  const spec = parseSpec({ ...pricing, name: "bad name!<script>", layout: "single", cards: [{ tag: "x-y", icon: "NotAnIcon",
    texts: [{ element: "t", style: "weird", text: "  <b>Hello</b>  {world}  " }] }] });
  expect(spec.name).toBe("Badnamescript");
  expect(spec.layout).toBe("single");
  expect(spec.cards[0]).toEqual({ tag: "Xy", texts: [{ element: "T", style: "body", text: "bHello/b world" }] });
  expect(() => parseSpec(null)).toThrow();
  expect(() => parseSpec({ ...pricing, cards: [] })).toThrow();
  expect(() => parseSpec({ ...pricing, cards: Array(4).fill(pricing.cards[0]) })).toThrow();
  expect(() => parseSpec({ ...pricing, cards: [{ tag: "A", texts: [] }] })).toThrow();
  expect(parseSpec({ ...pricing, cards: [pricing.cards[0]], layout: "row" }).layout).toBe("single");
});

test("loading a generated example always restarts in code mode", () => {
  const rendered = { ...initialState, activeTemplate: "custom" as const, viewMode: "rendered" as const };
  expect(transition(rendered, { type: "LOAD_GENERATED" })).toEqual({ ...rendered, viewMode: "code" });
  expect(transition(initialState, { type: "LOAD_GENERATED" }).activeTemplate).toBe("custom");
});

test("the route rejects an empty prompt", async ({ request }) => {
  const response = await request.post("/api/generate", { data: { prompt: "  " } });
  expect(response.status()).toBe(400);
});

test("typing a request generates an example that morphs like the built-in ones", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.route("**/api/generate", route => route.fulfill({ json: { spec: pricing } }));
  await page.goto("/");
  await page.getByRole("textbox", { name: "Describe a component" }).fill("a pricing card");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.locator("main")).toHaveAttribute("data-template", "custom");
  await expect(page.locator("main")).toHaveAttribute("data-view-mode", "code");
  await expect(page.locator("pre code")).toContainText("<Plan icon={<Rocket />}>");
  await expect(page.locator(".shared-part")).toHaveCount(7);
  await expect(page.locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
  await page.evaluate(async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
  await page.locator(".morph-button").filter({ hasText: /Morph to/ }).click();
  await expect(page.locator("main")).toHaveAttribute("data-view-mode", "rendered");
  await expect(page.locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
  for (const key of ["c0.surface", "c0.icon", "c0.t1", "c1.t1"]) {
    const owner = page.locator(`[data-shared-id="custom:${key}"]`);
    await expect(owner).toHaveCount(1);
    await expect(owner).toHaveAttribute("data-endpoint", "rendered");
  }
  await expect(page.getByRole("button", { name: /^Example:/ })).toHaveText("Example: Pricing (generated)");
  expect(errors).toEqual([]);
});

test("a failed generation shows its message and keeps the current example", async ({ page }) => {
  await page.route("**/api/generate", route => route.fulfill({ status: 503, json: { error: "Generation is not configured." } }));
  await page.goto("/");
  await page.getByRole("textbox", { name: "Describe a component" }).fill("anything");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.locator(".prompt-status")).toHaveText("Generation is not configured.");
  await expect(page.locator("main")).toHaveAttribute("data-template", "button");
});

const trigger = (page: Page) => page.getByRole("button", { name: /^Example:/ });
const listbox = (page: Page) => page.getByRole("listbox", { name: "Example" });
async function settledIn(page: Page, template: string, mode: "code" | "rendered") {
  await expect(page.locator("main")).toHaveAttribute("data-template", template);
  await expect(page.locator("main")).toHaveAttribute("data-view-mode", mode);
  await expect(page.locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
}
async function generatePricing(page: Page) {
  await page.route("**/api/generate", route => route.fulfill({ json: { spec: pricing } }));
  await page.goto("/");
  await expect(page.locator(".morph-button")).toBeEnabled();
  await page.getByRole("textbox", { name: "Describe a component" }).fill("a pricing card");
  await page.getByRole("button", { name: "Generate" }).click();
  await settledIn(page, "custom", "code");
}

test("the generated example is an Example listbox option only after a successful generation", async ({ page }) => {
  await page.route("**/api/generate", route => route.fulfill({ json: { spec: pricing } }));
  await page.goto("/");
  await expect(page.locator(".morph-button")).toBeEnabled();
  // Before any generation: exactly the three fixed examples, Button first and selected.
  await trigger(page).click();
  await expect(listbox(page).getByRole("option")).toHaveText(["Button", "Toast", "Bento"]);
  await expect(listbox(page).getByRole("option", { name: "Button" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");

  await page.getByRole("textbox", { name: "Describe a component" }).fill("a pricing card");
  await page.getByRole("button", { name: "Generate" }).click();
  await settledIn(page, "custom", "code");
  await expect(trigger(page)).toHaveText("Example: Pricing (generated)");
  await trigger(page).click();
  await expect(listbox(page).getByRole("option")).toHaveText(["Button", "Toast", "Bento", "Pricing (generated)"]);
  const generated = listbox(page).getByRole("option", { name: "Pricing (generated)" });
  await expect(generated).toHaveAttribute("aria-selected", "true");
  // Same contract as the fixed options: no Tab stop of its own, and the popup points at it with aria-activedescendant.
  await expect(generated).not.toHaveAttribute("tabindex", /.*/);
  await expect(listbox(page)).toHaveAttribute("aria-activedescendant", (await generated.getAttribute("id"))!);
  // Pointer: leave for a fixed example, then come back to the generated one.
  await listbox(page).getByRole("option", { name: "Toast" }).click();
  await settledIn(page, "toast", "code");
  await trigger(page).click();
  await listbox(page).getByRole("option", { name: "Pricing (generated)" }).click();
  await settledIn(page, "custom", "code");
  await expect(page.locator(".shared-part")).toHaveCount(7);
});

test("keyboard only: generate, then reach the generated option with arrows, Escape and typeahead, and morph", async ({ page }) => {
  await generatePricing(page);
  await trigger(page).focus();
  await page.keyboard.press("Enter");
  await expect(listbox(page)).toBeFocused();
  const activeText = async () => page.locator(`[id="${await listbox(page).getAttribute("aria-activedescendant")}"]`).textContent();
  expect(await activeText()).toBe("Pricing (generated)");
  await page.keyboard.press("Home");
  expect(await activeText()).toBe("Button");
  await page.keyboard.press("End");
  expect(await activeText()).toBe("Pricing (generated)");
  await page.keyboard.press("ArrowUp");
  expect(await activeText()).toBe("Bento");
  await page.keyboard.press("Enter");
  await settledIn(page, "bento", "code");
  await expect(trigger(page)).toBeFocused();

  // Escape cancels without changing the template.
  await page.keyboard.press("ArrowDown");
  await expect(listbox(page)).toBeFocused();
  await page.keyboard.press("End");
  await page.keyboard.press("Escape");
  await expect(trigger(page)).toBeFocused();
  await settledIn(page, "bento", "code");

  // Typeahead finds the generated option by its label; Space commits.
  await page.keyboard.press("Enter");
  await page.keyboard.press("p");
  expect(await activeText()).toBe("Pricing (generated)");
  await page.keyboard.press(" ");
  await settledIn(page, "custom", "code");
  await expect(trigger(page)).toBeFocused();

  await page.getByRole("button", { name: "Morph to component" }).focus();
  await page.keyboard.press("Enter");
  await settledIn(page, "custom", "rendered");
  await page.keyboard.press("Enter");
  await settledIn(page, "custom", "code");
});

test("not configured: the real route answers 503, the message is inline and announced, and the lab keeps working", async ({ page, request }) => {
  // The test server runs without a provider key, so this exercises the real server path (no mock).
  const direct = await request.post("/api/generate", { data: { prompt: "a pricing card" } });
  expect(direct.status()).toBe(503);
  expect((await direct.json()).error).toMatch(/not configured/i);

  await page.goto("/");
  await expect(page.locator(".morph-button")).toBeEnabled();
  const input = page.getByRole("textbox", { name: "Describe a component" });
  await input.fill("a pricing card");
  await page.getByRole("button", { name: "Generate" }).click();
  const status = page.locator(".prompt-status");
  await expect(status).toHaveText(/not configured/i);
  await expect(status).toHaveAttribute("aria-live", "polite");
  await expect(status).toHaveAttribute("data-failed", "true");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  expect((await input.getAttribute("aria-describedby"))!.split(" ")).toContain(await status.getAttribute("id"));
  // Nothing about the lab changed: Button stays, no generated option, and the fixed examples morph normally.
  await settledIn(page, "button", "code");
  await trigger(page).click();
  await expect(listbox(page).getByRole("option")).toHaveText(["Button", "Toast", "Bento"]);
  await listbox(page).getByRole("option", { name: "Bento" }).click();
  await settledIn(page, "bento", "code");
  await page.locator(".morph-button").click();
  await settledIn(page, "bento", "rendered");
});
