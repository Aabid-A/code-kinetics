import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { templates } from "../src/lib/lab/templates";
import type { TemplateId, ViewMode } from "../src/lib/lab/types";
import { measureContrast, type ContrastSample } from "./contrast";

const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" || /hydration/i.test(message.text())) errors.push(message.text()); });
});
test.afterEach(async ({ page }) => { expect(browserErrors.get(page)).toEqual([]); });

const states = (["button", "toast", "bento"] as const).flatMap(id => (["code", "rendered"] as const).map(mode => ({ id, mode })));

async function reach(page: Page, id: TemplateId, mode: ViewMode) {
  await page.goto("/");
  await expect(page.locator(".morph-button")).toBeEnabled();
  if (id !== "button") {
    await page.getByRole("button", { name: /^Example:/ }).click();
    await page.getByRole("option", { name: templates[id].label, exact: true }).click();
  }
  if (mode === "rendered") await page.locator(".morph-button").click();
  await expect(page.locator("main")).toHaveAttribute("data-template", id);
  await expect(page.locator("main")).toHaveAttribute("data-view-mode", mode);
  await expect(page.locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
  await expect(page.locator(".preview-instruction")).toHaveCSS("opacity", mode === "code" ? "1" : "0");
  for (const part of templates[id].parts) await expect(page.locator(`[data-shared-id="${id}:${part.key}"]`)).toHaveAttribute("data-endpoint", mode);
  // Let the short opacity fades on lettering and glass finish before reading colours.
  await page.waitForTimeout(400);
}

const failing = (samples: ContrastSample[]) => samples.filter(sample => sample.ratio < sample.required)
  .map(sample => `${sample.ratio}:1 < ${sample.required}:1 ${sample.kind} ${sample.selector} "${sample.text}"`);

for (const { id, mode } of states) {
  test(`${id} / ${mode}: axe scan has no violations`, async ({ page }, info) => {
    await reach(page, id, mode);
    const results = await new AxeBuilder({ page }).analyze();
    await info.attach("axe.json", { body: JSON.stringify({ violations: results.violations, incomplete: results.incomplete }, null, 1), contentType: "application/json" });
    expect(results.violations.map(violation => `${violation.id}: ${violation.nodes.map(node => node.target.join(" ")).join(", ")}`)).toEqual([]);
  });

  test(`${id} / ${mode}: text and indicators meet contrast on the composited background`, async ({ page }, info) => {
    await reach(page, id, mode);
    const samples = await measureContrast(page);
    await info.attach("contrast.json", { body: JSON.stringify(samples, null, 1), contentType: "application/json" });
    expect(samples.filter(sample => sample.kind !== "indicator").length).toBeGreaterThan(10);
    expect(samples.some(sample => sample.text === "marker")).toBe(true);
    expect(samples.some(sample => sample.text === "focus")).toBe(true);
    expect(failing(samples)).toEqual([]);
  });
}

test("the contrast measurement detects a known low-contrast control", async ({ page }) => {
  await reach(page, "button", "code");
  await page.evaluate(() => {
    const control = document.createElement("p");
    control.textContent = "control text";
    control.style.cssText = "position:absolute;top:400px;left:400px;background:#888;color:#777;font-size:14px;z-index:99";
    document.body.append(control);
  });
  const control = (await measureContrast(page)).find(sample => sample.text === "control text")!;
  // #777777 on #888888 is 1.26:1 by the WCAG formula.
  expect(control.ratio).toBeCloseTo(1.26, 2);
});

test.describe("forced colors", () => {
  test.use({ colorScheme: "dark" });

  for (const mode of ["code", "rendered"] as const) {
    test(`${mode}: system colours replace decoration; markers, borders and focus stay visible`, async ({ page }, info) => {
      await page.emulateMedia({ forcedColors: "active" });
      await reach(page, "toast", mode);
      expect(await page.evaluate(() => matchMedia("(forced-colors: active)").matches)).toBe(true);
      await expect(page.locator("body")).toHaveCSS("background-image", "none");

      // The checked View option is distinguishable from the unchecked one by more than colour of text alone.
      const radios = await page.locator(".mode-option").evaluateAll(options => options.map(option => {
        const style = getComputedStyle(option);
        return { checked: option.getAttribute("aria-checked") === "true", background: style.backgroundColor, outline: style.outlineStyle };
      }));
      const checked = radios.find(radio => radio.checked)!, unchecked = radios.find(radio => !radio.checked)!;
      expect(checked.background).not.toBe(unchecked.background);
      expect(checked.outline).toBe("solid");

      // Every mapped piece keeps a visible marker outline that takes no layout space and does not cover its text.
      const markers = await page.locator(".shared-part").evaluateAll(parts => parts.map(part => {
        const style = getComputedStyle(part);
        // Surfaces hold no text of their own (text and icons are separate pieces), so their inset edge cannot cover glyphs.
        const clearOfText = part.getAttribute("data-kind") === "surface" || parseFloat(style.outlineOffset) >= 1;
        return style.outlineStyle === "solid" && parseFloat(style.outlineWidth) >= 1 && clearOfText && parseFloat(style.borderTopWidth) === 0;
      }));
      expect(markers.length).toBeGreaterThan(0);
      expect(markers.every(Boolean)).toBe(true);

      // Pills, the View group and panes keep an explicit border.
      for (const selector of [".pill", ".mode-options", ".pane-ground"]) {
        const borders = await page.locator(selector).evaluateAll(elements => elements.map(element => {
          const style = getComputedStyle(element);
          return style.borderTopStyle !== "none" && parseFloat(style.borderTopWidth) >= 1;
        }));
        expect(borders.length, selector).toBeGreaterThan(0);
        expect(borders.every(Boolean), selector).toBe(true);
      }

      // A keyboard-focused control shows a visible outline in a system colour.
      await page.locator(".morph-button").focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await expect(page.locator(".morph-button")).toBeFocused();
      const outline = await page.locator(".morph-button").evaluate(element => {
        const style = getComputedStyle(element);
        return { style: style.outlineStyle, width: parseFloat(style.outlineWidth), color: style.outlineColor, matches: element.matches(":focus-visible") };
      });
      expect(outline).toMatchObject({ style: "solid", matches: true });
      expect(outline.width).toBeGreaterThanOrEqual(2);
      await page.locator(".morph-button").blur();

      const samples = await measureContrast(page);
      await info.attach("forced-colors-contrast.json", { body: JSON.stringify(samples, null, 1), contentType: "application/json" });
      expect(failing(samples)).toEqual([]);
    });
  }
});
