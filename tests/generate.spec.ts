import { expect, test, type Page } from "@playwright/test";
import { bringIntoView, lab } from "./lab";
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

const field = (page: Page) => page.getByRole("textbox", { name: "Describe a component" });
const generate = (page: Page) => page.getByRole("button", { name: "Generate", exact: true });
async function settledIn(page: Page, template: "button" | "toast" | "bento" | "custom", mode: "code" | "rendered") {
  await expect(lab(page, template)).toHaveAttribute("data-template", template);
  await expect(lab(page, template)).toHaveAttribute("data-view-mode", mode);
  await expect(lab(page, template).locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
}
async function generatePricing(page: Page) {
  await page.route("**/api/generate", route => route.fulfill({ json: { spec: pricing } }));
  await page.goto("/");
  await expect(lab(page).locator(".morph-button")).toBeEnabled();
  await field(page).fill("a pricing card");
  await generate(page).click();
  await settledIn(page, "custom", "code");
}

test("typing a request generates an example that morphs like the built-in ones", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await generatePricing(page);
  const custom = lab(page, "custom");
  await expect(custom).toHaveAttribute("data-view-mode", "code");
  await expect(custom.locator("pre code")).toContainText("<Plan icon={<Rocket />}>");
  await expect(custom.locator(".shared-part")).toHaveCount(7);
  await bringIntoView(page, "custom");
  await page.evaluate(async () => { await new Promise(requestAnimationFrame); await new Promise(requestAnimationFrame); });
  await custom.locator(".morph-button").filter({ hasText: /Morph to/ }).click();
  await expect(custom).toHaveAttribute("data-view-mode", "rendered");
  await expect(custom.locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
  for (const key of ["c0.surface", "c0.icon", "c0.t1", "c1.t1"]) {
    const owner = custom.locator(`[data-shared-id="custom:${key}"]`);
    await expect(owner).toHaveCount(1);
    await expect(owner).toHaveAttribute("data-endpoint", "rendered");
  }
  expect(errors).toEqual([]);
});

test("a failed generation shows its message and adds no generated lab", async ({ page }) => {
  await page.route("**/api/generate", route => route.fulfill({ status: 503, json: { error: "Generation is not configured." } }));
  await page.goto("/");
  await field(page).fill("anything");
  await generate(page).click();
  await expect(page.locator(".prompt-status")).toHaveText("Generation is not configured.");
  await expect(lab(page, "custom")).toHaveCount(0);
  await expect(page.locator("[data-lab]")).toHaveCount(3);
});

test("the generated lab appears only after a successful generation, and a second one replaces it in code mode", async ({ page }) => {
  await page.route("**/api/generate", route => route.fulfill({ json: { spec: pricing } }));
  await page.goto("/");
  await expect(lab(page).locator(".morph-button")).toBeEnabled();
  // Before any generation: the three fixed chapters only.
  await expect(page.locator("[data-lab]")).toHaveCount(3);
  await field(page).fill("a pricing card");
  await generate(page).click();
  await settledIn(page, "custom", "code");
  await expect(page.locator("[data-lab]")).toHaveCount(4);
  await expect(lab(page, "custom").locator(".shared-part")).toHaveCount(7);
  // The other labs are untouched.
  await settledIn(page, "button", "code");
  // Morph it, then generate again: the replacement restarts in code mode and there is still one generated lab.
  await bringIntoView(page, "custom");
  await lab(page, "custom").locator(".morph-button").click();
  await settledIn(page, "custom", "rendered");
  await field(page).fill("another card");
  await generate(page).click();
  await settledIn(page, "custom", "code");
  await expect(page.locator("[data-lab]")).toHaveCount(4);
});

test("keyboard only: generate, then morph the generated lab", async ({ page }) => {
  await generatePricing(page);
  await bringIntoView(page, "custom");
  const morph = lab(page, "custom").getByRole("button", { name: "Morph to component" });
  await morph.focus();
  await page.keyboard.press("Enter");
  await settledIn(page, "custom", "rendered");
  await page.keyboard.press("Enter");
  await settledIn(page, "custom", "code");
});

test("not configured: the real route answers 503, the message is inline and announced, and the labs keep working", async ({ page, request }) => {
  // The test server runs without a provider key, so this exercises the real server path (no mock).
  const direct = await request.post("/api/generate", { data: { prompt: "a pricing card" } });
  expect(direct.status()).toBe(503);
  expect((await direct.json()).error).toMatch(/not configured/i);

  await page.goto("/");
  await expect(lab(page).locator(".morph-button")).toBeEnabled();
  const input = field(page);
  await input.fill("a pricing card");
  await generate(page).click();
  const status = page.locator(".prompt-status");
  await expect(status).toHaveText(/not configured/i);
  await expect(status).toHaveAttribute("aria-live", "polite");
  await expect(status).toHaveAttribute("data-failed", "true");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  expect((await input.getAttribute("aria-describedby"))!.split(" ")).toContain(await status.getAttribute("id"));
  // Nothing else changed: no generated lab, and a fixed chapter morphs normally.
  await settledIn(page, "button", "code");
  await expect(lab(page, "custom")).toHaveCount(0);
  await bringIntoView(page, "bento");
  await lab(page, "bento").locator(".morph-button").click();
  await settledIn(page, "bento", "rendered");
});

test("the prompt states that descriptions are sent to Google Gemini", async ({ page }) => {
  await page.goto("/");
  const notice = page.locator(".prompt-privacy");
  await expect(notice).toHaveText("Your description is sent to Google Gemini to create the example. Don’t include personal information.");
  const describedBy = (await field(page).getAttribute("aria-describedby")) ?? "";
  expect(describedBy.split(" ")).toContain(await notice.getAttribute("id"));
});
