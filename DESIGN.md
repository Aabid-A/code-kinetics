# Design and motion specification

Product: **Spatial DOM Transition Lab**. This is the visual contract for the future `/` lab, not evidence of a rendered implementation. [SPEC.md](SPEC.md) owns behavior and content.

## Direction and surface purpose

The lab is an **Operate** surface with an educational focal interaction. The interface should be quiet enough to follow a single piece from source to destination. Honor the requested dark macOS-inspired source pane and light dot-grid preview. Use window chrome only on the code pane; it conveys a familiar environment without imitating a functioning desktop editor.

The signature is the continuous crossing of the boundary between those two environments. No hero illustration, gradient headline, glass panel, decorative orbit, three-dimensional camera, particle trail, or unrelated dashboard is needed. The only bento layout belongs inside the Bento example.

## Information hierarchy and layout

Reading order: identity → example and Morph controls → short explanation → Code / Component control → source and preview → current mapping explanation. The main Morph action is the highest-contrast control. The component preview is the visual destination, not a second toolbar.

Desktop topology, at 960 CSS pixels and wider:

```text
┌ Spatial DOM Transition Lab ───── Example [Button ▾]  Sound off  Morph to component ┐
│ Code-to-Component Morph Engine                                                   │
│ Watch matching pieces move from code to component.                              │
│ View: [Code | Component]                                                        │
├──────────────────────────────────┬──────────────────────────────────────────────┤
│ ● ● ●   Button.tsx  Fixed example│ Component preview                            │
│                                  │                                              │
│   Authored code-like elements     │       Neutral dot-grid                       │
│                                  │       and component destination              │
│ Mapped pieces start here.         │       Example caption                        │
├──────────────────────────────────┴──────────────────────────────────────────────┤
│ 3 mapped pieces · The name becomes the surface; the label and icon find ...      │
│ ▸ How the pieces match                                                          │
│ A visual demonstration with fixed examples. No code is compiled or run.          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

The drawing specifies hierarchy, not literal borders around every row. A maximum-width 1440 px content frame has 32 px outer gutters on wide screens, 24 px from 640–1199 px, and 16 px below 640 px. The desktop lab uses equal columns with `minmax(0, 1fr)`, separated by a 1 px divider. Header height is content-driven, at least 88 px on desktop. Avoid fixed viewport height and hidden body overflow.

Lab minimum height is 520 px on desktop. Both panes stretch to the larger content requirement, including wrapped Bento source. Pane padding is 28 px at desktop, 20 px on tablet, and 16 px on phone. Code chrome occupies 40 px above the code. The preview centers its component horizontally and vertically within its content region, with the caption in a separate row below.

Below 960 px, use a single column with source above preview, no CSS reordering of the reading sequence. The preview keeps at least 280 px of content height, increasing naturally for stacked Bento. The source expands to fit its lines; do not shrink font sizes to force both panes into one viewport. At 640–959 px, header controls may form a second row. Below 640 px, identity occupies a full row, Example and Sound share a row, and Morph occupies a full-width row. The mode control stays outside both panes and wraps without truncation.

Support 320 CSS px minimum width and 400% browser zoom through reflow. At short viewport heights, preserve content and allow page scrolling. If the complete journey cannot be seen, use the endpoint-only behavior in SPEC R08; do not auto-scroll or reduce the whole lab with CSS scale.

## Visual tokens

Values are proposed design tokens. Validate contrast in implementation; the numbers below are not a completed accessibility audit.

| Token | Value | Use |
| --- | --- | --- |
| `color.page` | `#F4F5F7` | Page ground |
| `color.panel` | `#FFFFFF` | Header controls, Toast, neutral cards |
| `color.canvas` | `#F8FAFC` | Render ground |
| `color.grid` | `#D8DEE8` | Decorative 1 px dots at a 20 px interval |
| `color.ink` | `#172033` | Primary text on light surfaces |
| `color.muted` | `#526074` | Supporting text on light surfaces |
| `color.border` | `#D6DCE5` | Decorative dividers |
| `color.controlBorder` | `#788598` | Control boundaries where required for recognition |
| `color.accent` | `#1D4ED8` | Morph action, preview Button, active selection |
| `color.accentHover` | `#1E40AF` | Pointer hover on primary controls |
| `color.accentSoft` | `#E9EFFF` | Mapping markers and feature card |
| `color.code` | `#11151D` | Code background |
| `color.codeChrome` | `#1A202B` | Code window title strip |
| `color.codeText` | `#E7EDF6` | Main source text |
| `color.codeMuted` | `#A1AFC2` | Line numbers, punctuation, code notes |
| `color.tag` | `#93C5FD` | Component names |
| `color.attribute` | `#C4B5FD` | Attribute names |
| `color.string` | `#86EFAC` | Quoted literals |
| `color.success` | `#166534` | Toast check and status cue |
| `color.successSoft` | `#ECFDF3` | Check icon ground |
| `color.focusLight` | `#1D4ED8` | Focus ring on light surfaces |
| `color.focusDark` | `#93C5FD` | Focus ring if a dark-surface control is introduced |

