# Design and motion specification

Product: **Spatial DOM Transition Lab** · **Code-to-Component Morph Engine**.

Revision: editorial paper direction, 8 November 2026. This document specifies presentation. Browser evidence for the implemented parts is recorded in [QA.md](QA.md).

## Decision record (8 November 2026)

The previous revision (near-black glass, a violet-to-blue gradient action, a pill-cluster header, window dots, a dot-grid and a mostly empty first screen) is **replaced**. It read as a generic landing page and gave the visitor no reason to scroll. The owner's direction is a calm, editorial, crafted page that takes the visitor on a journey: a warm paper ground, confident display type with occasional serif-italic emphasis, the real content as the hero, one idea per section, and diagrams in one consistent hand. The tone is learned from editorial sites in general; no font, palette, illustration, layout or copy is taken from any of them.

Unchanged by this decision: the spring (`stiffness: 200`, `damping: 20`, `mass: 0.8`), shared identities, template content and mappings, reversal, reduced-motion behaviour, the keyboard and ARIA contracts of the custom controls, sound behaviour and cue, the error boundary and the no-JavaScript fallback. [SPEC.md](SPEC.md) stays authoritative for those. SPEC.md R01, R03 and related rows change as recorded there: the single lab becomes one lab per chapter, the global Example selector is removed, and Sound is one page-level preference.

## Narrative and copy

One idea per section, top to bottom. Plain, short, specific, warm. Every string here is the proposal; strings that change an existing visible string are listed in the phase report.

| # | Section | Eyebrow | Title (one italic word at most) | Sentence / caption |
| --- | --- | --- | --- | --- |
| 0 | Opening | “An interactive explainer in five short chapters” | **Code has a shape.** (the final full stop is accent) | Why it matters, in ink: “The calmest interfaces don’t blink from one screen to the next. A thumbnail grows into a photo; a card opens into a page. Each piece knows where it is going. This lab shows the idea behind that motion, one piece of code at a time.” Then, muted: “Press **Morph** on any example to watch each named piece of code travel to its place in the finished component.” Then the contents line (01 Button … 05 Your turn), then the Button lab in code mode, above the fold at 1440 × 900. Nothing plays on load. |
| 1 | Button | 01 — Button | One name, one *surface* | “Watch the three named pieces, the button, its arrow and its label, each leave the code and land in one place.” |
| 2 | Toast | 02 — Toast | Pieces that *travel* together | “Notice how the card carries its icon and two lines of text along, while the text keeps its shape.” |
| 3 | Bento | 03 — Bento | A whole *layout* | “Notice ten pieces arriving at once; narrow the window and the cards stack in the same order.” |
| 4 | How it knows | 04 — How it knows | How it *knows* | A labelled diagram (below), then: “Each piece has the same name on both sides: where it is written in the code, and where it appears in the component. The engine draws a line between the two and moves along it. In the implementation, that name is called `layoutId`.” |
| 5 | Your turn | 05 — Your turn | Try your *own* | “Describe a small component and the lab builds a matching example from validated data. No code is compiled or run.” The existing generate feature (prompt, suggestions, status line) restyled into this system; provider, route and behaviour unchanged. The generated lab appears beneath the prompt. |
| 6 | Footer | none | none | “A visual demonstration with fixed examples. No code is compiled or run.” Credits: “Typefaces: Instrument Serif, Geist and Geist Mono. Icons: Lucide.” |

Top bar: the wordmark “Spatial DOM Transition Lab” at the left and one Sound control at the right (“Sound off” / “Sound on”). Nothing else.

Each lab keeps its own explanation line (“N mapped pieces · teaching sentence”) and the native “How the pieces match” disclosure, below its sheet. Avoid “compile”, “execute”, “transpile” and “generated component” for the fixed examples. Banned words: unlock, supercharge, seamless, career-ready, and any marketing claim.

### The diagram (chapter 04)

