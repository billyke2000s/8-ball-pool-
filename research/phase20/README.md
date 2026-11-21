# Phase 20 — Corrected Room invalidation and fragment inflation Java recovery

**Scope:** The user-provided original `Billiard.apk`, SHA-256 `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`. This phase repairs the **decompiled Android Java**, not the browser game. The third-party decompiled source and extracted assets remain in the private downloadable ZIP, not this public repo.

## Two Smali-checked repairs

### `defpackage/o2.java`, private `c()`

The recovered Room invalidation worker had a mixed-register type error: JADX merged a changed-table set and a boolean and structured the exception-handling path incorrectly. The original `o2.smali` method `c()V` was used to reconstruct:

- Early exits when the tracker is unavailable, no new invalidation is pending, or SQLite is already in a transaction.
- Correct read-lock acquisition/release and atomic invalidation flag reset.
- Conditional transaction begin/commit/cleanup and changed-table ID collection.
- SQLite and illegal-state logging from the original guarded region.
- Observer iteration only when the changed-table set is nonempty.
- The original `throw null` observer path, which is **present in the compiled bytecode**, deliberately remains unchanged.

**Verification:** 26 assertions across 9 focused scenarios, using a harness that compiles the recovered method with minimal test doubles. This is not a full-APK typecheck.

### `defpackage/mf.java`, `onCreateView(View,String,Context,AttributeSet)`

JADX had generated a nested infinite `while(true)` fragment-tag search when neither the active-fragment list nor the map contained the requested tag. Comparison with original `mf.smali` (`:goto_4` through `:goto_5`) shows the original searches each collection once and falls through to ID lookup or fragment creation. Restored that flow and repaired the null-register/View/Fragment type merge.

**Verification:** The entire corrected `mf.java` compiled with focused Android API test doubles and passed 22 assertions across 12 scenarios, including missing-tag lookup, list/map match, parent-ID fallback, duplicate-ID rejection, attaching the view/tag, and class-validation paths.

## Full recovered tree

- **1,261 Java files retained.**
- **0 Java syntax errors** in a whole-tree `JavacTask.parse` pass.
- **0 explicit `Method not decompiled` stubs** (unchanged from v19).
- **2 Java files modified.**
- **48 focused Java assertions passed.**
- Original `classes.dex` SHA-256: `69ce25c00e06e92b9ef3a167fc3a932240b43c4ff80bd35d6c3306ea70e1b3e9`, unchanged.
- Complete v20 source ZIP integrity verified. The archive contains the full recovered Java and Smali, both v19-to-v20 source patches, and executable mock-based test harnesses.

**Private artifact:** `Billiard_Improved_Decompilation_v20.zip` (8,563,777 bytes, 3,209 ZIP entries, 1,261 recovered Java files; SHA-256 `9993920ee4c9d07897826da7e03a3f6dfb4696e081fb72e8c23dab35185d988b`).

## What remains unresolved

Complete Android SDK type-checking and a clean source build have **not** succeeded. Other known R8 register-type issues, especially `a50.Q` and `sc.b`, remain for manual Smali-based reconstruction. The nine best-effort JADX methods and additional `throw null` control paths need deeper verification. The original APK-to-HTML replay equivalence is not established.

**Do not call this a finished 1:1 Java project or complete HTML port.** The recovered original Smali, not the decompiled Java, remains the bytecode reference.
