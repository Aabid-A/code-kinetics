import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { bringIntoView, lab, mockGenerate } from "./lab";
import { measureContrast } from "./contrast";

// The first screen, the top bar, the hero prompt and the footer (SPEC R01, R13; DESIGN "Narrative and copy").

const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" || /hydration/i.test(message.text())) errors.push(message.text()); });
});
test.afterEach(async ({ page }) => { expect(browserErrors.get(page)).toEqual([]); });

const pricing = {
  name: "Pricing", teaching: "The plan name becomes the card; each line lands in its slot.", layout: "row",
  cards: [
    { tag: "Plan", icon: "Rocket", texts: [{ element: "Title", style: "title", text: "Starter" }, { element: "Price", style: "metric", text: "$9" }] },
    { tag: "Plan", texts: [{ element: "Title", style: "title", text: "Team" }, { element: "Caption", style: "label", text: "Per seat, billed monthly" }] },
  ],
};
const configured = (page: Page) => mockGenerate(page, { configured: true, post: { json: { spec: pricing } } });
// Let the 160 ms entrance finish before interacting, so a click never lands on a moving control.
const settle = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished)).then(() => undefined));
const prompt = (page: Page) => page.getByRole("textbox", { name: "Describe a component" });

test("the top bar shows the Code Kinetics logotype link and never the long name", async ({ page }) => {
  await page.goto("/");
  const bar = page.locator("header.topbar");
  const logotype = bar.getByRole("link", { name: "Code Kinetics", exact: true });
  await expect(logotype).toHaveAttribute("href", "#top");
  expect(await logotype.locator("svg").evaluate(svg => [svg.getAttribute("width"), svg.getAttribute("height"), svg.getAttribute("aria-hidden"), svg.querySelectorAll("rect").length, svg.querySelectorAll("path").length]))
    .toEqual(["20", "20", "true", 2, 1]);
  const name = logotype.locator(".logotype-name");
  expect(await name.evaluate(element => { const style = getComputedStyle(element); return [style.fontSize, style.letterSpacing]; })).toEqual(["22px", "normal"]);
  expect(await name.evaluate(element => getComputedStyle(element).fontFamily)).toMatch(/Instrument Serif/);
  expect(await bar.evaluate(element => { const style = getComputedStyle(element); return [element.getBoundingClientRect().height, style.borderTopWidth, style.borderBottomWidth]; })).toEqual([72, "0px", "0px"]);
  await expect(bar).not.toContainText("Spatial DOM Transition Lab");
  expect(await bar.evaluate(element => element.innerHTML.includes("Spatial DOM Transition Lab"))).toBe(false);
  await expect(bar.getByRole("button", { name: "Sound" })).toBeVisible();
  // The link returns to the top of the page.
  await page.evaluate(() => document.getElementById("what-this-is")!.scrollIntoView());
  await logotype.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
});

test("on a phone the logotype stays on one line", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/");
  const logotype = page.locator("header.topbar .logotype");
  expect((await logotype.boundingBox())!.height).toBeLessThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("the document title keeps the long name as its prefix", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/^Spatial DOM Transition Lab/);
});

test("configured: the hero holds the prompt, three suggestions, the privacy line and the quiet link", async ({ page }) => {
  await configured(page);
  await page.goto("/");
  const hero = page.locator("section.opening");
  await expect(hero.getByRole("heading", { level: 1 })).toHaveText("Code has a shape.");
  await expect(hero.getByRole("textbox", { name: "Describe a component" })).toBeVisible();
  expect((await prompt(page).boundingBox())!.height).toBeGreaterThanOrEqual(48);
  await expect(hero.getByRole("group", { name: "Suggestions" }).getByRole("button")).toHaveCount(3);
  await expect(hero.locator(".prompt-privacy")).toHaveText("Your description is sent to Google Gemini to create the example. Don’t include personal information.");
  await expect(hero.getByRole("link", { name: /Or see how it works/ })).toHaveAttribute("href", "#what-this-is");
  await expect(page.getByRole("link", { name: "See it work" })).toHaveCount(0);
  // Nothing was generated and nothing plays on load.
  await expect(page.locator('[data-lab="custom"]')).toHaveCount(0);
  await prompt(page).fill("a pricing card");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(lab(page, "custom")).toHaveAttribute("data-view-mode", "code");
  await expect(lab(page, "custom").locator(".shared-part")).toHaveCount(7);
  // A suggestion chip generates too.
  await hero.getByRole("button", { name: "A login form card" }).click();
  await expect(page.locator('[data-lab="custom"]')).toHaveCount(1);
  await page.getByRole("link", { name: /Or see how it works/ }).click();
  await expect(page).toHaveURL(/#what-this-is$/);
});

test("not configured: the hero falls back to See it work and draws no prompt", async ({ page }) => {
  await mockGenerate(page, { configured: false });
  await page.goto("/");
  const hero = page.locator("section.opening");
  const action = hero.getByRole("link", { name: "See it work" });
  await expect(action).toBeVisible();
  await expect(hero.getByRole("textbox")).toHaveCount(0);
  await expect(page.locator(".prompt-bar")).toHaveCount(0);
  await action.click();
  await expect(page).toHaveURL(/#button$/);
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById("button")!.getBoundingClientRect().top))).toBeLessThan(80);
});