Inline SVG on its own framed sheet, drawn in the page's line style: 1.5 px ink strokes, rule-colour dashed guides for the destination slots, ink-muted Geist Mono labels, paper fills only, no gradients. Wide (≥ 720 px): the Button code on the left with its three mapped tokens boxed, a paper preview on the right with the button, its label slot and its icon slot, and three labelled connectors (`button:surface`, `button:icon`, `button:label`). Narrow: three token chips above, the component below, short vertical connectors, so labels stay at about 12 px on a phone. **Accent marks one pair only** (`button:surface`: its token box, connector and two end dots); the other two pairs are ink. Both drawings are `aria-hidden`; the text equivalent is the visible caption (three pairs share a name, written once in the code and once in the component; the term `layoutId`) plus a visually hidden list of the three pairs.

## Layout

Twelve columns, 24 px gutters, content width `min(1320px, 100% − 2 × gutter)` (gutter 32 px, 16 px under 640 px). Chapters are at least 160 px apart on desktop (112 px on phones). The first chapter follows the opening by 48 px so the Button lab is visible in the first desktop viewport (1440 × 900).

- From 1280 px the chapter text takes columns 1–4 and the sheet columns 5–12 (chapters 01, 02 and 05). Chapter 03 flips for rhythm: the sheet takes columns 1–9, wide enough for Bento's two-column composition (its stage splits 1:1 so the preview keeps at least 360 px of content width from 1280 px up), and the text columns 10–12. Chapter 04 stacks: its text above a full-width diagram sheet.
- Below 1280 px the text sits above the sheet and is limited to 68 ch.
- Inside a sheet, code (ink) and preview (paper) are never two identical empty boxes: they differ in ground, type and role. Split from 960 px, stacked below.

## Typography

- Display: **Instrument Serif** via `next/font/google` (self-hosted at build, OFL), regular and italic, for the opening headline and chapter titles only. One italic word per title at most. Sizes: opening 104 / 72 / 52 px (desktop ≥ 1024 / tablet ≥ 640 / phone); chapter titles 72 / 56 / 44 px. Line height 1.04, letter spacing −0.015em, a little bottom padding so descenders are never clipped.
- UI and body: **Geist**, body 17 px / 1.6 (captions 17–18 px, maximum 68 ch), controls 15 px, small print 12–13 px.
- Code and labels: **Geist Mono**. Eyebrows are 12 px, uppercase, letter spacing 0.08em, ink-muted, with the number in the accent colour. Code is 13 px / 22 px.

## Colour

One flat accent. It is used only for the Morph action, focus, chapter numbers, the opening full stop and, in the chapter 04 diagram, one highlighted pair (its connector and the two dots at its ends). No gradients, glows, blur or violet anywhere.

| Token | Value | Use |
| --- | --- | --- |
| paper | `#F3F0E8` | page ground; preview ground |
| paper-raised | `#FBFAF6` | sheets, cards, inputs, controls |
| ink | `#1B1A17` | text; ink surfaces in the previews |
| ink-muted | `#5C5A54` | secondary text, control edges |
| rule | `#D9D4C7` | hairlines, sheet and preview borders |
| accent | `#0F766E` | Morph action, focus ring, chapter numbers, the full stop |
| code | `#16181D` | code sheet ground; text `#E9E4D8`, muted `#A8A396`, tag `#F0B48F`, attribute `#D9C27F` |

Measured pairs (WCAG ratio): ink on paper 15.28, on raised 16.66; ink-muted on paper 6.05, on raised 6.60; accent on paper 4.81, on raised 5.24; white on accent 5.47 (Morph); raised on ink 16.66 (preview button, checked View option); code text 14.00, muted 7.06, tag 9.84, attribute 10.13 on code; tag on the travelling code surface `#2B2E36` 7.52; accent focus ring on the code sheet 3.24 (indicator, ≥ 3). Control edges use ink-muted (6.05), because rule alone is only about 1.3:1. The actual rendered pixels are re-measured in the browser by `tests/accessibility.spec.ts` in every state.

## Surfaces

