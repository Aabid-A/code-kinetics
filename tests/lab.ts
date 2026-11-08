import type { Page } from "@playwright/test";

// The page hosts one lab per chapter, each locked to a template. Specs scope every lab query to one of them.
export type LabId = "button" | "toast" | "bento" | "custom";
export const lab = (page: Page, id: LabId = "button") => page.locator(`[data-lab="${id}"]`);

// Scroll so the lab's sheet sits just below the top edge. Spatial travel needs both content regions fully in view.
export async function bringIntoView(page: Page, id: LabId = "button") {
  await lab(page, id).locator(".lab-sheet").evaluate(sheet => window.scrollTo(0, sheet.getBoundingClientRect().top + scrollY - 16));
  await page.evaluate(() => new Promise(requestAnimationFrame));
}

// Scoped in-page queries. Specs that evaluate code in the browser read the chapter under test through these:
// `labCurrent` names it (set with `pointLabAt`), and the init script below defines the helpers on every page.
export const labScript = () => {
  const w = window as unknown as { labCurrent: string; labRoot: () => Element; labQ: (s: string) => Element | null; labAll: (s: string) => Element[] };
  w.labCurrent = "button";
  w.labRoot = () => document.querySelector(`[data-lab="${w.labCurrent}"]`)!;
  w.labQ = selector => w.labRoot().querySelector(selector);
  w.labAll = selector => [...w.labRoot().querySelectorAll(selector)];
};
export const pointLabAt = (page: Page, id: LabId) => page.evaluate(value => { (window as unknown as { labCurrent: string }).labCurrent = value; }, id);

// The hero asks GET /api/generate whether generation is configured, then POSTs prompts to the same URL. Mock both:
// `configured` answers the GET; `post` answers each POST (default: the real route, which is unconfigured in tests).
export async function mockGenerate(page: Page, options: { configured: boolean; post?: { status?: number; json: unknown } }) {
  await page.route("**/api/generate", route => {
    if (route.request().method() === "GET") return route.fulfill({ json: { configured: options.configured } });
    if (options.post) return route.fulfill({ status: options.post.status ?? 200, json: options.post.json });
    return route.continue();
  });
}

// A full-page screenshot stretches the viewport and then restores it, and the hero's height follows the viewport, so
// the page can still scroll or resize a moment later (the lab cancels a flight on either). Bring the lab back into
// view, let that settle, and re-align, so the next morph starts from a quiet page.
export async function backToLab(page: Page, id: LabId = "button") {
  await bringIntoView(page, id);
  await page.waitForTimeout(300);
  await bringIntoView(page, id);
}