Decorative dots and dividers need not act as control boundaries. Functional text must reach 4.5:1 contrast, large text 3:1, and essential UI indicators 3:1 against adjacent colors. Never lower the opacity of the entire code view in rendered mode; reference text remains readable. Identify mapped tokens by a fine underline and a legend, not color alone.

| Token group | Values |
| --- | --- |
| Spacing | 4, 8, 12, 16, 20, 24, 28, 32, 48 px |
| Radius | 6 px token chip; 8 px controls; 12 px cards and outer lab |
| Main type | System UI stack, `-apple-system`, BlinkMacSystemFont, Segoe UI, sans-serif |
| Code type | `ui-monospace`, SFMono-Regular, Menlo, Consolas, monospace |
| Title | 20 px / 28 px, 650 weight; 18 px / 26 px on narrow screens |
| Body | 14 px / 22 px, 400 weight |
| Control | 14 px / 20 px, 600 weight |
| Supporting | 12 px / 18 px, 400–500 weight |
| Code | 13 px / 22 px, 400 weight, unchanged on mobile |
| Preview titles | 15 px / 22 px, 600 weight |
| Metric | 32 px / 38 px, 650 weight, tabular numerals |
| Card shadow | `0 6px 20px rgb(23 32 51 / 0.08)` |

No externally loaded font is necessary. Avoid font-dependent pixel assumptions; widths follow measured DOM boxes. All controls have a minimum 44 × 44 px target. Icons are normally 18 px with a consistent Lucide stroke width of 1.75; preview icons can be 20 or 24 px as specified below. Decorative macOS dots are 10 px, not buttons and not keyboard stops.

## Component specifications

### Header and mode control

Use a native select with visible “Example” label. Preserve its platform behavior. The sound control includes visible state text and `Volume2` / `VolumeX`; the icon alone is insufficient. Morph uses a filled accent background, white text, and `ArrowRightLeft`. Its width reserves the longer label on desktop to prevent header movement; on phones it fills its row.

Code / Component is a two-option native radio group with a segmented visual treatment, not tabs: both panes remain visible. The selected option has a contrasting inset background and a checked indicator. Focus is a 2 px outline with 3 px offset, not just a background-color change. Avoid layout animation on the control itself.

### Code pane

Use a real `<code>`-style visual font with authored line containers. Each moving `motion.span` is `inline-block` or block, never plain inline. Long authored lines can wrap between tokens; continuation indentation remains small enough to fit 320 px. Line numbers are decorative and hidden from assistive technology.

Unmapped syntax uses restrained colors. Moving token slots have a subtle underline while stationary. During travel, the active token rises above both pane grounds. After departure, the ordinary reference token retains the same reserved source geometry and underline. Do not collapse spaces, indent levels, or empty lines between modes.

### Button preview

Intrinsic width, minimum 156 px and minimum height 48 px, with 16 px horizontal padding, 10 px gap, 10 px radius. Blue surface, white label and 18 px arrow. It is a static illustration using presentational DOM within the described preview figure. No hover glow, pointer cursor, pressed feedback, or simulated click action on the example itself.

### Toast preview

Width `min(360px, 100%)`, minimum height 100 px, 16 px padding, 12 px gap. Layout: 32 px icon area beside a text column. A 20 px green check sits on a pale green round ground. The title and supporting text can wrap. No close control and no toast entrance from a viewport corner: its arrival is the morph.

### Bento preview

Width `min(460px, 100%)`. At a preview content width of at least 360 px, use columns `1.2fr 1fr`, gap 12 px; feature spans two rows, with metric above status in the second column. Target minimum composition height 260 px. Feature ground is accent-soft; metric and status are white with subtle borders. Internal padding 16 px, 20 px Layers icon, and a 32 px metric.

Below 360 px of preview content width, stack Feature, Metric, Status with 12 px gaps. Use CSS container queries against the preview content region, so viewport and pane width cannot disagree. Cards expand for wrapped text; no fixed-height clipping. The fictional-content caption remains visible below.

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

Surfaces use solid colors and restrained shadows. Do not animate blur, backdrop filters, font size, line height, letter spacing, gradients, perspective, rotation, or camera movement. “Spatial” means visible travel between screen positions; v1 does not need 3D. Do not add an `x`/`y` keyframe animation to a node whose transform is owned by layout projection.

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

Native control semantics must survive styling. Keep focus visible in all states and outside any clipping. Decorative grids, chrome dots, line numbers, sizers, and duplicate visual text are hidden from assistive technology. Do not add status updates per moving piece. Preview illustrations have full textual descriptions.

In forced-colors mode, remove decorative grid/shadows and use system colors, visible borders, underlines, and checked indicators. At increased text size, allow labels and descriptions to wrap; controls and cards grow vertically. The disclosure remains a native keyboard-operable `<details>` element; it does not need new AppState fields.

## Implementation review standard

Review six settled template/mode states, forward and reverse motion, rapid reversal, and stacked mobile layout. Inspect frames at departure, midpoint, and arrival. Static screenshots alone cannot establish continuity. QA.md defines the browser, accessibility, performance, and failure evidence required before claiming the design works.
