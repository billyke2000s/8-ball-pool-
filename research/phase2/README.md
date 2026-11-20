# Billiard APK — native engine decompilation phase 2

Source: user-provided original `Billiard.apk` (SHA256 `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`).

The full original compiled code was previously recovered as Java+Smali. Phase 2 traced additional **actual method bodies** and updated the offline one-file HTML port with source-derived formulas; the browser version **is not yet 1:1**.

## Decompiled methods traced

| Decompiled source | Finding |
|---|---|
| `mt.<init>` | Rack uses 30-degree geometry and ball spacing `diameter + min(F,G)/480`. Derives `k7.W`, `k7.U`, `k7.V` stopping threshold. |
| `t40.v(setting)` | Defines damping `k7.T = (0.995-0.001×setting)^1.75` and impact multiplier `ia.i = 2^(setting−1)`. |
| `ia.a()` | Cue impulse `pow(ko.J,1.12) × ia.i × 400 × k7.W`, with power/cue animation before firing. |
| `wh.onDraw()` | Updates `k7.J` from smoothed measured frame time times `0.006375`. |
| `k7.k()` | Advances a ball, queries earliest collision via `l30.m`, then checks pockets and dampens velocity. |
| `k7.r()` | Resolves collision normal velocities and multiplies both outputs by `0.99`; has special prior-hit branch. |
| `s8.c()` | Quadratic roots for predictive collision timing. |
| `l30.m()` | Picks earliest collision candidate from wall, pocket and other-ball objects. Java type inference is imperfect; Smali authoritative. |
| `k7.q()` | Processes pocket animations, scoring, turn changes, Blackball-specific situations. |
| `m7.c()` | Repeatedly advances all balls until motion finishes, then invokes turn-finalization. |
| `pu.d()` | Previously missing 487-instruction aiming-assistance method recovered in JADX simple mode (label-based linear form; not valid structured Java). |
| `ko.a(Canvas,Paint)` | Original power bar drawing method still fails full Java reconstruction; exact Smali preserved. |

## Port status

The standalone HTML now includes the original resource images and sounds, native nonlinear power, rack geometry, rolling decay, native-derived stopping threshold, and exact ordinary 0.99 collision impulse formula. Browser dynamics use adaptive substeps **instead of** faithfully executing `l30.m()`. The original full game-rule variants, rendering details, touch controller and CPU methods remain unverified as 1:1 browser code.

Tests: seven formula tests passed in Node; Chromium loaded both pool modes without page errors; Blackball (78% break) and numbered balls (58% break) settled, and no overlapping active pairs remained after the Blackball shot.

The full decompiled source and new Smali/linear-Java recovery supplement are available as downloads in the originating ChatGPT chat. This public branch **does not redistribute** the original proprietary APK, Smali, audio or graphics.
