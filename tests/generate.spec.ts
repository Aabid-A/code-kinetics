import { expect, test } from "@playwright/test";
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
  await page.getByRole("textbox", { name: /what do you want/i }).fill("a pricing card");
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
  await expect(page.getByRole("combobox", { name: "Example" })).toContainText("Pricing (generated)");
  expect(errors).toEqual([]);
});

test("a failed generation shows its message and keeps the current example", async ({ page }) => {
  await page.route("**/api/generate", route => route.fulfill({ status: 503, json: { error: "Generation is not configured." } }));
  await page.goto("/");
  await page.getByRole("textbox", { name: /what do you want/i }).fill("anything");
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByRole("status").filter({ hasText: "not configured" })).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("data-template", "button");
});
