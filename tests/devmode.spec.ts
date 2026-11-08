import { spawn, type ChildProcess } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

// Development-mode checks run against `next dev`, where React Strict Mode (reactStrictMode: true) double-invokes
// effects. This spec starts its own dev server with LAB_FIXTURES=1 so the two-lab fixture route exists. `next dev`
// rewrites next-env.d.ts to point at .next/dev; the original content is restored when the server stops.
const root = join(__dirname, "..");
const port = 4175;
const origin = `http://127.0.0.1:${port}`;
let server: ChildProcess | undefined;
let nextEnv = "";

test.beforeAll(async ({}, info) => {
  info.setTimeout(180_000);
  nextEnv = readFileSync(join(root, "next-env.d.ts"), "utf8");
  server = spawn("npx", ["next", "dev", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: root, env: { ...process.env, LAB_FIXTURES: "1" }, detached: true, stdio: "ignore",
  });
  for (const path of ["/", "/fixtures/two-labs"]) {
    for (let attempt = 0; ; attempt++) {
      const status = await fetch(`${origin}${path}`).then(response => response.status, () => 0);
      if (status === 200) break;
      if (attempt > 170) throw new Error(`dev server did not serve ${path}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});
test.afterAll(async () => {
  if (server?.pid) { try { process.kill(-server.pid, "SIGTERM"); } catch { /* already stopped */ } }
  await new Promise(resolve => setTimeout(resolve, 1000));
  writeFileSync(join(root, "next-env.d.ts"), nextEnv);
});

const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" || /hydration|warning:/i.test(message.text())) errors.push(message.text()); });
  // Track the lab's own resources, so the Next dev client's observers and listeners cannot affect the counts:
  // - the lab's flight-cancel function is the one listener registered for resize, scroll AND visibilitychange;
  // - the lab's ResizeObserver is the one that observes .code-content.
  await page.addInitScript(() => {
    const ever = new Map<string, Set<unknown>>(), live = new Map<string, Set<unknown>>();
    const at = (map: Map<string, Set<unknown>>, id: string) => { if (!map.has(id)) map.set(id, new Set()); return map.get(id)!; };
    for (const [target, name] of [[window, "window"], [document, "document"]] as const) {
      const add = target.addEventListener.bind(target), remove = target.removeEventListener.bind(target);
      target.addEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => {
        at(ever, `${name}:${type}`).add(listener);
        at(live, `${name}:${type}`).add(listener);
        return add(type, listener, options);
      };
      target.removeEventListener = (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => {
        live.get(`${name}:${type}`)?.delete(listener);
        return remove(type, listener, options);
      };
    }
    const labObservers: { live: boolean }[] = [];
    const Native = window.ResizeObserver;
    window.ResizeObserver = class extends Native {
      record?: { live: boolean };
      observe(target: Element, options?: ResizeObserverOptions) {
        if (target.classList.contains("code-content") && !this.record) { this.record = { live: true }; labObservers.push(this.record); }
        super.observe(target, options);
      }
      disconnect() { if (this.record) this.record.live = false; super.disconnect(); }
    };
    const cancelFlight = (map: Map<string, Set<unknown>>) => [...at(map, "window:resize")]
      .filter(listener => at(map, "window:scroll").has(listener) && at(map, "document:visibilitychange").has(listener)).length;
    Object.assign(window, {
      labProbe: () => ({
        observers: { created: labObservers.length, live: labObservers.filter(record => record.live).length },
        cancelFlight: { registered: cancelFlight(ever), live: cancelFlight(live) },
      }),
    });
  });
});
test.afterEach(async ({ page }) => { expect(browserErrors.get(page)).toEqual([]); });

type Probe = { observers: { created: number; live: number }; cancelFlight: { registered: number; live: number } };
const probe = (page: Page) => page.evaluate(() => (window as unknown as { labProbe: () => Probe }).labProbe());

async function settled(lab: Locator, template: string, mode: "code" | "rendered") {
  await expect(lab.locator("main")).toHaveAttribute("data-template", template);
  await expect(lab.locator("main")).toHaveAttribute("data-view-mode", mode);
  await expect(lab.locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
}

test("Strict Mode in development: one live set of listeners and observers per lab, and the lab works", async ({ page }) => {
  await page.goto(`${origin}/`);
  await expect(page.locator(".morph-button")).toBeEnabled();
  const one = await probe(page);
  await page.goto(`${origin}/fixtures/two-labs`);
  await expect(page.locator(".morph-button")).toHaveCount(2);
  for (const button of await page.locator(".morph-button").all()) await expect(button).toBeEnabled();
  const two = await probe(page);

  // Strict Mode ran: each lab's effect mounted twice (two observers and two flight-cancel registrations per lab),
  // and the first mount was fully cleaned up, leaving exactly one live observer and one live set of listeners per lab.
  expect(one).toEqual({ observers: { created: 2, live: 1 }, cancelFlight: { registered: 2, live: 1 } });
  expect(two).toEqual({ observers: { created: 4, live: 2 }, cancelFlight: { registered: 4, live: 2 } });

  // The lab still behaves in development: morph both ways, rapid input, template change, and no late updates.
  await page.goto(`${origin}/`);
  const lab = page.locator("body");
  await expect(page.locator(".morph-button")).toBeEnabled();
  await page.locator(".morph-button").click();
  await settled(lab, "button", "rendered");
  for (let index = 0; index < 5; index++) { await page.locator(".morph-button").click(); await page.waitForTimeout(30); }
  await settled(lab, "button", "code");
  await page.getByRole("button", { name: /^Example:/ }).click();
  await page.getByRole("option", { name: "Bento", exact: true }).click();
  await page.locator(".morph-button").click();
  await settled(lab, "bento", "rendered");
  await page.waitForTimeout(2000);
  await settled(lab, "bento", "rendered");
  await expect(page.locator(".shared-part")).toHaveCount(10);
});

test("two lab instances are isolated: morphing one never moves or changes the other", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1900 });
  await page.goto(`${origin}/fixtures/two-labs`);
  const a = page.locator('[data-lab-instance="a"]'), b = page.locator('[data-lab-instance="b"]');
  for (const lab of [a, b]) await expect(lab.locator(".morph-button")).toBeEnabled();
  // Both labs are entirely on screen, so both use spatial travel rather than the offscreen fallback.
  expect(await page.evaluate(() => [...document.querySelectorAll(".code-content, .preview-content")].every(element => {
    const box = element.getBoundingClientRect();
    return box.top >= 0 && box.bottom <= innerHeight;
  }))).toBe(true);

  const watch = (still: string, moving: string) => page.evaluate(async ({ still, moving }) => {
    const parts = () => [...document.querySelectorAll<HTMLElement>(`[data-lab-instance="${still}"] .shared-part`)].map(element => element.getBoundingClientRect());
    const stage = (name: string) => document.querySelector(`[data-lab-instance="${name}"] .lab-stage`)!;
    const start = parts();
    let drift = 0, otherTravelled = false, movingTravelled = false;
    const began = performance.now();
    while (performance.now() - began < 1000) {
      await new Promise(requestAnimationFrame);
      parts().forEach((box, index) => { drift = Math.max(drift, Math.abs(box.x - start[index].x), Math.abs(box.y - start[index].y)); });
      otherTravelled ||= stage(still).getAttribute("data-travelling") === "true";
      movingTravelled ||= stage(moving).getAttribute("data-travelling") === "true";
    }
    return { drift, otherTravelled, movingTravelled };
  }, { still, moving });

  let sampling = watch("b", "a");
  await a.locator(".morph-button").click();
  expect(await sampling).toEqual({ drift: 0, otherTravelled: false, movingTravelled: true });
  await settled(a, "button", "rendered");
  await settled(b, "button", "code");

  sampling = watch("a", "b");
  await b.locator(".morph-button").click();
  expect(await sampling).toEqual({ drift: 0, otherTravelled: false, movingTravelled: true });
  await settled(b, "button", "rendered");
  await settled(a, "button", "rendered");

  // A template change in one lab leaves the other's template, mode and pieces alone.
  await a.getByRole("button", { name: /^Example:/ }).click();
  await a.getByRole("option", { name: "Toast", exact: true }).click();
  await settled(a, "toast", "code");
  await settled(b, "button", "rendered");
  // Within each lab, one live owner per shared identity.
  for (const [lab, template, keys] of [[a, "toast", 4], [b, "button", 3]] as const) {
    const ids = await lab.locator(".shared-part").evaluateAll(parts => parts.map(part => part.getAttribute("data-shared-id")));
    expect(ids.length).toBe(keys);
    expect(new Set(ids).size).toBe(keys);
    expect(ids.every(id => id?.startsWith(`${template}:`))).toBe(true);
  }
});
