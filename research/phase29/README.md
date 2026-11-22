# Phase 29: compile the whole original game to JavaScript (in progress)

## Goal

The whole game 1:1, not just the physics. Hand-translating tens of thousands of lines is how earlier phases drifted from the original, so this phase compiles the original bytecode instead. `dex2js.py` turns apktool's smali (Dalvik instructions, with exact types and method signatures) into JavaScript one instruction at a time. Every class gets the same mechanical, checkable treatment. A browser runtime then stands in for the Android and Java framework.

## What exists now

| Part | Status |
| --- | --- |
| `dex2js.py` compiler | Compiles all 1,282 classes in the APK with no failures |
| `rt.js` runtime | Class model, static initialisation order, Java arrays, exceptions, `instanceof`/casts, cooperative threads |
| `jdk.js` | The `java.*` subset the game uses |
| `android-headless.js` | Android stand-ins for tests; unknown framework classes become automatic placeholders, and their calls are counted |
| `golden-compiled.test.cjs` | Proves the compiler on real game code |

What the compiler preserves:

- **JVM number rules.** `int` wraps; `long` is 64-bit (BigInt); `float` uses `fround`; float-to-int casts saturate; the `cmpl`/`cmpg` NaN rules hold.
- **Exact signatures.** Field and method keys include them, so obfuscated overloads can't collide.
- **Blocking methods.** Methods that sleep or wait (the cue animation, the physics thread, the computer player's turn, touch handling: 222 in total) become generators that the runtime schedules cooperatively.

**Proof (actual result).** The compiled ORIGINAL classes replay the phase-28 golden shots, recorded from the original bytecode on a JVM. All **27 shots and 867 frames are bit-identical**. The run executes the original 1,400-line `mt` table constructor, `wh.setDifficulty`, `t40.v/y`, and all of `k7`, `l30`, `ex`, `ea`, `ei` and `ho`, with no hand translation.

Bugs the test caught in the compiler and runtime, all fixed:
- `high16` constants were shifted twice;
- a zero used as an array index was typed as null;
- JavaScript's inherited statics made every class look initialised;
- a placeholder return value differed from the JVM stand-ins.

## Remaining work for the whole game

1. **Browser Android layer.** Each piece maps onto a browser equivalent:
   - `Canvas`/`Paint`/`Bitmap`/`Matrix` → HTML canvas, using the original APK images;
   - `View` and `MotionEvent` → pointer events;
   - `Activity`, `Dialog` and the layout XMLs → HTML generated from the original layouts and strings;
   - `SharedPreferences` → localStorage;
   - `SoundPool`/`MediaPlayer` → Web Audio;
   - `Handler`/`runOnUiThread` → the frame loop and the cooperative scheduler.
2. **Run `GameActivity` itself**, driving its lifecycle (`onCreate`/`onResume`/`onPause`), so the original menus, rules, computer player, drawing and input all run as compiled code.
3. **Ads, analytics and billing** become no-ops, because the browser version has none.
4. **Verification.** Extend the JVM oracle to run whole games (rules, AI turns, drawing calls) and compare them with the compiled page, as phase 28 did for physics.

Until step 2 works, the playable file stays v24: phase-28 physics plus v23 rules, AI and UI.

## Build

The output contains the app's own code, so it's built from your APK rather than committed:

```sh
apktool d Billiard.apk -o billiard-smali
sh research/phase29/build.sh billiard-smali/smali /tmp/billiard-compiled.js
node research/phase29/golden-compiled.test.cjs /tmp/billiard-compiled.js
```