for (const { width, height } of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  for (const mode of ["configured", "not configured"] as const) {
    test(`${width} × ${height}, ${mode}: the first screen shows only the top bar, the title, one line and the primary action`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      if (mode === "configured") await configured(page); else await mockGenerate(page, { configured: false });
      await page.goto("/");
      await expect(mode === "configured" ? prompt(page) : page.getByRole("link", { name: "See it work" })).toBeVisible();
      // Everything the visitor can see in the first viewport.
      const visible = await page.evaluate(() => {
        const inView = (element: Element) => { const box = element.getBoundingClientRect(); return box.width > 0 && box.height > 0 && box.top < innerHeight && box.bottom > 0; };
        return {
          contents: [...document.querySelectorAll(".chapter-index, #what-this-is, .intro-text, .intro-title, .chapter, .site-footer, [data-lab]")].filter(inView).map(element => element.className || element.id),
          words: document.querySelector(".opening-sentence")!.textContent!.trim().split(/\s+/).length,
          paragraphs: [...document.querySelectorAll("main p")].filter(inView).map(element => element.className),
          headings: [...document.querySelectorAll("h1, h2, h3")].filter(inView).map(element => element.tagName),
          pressMorph: /Press\s+Morph/.test(document.body.innerText),
        };
      });
      expect(visible.contents).toEqual([]);
      expect(visible.headings).toEqual(["H1"]);
      expect(visible.words).toBeLessThanOrEqual(16);
      expect(visible.pressMorph).toBe(false);
      // The one line, plus (when configured) the prompt's own small texts; no other paragraph.
      expect(visible.paragraphs.filter(name => !/^(opening-sentence|prompt-(count|privacy|status))( |$)/.test(name))).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}

test("after generating at 1440 × 900 the generated lab's Morph button is in view without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await configured(page);
  await page.goto("/");
  await expect(prompt(page)).toBeVisible();
  await settle(page);
  await prompt(page).fill("a pricing card");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(lab(page, "custom")).toHaveAttribute("data-view-mode", "code");
  const morph = lab(page, "custom").getByRole("button", { name: "Morph to component" });
  await expect(morph).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await morph.click();
  await expect(lab(page, "custom")).toHaveAttribute("data-view-mode", "rendered");
  // A second generation replaces the first, back in code mode.
  await prompt(page).fill("another card");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(lab(page, "custom")).toHaveAttribute("data-view-mode", "code");
  await expect(page.locator('[data-lab="custom"]')).toHaveCount(1);
});

test("the footer is one rule, one row and a single credits line", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const footer = page.locator("footer.site-footer");
  expect(await footer.evaluate(element => getComputedStyle(element).borderTopWidth)).toBe("1px");
  await expect(footer.getByText("About this lab")).toHaveCount(0);
  await expect(footer.locator("h1, h2, h3, .eyebrow")).toHaveCount(0);
  await expect(footer.locator(".footer-name")).toHaveText("Spatial DOM Transition Lab");
  await expect(footer.locator(".footer-about")).toContainText("An interactive explainer of shared-element transitions.");
  const disclaimer = footer.locator(".footer-disclaimer");
  await expect(disclaimer).toHaveText("A visual demonstration with fixed examples. No code is compiled or run.");
  await expect(footer.locator(".footer-credits")).toContainText("Google Gemini");
  await expect(footer.locator(".footer-credits")).toContainText("Instrument Serif, Geist and Geist Mono");
  await expect(footer.locator(".footer-credits")).toContainText("Lucide");
  const boxes = await page.evaluate(() => {
    const box = (selector: string) => document.querySelector(selector)!.getBoundingClientRect();
    return { about: box(".footer-about"), disclaimer: box(".footer-disclaimer"), credits: box(".footer-credits"), credit: parseFloat(getComputedStyle(document.querySelector(".footer-credits")!).lineHeight) };
  });
  // Desktop: the name on the left and the disclaimer on the right share one row; the credits are one line beneath.
  expect(boxes.disclaimer.left).toBeGreaterThan(boxes.about.right);
  expect(Math.abs(boxes.disclaimer.top - boxes.about.top)).toBeLessThan(4);
  expect(boxes.credits.top).toBeGreaterThanOrEqual(Math.max(boxes.about.bottom, boxes.disclaimer.bottom));
  expect(boxes.credits.height).toBeLessThanOrEqual(boxes.credit + 1);
  // Phones: stacked.
  await page.setViewportSize({ width: 390, height: 844 });
  const stacked = await page.evaluate(() => ({ about: document.querySelector(".footer-about")!.getBoundingClientRect(), disclaimer: document.querySelector(".footer-disclaimer")!.getBoundingClientRect() }));
  expect(stacked.disclaimer.top).toBeGreaterThanOrEqual(stacked.about.bottom);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("What this is: at most 60 words, then the contents of five chapters", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("section#what-this-is");
  await expect(section.getByRole("heading", { level: 2, name: "What this is" })).toBeVisible();
  const words = await section.locator(".intro-text").evaluate(element => element.textContent!.trim().split(/\s+/).length);
  expect(words).toBeLessThanOrEqual(60);
  await expect(section.locator(".intro-text")).toContainText("A thumbnail grows into a photo; a card opens into a page.");
  await expect(section.getByRole("navigation", { name: "Chapters" }).getByRole("link")).toHaveCount(5);
  await expect(page.locator("section.chapter")).toHaveCount(5);
  expect(await page.evaluate(() => document.body.innerText)).not.toMatch(/six chapters|Chapter 06|06 — /i);
});

for (const mode of ["configured", "not configured"] as const) {
  test(`the ${mode} hero has no axe violations and meets contrast`, async ({ page }, info) => {
    if (mode === "configured") await configured(page); else await mockGenerate(page, { configured: false });
    await page.goto("/");
    await expect(mode === "configured" ? prompt(page) : page.getByRole("link", { name: "See it work" })).toBeVisible();
    if (mode === "configured") {
      await prompt(page).fill("a pricing card");
      await page.getByRole("button", { name: "Generate", exact: true }).click();
      await expect(lab(page, "custom")).toHaveAttribute("data-view-mode", "code");
    }
    await page.waitForTimeout(400);
    const results = await new AxeBuilder({ page }).analyze();
    await info.attach("axe.json", { body: JSON.stringify({ violations: results.violations }, null, 1), contentType: "application/json" });
    expect(results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(" ")).join(", ")}`)).toEqual([]);
    const samples = await measureContrast(page);
    expect(samples.filter(sample => sample.ratio < sample.required).map(sample => `${sample.ratio}:1 < ${sample.required}:1 ${sample.selector} "${sample.text}"`)).toEqual([]);
  });
}

// ---- Stability: nothing moves unless the visitor caused it (SPEC R01) ----

const heroBoxes = (page: Page) => page.evaluate(() => Object.fromEntries([".opening-title", ".opening-sentence", ".hero-action", ".opening"].map(selector => {
  const box = document.querySelector(selector)!.getBoundingClientRect();
  return [selector, [Math.round(box.x), Math.round(box.top + scrollY), Math.round(box.width), Math.round(box.height)]];
})));

for (const width of [320, 390, 640, 768, 1024, 1280, 1440]) {
  test(`${width} px: the hero is the same height with the prompt, with See it work and while it checks`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    // Hold the availability answer so the "checking" state can be measured too.
    let release: () => void = () => {};
    const held = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/generate", async route => {
      if (route.request().method() !== "GET") return route.continue();
      await held;
      return route.fulfill({ json: { configured: width % 2 === 0 } });
    });
    await page.goto("/");
    await expect(page.locator(".hero-action")).toHaveAttribute("data-availability", "checking");
    await settle(page); // the title and line's own 160 ms entrance (a transform) must be over before boxes are compared
    const checking = await heroBoxes(page);
    release();
    await expect(page.locator(".hero-fade")).toHaveCount(1);
    await settle(page);
    const resolved = await heroBoxes(page);
    expect(resolved).toEqual(checking); // nothing moved or resized when the check resolved
    // And the other answer gives the same boxes, so the prompt always fits what is reserved.
    await page.unroute("**/api/generate");
    await mockGenerate(page, { configured: width % 2 !== 0 });
    await page.reload();
    await expect(page.locator(".hero-fade")).toHaveCount(1);
    await settle(page);
    expect(await heroBoxes(page)).toEqual(checking);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test("generating moves nothing in the hero, and Generate keeps its size while busy", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  let release: () => void = () => {};
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/generate", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { configured: true } });
    await held;
    return route.fulfill({ json: { spec: pricing } });
  });
  await page.goto("/");
  await expect(prompt(page)).toBeVisible();
  await settle(page);
  const parts = () => page.evaluate(() => [".prompt-label", ".prompt-input", ".prompt-submit", ".prompt-status", ".prompt-suggestions", ".prompt-count", ".prompt-privacy", ".hero-secondary", ".opening-title"].map(selector => {
    const box = document.querySelector(selector)!.getBoundingClientRect();
    return [selector, Math.round(box.x), Math.round(box.top + scrollY), Math.round(box.width), Math.round(box.height)];
  }));
  await prompt(page).fill("a pricing card");
  const idle = await parts();
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(page.getByRole("button", { name: "Generating…" })).toBeDisabled();
  expect(await parts()).toEqual(idle); // busy: same positions and sizes
  release();
  await expect(lab(page, "custom")).toHaveAttribute("data-view-mode", "code");
  expect(await parts()).toEqual(idle); // done: the status text changed, nothing else did
});

test("Generate shows its busy state within 100 ms of activation", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/generate", async route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { configured: true } });
    await new Promise(resolve => setTimeout(resolve, 800));
    return route.fulfill({ json: { spec: pricing } });
  });
  await page.goto("/");
  await expect(prompt(page)).toBeVisible();
  await settle(page);
  await prompt(page).fill("a pricing card");
  const delay = page.evaluate(() => new Promise<number>(resolve => {
    let started = 0;
    document.addEventListener("click", () => { started = performance.now(); }, { capture: true, once: true });
    const button = document.querySelector(".prompt-submit")!;
    new MutationObserver(() => { if (button.textContent?.includes("Generating")) { resolve(performance.now() - started); } }).observe(button, { childList: true, subtree: true, characterData: true });
  }));
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  expect(await delay).toBeLessThan(100);
  await expect(page.locator("form.prompt-bar")).toHaveAttribute("aria-busy", "true");
});

test("Morph starts moving on the next frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(lab(page).locator(".morph-button")).toBeEnabled();
  await bringIntoView(page);
  const started = page.evaluate(() => new Promise<{ travelling: string | null; ms: number }>(resolve => {
    const stage = document.querySelector('[data-lab="button"] .lab-stage')!;
    let t0 = 0;
    document.addEventListener("click", () => { t0 = performance.now(); }, { capture: true, once: true });
    new MutationObserver(() => { if (stage.getAttribute("data-travelling") === "true") resolve({ travelling: "true", ms: performance.now() - t0 }); }).observe(stage, { attributes: true });
    setTimeout(() => resolve({ travelling: stage.getAttribute("data-travelling"), ms: 999 }), 1000);
  }));
  await lab(page).getByRole("button", { name: "Morph to component" }).click();
  const result = await started;
  expect(result.travelling).toBe("true");
  expect(result.ms).toBeLessThan(100);
});

test("See it work and the in-page links start scrolling at once (instantly under reduced motion)", async ({ page }) => {
  await mockGenerate(page, { configured: false });
  await page.goto("/");
  const action = page.getByRole("link", { name: "See it work" });
  await expect(action).toBeVisible();
  const first = page.evaluate(() => new Promise<number>(resolve => {
    const t0 = performance.now();
    const check = () => { if (scrollY > 0) resolve(performance.now() - t0); else requestAnimationFrame(check); };
    document.addEventListener("click", () => requestAnimationFrame(check), { capture: true, once: true });
    setTimeout(() => resolve(999), 1000);
  }));
  await action.click();
  expect(await first).toBeLessThan(100);
  await expect(page).toHaveURL(/#button$/);
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById("button")!.getBoundingClientRect().top)), { timeout: 4000 }).toBeLessThan(80);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("link", { name: "See it work" }).click();
  // Reduced motion: the jump is complete by the next frame.
  await page.evaluate(() => new Promise(requestAnimationFrame));
  expect(await page.evaluate(() => Math.round(document.getElementById("button")!.getBoundingClientRect().top))).toBeLessThan(80);
});

test("no heading ends on a single orphaned word, at phone, tablet and desktop widths", async ({ page }) => {
  await mockGenerate(page, { configured: true });
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator(".hero-fade")).toHaveCount(1);
    const orphans = await page.evaluate(() => [...document.querySelectorAll("main h1, main h2")].flatMap(heading => {
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      const words: { text: string; top: number }[] = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        for (const match of node.textContent!.matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(node, match.index!); range.setEnd(node, match.index! + match[0].length);
          const rect = range.getClientRects()[0];
          if (rect) words.push({ text: match[0], top: Math.round(rect.top) });
        }
      }
      const tops = [...new Set(words.map(word => word.top))];
      const lastLine = words.filter(word => word.top >= tops.at(-1)! - 2);
      return tops.length > 1 && lastLine.length < 2 ? [`${heading.textContent}`] : [];
    }));
    expect(orphans, `${width}px`).toEqual([]);
  }
});
