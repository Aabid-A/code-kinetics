import { expect, test, type Page } from "@playwright/test";
import { bringIntoView, lab as labOf, labScript, pointLabAt, type LabId } from "./lab";

declare const labRoot: () => HTMLElement;
declare const labQ: (selector: string) => HTMLElement | null;
declare const labAll: (selector: string) => HTMLElement[];

// The chapter under test; `choose` switches it, scrolls it into view and points the in-page helpers at it.
let current: LabId = "button";
const lab = (page: Page) => labOf(page, current);
import { sourceFor, templates, validateTemplate, type PartKey } from "../src/lib/lab/templates";
import { transition, type AppState, type TemplateId, type ViewMode } from "../src/lib/lab/types";
import { straddlesDivider, type Box } from "./motion";

type BuiltIn = Exclude<TemplateId, "custom">;
const ids: BuiltIn[] = ["button", "toast", "bento"];
const expectedSources = {
  toast: "<Toast>\n  <CircleCheck />\n  <Title>Changes saved</Title>\n  <Description>\n    Your workspace is up to date.\n  </Description>\n</Toast>",
  bento: "<Bento>\n  <Feature icon={<Layers />}>\n    <Title>Build in layers</Title>\n    <Text>Small pieces. One interface.</Text>\n  </Feature>\n  <Metric>\n    <Value>12</Value>\n    <Label>Components</Label>\n  </Metric>\n  <Status>\n    <Title>Ready to ship</Title>\n    <Text>All pieces in place.</Text>\n  </Status>\n</Bento>",
};
const errors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  current = "button";
  await page.addInitScript(labScript);
  const messages: string[] = [];
  errors.set(page, messages);
  page.on("pageerror", error => messages.push(error.message));
  page.on("console", message => { if (message.type() === "error" || /hydration/i.test(message.text())) messages.push(message.text()); });
});
test.afterEach(async ({ page }) => { expect(errors.get(page)).toEqual([]); });

