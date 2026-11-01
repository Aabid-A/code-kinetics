import { expect, test, type Page } from "@playwright/test";
import { buttonLines, buttonParts, buttonSource, morphSpring, sharedId } from "../src/lib/lab/button";
import { initialState, transition } from "../src/lib/lab/types";

const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error" || /hydration/i.test(message.text())) errors.push(message.text());
  });
});
test.afterEach(async ({ page }) => { expect(browserErrors.get(page)).toEqual([]); });

async function settled(page: Page, mode: "code" | "rendered") {
  await expect(page.locator("main")).toHaveAttribute("data-view-mode", mode);
  await expect(page.locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
  await expect(page.locator(".preview-instruction")).toHaveCSS("opacity", mode === "code" ? "1" : "0");
  await expect(page.locator(".surface-lettering")).toHaveCSS("opacity", mode === "code" ? "1" : "0");
  for (const part of buttonParts) {
    await expect(page.locator(`[data-part="${part}"]`)).toHaveCount(1);
    await expect(page.locator(`[data-part="${part}"]`)).toHaveAttribute("data-endpoint", mode);
  }
}

async function box(page: Page, selector: string) {
  const value = await page.locator(selector).boundingBox();
  if (!value) throw new Error(`Missing box for ${selector}`);
  return value;
}

test("state, exact authored source and mapping contract", () => {
  expect(initialState).toEqual({ activeTemplate: "button", viewMode: "code" });
  expect(transition(transition(initialState, { type: "MORPH" }), { type: "MORPH" })).toEqual(initialState);
  expect(transition(initialState, { type: "SET_VIEW", mode: "code" })).toBe(initialState);
  expect(buttonSource).toBe("<Button\n  icon={<ArrowUpRight />}\n>\n  Explore\n</Button>");
  expect(buttonParts.map(sharedId)).toEqual(["button:surface", "button:icon", "button:label"]);
  expect(buttonLines.flatMap(line => line.tokens).filter(token => token.part).map(token => token.part).sort())
    .toEqual([...buttonParts].sort());
  expect(new Set(buttonLines.flatMap(line => line.tokens).map(token => token.id)).size).toBe(13);
  expect(morphSpring).toEqual({ type: "spring", stiffness: 200, damping: 20, mass: .8 });
});

test("desktop forward, reverse, in-flight reversal, stable geometry and focus", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" || /hydration/i.test(message.text())) errors.push(message.text()); });
  await page.goto("/");
  const morph = page.getByRole("button", { name: "Morph to component" });
  await expect(morph).toBeEnabled();
  await settled(page, "code");
  await expect(page.getByRole("radio", { name: "Code", exact: true })).toBeChecked();
  await page.screenshot({ path: info.outputPath("desktop-code.png"), fullPage: true });
  const start = await box(page, '[data-part="surface"]');
  const target = await box(page, ".button-template");
  const sourceLines = await box(page, ".code-lines");
  const tagText = await box(page, ".surface-lettering");
  const stage = await box(page, ".lab-stage");
  const divider = stage.x + stage.width / 2;

  // Measure real projected boxes across frames. Application code performs no
  // per-frame measurement; this sampler belongs only to browser verification.
  const sample = () => page.evaluate(async () => {
    const frames: { x: number; y: number; width: number; hit: boolean; labelWidth: number; labelHeight: number; labelHit: boolean; iconHit: boolean; tagWidth: number; tagOpacity: number; wordOpacity: number; artOpacity: number }[] = [];
    const started = performance.now();
    while (performance.now() - started < 1100) {
      await new Promise(requestAnimationFrame);
      const el = document.querySelector<HTMLElement>('[data-part="surface"]')!;
      const b = el.getBoundingClientRect();
      const hits = document.elementsFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      const label = document.querySelector<HTMLElement>('[data-part="label"]')!;
      const icon = document.querySelector<HTMLElement>('[data-part="icon"]')!;
      const l = label.getBoundingClientRect();
      const i = icon.getBoundingClientRect();
      const tag = document.querySelector<HTMLElement>(".surface-lettering")!;
      const word = document.querySelector<HTMLElement>(".shared-part .icon-word")!;
      const art = document.querySelector<HTMLElement>(".shared-part .icon-art")!;
      frames.push({ x: b.x, y: b.y, width: b.width, hit: hits.includes(el), labelWidth: l.width, labelHeight: l.height,
        labelHit: document.elementsFromPoint(l.x + l.width / 2, l.y + l.height / 2).includes(label),
        iconHit: document.elementsFromPoint(i.x + i.width / 2, i.y + i.height / 2).includes(icon),
        tagWidth: tag.getBoundingClientRect().width, tagOpacity: +getComputedStyle(tag).opacity,
        wordOpacity: +getComputedStyle(word).opacity, artOpacity: +getComputedStyle(art).opacity });
    }
    return frames;
  });
  const forwardSampling = sample();
  await morph.click();
  await expect(page.getByRole("button", { name: "Morph to code" })).toBeFocused();
  const forward = await forwardSampling;
  expect(forward.some(frame => frame.x > start.x + 5 && frame.x < target.x - 5)).toBe(true);
  const crossing = forward.filter(frame => frame.x < divider && frame.x + frame.width > divider);
  expect(crossing.length).toBeGreaterThan(0);
  expect(crossing.every(frame => frame.hit)).toBe(true);
  expect(forward.every(frame => frame.labelHit && frame.iconHit)).toBe(true);
  await settled(page, "rendered");
  const final = await box(page, '[data-part="surface"]');
  expect(Math.abs(final.x - target.x)).toBeLessThan(1);
  expect(Math.abs(final.width - target.width)).toBeLessThan(1);
  const label = await box(page, '[data-part="label"]');
  expect(forward.filter(frame => frame.x > start.x + 5).every(frame => Math.abs(frame.labelWidth - label.width) < 1 && Math.abs(frame.labelHeight - label.height) < 1)).toBe(true);
  expect(await box(page, ".code-lines")).toEqual(sourceLines);
  expect(await box(page, ".lab-stage")).toEqual(stage);
  await expect(page.getByRole("img", { name: "Example button labelled Explore, with an up-right arrow." })).toBeVisible();
  await page.screenshot({ path: info.outputPath("desktop-rendered.png"), fullPage: true });

  const reverseSampling = sample();
  await page.getByRole("button", { name: "Morph to code" }).click();
  const reverse = await reverseSampling;
  expect(reverse.some(frame => frame.x > start.x + 5 && frame.x < target.x - 5)).toBe(true);
  expect(reverse.filter(frame => frame.tagOpacity > .05).every(frame => Math.abs(frame.tagWidth - tagText.width) < 1)).toBe(true);
  expect(forward.some(frame => frame.wordOpacity > 0 && frame.wordOpacity < 1 && frame.artOpacity > 0 && frame.artOpacity < 1)).toBe(true);
  expect(forward.at(-1)?.tagOpacity).toBe(0);
  expect(forward.at(-1)?.artOpacity).toBe(1);
  await settled(page, "code");

  await page.getByRole("button", { name: "Morph to component" }).click();
  await page.waitForTimeout(100);
  const beforeReversal = await box(page, '[data-part="surface"]');
  expect(beforeReversal.x).toBeGreaterThan(start.x + 5);
  expect(beforeReversal.x).toBeLessThan(target.x - 5);
  // Read the first projected frame after retargeting in the same browser task.
  const afterReversal = await page.evaluate(async () => {
    document.querySelector<HTMLButtonElement>(".morph-button")!.click();
    await new Promise(requestAnimationFrame);
    const b = document.querySelector('[data-part="surface"]')!.getBoundingClientRect();
    return { x: b.x, width: b.width };
  });
  expect(Math.abs(afterReversal.x - beforeReversal.x)).toBeLessThan(100);
  expect(afterReversal.x).toBeGreaterThan(start.x + 5);
  await settled(page, "code");
  await page.waitForTimeout(2000);
  await settled(page, "code");
  expect(Math.abs((await box(page, '[data-part="surface"]')).x - start.x)).toBeLessThan(1);
  expect(errors).toEqual([]);
  await info.attach("sampled-motion.json", { body: JSON.stringify({ start, target, forward, reverse, beforeReversal, afterReversal, errors }), contentType: "application/json" });
});

