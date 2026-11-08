# Quality assurance and acceptance plan

Product: **Spatial DOM Transition Lab**. This is the test specification for the implemented lab. What has actually been run, and what has not, is recorded under "Current results" below; anything not listed there as run has not been verified.

## Current results (8 November 2026)

### Test environment

Linux 6.18.44, Node v22.23.4, Playwright 1.64.1, @axe-core/playwright 4.14.0, headless Chromium from the pre-installed build `/opt/pw-browsers/chromium-1243` (Chrome for Testing 153.0.8010.12), viewport 1440 × 900 and device scale 1 unless a test sets another. Branch `claude/jolly-hopper-ffu1aq`; production server on 127.0.0.1:4173 (`npm run start`), except `tests/devmode.spec.ts`, which starts its own `next dev` on 127.0.0.1:4175.

This Playwright expects Chromium build 1248 and ffmpeg build 1013, neither of which is installed here. The suite therefore ran with a temporary config **outside the repository** that imports `playwright.config.ts` unchanged and overrides only two things: `launchOptions.executablePath` (the Chromium 1243 binary) and `video: "off"`, because recording video needs the missing ffmpeg 1013. **`playwright.config.ts` itself is unchanged** (it still sets `video: "on"`). **Video evidence: not run** in this environment. Tracing was off (`--trace off`) for every run.

The command lines below omit that temporary config (`-c <temporary config>`); in an environment with the expected browsers, run them as written.

### Commands

| Command | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run build` | Pass; routes `/`, `/_not-found`, `/icon.svg` only (the test fixture route is not built, see Q04) |
| `npx playwright test --trace off` | 61 of 61 passed |
| `npx playwright test --trace off --repeat-each=10` | 610 of 610 passed (61 tests × 10) |
| `npx playwright test --trace off --repeat-each=3 tests/accessibility.spec.ts tests/environment.spec.ts tests/devmode.spec.ts tests/robustness.spec.ts tests/performance.spec.ts` (new tests) | 114 of 114 passed |

Test files: `button.spec.ts` 7, `controls.spec.ts` 6, `failure.spec.ts` 3, `templates.spec.ts` 7, `accessibility.spec.ts` 15, `environment.spec.ts` 6, `devmode.spec.ts` 2, `robustness.spec.ts` 13, `performance.spec.ts` 2: 61 tests.

### Intermittent failures

Three intermittent failures were reported before this pass. Root causes found by `npx playwright test --trace off --repeat-each=10` (22 tests, 220 runs, 2 failed):

1. `templates.spec.ts` › "bento: continuous forward/reverse…", assertion that some sampled frame has spring progress between 0.35 and 0.7 ("midway"). Cause: sampling, not the app. The spring spends about 59 ms in that band, and headless frames can be up to about 87 ms apart. Fixed by asserting equal progress across parts on **every** frame between 5% and 95% progress (same 0.1 tolerance).
2. `button.spec.ts` › "desktop forward, reverse…", assertion that a sampled frame shows the surface straddling the pane divider. Same sampling cause. Fixed by testing the path between sampled frames as well (`straddlesDivider`, `tests/motion.ts`), as the template specs already did.
3. Third failure: **not reproduced in 690 runs on Chromium 1243 headless; original failure unidentified.**

After the fixes, 230 of 230 runs passed, twice.

### Recorded measurements (Q09, Q11)

Contrast, measured by `tests/contrast.ts` against the composited background as rendered: text and icons are recorded, hidden, the page is screenshotted, and each foreground colour is composited over every background pixel under it; the worst pixel is reported. Large text is ≥ 24 px, or ≥ 18.66 px at weight ≥ 700. Indicators are icons, the checked View marker and the focus ring (3:1). A control check, `#777` on `#888`, measures 1.26:1, matching the WCAG formula. Command: `npx playwright test --trace off tests/accessibility.spec.ts --reporter=json` (attachments `contrast.json`, `forced-colors-contrast.json`).

