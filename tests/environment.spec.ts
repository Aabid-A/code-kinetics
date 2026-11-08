import { expect, test, type Page } from "@playwright/test";
import { templates } from "../src/lib/lab/templates";
import type { TemplateId as AnyTemplateId, ViewMode } from "../src/lib/lab/types";

type TemplateId = Exclude<AnyTemplateId, "custom">; // the fixed examples

const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" || /hydration/i.test(message.text())) errors.push(message.text()); });
});
test.afterEach(async ({ page }) => { expect(browserErrors.get(page)).toEqual([]); });

const ids: TemplateId[] = ["button", "toast", "bento"];

async function ready(page: Page) {
  await page.goto("/");
  await expect(page.locator(".morph-button")).toBeEnabled();
}
async function settled(page: Page, id: TemplateId, mode: ViewMode) {
  await expect(page.locator("main")).toHaveAttribute("data-template", id);
  await expect(page.locator("main")).toHaveAttribute("data-view-mode", mode);
  await expect(page.locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
  for (const part of templates[id].parts) await expect(page.locator(`[data-shared-id="${id}:${part.key}"]`)).toHaveAttribute("data-endpoint", mode);
}
async function choose(page: Page, id: TemplateId) {
  await page.getByRole("button", { name: /^Example:/ }).click();
  await page.getByRole("option", { name: templates[id].label, exact: true }).click();
  await settled(page, id, "code");
}
const noHorizontalOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
const paneBoxes = (page: Page) => page.evaluate(() => {
  const code = document.querySelector(".code-pane")!.getBoundingClientRect();
  const render = document.querySelector(".render-pane")!.getBoundingClientRect();
  return { code: { x: code.x, y: code.y, right: code.right, bottom: code.bottom }, render: { x: render.x, y: render.y, right: render.right, bottom: render.bottom } };
});
// No stranded piece: every shared piece carries no residual transform, holds still across two frames, and, where the
// template declares a destination slot (Toast, Bento) and the view is rendered, sits on that slot within 1 CSS px.
async function onDestination(page: Page, id: TemplateId, mode: ViewMode = "rendered") {
  return page.evaluate(async ({ keys, rendered }) => {
    const boxes = () => keys.map(key => document.querySelector(`.shared-part[data-part="${key}"]`)!.getBoundingClientRect());
    const before = boxes();
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    const after = boxes();
    return keys.every((key, index) => {
      const part = document.querySelector<HTMLElement>(`.shared-part[data-part="${key}"]`)!;
      const transform = getComputedStyle(part).transform;
      const still = Math.abs(before[index].x - after[index].x) < .5 && Math.abs(before[index].y - after[index].y) < .5;
      const slot = rendered ? document.querySelector(`[data-destination-slot="${key}"]`)?.getBoundingClientRect() : undefined;
      const onSlot = !slot || (Math.abs(after[index].x - slot.x) < 1 && Math.abs(after[index].y - slot.y) < 1);
      return (transform === "none" || transform === "matrix(1, 0, 0, 1, 0, 0)") && still && onSlot;
    });
  }, { keys: templates[id].parts.map(part => part.key), rendered: mode === "rendered" });
}
async function tabOrder(page: Page) {
  await page.locator("body").focus();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const order: string[] = [];
  for (let step = 0; step < 6; step++) {
    await page.keyboard.press("Tab");
    order.push(await page.evaluate(() => {
      const element = document.activeElement as HTMLElement;
      return `${element.getAttribute("role") ?? element.tagName.toLowerCase()}:${(element.getAttribute("aria-label") ?? element.textContent ?? "").trim()}`;
    }));
  }
  return order;
}

test("960 px is split and 959 px is stacked, with one layout tree, the same focus order and no overflow", async ({ page }) => {
  const orders: string[][] = [];
  for (const width of [960, 959]) {
    await page.setViewportSize({ width, height: 900 });
    await ready(page);
    const { code, render } = await paneBoxes(page);
    if (width === 960) { expect(render.x).toBeGreaterThanOrEqual(code.right - 1); expect(Math.abs(render.y - code.y)).toBeLessThan(1); }
    else { expect(render.y).toBeGreaterThanOrEqual(code.bottom - 1); expect(Math.abs(render.x - code.x)).toBeLessThan(1); }
    await expect(page.locator(".code-pane")).toHaveCount(1);
    await expect(page.locator(".render-pane")).toHaveCount(1);
    await expect(page.locator("pre code")).toHaveCount(1);
    expect(await page.evaluate(() => !!(document.querySelector(".code-pane")!.compareDocumentPosition(document.querySelector(".render-pane")!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
    orders.push(await tabOrder(page));
    for (const id of ids) {
      await choose(page, id);
      expect(await noHorizontalOverflow(page)).toBe(true);
      await page.locator(".morph-button").click();
      await settled(page, id, "rendered");
      expect(await noHorizontalOverflow(page)).toBe(true);
      expect(await onDestination(page, id)).toBe(true);
    }
  }
  expect(orders[0]).toEqual(["button:Example: Button", "button:Sound off", "button:Morph to component", "radio:Code", "summary:How the pieces match", orders[0][5]]);
  expect(orders[1]).toEqual(orders[0]);
});

for (const viewport of [{ width: 768, height: 1024 }, { width: 844, height: 390 }]) {
  test(`${viewport.width} × ${viewport.height}: stacked, travel only when both regions are visible, otherwise the compare notice`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await ready(page);
    const { code, render } = await paneBoxes(page);
    expect(render.y).toBeGreaterThanOrEqual(code.bottom - 1);
    for (const id of ids) {
      await choose(page, id);
      await page.evaluate(() => window.scrollTo(0, 0));
      // Same visibility rule as the app: both content regions entirely inside the viewport.
      const bothVisible = await page.evaluate(() => [".code-content", ".preview-content"].every(selector => {
        const box = document.querySelector(selector)!.getBoundingClientRect();
        return box.width > 0 && box.height > 0 && box.top >= 0 && box.left >= 0 && box.bottom <= innerHeight && box.right <= innerWidth;
      }));
      const travelled = page.evaluate(() => new Promise<boolean>(resolve => {
        const stage = document.querySelector(".lab-stage")!;
        const observer = new MutationObserver(() => { if (stage.getAttribute("data-travelling") === "true") { observer.disconnect(); resolve(true); } });
        observer.observe(stage, { attributes: true });
        setTimeout(() => { observer.disconnect(); resolve(false); }, 1500);
      }));
      test.info().annotations.push({ type: id, description: bothVisible ? "both regions visible: spatial travel" : "endpoint offscreen: compare notice" });
      await page.locator(".morph-button").click();
      expect(await travelled).toBe(bothVisible);
      await settled(page, id, "rendered");
      await expect(page.getByText("View changed. Scroll to compare the example.")).toHaveCount(bothVisible ? 0 : 1);
      expect(await noHorizontalOverflow(page)).toBe(true);
      expect(await page.evaluate(() => scrollY)).toBe(0); // no automatic scroll
      expect(await onDestination(page, id)).toBe(true);
      await page.locator(".morph-button").click();
      await settled(page, id, "code");
    }
  });
}

test.describe("200% zoom (1440 × 900 at 200%: a 720 × 450 CSS viewport at device scale 2)", () => {
  test.use({ viewport: { width: 720, height: 450 }, deviceScaleFactor: 2 });

  test("reflows without horizontal scrolling, clipped controls or lost content", async ({ page }) => {
    await ready(page);
    for (const id of ids) {
      await choose(page, id);
      for (const mode of ["code", "rendered"] as const) {
        if (mode === "rendered") await page.locator(".morph-button").click();
        await settled(page, id, mode);
        expect(await noHorizontalOverflow(page)).toBe(true);
        // No control label or heading is truncated, and every control lies within the page width.
        const clipped = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("button, summary, h1, h2, .mode-label, figcaption")]
          .filter(element => element.checkVisibility() && (element.scrollWidth > element.clientWidth + 1 || element.getBoundingClientRect().right > innerWidth + 1))
          .map(element => element.className || element.tagName));
        expect(clipped).toEqual([]);
        expect(await onDestination(page, id, mode)).toBe(true);
      }
      await page.locator(".morph-button").click();
      await settled(page, id, "code");
    }
    // Every control remains reachable by scrolling and operable.
    for (const name of [/^Example:/, /^Sound/, /^Morph to/]) {
      const control = page.getByRole("button", { name });
      await control.scrollIntoViewIfNeeded();
      await expect(control).toBeInViewport();
    }
    await page.getByRole("radio", { name: "Component", exact: true }).click();
    await settled(page, "bento", "rendered");
  });
});

test("orientation change during a flight settles at the new geometry and keeps the latest state and focus", async ({ page, context }) => {
  await page.setViewportSize({ width: 1024, height: 1366 });
  await ready(page);
  const cdp = await context.newCDPSession(page);
  const orient = (width: number, height: number, type: "portraitPrimary" | "landscapePrimary") => cdp.send("Emulation.setDeviceMetricsOverride", {
    width, height, deviceScaleFactor: 1, mobile: false, screenOrientation: { type, angle: type === "portraitPrimary" ? 0 : 90 },
  });
  await orient(1024, 1366, "portraitPrimary");
  await page.evaluate(() => { (window as unknown as { rotations: number }).rotations = 0;
    screen.orientation.addEventListener("change", () => { (window as unknown as { rotations: number }).rotations++; }); });
  await page.locator(".morph-button").click();
  await expect(page.locator(".lab-stage")).toHaveAttribute("data-travelling", "true");
  await page.waitForTimeout(200);
  await orient(1366, 1024, "landscapePrimary");
  expect(await page.evaluate(() => [screen.orientation.type, (window as unknown as { rotations: number }).rotations])).toEqual(["landscape-primary", 1]);
  await settled(page, "button", "rendered");
  await expect(page.locator(".morph-button")).toBeFocused();
  expect(await onDestination(page, "button")).toBe(true);
  // Old motion does not resume: the pieces stay on the new destination.
  await page.waitForTimeout(800);
  expect(await onDestination(page, "button")).toBe(true);
  await expect(page.locator("main")).toHaveAttribute("data-view-mode", "rendered");
  await cdp.send("Emulation.clearDeviceMetricsOverride");
});

// Headless Chromium keeps visibilityState "visible" whatever tab is in front, so hiding is simulated:
// visibilityState is overridden and a real visibilitychange event is dispatched to the app's listener.
test("tab hiding during a flight settles immediately; restoring does not resume old motion", async ({ page }) => {
  await ready(page);
  await choose(page, "toast");
  await page.locator(".morph-button").click();
  await expect(page.locator(".lab-stage")).toHaveAttribute("data-travelling", "true");
  await page.waitForTimeout(200);
  const setVisibility = (state: "hidden" | "visible") => page.evaluate(value => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => value });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => value === "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);
  await setVisibility("hidden");
  // Settles at once: well inside the spring's ~800 ms run, the stage is no longer travelling.
  await expect(page.locator(".lab-stage")).toHaveAttribute("data-travelling", "false", { timeout: 150 });
  await settled(page, "toast", "rendered");
  await setVisibility("visible");
  await expect(page.locator(".morph-button")).toBeFocused();
  expect(await onDestination(page, "toast")).toBe(true);
  await page.waitForTimeout(800);
  expect(await onDestination(page, "toast")).toBe(true);
  await expect(page.locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
  await expect(page.locator("main")).toHaveAttribute("data-view-mode", "rendered");
});
