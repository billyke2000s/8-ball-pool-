# Phase 18 — Full Java decompilation audit and repair

This phase addresses **the original APK Java decompilation**, not the standalone HTML billiards game. The original input is the user's supplied `Billiard.apk`, SHA-256 `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`.

## Findings and completed work

The earlier source archive contained **11 explicit `Method not decompiled` stubs**, plus **104 Java parsing errors in 17 files**, mostly from `??` types caused by obfuscated Dalvik register merges.

- Re-ran JADX 1.5.7 with `--show-bad-code`, preserving the original output for all unaffected files.
- Recovered nine previously stubbed methods through alternative JADX output: `x4.E`, `x4.l`, `lt.g`, `vp.k`, `da.getResources`, `id.filter`, `u00.T`, `pu.d`, `bk.onTouch`. These are **best-effort Java, not verified to compile or match bytecode**.
- Reconstructed `ko.a(Canvas,Paint)` and `m.get(long,TimeUnit)` manually from their original Smali, retaining unchanged original Smali and DEX.
- Made syntax repairs in 26 Java files, including core table/ball/event classes `mt`, `k7` and `l30`. Corrected recovered boolean-to-int array indexes and source-defined `si.i()` results.
- Used the JDK compiler parser (`JavacTask.parse`, syntax only) to inspect all **1,261 Java files**: **0 syntax errors**, compared with 104 before repair.
- Verified original `classes.dex` SHA-256 is `69ce25c00e06e92b9ef3a167fc3a932240b43c4ff80bd35d6c3306ea70e1b3e9` and preserved its original bytes.
- Created private `Billiard_Improved_Decompilation_v18.zip` (3,135 files, full Java+Smali+decoded resources+DEX+method matrix+patch) in the originating ChatGPT conversation.

## Important remaining blockers

**Zero syntax errors does not equal a compilable or 1:1 correct Java project.** Exact original names and build files are not recoverable. These areas still require careful source-level type and control-flow recovery:

- R8 merged-register type bugs in bundled code such as `a50.Q`, `o2.c`, `mf.onCreateView` and `sc.b`; syntax repairs are explicitly labeled **not type-verified**.
- Nine methods recovered with `--show-bad-code` still need manual comparison to Smali and targeted tests.
- Two manually reconstructed methods need Android or mock runtime testing.
- Approximately 90 `throw null;` statements across 39 files warrant a case-by-case audit; some are legitimate unreachable R8 code.
- Full Java type checking, a clean Android Studio build and native-versus-HTML replay testing remain unverified.

The original APK, original graphics/sounds, decompiled Java and Smali are **not** uploaded to this public repository because the third-party developer's redistribution permissions have not been established. The original binary and private recovery artifact remain available to the user in the conversation.

**This is a substantial source recovery improvement, not a claim of exact original Java or a finished 1:1 browser conversion.**