| State | Text (≥ 4.5:1): lowest | Large text (≥ 3:1): lowest | Indicators (≥ 3:1): lowest |
| --- | --- | --- | --- |
| Button / code | 5.70:1, `button.morph-button` "Morph to component" (38) | 18.61:1, `h1` | 6.30:1, Morph button icon (9) |
| Button / rendered | 5.33:1, `button.morph-button` "Morph to code" (38) | 18.61:1, `h1` | 5.67:1, Morph button icon (10) |
| Toast / code | 5.70:1, `button.morph-button` (42) | 18.61:1, `h1` | 6.30:1, Morph button icon (9) |
| Toast / rendered | 5.33:1, `button.morph-button` (43) | 18.61:1, `h1` | 5.67:1, Morph button icon (10) |
| Bento / code | 5.70:1, `button.morph-button` (71) | 18.61:1, `h1` | 6.30:1, Morph button icon (9) |
| Bento / rendered | 5.33:1, `button.morph-button` (75) | 17.79:1, Bento metric value "12" | 5.67:1, Morph button icon (10) |
| Forced colors, Toast / code | 8.45:1, `.identity p` (42) | 21:1, `h1` | 8.73:1, checked View marker (9) |
| Forced colors, Toast / rendered | 8.45:1, `.identity p` (43) | 21:1, `h1` | 8.73:1, checked View marker (10) |

Numbers in brackets are how many items of that kind were measured in the state.

No measured ratio is below 4.5:1 for text or 3:1 for large text and indicators. Not measured: hover and pressed states, the open Example listbox, and mid-flight frames.

Bundle and frame timing: **recorded, no budget set.** Command: `npx playwright test --trace off tests/performance.spec.ts --reporter=json` (annotations and attachments `scripts.json`, `frame-timing.json`).

| Measurement | Final run (`--reporter=json`, whole suite) | Earlier sample (`tests/performance.spec.ts` alone) |
| --- | --- | --- |
| Initial route JavaScript | 6 scripts, 604.8 KiB raw, 184.0 KiB gzip | Same |
| Frame intervals over 10 morphs | 318 frames; median 33.3 ms, p95 49.9 ms, max 50.1 ms; 34.3% ≤ 20 ms | 329 frames; median 33.3 ms, p95 33.4 ms, max 50.1 ms; 36.5% ≤ 20 ms |
| Long tasks during the morphs | 0 | 0 |
| Click to first visible change | median 116.1 ms, max 132.8 ms | median 66.2 ms, max 132.7 ms |

The headless browser renders at about 30 frames per second here, so the frame and latency numbers describe this container, not the product.

These are headless software-rendered numbers on a shared container, not the reference laptop or phone that Q11 requires. Initial JavaScript gzip is computed with Node zlib's default level over the script responses of the first load.

### Case status

"Pass" means the automated checks in "Covered" passed with the evidence command. Everything in the "Not run" column is not run. No case is complete until its "Not run" column is empty.

