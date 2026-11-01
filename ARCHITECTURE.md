# Technical architecture

This document specifies future implementation. No source tree, package installation, lockfile, assets, or running application is supplied by this documentation task.

## Architecture summary

Build a single Next.js App Router route with a small interactive client island. The server owns the document shell and metadata. The client owns the three-field AppState, authored template registry, controls, and both animation endpoints. Layout and code display are ordinary React DOM. No compiler, parser, interpreter, sandbox iframe, worker, server action, API route, database, or external data fetch is required.

The motion engine is intentionally bounded to the three templates. It maps semantic part keys to DOM slots and coordinates Motion layout identities. It does not inspect arbitrary component trees or infer correspondences from JSX.

## Dependency decisions

| Dependency | Decision | Rationale |
| --- | --- | --- |
| Next.js + React + React DOM | Required; App Router | Requested framework; static shell and interactive client boundary |
| TypeScript | Required, strict mode | Enforce template, part, and command contracts |
| Tailwind CSS | Required; current compatible v4 setup | Layout and semantic CSS tokens; do not add a parallel styling framework |
| `motion` | Required; import React APIs from `motion/react` | Shared layout identities and reduced-motion support |
| `framer-motion` | Do not also install | Older package naming is not a reason for two runtimes |
| `lucide-react` | Required; named icon imports only | Small consistent icon set, used inside HTML layout wrappers |
| `use-sound` | Omit initially; use a local native audio hook | One short cue needs no sprite support or Howler dependency; equivalent abstraction is allowed by the brief |
| `prism-react-renderer` | Omit | Highlighting a raw string cannot establish the semantic mapping; fixed authored tokens already supply color and identity |
| State/ UI/ gesture libraries | Omit | React state and native controls cover v1 |
| Test tooling | Vitest, Testing Library, Playwright, axe integration or equivalents | Development-only; validate state, DOM, motion, and accessibility |