- **Framed sheet.** Each chapter's lab sits on one paper-raised sheet: radius 28 px, 1 px rule border, no glow, shadow at most `0 24px 60px -30px rgb(27 26 23 / 0.12)`. The sheet holds the toolbar (View group at the left, Morph at the right) above the two panes.
- **Code sheet.** An ink block (`#16181D`, radius 20 px) with warm syntax colours, a mono file name, a hairline under it, and line numbers. The code is top-aligned and left-aligned (never vertically centred). The sheet is sized to its content; the stage grid gives the preview the same height, and the preview's slots are laid out in both modes, so the stage keeps exactly one height whether it shows code or component and nothing jumps on a morph. No window dots and no fake app chrome.
- **Preview.** The paper ground with a 1 px rule border (radius 20 px), a small mono heading, and, in code mode, the instruction “Choose Morph to see these pieces become a component.” No corner marks, no dot-grid.
- **Visually hidden labels.** “Fixed example” (or “Generated example”), “Mapped pieces start here.” / “Mapped pieces are shown in the preview.” and the preview figure caption stay in the DOM as visually hidden text for assistive technology (SPEC R04, R10).
- **Caption line.** Under every sheet, one line: **“N mapped pieces · Example only, not interactive”** (Bento: “Example only, fictional content, not interactive”), then the native “How the pieces match” disclosure. The template's teaching sentence is the first paragraph inside the disclosure.
- **Drafting rules.** Three faint verticals at the quarter marks of the grid (rule colour at about 50 % opacity), desktop ≥ 1024 px only, `aria-hidden`, behind all content; they never cross a sheet (sheets are opaque). Removed in forced-colors mode.

## Controls

All controls are native buttons with custom styling. Targets are at least 44 px. Edges are ink-muted; focus is a 2 px accent outline with 3 px offset.

- **Sound** (top bar, one per page): a bordered button, “Sound off” / “Sound on”, `aria-pressed`, accessible name “Sound”, a dot when on. “Sound unavailable” appears beside it when needed. The preference is shared by all chapters.
- **View** (per chapter): the ARIA radiogroup “View” with “Code” and “Component”, roving `tabIndex`; the checked option is an ink fill with a paper marker.
- **Morph** (per chapter): the one accent-filled action, flat, 216 px wide so its two labels never shift the layout (“Morph to component” / “Morph to code”). Hover and press darken it; disabled it turns to rule and ink-muted.
- The Example selector no longer exists: each lab is locked to its chapter's template.

## Preview components

Illustrations only; none is interactive. Content, mappings and copy are unchanged ([SPEC.md](SPEC.md) R05).

- **Button:** an ink surface (radius 10), label and arrow in paper-raised.
- **Toast:** a paper-raised card with a rule outline and a soft shadow; ink title, ink-muted description, the check icon in ink on a pale circle.
- **Bento:** the Feature card is an ink card with paper text and a translucent paper icon tile; Metric and Status are paper-raised cards with a rule outline.

## Opening entrance and chapter reveal

On first load only: eyebrow and headline, then the two opening sentences (80 ms later), then the contents line, each fading in with at most 10 px of upward travel, 160 ms each, 320 ms in total. Chapters further down reveal their text once as they enter the viewport (opacity and at most 12 px). None of this runs under reduced motion, and **no lab piece ever animates on load** (SPEC R01). The lab itself is never inside a revealed or transformed ancestor.

## Shared-layout visual construction

Every moving part has an untransformed layout slot at its source and destination. Slot geometry exists even when its active moving node does not. Source slots use hidden sizing text plus one visible owner or reference token; destination slots use the component's natural grid/flex geometry and hidden sizing content where necessary. Hidden sizing content is both visually hidden and `aria-hidden`, without being removed from layout.

The growing surface is a paint layer, not the parent of the travelling label or icon. Put the surface, text, and icon layers as peers inside untransformed layout wrappers. This prevents a tag-name-sized surface from stretching every child while it expands into a card. Use position-only layout animation for text and icon wrappers; let their final typography or artwork crossfade rather than scaling glyphs. Surface parts may animate both size and position.

