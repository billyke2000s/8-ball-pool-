# Phase 28: original physics engine, verified bit-exact (v24)

## Why

Earlier phases rewrote the game in JavaScript, guided by the decompiled code. v23's own comments said its physics was "NOT a literal 1:1 port". Phase 28 checked the details and found these drifts:

- **Physics clock.** It used a 150 Hz fixed step with time-scaled friction. The original runs one physics pass per drawn frame: step = smoothed frame time × 0.006375, and friction is applied once per frame.
- **Table geometry.** It used one hand-tuned table with invented pocket-mouth segments. In the original, the cushions, jaws and pockets come from `mt`, and the whole table changes with the pocket-size setting.
- **Pocket capture.** It used "browser-scaled" radii. In the original, the radii depend on pocket size, difficulty and game speed (`mt.q`, `ei`, `wh.setDifficulty`). A larger radius also applies to balls that were hit and are legal for the shooter.
- **Collision handling.** v23 added a "small separation" nudge, a skip when balls are moving apart, and a cushion sound. None of these exist in the original.
- **Rack and start position.** The rack used a pattern copied from a screenshot. The original racks the balls in `1, 9, 2, 3, 8, …` order and mirrors the colours on every third game once you've won a game; the cue ball starts at `mt.m0[0]`.
- **Missing behaviour:**
  - the break spread (`k7.a`, `x00` tables) only applied to an exact apex hit;
  - the original's random break wobble for humans (`ia.a`);
  - the ×1.2 full-screen break boost.
- **Settings.** Default game speed was 2; the original's is 1, and only 1-player mode uses a speed above 1 (`t40.y`). "Small" pockets were setting 10; this version uses −18.

## How it is now built

1. **Reference.** `oracle/` runs the original `Billiard.apk` engine bytecode headless:
   - dex2jar turns the shipped DEX into JVM classes;
   - every Android framework class it touches is replaced by a generated empty stand-in (`genstubs.py`; `Bitmap` is hand-written so sizes work);
   - one enum (`vh`) is re-declared because R8 folded its constructor into `java.lang.Enum`, which HotSpot rejects.

   It runs the real `mt` table setup, `wh.setDifficulty`, `t40.v`, `k7`, `l30`, `ex`, `ea`, `ei`, `ho` code and prints positions every frame. Set it up with `sh oracle/setup.sh Billiard.apk dex-tools-v2.4`.
2. **Geometry is exported, not re-derived.** `export_geometry.py` asks the original code for every setting the menus allow: 3 rule sets × 3 pocket sizes × difficulties × game speeds, at the 700×1400 canvas size. The result, `geometry-700x1400.json`, holds 9 tables and 35 pocket sets covering 153 settings. The exporter checks that the table itself does not change with mode or speed.
3. **The engine is translated.** In `engine.js`, `k7`, `s8`, `ex`, `ea`, `ei`, `ho`, `wh.m/p` and the `m7.c` frame loop are translated line by line, keeping the original names. The contact search `l30.m` came out of the decompiler self-contradictory, so `fallback_to_js.py` machine-translates JADX's literal fallback output into a label state machine instead (`l30_m.js`). `build_engine.sh` combines the two into `native-engine.js`.
4. **Bridge into the game.** `bridge.js` and `apply_to_v23.py` produce v24. The engine owns the positions, collisions, pocketing and pocket-slide animation. The v23 rules code still runs, fed from the engine's own contact and pocket events. The table artwork is sized from the original geometry.

## Verification (actual results, 2026-11-22)

| Check | Result |
| --- | --- |
| Random shots vs the original bytecode (`FDLIBM=1 ./fuzz.sh 1000 2026`): rules, pocket size, mode, difficulty, speed 0–8, frame time 8–33 ms, cue position, angle and power all randomised | **1000 / 1000 bit-identical**, every frame and every ball; 277 shots pocketed 836 balls |
| A further `fuzz.sh 400 11` | 400 / 400 bit-identical |
| End-to-end through the page code: `fire` → cue animation → bridge → engine (`e2e.test.cjs`); 6 setting combinations, all three rule sets, pots and cue-ball scratches | Resting positions bit-identical |
| Golden reference shots for CI, no APK needed (`golden.test.cjs`) | 27 shots, 867 recorded frames identical |
| Earlier suites (phases 21–27) on v24, Node and real Chromium | Pass |

### Translation bugs the bit-exact test caught

- `ho.a` starts at 7, not 0. This changes whether the black is "legal", and with it the pocket capture radius.
- `ho.U` has 3 colours, not 4.
- **A decompiler error.** The bytecode computes `d * ((e * dR) * 0.1)`, but JADX printed `d * e * dR * 0.1`. That's a 1-ulp difference, and it compounds during a break.
- JavaScript `null != 0` is true, unlike Dalvik's `if-nez`. The machine translator treats `0`, `false` and `null` alike.

### What "bit-exact" means here

The physics needs only `sqrt`, `sin`, `cos`, `atan2`, `log` and `pow`. The test runs HotSpot with `-XX:-UseLibmIntrinsic`, so Java uses fdlibm.

- **V8 already matches fdlibm** for `sin`, `cos`, `atan2` and `log`: 4,000 / 4,000 samples.
- **For `pow` it doesn't.** V8's `pow` differs from fdlibm on 7.7% of inputs. `fdlibm_pow.js` is a port that matches `StrictMath.pow` on 100,001 / 100,001 samples, and the page uses it.

With identical maths, every difference found was a real translation bug, and all of them are fixed.

Phones themselves differ at the last bit: older Android used fdlibm, while newer versions use ARM's routines, which are nearly correctly rounded. So the claim is that the browser computes exactly what the original code computes on the reference JVM. Any phone may differ from that by 1-ulp rounding, which grows to at most fractions of a pixel over a long shot.

## Not yet verified / still from earlier phases

- **Rules after a shot** (`wh.l`: turns, fouls, ball-in-hand, respots, Pyramid scoring) are still v23's translation. They now receive real engine events, but haven't been differentially tested. The same oracle method applies; that's the next phase.
- **The computer player's shot choice** (`jo`, `lr`, `x2`) is still v23's approximation. Its shots now run on the exact engine.
- **Drawing.** The table, rails, pockets, shadows and guide line are placed from the original geometry, but not yet checked against the original `mt.e()` / `k7.h()` draw calls. A rendering reference (recording the stand-in `Canvas` calls) is the planned method.
- **Aim input** (`wh.n`, `ha`, `ko`) still uses v23's translation.
- **Not exact:** the first-launch break-wobble sequence and the colour-mirroring win counter use browser storage keys of their own.

## Files

| File | What it is |
| --- | --- |
| `engine.js` | Line-by-line translation (original names) |
| `l30m_fallback.java` → `fallback_to_js.py` → `l30_m.js` | Machine translation of `l30.m` |
| `native-engine.js` | Built by `build_engine.sh`; embedded in the HTML |
| `fdlibm_pow.js` | fdlibm `pow` |
| `geometry-700x1400.json`, `export_geometry.py` | Original geometry for every setting |
| `bridge.js`, `apply_to_v23.py` | v23 → v24 |
| `compare.cjs`, `fuzz.sh`, `e2e.test.cjs` | Differential tests that need the oracle |
| `golden/`, `make_golden.py`, `golden.test.cjs` | Recorded reference shots for CI |
| `oracle/` | Headless runner for the original bytecode (build products are git-ignored) |