Do not install packages as part of this specification task. At implementation start, choose stable releases whose peer dependencies agree, record exact versions in a lockfile, and run the animation prototype gate before expanding the templates. No version number here claims a tested compatibility set. Tailwind v4 uses its matching PostCSS integration and CSS import workflow; do not copy a v3 configuration by habit. [Official Tailwind Next.js setup](https://tailwindcss.com/docs/installation/framework-guides/nextjs).

`use-sound` remains a possible replacement behind the same hook contract if future scope needs multiple assets or playback features; it wraps Howler, which is unnecessary for this single-cue proposal. [Project documentation](https://github.com/joshwcomeau/use-sound).

## Proposed source boundaries

The following tree is a plan, not a request to create these files now:

```text
app/
  layout.tsx                  # Server: metadata, language, global styles
  page.tsx                    # Server: renders Lab client entry and static fallback
  globals.css                 # Tailwind import, semantic tokens, focused layout rules
components/lab/
  Lab.tsx                     # Client entry, state, commands, shared layout root
  LabHeader.tsx               # Native controls, no independent selection state
  CodePane.tsx                # Authored lines, source slots, accessible source
  RenderPane.tsx              # Destination frame and described illustration
  SharedPart.tsx              # ID and movement policy, no template parsing
  MappingExplanation.tsx     # Human-readable correspondence and native disclosure
  LabErrorBoundary.tsx        # Local rendering failure fallback
  previews/
    ButtonPreview.tsx
    ToastPreview.tsx
    BentoPreview.tsx
lib/lab/
  types.ts                    # AppState, commands, token and part contracts
  templates.ts                # Fixed content, IDs, and descriptions
  state.ts                    # Pure state transition function
  motion-policy.ts            # Timing and geometry eligibility rules
hooks/
  use-lab-motion.ts            # Environmental subscriptions and cancellation
  use-morph-sound.ts           # Native audio resource lifecycle
public/audio/
  morph.mp3                   # Future authored/licensed local cue
tests/
  state.test.ts
  templates.test.ts
  lab.spec.ts                 # Browser behavior and visual checks
```

Keep template-specific markup in the three preview components. Do not build a universal JSON-to-DOM renderer. Token data and mapping metadata are shared; rendering composition stays readable and explicit.

## Server/client boundary and initial render

`app/page.tsx` and `app/layout.tsx` remain Server Components. `Lab.tsx` declares `'use client'`; its imported interactive subtree belongs to the client bundle. Client Components still participate in initial HTML rendering, so do not read `window`, create Audio objects, or inspect media queries during server render.

Initialize the same Button/code/silent state on both sides. Use stable React-generated instance IDs for namespacing. Browser subscriptions start after mount and have an SSR-safe default of no spatial motion until the preference is known. Readiness is local lifecycle information, not a fourth product-state field. Keep controls disabled until the event system is ready, and make first interaction enablement a direct mount lifecycle update.

Import the fixed registry into the client island. If the server passes data, it must be serializable; icon component functions and event handlers stay in the client module graph. These boundaries follow [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components).

## Data contract

AppState is exactly the type in SPEC R02. A pure `transition(state, command)` returns the next AppState; no audio, DOM reads, timers, or random values occur inside it. Use functional updates or a reducer to apply events in order. Keep side effects in the command controller, with latest-state access that cannot lag behind a burst of commands. An unchanged command must not trigger sound or speech.

Conceptual data shapes, not implementation code:

```ts
type PartKind = "surface" | "text" | "icon";
type SyntaxRole = "tag" | "attribute" | "string" | "text" | "punctuation";

type CodeToken = {
  tokenId: string;                 // Stable authored identity, never an array index
  text: string;
  syntax: SyntaxRole;
  partKey?: string;                // Only the one mapped source occurrence
};

type PartDefinition = {
  key: string;
  kind: PartKind;
  sourceTokenId: string;
  destinationSlot: string;
  sourceLabel: string;
  destinationLabel: string;
};

type TemplateDefinition = {
  id: TemplateId;
  label: string;
  filename: string;
  lines: readonly (readonly CodeToken[])[];
  parts: readonly PartDefinition[];
  previewDescription: string;
  teachingSentence: string;
};
```

Derive narrower per-template key unions from literal registry definitions. The conceptual `string` fields above are not permission to accept runtime user data. Validate every definition: unique token IDs, unique part keys, exactly one source occurrence and one destination slot per part, no missing rendered part, and matching counts of 3/4/10. The accessible source is a join of token text with authored newlines, not a separately maintained snippet.

Rendered copy should reference the same content constants as source token text so labels cannot drift. Icon identifiers map through a small explicit registry of imported Lucide components. Do not dynamically import an icon by an arbitrary string.

## Shared identity and render tree

```text
LabErrorBoundary
└ Lab
  ├ Header + View controls
  ├ MotionConfig (reducedMotion="user")
  │ └ LayoutGroup (stable lab-instance namespace)
  │   └ Shared lab stacking context
  │     ├ CodePane → stable source slots → conditional active pieces
  │     └ RenderPane → stable target slots → conditional active pieces
  ├ MappingExplanation
  └ One polite live region
```

Shared identity is `${templateId}:${partKey}`, scoped by the lab instance. React keys identify stable authored nodes and differ by endpoint where two endpoint trees exist; `layoutId` is what connects them. Do not key the whole lab or LayoutGroup on `viewMode`, and do not add mode to an identity. Template IDs separate examples even when both contain a `surface` part.

One state update removes active source nodes and adds active destination nodes in the same commit. On reverse, do the inverse. Both pane wrappers and their layout slots persist. First build this direct handoff without AnimatePresence. If the pinned version/topology needs outgoing retention for clean continuity, use synchronous presence only around active parts, with outgoing nodes removed from layout flow and made inaccessible; never `mode="wait"`, delayed destination mounting, or whole-pane exit animations. Verify the at-most-two-handoff-nodes invariant and eventual single ownership. This is a compatibility adjustment, not a different product interaction.

Motion matches layout identities, uses the destination's transition, and requires transformable elements. LayoutGroup namespaces IDs. HTML wrappers should own icon projection; shape scaling and text movement require separate treatment. These are library constraints; the persistent-slot, flat-paint-layer approach is this specification's architectural choice. [Motion layout guide](https://motion.dev/docs/react-layout-animations), [LayoutGroup reference](https://motion.dev/docs/react-layout-group).

## Slot and paint strategy

Each source slot is an inline-block or block wrapper with stable sizing content. When active, it contains the matching motion span. When inactive, it contains a regular reference token with no `layoutId`. Hidden sizers preserve geometry across both cases and are excluded from accessibility. Do not use `display: none` or zero-size placeholders for source boxes.

Each target slot is sized by normal layout: CSS grid/flex, intrinsic sizing text, and card padding. A surface slot spans its card bounds, while text and icon slots occupy their natural cells. The moving surface paint is an absolute background layer with no semantic children. Moving text and icon wrappers are peers, not descendants of the scaling surface. Do not put the entire preview under one scaled shared ancestor.

Use full layout size/position projection for surface parts and position-only projection for text/icon wrappers. Tag-name text is an inner visual layer that fades independently; the surface's geometry is the parent layer. Radius and shadow values used in projection belong to Motion style values so scale correction can operate. Ordinary typography remains CSS-driven; avoid animating glyph size. Validate midpoint legibility, not just final alignment.

Set final geometry through CSS/classes/style. Let Motion own the projection transform. Do not combine its transform with manual translate/scale, CSS `transition: all`, a second animation library, or the browser View Transitions API on the same nodes. SVG artwork itself does not carry a shared layout ID.

The lab and panes must not clip travel or create competing stacking contexts. Background rounding occurs on separate layers. Do not use a portal, per-frame `getBoundingClientRect`, canvas snapshot, CSS `offset-path`, or fixed-position clone overlay. Geometry reads for a visibility decision at activation are permitted; Motion owns ongoing measurement.

## Motion lifecycle and transient resources

The durable state is distinct from runtime resources. Allowed transient values include a readiness flag, media-query subscription, latest-command ref, visual-run generation counter, pending part completion set, an audio element/ref, a visibility/resize observer, a debounce timer for speech, and a local audio failure message. None is serialized, exposed as a new product mode, or used to delay the target state.

For each accepted mode-changing command:

1. Read the latest AppState and derive the destination.
2. Check reduced motion and the current source/target content bounds. Spatial motion is eligible only when both regions are fully in the visible viewport and have nonzero boxes.
3. Advance a monotonically increasing run generation; invalidate completion callbacks from the previous run.
4. Apply the new state once. Both endpoint subtrees read the same state.
5. If eligible, let the shared layout transition run for the configured duration; otherwise commit an endpoint-only change with no shared projection.
6. Attempt the optional cue only for this user command and only when already ready.
7. Update the debounced accessible selection message. Completion callbacks may clean visual resources but must never change `viewMode`.

Reversal starts a new generation and retargets the same identities. Track completion by part key and generation, not by callback count alone; ignore stale completions and duplicates. Reduced-motion and immediate paths finish synchronously instead of waiting for callbacks that may never fire. If a cleanup watchdog is used, it may release resources only; it must not announce success or overwrite state.

For cancellation caused by geometry, template change, or preferences, perform a controlled endpoint-only render that omits shared projection for that render and removes any outgoing retained nodes. Then restore shared identity registration on the following stable layout pass without an entrance animation. This temporary suspension is an internal render policy; it does not change local identity strings or add a new view mode. Test that the pinned Motion version discards old projection before re-registration; remount only the active visual layer if necessary, preserving controls and focus. Never remount the entire Lab for ordinary reversals.

Subscribe to viewport resize, meaningful pane size changes, document scrolling during an active run, `visibilitychange`, and reduced-motion changes. Coalesce geometry events once per animation frame. Natural DOM growth and browser zoom must trigger geometry handling. Stop audio when hidden and settle to the latest target when visible again. Dispose subscriptions, observers, timers, listeners, and audio on unmount, including React development Strict Mode setup/cleanup cycles.

`MotionConfig reducedMotion="user"` provides a baseline, while the local preference hook selects the explicit endpoint-only/opacity policy and cancellation behavior. Do not assume it changes non-Motion CSS animations automatically. [Motion accessibility guide](https://motion.dev/docs/react-accessibility).

## Sound abstraction

Use a hook with conceptual operations `prepare`, `playCue`, `stop`, and `dispose`. It accepts the preference, but AppState remains owned by Lab. Create the `HTMLAudioElement` after an explicit enable action; load only the local cue. Keep readiness/error state in the hook. An absent or unready asset means no cue, not a delayed queue.

For each eligible activation, stop the prior cue, rewind if media is ready, set volume, and call `play()` in the user activation path. Handle its promise. On disable, template change, hidden document, or teardown, pause and invalidate pending playback work. If an old playback promise resolves after invalidation, ensure the element remains paused. Never re-enable sound from a callback.

Playback may be rejected by browser policy and must not block interaction. [HTMLMediaElement.play()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play). The visible “Sound on” state describes preference; a separate “Sound unavailable” note describes a failed resource. Default silence and reduced motion are independent.

The future cue must be authored or appropriately licensed and committed locally with provenance. Do not fetch stock audio at runtime. If no cue is supplied during implementation, sound-on must show the unavailable state; release is not complete until the requested sound behavior can be tested with a real asset.

## Security, privacy, and content handling

All content is local, typed, fixed, and rendered through React text nodes. No `dangerouslySetInnerHTML`, `eval`, `new Function`, JSX evaluation, user-provided imports, or runtime code compilation. No user content, accounts, cookies, localStorage, telemetry, or permissions are needed. A normal hosting security baseline applies; do not introduce a sandbox service for code that is never executed.

## Performance and delivery

Render all three definitions locally; mount only the active template's animated pieces. At most 10 live shared pieces at rest, or 20 briefly if outgoing retention is required. Avoid animation-driven React state updates each frame. Use transform/opacity for movement, no filters or animated layout from application-level timers.

Initial target budgets: first-load route JavaScript at most 200 KiB gzip including framework and app; total optional audio at most 30 KiB; no morph-related network requests. Measure with the eventual production build rather than assuming tree shaking. If the baseline exceeds the JS target, inspect imports before introducing lazy-loading that could interrupt the first morph.

No custom server is needed. Standard Next.js hosting is sufficient; a static export is eligible because the planned route has no server features, but configure and verify it only if the deployment target requires it. Do not promise hosting or publish a site as part of this specification.

## Implementation sequence and gates

1. **Resolve dependencies and prototype Button.** Verify same-commit cross-pane handoff, reverse during flight, no clipping, and position-only label behavior with the chosen versions. Failure blocks expanding the system.
2. **Establish state and semantic UI.** Pure command function, deterministic initial render, native controls, code accessibility, and described preview.
3. **Add exact authored registries and all previews.** Validate the 3/4/10 maps and shared copy.
4. **Apply responsive layout and visual tokens.** Verify stacked panes, target containers, source wrapping, and 320 px reflow.
5. **Add lifecycle safeguards and optional audio.** Reduced motion, offscreen fallback, cancellation, sound readiness and failure.
6. **Run QA.md and collect evidence.** Only measured evidence establishes working motion, performance, and accessibility.

## Principal risks and mitigations

| Risk | Mitigation / proof |
| --- | --- |
| Clipped travel despite high z-index | Separate background rounding; inspect ancestor overflow/stacking; midpoint captures |
| Shared IDs collide or reset | Registry invariants, instance namespace, template-qualified IDs, no mode keys |
| Distorted card text | Flat surface paint layers; text/icon position-only projection; Button prototype gate |
| Duplicate endpoints obscure travel | Single ownership at rest; bounded outgoing retention; readable unshared references |
| Reverse snaps to stale geometry | Continuous-reversal test in the pinned runtime; latest run generation |
| Callback restores old template or mode | Completion never mutates AppState; invalidate old resources |
| Small screen hides the journey | Responsive stack plus deliberate endpoint-only fallback and legend |
| Hydration or sound causes nondeterminism | Fixed initial state, browser work after mount, audio tied to explicit commands |

Documentation consulted on 1 November 2026. Linked library documentation establishes available mechanisms; the design values, source-to-target mappings, budgets, and lifecycle policies above are proposed application decisions requiring implementation validation.
