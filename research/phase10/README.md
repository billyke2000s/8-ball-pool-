# Phase 10 — Boundary repair, alternative-contact AI and native aiming options

Source: the original user-provided `Billiard.apk`, whose exact Smali/JADX recovery is documented elsewhere on this branch. The standalone, one-file v10 browser port is supplied directly in the ChatGPT conversation, **not published on this public repository**, because it embeds the original developer's artwork and sound effects.

## Changes actually implemented in the one-file HTML

1. **`mt.j(double,double)` field-bound check**: the Android source checks that a ball's top-left corner lies inside the P/Q/R/S bounds, including its diameter `k7.L`. The browser uses center coordinates, so the check is translated to `cx in [left+radius,right-radius]`, likewise for `cy`.
2. **`l30.m()` correction loop**: when a selected positive-time collision predicts an invalid location, the native implementation retries by multiplying the candidate time by `0.99` up to 10 iterations. The v10 port includes this exact retry count and factor. The native code's additional `si.i` jaw-polygon checks use original screen-scaled `mt.d0..a0` arrays and are **not** yet reproduced exactly; fitted pocket-mouth regions are used in the browser.
3. **`l30.f(k7,k7,double,double)` alternate-contact geometry**: the Java method intersects a circle of squared radius `k7.M` around the target ball with an affine line derived from a pocket endpoint; of the two roots, it selects the point closer to the cue. The browser reproduces that algebra to generate additional `jo.f()` AI candidate contacts, with approximated visibility and scoring constraints. This is **not exact bank/trick-shot AI equivalence**.
4. **`GameActivity` preferences**: `aiming_lines` (native on value 2), `aiming_wheel`, `tap_to_aim` and `tap_to_shoot` now have functioning switches in the HTML. Native defaults are `2,false,false,false`, while the HTML initially shows the wheel to match the user's screenshot; preferences can be changed and saved.

## Verification

The v10 single-file HTML passed:
- 15 prior rules, AI, turn and browser-physics regression tests.
- 6 pocket-animation, black-ball re-spot, white-ball placement and touch-gesture checks.
- 6 physics stress tests: two ball modes × three break strengths (40%, 70%, 100%), with no overlapping active ball centers or nonfinite state.
- 6 new browser tests for circle-line geometry, native rectangle checks, ten-try repair, aim controls, candidate state purity and an 80% break.

**33 browser checks passed.** The test run did not produce JavaScript page errors. Browser rendering is still not verified frame-for-frame against Android.

## Remaining for an honest 1:1 claim

The original Android binary runs a platform-specific `View` loop, uses real frame-time-derived physics `k7.J`, and combines collision objects and complex mouth polygons. The browser is not bytecode- or platform-identical. The complete native rules state machine, unusual side-spin and cushion interactions, AI penalty/safety logic, exact adaptive shot selection, user settings beyond the current switches, and pixel-calibrated Android-vs-browser input/output traces still need work.

**v10 is a more source-faithful executable port, not a verified 1:1 conversion.** Its proprietary original game assets remain outside the public repository.
