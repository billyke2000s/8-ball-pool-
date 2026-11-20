# Original Billiard.apk → one-file HTML: Phase 3

Source: user-provided original APK SHA-256 `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`.

**Current result:** source-grounded, self-contained HTML with actual original artwork/audio, but **not independently verified as a full 1:1 conversion**. The complete HTML containing APK assets is delivered privately to the user, not committed to this public branch.

## Newly traced native methods

| Source | New implementation detail |
| --- | --- |
| `s8.c`, `k7.b` | Predicts time to ball collision with a quadratic root instead of coarse discrete overlaps |
| `ex.b` / `ex.a` | Swept collision against finite cushion segments and reflect normal velocity with the native default `y7.a = 0.9` |
| `ea.b` / `ea.a` | Swept contact and reflection at cushion endpoints / pocket jaws |
| `ei`, `k7.k` | Six pocket-capture circles with time-to-entry checks |
| `x00.d/e/f/g/h/i/j`, `k7.a` | Original 16-entry special opening-break vector table, angular weights, speed factors and energy redistribution |
| `t40.v`, `ia.a` | Existing native rolling decay and nonlinear cue-power constants retained |
| `wh.n`, `ko.J` | Corrected input threshold to the native 1.7% power minimum |

A guarded `localStorage` implementation also remembers optional mode, players, sound, difficulty, and speed settings; the Android game uses SharedPreferences.

## Tests run

- Headless Chromium: full original embedded images and audio decode; both ball sets render
- Predictive high-speed cue/object collision transfers velocity before penetration
- Cushion rebound returns moving ball to the play field
- Middle pocket correctly captures and deactivates a ball
- Original-pattern Blackball opening breaks complete without overlap or page errors
- Same break is deterministic across repeats
- Numbered-ball break settles with finite velocities and positions
- Mobile-size viewport correctly operates menu, game mode and pull-back power shot

The delivered HTML is one file (43 image assets + 5 sounds), about 1.1 MB; no external scripts or stylesheets.

## Fidelity limits

The original `l30.m()` has a complex shape validation pass and sequentially updates moving balls in `k7.k()`. The HTML uses a globally ordered **relative-velocity event loop**, so even with the source-derived collision formulas it is **not** literally identical to the original collision scheduler.

Not yet verified as identical: `ia.a()` 20-ms cue animation + 40-ms hold; complete `wh.l` and `k7.q` foul, suit, and win transitions; `jo` / `pu` / `fi` AI; Android-specific controls and settings variants; comparative frame-by-frame traces against original Android app.

**Do not advertise the HTML as a verified 1:1 port.**
