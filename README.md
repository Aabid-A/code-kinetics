# Spatial DOM Transition Lab

A Code-to-Component Morph Engine

An interaction-design and frontend engineering case study in spatial continuity. Authored, code-like React elements become component previews through shared layout identities, revealing how surfaces, icons, and content correspond.

## Key capabilities

- **Cross-pane continuity:** pieces travel between persistent code and preview panes, with unclipped movement checked in Chromium.
- **Three authored mappings:** Button, Toast, and Bento demonstrate progressively richer compositions.
- **Interruptible springs:** reverse a moving morph; the latest requested mode wins.
- **Independent surfaces and content:** Toast's four parts move together without stretching its text or icon.
- **Responsive composition:** split panes become a vertical stack on narrow screens; Bento reflows through CSS Grid container queries.
- **Accessible interaction:** custom listbox, radiogroup and pill controls with full keyboard support, visible focus, readable mapping explanations, and a reduced-motion alternative.

## How the morphing works

The visible code sample is composed of authored React elements, rather than one raw highlighted string. Each mapped part shares a stable identity, such as `toast:title`, between its source and preview destination. A `LayoutGroup` scopes identities to the lab instance; Motion calculates the relationship between their layouts.

One endpoint owns each active identity at rest. Unshared reference tokens keep the code readable after departure. Surfaces use position-and-size projection; text and icons use position-only projection to avoid distortion.

All mappings use the same spring: stiffness `200`, damping `20`, mass `0.8`. Morph retargets movement without queueing transitions. Changing templates cancels the previous run and resets to code mode.

This is visual correspondence between predefined elements. The app does not compile the displayed code or execute arbitrary JSX.

## Template examples

| Template | Mapping | Preview |
| --- | --- | --- |
| Button | 3 parts: surface, icon, label | “Explore” with an up-right arrow; a direct one-to-one mapping. |
| Toast | 4 parts: surface, icon, title, description | “Changes saved” with a check icon and supporting text; coordinated parent-child spatial continuity. |
| Bento | 10 parts across Feature, Metric, and Status | An asymmetric grid with a two-row feature card and two smaller cards. Below 360px of preview content width, cards stack in source order. |

The previews are illustrative and noninteractive. Toast does not report an actual save; Bento's “12 Components” is fictional sample content.

## Technical stack

- Next.js App Router `16.4.3` and React `19.3.1`.
- TypeScript `6.0.3` and Tailwind CSS `4.3.3`, using its v4 PostCSS integration and container queries.
- Motion for React: `motion` `14.9.0`, imported from `motion/react`.
- Geist Sans and Geist Mono via `geist` `1.9.0`; Lucide React `1.66.0`.
- Playwright `1.64.1` for state contracts, browser behavior, sampled motion geometry, and endpoint captures; ESLint for static checks.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Select an example and activate **Morph to component**; activate **Morph to code** to reverse it.

For the Chromium test suite, install its browser and create a production build first:

```bash
npx playwright install chromium
npm run build
npm test
```

Playwright starts its own production server (`npm run start`) on `127.0.0.1:4173` and never reuses an existing one, so that port must be free and `npm run build` must have been run first. Tests navigate relative to the configured `baseURL`. If Playwright cannot find its browser, install it with the command above.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create the production build. |
| `npm run start` | Serve an existing production build. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Check TypeScript without emitting files. |
| `npm test` | Run the Playwright suite. |

## Accessibility and motion behavior

Example is a button that opens a custom listbox (Arrow keys, Home/End, typeahead, Enter/Space to choose, Escape to cancel); Code / Component is an ARIA radiogroup with roving tab index and arrow-key selection; Sound is a pill button with `aria-pressed`. Controls support keyboard navigation and visible focus. Focus stays on the initiating control during a morph.

Assistive technology receives a complete source sample, a preview description, and polite view-change announcements. “How the pieces match” explains correspondence without requiring motion or syntax color.

Reduced motion commits directly to the requested endpoint without spatial travel. When both content regions cannot fit in the viewport, the same fallback allows comparison by scrolling. Resize, scroll, visibility, and preference changes cancel active travel while preserving the requested destination.

## Project status and scope

All three visual templates and the controls described above are implemented. The 22-test Playwright suite passed on 8 November 2026 in Chrome for Testing `153.0.8010.12` (headless, Linux), covering continuity, ownership, keyboard controls, cancellation, and layouts at 1440px, 1024px, 390px, and 320px. Firefox, Safari, physical devices, and manual screen-reader review remain unverified; this is not an accessibility certification.

Native audio lifecycle and Sound on / Sound off controls are implemented. Audio defaults off, loads on enablement, and plays only on a mode-changing Morph activation when ready. Mute, template changes, page hiding, and unmounting stop playback; if the cue cannot load, is unsupported or `play()` is rejected, the morph keeps working silently, the preference stays on, and "Sound unavailable" is shown and announced once; turning Sound off and on again retries. **The expected `public/audio/morph.mp3` asset is not included; audible delivery and the final Foley cue's listening review are incomplete.**

Examples are fixed and authored in advance. There is no code editor, parser, runtime compilation, arbitrary code execution, component generation, persistence, backend, authentication, or analytics. Product contracts and the broader acceptance matrix are recorded in [PRODUCT.md](PRODUCT.md), [SPEC.md](SPEC.md), [DESIGN.md](DESIGN.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [QA.md](QA.md).