Use the same stable local IDs on both endpoints. An icon's ID belongs to an HTML span surrounding the Lucide SVG; do not place layout projection directly on SVG paths. Surface tag lettering fades out independently of the growing background and returns on reverse. Do not imply that Motion interpolates text outlines.

## Motion contract

The baseline is a **spring animation** with `type: 'spring'`, `stiffness: 200`, `damping: 20`, and `mass: 0.8`, with no delay and no stagger. This is a deliberate design choice, not a measured performance result. Use the same destination-side transition configuration on every endpoint, including the code endpoints used for reversal.

| Channel | Behavior |
| --- | --- |
| Shared position | Straight path between measured boxes; spring animation |
| Surface size | Same spring layout animation; restrained radius/shadow interpolation |
| Source tag or icon-name lettering | Fade away within 100 ms when moving to rendered |
| Destination icon artwork / surface decoration | Fade in over 160 ms, beginning immediately |
| Identical label text | Remain legible; position-only movement; short style transition if font/color changes |
| Preview instruction | Fade out in 100 ms on render request; return over 120 ms on code request |
| Code reference token | Appear as the owner departs, in the same reserved slot |
| Hover / focus / press | 80–120 ms color change only; no lab translation or scale |

All parts depart together and arrive together. Avoid entrance and exit delays: rapid reversal should retarget a single movement, not race a scheduled sequence. The visual destination updates immediately on input. If the pinned Motion version cannot preserve continuous reversal at the required topology, that is a failed prototype gate in QA.md, not permission to replace the lab with a crossfade.

Text and icons must remain readable while crossing both the ink code sheet and the paper preview. During spatial travel, give their wrappers a compact ink backing and light foreground, painted without changing slot dimensions. Keep the backing until that part settles, then remove it and apply its endpoint colors together; an optional 80 ms opacity finish is allowed. On reversal, retain the backing until the new destination settles. On immediate/reduced-motion paths, use endpoint colors directly. This backing is local transient presentation, cleared by the current run's completion or cancellation, not another application mode.

Stationary surfaces use the paper and ink fills in "Preview components"; travelling surface paint keeps a stable tint and restrained shadow. Do not animate blur, font size, line height, letter spacing, gradients, perspective, rotation, or camera movement. “Spatial” means visible travel between screen positions; v1 does not need 3D. Do not add an `x`/`y` keyframe animation to a node whose transform is owned by layout projection.

At rest, the final target layout must be indistinguishable from its static version. There must be no lingering scale, stretched type, or one-frame full-size flash at the destination.

### Layering and clipping

Use one shared lab stacking context. Pane ground: layer 0. Stationary source syntax: layer 10. Moving surfaces: layer 20. Moving labels and icons: layer 30. Top bar and focus affordances: layer 50 outside the lab movement region.

The lab, its sheet and all ancestors of moving pieces must allow visible overflow. Round backgrounds on separate paint elements; do not apply `overflow: hidden`, masks, `clip-path`, transforms, opacity less than 1, or paint containment to whole panes. A child's large z-index cannot escape an ancestor clipping boundary or stacking context. The divider sits behind the moving pieces. Keep the top bar outside the straight paths rather than masking travel near it.

No portal or DOM screenshot overlay is part of v1. Both endpoints live under the same React layout coordination tree. There is no nested pane scroller; the page scrolls naturally. Motion accounts for layout; the app does not calculate per-frame screen coordinates.

### Reduced motion and interruption

When reduced motion is requested, remove spatial projection for the change and use at most 120 ms of opacity. Mode, content, mapping legend, focus, and optional sound behavior remain identical. No looping or background motion exists in either setting.

Reverse from the current screen position when the same template changes mode. On a template change, resize, zoom-driven geometry change, scroll during flight, preference change, or visibility restoration, settle immediately to the latest state and clear stale visual work. Do not preserve an old offscreen trajectory. With offscreen endpoints, switch without travel and use SPEC R08's feedback.