test("rapid latest requests and native radio keyboard control", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".morph-button")).toBeEnabled();
  for (const spacing of [100, 30]) {
    for (let i = 0; i < 6; i++) {
      await page.locator(".morph-button").click();
      await page.waitForTimeout(spacing);
    }
    await settled(page, "code");
  }
  await page.getByRole("radio", { name: "Code", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await settled(page, "rendered");
  await expect(page.getByRole("radio", { name: "Component", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await settled(page, "code");
});

test("390px phone reflow, offscreen fallback, both stable endpoints", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".morph-button")).toBeEnabled();
  await settled(page, "code");
  await page.screenshot({ path: info.outputPath("mobile-code.png"), fullPage: true });
  await page.locator(".morph-button").click();
  await settled(page, "rendered");
  await expect(page.getByText("View changed. Scroll to compare the example.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("mobile-rendered.png"), fullPage: true });
  await page.locator(".morph-button").click();
  await settled(page, "code");
  await page.setViewportSize({ width: 320, height: 640 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("stacked vertical travel when both regions fit", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1200 });
  await page.goto("/");
  await expect(page.locator(".morph-button")).toBeEnabled();
  const start = await box(page, '[data-part="surface"]');
  const target = await box(page, ".button-template");
  await page.locator(".morph-button").click();
  await page.waitForTimeout(100);
  const mid = await box(page, '[data-part="surface"]');
  expect(mid.y).toBeGreaterThan(start.y + 5);
  expect(mid.y).toBeLessThan(target.y - 5);
  await settled(page, "rendered");
});

test("reduced motion, resize and scroll settle the latest destination", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator(".morph-button")).toBeEnabled();
  await page.locator(".morph-button").click();
  await settled(page, "rendered");
  const target = await box(page, ".button-template");
  expect(Math.abs((await box(page, '[data-part="surface"]')).x - target.x)).toBeLessThan(1);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.locator(".morph-button").click();
  await page.waitForTimeout(100);
  await page.setViewportSize({ width: 1024, height: 768 });
  await settled(page, "code");
  await expect(page.locator(".morph-button")).toBeFocused();
  await page.locator(".morph-button").click();
  await page.waitForTimeout(100);
  await page.evaluate(() => window.scrollTo(0, 40));
  await settled(page, "rendered");
});

test("server-rendered source and unavailable controls without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://localhost:3000");
  await expect(page.locator(".morph-button")).toBeDisabled();
  await expect(page.locator("pre code")).toHaveText(buttonSource);
  await expect(page.locator("noscript p")).toBeVisible();
  await expect(page.locator("noscript p")).toContainText("Interaction requires JavaScript.");
  await context.close();
});
