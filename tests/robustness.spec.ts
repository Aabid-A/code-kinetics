import { expect, test, type Page } from "@playwright/test";
import { lab } from "./lab";
import { templates } from "../src/lib/lab/templates";
import type { TemplateId as AnyTemplateId, ViewMode } from "../src/lib/lab/types";

type TemplateId = Exclude<AnyTemplateId, "custom">; // the fixed examples

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

// Every chapter lab is independent, so a step names the lab it acts on. Steps run with real browser events.
type Step = "sound" | `morph:${TemplateId}` | `radio:${ViewMode}:${TemplateId}`;
type Final = { modes: Record<TemplateId, ViewMode>; sound: boolean };
const code: Final["modes"] = { button: "code", toast: "code", bento: "code" };

async function perform(page: Page, step: Step) {
  if (step === "sound") { await page.getByRole("button", { name: "Sound" }).click(); return; }
  const [kind, ...rest] = step.split(":");
  if (kind === "morph") await lab(page, rest[0] as TemplateId).locator(".morph-button").click();
  else await lab(page, rest[1] as TemplateId).getByRole("radio", { name: rest[0] === "code" ? "Code" : "Component", exact: true }).click();
}

async function expectFinal(page: Page, { modes, sound }: Final) {
  await expect(page.getByRole("button", { name: "Sound" })).toHaveAttribute("aria-pressed", String(sound));
  for (const template of ["button", "toast", "bento"] as const) {
    const mode = modes[template], chapter = lab(page, template);
    await expect(chapter).toHaveAttribute("data-template", template);
    await expect(chapter).toHaveAttribute("data-view-mode", mode);
    await expect(chapter.locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
    await expect(chapter.getByRole("radio", { name: mode === "code" ? "Code" : "Component", exact: true })).toHaveAttribute("aria-checked", "true");
    await expect(chapter.locator(".morph-button")).toHaveText(mode === "code" ? "Morph to component" : "Morph to code");
    // One live owner per shared identity, at the requested endpoint; no lingering node from an old run.
    await expect(chapter.locator(".shared-part")).toHaveCount(templates[template].parts.length);
    for (const part of templates[template].parts) {
      await expect(chapter.locator(`[data-shared-id="${template}:${part.key}"]`)).toHaveAttribute("data-endpoint", mode);
    }
  }
}

// QA.md Q07: the sequences not covered by button.spec.ts and templates.spec.ts.
const sequences: { name: string; steps: Step[]; final: Final; watched: TemplateId }[] = [
  { name: "Morph Button × 5", steps: Array(5).fill("morph:button"), final: { modes: { ...code, button: "rendered" }, sound: false }, watched: "button" },
  { name: "Component radio → Code radio → Component radio", steps: ["radio:rendered:button", "radio:code:button", "radio:rendered:button"], final: { modes: { ...code, button: "rendered" }, sound: false }, watched: "button" },
  { name: "Morph Button → Morph Toast", steps: ["morph:button", "morph:toast"], final: { modes: { ...code, button: "rendered", toast: "rendered" }, sound: false }, watched: "toast" },
  { name: "Morph Toast → Morph Bento → Morph Toast", steps: ["morph:toast", "morph:bento", "morph:toast"], final: { modes: { ...code, bento: "rendered" }, sound: false }, watched: "toast" },
  { name: "Sound on → Morph Toast → Morph Bento → Morph Toast", steps: ["sound", "morph:toast", "morph:bento", "morph:toast"], final: { modes: { ...code, bento: "rendered" }, sound: true }, watched: "toast" },
  { name: "Morph Bento × 3", steps: Array(3).fill("morph:bento"), final: { modes: { ...code, bento: "rendered" }, sound: false }, watched: "bento" },
];

for (const { name, steps, final, watched } of sequences) {
  for (const spacing of [100, 30]) {
    test(`Q07 ${name} at ${spacing} ms spacing ends as requested / ${final.sound ? "sound on" : "silent"}`, async ({ page }) => {
      await page.goto("/");
      await expect(lab(page).locator(".morph-button")).toBeEnabled();
      const statuses: string[] = [];
      await page.exposeFunction("recordStatus", (text: string) => { statuses.push(text); });
      await page.evaluate(id => {
        const status = document.querySelector(`[data-lab="${id}"] [role="status"]`)!;
        new MutationObserver(() => (window as unknown as { recordStatus: (text: string) => void }).recordStatus(status.textContent ?? ""))
          .observe(status, { childList: true, characterData: true, subtree: true });
      }, watched);
      for (const step of steps) {
        await perform(page, step);
        await page.waitForTimeout(spacing);
      }
      await expectFinal(page, final);
      // Two more seconds catch stale callbacks or a queued replay restoring an older state.
      await page.waitForTimeout(2000);
      await expectFinal(page, final);
      // The watched lab's live region settles on its latest view and was not flooded with one message per input.
      const latest = `${templates[watched].label}: ${final.modes[watched] === "code" ? "code" : "component"} view selected.`;
      await expect(lab(page, watched).getByRole("status")).toHaveText(latest);
      const own = steps.filter(step => step.endsWith(`:${watched}`)).length;
      expect(statuses.filter(text => text.endsWith("view selected.")).length).toBeLessThanOrEqual(own);
      expect(statuses.filter(text => text.endsWith("view selected.")).at(-1)).toBe(latest);
    });
  }
}

test("blocked storage: the lab loads, works and reloads to the default state without any storage", async ({ page }) => {
  // Simulate a browser that blocks site storage: every storage API throws, as browsers do when storage is denied.
  await page.addInitScript(() => {
    const deny = () => { throw new DOMException("The operation is insecure.", "SecurityError"); };
    for (const name of ["localStorage", "sessionStorage", "indexedDB", "caches"] as const) {
      Object.defineProperty(window, name, { configurable: true, get: deny });
    }
    Object.defineProperty(Document.prototype, "cookie", { configurable: true, get: deny, set: deny });
  });
  await page.context().clearCookies();
  await page.goto("/");
  expect(await page.evaluate(() => { try { void localStorage; return "available"; } catch { return "blocked"; } })).toBe("blocked");
  await expect(lab(page).locator(".morph-button")).toBeEnabled();
  await expectFinal(page, { modes: code, sound: false });
  await perform(page, "morph:bento");
  await perform(page, "sound");
  await expectFinal(page, { modes: { ...code, bento: "rendered" }, sound: true });
  // Nothing is persisted: a reload returns the exact default state.
  await page.reload();
  await expect(lab(page).locator(".morph-button")).toBeEnabled();
  await expectFinal(page, { modes: code, sound: false });
});
