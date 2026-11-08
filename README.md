# Spatial DOM Transition Lab

A Code-to-Component Morph Engine

An interaction-design and frontend engineering case study in spatial continuity. Authored, code-like React elements become component previews through shared layout identities, revealing how surfaces, icons, and content correspond.

## Key capabilities

- **Cross-pane continuity:** pieces travel between persistent code and preview panes, with unclipped movement checked in Chromium.
- **Three authored mappings:** Button, Toast, and Bento demonstrate progressively richer compositions.
- **Interruptible springs:** reverse a moving morph; the latest requested mode wins.
- **Independent surfaces and content:** Toast's four parts move together without stretching its text or icon.
- **Responsive composition:** split panes become a vertical stack on narrow screens; Bento reflows through CSS Grid container queries.
- **Generate your own:** describe what you want to learn or see in plain language and get a new code-to-component example that morphs like the built-in ones.
- **Accessible interaction:** native controls, visible focus, readable mapping explanations, and a reduced-motion alternative.

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

## Generating your own example

Type a request such as “a pricing card with a badge” and choose **Generate**. A server route (`/api/generate`) asks Claude for a small declarative spec: one to three cards, each with an optional icon from a fixed list and one to three short text lines. The spec is validated (names sanitized, lengths capped, counts limited) on the server and again in the browser, then turned into code lines and a part mapping. One generic renderer draws the preview and the same shared-identity morph moves the pieces. The model never writes code or markup, and nothing it returns is compiled or executed.

Set `ANTHROPIC_API_KEY` on the server to enable it. Without a key the box explains that generation is unavailable and the three built-in examples keep working. `LAB_MODEL` overrides the default model (`claude-opus-5-5`). Each generation is one API call, so add rate limiting before exposing a public deployment.

```bash
ANTHROPIC_API_KEY=sk-ant-... npm run dev
```

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

Playwright starts a production server on port 3000, or reuses an existing server there. Stop the development server first when verifying the production build.

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

Template and sound preferences use native selects; Code / Component uses a labelled native radio group. Controls support keyboard navigation and visible focus. Focus stays on the initiating control during a morph.

Assistive technology receives a complete source sample, a preview description, and polite view-change announcements. “How the pieces match” explains correspondence without requiring motion or syntax color.

Reduced motion commits directly to the requested endpoint without spatial travel. When both content regions cannot fit in the viewport, the same fallback allows comparison by scrolling. Resize, scroll, visibility, and preference changes cancel active travel while preserving the requested destination.

## Project status and scope

All three visual templates and the controls described above are implemented. The 14-test Playwright suite has passed in Chromium `156.0.8078.4`, covering continuity, ownership, keyboard controls, cancellation, and layouts at 1440px, 1024px, 390px, and 320px. Firefox, Safari, physical devices, and manual screen-reader review remain unverified; this is not an accessibility certification.

Native audio lifecycle and Sound on / Sound off controls are implemented. Audio defaults off, loads on enablement, and plays only on a mode-changing Morph activation when ready. Mute, template changes, page hiding, and unmounting stop playback; failures leave the morph working silently. **The expected `public/audio/morph.mp3` asset is not included; audible delivery and the final Foley cue's listening review are incomplete.**

The three built-in examples are fixed and authored in advance; generated examples are limited to the declarative spec described above. There is no code editor, parser, runtime compilation, arbitrary code execution, persistence, authentication, or analytics. The only backend is the single `/api/generate` route. Product contracts and the broader acceptance matrix are recorded in [PRODUCT.md](PRODUCT.md), [SPEC.md](SPEC.md), [DESIGN.md](DESIGN.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [QA.md](QA.md).