| Case | Automated status | Covered | Evidence command | Not run |
| --- | --- | --- | --- | --- |
| Q01 Initial load | Pass | Server-rendered source, disabled controls and no-JS notice; default state; no console errors or hydration messages in any test; blocked storage (every storage API throws): loads, works, and reload returns the exact default state; development Strict Mode | `npx playwright test --trace off tests/button.spec.ts tests/robustness.spec.ts tests/devmode.spec.ts` | Real browsers other than Chromium |
| Q02 State contract | Pass | Initial state; Morph twice restores; same-view no-op; Select template and Toggle sound over all 12 states | `npx playwright test --trace off tests/button.spec.ts tests/templates.spec.ts` | Invalid-input diagnostic; stale callback and audio-result assertions in unit form |
| Q03 Controls | Pass | Listbox, radiogroup and Sound pill keyboard and pointer contracts; 44 px targets; no native select or radio; Tab order (Example, Sound, Morph, checked View radio, disclosure) identical at 960 and 959 px; selector, radio, Morph label, endpoint and status message agree after every Q07 sequence; forced-colors checked marker and focus outline | `npx playwright test --trace off tests/controls.spec.ts tests/environment.spec.ts tests/robustness.spec.ts tests/accessibility.spec.ts` | Screen-reader announcements; manual keyboard walk-through |
| Q04 Content and identity | Pass | 3/4/10 parts, exact sources, one owner per identity; registry invariant failure is contained; two lab instances on one page: morphing or changing one never moves or changes the other (fixture `src/app/fixtures/two-labs/page.fixture.tsx`, routed only in the dev-mode test server) | `npx playwright test --trace off tests/templates.spec.ts tests/failure.spec.ts tests/devmode.spec.ts` | None |
| Q05 Continuous movement | Pass | Sampled geometry for all templates: travel, hit-testing, unscaled text and icons, reverse, interruption | `npx playwright test --trace off tests/button.spec.ts tests/templates.spec.ts` | Filmstrips and video review (video off, see environment); contrast during transit over both grounds |
| Q06 Responsive layout | Pass | 1440, 1024, 960 (split), 959 (stacked), 768 × 1024, 390, 320 and 844 × 390: no horizontal overflow, one layout tree, source before preview; 768 × 1024 travels for Button and Toast and shows the compare notice for Bento (its preview does not fit); 844 × 390 shows the compare notice for all three, with no automatic scroll; 200% zoom (1440 × 900 at 200%, emulated as a 720 × 450 CSS viewport at device scale 2): no overflow, no truncated control, all controls reachable; Bento 360 px threshold | `npx playwright test --trace off tests/environment.spec.ts tests/templates.spec.ts tests/button.spec.ts` | 400% zoom; real browser zoom and text-only enlargement; forced colors at small widths |
| Q07 Rapid input | Pass | Every sequence in the Q07 table at 100 ms and 30 ms spacing with real browser events: final state after settling and again after 2 s; one owner per identity; live region ends on the latest view, at most one message per input | `npx playwright test --trace off tests/robustness.spec.ts tests/button.spec.ts tests/templates.spec.ts` | Late sounds (no audio asset) |
| Q08 Environment changes | Pass | During a flight: resize, scroll and reduced-motion change; orientation change (CDP screen orientation, portrait to landscape); tab hiding, **simulated** (headless Chromium never reports a hidden tab, so `visibilityState` is overridden and a real `visibilitychange` event dispatched). All settle at the new geometry, keep the latest state and focus, and do not resume old motion. Strict Mode: one live observer and listener set per lab after the extra mount | `npx playwright test --trace off tests/environment.spec.ts tests/button.spec.ts tests/devmode.spec.ts` | Zoom during flight; a real hidden tab; audio stopping on hide (no asset); unmount during motion or a pending play promise |
| Q09 Accessibility | Pass | axe (@axe-core/playwright 4.14.0, default rules) in all six settled states: 0 violations. axe "needs review" items: `aria-valid-attr-value` on the Example trigger (axe cannot confirm an `aria-controls` target behind `aria-haspopup`; the target exists, checked in `controls.spec.ts`) and `color-contrast` over gradients (measured separately, all pass). Contrast as recorded above; forced colors (emulated `forced-colors: active`): system colours, checked marker, borders, piece outlines, focus outline, contrast; reduced motion removes transforms | `npx playwright test --trace off tests/accessibility.spec.ts tests/templates.spec.ts` | VoiceOver, NVDA; manual semantic review; axe with the listbox open; real Windows High Contrast; reduced transparency |
| Q10 Sound | Pass | Missing asset: one visible and announced "Sound unavailable", preference kept, silent morph, retry only after off then on | `npx playwright test --trace off tests/failure.spec.ts` | Any audible cue and every row needing one (no asset exists); autoplay policy; real mobile browsers; listening review |
| Q11 Performance | Recorded, no budget set | Initial JavaScript size and a 10-morph frame-timing sample, as recorded above | `npx playwright test --trace off tests/performance.spec.ts --reporter=json` | Budget evaluation on the reference laptop and phone; CLS; interaction latency on reference hardware; node and listener growth over 100 morphs; throttled CPU; morph network requests |
| Q12 Failure and scope | Pass | JavaScript disabled; asset 404 (audio blocked) keeps everything else working; injected effect exception and an invalid registry both show the contained error message and reload button | `npx playwright test --trace off tests/failure.spec.ts tests/button.spec.ts` | Offline after load; reload returning default after the error fallback; dependency and source review for excluded capabilities |
| Educational usability | Not run | None | None | Whole check |

Browser and device coverage: Chromium only. Firefox, Safari/WebKit, real iOS and Android devices, VoiceOver and NVDA: **not run**. Audio provenance and listening review: **not run** (no asset).

### Defects fixed in this pass

- Sound pill (`label-content-name-mismatch`, serious, all six states): the accessible name "Sound" came from `aria-label` and did not include the visible "Sound off/on", breaking voice control (WCAG 2.5.3). The name is now the visible word "Sound"; the state word is hidden from assistive technology, and `aria-pressed` carries the state. SPEC R03's stable name "Sound" is kept.
- Forced colors: mapped pieces were sized to their text, so their 1 px forced-colors border overlapped the last glyph. They now use a 1 px outline with a 1 px offset, which takes no layout space.

