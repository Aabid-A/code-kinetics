import { expect, test, type Page } from "@playwright/test";

const browserErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  browserErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" || /hydration/i.test(message.text())) errors.push(message.text()); });
});
test.afterEach(async ({ page }) => { expect(browserErrors.get(page)).toEqual([]); });

test("Sound on and a mode-changing Morph: the cue loads and play() is called once", async ({ page }) => {
  // Observe the lab's audio element and every play() call without changing their behaviour.
  await page.addInitScript(() => {
    const probe = { elements: [] as HTMLAudioElement[], plays: [] as { src: string; outcome: string }[] };
    const NativeAudio = window.Audio;
    window.Audio = class extends NativeAudio {
      constructor(src?: string) { super(src); probe.elements.push(this); }
    } as typeof Audio;
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      const entry = { src: this.currentSrc || this.src, outcome: "pending" };
      probe.plays.push(entry);
      const result = play.call(this);
      result.then(() => { entry.outcome = "resolved"; }, (error: Error) => { entry.outcome = `rejected: ${error.name}`; });
      return result;
    };
    Object.assign(window, { soundProbe: probe });
  });
  type Probe = { elements: { readyState: number; src: string }[]; plays: { src: string; outcome: string }[] };
  const probe = () => page.evaluate(() => {
    const value = (window as unknown as { soundProbe: { elements: HTMLAudioElement[]; plays: { src: string; outcome: string }[] } }).soundProbe;
    return { elements: value.elements.map(element => ({ readyState: element.readyState, src: element.src })), plays: [...value.plays.map(play => ({ ...play }))] } as Probe;
  });

  await page.goto("/");
  await expect(page.locator(".morph-button")).toBeEnabled();
  const responses: number[] = [];
  page.on("response", response => { if (response.url().endsWith("/audio/morph.mp3")) responses.push(response.status()); });

  await page.getByRole("button", { name: "Sound" }).click();
  await expect(page.getByRole("button", { name: "Sound" })).toHaveAttribute("aria-pressed", "true");
  // The cue loads (no 404) and becomes playable.
  await expect.poll(async () => (await probe()).elements.at(-1)?.readyState ?? 0).toBeGreaterThanOrEqual(2);
  expect(responses.length).toBeGreaterThan(0);
  expect(responses.every(status => status === 200 || status === 206 || status === 304)).toBe(true);
  expect((await probe()).plays).toEqual([]); // enabling sound plays no preview cue

  await page.locator(".morph-button").click();
  await expect(page.locator("main")).toHaveAttribute("data-view-mode", "rendered");
  await expect.poll(async () => (await probe()).plays.length).toBe(1);
  const [played] = (await probe()).plays;
  expect(new URL(played.src).pathname).toBe("/audio/morph.mp3");
  await expect.poll(async () => (await probe()).plays[0].outcome).not.toBe("pending");
  await test.info().attach("play-outcome.txt", { body: (await probe()).plays[0].outcome, contentType: "text/plain" });
  await expect(page.locator(".sound-note")).toHaveCount(0);
  await expect(page.locator(".lab-stage")).toHaveAttribute("data-travelling", "false");
  // Exactly one call for one mode-changing activation, and none afterwards.
  await page.waitForTimeout(500);
  expect((await probe()).plays.length).toBe(1);
});