## Copy and educational disclosure

Mechanism explanation (inside each lab's disclosure): **“Each moving piece has a matching name in both views. Morph moves it between those places. These examples are prepared in advance.”**

Technical note: **“In the implementation, this matching name is called a shared identity (`layoutId`). The code view is made of styled elements, too.”**

Use the per-template teaching sentences in SPEC.md. Prefer “piece”, “surface”, “label” and “example” in interface copy.

## Accessible visual behavior

Custom styling preserves accessible names, roles, states, keyboard navigation and focus. The View radiogroup keeps its roving `tabIndex` contract; the Sound button keeps `aria-pressed`. Focus indicators stay visible and outside clipping. Decorative rules, corner ticks, sizers, line numbers and duplicate visual text are hidden from assistive technology. Pane wrappers are `role="group"` (not landmarks), so repeated pane names across chapters raise no duplicate-landmark finding.

The page has one `h1` (the opening statement) and one `h2` per chapter; pane headings are `h3`. Each lab keeps its full code text alternative, described preview, polite status region and native “How the pieces match” disclosure. A page-level polite region announces “Sound unavailable.”

In forced-colors mode the drafting rules, shadows and corner ticks are removed, tokens map to system colours, mapped pieces keep an outline marker, and the checked View option and focus ring stay distinguishable. Reduced motion removes the entrance, the reveal and all spatial travel. At increased text size, controls, headings and cards wrap or grow without clipped text.

## Banned

Gradients on buttons, text or borders; glassmorphism and backdrop blur; glows and glow ellipses; neon; violet; dot-grid filler; pill-cluster headers; all-caps hero headlines; emoji; stock 3D; background video or any media from external hosts; brand-logo marquees or third-party logos; marketing claims and hype copy.

## Implementation review standard

Review every settled template and mode at 1440, 1024, 390 and 320 px. Check the paper ground and the ink code sheet, the serif headline at its real size, the italic word, the drafting rules (desktop only), the accent used only where listed, and the Morph hierarchy. Inspect contrast against the composited pixels, forced colours, reduced motion and 200 % zoom. Inspect forward and reverse motion at departure, midpoint and arrival; the sheet and panes must never clip or isolate shared pieces. Static screenshots alone cannot establish continuity.

## Implementation notes and open items (8 November 2026)

- **Implemented (8 November 2026):** top bar, opening, five chapters, per-chapter labs, page-level Sound, the paper token set, the diagram, the footer, the drafting rules, the opening entrance and the chapter reveal. **Contents (revised 8 November 2026):** a `<nav aria-label="Chapters">` of five links, each a teal mono number and the chapter name (“01 Button” … “05 Your turn”), in one quiet line under the opening with a 1 px rule above it. It stays in the page flow at every width: the earlier floating index sat over the Bento preview and the chapter 05 card, so it was removed along with its `aria-current` tracking. **View control (revised):** the checked option is a paper-raised pill with a 1 px ink-muted ring and a solid ink dot, so the teal Morph button is the one obvious action in each lab. **Footer (revised):** “About this lab” explains shared-element transitions in two sentences beside the disclaimer, the generation note and the type credits. **Morph button:** its label never wraps (min-width 216 px, grows if needed); a wrapped label made labs jump 12 px on GitHub’s browser. **Reveal:** chapter text that starts below the first screen is held back after mount and released once; labs are never inside a revealed element.
- **Generated lab** (chapter 05): the prompt card sits in the chapter and, after a successful generation, the generated lab mounts beneath it in code mode (a second generation replaces it). Under the character count, one ink-muted line states that descriptions are sent to Google Gemini (SPEC R13).
- **Fonts.** Geist and Geist Mono come from the `geist` package (local files); Instrument Serif comes from `next/font/google`, which downloads and self-hosts it at build time. No font request is made at runtime.
- **Header.tsx** keeps its name but now holds only the Sound and Morph buttons.