## Release standard

Release only when all mandatory requirements in [SPEC.md](SPEC.md) pass, all six template/mode endpoints match [DESIGN.md](DESIGN.md), and real-time motion has been inspected. A working endpoint reached through a crossfade does not satisfy normal-motion cross-pane travel. A beautiful animation with an incorrect state, duplicate identity, inaccessible control, or clipping defect does not pass.

Classify defects as critical (crash, state corruption, unsafe execution), major (core journey, accessibility, or content failure), or minor (cosmetic issue without task impact). No critical or major defects may remain. Record any minor exceptions explicitly with scope and rationale; do not describe an untested area as passing.

## Requirement traceability

| Requirement | Primary verification |
| --- | --- |
| R01 Structure and first load | Q01 hydration, Q12 no JavaScript |
| R02 Minimal state and commands | Q02 state table, Q07 interruption |
| R03 Controls | Q03 keyboard and control synchronization |
| R04 Persistent panes | Q04 endpoint inspection, Q05 geometry |
| R05 Fixed templates | Q04 content and mapping invariants |
| R06 Identity and ownership | Q04 registry checks, Q05 motion evidence |
| R07 Morph and interruption | Q05 bidirectional continuity, Q07 rapid input |
| R08 Responsive and geometry | Q06 reflow, Q08 environmental cancellation |
| R09 Sound | Q10 audio lifecycle and failure |
| R10 Accessibility and explanation | Q09 assistive technology, Q06 zoom |
| R11 Degraded modes | Q08 cancellation, Q10 audio failure, Q12 fallbacks |
| R12 Completion | All mandatory cases and evidence packet |

## Environments and evidence rules

Use a production build for performance and final behavior. Also test development Strict Mode for resource cleanup. Record package versions, commit, browser version, OS, hardware, viewport, device-pixel ratio, zoom, and reduced-motion setting with evidence.

Required browser coverage: current stable Chrome/Chromium, Firefox, and Safari/WebKit available at implementation sign-off; Safari on a real iOS device and Chrome on a real Android device for touch/audio smoke tests. Browser automation using WebKit is useful but does not replace real Safari audio validation. Record exact tested versions, rather than a vague “all modern browsers” claim.

| Viewport / condition | Required coverage |
| --- | --- |
| 1440 × 900 | All six endpoints, all three templates in both directions, motion filmstrips |
| 1024 × 768 | Split-pane fit, all templates, header wrapping, interruption |
| 960 and 959 px wide | Breakpoint transition, focus order, no duplicate layout tree |
| 768 × 1024 | Stacked layout, vertical travel when both endpoints visible |
| 390 × 844 | Phone controls, natural scrolling, all templates, offscreen fallback |
| 320 × 640 | Minimum width, source wrapping, stacked Bento, no horizontal page overflow |
| 844 × 390 | Short landscape viewport, scrolling and fallback |
| Desktop at 200% and 400% zoom | Reflow, focus, readable wrapping, no lost controls |
| Reduced motion and forced colors | All templates; ordinary controls and content remain understandable |

For each template, capture a settled code state and a settled rendered state on desktop and phone. Capture departure, approximately 50% progress, and arrival for forward and reverse journeys on desktop; record at least one continuous video per template showing reversal. Mobile evidence may legitimately show endpoint-only behavior where R08 applies, but a larger stacked viewport must also prove vertical travel.

## Q01 — Initial load and hydration

1. Hard-load `/` with a fresh session and normal motion preference.
2. Before hydration, verify readable Button source, explanatory copy, and disabled controls.
3. After hydration, verify Button / code / sound off, without an entrance flight or focus movement.
4. Reload after selecting Bento, rendered, and sound on. Expect the exact default state again.
5. Repeat with browser storage blocked and with development Strict Mode.

Pass: no hydration warnings, no duplicate audible cue, no client-only blank lab, no nondeterministic IDs, and no storage dependency. The accessible initial source matches the visible source. Readiness must not flash a different template.

## Q02 — State transition contract

Unit-test the pure state transition function across all 12 AppState combinations: 3 templates × 2 modes × 2 sound preferences. Exercise every supported command from every combination.

