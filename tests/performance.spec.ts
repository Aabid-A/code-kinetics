import { gzipSync } from "node:zlib";
import { lab, mockGenerate } from "./lab";
import { expect, test } from "@playwright/test";

// QA.md Q11 measurements. These record numbers only: no budget is set, so nothing here passes or fails on a size
// or timing value. The numbers depend on this machine and headless Chromium; see QA.md for the recorded values.

test("records initial route JavaScript size (raw and gzip)", async ({ page }) => {
  const scripts: { url: string; raw: number; gzip: number }[] = [];
  const pending: Promise<void>[] = [];
  page.on("response", response => {
    if (response.request().resourceType() !== "script") return;
    pending.push(response.body().then(body => { scripts.push({ url: new URL(response.url()).pathname, raw: body.length, gzip: gzipSync(body).length }); }));
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(lab(page).locator(".morph-button")).toBeEnabled();
  await Promise.all(pending);
  const total = scripts.reduce((sum, script) => ({ raw: sum.raw + script.raw, gzip: sum.gzip + script.gzip }), { raw: 0, gzip: 0 });
  const kib = (bytes: number) => `${(bytes / 1024).toFixed(1)} KiB`;
  test.info().annotations.push({ type: "initial JS", description: `${scripts.length} scripts, ${kib(total.raw)} raw, ${kib(total.gzip)} gzip (Node zlib default level)` });
  await test.info().attach("scripts.json", { body: JSON.stringify({ total, scripts }, null, 1), contentType: "application/json" });
  expect(scripts.length).toBeGreaterThan(0);
});

test("records a frame-timing sample over 10 morphs", async ({ page }) => {
  await page.goto("/");
  await expect(lab(page).locator(".morph-button")).toBeEnabled();
  const sample = await page.evaluate(async () => {
    const longTasks: number[] = [];
    const observer = new PerformanceObserver(list => list.getEntries().forEach(entry => longTasks.push(entry.duration)));
    observer.observe({ type: "longtask", buffered: false });
    const intervals: number[] = [];
    const firstChange: number[] = [];
    const stage = document.querySelector(".lab-stage")!;
    for (let run = 0; run < 10; run++) {
      const surface = document.querySelector<HTMLElement>('.shared-part[data-part="surface"]')!;
      const before = surface.getBoundingClientRect();
      const clicked = performance.now();
      document.querySelector<HTMLButtonElement>(".morph-button")!.click();
      let last = performance.now(), changed = false;
      while (performance.now() - clicked < 1200) {
        const now = await new Promise<number>(requestAnimationFrame);
        intervals.push(now - last);
        last = now;
        const box = document.querySelector<HTMLElement>('.shared-part[data-part="surface"]')!.getBoundingClientRect();
        if (!changed && (Math.abs(box.x - before.x) > .5 || Math.abs(box.width - before.width) > .5)) { changed = true; firstChange.push(now - clicked); }
        if (performance.now() - clicked > 900 && stage.getAttribute("data-travelling") === "false") break;
      }
    }
    observer.disconnect();
    const sorted = [...intervals].sort((a, b) => a - b);
    const at = (fraction: number) => sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))];
    return {
      frames: intervals.length, medianMs: at(.5), p95Ms: at(.95), maxMs: sorted.at(-1)!,
      within20ms: intervals.filter(value => value <= 20).length / intervals.length,
      longTasks: longTasks.length, longestTaskMs: Math.max(0, ...longTasks),
      firstVisibleChangeMs: { median: [...firstChange].sort((a, b) => a - b)[Math.floor(firstChange.length / 2)], max: Math.max(...firstChange), runs: firstChange.length },
      mode: document.querySelector('[data-lab="button"]')!.getAttribute("data-view-mode"),
    };
  });
  const round = (value: number) => Math.round(value * 10) / 10;
  test.info().annotations.push({ type: "frame timing", description: `${sample.frames} frames; interval median ${round(sample.medianMs)} ms, p95 ${round(sample.p95Ms)} ms, max ${round(sample.maxMs)} ms; ${(sample.within20ms * 100).toFixed(1)}% ≤ 20 ms; long tasks ${sample.longTasks} (longest ${round(sample.longestTaskMs)} ms); click to first visible change median ${round(sample.firstVisibleChangeMs.median)} ms, max ${round(sample.firstVisibleChangeMs.max)} ms` });
  await test.info().attach("frame-timing.json", { body: JSON.stringify(sample, null, 1), contentType: "application/json" });
  // Ten morphs from code end in code; every run moved the surface.
  expect(sample.mode).toBe("code");
  expect(sample.firstVisibleChangeMs.runs).toBe(10);
});

// ---- Hero and load stability (SPEC R01) ----


// First-load JavaScript measured on 8 November 2026 before the performance pass (production build, six scripts).
// The brief allows 10% growth: this is a guard on that, not a general budget.
const baseline = { raw: 636_997, gzip: 194_225 };

