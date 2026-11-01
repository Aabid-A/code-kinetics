# Functional specification

Product: **Spatial DOM Transition Lab** · **Code-to-Component Morph Engine**.

Status: normative v1 behavior, documentation only. Product scope is in [PRODUCT.md](PRODUCT.md); visual and motion values are in [DESIGN.md](DESIGN.md).

## R01 — Application structure and first load

Serve the lab at `/`. The document title is “Spatial DOM Transition Lab — Code-to-Component Morph Engine”. Use one page heading, a header control region, a main lab containing two labelled sections, and a compact explanatory area below it.

Initial state is exactly `{ activeTemplate: "button", viewMode: "code", soundEnabled: false }`. Render this same initial state on the server and first client render. No entrance flight, auto-morph, focus theft, or startup sound. Before hydration, show the code and explanatory text; interactive controls are disabled until their event handlers are available. With JavaScript unavailable, show a concise notice that interaction requires JavaScript, while the initial example and explanation remain readable.

## R02 — Minimal state and commands

```ts
type TemplateId = "button" | "toast" | "bento";
type ViewMode = "code" | "rendered";

type AppState = {
  activeTemplate: TemplateId;
  viewMode: ViewMode;
  soundEnabled: boolean;
};
```

This is the complete durable product state. Do not add `isCompiled`, `isPlaying`, progress, code text, preview data, or duplicated selected-control state. Runtime refs, browser preference subscriptions, native disclosure state, and local accessibility/audio feedback are implementation details described in ARCHITECTURE.md, not additions to AppState.

| Command | State result | Other behavior |
| --- | --- | --- |
| `MORPH` | Flip the latest `viewMode` | Begin or retarget the spatial transition; eligible sound cue |
| `SET_VIEW(mode)` | Set requested mode | If already selected, no animation, sound, or announcement |
| `SELECT_TEMPLATE(id)` with a different id | Set template and reset mode to `code`; preserve sound preference | Cancel previous visual run and sound; replace example without cross-template flight |
| `SELECT_TEMPLATE(id)` with current id | No change | Do not reset mode |
| `TOGGLE_SOUND` | Flip `soundEnabled` | Enabling prepares audio; disabling stops any cue immediately |

Only these commands change AppState. Use the latest state when applying commands, including rapid successive events. Invalid template/mode input is ignored and surfaced as a development error; the UI never offers invalid values. Reload restores the initial state. There are no query parameters or browser-history entries for lab interactions.

## R03 — Header and controls

| Element | Visible content | Behavior and semantics |
| --- | --- | --- |
| Identity | Spatial DOM Transition Lab | Main heading; secondary name on a subordinate line |
| Template selector | Label “Example”; Button, Toast, Bento | Native select; selection commits immediately |
| Sound toggle | “Sound off” / “Sound on” plus Lucide volume icon | Native button with stable accessible name “Sound”, `aria-pressed` follows preference |
| Morph action | “Morph to component” in code; “Morph to code” in rendered | Native button; text reflects the next destination immediately after each command |
| Mode selector | “Code” / “Component” | Native radios in a labelled “View” fieldset, visually segmented; values `code` / `rendered` |

Both mode controls dispatch the same state commands. No global letter-key shortcuts in v1. Native Enter, Space, select keys, radio arrow keys, and Tab work normally. Morph remains enabled during animation. Pointer press styling is cosmetic and must not change the moving lab's geometry.

Focus stays on the control that initiated the change. Template selection does not send focus to the code. The preview has no focusable mock controls; unmounting it cannot strand focus.

## R04 — Two persistent panes

The code pane has dark macOS-inspired chrome, three decorative window dots, the filename `Button.tsx`, `Toast.tsx`, or `Bento.tsx`, line numbers, and the label “Fixed example”. It is not a textbox or editor. No caret, editing cursor, file tabs, line selection tools, or syntax-error UI.

The render pane has the title “Component preview” and a neutral dot-grid. In code mode it shows an unobtrusive empty-state instruction: “Choose Morph to see these pieces become a component.” No finished component ghost should compete with the journey. Reserve enough layout space for the eventual preview.

In rendered mode, the left pane remains readable. The positions vacated by moving tokens are filled by ordinary, unshared reference tokens, with an underline marker identifying their correspondence. They are not second active animation endpoints. Punctuation and unmapped tokens remain stationary. Add “Mapped pieces are shown in the preview.” beneath the code. In code mode use “Mapped pieces start here.”

Treat the left reference tokens and the active moving pieces as two different presentation roles. Retaining readable reference text is intentional; the implementation must not attach shared IDs to those references.

## R05 — Fixed templates and exact content

The following snippets specify visible content and line breaks, not runtime strings to parse or executable source. Represent them as authored lines and token objects. Quotation marks, indentation, brackets, and closing tags are stationary tokens. Only the occurrences explicitly listed in the mapping tables move. The same source text feeds a separate accessible text representation by joining those authored tokens.

