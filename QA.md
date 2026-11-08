# Quality assurance and acceptance plan

Product: **Spatial DOM Transition Lab**. This is the test specification for the implemented lab. What has actually been run, and what has not, is recorded under "Current results" below; anything not listed there as run has not been verified.

## Current results (8 November 2026)

Environment: Linux 6.18.44, Node v22.23.4, Playwright 1.64.1, Chrome for Testing 153.0.8010.12 (headless), viewport 1440 × 900 unless a test sets another. Run from branch `claude/jolly-hopper-ffu1aq`. The installed Playwright browser was missing, so the suite ran with a temporary config outside the repository that set the pre-installed Chrome binary, disabled video and tracing, and otherwise reused `playwright.config.ts` (production server on 127.0.0.1:4173).

| Command | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run build` | Pass |
| `npx playwright test` | 16 of 16 passed (`button.spec.ts` 7, `templates.spec.ts` 7, `failure.spec.ts` 2) |

Repeat-run note: before the change, the Bento "continuous forward/reverse" test failed in 4 of 11 repeat runs, each time on the assertion that a sampled frame shows the surface straddling the pane divider. The surface does straddle it (the window covers 13–26% of spring progress); a headless browser renders roughly 35–48 frames per second with gaps up to 87 ms, so samples could miss the window. The assertion now also tests the path between consecutive sampled frames, and still requires the straddle. After that change the group (Toast and Bento) was run 75 more times and 3 runs failed: one on a different sampling-dependent assertion (a frame with spring progress between 0.35 and 0.7, "midway" in `templates.spec.ts`), and two whose failing assertion was not captured, so it is unknown whether they involved the divider check. Treat this test as intermittently flaky in a headless container; the cause of the two uncaptured failures is unresolved.

Automated checks cover only what is listed in each row. Everything else in the case is **not run**.

| Case | Status | Covered by automated tests | Not run |
| --- | --- | --- | --- |
| Q01 Initial load | Partial | Server-rendered Button source, disabled Morph and the no-JS notice; initial state value; every test fails on console errors or hydration messages | Reload after changing state, blocked storage, development Strict Mode |
| Q02 State contract | Partial | Initial state; Morph twice restores; same-view no-op; Select template and Toggle sound over all 12 states | Invalid-input diagnostic; stale callback and audio-result assertions |
| Q03 Controls | Partial | Radio arrow keys; focus stays on Morph; native select changes | Full Tab-order walk, touch-target sizes, status-text consistency. Controls differ from DESIGN.md (open item) |
| Q04 Content and identity | Partial | 3/4/10 parts; exact sources; one owner per identity in each settled state | Two-instance isolation fixture |
| Q05 Continuous movement | Partial | Sampled geometry for Button, Toast and Bento: travel, hit-testing, unscaled text and icons, reverse, interruption | Filmstrips and recordings review, 1 px endpoint comparison at all states, contrast over both grounds |
| Q06 Responsive layout | Partial | 1440, 1024, 390 and 320 px: no horizontal overflow; 390 px offscreen fallback; stacked vertical travel; Bento 360 px threshold | 960/959, 768, 844 × 390, 200%/400% zoom, forced colors |
| Q07 Rapid input | Partial | Morph × 6 at 100 ms and 30 ms spacing; radio sequence; template selection cancels flights | The other sequences in the table; the two-second stale-state check |
| Q08 Environment changes | Partial | Resize, scroll and reduced-motion toggle during flight | Orientation, zoom, tab hiding, unmount and Strict Mode cleanup |
| Q09 Accessibility | Partial | Reduced motion removes transforms for all templates | Automated accessibility scan, screen readers, contrast measurement, forced colors, keyboard walk-through |
| Q10 Sound | Partial | Missing asset: one visible and announced "Sound unavailable", preference kept, silent morph, retry only after off then on | Any audible cue (no asset exists), autoplay policy, real mobile browsers, rapid reversal and playback-stop rows, listening review |
| Q11 Performance | Not run | None | Bundle size, frame timing, interaction latency, CLS, node and listener growth |
| Q12 Failure and scope | Partial | JavaScript disabled; injected effect exception shows the error fallback and reload button | Audio blocked only, invalid registry, offline, dependency and source review for excluded capabilities |
| Educational usability | Not run | None | Whole check |

Browser and device coverage: Chromium-family only. Firefox, Safari/WebKit, real iOS and Android devices, VoiceOver and NVDA: **not run**. Audio provenance and listening review: **not run** (no asset).

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

Use keyboard only from page entry. Tab through Example, Sound, Morph, the View radio group, and the disclosure in logical DOM order. Confirm native select keys, radio arrow keys, Space, and Enter behave normally. There must be no trap and no keyboard stop on decorative dots, code tokens, line numbers, or preview artwork.

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
