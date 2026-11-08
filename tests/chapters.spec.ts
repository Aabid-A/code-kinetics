import { expect, test, type Page } from "@playwright/test";
import { bringIntoView, lab, type LabId } from "./lab";

const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" || /hydration/i.test(message.text())) errors.push(message.text()); });
});
test.afterEach(async ({ page }) => { expect(browserErrors.get(page)).toEqual([]); });

const ids = ["button", "toast", "bento", "how-it-knows", "your-turn"];
// A CSS locator: while the index hides itself over a control it is `visibility: hidden`, which role queries skip.
const index = (page: Page) => page.locator('nav[aria-label="Chapters"]');

test("the page has five chapters with eyebrows, serif titles and one caption each", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Code has a shape.");
  for (const [position, id] of ids.entries()) {
    const chapter = page.locator(`section#${id}`);
    await expect(chapter.locator(".eyebrow")).toContainText(`0${position + 1} —`);
    await expect(chapter.getByRole("heading", { level: 2 })).toHaveCount(1);
    await expect(chapter.locator(".chapter-caption")).toHaveCount(1);
  }
  await expect(page.locator(".eyebrow")).toHaveText(["01 — Button", "02 — Toast", "03 — Bento", "04 — How it knows", "05 — Your turn"]);
  // Exactly one accent full stop in the headline.
  await expect(page.locator(".opening-title .stop")).toHaveText(".");
  // Chapter 03 flips: its sheet is left of its text; the others have the text on the left.
  const side = async (id: string) => {
    const text = await page.locator(`section#${id} .chapter-text`).boundingBox();
    const body = await page.locator(`section#${id} .chapter-body`).boundingBox();
    return text!.x < body!.x ? "text-left" : "text-right";
  };
  expect(await side("button")).toBe("text-left");
  expect(await side("toast")).toBe("text-left");
  expect(await side("bento")).toBe("text-right");
  expect(await side("your-turn")).toBe("text-left");
});

test("each lab shows one caption line and keeps the old pane labels as hidden text", async ({ page }) => {
  await page.goto("/");
  const expected: Record<string, string> = { button: "3 mapped pieces · Example only, not interactive", toast: "4 mapped pieces · Example only, not interactive",
    bento: "10 mapped pieces · Example only, fictional content, not interactive" };
  for (const id of ["button", "toast", "bento"] as const) {
    await expect(lab(page, id).locator(".lab-caption")).toHaveText(expected[id]);
    const hidden = await lab(page, id).locator(".sr-only").evaluateAll(nodes => nodes.map(node => node.textContent?.trim()).filter(Boolean));
    expect(hidden).toEqual(expect.arrayContaining(["Fixed example", expect.stringMatching(/^Mapped pieces (start here|are shown in the preview)\.$/), expect.stringMatching(/^Example component · /)]));
    // None of the three is visible: each is clipped to a 1px box.
    for (const text of ["Fixed example", "Example component"]) {
      const box = await lab(page, id).locator(".sr-only", { hasText: text }).first().boundingBox();
      expect(box!.width).toBeLessThanOrEqual(1);
    }
    await expect(lab(page, id).getByText("How the pieces match")).toBeVisible();
  }
});

