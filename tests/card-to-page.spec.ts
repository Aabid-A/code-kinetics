import { expect, test, type Page } from "@playwright/test";

// Chapter 04: a card opens into its page through shared layout identities, and closes back into the card.

const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const list: string[] = [];
  errors.set(page, list);
  page.on("pageerror", error => list.push(error.message));
  page.on("console", message => { if (message.type() === "error") list.push(message.text()); });
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

const chapter = (page: Page) => page.locator("section#card-to-page");
const card = (page: Page, title: string) => chapter(page).getByRole("button", { name: new RegExp(`^${title}`) });

async function arrive(page: Page) {
  await page.goto("/");
  await chapter(page).evaluate(section => window.scrollTo(0, section.getBoundingClientRect().top + scrollY - 16));
  await expect(card(page, "Tide Tables")).toBeEnabled();
}

// The cover's box on every frame for 900 ms after `act`.
async function coverFrames(page: Page, act: () => Promise<void>) {
  const sampling = page.evaluate(async () => {
    const frames: { x: number; y: number; width: number }[] = [];
    const start = performance.now();
    while (performance.now() - start < 900) {
      await new Promise(requestAnimationFrame);
      const cover = document.querySelector("#card-to-page .ctp-page-cover, #card-to-page .ctp-card .ctp-cover");
      const box = (document.querySelector("#card-to-page .ctp-page .ctp-cover") ?? cover)?.getBoundingClientRect();
      if (box) frames.push({ x: box.x, y: box.y, width: box.width });
    }
    return frames;
  });
  await act();
  return sampling;
}

test("three project cards; choosing one turns it into its page, and the cover travels instead of jumping", async ({ page }) => {
  await arrive(page);
  await expect(chapter(page).getByRole("list", { name: "Projects" }).getByRole("listitem")).toHaveCount(3);
  for (const title of ["Tide Tables", "Field Notes", "Night Market"]) await expect(card(page, title)).toBeVisible();
  const before = (await card(page, "Tide Tables").locator(".ctp-cover").boundingBox())!;

  const frames = await coverFrames(page, () => card(page, "Tide Tables").click());
  const article = chapter(page).getByRole("article");
  await expect(article.getByRole("heading", { name: "Tide Tables" })).toBeFocused();
  await expect(chapter(page).locator(".ctp-card")).toHaveCount(0);
  const after = (await article.locator(".ctp-cover").boundingBox())!;
  expect(after.width).toBeGreaterThan(before.width * 1.3);
  // At least one frame sits strictly between the card's cover and the page's cover: real travel, not a cut.
  expect(frames.some(frame => frame.width > before.width + 8 && frame.width < after.width - 8)).toBe(true);
  await expect(article).toContainText("A calm way to read the sea");
});

test("Back and Escape return to the cards with focus on the card that was opened", async ({ page }) => {
  await arrive(page);
  await card(page, "Field Notes").click();
  await chapter(page).getByRole("button", { name: "Back to all projects" }).click();
  await expect(card(page, "Field Notes")).toBeFocused();

  await card(page, "Night Market").click();
  await expect(chapter(page).getByRole("heading", { name: "Night Market" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(card(page, "Night Market")).toBeFocused();
  await expect(chapter(page).locator(".ctp-card")).toHaveCount(3);
});

test("keyboard only: Enter opens a card, Tab reaches Back, Enter closes", async ({ page }) => {
  await arrive(page);
  await card(page, "Tide Tables").focus();
  await page.keyboard.press("Enter");
  await expect(chapter(page).getByRole("heading", { name: "Tide Tables" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(chapter(page).getByRole("button", { name: "Back to all projects" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(card(page, "Tide Tables")).toBeFocused();
});

test("the sheet keeps its height in both views, so the page below never jumps", async ({ page }) => {
  await arrive(page);
  const sheet = chapter(page).locator(".ctp-sheet");
  const closed = (await sheet.boundingBox())!.height;
  await card(page, "Tide Tables").click();
  await expect(chapter(page).getByRole("article")).toBeVisible();
  await page.waitForTimeout(1200);
  expect(Math.abs((await sheet.boundingBox())!.height - closed)).toBeLessThan(1);
});

test("reduced motion: the page appears at its final place on the first frame", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await arrive(page);
  const frames = await coverFrames(page, () => card(page, "Tide Tables").click());
  const final = (await chapter(page).getByRole("article").locator(".ctp-cover").boundingBox())!;
  const afterOpen = frames.filter(frame => Math.abs(frame.width - final.width) < 1 || frame.width > final.width * 0.9);
  expect(afterOpen.length).toBeGreaterThan(0);
  // No in-between sizes: every sampled width is either the card's cover or the page's cover.
  const before = frames[0].width;
  expect(frames.every(frame => Math.abs(frame.width - before) < 1 || Math.abs(frame.width - final.width) < 1)).toBe(true);
});

test("390 px phone: cards stack, the page stacks, and nothing overflows sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await arrive(page);
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(await overflow()).toBe(false);
  const boxes = await chapter(page).locator(".ctp-card").evaluateAll(cards => cards.map(element => element.getBoundingClientRect().x));
  expect(new Set(boxes.map(Math.round)).size).toBe(1);
  await card(page, "Night Market").click();
  await expect(chapter(page).getByRole("heading", { name: "Night Market" })).toBeFocused();
  expect(await overflow()).toBe(false);
});
