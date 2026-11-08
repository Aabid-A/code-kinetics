import { expect, test, type Page } from "@playwright/test";
import { templates } from "../src/lib/lab/templates";
import type { TemplateId, ViewMode } from "../src/lib/lab/types";

// public/audio/morph.mp3 is intentionally absent, so turning Sound on logs that one 404; every other error fails.
const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.location().url.endsWith("/audio/morph.mp3")) return;
    if (message.type() === "error" || /hydration/i.test(message.text())) errors.push(message.text());
  });
});
test.afterEach(async ({ page }) => { expect(browserErrors.get(page)).toEqual([]); });

type Step = "morph" | "sound" | "radio:Code" | "radio:Component" | `select:${TemplateId}`;
type Final = { template: TemplateId; mode: ViewMode; sound: boolean };

async function perform(page: Page, step: Step) {
  if (step === "morph") await page.locator(".morph-button").click();
  else if (step === "sound") await page.getByRole("button", { name: "Sound" }).click();
  else if (step.startsWith("radio:")) await page.getByRole("radio", { name: step.slice(6), exact: true }).click();
  else {
    await page.getByRole("button", { name: /^Example:/ }).click();
    await page.getByRole("option", { name: templates[step.slice(7) as TemplateId].label, exact: true }).click();
  }
}

async function expectFinal(page: Page, { template, mode, sound }: Final) {
  await expect(page.locator("main")).toHaveAttribute("data-template", template);
  await expect(page.locator("main")).toHaveAttribute("data-view-mode", mode);
  await expect(page.locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
  await expect(page.getByRole("button", { name: "Sound" })).toHaveAttribute("aria-pressed", String(sound));
  await expect(page.getByRole("radio", { name: mode === "code" ? "Code" : "Component", exact: true })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("button", { name: /^Example:/ })).toHaveText(`Example: ${templates[template].label}`);
  await expect(page.locator(".morph-button")).toHaveText(mode === "code" ? "Morph to component" : "Morph to code");
  // One live owner per shared identity, at the requested endpoint; no lingering node from an old run or template.
  await expect(page.locator(".shared-part")).toHaveCount(templates[template].parts.length);
  for (const part of templates[template].parts) {
    await expect(page.locator(`[data-shared-id="${template}:${part.key}"]`)).toHaveAttribute("data-endpoint", mode);
  }
}

// QA.md Q07: the sequences not covered by button.spec.ts and templates.spec.ts. Real browser events, no waiting
// for animations between steps.
const sequences: { name: string; steps: Step[]; final: Final }[] = [
  { name: "Morph × 5", steps: ["morph", "morph", "morph", "morph", "morph"], final: { template: "button", mode: "rendered", sound: false } },
  { name: "Component radio → Code radio → Component radio", steps: ["radio:Component", "radio:Code", "radio:Component"], final: { template: "button", mode: "rendered", sound: false } },
  { name: "Morph → select Toast", steps: ["morph", "select:toast"], final: { template: "toast", mode: "code", sound: false } },
  { name: "Morph → select Toast → Morph → select Bento", steps: ["morph", "select:toast", "morph", "select:bento"], final: { template: "bento", mode: "code", sound: false } },
  { name: "Sound on → Morph → select Toast → Morph", steps: ["sound", "morph", "select:toast", "morph"], final: { template: "toast", mode: "rendered", sound: true } },
  { name: "Select Bento → Morph → select Bento again", steps: ["select:bento", "morph", "select:bento"], final: { template: "bento", mode: "rendered", sound: false } },
];

for (const { name, steps, final } of sequences) {
  for (const spacing of [100, 30]) {
    test(`Q07 ${name} at ${spacing} ms spacing ends ${final.template} / ${final.mode} / ${final.sound ? "sound on" : "silent"}`, async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(".morph-button")).toBeEnabled();
      const statuses: string[] = [];
      await page.exposeFunction("recordStatus", (text: string) => { statuses.push(text); });
      await page.evaluate(() => {
        const status = document.querySelector('[role="status"]')!;
        new MutationObserver(() => (window as unknown as { recordStatus: (text: string) => void }).recordStatus(status.textContent ?? ""))
          .observe(status, { childList: true, characterData: true, subtree: true });
      });
      for (const step of steps) {
        await perform(page, step);
        await page.waitForTimeout(spacing);
      }
      await expectFinal(page, final);
      // Two more seconds catch stale callbacks or a queued replay restoring an older state.
      await page.waitForTimeout(2000);
      await expectFinal(page, final);
      // The live region settles on the latest view and was not flooded with one message per input.
      const latest = `${templates[final.template].label}: ${final.mode === "code" ? "code" : "component"} view selected.`;
      if (!final.sound) await expect(page.getByRole("status")).toHaveText(latest);
      expect(statuses.filter(text => text.endsWith("view selected.")).length).toBeLessThanOrEqual(steps.length);
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
  await expect(page.locator(".morph-button")).toBeEnabled();
  await expectFinal(page, { template: "button", mode: "code", sound: false });
  await perform(page, "select:bento");
  await perform(page, "morph");
  await perform(page, "sound");
  await expectFinal(page, { template: "bento", mode: "rendered", sound: true });
  // Nothing is persisted: a reload returns the exact default state.
  await page.reload();
  await expect(page.locator(".morph-button")).toBeEnabled();
  await expectFinal(page, { template: "button", mode: "code", sound: false });
});