test("the code sheet is top-aligned and the lab keeps its size when it morphs", async ({ page }) => {
  await page.goto("/");
  for (const id of ["button", "toast", "bento"] as const) {
    await bringIntoView(page, id);
    const first = lab(page, id).locator(".code-line").first();
    const code = await lab(page, id).locator(".code-content").boundingBox();
    const top = await first.boundingBox();
    expect(top!.y - code!.y).toBeLessThan(40); // padding only: no vertical centring
    const code1 = await lab(page, id).locator(".code-pane").boundingBox();
    const render1 = await lab(page, id).locator(".render-pane").boundingBox();
    expect(Math.abs(code1!.height - render1!.height)).toBeLessThan(1); // preview and code sheet share one height
    const stage = await lab(page, id).locator(".lab-stage").boundingBox();
    await lab(page, id).locator(".morph-button").click();
    await expect(lab(page, id)).toHaveAttribute("data-view-mode", "rendered");
    await expect(lab(page, id).locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
    expect(await lab(page, id).locator(".lab-stage").boundingBox()).toEqual(stage);
    expect(await lab(page, id).locator(".stage-registration").count()).toBe(0);
    await lab(page, id).locator(".morph-button").click();
    await expect(lab(page, id)).toHaveAttribute("data-view-mode", "code");
  }
});

test("chapter index: five links, aria-current follows the chapter in view, and it never covers a lab control", async ({ page }) => {
  for (const height of [900, 700]) {
    await page.setViewportSize({ width: 1440, height });
    await page.goto("/");
    await expect(index(page).locator("a")).toHaveCount(5);
    expect(await index(page).evaluate(nav => getComputedStyle(nav).position)).toBe("fixed");
    // On a viewport shorter than 900 px it also hides while it would sit over any lab sheet (the Button sheet at the top).
    await expect.poll(() => index(page).evaluate(nav => nav.hasAttribute("data-hidden"))).toBe(height < 900);
    for (const id of ids) {
      await page.evaluate(target => document.getElementById(target)!.scrollIntoView({ block: "start" }), id);
      await page.evaluate(() => new Promise(requestAnimationFrame));
      await expect(index(page).locator("a[aria-current]")).toHaveCount(1);
      await expect(index(page).locator("a[aria-current]")).toHaveAttribute("href", `#${id}`);
    }
    // Scroll through the page in small steps: whenever the index is visible it overlaps no lab control.
    const covered = await page.evaluate(async () => {
      const nav = document.querySelector<HTMLElement>(".chapter-index")!;
      const hits: string[] = [];
      for (let y = 0; y < document.documentElement.scrollHeight; y += 120) {
        window.scrollTo(0, y);
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        if (getComputedStyle(nav).visibility === "hidden") continue;
        const mine = nav.getBoundingClientRect();
        for (const control of document.querySelectorAll(".lab button, .lab summary, .prompt-bar input, .prompt-bar button")) {
          const box = control.getBoundingClientRect();
          if (box.width && box.bottom > mine.top && box.top < mine.bottom && box.right > mine.left && box.left < mine.right) hits.push(`${y}:${control.textContent}`);
        }
      }
      return hits;
    });
    expect(covered).toEqual([]);
  }
  // Links jump to their chapter.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Chapters" })).toBeVisible(); // named landmark, visible on the first screen
  await index(page).getByRole("link", { name: /^03/ }).click();
  await expect(page).toHaveURL(/#bento$/);
});

test("below 1024 px the index is a plain inline list and the drafting rules are gone", async ({ page }) => {
  await page.setViewportSize({ width: 1023, height: 900 });
  await page.goto("/");
  expect(await index(page).evaluate(nav => getComputedStyle(nav).position)).toBe("static");
  expect(await page.locator(".drafting-rules").evaluate(rules => getComputedStyle(rules).display)).toBe("none");
  const afterOpening = await page.evaluate(() => {
    const opening = document.querySelector(".opening")!.getBoundingClientRect(), nav = document.querySelector(".chapter-index")!.getBoundingClientRect();
    const first = document.querySelector("#button")!.getBoundingClientRect();
    return opening.bottom <= nav.top + 1 && nav.bottom <= first.top + 1;
  });
  expect(afterOpening).toBe(true);
  await page.setViewportSize({ width: 1024, height: 900 });
  expect(await page.locator(".drafting-rules").evaluate(rules => getComputedStyle(rules).display)).toBe("block");
  const lines = await page.locator(".drafting-rules i").evaluateAll(items => items.map(item => {
    const box = item.getBoundingClientRect(), parent = item.parentElement!.getBoundingClientRect();
    return Math.round(((box.left - parent.left) / parent.width) * 100);
  }));
  expect(lines).toEqual([25, 50, 75]);
  expect(await page.locator(".drafting-rules").getAttribute("aria-hidden")).toBe("true");
});

test("opening entrance runs once under normal motion and not at all under reduced motion", async ({ page }) => {
  await page.goto("/");
  const names = await page.evaluate(() => [".opening-title", ".opening-sentence", ".chapter-index"].map(selector => getComputedStyle(document.querySelector(selector)!).animationName));
  expect(names).toEqual(["enter", "enter", "enter"]);
  // Total entrance is at most 400 ms (last delay + duration), and no lab piece animates on load.
  const total = await page.evaluate(() => Math.max(...[".opening-title", ".opening-sentence", ".chapter-index"].map(selector => {
    const style = getComputedStyle(document.querySelector(selector)!);
    return parseFloat(style.animationDelay) * 1000 + parseFloat(style.animationDuration) * 1000;
  })));
  expect(total).toBeLessThanOrEqual(400);
  expect(await page.evaluate(() => document.querySelector(".lab")!.getAnimations({ subtree: true }).filter(animation => animation instanceof CSSAnimation).length)).toBe(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  const reduced = await page.evaluate(() => [".opening-title", ".opening-sentence", ".chapter-index", ".chapter-text"].map(selector => getComputedStyle(document.querySelector(selector)!).animationName));
  expect(reduced).toEqual(["none", "none", "none", "none"]);
  // Reveals are off too: every chapter's text is fully visible without scrolling to it.
  expect(await page.locator('[data-reveal="pending"]').count()).toBe(0);
});

test("chapter text below the fold is revealed once as it scrolls into view", async ({ page }) => {
  await page.goto("/");
  const later = page.locator("section#bento .chapter-text");
  await expect(later).toHaveAttribute("data-reveal", "pending");
  await page.evaluate(() => document.getElementById("bento")!.scrollIntoView({ block: "center" }));
  await expect(later).toHaveAttribute("data-reveal", "done");
  await expect(later).toHaveCSS("opacity", "1");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(later).toHaveAttribute("data-reveal", "done"); // once only
});

test("chapter 04 draws one diagram per width, decorative, with a text equivalent and one accent pair", async ({ page }) => {
  for (const [width, shown] of [[1440, "diagram-wide"], [390, "diagram-narrow"]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const figure = page.locator("section#how-it-knows figure.diagram");
    for (const name of ["diagram-wide", "diagram-narrow"]) {
      const svg = figure.locator(`svg.${name}`);
      await expect(svg).toHaveAttribute("aria-hidden", "true");
      if (name === shown) await expect(svg).toBeVisible(); else await expect(svg).toBeHidden();
    }
    await expect(figure.locator("figcaption")).toContainText("layoutId");
    await expect(figure.locator("figcaption li")).toHaveCount(3);
    // The accent marks one pair only: one accent connector, and its two ends.
    const visibleSvg = figure.locator(`svg.${shown}`);
    expect(await visibleSvg.locator("path.dg-accent-line").count()).toBe(1);
    expect(await visibleSvg.locator("circle.dg-accent-fill").count()).toBe(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("Try your own: the prompt sits in chapter 05 and the generated lab appears beneath it", async ({ page }) => {
  await page.route("**/api/generate", route => route.fulfill({ json: { spec: { name: "Card", teaching: "The name becomes the card.", layout: "single",
    cards: [{ tag: "Card", texts: [{ element: "Title", style: "title", text: "Hello" }] }] } } }));
  await page.goto("/");
  const chapter = page.locator("section#your-turn");
  await expect(chapter.getByRole("textbox", { name: "Describe a component" })).toBeVisible();
  await expect(chapter.locator("[data-lab]")).toHaveCount(0);
  await chapter.getByRole("textbox", { name: "Describe a component" }).fill("a card");
  await chapter.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(chapter.locator('[data-lab="custom"]' satisfies string)).toHaveCount(1);
  const custom: LabId = "custom";
  await expect(lab(page, custom).locator(".lab-caption")).toContainText("mapped pieces");
});

test("the generated lab does not overflow a 320 px screen in either view", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.route("**/api/generate", route => route.fulfill({ json: { spec: { name: "Pricing", teaching: "The plan name becomes the card.", layout: "row",
    cards: [{ tag: "Plan", icon: "Rocket", texts: [{ element: "Title", style: "title", text: "Starter" }] }, { tag: "Plan", texts: [{ element: "Title", style: "title", text: "Team" }] }] } } }));
  await page.goto("/");
  await page.getByRole("textbox", { name: "Describe a component" }).fill("pricing");
  await page.getByRole("button", { name: "Generate", exact: true }).click();
  await expect(lab(page, "custom")).toHaveAttribute("data-view-mode", "code");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await lab(page, "custom").getByRole("radio", { name: "Component", exact: true }).click();
  await expect(lab(page, "custom").locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
