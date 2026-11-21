# Phase 19 — Smali-verified Java control repair and throw-site audit

Source material: user-provided original `Billiard.apk` (SHA-256 `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`) and the v18 recovered Java/Smali archive. **This phase modifies recovered Java, not the playable single HTML file.** The private, full repaired v19 Java/Smali ZIP is provided as a downloadable conversation artifact; original third-party assets and decompiled source are not uploaded to this public repository.

## Actual repairs

From original `ko.smali`, reconstructed three methods in the aiming/power UI class:

- `ko.<init>(wh,ha,Bitmap)` — repaired distinct legacy/portrait/landscape branches, bar dimensions, spacing, startup power and proper return flow. The v18 Java had duplicated initialization and branch fall-through.
- `ko.g()` — precise expansion of wheel touch boundaries, including Android legacy/landscape branch.
- `ko.h()` — recovered three original touch-region branches, width/height constraints and the `B` flag expansion.

Added missing Android graphics imports for the v18 manually recovered drawing method `ko.a()`. No Smali or original DEX was modified.

## Concrete validation

- `JavacTask.parse` passed **1,261/1,261** Java files: **0 syntax errors**, **0 explicit undecompiled method stubs**.
- Unlike the previous syntax-only audit, **`ko.java` now passes actual `javac` type checking** when linked to minimal Android/game API test stubs. The previous version failed that same focused harness with 13 missing-graphics-class errors.
- **50 runtime assertions passed** for bar geometry, constants, touch bounds and drawing method invocation across five harness configurations. These tests don't establish Android runtime/pixel equivalence.
- Decompiled `throw null`: **90 Java sites across 39 classes and 60 methods** inspected with compiler AST positions. Each matched a corresponding original Smali method with a throw instruction. **28 sites in `i5`** match explicit original null-register throw branches; they are not simply missing Java bodies. For the remainder, Smali throw presence does not prove full branch equivalence, so the audit keeps their status unresolved rather than deleting code.

## Deliverable

Private conversation artifact: `Billiard_Improved_Decompilation_v19.zip` (8.5 MB), with repaired Java/Smali, `KO_SMALI_REPAIR.patch`, `THROW_NULL_SITES.csv`, `THROW_NULL_SMALI_AUDIT.csv` and a reproducing `javac` harness.

## Outstanding

The complete 1,261-file tree has **not** passed full Java type attribution or an Android Gradle build. Important R8 type-merge problems remain in `a50.Q`, `o2.c`, `mf.onCreateView`, `sc.b`; nine previously recovered JADX bad-code methods need Smali control-flow confirmation; other Java null-throw branches need site-by-site tracing. The original game needs native Android-versus-browser replay tests before claiming exact 1:1 conversion. Do not equate preserved original Smali with original pre-obfuscation Java.

**The v17 standalone HTML remains unchanged by this source-recovery phase.**
