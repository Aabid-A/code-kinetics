import { expect, test, type Page } from "@playwright/test";
import { lab } from "./lab";

const sound = (page: Page) => page.getByRole("button", { name: "Sound" });
const radio = (page: Page, name: "Code" | "Component") => lab(page).getByRole("radio", { name, exact: true });
async function ready(page: Page) {
  await page.goto("/");
  await expect(lab(page).locator(".morph-button")).toBeEnabled();
}
async function settledMode(page: Page, mode: "code" | "rendered") {
  await expect(lab(page)).toHaveAttribute("data-view-mode", mode);
  await expect(lab(page).locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
}
test("no native select or radio inputs remain in the page", async ({ page }) => {
  await ready(page);
  await expect(lab(page).locator("select, input[type=radio]")).toHaveCount(0);
});

test("View radiogroup: roving tabindex, arrows with wrap, Home/End, Space/Enter and click", async ({ page }) => {
  await ready(page);
  const group = lab(page).getByRole("radiogroup", { name: "View" });
  await expect(group).toBeVisible();
  await expect(radio(page, "Code")).toHaveAttribute("aria-checked", "true");
  await expect(radio(page, "Code")).toHaveAttribute("tabindex", "0");
  await expect(radio(page, "Component")).toHaveAttribute("aria-checked", "false");
  await expect(radio(page, "Component")).toHaveAttribute("tabindex", "-1");

  // Only the selected radio is in the Tab order.
  await lab(page).locator(".morph-button").focus();
  await page.keyboard.press("Shift+Tab");
  await expect(radio(page, "Code")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(group.locator(":focus")).toHaveCount(0);

  await radio(page, "Code").focus();
  await page.keyboard.press("ArrowRight");
  await settledMode(page, "rendered");
  await expect(radio(page, "Component")).toBeFocused();
  await expect(radio(page, "Component")).toHaveAttribute("aria-checked", "true");
  await expect(radio(page, "Component")).toHaveAttribute("tabindex", "0");
  await expect(radio(page, "Code")).toHaveAttribute("tabindex", "-1");
  await page.keyboard.press("ArrowRight"); // wraps
  await settledMode(page, "code");
  await expect(radio(page, "Code")).toBeFocused();
  await page.keyboard.press("ArrowUp"); // wraps backwards
  await settledMode(page, "rendered");
  await page.keyboard.press("Home");
  await settledMode(page, "code");
  await expect(radio(page, "Code")).toBeFocused();
  await page.keyboard.press("End");
  await settledMode(page, "rendered");
  await expect(radio(page, "Component")).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await settledMode(page, "code");

  // Space and Enter select a focused option; click selects directly.
  await radio(page, "Component").focus();
  await page.keyboard.press("Space");
  await settledMode(page, "rendered");
  await radio(page, "Code").focus();
  await page.keyboard.press("Enter");
  await settledMode(page, "code");
  await radio(page, "Component").click();
  await settledMode(page, "rendered");
  await radio(page, "Component").click(); // selecting the current value is a no-op
  await settledMode(page, "rendered");
  await expect(lab(page)).toHaveAttribute("data-template", "button");
});

test("Sound pill: name, aria-pressed, labels, keys", async ({ page }) => {
  await ready(page);
  const pill = sound(page);
  await expect(pill).toHaveAttribute("aria-pressed", "false");
  await expect(pill).toContainText("Sound off");
  await pill.focus();
  await page.keyboard.press("Enter");
  await expect(pill).toHaveAttribute("aria-pressed", "true");
  await expect(pill).toContainText("Sound on");
  await page.keyboard.press("Space");
  await expect(pill).toHaveAttribute("aria-pressed", "false");
  await expect(pill).toContainText("Sound off");
  await expect(pill.locator("svg")).toHaveCount(1);
});

test("custom controls have 44px targets and stay usable at 390px", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await ready(page);
    for (const control of [sound(page), radio(page, "Code"), radio(page, "Component"), lab(page).locator(".morph-button")]) {
      const box = await control.boundingBox();
      expect(box!.height).toBeGreaterThanOrEqual(44);
      expect(box!.width).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