async function settled(page: Page, id: BuiltIn, mode: ViewMode) {
  await expect(lab(page)).toHaveAttribute("data-template", id);
  await expect(lab(page)).toHaveAttribute("data-view-mode", mode);
  await expect(lab(page).locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
  await expect(lab(page).locator(".preview-instruction")).toHaveCSS("opacity", mode === "code" ? "1" : "0");
  await expect(lab(page).locator(".shared-part")).toHaveCount(templates[id].parts.length);
  for (const part of templates[id].parts) {
    const owner = lab(page).locator(`[data-shared-id="${id}:${part.key}"]`);
    await expect(owner).toHaveCount(1);
    await expect(owner).toHaveAttribute("data-endpoint", mode);
  }
  if (id !== "button") await expect(lab(page).locator(".preview-card-glass").first()).toHaveCSS("opacity", mode === "code" ? "0" : "1");
}


async function choose(page: Page, id: BuiltIn) {
  current = id;
  await pointLabAt(page, id);
  await expect(lab(page).locator(".morph-button")).toBeEnabled();
  await bringIntoView(page, id);
  await settled(page, id, "code");
  await page.evaluate(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
}

test("all authored maps have exact content, unique identities and one source per part", () => {
  expect(templates.button.parts).toHaveLength(3);
  expect(templates.toast.parts.map(part => part.key)).toEqual(["surface", "icon", "title", "description"]);
  expect(templates.bento.parts.map(part => part.key)).toEqual([
    "feature.surface", "feature.icon", "feature.title", "feature.description",
    "metric.surface", "metric.value", "metric.label", "status.surface", "status.title", "status.description",
  ]);
  expect(sourceFor(templates.toast)).toBe(expectedSources.toast);
  expect(sourceFor(templates.bento)).toBe(expectedSources.bento);
  ids.forEach(id => expect(() => validateTemplate(templates[id])).not.toThrow());
  const all = ids.flatMap(id => templates[id].parts.map(part => `${id}:${part.key}`));
  expect(new Set(all).size).toBe(17);
  expect(() => validateTemplate({ ...templates.toast, parts: [...templates.toast.parts, templates.toast.parts[0]] })).toThrow();
});

test("selection resets only a different template and preserves same-template mode", () => {
  for (const activeTemplate of ids) for (const viewMode of ["code", "rendered"] as const) for (const soundEnabled of [false, true]) {
    const state: AppState = { activeTemplate, viewMode, soundEnabled };
    expect(transition(state, { type: "TOGGLE_SOUND" })).toEqual({ ...state, soundEnabled: !soundEnabled });
    for (const id of ids) {
      const next = transition(state, { type: "SELECT_TEMPLATE", id });
      if (id === activeTemplate) expect(next).toBe(state);
      else expect(next).toEqual({ activeTemplate: id, viewMode: "code", soundEnabled });
    }
    expect(transition(transition(state, { type: "MORPH" }), { type: "MORPH" })).toEqual(state);
  }
});
type PartFrame = Box & { key: PartKey; hit: boolean; glyphWidth: number; glyphHeight: number; svgWidth?: number; svgHeight?: number };

for (const id of ["toast", "bento"] as const) {
  test(`${id}: continuous forward/reverse, independent unscaled children and interruption`, async ({ page }, info) => {
    await page.goto("/");
    await choose(page, id);
    await expect(lab(page).locator("pre code")).toHaveText(expectedSources[id]);
    await page.screenshot({ path: info.outputPath(`${id}-desktop-code.png`), fullPage: true });
    const read = () => page.evaluate(() => [...labAll(".shared-part")].map(element => {
      const box = element.getBoundingClientRect();
      return { key: element.dataset.part!, x: box.x, y: box.y, width: box.width, height: box.height };
    }));
    const origins = await read();
    const sample = () => page.evaluate(async () => {
      const frames: { mode: string; parts: PartFrame[] }[] = [];
      const began = performance.now();
      while (performance.now() - began < 1200) {
        await new Promise(requestAnimationFrame);
        const parts = [...labAll(".shared-part")].map(element => {
          const box = element.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(element);
          const glyphs = range.getBoundingClientRect();
          const svg = element.querySelector("svg")?.getBoundingClientRect();
          return { key: element.dataset.part as PartKey, x: box.x, y: box.y, width: box.width, height: box.height,
            hit: document.elementsFromPoint(box.x + box.width / 2, box.y + box.height / 2).includes(element),
            glyphWidth: glyphs.width, glyphHeight: glyphs.height, svgWidth: svg?.width, svgHeight: svg?.height };
        });
        frames.push({ mode: labRoot().getAttribute("data-view-mode")!, parts });
      }
      return frames;
    });
    const forwardSampling = sample();
    await lab(page).locator(".morph-button").click();
    const forward = (await forwardSampling).filter(frame => frame.mode === "rendered");
    await settled(page, id, "rendered");
    await expect(lab(page).locator(".morph-button")).toBeFocused();
    const destinations = await read();
    const stage = await lab(page).locator(".lab-stage").boundingBox();
    const divider = stage!.x + stage!.width / 2;
    for (const part of templates[id].parts) {
      const origin = origins.find(entry => entry.key === part.key)!;
      const target = destinations.find(entry => entry.key === part.key)!;
      const frames = forward.map(frame => frame.parts.find(entry => entry.key === part.key)!);
      expect(frames.some(frame => frame.x > origin.x + 5 && frame.x < target.x - 5)).toBe(true);
      expect(frames.every(frame => frame.hit)).toBe(true);
      if (part.kind === "surface") expect(straddlesDivider(frames, divider)).toBe(true);
      else {
        expect(frames.every(frame => Math.abs(frame.width - target.width) < 1 && Math.abs(frame.height - target.height) < 1)).toBe(true);
        if (part.kind === "icon") expect(frames.every(frame => Math.abs(frame.svgWidth! - 20) < 1 && Math.abs(frame.svgHeight! - 20) < 1)).toBe(true);
        else {
          const end = frames.at(-1)!;
          expect(frames.every(frame => Math.abs(frame.glyphWidth - end.glyphWidth) < 1 && Math.abs(frame.glyphHeight - end.glyphHeight) < 1)).toBe(true);
        }
      }
      const slot = await lab(page).locator(`[data-destination-slot="${part.key}"]`).boundingBox();
      expect(Math.abs(slot!.x - target.x)).toBeLessThan(1);
      expect(Math.abs(slot!.y - target.y)).toBeLessThan(1);
    }
    // Equal spring progress preserves the authored hierarchy without nesting
    // text or icons under a scale-projecting surface. Check every in-flight frame: the spring spends only
    // ~59 ms between 35% and 70% progress, less than one headless frame gap, so one mid-band sample can be missed.
    const progressOf = (frame: (typeof forward)[number]) => frame.parts.map(part => {
      const a = origins.find(entry => entry.key === part.key)!;
      const b = destinations.find(entry => entry.key === part.key)!;
      return (part.x - a.x) / (b.x - a.x);
    });
    const inFlight = forward.map(progressOf).filter(progress => progress[0] > .05 && progress[0] < .95);
    expect(inFlight.length).toBeGreaterThan(0);
    for (const progress of inFlight) expect(Math.max(...progress) - Math.min(...progress)).toBeLessThan(.1);
    expect(await page.evaluate(() => [...labAll('.shared-part[data-kind="surface"]')]
      .every(surface => !surface.querySelector('.shared-part[data-kind="text"], .shared-part[data-kind="icon"]')))).toBe(true);
    await page.screenshot({ path: info.outputPath(`${id}-desktop-rendered.png`), fullPage: true });
    const reverseSampling = sample();
    await lab(page).locator(".morph-button").click();
    const reverse = await reverseSampling;
    await settled(page, id, "code");
    expect(reverse.some(frame => frame.parts.some(part => part.x > origins.find(entry => entry.key === part.key)!.x + 5
      && part.x < destinations.find(entry => entry.key === part.key)!.x - 5))).toBe(true);
    await lab(page).locator(".morph-button").click();
    await page.waitForTimeout(100);
    const { before, after } = await page.evaluate(async () => {
      const boxes = () => [...labAll(".shared-part")].map(element => {
        const b = element.getBoundingClientRect();
        return { key: element.dataset.part!, x: b.x, y: b.y, width: b.width, height: b.height };
      });
      const before = boxes();
      (labQ(".morph-button") as HTMLButtonElement).click();
      await new Promise(requestAnimationFrame);
      return { before, after: boxes() };
    });
    for (const part of after) expect(Math.abs(part.x - before.find(entry => entry.key === part.key)!.x)).toBeLessThan(120);
    await settled(page, id, "code");
    await info.attach(`${id}-motion.json`, { body: JSON.stringify({ origins, destinations, forward, reverse, before, after }), contentType: "application/json" });
  });
}

test("latest request wins within a chapter: Morph then Code in one tick, and the current view is a no-op", async ({ page }) => {
  await page.goto("/");
  await choose(page, "toast");
  await lab(page).locator(".morph-button").click();
  await page.waitForTimeout(100);
  // Morph and the Code radio in the same tick: the later request (Code) wins and the old flight is cancelled.
  await page.evaluate(() => {
    (labQ(".morph-button") as HTMLButtonElement).click();
    (labQ('[role="radio"]') as HTMLButtonElement).click();
  });
  await settled(page, "toast", "code");
  expect(await lab(page).locator(".shared-part").evaluateAll(nodes => nodes.every(node => getComputedStyle(node).transform === "none"))).toBe(true);
  await lab(page).getByRole("radio", { name: "Component", exact: true }).click();
  await settled(page, "toast", "rendered");
  await lab(page).getByRole("radio", { name: "Component", exact: true }).click(); // selecting the current view is a no-op
  await settled(page, "toast", "rendered");
  await page.waitForTimeout(2000);
  await settled(page, "toast", "rendered");
  await choose(page, "button");
  await lab(page).locator(".morph-button").click();
  await settled(page, "button", "rendered");
});

test("Bento responds to exactly 360px of preview content, preserving asymmetric slots and source order", async ({ page }) => {
  await page.goto("/");
  await choose(page, "bento");
  for (const width of [359, 360]) {
    await lab(page).locator(".preview-content").evaluate((element, width) => {
      const style = getComputedStyle(element);
      (element as HTMLElement).style.width = `${width + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)}px`;
    }, width);
    const cards = await lab(page).locator("[data-card]").evaluateAll(nodes => nodes.map(node => {
      const b = node.getBoundingClientRect();
      return { x: b.x, y: b.y, width: b.width, height: b.height };
    }));
    const [feature, metric, status] = cards;
    if (width < 360) {
      expect(feature.x).toBe(metric.x);
      expect(metric.x).toBe(status.x);
      expect(feature.y + feature.height).toBeLessThan(metric.y);
      expect(metric.y + metric.height).toBeLessThan(status.y);
    } else {
      expect(feature.x).toBeLessThan(metric.x);
      expect(feature.y).toBe(metric.y);
      expect(metric.x).toBe(status.x);
      expect(feature.height).toBeCloseTo(metric.height + status.height + 12, 0);
      expect(feature.width / metric.width).toBeCloseTo(1.2, 1);
    }
  }
});

test("all templates fit desktop and mobile with stable endpoint ownership and reduced motion", async ({ page }, info) => {
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewportSize({ width, height: width >= 960 ? 900 : 844 });
    await page.goto("/");
    for (const id of ids) {
      await choose(page, id);
      for (const mode of ["code", "rendered"] as const) {
        if (mode === "rendered") await lab(page).locator(".morph-button").click();
        await settled(page, id, mode);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        if (width === 1440 || width === 390) await page.screenshot({ path: info.outputPath(`${id}-${width}-${mode}.png`), fullPage: true });
      }
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/"); // fresh labs, all in code mode
  for (const id of ids) {
    await choose(page, id);
    await lab(page).locator(".morph-button").click();
    await settled(page, id, "rendered");
    expect(await lab(page).locator(".shared-part").evaluateAll(nodes => nodes.every(node => getComputedStyle(node).transform === "none"))).toBe(true);
  }
});
