import { expect, test } from "@playwright/test";

// These tests provoke failures on purpose, so they do not use the console-error guard of the other specs.

test("Sound unavailable: preference kept, shown and announced once, retried only on a later off-to-on toggle", async ({ page }) => {
  // public/audio/morph.mp3 is intentionally not shipped, so loading the cue fails.
  await page.goto("/");
  const sound = page.getByRole("button", { name: "Sound" });
  const note = page.getByText("Sound unavailable", { exact: true }).first();
  const status = page.getByRole("status");
  await expect(note).toBeHidden();
  await sound.click();
  await expect(page.locator(".sound-note")).toHaveText("Sound unavailable");
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await expect(status).toHaveText("Sound unavailable.");

  // The morph still works silently and does not repeat the notice.
  await page.locator(".morph-button").click();
  await expect(page.locator("main")).toHaveAttribute("data-view-mode", "rendered");
  await expect(page.locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
  await expect(page.locator(".sound-note")).toHaveCount(1);
  await expect(sound).toHaveAttribute("aria-pressed", "true");

  // Turning the preference off clears the notice; turning it on again retries and reports again.
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".sound-note")).toHaveCount(0);
  await sound.click();
  await expect(page.locator(".sound-note")).toHaveText("Sound unavailable");
});

test("an exception in the lab shows the contained error message and a reload button", async ({ page }) => {
  const logged: string[] = [];
  page.on("console", message => { if (message.type() === "error") logged.push(message.text()); });
  // An effect that throws during hydration is caught by the nearest error boundary.
  await page.addInitScript(() => {
    window.ResizeObserver = class { constructor() { throw new Error("injected failure"); } } as unknown as typeof ResizeObserver;
  });
  await page.goto("/");
  await expect(page.locator("main.lab-error")).toContainText("This example could not be displayed. Reload the lab.");
  const reload = page.getByRole("button", { name: "Reload the lab" });
  await expect(reload).toBeVisible();
  await expect(page.locator(".morph-button")).toHaveCount(0);
  expect(logged.some(entry => entry.includes("injected failure"))).toBe(true);
  await Promise.all([page.waitForEvent("load"), reload.click()]);
});
