# Phase 11 — Original pocket-size maths and jaw geometry

**Input:** user's original `Billiard.apk` (SHA-256 `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`). **Output:** single-file offline HTML named `Billiard_Native_Pocket_Physics_v11_Single_File.html`, available in the originating conversation and not uploaded publicly because it embeds original art and sound.

## Confirmed original methods

- `GameActivity` / `t40.Q[]`: modern devices expose pocket-size values `10`, `20`, `30`. These are now a configurable, persisted UI option in the HTML.
- `mt.i()`: original table-scaling factors for 10 are **.9 (Blackball), .8 (numbered)**, for 20 **1.16, 1**, and for 30 **1.5, 1.3**. Its legacy -18 branch depends on `t40.i` and is not exposed in HTML.
- `mt.q()`, `ei.<init>`: primary circular capture radius uses `ei.f = D*.27*ei.k` for the two middle pockets and `ei.h = B*.23333333333333334*ei.k` for corners. Speed-dependent `ei.k` is **1** for speed below 3 or pocket size 30; otherwise **1.9**. The -18 branch uses the additional adaptive coefficients and is approximated in the private port, but not user-selectable.
- `mt.q()`: four corner-mouth endpoint pairs `d0..k0` derive from `A-C`; the two side-pocket endpoint pairs `W/X` and `Z/a0` derive from `c0`, with exterior depth from `z*.4222222`.
- `si.i(x,y,x0,y0,x1,y1)`: source method returns true only when squared distances from `(x,y)` to **both** supplied endpoints are at least `k7.N=K²`. Used in `l30.m()` jaw-boundary repair.
- `l30.m()`: source retains the ten-iteration candidate-time adjustment and `mt.j()` bounds validation; v11 replaces v10's broad circular mouth exception with the above source-derived endpoint tests.

## Browser implementation details and limits

The static HTML canvas is **700×1400**; Android uses dynamically measured `mt.F/G` and raster scaling. To represent the source's ball size in fixed pixels, the HTML calibrates the native dimension unit against its ball sprite radius. It then uses `mt.i` *relative* table scales to adjust `ei` radii between the three pocket sizes without resizing all original table art. Thus the original formulas are recovered, but **the screen-space mapping is not pixel-exact**. This is more faithful than the previous 2.2/2.34-ball-radius capture circles, not a measured 1:1 reproduction.

The pure source-defined `si.i` endpoint clearance is exact; the selected mouth-region polygon around each jaw is adapted to the browser's static coordinates. Some high-speed through-pocket events and rare jaw cases may still differ from Android's native frame-by-frame result.

## Tests actually executed

50 passing headless Chromium checks against v11:
- 15 previous game-rule, AI, shoot-and-settle regressions.
- 6 original pocket-animation, respot, cue-ball placement and drag tests.
- 6 previous collision/jaw/aiming tests.
- 6 existing 40/70/100% break stress cases in both ball modes.
- 6 new `mt.i` / `ei` formula, pocket-size, persistence and game-break checks.
- 5 new tests of all six pocket mouths, ordinary-rail rejection, corner/middle jaw clearance and `si.i`.
- 6 additional Blackball/numbered × three-pocket-size stress cases.

All tests ended with no recorded browser JavaScript errors. **Native Android replay comparisons were not run; 1:1 status remains unverified.**

## Next unmatched native behavior

Exact browser-to-native screen coordinate calibration and `l30.m()` branching; complete foul/suit/visit state machine in `ho/wh`, CPU safety and bank-shot branches, and the original touch wheel dynamics. The original developer's exact pre-obfuscation source is not recoverable from the APK.
