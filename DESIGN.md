# Design and motion specification

Product: **Spatial DOM Transition Lab** · **Code-to-Component Morph Engine**.

Revision: premium dark visual direction, 2 November 2026. This document specifies presentation; it does not claim the application has been visually verified.

## Scope and authority

This revision replaces the former flat, light, dashboard-like visual system with a premium landing-page aesthetic. It governs typography, color, materials, hierarchy, and custom control presentation. Where other documents still prescribe system fonts, light panels, native selects, or native radio inputs, this revision supersedes those presentation and control-construction requirements. [SPEC.md](SPEC.md) remains authoritative for template content, commands, selection effects, and application state.

Keep the current spring physics, shared identities, source-to-destination mappings, reversal, reduced-motion behavior, and template copy intact. Button, Toast, and Bento retain their content and composition. Only DESIGN.md is changed by this revision; no application implementation is requested.

## Direction and surface purpose

The visual reference is the premium website work collected by [MotionSites](https://motionsites.ai/) and [Land-book](https://land-book.com/): use them as inspiration for art direction, not as a requirement to copy a particular site. This specification commits to a near-black stage, tightly set Geist typography, translucent glass surfaces, generous spacing, and one luminous primary action.

The lab remains the product's main experience. Present it with the hierarchy and finish of a high-end interactive landing page: a prominent title, a short explanation, an exceptionally clear Morph action, and a spacious demonstration. Preserve the source pane's macOS-inspired chrome and the preview's dot-grid, now both within a coherent dark environment. The only bento composition is the Bento template itself.

Use the glass to establish depth and the accent to identify the action. Keep the rest restrained: no unrelated KPI cards, sidebar navigation, dense administrative toolbar, marketing feature grid, testimonials, pricing sections, or invented product claims. No particles, parallax, rotating camera, or ambient animation is added.

## Information hierarchy and layout

Reading order: identity and Morph controls → existing explanatory sentence → Code / Component control → source and preview → current mapping explanation. The Morph button is the hero control and brightest bounded element; it must not compete with several equally bright actions.

Use one large page heading, “Spatial DOM Transition Lab”, with the secondary name on a quieter line. On wide screens, place the heading at the left of the top composition and a compact control cluster at the right, with the Morph action closest to the demonstration. Allow the cluster to occupy a second row when space is tight. Keep the introductory area compact enough to reveal the lab in the first desktop viewport; premium spacing must not push the product below a decorative full-screen hero.

Desktop topology, at 960 CSS pixels and wider:

```text
      Spatial DOM Transition Lab       [Example: Button ▾] [Sound off]
      Code-to-Component Morph Engine          [✦ Morph to component]
      Watch matching pieces move from code to component.

      [ Code  |  Component ]

      ╭── glass source pane ─────────╮   ╭── glass preview pane ───────╮
      │ ● ● ●  Button.tsx            │   │ Component preview           │
      │        Fixed example         │   │                             │
      │ Authored code-like elements  │ → │ Dim dot-grid + destination  │
      │ Mapped pieces start here.    │   │ Example caption             │
      ╰──────────────────────────────╯   ╰─────────────────────────────╯

      3 mapped pieces · Existing template explanation
      ▸ How the pieces match
      Existing fixed-example disclaimer
```

The sketch expresses hierarchy, not new text, icons, or component content; use the existing Lucide Morph icon in implementation. Use a maximum-width 1440 px content frame, with 32 px outer gutters on wide screens, 24 px from 640–1199 px, and 16 px below 640 px. Allow 48–64 px above the title on roomy viewports, reducing to 24–32 px on short screens. Use 24–32 px from controls to the lab, with a 16–24 px open gutter between equal `minmax(0, 1fr)` columns. The open gutter is part of the visible travel path.

Lab minimum height remains 520 px on desktop. Both panes stretch to the larger content requirement, including wrapped Bento source. Pane padding is 28 px at desktop, 20 px on tablet, and 16 px on phone. Code chrome occupies 40 px above the source. Center the preview within its content region, with the caption in a separate row below.

Below 960 px, keep source above preview in a single column and preserve DOM reading order. Preview content has at least 280 px height, growing for stacked Bento. The source expands to fit its lines. At 640–959 px, header controls form a second row. Below 640 px, the heading occupies its own row, Example and Sound share the next row, and Morph spans the full width. The mode control stays outside both panes.

Support 320 CSS px minimum width and 400% zoom through natural reflow and page scrolling. Do not hide panes, reduce the whole lab with CSS scale, or shrink source typography to fit a viewport. Preserve SPEC R08's endpoint-only behavior when the complete journey is offscreen.

## Typography — mandatory font system

Use **Geist** as the primary font, loaded through `next/font/google` in the root layout and exposed as `--font-geist-sans`. **Inter**, also loaded through `next/font`, is the only permitted primary-family alternative; use one family consistently, not both. A generic system stack is a fallback during loading or failure, not the intended aesthetic.

Use **Geist Mono** through `next/font/google` for source code and line numbers, exposed as `--font-geist-mono`. Font variables must actually be applied to the relevant elements and design tokens. Do not merely import a font while continuing to render system UI text.

Use Latin subsets and variable weights where supported. `next/font` supplies optimized, self-hosted assets; do not add browser-side Google Fonts stylesheets. See the [Next.js font documentation](https://nextjs.org/docs/app/api-reference/components/font). If build-time downloading is unavailable, use licensed local Geist or Inter files through `next/font/local` rather than silently changing the design family.

| Role | Size / line height | Weight | Tracking |
| --- | --- | --- | --- |
| Main heading, wide | 56 px / 60 px | 600 | `-0.045em` |
| Main heading, tablet | 44 px / 48 px | 600 | `-0.04em` |
| Main heading, phone | 32 px / 36 px | 600 | `-0.035em` |
| Section heading | 18 px / 26 px | 600 | `-0.025em` |
| Secondary name / body | 14 px / 22 px | 400–500 | `-0.01em` |
| Controls | 14 px / 20 px | 550–600 | `-0.01em` |
| Morph label | 15 px / 22 px | 600 | `-0.015em` |
| Supporting text | 12 px / 18 px | 400–500 | Normal |
| Code | 13 px / 22 px | 400 | Normal |
| Preview titles | 15 px / 22 px | 600 | `-0.02em` |
| Metric | 32 px / 38 px | 650 | `-0.035em`; tabular numerals |

Allow headings to wrap naturally; no forced single line or clipping. Do not tighten code tracking. Preserve readable source sizing on mobile. Measure layout after fonts resolve, and use the existing geometry-change cancellation policy if font loading changes an active trajectory.

## Global theme and visual tokens

**Dark mode is the default and the primary visual contract.** Set the page ground to `#050505`, including overscroll areas and the initial paint. Set the browser color scheme to dark. Do not introduce a theme switch or another AppState field.

Optionally layer two static, low-opacity radial fields over that ground: violet `rgb(109 40 217 / 0.10)` near the upper-right edge and ocean blue `rgb(29 78 216 / 0.06)` behind the lab's lower-left edge, each fading to transparent over a broad area. This is a subtle dark mesh, not a bright gradient backdrop. The page must still read as rich black. Build the mesh as background paint, not full-screen blurred DOM filters.

| Token | Value | Use |
| --- | --- | --- |
| `color.page` | `#050505` | Page ground, initial paint, overscroll |
| `color.glass` | `rgb(255 255 255 / 0.05)` | Pane/card material; `bg-white/5` |
| `color.glassHover` | `rgb(255 255 255 / 0.08)` | Hover fill for real controls |
| `color.glassBorder` | `rgb(255 255 255 / 0.10)` | 1 px translucent material edge; `border-white/10` |
| `color.glassBorderHover` | `rgb(255 255 255 / 0.20)` | Hover edge |
| `color.glassFallback` | `#111116` | Opaque fallback if blur/transparency is unavailable |
| `color.popover` | `rgb(12 12 18 / 0.96)` | Readable custom selector popup |
| `color.ink` | `#F5F5F7` | Primary text |
| `color.muted` | `#A3A3B3` | Supporting text; never globally dim pane content |
| `color.grid` | `rgb(255 255 255 / 0.08)` | Decorative 1 px dots, 20 px spacing |
| `color.accent` | `#7C3AED` | Violet identity and bounded accent details |
| `color.accentDeep` | `#6D28D9` | Morph gradient start |
| `color.accentBlue` | `#1D4ED8` | Morph gradient end and Button preview blue |
| `color.accentSoft` | `rgb(124 58 237 / 0.10)` | Feature-card tint and selected-control fill |
| `color.accentEdge` | `rgb(196 181 253 / 0.65)` | Luminous Morph edge |
| `color.focus` | `#C4B5FD` | Visible focus ring independent of glow |
| `color.code` | `rgb(8 8 13 / 0.78)` | Darker code backing beneath glass finish |
| `color.codeChrome` | `rgb(255 255 255 / 0.03)` | macOS-inspired title strip |
| `color.codeText` | `#E7EDF6` | Source text |
| `color.codeMuted` | `#A1AFC2` | Punctuation, line numbers, code notes |
| `color.tag` | `#93C5FD` | Component names |
| `color.attribute` | `#C4B5FD` | Attribute names |
| `color.string` | `#86EFAC` | Quoted literals |
| `color.success` | `#86EFAC` | Toast check and status cue |
| `color.successSoft` | `rgb(34 197 94 / 0.10)` | Check icon ground |

These are design targets, not a completed rendered contrast audit. Text must reach 4.5:1, large text 3:1, and essential control indicators 3:1 against the actual composited background. A decorative `border-white/10` edge is not sufficient on its own to identify selection or focus: use a clear checked marker, text treatment, and the explicit focus ring.

| Material token | Value |
| --- | --- |
| Glass blur | `backdrop-blur-xl`, nominally 24 px; static |
| Pane radius | 24 px desktop, 20 px mobile |
| Card radius | 16 px |
| Control radius | `9999px` / `rounded-full` |
| Token chip radius | 6 px |
| Pane shadow | `0 20px 64px rgb(0 0 0 / 0.36)` |
| Glass inner highlight | `inset 0 1px 0 rgb(255 255 255 / 0.06)` |
| Secondary control glow | `0 0 16px rgb(124 58 237 / 0.10)` |
| Spacing scale | 4, 8, 12, 16, 20, 24, 28, 32, 48, 64 px |

## Depth and glass materials

Panes and cards use the `bg-white/5 backdrop-blur-xl border border-white/10` material or its darker code equivalent. Light catches the top edge through a subtle inset highlight; a restrained black shadow separates planes. Keep the dark dot-grid visible through the preview glass at low contrast. No opaque white cards or flat gray page panels remain.

**Apply glass to separate decorative paint layers.** A pane's blur must not be on an ancestor wrapping the shared moving elements: backdrop filters create stacking contexts and can trap cross-pane travel. Put a rounded, noninteractive, `aria-hidden` glass layer behind each pane's content, with the moving slots as siblings in the existing shared stacking context. Use translucent background colors, not reduced opacity on the whole pane.

For preview cards, attach the blur/material plate to the stationary destination geometry. Keep it separate from the travelling surface paint, label, and icon. The moving paint retains a compatible translucent tint and border; do not attach a backdrop filter to a projected node or animate a blur radius. Destination glass appears through the existing surface-decoration opacity channel. Do not create new shared identities, duplicate active endpoints, or change spring settings to achieve the material.

Cap backdrop blur to the visible pane/card plates; do not blur each token or nest several blur layers unnecessarily. With unsupported backdrop filters, reduced-transparency preferences, or performance fallback, use `color.glassFallback`, the same borders and highlights, and fully readable text. Preserve the hierarchy without requiring blur.

## Custom controls — mandatory

**Do not use HTML `<select>` elements or native `<input type="radio">` controls, including hidden native inputs behind custom skins.** Build the header controls, template selector, and mode selector as fully custom-styled pill components. Semantic `<button>` elements remain required for button actions; banning default browser styling does not mean replacing accessible buttons with generic divs.

All interactive pills have at least a 44 × 44 px target, 16–20 px horizontal padding, translucent glass fill, a 1 px edge, and a restrained violet halo. Hover brightens the fill and border without moving the layout. Press darkens the fill; disabled controls retain readable labels and remove their halo. Focus is an explicit 2 px `color.focus` outline with 3 px offset, visually distinct from decorative glow. Preserve the existing 80–120 ms color-feedback timing; no scale, lift, spring, or animated sliding indicator is introduced for controls.

### Template selector

Use a labelled button trigger reading “Example: Button”, “Example: Toast”, or “Example: Bento”, with a Lucide chevron. It opens a custom single-select listbox with dark glass popup material, a 16 px radius, generous option spacing, and pill-shaped active option surfaces. Options remain exactly Button, Toast, Bento.

The trigger exposes `aria-haspopup="listbox"`, `aria-expanded`, and `aria-controls`. Label the popup “Example”; options use `role="option"` and `aria-selected`. Use one focus strategy consistently: a focusable listbox with `aria-activedescendant`, while options have no independent Tab stops.

Enter, Space, or Arrow Down opens the popup and activates the selected option. Up/Down move the active option, Home/End move to the first/last, and typeahead finds an option. Enter or Space commits the active option and returns focus to the trigger. Escape cancels without changing the template and returns focus. Tab closes without committing and follows normal focus order; outside pointer dismissal preserves the clicked target's focus. Pointer selection commits immediately. Navigation alone must not reset a template.

Keep the popup above the lab and within the viewport without clipping. An ordinary control-popover portal is permitted; this does not change the existing prohibition on portalling shared animation endpoints. Popup visibility and active-option focus are local ephemeral UI state, not additions to AppState.

### Mode selector

Use a glass pill containing two custom `<button role="radio">` options, Code and Component, inside a labelled `role="radiogroup"`. These are custom ARIA radio controls, not native radio inputs or tabs. Both panes remain visible.

Reflect the current mode with `aria-checked`, a persistent high-contrast marker, and a violet-tinted selected pill. Use roving `tabIndex`: only the selected option is in the Tab order. Left/Right and Up/Down move and select, wrapping between the two options; Home/End select the first/last; Space or Enter selects the focused option. A click selects directly. All dispatch the existing view command; selecting the current value remains a no-op. Update selected styling immediately without an animated indicator.

### Sound control

Use a custom glass pill button with visible “Sound off” / “Sound on”, the existing Lucide volume icon, stable accessible name “Sound”, and `aria-pressed`. Show the on state through a clear marker and brighter label, with a restrained accent edge. Preserve all existing sound preferences, playback behavior, and unavailable feedback.

### Morph — the hero action

Make Morph the strongest visual affordance on the page. Use a 52 px minimum height, 24 px horizontal padding, pill radius, white label, and the existing `ArrowRightLeft` icon at 18 px. Preserve “Morph to component” / “Morph to code” and reserve the longer label's width on desktop; fill the row on phones.

- Fill: static `linear-gradient(135deg, #6D28D9 0%, #7C3AED 52%, #1D4ED8 100%)`.
- Border: 1 px `rgb(196 181 253 / 0.65)`, plus a fine inner highlight.
- Depth: `0 8px 24px rgb(76 29 149 / 0.28)`.
- Glow: `0 0 20px rgb(124 58 237 / 0.22)`, localized to the button.
- Hover: brighter luminous edge and a subtle white fill overlay; retain a dark enough gradient for white-label contrast.
- Press: reduce the highlight and deepen the fill, without translation or scale.
- Focus: the separate explicit focus outline remains visible outside the glow.
- Disabled before readiness: retain the label and subdued gradient; remove the glow.

No pulsing halo, moving gradient, sparkle loop, shimmer sweep, or new animation physics. The premium effect comes from color, material, and hierarchy. Only this action receives the full vibrant gradient; secondary controls should not compete with it.

## Component specifications

### Code pane

Keep the macOS-inspired chrome: three decorative 10 px window dots, the current filename, and “Fixed example”. Use the darker glass backing, a translucent chrome strip, and a fine top highlight. Dots are not buttons or focus stops.

Use Geist Mono and authored line containers. Each moving `motion.span` remains `inline-block` or block, never plain inline. Long authored lines wrap between tokens; continuation indentation must fit 320 px. Line numbers stay decorative and hidden from assistive technology.

Mapped slots retain their fine underline. During travel, the active token rises above both material plates. The ordinary reference token retains reserved source geometry after departure. Do not collapse source spacing, indentation, or empty lines between modes. Do not reduce the whole source pane's opacity in rendered mode.

### Button preview

Keep the existing “Explore” label, up-right arrow, caption, mapping, and static illustrative behavior. Intrinsic width, minimum 156 px and height 48 px, 16 px horizontal padding, 10 px gap, 10 px radius. Retain the blue surface and white label/18 px arrow, adding only a fine translucent edge and restrained depth. The illustrative button must be visually subordinate to the real Morph hero action; no hover glow, pointer cursor, press response, or simulated click action.

### Toast preview

Keep the exact notification content and all four mappings. Width `min(360px, 100%)`, minimum height 100 px, 16 px padding and 12 px gap; 32 px icon area beside the text column. Replace the former white plate with the dark glass card material and 16 px radius. Use a 20 px light-green check on a translucent green ground, off-white title, and muted description.

Allow text wrapping. No close control, timer, action, or viewport-corner entrance is added; the arrival remains the existing morph.

### Bento preview

Preserve all existing content, 10 mappings, card ordering, icon, metric, and fictional-content caption. Width `min(460px, 100%)`. At a preview content width of at least 360 px, columns remain `1.2fr 1fr`, with 12 px gap; Feature spans two rows, Metric is above Status. Target minimum composition height is 260 px, with 16 px internal padding, 20 px Layers icon, and 32 px metric.

Use glass for all three cards. Add a restrained violet tint beneath the Feature plate; Metric and Status use neutral dark glass. Text is off-white with muted supporting text, and all edges are translucent. No opaque white card remains.

Below 360 px preview content width, stack Feature, Metric, Status using the existing container-query rule. Cards grow for wrapped text without fixed-height clipping; the caption remains visible.

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

Text and icons must remain readable while crossing both light and dark grounds. During spatial travel, give their wrappers a compact dark backing and light foreground, painted without changing slot dimensions. Keep the backing until that part settles, then remove it and apply its endpoint colors together; an optional 80 ms opacity finish is allowed. On reversal, retain the backing until the new destination settles. On immediate/reduced-motion paths, use endpoint colors directly. This backing is local transient presentation, cleared by the current run's completion or cancellation, not another application mode.

Stationary surfaces use the glass materials below; travelling surface paint keeps a stable tint and restrained shadow. Do not animate blur, backdrop filters, font size, line height, letter spacing, gradients, perspective, rotation, or camera movement. “Spatial” means visible travel between screen positions; v1 does not need 3D. Do not add an `x`/`y` keyframe animation to a node whose transform is owned by layout projection.

At rest, the final target layout must be indistinguishable from its static version. There must be no lingering scale, stretched type, or one-frame full-size flash at the destination.

### Layering and clipping

Use one shared lab stacking context. Pane ground and grid: layer 0. Stationary source syntax: layer 10. Moving surfaces: layer 20. Moving labels and icons: layer 30. Header controls and focus affordances: layer 50 outside the lab movement region.

The lab and all ancestors of moving pieces must allow visible overflow. Round backgrounds on separate paint elements; do not apply `overflow: hidden`, masks, `clip-path`, transforms, opacity less than 1, or paint containment to whole panes. A child's large z-index cannot escape an ancestor clipping boundary or stacking context. The divider sits behind the moving pieces. Keep the header outside the straight paths rather than masking travel near it.

No portal or DOM screenshot overlay is part of v1. Both endpoints live under the same React layout coordination tree. There is no nested pane scroller; the page scrolls naturally. Motion accounts for layout; the app does not calculate per-frame screen coordinates.

### Reduced motion and interruption

When reduced motion is requested, remove spatial projection for the change and use at most 120 ms of opacity. Mode, content, mapping legend, focus, and optional sound behavior remain identical. No looping or background motion exists in either setting.

Reverse from the current screen position when the same template changes mode. On a template change, resize, zoom-driven geometry change, scroll during flight, preference change, or visibility restoration, settle immediately to the latest state and clear stale visual work. Do not preserve an old offscreen trajectory. With offscreen endpoints, switch without travel and use SPEC R08's feedback.

## Copy and educational disclosure

Main explanation: **“Watch matching pieces move from code to component.”**

Mechanism explanation: **“Each moving piece has a matching name in both views. Morph moves it between those places. These examples are prepared in advance.”**

Disclosure technical note: **“In the implementation, this matching name is called a shared identity (`layoutId`). The code view is made of styled elements, too.”**

Use the per-template teaching sentences in SPEC.md. Prefer “piece”, “surface”, “label”, and “example” in interface copy. Avoid “compile”, “execute”, “transpile”, “build succeeded”, and “generated component” for this interaction.

## Accessible visual behavior

Custom styling must preserve accessible names, roles, states, keyboard navigation, and focus restoration. Use the explicit custom listbox and ARIA radio contracts above instead of the superseded native-select/native-radio instructions elsewhere. Keep all focus indicators visible and outside clipping. Decorative glass layers, mesh, grids, chrome dots, sizers, line numbers, and duplicate visual text are hidden from assistive technology.

Keep the existing full code text alternative, described preview illustrations, single polite status region, and native explanatory `<details>` disclosure. No extra per-piece announcements or preview actions are introduced.

In forced-colors mode, remove mesh, blur, gradients, shadows, and glows, and use system colors with explicit borders, selected markers, and focus outlines. Dark glass is the normal visual contract; high-contrast and reduced-transparency fallbacks remain fully usable. At increased text size, controls, headings, popovers, and cards wrap or grow without clipped text.

## Implementation review standard

Review all six settled template/mode states in desktop and phone layouts. Check rich-black initial paint, actual Geist/Inter font application, tightened heading tracking, glass depth, subtle dot-grid visibility, custom selector keyboard behavior, mode-control semantics, and Morph hierarchy.

Inspect contrast against composited glass, the entire Morph gradient, and hover/selected states. Check font loading, unsupported-blur fallback, reduced transparency, forced colors, and zoom. Confirm the listbox popup stays within the viewport and restores focus correctly.

Inspect forward/reverse motion, rapid reversal, and stacked mobile layout at departure, midpoint, and arrival. Glass must never clip or isolate shared pieces. Preserve the exact spring settings and existing shared-layout/reduced-motion contracts above. Static screenshots alone cannot establish continuity.

This revision changes the visual acceptance criteria for fonts, materials, and custom controls in older specifications; it does not authorize changes to physics, template content, or product state. Record browser evidence during implementation before claiming the redesigned appearance is verified.
