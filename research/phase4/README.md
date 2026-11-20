# Phase 4: original Android computer-opponent code

**Source:** user-supplied `Billiard.apk` SHA-256 `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`. This builds on Phase 3's collision-event port. The public repo does not distribute the APK's proprietary bitmaps or sounds.

## Direct decompilation evidence

- `jo.c(k7)` identifies legal targets, consults `ho.b()`, and prepares candidate search according to difficulty.
- `jo.f(k7)` iterates pocket targets from `mt.l0`, derives proposed cue contact points using `t00.M`, rejects cuts greater than 89.99 degrees and blocked paths through `mt.g`, then creates scored `lr` candidates. The additional route branch is not yet interpreted exactly.
- `mt.l0` contains twelve `y2` targets (two around each of the six pockets).
- `jo.e(k7)` sorts `lr` candidates, then selects according to player/AI difficulty from `ho.O.a()`.
- `lr.j` combines cut-angle, travel, direction, power, pocket and other factors into a shot-quality score.
- `l8.a()` produces an adaptive difficulty coefficient from player score, shot count, previous outcomes and profile settings.

## Translated into standalone HTML (v4)

The standalone HTML port now enumerates 12 pocket endpoints per legal target, calculates ghost-ball contact positions (matching the structure of `t00.M`), rejects impossible cutting angles and ball-obstructed paths, ranks valid shots by approach angle/distance/power and chooses a candidate based on difficulty. It uses the previously translated nonlinear power and exponential friction formulas, with a legal-hit fallback when no pocketing shot is clear.

This is a **source-guided reconstruction, not a 1:1 port**. Endpoint positions, scores, powers, aim noise and adaptive learning are still approximate. The exact `jo.b/k7.l` transfer, `lr.j` weights, specialty trick shots and ball-in-hand placement remain to be translated.

## Verification

Five Chromium browser checks passed: legal shot candidates, blocker rejection, difficulty ordering, execution/animation of a CPU shot, and unchanged deterministic opening-break physics. No browser JavaScript errors. The full test source, detailed report and v4 JavaScript engine are available in the downloadable Phase 4 source-and-tests ZIP supplied in the chat. The single-file HTML is available there as a separate downloadable artifact.

Do not substitute the older `docs/` Canvas prototype for the HTML port derived from the APK; they are distinct implementations.
