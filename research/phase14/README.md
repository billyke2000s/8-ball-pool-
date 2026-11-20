# Phase 13–14 — Original Pyramid striker selection, scoring and touch handling

Source is the user's supplied `Billiard.apk`, recovered with JADX/Smali. This is a source-guided **single-file offline HTML conversion**, not a verified 1:1 Android implementation. The distributable HTML includes the supplied app's bitmaps/audio, so that file and the decompiled proprietary source have **not** been pushed into this public repository.

## Specific source findings incorporated

- **`ho.h()`:** Pyramid scoring depends on the independently stored `t40.W` `penalty_on_foul_ru` option. `W=0` yields the player's object pots + selected-striker pots − own fouls; `W=1` yields the player's pots + the other player's fouls. This is the same calculation in both Free and Combo Pyramid, correcting the earlier v12 port which incorrectly always credited the opponent in Combo mode.
- **`wh.l()` and `ha.f(k7)`:** when the striker has been pocketed during Free Pyramid (`t40.V=0`) and was involved in a contact, native gameplay can choose another playable active ball as the new striker rather than respotting ball ID zero. v14 tracks `strikerId` throughout aiming, first-contact detection, shot power, collision scoring, AI candidate generation, rendering and peer state.
- **`k7.q()`, `wh.k0`, `wh.u(k7)`, `oh.run(case 0)`, `wh.r()`:** pocketing the selected striker in Combo Pyramid (`V=1`) initiates the choose-a-numbered-ball-to-remove interaction. The user taps an existing numbered ball; after the native **1,200 ms** delay, the selected ball is pocketed without crediting another pot to the same shot. This interaction is now included in the one-file HTML, including a CPU fallback and multiplayer message type. The native choice animation and exact eligibility checks still have edge cases that haven't been fully verified.
- **`wh.n(MotionEvent)`, `t00.A()`, `ha.v`:** touch aiming uses wrapped angular deltas and a **three-sample circular input history**, rather than snapping to an absolute pointer-to-cue angle on every move.
- **`u7.j()`, `b3.r`:** the vertical precision-wheel reading is averaged over three samples and transformed by the half-height of the wheel. HTML maps the Android wheel geometry to its drawn 308-pixel wheel.

## Implemented output

`Billiard_Native_Rules_Touch_v14_Single_File.html` (1,154,925 bytes; SHA-256 `9ca9780a0234b7259326bf1bef7875b97b0edfa5067ac37e3fdcc3cfbb3b4e37`).

- Still embeds 43 original image assets and five original audio assets; no separate asset files or external JavaScript needed.
- Includes all three recovered rule modes: Free Pyramid, Combo Pyramid and Pool (8-Ball).
- Maintains previous native-source-derived event collision, pocket sizes, animation timing, nonlinear power, AI candidate selection and Blackball options.
- Pure source and tests remain in the chat's private working directory; **not a generic recreation**.

## Browser verification actually performed

- 13 gameplay checks: mode selection, Free striker rebinding and exclusion, shot launching with new striker, Combo selection/1.2-s timeout/removal with unchanged score, state serialization, both `t40.W` penalties, Pool foul, high-power break.
- 9 break stress checks: three modes × 40%, 70% and 100% power; settled with finite ball positions and without pairwise overlaps.
- 4 real pointer event checks: three-sample touch aim, wheel, tapping numbered ball, 1.2-s delayed removal.
- 2 viewport/rendering checks at 412×915 and 700×1400; all 43 images and five audio data assets present and no horizontal document overflow.
- JavaScript syntax check passed. No browser page errors recorded in those tests.

**28 checks passed in these v14 runs.** Direct `file://` navigation couldn't be tested because the runner blocked it administratively; equivalent HTML was rendered via injected content.

## Remaining work for a genuine 1:1 claim

The browser still approximates parts of native Android `wh.m()` foul timing, rare `k7.q()` scorer callbacks, physical table/jaw screen calibration, precise platform frame pacing and advanced CPU strategy. The native SDK touch input and JavaScript pointer system aren't byte-for-byte equivalent. A deterministic, frame-by-frame native Android replay comparison is required before claiming full 1:1 parity; an Android emulator was not available in the current runtime. This release is a **tested closer port, not a certified exact original**.
