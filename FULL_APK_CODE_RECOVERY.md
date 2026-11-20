# Complete original APK code recovery — status and method

The objective is the **whole original Android game code**, not a substitute HTML/Canvas game and **not** modifying the supplied APK. The earlier UI rewrite and Bluetooth code on `main` are unrelated to the requested 1:1 code recovery.

## Confirmed recovery from the user-supplied original Billiard.apk

- APK SHA-256: `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`
- Original APK size: **2,632,515 bytes**.
- **JADX 1.5.7** decompiled the full app into **1,261 Java files** (including bundled libraries).
- **Apktool 3.0.3** recovered **1,282 exact Smali class files**, along with the original resource files, XML and manifest.
- JADX reported four code-generation errors. **Eleven method bodies** are not reconstructable as structured Java by the default pass. A separate low-level fallback pass recovered linear-form Java output for their classes, while the exact instructions are available in the full Smali.
- Reassembling decoded Smali/resources with Apktool **completed successfully**, yielding an **unsigned** APK. This validates reassemblability of the recovered bytecode, but is not a 1:1 Java source project.
- The complete recovered package is available as **`Billiard_FULL_Reverse_Engineered_Code.zip` in the originating ChatGPT conversation**. The compressed source dump is not committed to this public repository.

## Core recovered classes

| Source | Recovered responsibility |
| --- | --- |
| `com/andregal/android/poolbilliard/GameActivity.java` | Android game activity |
| `defpackage/wh.java` | Original table View, rendering, touch input and game controller |
| `defpackage/k7.java` | Ball state, geometry and physical calculations |
| `defpackage/mt.java` | Table geometry, cushions, bitmaps and pocket rendering |
| `defpackage/ko.java` | Aiming/control UI; one Java drawing method is incomplete (see `ko.smali`) |
| `defpackage/ha.java` | Cue/shot state and animation |
| `defpackage/ho.java` | Player / active ball state |
| `defpackage/vh.java` | Actual game modes: SINGLE, PvP, PvC, UNKNOWN |

The table is a custom Android `View`, not web technology. `wh.onTouchEvent(MotionEvent)` delegates to `wh.n(MotionEvent)`; the latter has 1,953 Dalvik instruction units. Original `wh.onDraw(Canvas)` has 415. This is analysis of the **actual method bodies** rather than guessed replacement physics.

## Fidelity and remaining work

- **All original compiled instructions are preserved** in `classes.dex` and the Smali. This is recoverable 1:1 bytecode, not the lost original project.
- **Structured Java is best-effort reconstruction**, with obfuscated names, JADX warnings, and a few imperfect methods. An Android Studio-ready, clean Java/Kotlin project has **not** been produced.
- There is **no new Bluetooth implementation** in this code recovery. A 1:1 reverse-engineered source project and new multiplayer functionality are separate phases.
- The original third-party app's redistribution rights have not been verified. Do not publicly push decompiled proprietary code or assets without confirming permission.

To reproduce the full extraction from an APK copy, use the source recovery script on this branch.
