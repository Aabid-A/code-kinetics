import { test } from "@playwright/test";

// TEMPORARY: measures what moves by 12 px on the CI browser. Remove once the cause is fixed.
test("ci diagnostic: what moves when the Button lab morphs", async ({ page }) => {
  await page.goto("/");
  const lab = page.locator('[data-lab="button"]').first();
  await lab.locator(".morph-button").waitFor();
  await page.waitForFunction(() => !document.querySelector('[data-lab="button"] .morph-button')?.hasAttribute("disabled"));
  const measure = () => page.evaluate(() => {
    const root = document.querySelector('[data-lab="button"]')!;
    const box = (selector: string) => {
      const element = root.querySelector(selector) as HTMLElement | null;
      if (!element) return null;
      const r = element.getBoundingClientRect();
      return `${Math.round(r.y * 100) / 100}/${Math.round(r.height * 100) / 100}`;
    };
    const button = root.querySelector(".morph-button") as HTMLElement;
    const style = getComputedStyle(button);
    const range = document.createRange(); range.selectNodeContents(button);
    return {
      scrollY: window.scrollY, browser: navigator.userAgent.match(/Chrome\/[\d.]+/)?.[0],
      toolbar: box(".lab-toolbar"), morph: box(".morph-button"), mode: box(".mode-control"), stage: box(".lab-stage"),
      codeLines: box(".code-lines"), sheet: box(".lab-sheet"),
      morphText: button.textContent, morphLineRects: range.getClientRects().length, morphFont: style.fontFamily.split(",")[0],
      morphScrollWidth: button.scrollWidth, morphClientWidth: button.clientWidth,
      fonts: [...document.fonts].filter(font => font.status === "loaded").map(font => font.family).join("|"),
      chapterIndex: (() => { const ci = document.querySelector(".chapter-index") as HTMLElement | null; if (!ci) return null; const r = ci.getBoundingClientRect(); return `${Math.round(r.y)}/${Math.round(r.height)} ${getComputedStyle(ci).visibility}`; })(),
    };
  });
  console.log("DIAG before", JSON.stringify(await measure()));
  await lab.locator(".morph-button").click();
  await page.waitForTimeout(1500);
  console.log("DIAG after ", JSON.stringify(await measure()));
});
