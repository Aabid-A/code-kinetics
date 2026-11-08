# Release checklist

Spatial DOM Transition Lab, branch `claude/jolly-hopper-ffu1aq`, 8 November 2026.

Automated Chromium checks are recorded in [QA.md](QA.md) "Current results". Everything below needs a person: an owner's decision, an asset, or testing that automation in this environment cannot do. "A1 Sound file" and "A2 Generate decision" are done. Tick an item only with its evidence recorded in QA.md, and fill in its owner.

## A — Owner items

- [x] **A1 Sound file.** `public/audio/morph.mp3`: one quiet, non-verbal click or whoosh, no longer than 180 ms, identical for both directions ([SPEC.md](SPEC.md) R09). Provenance: Synthesised by scripts/make-morph-cue.sh; no third-party audio; owned by the project. Format, duration, levels and size are recorded in QA.md Q10.
  - Owner: the project
- [ ] **A1 Listening review.** With the file in place, run the QA.md Q10 table on headphones and speakers at moderate volume: no clipping or startling transient, and perceived loudness reviewed (0.15 volume is only a starting value).
  - Owner:
- [x] **A2 Generate decision.** Ship the optional generator in chapter 06, backed by Google Gemini (decided 8 November 2026; SPEC R13).
  - Owner: the project owner
- [ ] **A2 Key on the host.** Set `GEMINI_API_KEY` (and optionally `GENERATE_DAILY_CAP`) in the hosting provider's environment settings, never in the repository. Then run QA.md Q13's "not run" checks against the deployed site.
  - Owner:
- [ ] **A2 Billing alert.** Set a budget or billing alert for the Gemini API project in Google AI Studio / Cloud Billing; the in-app limits are per server instance.
  - Owner:
- [x] **A3 Merge decision and pull request.** Merged into `main` as [Aabid-A/code-kinetics#1](https://github.com/Aabid-A/code-kinetics/pull/1) on 8 November 2026. Later work arrives through new pull requests, checked by CI.
  - Owner:
- [ ] **A4 Hosting.** Choose the hosting target and deploy. Standard Next.js hosting is sufficient ([ARCHITECTURE.md](ARCHITECTURE.md) "Performance and delivery").
  - Owner:
- [ ] **A4 Sign-off.** Release sign-off against the QA.md release standard: every mandatory case passing, with no critical or major defects open.
  - Owner:

## C — Testing that needs people or real devices

- [ ] **Firefox:** current stable, full journey and keyboard. Record the exact version.
  - Owner:
- [ ] **Safari:** current stable on macOS, full journey, keyboard and audio. Record the exact version.
  - Owner:
- [ ] **Real iOS device:** Safari touch and audio smoke test (QA.md "Environments and evidence rules").
  - Owner:
- [ ] **Real Android device:** Chrome touch and audio smoke test.
  - Owner:
- [ ] **VoiceOver** with Safari: QA.md Q09 manual checks (source read once, preview description, one polite status, disclosure pairs).
  - Owner:
- [ ] **NVDA** with Firefox or Chrome: the same Q09 manual checks.
  - Owner:
- [ ] **Five-person usability study:** the QA.md "Educational usability check" with designers and developers, against the thresholds proposed in [PRODUCT.md](PRODUCT.md). Record observations without claiming statistical proof.
  - Owner:
