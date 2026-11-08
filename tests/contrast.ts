import type { Page } from "@playwright/test";

// Contrast against the actual composited background, measured in the browser:
// 1. record every visible text run, icon, checked marker and focus ring with its colour and effective opacity;
// 2. hide those foregrounds (nothing else changes) and screenshot the page;
// 3. composite each foreground colour over every background pixel under it and keep the worst ratio.
// Gradients, glass and blur are measured as rendered; nothing is assumed from design tokens.

export type ContrastSample = {
  kind: "text" | "large-text" | "indicator"; selector: string; text: string;
  ratio: number; required: number;
};

type Region = { kind: ContrastSample["kind"]; selector: string; text: string; rgba: [number, number, number, number];
  boxes: { x: number; y: number; width: number; height: number }[] };

const hideForegrounds = `*, *::before, *::after { color: transparent !important; -webkit-text-fill-color: transparent !important;
  text-shadow: none !important; caret-color: transparent !important; outline-color: transparent !important; transition: none !important; }
  svg, .mode-option::before, .sound-pill::after { visibility: hidden !important; }`;

export async function measureContrast(page: Page, focusables = ".sound-pill, .morph-button, .mode-option[tabindex='0'], summary") {
  const regions: Region[] = await page.evaluate(focusSelector => {
    const parse = (value: string): [number, number, number, number] => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) throw new Error(`Unparsed colour ${value}`);
      const [r, g, b, a = "1"] = match[1].split(/[ ,/]+/).filter(Boolean);
      return [+r, +g, +b, +a];
    };
    const opacityOf = (element: Element | null) => {
      let value = 1;
      for (let node = element; node; node = node.parentElement) value *= +getComputedStyle(node).opacity;
      return value;
    };
    const describe = (element: Element) => {
      const parts: string[] = [];
      for (let node: Element | null = element; node && parts.length < 3 && node !== document.body; node = node.parentElement) {
        const classes = [...node.classList].slice(0, 2).map(name => `.${name}`).join("");
        const part = node.getAttribute("data-part");
        parts.unshift(`${node.tagName.toLowerCase()}${classes}${part ? `[data-part="${part}"]` : ""}`);
      }
      return parts.join(" > ");
    };
    const page = (box: DOMRect) => ({ x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height });
    const shown = (element: Element) => element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const out: Region[] = [];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || !node.textContent?.trim() || !shown(parent) || parent.closest("noscript, .sr-only, script, style")) continue;
      const style = getComputedStyle(parent);
      const opacity = opacityOf(parent);
      if (opacity === 0) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      const boxes = [...range.getClientRects()].filter(box => box.width > 0 && box.height > 0).map(page);
      if (!boxes.length) continue;
      const size = parseFloat(style.fontSize);
      const large = size >= 24 || (size >= 18.66 && +style.fontWeight >= 700);
      const [r, g, b, a] = parse(style.webkitTextFillColor || style.color);
      out.push({ kind: large ? "large-text" : "text", selector: describe(parent), text: node.textContent.trim().slice(0, 40),
        rgba: [r, g, b, a * opacity], boxes });
    }
    for (const svg of document.querySelectorAll("svg")) {
      if (!shown(svg) || opacityOf(svg) === 0) continue;
      const [r, g, b, a] = parse(getComputedStyle(svg).color);
      out.push({ kind: "indicator", selector: describe(svg), text: "icon", rgba: [r, g, b, a * opacityOf(svg)], boxes: [page(svg.getBoundingClientRect())] });
    }
    for (const option of document.querySelectorAll<HTMLElement>('.mode-option[aria-checked="true"]')) {
      const marker = getComputedStyle(option, "::before");
      const box = option.getBoundingClientRect();
      const width = parseFloat(marker.width), left = box.x + parseFloat(getComputedStyle(option).paddingLeft);
      out.push({ kind: "indicator", selector: `${describe(option)}::before (checked marker)`, text: "marker",
        rgba: parse(marker.backgroundColor), boxes: [page(new DOMRect(left, box.y + (box.height - width) / 2, width, width))] });
    }
    // Focus ring: the outline colour against the pixels where the ring is drawn (outline-offset outside the box).
    for (const control of document.querySelectorAll<HTMLElement>(focusSelector)) {
      if (!shown(control)) continue;
      const style = getComputedStyle(control, null);
      const focus = getComputedStyle(document.documentElement).getPropertyValue("--focus").trim();
      const probe = document.createElement("span");
      probe.style.color = focus || style.outlineColor;
      document.body.append(probe);
      const rgba = parse(getComputedStyle(probe).color);
      probe.remove();
      const box = control.getBoundingClientRect();
      const ring = (x: number, y: number, width: number, height: number) => page(new DOMRect(x, y, width, height));
      out.push({ kind: "indicator", selector: `${describe(control)} focus ring`, text: "focus", rgba,
        boxes: [ring(box.x - 5, box.y - 5, box.width + 10, 2), ring(box.x - 5, box.bottom + 3, box.width + 10, 2)] });
    }
    return out;
  }, focusables);

  // Forced colours override author text colours, so "transparent" alone would not hide text there. Freeze every
  // element's and pseudo-element's computed background, border and shadow values (the forced values when forced
  // colours are active), then switch forced-color-adjust off so only the foregrounds disappear.
  const frozen = await page.evaluate(properties => {
    const rules: string[] = [];
    document.querySelectorAll("body *").forEach((element, index) => {
      element.setAttribute("data-contrast-freeze", String(index));
      for (const pseudo of ["", "::before", "::after"]) {
        const style = getComputedStyle(element, pseudo || null);
        if (pseudo && (style.content === "none" || style.content === "normal")) continue;
        rules.push(`[data-contrast-freeze="${index}"]${pseudo} { ${properties.map(name => `${name}: ${style.getPropertyValue(name)} !important;`).join(" ")} }`);
      }
    });
    return `* { forced-color-adjust: none !important; }\n${rules.join("\n")}`;
  }, ["background-color", "background-image", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color", "box-shadow", "backdrop-filter"]);
  const freeze = await page.addStyleTag({ content: frozen });
  const hidden = await page.addStyleTag({ content: hideForegrounds });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const shot = (await page.screenshot({ fullPage: true, animations: "disabled" })).toString("base64");
  await hidden.evaluate(element => (element as Element).remove());
  await freeze.evaluate(element => (element as Element).remove());
  await page.evaluate(() => document.querySelectorAll("[data-contrast-freeze]").forEach(element => element.removeAttribute("data-contrast-freeze")));

  return page.evaluate(async ({ shot, regions }) => {
    const image = new Image();
    image.src = `data:image/png;base64,${shot}`;
    await image.decode();
    const canvas = new OffscreenCanvas(image.width, image.height);
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0);
    const scale = image.width / document.documentElement.scrollWidth;
    const channel = (value: number) => { const c = value / 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
    const luminance = (r: number, g: number, b: number) => .2126 * channel(r) + .7152 * channel(g) + .0722 * channel(b);
    return regions.map(region => {
      const [fr, fg, fb, fa] = region.rgba;
      let worst = Infinity;
      for (const box of region.boxes) {
        const x = Math.max(0, Math.floor(box.x * scale)), y = Math.max(0, Math.floor(box.y * scale));
        const width = Math.min(image.width - x, Math.max(1, Math.round(box.width * scale)));
        const height = Math.min(image.height - y, Math.max(1, Math.round(box.height * scale)));
        if (width <= 0 || height <= 0) continue;
        const data = context.getImageData(x, y, width, height).data;
        for (let index = 0; index < data.length; index += 4) {
          const [br, bg, bb] = [data[index], data[index + 1], data[index + 2]];
          const front = luminance(fr * fa + br * (1 - fa), fg * fa + bg * (1 - fa), fb * fa + bb * (1 - fa));
          const back = luminance(br, bg, bb);
          worst = Math.min(worst, (Math.max(front, back) + .05) / (Math.min(front, back) + .05));
        }
      }
      return { kind: region.kind, selector: region.selector, text: region.text,
        ratio: Math.round(worst * 100) / 100, required: region.kind === "text" ? 4.5 : 3 };
    });
  }, { shot, regions });
}
