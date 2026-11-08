import { gzipSync } from "node:zlib";
import { lab } from "./lab";
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