### Button

```tsx
<Button
  icon={<ArrowUpRight />}
>
  Explore
</Button>
```

Preview: a blue, rounded button illustration with “Explore” followed by an up-right arrow. Caption: “Example component · not interactive”. Accessible description: “Example button labelled Explore, with an up-right arrow.”

| Part key | Exact source occurrence | Render destination | Kind |
| --- | --- | --- | --- |
| `surface` | Opening tag name `Button`, line 1 | Blue button surface | Surface |
| `icon` | `ArrowUpRight`, line 2 | Arrow icon wrapper | Icon |
| `label` | `Explore`, line 4 | Button label | Text |

Teaching sentence: “The name becomes the surface; the label and icon find their places.” Total: 3 mapped pieces.

### Toast

```tsx
<Toast>
  <CircleCheck />
  <Title>Changes saved</Title>
  <Description>
    Your workspace is up to date.
  </Description>
</Toast>
```

Preview: a white notification card with green check icon, title “Changes saved”, and description “Your workspace is up to date.” This is sample content, not an actual save result. No close button, timer, auto-dismiss, Undo action, or alert semantics.

| Part key | Exact source occurrence | Render destination | Kind |
| --- | --- | --- | --- |
| `surface` | Opening tag name `Toast`, line 1 | Card surface | Surface |
| `icon` | `CircleCheck`, line 2 | Check icon wrapper | Icon |
| `title` | `Changes saved`, line 3 | Title | Text |
| `description` | `Your workspace is up to date.`, line 5 | Supporting text | Text |

Teaching sentence: “A surface, icon, and two lines of text keep their matching identities.” Total: 4 mapped pieces. Accessible description repeats the example title and description and identifies it as an illustrative notification.

### Bento

```tsx
<Bento>
  <Feature icon={<Layers />}>
    <Title>Build in layers</Title>
    <Text>Small pieces. One interface.</Text>
  </Feature>
  <Metric>
    <Value>12</Value>
    <Label>Components</Label>
  </Metric>
  <Status>
    <Title>Ready to ship</Title>
    <Text>All pieces in place.</Text>
  </Status>
</Bento>
```

Preview: three cards in a bento composition. The larger feature card spans the left column; metric and status cards stack on the right. At narrow widths, all three stack in source order. “12” is fictional sample content, unrelated to the actual count of mapped pieces. Use the visible caption “Example component · fictional content · not interactive”.

| Part key | Exact source occurrence | Render destination | Kind |
| --- | --- | --- | --- |
| `feature.surface` | `Feature`, line 2, opening tag only | Feature card surface | Surface |
| `feature.icon` | `Layers`, line 2 | Layers icon wrapper | Icon |
| `feature.title` | `Build in layers`, line 3 | Feature title | Text |
| `feature.description` | `Small pieces. One interface.`, line 4 | Feature supporting text | Text |
| `metric.surface` | `Metric`, line 6, opening tag only | Metric card surface | Surface |
| `metric.value` | `12`, line 7 | Large metric value | Text |
| `metric.label` | `Components`, line 8 | Metric label | Text |
| `status.surface` | `Status`, line 10, opening tag only | Status card surface | Surface |
| `status.title` | `Ready to ship`, line 11 | Status title | Text |
| `status.description` | `All pieces in place.`, line 12 | Status supporting text | Text |

The outer `Bento` token, closing tag names, and other tags do not travel. Total: 10 mapped pieces. Teaching sentence: “Several small pieces can move together without losing their relationships.” Accessible description lists the three cards and labels the metric fictional.

## R06 — Mapping identity and ownership

Each listed part has one source slot and one destination slot. Its stable local identity is `${templateId}:${partKey}`. A stable lab instance namespace wraps all panes. IDs must not include the current mode, line number, displayed text, array index, or a random value.

At rest, each shared identity has exactly one live owner: the source in code mode, or the preview in rendered mode. The reference tokens have no `layoutId`. Both endpoint changes occur in the same React commit under one LayoutGroup. A narrow outgoing/incoming overlap managed for visual handoff is allowed, with at most two nodes per identity during that handoff. Never leave two permanent live owners.

The surface token's text can fade out as its background expands; a tag name does not literally turn into a new string. Icon names crossfade to SVG artwork inside an HTML wrapper. Labels with matching text retain readable text. This is a visual correspondence, not text-shape interpolation.

## R07 — Morph behavior and interruption

Movement is bidirectional, simultaneous across mapped pieces, and governed by DESIGN.md. `viewMode` records the latest requested destination immediately; it is not delayed until the animation finishes.

