# Phase 9 — Native sequential collision-event system

**Source:** user-supplied original `Billiard.apk`, analyzed from recovered JADX Java and Apktool Smali. The browser implementation remains an independent source-guided port, **not** verified as 1:1.

## Native methods mapped

- `m7.c()`: iterates every ball in its existing list order, calling `k7.k()`; when the maximum squared speed drops below `k7.U`, it stops all balls and finalizes the shot.
- `k7.k()`: for each moving ball independently, selects its next event using `l30.m(ball, J, obstacles)`; advances either to that event or to `J`; applies the collision, then checks the `ei` pockets and scales velocity by `k7.T`.
- `l30.m()`: scans registered `s8` obstacles, returns an immediate event when time approaches zero, otherwise scales positive times by `0.9999` in the ordinary mode. The `mt.j()` out-of-bounds adjustment loop is **not yet faithfully ported**.
- `s8.c()`, `k7.b()`, `ea.b()`, `ex.b()`: quadratic root, stationary-target ball contact, point/jaw contact and finite-offset-segment contact.
- `ex.a()` / `ea.a()` use normal reflection and `y7.a`; `mt.o()` sets `y7.a=0.90` for speed settings 1–2 and `0.99` for higher settings.
- `mt.o()` / `mt.b()`: browser port now includes a corresponding 24 finite cushion/pocket-boundary segments (six long rails, six middle-pocket lip segments and twelve corner-pocket lip segments) and twelve point/jaw obstacles.

## Browser v9

The HTML now has a sequential physics loop closer to `m7.c()` and `k7.k()`, replacing simultaneous relative-motion scheduling with individual ball event selection against the other balls' current positions. The original earlier global solver remains named `simulateLegacy()` in source for comparisons. Cushion restitution is selected from the native game-speed setting. After an event, pockets are checked before friction.

The field artwork, ball sprites and sounds remain embedded as data in the *private* downloadable single-file HTML. **None of the original APK images/audio/code dump is published on this public branch.**

## Verification

- 15 prior AI/game/rule regression checks against v9 passed.
- 6 prior pocket-animation, re-spot and gesture checks against v9 passed.
- 6 new event/geometry/normal-response/80%-break checks passed.
- 6 extra stress checks at 40%, 70%, 100% power in both Blackball and numbered-ball modes passed; balls settled with finite coordinates, without overlap or browser exceptions.
- The HTML has 43 embedded image resources, 5 audio resources and no external script imports.

## Fidelity gaps

The `mt.j()` collision boundary retry and odd geometry repairs in `l30.m()` still need rigorous Smali reconstruction. The native Android thread uses dynamic `k7.J`, while the browser runs fixed 150 Hz with a unit conversion. Native geometry scales to Android screen parameters and the browser endpoint locations are fitted rather than pixel-calibrated. Exact replay matching with native Android has **not** been established, nor have all rule variants, bank/trick AI branches or gesture timing been recovered.

**Not yet verified as a 1:1 port.**
