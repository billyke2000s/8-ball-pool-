# Phase 7 — Source-mapped AI and game-rule recovery

This report documents further recovery **from the user-supplied original Billiard.apk** (SHA-256 `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`), as implemented in the private, standalone `Billiard_APK_Native_Physics_Rules_AI_Port_v7_One_File.html` artifact.

The previous phase-4 browser version was a source-guided approximation. Phase 5–7 translated more of the real maths and settings instead of retuning generic heuristics.

## Code recovered

- `lr.<init>`: exact structure and weighting terms of native shot candidate scoring — angle, cut, power headroom, pocket bearing, cue/target/contact geometry, banking and ball-group modifiers. **Some constants depend on native screen and game state and remain fitted equivalents**.
- `l8.a`, `cc.<init>`: adaptive difficulty coefficient, baselines EASY 0.5, NORMAL 0.67 and HARD 0.9, bounded by their original profile ranges; historical win performance, score difference, errors, visits, turn count and caps.
- `jo.e`: score sort/selection and original low-difficulty index selection, without the earlier made-up random angle jitter. The separate stochastic score-inversion flag from `jo.c` is preserved.
- `mt.<init>`: six pockets × two aiming targets with original pocket bearing map and inner/outer geometry. Browser jaw offset scaling is approximate, not pixel-exact.
- `k7.l`: `pow(h0, log(1+(h0-1)*distance/(J*v))/log(h0))*v` simplifies mathematically to `v+(h0-1)*distance/J`. Used through `jo.b` twice, including `0.99*cos(cut)` transfer. Inverting `ia.a` gives shot-power fraction. Android `k7.J` is frame-dependent; browser uses its original initial .095625 value for AI planning.
- `k7.q`, `wh.l`, `GameActivity` and `t40.m/o`: implemented two original numbered-ball game settings: black re-spot when pocketed on the opening break, and optional loss when scratching on the black after clearing the suit. Options persist locally.

## Verification

The self-contained HTML was tested in Chromium with Playwright: **15 passing checks**, no page JavaScript errors. Tests covered legal AI routes, blockers, difficulty and historical adjustment, candidate scoring, source-derived speed formula, computer shot execution, identical break replay, and both enabled/disabled branches of the new rules. The original 43 images and five audio assets are embedded in the downloadable single file; no external JS/CSS/media files are required.

## Remaining differences from actual Android implementation

1. Full native `l30.m` event ordering and rare jaw/cushion collision cases.
2. Side spin, complex collision paths and complete Android gesture timing.
3. Bank/trick shot branch in `jo.f` / `l30.f`; precise AI safety and ball-in-hand strategy.
4. Complete scoring, fouls and rule variants from the native mode state machine.
5. Native screen-scaling constants and frame-time calibration; no verified Android-vs-browser replay comparison.

**Not a verified 1:1 port.** The complete source and original APK assets are provided only as private downloadable artifacts in the conversation; they are not redistributed in this public GitHub branch without a confirmed licence.