Required assertions:

- Morph flips only `viewMode`; two Morph commands restore the prior state.
- Setting an already-selected view changes nothing and requests no side effects.
- Selecting a different template resets to code and preserves sound.
- Selecting the same template preserves the current mode.
- Sound toggle changes only `soundEnabled`.
- Unsupported inputs leave a valid state and trigger the documented development diagnostic.
- A sequence replayed from the same state produces the same final state.
- Completion callbacks, stale timers, and audio results cannot update product state.

Inspect that AppState has exactly the three specified fields. Tests should verify these product invariants, not snapshot every implementation detail.

## Q03 — Controls and navigation

Use keyboard only from page entry. Tab through Example, Sound, Morph, the View radio group, and the disclosure in logical DOM order. Confirm the Example listbox keys, View radiogroup arrow keys, Space, and Enter behave as SPEC R03 specifies. There must be no trap and no keyboard stop on decorative dots, code tokens, line numbers, or preview artwork.

For each action, verify selector value, checked radio, Morph label, visible endpoint, and status message all describe the same latest state. Focus remains on the initiating control through normal movement, reversal, template reset, reduced motion, and geometry cancellation. Morph must stay operable while pieces are moving. The action text must not change header geometry enough to move the lab.

At touch sizes, targets are at least 44 × 44 CSS px with adequate separation. Touching the illustrative Button or Toast does not initiate application behavior, show misleading press feedback, or move focus. The preview caption identifies its noninteractive nature.

## Q04 — Content and identity invariants

Registry validation must establish exactly 3 Button parts, 4 Toast parts, and 10 Bento parts. Each part has one declared source token and one destination slot. Unique authored IDs are stable across renders. No mapping derives identity from displayed text or list position.

Check exact snippet content and line breaks against SPEC R05. Verify that closing tags and the outer Bento tag do not travel. Preview labels and descriptions must match the source constants. Confirm that “12” is identified as fictional example content and is not represented as the count of moving parts.

In each settled mode, inspect the DOM to verify one live owner per shared identity. Unshared reference tokens and hidden sizers do not carry an ID. If presence retention is used, allow at most two owners during a handoff, returning to one after settling. No old-template node survives a completed template change.

Mount two independent lab instances in a test fixture and morph one. Expect no movement or identity collision in the other. This tests namespace isolation without adding a multi-lab product feature.

## Q05 — Continuous movement and visual integrity

Prototype gate: perform this section on Button before building the other templates. The pinned Motion version must support the specified topology and reversal. If it fails, resolve the animation architecture before expanding scope.

For Button, Toast, and Bento, run code → rendered and rendered → code with both content regions fully visible and normal motion enabled.

Check the following in a continuous recording and frame inspection:

- Each mapped piece visibly starts at its authored source occurrence and reaches its declared target slot.
- The travel crosses the pane divider without clipping, disappearing behind a pane, or jumping to the destination for one frame.
- The expanding surface does not stretch its text or icon; the mapped label remains legible at midpoint.
- Transit backing preserves label/icon contrast over both grounds, clears at the current destination, and cannot be removed by a stale completion after reversal.
- Token lettering fades to surface paint or icon artwork as designed, without claiming glyph morphing.
- Stationary syntax, line spacing, source slot positions, pane geometry, and header controls do not jump.
- Reference tokens remain readable in the source after departure and never act as duplicate movers.
- Layer order remains correct: text and icons above surfaces, all movers above pane grounds.
- Visual endpoint accuracy matches the static destination within 1 CSS px for principal box edges at device scale 1, allowing font rasterization differences; reversal remains continuous when retargeted; and the settled state is correct with no residual scale or flattened type.
- Arrival matches the static destination within 1 CSS px for principal box edges at device scale 1, allowing font rasterization differences. There is no residual scale or flattened type.
- Reverse movement returns to the correct occurrence, not another repeated tag with the same text.

Do not make a deterministic screenshot test freeze animation and then claim continuity passed. Use screenshots for endpoints and recordings or sampled geometry for movement. Do not require an identical intermediate bitmap across different operating systems or font stacks.

## Q06 — Responsive layout and reflow

Exercise the viewport matrix with all three examples. Verify the exact 960 px split/stack boundary and the Bento preview's 360 px content-width threshold. Below the Bento threshold, card order is Feature, Metric, Status. The DOM reading order remains source before preview.