Repeated Morph commands reverse direction from the current presentation. Do not queue commands, lock controls, replay intermediate destinations, or finish an old run before accepting a new one. A same-mode radio selection is a no-op. Browser event batching may coalesce changes within one frame; the final requested state must still be correct.

A template change removes the previous template's active pieces and starts the new template in code mode, with no flight between templates. Sound preference survives. Previous callbacks or audio promises must not affect the new template.

Status is semantic, not a progress meter. A polite live region announces the latest request, for example “Toast: component view selected” or “Bento selected. Code view.” It must never claim completion based on an expired timer. Coalesce rapid announcements to the latest request after 150 ms of inactivity; this affects speech only, not state or visuals.

## R08 — Responsive and changed geometry

At widths of at least 960 CSS pixels, code is left and preview right. Below 960, code is above preview and the same mappings travel vertically. Both remain in document flow, with natural page scrolling; there is no mobile replacement route or pane-hiding tab.

Wrap long code at authored safe whitespace boundaries before allowing page overflow. Never split a mapped piece across two layout boxes; the block containing it may wrap its own text as one measurable box. Keep line-number and continuation alignment clear. Do not use a horizontally scrolling code pane in v1.

If either pane's active content region is not fully within the viewport at activation, use an immediate endpoint change rather than flying from or toward unseen content. Show “View changed. Scroll to compare the example.” and announce the selected view. Do not auto-scroll. This visibility check is an environmental input, not product state.

Resize, orientation change, or browser zoom during a flight cancels spatial projection and presents the requested endpoint at the new geometry. Retain AppState. If the user scrolls during flight, likewise settle to the endpoint without locking scrolling. A later activation starts from the current geometry. No guarantee of an uninterrupted trajectory through a live resize is made.

## R09 — Sound

Sound defaults off on every page load. Enabling it does not itself play a cue. Use one quiet, locally supplied, non-verbal click/whoosh, no longer than 180 ms; identical for both directions. Play only after a genuine mode-changing user activation. Template selection, no-op selection, focus, hover, page load, and completion do not play sound.

Use a maximum playback volume setting of 0.15 as a starting design value, verified by listening on speakers and headphones. There is at most one cue playing. A new cue replaces the old one; toggling sound off or changing templates stops playback. If audio is not ready at activation, skip the cue; do not play it late. Sound never blocks the morph.

If loading or playback fails, keep the preference but show “Sound unavailable” as supplementary feedback and announce it once. The toggle still allows turning the preference off. No permission dialog or repeated automatic retry is added by the app. Retry preparation on a later explicit off-to-on toggle. Reduced motion does not silently change the sound preference.

## R10 — Accessibility and explanation

Provide an always-visible one-sentence explanation and the fixed-example disclaimer from PRODUCT.md. Below the panes, show the current template's mapped-piece count and a native disclosure labelled “How the pieces match”. Its contents list human-readable source → destination pairs from the mapping table. Use “Shared identity (`layoutId`)” only inside this disclosure to introduce the technical term.

Visible animated code is `aria-hidden`; expose a single visually hidden, complete `<pre><code>` representation generated from the same token data. Keep that accessible source present in both modes. Never make the entire labelled code section `aria-hidden`.

The rendered preview is a labelled figure containing a static illustration with `role="img"` and a full text description. Decorative children are hidden from assistive technology and have no focusable descendants. It is implemented with React elements styled as the examples, not with a raster screenshot. The Toast illustration must not use `role="alert"` or an independent live region. Code-mode preview instruction remains ordinary accessible text.

Honor `prefers-reduced-motion`: no spatial travel, scaling, stagger, or overshoot; change to the same endpoint with at most a 120 ms opacity transition. Keep the legend, descriptions, and controls equally useful. Announce destination selection once, not every token. User changes to the preference during flight settle immediately.

## R11 — Failure and degraded modes

| Condition | Required outcome |
| --- | --- |
| JavaScript unavailable | Initial code and explanation readable; controls unavailable; explicit notice |
| Audio missing, blocked, or unsupported | Silent morph remains fully usable; supplementary feedback as R09 |
| Reduced motion or unavailable geometry | Correct endpoint without spatial animation |
| Template registry invariant fails | Development assertion; production lab error boundary shows “This example could not be displayed. Reload the lab.” and a reload button |
| Render exception | Contained error message; no endless animation spinner |
| Fonts load late | Prefer system fonts; any geometry change settles the endpoint |
| Hidden tab during movement | Stop sound; settle visual run on visibility restoration; no catch-up sound |

No network request, fake build delay, loading percentage, or compilation status belongs to a normal morph.

## R12 — Completion criteria

All content and mappings above are fixed. Six template/mode endpoint combinations must be stable. All commands must obey R02. Cross-pane motion, reverse motion, reduced motion, and degradation must satisfy R06–R11. The complete verification and evidence plan is [QA.md](QA.md); implementation cannot be called complete based only on static screenshots.
