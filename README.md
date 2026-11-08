# Spatial DOM Transition Lab

A Code-to-Component Morph Engine

An interaction-design and frontend engineering case study in spatial continuity. Authored, code-like React elements become component previews through shared layout identities, revealing how surfaces, icons, and content correspond.

## Key capabilities

- **Cross-pane continuity:** pieces travel between persistent code and preview panes, with unclipped movement checked in Chromium.
- **Three authored mappings:** Button, Toast, and Bento demonstrate progressively richer compositions.
- **Interruptible springs:** reverse a moving morph; the latest requested mode wins.
- **Independent surfaces and content:** Toast's four parts move together without stretching its text or icon.
- **Responsive composition:** split panes become a vertical stack on narrow screens; Bento reflows through CSS Grid container queries.
- **Accessible interaction:** a custom ARIA radiogroup and native buttons with full keyboard support, visible focus, readable mapping explanations, and a reduced-motion alternative.

## How the morphing works

The visible code sample is composed of authored React elements, rather than one raw highlighted string. Each mapped part shares a stable identity, such as `toast:title`, between its source and preview destination. A `LayoutGroup` scopes identities to the lab instance; Motion calculates the relationship between their layouts.

One endpoint owns each active identity at rest. Unshared reference tokens keep the code readable after departure. Surfaces use position-and-size projection; text and icons use position-only projection to avoid distortion.

All mappings use the same spring: stiffness `200`, damping `20`, mass `0.8`. Morph retargets movement without queueing transitions. Changing templates cancels the previous run and resets to code mode.

This is visual correspondence between predefined elements. The app does not compile the displayed code or execute arbitrary JSX.

## The page

One page, one idea per section: an opening statement, then chapters 01–05, then a quiet footer. Chapters 01–03 each hold their own lab, locked to one template; 04 explains the matching-names idea with one diagram; 05 hosts the optional generate feature, whose lab appears after a successful generation. A contents line under the opening links the five chapters, and the footer explains the project in two sentences. The visual system (paper, ink, one teal accent, Instrument Serif for titles) is in [DESIGN.md](DESIGN.md).

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
- Optional generation through Google Gemini: `@google/genai` `2.31.0` (server only).
- Playwright `1.64.1` for state contracts, browser behavior, sampled motion geometry, and endpoint captures; `@axe-core/playwright` `4.14.0` for accessibility scans; ESLint for static checks.

## Getting started

To run the finished site locally (production build, the way visitors would see it):

```bash
npm install
npm run serve
```

Then open http://localhost:3000. For development with live reload, use `npm run dev` instead.

Open the URL that either command prints (Next.js uses port 3000 unless it is taken). The page is a short narrative with five chapters (Button, Toast, Bento, How it knows, Try your own). In any chapter, activate **Morph to component**; activate **Morph to code** to reverse it. Sound is one preference in the top bar.

The optional "Try your own" chapter needs a Google Gemini API key. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY` there (never in code or commits; `.env.local` is git-ignored). In production, set it in the host's environment settings instead. Without a key, that chapter says generation is not configured and everything else works. It uses `gemini-3.5-flash-lite` by default for speed; if generation is slow or fails, run `node scripts/gemini-check.mjs` to time the network and the model with your key.

For the Chromium test suite, install its browser and create a production build first:

```bash
npx playwright install chromium
npm run build
npm test
```

Playwright starts its own production server (`npm run start`) on `127.0.0.1:4173` and never reuses an existing one, so that port must be free and `npm run build` must have been run first. `tests/devmode.spec.ts` also starts `next dev` on `127.0.0.1:4175` with `LAB_FIXTURES=1` (for Strict Mode and the two-lab fixture), so that port must be free too; it restores `next-env.d.ts`, which `next dev` rewrites, when it stops. If Playwright cannot find its browser, install it with the command above.

## Available scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create the production build. |
| `npm run start` | Serve an existing production build. |
| `npm run serve` | Build, then serve the production build (the one-step way to run it locally). |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Check TypeScript without emitting files. |
| `npm test` | Run the Playwright suite. |

## Accessibility and motion behavior

Code / Component (one per chapter) is an ARIA radiogroup with roving tab index and arrow-key selection; Sound (one per page, in the top bar) is a button with `aria-pressed`; the contents line is a list of anchor links. Controls support keyboard navigation and visible focus. Focus stays on the initiating control during a morph.

Assistive technology receives a complete source sample, a preview description, and polite view-change announcements. “How the pieces match” explains correspondence without requiring motion or syntax color.

Reduced motion commits directly to the requested endpoint without spatial travel. When both content regions cannot fit in the viewport, the same fallback allows comparison by scrolling. Resize, scroll, visibility, and preference changes cancel active travel while preserving the requested destination.

## Project status and scope

All three visual templates and the controls described above are implemented. The 92-test Playwright suite passed on 8 November 2026 in Chrome for Testing `153.0.8010.12` (headless, Linux); see [QA.md](QA.md) for the commands, the per-file counts and what is not verified.

Native audio lifecycle and Sound on / Sound off controls are implemented. Audio defaults off, loads on enablement, and plays only on a mode-changing Morph activation when ready. Mute, template changes, page hiding, and unmounting stop playback; if the cue cannot load, is unsupported or `play()` is rejected, the morph keeps working silently, the preference stays on, and "Sound unavailable" is shown and announced once; turning Sound off and on again retries. The cue, `public/audio/morph.mp3`, is synthesised by `scripts/make-morph-cue.sh` with the system ffmpeg (no third-party audio; rerun the script to regenerate identical bytes). **Its listening review on headphones and speakers is not done.**

The three chapter examples are fixed and authored in advance. The optional chapter 05 asks Google Gemini for a small declarative spec, validated on the server and in the browser and drawn by the same renderer; it never produces or runs code, and it is rate-limited and off without a key (SPEC R13). There is no code editor, parser, runtime compilation, arbitrary code execution, persistence, authentication, or analytics, and `/api/generate` is the only server route. Product contracts and the broader acceptance matrix are recorded in [PRODUCT.md](PRODUCT.md), [SPEC.md](SPEC.md), [DESIGN.md](DESIGN.md), [ARCHITECTURE.md](ARCHITECTURE.md), and [QA.md](QA.md).