Pass: no horizontal page scrolling at 320 px, clipped code tokens, truncated action labels, hidden captions, overlap, or forced page scale. Long source lines wrap at safe boundaries; a shared piece has one measurable bounding box. The layout can grow beyond the viewport vertically. At 200% text size and 400% zoom, controls and descriptions remain available without a two-dimensional scroll requirement.

With an offscreen endpoint, activate Morph. Expect the correct immediate destination, no offscreen flight, no automatic scroll, and the specified compare-by-scrolling message. Scroll to inspect both endpoint states. Repeat where both regions are visible; spatial motion must then be available rather than permanently disabled for mobile layouts.

## Q07 — Rapid input and template changes

Run these sequences using real browser events at approximately 100 ms spacing, and once at 30 ms spacing. Do not wait for animations between steps.

| Sequence from default state | Expected final state |
| --- | --- |
| Morph × 5 | Button / rendered / silent |
| Morph × 6 | Button / code / silent |
| Component radio → Code radio → Component radio | Button / rendered / silent |
| Morph → select Toast | Toast / code / silent |
| Morph → select Toast → Morph → select Bento | Bento / code / silent |
| Sound on → Morph → select Toast → Morph | Toast / rendered / sound enabled |
| Select Bento → Morph → select Bento again | Bento / rendered / silent |

Check final state after settling and after two additional seconds, to catch stale callbacks. The last requested state wins, and old runs cannot restore prior content or trigger late sounds. During same-template reversal, inspect continuity from the current screen position; there is no forced trip through the old endpoint. Inputs in one browser frame may coalesce, but their final state must be correct.

No queued replay, stuck controls, lingering ghost, runaway live-region announcements, or unbounded node growth is permitted.

## Q08 — Environment changes and cleanup

At roughly 200 ms into a flight, separately test: horizontal resize, orientation change, zoom, document scroll, reduced-motion enablement, and tab hiding followed by restoration.

Pass: the latest requested state remains unchanged; the visual layer settles at the new geometry; old motion does not resume; there is no clipped or stranded piece. Focus remains on the initiating control. Audio stops on tab hiding. Reduced-motion changes remove spatial motion immediately. Reversing after cancellation uses current geometry.

Unmount the lab during motion and while an audio play promise is pending. Remount it in development Strict Mode. Expect no orphaned timer, observer, event listener, audio playback, state update after unmount, or doubled listener behavior. Review cleanup for every created resource.

## Q09 — Accessibility

Run an automated accessibility scan in every settled state and inspect keyboard behavior manually. Automated results do not replace semantic review.

Manual assistive-technology coverage: VoiceOver with Safari and NVDA with Firefox or Chrome when those platforms are available. If a required platform is unavailable, record the gap and complete it before release; do not label it passed by inference.

Confirm:

- One main heading, labelled sections and controls, correct name/role/value, visible focus.
- The Code / Component control is a radio group, not a tabs pattern hiding persistent panes.
- Source is read once as a complete code sample in both modes; decorative animation duplicates are not announced.
- The preview is described as an example illustration with no fake button, dismiss action, or save alert in the accessibility tree.
- One polite status message announces the latest selected view. Rapid input produces a coalesced message, not ten overlapping announcements.
- Opening “How the pieces match” exposes meaningful source-to-destination pairs even with motion disabled.
- Text and controls meet the contrast targets in DESIGN.md, checked with actual rendered colors.
- Forced colors retains visible checked indicators, focus outlines, borders, and mapping markers.
- Reduced motion produces no spatial translation, scaling, stagger, overshoot, or loops, and only the permitted short opacity transition.
- Reduced motion is respected from first interaction and when changed at runtime. It does not require sound to convey the lesson.

## Q10 — Sound lifecycle and failure

Test with headphones and speakers at a moderate system volume. Confirm a quiet, short, non-verbal cue, no clipping, and no startling transient. Digital volume 0.15 is only an initial parameter; perceived loudness must be reviewed.

