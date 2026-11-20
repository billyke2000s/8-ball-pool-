# Phase 8 — Original pocket animation and respot methods

**Objective:** progress from the source-guided HTML v7 approximation toward faithful behavior of the user-supplied `Billiard.apk`. **Still not 1:1**; original Java/Smali are the basis and the self-contained HTML artifact is supplied privately in the originating conversation rather than uploading the original third-party artwork/audio publicly.

Source APK SHA-256: `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`.

## Decompiled native methods now translated

- **`k7.q()` pocket animation**: `moveSteps = floor(15/max(frameTimeMs,1) * (speed > 5 ? max(min(trunc(35/speed*20),20),10):20))`; drawable movement path includes `moveSteps+2` points; followed by `floor(15/max(frameTimeMs,1) * 20)` hold frames. Image remains original size, with terminal alpha fade if `k7.c0 > 0`. `k7.c0` is set in `t40.v` to 5 when speed-setting <= 2 and 0 above that. Middle pockets get the native `0.1*K` destination-Y offset, with opposite signs.
- **`wh.l()` black ball re-spot**: after an 8-ball break event when enabled, search from `mt.m0[5]` jittered on each axis by `(Math.random()-.5)*.1*K`, then rings 0..9, testing points on the square ring `max(abs(dx),abs(dy))==ring`, pitch `k7.P = 1.2*K`. Browser field geometry converts original top-left ball coordinates into canvas centre coordinates.
- **`wh.l()` white reset**: deterministic nested grid, X descending from `mt.m0[0].x` towards `mt.P`, Y descending from `mt.m0[0].y` towards `mt.R`, pitch `k7.P`, first valid nonoverlapping location selected. Browser placement keeps dragging live until release.
- **`wh.onDraw()` measured frame time** and `wh.a()` init: original `mc.a=1`, `mc.d=15`, then `d=((a-1)*d+elapsedMs)/a` when 0<elapsedMs<50; increment count up to 40. Used by the new animation duration calculation.

## Verification

The v8 single HTML file passes **21 headless Chromium checks** (15 existing physics, AI and rules tests plus 6 new timing, pocket target, square-ring re-spot, grid placement, animation and pointer gesture checks), with no page script errors. It embeds the actual original APK resources but **the browser rendering isn't verified pixel-for-pixel against the Android app**.

## Remaining fidelity gaps

The HTML collision simulation is global, while the original `m7.c() -> k7.k() -> l30.m()` advances balls sequentially against event objects `ex`, `ea` and `k7`. Cushion/pocket geometry is scaled for browser and not guaranteed to use the exact native coordinates. The native state machine in `wh.l()/k7.q()`, AI bank/trick shots, all rule variants, settings and certain Android touch gestures are not fully translated. Exact 1:1 can only be claimed after native-versus-browser replay tests match.

The private downloadable artifact is named **Billiard_Original_Engine_Port_v8_Single_File.html**.
