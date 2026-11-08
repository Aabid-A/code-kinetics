# Spatial DOM Transition Lab

Secondary name: **Code-to-Component Morph Engine**.

Status: v1 is implemented and partly verified, 8 November 2026. Automated Chromium results, and everything not yet run, are recorded in [QA.md](QA.md) "Current results". Open items are listed at the end of [SPEC.md](SPEC.md); the main one is that `public/audio/morph.mp3` is not shipped.

<!-- impeccable:product-schema 1 -->

## Document map and authority

| Document | Owns |
| --- | --- |
| [PRODUCT.md](PRODUCT.md) | Purpose, audience, scope, outcomes, product decisions |
| [SPEC.md](SPEC.md) | Observable behavior, fixed content, state transitions, acceptance requirements |
| [DESIGN.md](DESIGN.md) | Layout, visual tokens, interaction, motion choreography, accessible presentation |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Component boundaries, mapping contracts, dependencies, runtime lifecycle |
| [QA.md](QA.md) | Verification matrix, release gates, evidence requirements |
| [RELEASE.md](RELEASE.md) | Remaining owner and people items before release |

The user's brief is authoritative. Each document owns its topic; a future change that affects multiple topics must update all affected documents together. Requirements identified in SPEC.md are traced to QA.md. ARCHITECTURE.md lists the source files as they exist.

## Platform

web

## Stack

Required: Next.js App Router, TypeScript, Tailwind CSS, Motion for React shared layout animation, a sound abstraction, and Lucide React. Use the `motion` package with `motion/react` imports; do not install a second animation runtime under `framer-motion`. Use a small native audio hook as the permitted equivalent to `use-sound`. Omit `prism-react-renderer`: fixed, authored token nodes provide both syntax color and stable identity. Rationale and compatibility gates are in ARCHITECTURE.md.

## Users and purpose

The confirmed audience is **both designers and frontend developers, with minimal technical terminology in the interface**. A visitor should understand that a label, icon, or surface can retain a visual identity while moving between two presentations.

The product is an educational visual sandbox. It demonstrates a deterministic spatial transition between an authored, code-like composition and a predefined React component preview. Visitors choose Button, Toast, or Bento and repeatedly move between `code` and `rendered`.

The central lesson is correspondence: “These pieces have matching names, so the animation knows where each one belongs.” Technical documentation can name `layoutId`; the main interface should explain the idea in ordinary language.

“Deterministic” means the same ordered commands, initial state, viewport geometry, and accessibility preferences produce the same destination, correspondence, and configured timing. Browser frame scheduling, fonts, and device performance can affect intermediate pixels; the product does not promise identical frame recordings across devices.

## Positioning and truthfulness

The differentiator is visible continuity across the code and preview panes. This is a deliberately authored mapping, not a general solution for interpreting source code. The source-like view is styled React DOM, primarily `motion.span` elements, rather than a single highlighted string or screenshot.

Always show the note: **“A visual demonstration with fixed examples. No code is compiled or run.”** The secondary product name describes the visual engine; it must not imply an executable editor.

The rendered examples are static demonstrations of component appearance. The Button does not submit anything; the Toast does not announce a real save; the Bento metrics are fictional. Label the preview “Example component · not interactive.”

## First-use outcome

1. Arrive at `/` with Button selected, code mode selected, and sound off.
2. Read a short explanation and see the dark code environment beside the empty dot-grid preview.
3. Activate “Morph to component.” The mapped pieces travel into the preview.
4. Activate “Morph to code” to see the correspondence in reverse.
5. Select Toast or Bento; the new example starts in code mode.

No sign-in, onboarding modal, auto-play, or audio is required. Both panes remain present in both modes; mode means where the active mapped pieces live, not which pane is mounted.

## Product principles

- **Correspondence before spectacle.** The visitor can follow individual pieces without blur, particles, or camera movement.
- **Fixed inputs, predictable outcomes.** The same template and mode produce the same content, layout rules, and element identities.
- **Reversible exploration.** Every morph can be reversed, including while it is moving.
- **An explanation for everyone.** Motion, color, and sound supplement a readable description of the mapping.
- **A small, honest system.** No editor UI, execution status, inferred parsing, or unnecessary runtime services.

## Scope

### Version 1

- One route, one lab, three fixed templates, two modes.
- Header identity, template selector, sound toggle, and direction-aware Morph action.
- A Code / Component mode control synchronized with the Morph action.
- Persistent code and render panes, responsive stacking on narrow screens.
- An authored mapping legend and a disclosure explaining the mechanism.
- Deterministic shared-layout movement, interruptible reversal, reduced-motion alternative.
- Optional quiet sound, keyboard support, screen-reader equivalents, touch usability.
- Local operation after application assets load; no service dependency for morphing.

### Excluded

Code editing, arbitrary pasted source, parsing JSX, compilation, `eval`, dynamic module execution, AI generation, custom templates, file imports, draggable panes, pan/zoom, motion timeline editing, playback speed controls, recording/export, accounts, persistence, analytics services, remote data, backend APIs, payments, collaboration, WebGL, and a generalized morph SDK.

Do not add these as inactive controls. A native explanatory disclosure is sufficient; this is not a full documentation portal.

## Product decisions and assumptions

The audience and core stack come from the brief and follow-up answer. The following are design decisions for this specification, rather than claims about existing software or research:

| Decision | Reason |
| --- | --- |
| Default Button / code / sound off | Smallest example and intentional audio consent |
| Template changes reset to code | Establish a fresh starting point and avoid misleading cross-template continuity |
| No persistence, including sound | Reproducible initial load and no browser-storage complexity |
| Static rendered previews | Keep learning focused on the morph, without unrelated application state |
| Custom listbox, ARIA radiogroup, pill Sound button; native disclosure | DESIGN.md "Custom controls" supersedes the earlier native select and radio decision; the disclosure stays native |
| Simultaneous, fixed-duration movement | Easier comparison and cancellation than a staged timeline |
| English content in v1 | Bound the authored examples; retain wrapping and zoom support |

No unresolved product decision blocks implementation. Exact package releases, measured performance, browser evidence, and the authored audio asset remain implementation-time verification tasks, not permission gates.

## Accessibility and inclusion

Target WCAG 2.2 AA for the application controls and content. Provide a useful experience with reduced motion, sound off, keyboard-only interaction, screen readers, forced colors, and browser zoom. Never use sound or syntax color as the only explanation. The simulated component is described as an illustration, so assistive technology does not encounter fake application actions.

## Success and release criteria

Product success means a first-time visitor can select an example, morph it, reverse it, and explain that matching pieces are predefined. Suggested formative study: five people spanning designers and developers, four completing these tasks without help within one minute and four correctly describing the mechanism. These are proposed evaluation thresholds, not measured results.

Release requires all three templates to pass both directions, interruption, template switching, responsive, sound-failure, and accessibility checks. No critical or major defects may remain. QA.md defines evidence and technical budgets. No production telemetry is required to evaluate v1.

## Evidence on hand

The user brief and confirmed audience are the product evidence. A working implementation exists; its automated test results are in [QA.md](QA.md). There is no user research, brand asset library, audio file, performance benchmark, or manual accessibility review. Examples and numerical metrics in the Bento template are explicitly fictional. Do not manufacture validation claims.