| Condition | Expected result |
| --- | --- |
| Load, reload, focus, hover, template selection | No sound |
| Enable sound | Prepare asset; no preview cue |
| Mode-changing activation with asset ready | One cue starts promptly; animation does not wait |
| Same-mode selection | No cue |
| Activation before asset readiness | Skip cue; never play it later |
| Rapid reversals | At most one cue; newest cue replaces earlier playback |
| Disable during playback | Playback stops immediately |
| Change template during playback | Playback stops; preference survives |
| Hide page / unmount | Playback stops and resources clean up |
| Asset 404 / unsupported format / rejected `play()` | Morph works silently; one unavailable message; no unhandled rejection |
| Pending play resolves after disable | Remains silent; state stays disabled |
| Explicit off → on after failure | Preparation can be retried |
| Reduced motion with sound on | Preference remains on; otherwise same audio rules |

Test browser autoplay restrictions in a fresh context and real mobile browsers. Record the asset's source/license, format, duration, size, and listening review. A stubbed audio call alone cannot establish this feature works.

## Q11 — Performance and stability

Use a production build and identify a reference machine: a documented ordinary laptop at a 60 Hz display, plus a documented midrange phone. The budgets below are targets, not measured claims.

- Initial route JavaScript ≤200 KiB gzip including framework and app; optional audio ≤30 KiB.
- No network request is necessary for a morph; audio may load only on explicit enablement.
- Warm interaction-to-first-visible-change ≤100 ms on the reference laptop.
- During a 10-morph recording, at least 95% of frame intervals ≤20 ms on the reference 60 Hz laptop, with no app-attributable main-thread task longer than 50 ms during a morph. Attribute any environment noise and rerun once under idle conditions.
- No per-frame React state loop, polling timer, or application-level repeated layout measurement.
- No visual layout shift on initial hydration; measure a CLS target ≤0.05 for page load. Do not use CLS to judge the user-triggered morph itself.
- After 100 alternating morphs and 30 template switches, shared-node counts return to the expected baseline and detached nodes/listeners do not grow monotonically across repeated heap samples.
- Throttled CPU and slow audio loading remain usable and converge to the latest state, even if the smoothness target cannot be met under deliberate throttling.

If budgets fail, inspect bundled imports, large painted areas, layering, duplicate nodes, and cleanup before adding architectural complexity. Do not remove accessibility or correctness to meet a size number.

## Q12 — Failure, offline, and scope checks

Disable JavaScript: initial source and explanatory text remain, controls are disabled, and the notice is readable. Block audio only: all visual functionality remains. After loading the app, disable the network: morphing still works with available local assets; this does not promise offline navigation or a service worker.

Inject an invalid registry in a test build: development assertions identify the missing mapping. Trigger a rendering exception: the contained reload fallback appears and is keyboard accessible. Reload returns to the default state. No perpetual loading overlay or compilation status appears.

Review source and dependency graph for excluded capabilities: no editor package, parser/compiler, dynamic code execution, user-content HTML injection, arbitrary module loading, backend route, analytics, persistence, or duplicate animation runtime. The source pane is structured React elements and shared IDs, not a raw highlighted string used as the entire visual.

## Educational usability check

Ask a small mixed group of designers and developers to choose an example, morph it, reverse it, and explain what happened, without introducing `layoutId` first. Use PRODUCT.md's proposed task threshold. Ask directly whether they believe the app runs the shown code; misunderstanding indicates copy or presentation needs revision.

Record observations without presenting them as broad statistical proof. This review complements, rather than replaces, the technical acceptance matrix.

## Verification sequence and evidence packet

1. Check package compatibility, strict TypeScript, lint, production build, and pure state/registry tests.
2. Pass the Button animation prototype gate.
3. Run all-template browser behavior, interruptions, and failure checks.
4. Capture desktop/phone endpoints, normal-motion recordings, and geometry cancellation.
5. Complete keyboard, screen-reader, reduced-motion, contrast, forced-colors, and zoom review.
6. Measure bundle size, animation performance, and cleanup; review the real audio asset.
7. Produce a requirement-by-requirement result with evidence and unresolved defects.

The evidence packet must include exact build/browser identifiers, command results, screenshots, recordings, accessibility findings, performance measurements, audio provenance, and a pass/fail/not-run entry for each Q01–Q12 case. Stop expanding tests after relevant checks pass unless a new change or failure justifies further testing.

## Documentation delivery check

This check applied to the original five specification files: names, cross-links, required stack, exact AppState, complete 3/4/10 mapping tables, consistent motion values and state behavior, and explicit implementation/test status. Confirm that no application code, package files, generated assets, or unrelated files were added or overwritten. This documentation check is distinct from all future application verification above.