test("first-load JavaScript stays within 10% of the recorded baseline", async ({ page }) => {
  const scripts: { raw: number; gzip: number }[] = [];
  const pending: Promise<void>[] = [];
  page.on("response", response => {
    if (response.request().resourceType() !== "script") return;
    pending.push(response.body().then(body => { scripts.push({ raw: body.length, gzip: gzipSync(body).length }); }).catch(() => {}));
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await Promise.all(pending);
  const total = scripts.reduce((sum, script) => ({ raw: sum.raw + script.raw, gzip: sum.gzip + script.gzip }), { raw: 0, gzip: 0 });
  test.info().annotations.push({ type: "initial JS", description: `${total.raw} raw, ${total.gzip} gzip (baseline ${baseline.raw} / ${baseline.gzip})` });
  expect(total.raw).toBeLessThanOrEqual(baseline.raw * 1.1);
  expect(total.gzip).toBeLessThanOrEqual(baseline.gzip * 1.1);
});

// Layout shift, Largest Contentful Paint and Total Blocking Time (long tasks after first paint), read in the page.
const observe = () => {
  const m = { lcp: 0, cls: 0, fcp: 0, tasks: [] as [number, number][] };
  (window as unknown as { __m: typeof m }).__m = m;
  new PerformanceObserver(list => list.getEntries().forEach(entry => { m.lcp = entry.startTime; })).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver(list => list.getEntries().forEach(entry => { const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }; if (!shift.hadRecentInput) m.cls += shift.value; })).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver(list => list.getEntries().forEach(entry => m.tasks.push([entry.startTime, entry.duration]))).observe({ type: "longtask", buffered: true });
  new PerformanceObserver(list => list.getEntries().forEach(entry => { if (entry.name === "first-contentful-paint") m.fcp = entry.startTime; })).observe({ type: "paint", buffered: true });
};
const read = (page: import("@playwright/test").Page) => page.evaluate(() => {
  const m = (window as unknown as { __m: { lcp: number; cls: number; fcp: number; tasks: [number, number][] } }).__m;
  return { lcp: Math.round(m.lcp), fcp: Math.round(m.fcp), cls: m.cls, tbt: Math.round(m.tasks.filter(([start]) => start >= m.fcp).reduce((sum, [, duration]) => sum + Math.max(0, duration - 50), 0)) };
});

for (const { width, height } of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  for (const configured of [true, false]) {
    test(`${width} × ${height}, ${configured ? "configured" : "not configured"}: no layout shift on load; LCP and TBT are recorded`, async ({ page }, info) => {
      await page.setViewportSize({ width, height });
      await mockGenerate(page, { configured });
      await page.addInitScript(observe);
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.locator(".hero-fade")).toHaveCount(1);
      await page.waitForTimeout(1200); // late shifts count too
      const metrics = await read(page);
      info.annotations.push({ type: "metrics", description: JSON.stringify(metrics) });
      await info.attach("web-vitals.json", { body: JSON.stringify(metrics, null, 1), contentType: "application/json" });
      expect(metrics.cls).toBe(0);
      expect(metrics.lcp).toBeGreaterThan(0);
    });
  }
}

test("almost no layout shift when the fonts arrive late (the fallbacks are size-adjusted and the title stays on one line)", async ({ page }) => {
  await page.route("**/*.woff2", async route => { await new Promise(resolve => setTimeout(resolve, 600)); await route.continue(); });
  await mockGenerate(page, { configured: true });
  await page.addInitScript(observe);
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator(".hero-fade")).toHaveCount(1);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  // Nothing changes line count or height. What remains is a few pixels of width on the suggestion chips when the
  // text face swaps (0.0001 measured), so this one is bounded rather than exactly zero; a normal load is exactly 0.
  expect((await read(page)).cls).toBeLessThan(0.001);
});

test("the display and text fonts are preloaded and ready before the hero is used", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const preloaded = await page.locator('link[rel="preload"][as="font"]').evaluateAll(links => links.map(link => (link as HTMLLinkElement).href));
  expect(preloaded.length).toBeGreaterThanOrEqual(3);
  const state = await page.evaluate(async () => {
    await document.fonts.ready;
    const family = getComputedStyle(document.querySelector(".opening-title")!).fontFamily.split(",")[0].replace(/"/g, "").trim();
    const faces = [...document.fonts].filter(face => face.family.replace(/"/g, "") === family).map(face => `${face.style}:${face.status}`);
    const fetched = performance.getEntriesByType("resource").filter(entry => entry.name.endsWith(".woff2")).map(entry => ({ initiator: (entry as PerformanceResourceTiming).initiatorType }));
    return { family, faces, fetched };
  });
  expect(state.family).toMatch(/Instrument Serif/);
  expect(state.faces).toContain("normal:loaded");
  // Every font file was requested by a preload link, not discovered late through CSS.
  expect(state.fetched.length).toBeGreaterThan(0);
  expect(state.fetched.every(entry => entry.initiator === "link")).toBe(true);
});
