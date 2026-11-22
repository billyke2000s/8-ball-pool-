# Phase 22 — Free Pyramid striker choice and native power control

Continues the actual v18 standalone HTML into `Billiard_Native_Free_Striker_v19_Single_File.html`. The separately numbered Android source-recovery archive remains v20.

## Recovered input behaviour

Inspected original `wh.smali` and v20 recovered `wh.java` (`n`, `l`), `k7.e`, `ha.f`, `GameActivity` control initialization, `ko` (`j`, `i`, constructor, drawing), and `dlg_aim_or_choose_ball.xml`.

- A striker/object contact sets `ho.z`; `wh.l` enables `wh.j0` in Free Pyramid when this flag is true. No contact leaves selection locked. The browser now carries this availability as `game.freeBall`, including network snapshots.
- Free ball selection captures the nearest ball on pointer-down using the native 36-dp radius, rejects the existing striker and inactive balls, and requires the same nearest ball at release. Native release conditions are strictly under 1000 ms and under 7 dp movement.
- When tap-to-aim is enabled, releases under 200 ms offer Aim / Choose ball. Other qualifying releases select directly. Original XML has two image buttons; the browser provides two labelled buttons and Cancel. Choosing changes the striker without moving or removing a ball. Aim keeps the striker and turns the cue toward the tap.
- Android dp maps to CSS pixels converted into the browser table coordinate system. Actual physical density, font scaling and Android gesture dispatch have not been replay-matched.
- Native `ko.j` uses clamped `(pointerY - originY) / q`; drag mode uses pointer-down Y, tap-to-shoot mode uses the top of the power control. The former arbitrary `0.48` drag multiplier is removed. `q` maps to the HTML's 301-unit drawn control height; exact native controller geometry remains a separate task.
- Tap-to-shoot now applies to the power control, not arbitrary felt taps. The native strict `J > .017` release threshold is used. Keyboard controls remain a browser extension.
- Power bands use original `ko.N` RGB values and constructor segment/gap calculation. All 19 triplets were compared against recovered `ko.java` and matched. Background/cue artwork positioning remains approximate.

## Files and validation

```sh
python3 research/phase22/apply_to_v18.py /path/to/v18.html /path/to/v19.html
node --test research/phase22/striker.test.cjs research/phase22/power.test.cjs
node research/phase22/runtime.test.cjs /path/to/v19.html
```

18 unit tests passed for exact timing/movement boundaries, nearest-candidate identity, control scaling, clamping and band counts. The actual HTML scripts passed a Node VM harness covering pointer-driven striker switching, opening-shot selection lock, long-press/movement rejection, both choice-dialog actions, restart dismissal, finished/inactive guards, contact/miss availability, power-bar tapping and dragging, absence of felt-tap shooting, and the exact release threshold. Prior Combo removal tests and 70% opening-break simulations in all three modes also passed with settled shots and finite ball states. Both embedded JavaScript blocks pass syntax checks.

The harness mocks DOM, drawing, timers and browser APIs. It does not prove rendered appearance, physical touch behaviour, peer interoperability, Android timing or deterministic native-versus-browser equivalence. The prior environment's Chromium socket restriction remains unresolved, so no Chromium pass is claimed. Full native AI, platform lifecycle, exact geometry, remaining foul callbacks and replay equivalence are outstanding. **This is still an incomplete 1:1 port.**

The private HTML embeds the user's original APK resources. It is delivered separately; no original APK, resource binaries or bulk decompiled source are included in this public phase.
