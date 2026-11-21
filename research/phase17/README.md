# Phase 17 — Native game-completion and solo victory-score recovery

Source: user's supplied `Billiard.apk`, decompiled Java (`wh.java`, `ho.java`, `k7.java`, `ha.java`) and exact Smali. The browser v17 artifact lives in the ChatGPT conversation, not the public repository, because its embedded third-party graphics and audio do not have verified redistribution rights.

## Recovered end conditions

The actual `wh.i()` completion method distinguishes `t40.V` rules and `wh.f0` (competitive versus solo):

- **Free Pyramid (`V=0`)** counts balls where `!k7.n || k7.t != null`. It ends when that count is at most one; for competitive modes it also ends when either `ho.i` reaches 8. A solo game does not terminate merely on eight points.
- **Combo Pyramid (`V=1`)** counts balls where `!k7.n && !k7.m`. It ends when no such balls remain, or when there is one and `wh.k0` is true (pending ball selection). In competitive modes it also ends at eight points. The older HTML had reversed this special one-ball condition.
- **Pool (8-Ball, `V=2`)** ends once one of the player's native `ho.p` terminal flags becomes true. The HTML already had pocket-event winner logic; solo black-ball win/loss handling is now corrected.
- `ha.f(k7)` marks the new striker via `k7.m=true` and clears the prior striker's flag. The browser represents it through `strikerId`.
- `k7.e()` sets `k7.t` when balls contact; `wh.l()` clears `k7.t` after performing the terminal check. The HTML now stores `nativeHitLinked` during collision response and clears it at shot settlement. This is a limited representation of the native contact reference.

## Native solo scoring

On a successful solo match, `wh.l()` computes:
```
base = (elapsedMilliseconds/1000)^(-0.8) * 40000
if (ia.i > 0) base /= ia.i
base -= ho.d*0.1
base -= ho.e
if (t40.p()) base *= 10
if (!t40.n() && ia.i <= 2) base *= 2
score = max(7, trunc(base))
```
`ia.i = 2^(speedSetting-1)`. The browser uses the session wall clock, shot count and foul count to calculate the corresponding score and stores a per-mode best score locally. The original's pause/resume timing and counter semantics have not been validated across native gameplay.

## Browser validation

- **18 targeted Chromium checks** passed, including Free solo versus competitive, Combo final-ball cases, stale collision links, solo score time scaling, solo loss/win on black, restart and mobile viewport.
- **6 full break simulations** passed (Pool, Free and Combo at 45% and 85% power); all shots settled, all active coordinates were finite, and there were no overlaps or page errors.
- **24 checks passed** in the v17 evaluation. Syntax validated by Node's JavaScript parser.
- The output is one playable HTML file with embedded original APK assets, without external assets or scripts.

## Still unmatched

Original timing tied to Android View and app lifecycle; some native foul flags and score bookkeeping; exact CPU safety/bank strategy; collision event ordering and Android geometry; and deterministic frame-by-frame native-versus-browser comparisons. **v17 is not yet proven to be a 1:1 port.** This report is specifically grounded in recovered methods, not a claim that the rest is finished.
