# Phase 25 — Native computer striker search, removal choice and adaptive history

Continues private HTML v20 into `Billiard_Native_CPU_Strikers_v21_Single_File.html`. Uses v20 recovered Android Java and original Smali; no original APK or artwork is committed here.

## Translated behaviours

- `jo.c/f`, `x2.c`, `ha.f`: when `wh.j0` unlocks Free Pyramid selection, search candidates from every active ball as striker, retain each candidate's striker ID, and bind the selected striker before the actual CPU stroke. Candidate enumeration does not mutate the ball state or active striker. Locked Free, Combo and Pool retain a fixed striker.
- `jo.f` adds alternate-contact candidates alongside ordinary candidates for both Pyramid rule sets. Removed the browser-only -12 penalty. Pool no longer receives these Pyramid-only candidates.
- `lr` scoring fixes: native `s` trick bonus applies to Combo, `lr.u` weight is always 5 for a Pool CPU, `lr.n/o/p` reward using the original striker and measure replacement-striker displacement, and open-Pool imbalance uses potted red/yellow counts. The old implementation tested a nonexistent `eight` mode and used remaining counts/selected-suit conditions.
- `kp`/`x2.a`: rank Combo removal choices using contact opportunities, endpoint quality and inverse-squared crowding, rather than removing the first live ball. The endpoint deduplication was checked directly against `kp.smali`: an interior candidate is omitted if an exterior candidate exists for the same physical pocket and trick flag. JADX's nested loop was incorrectly structured; that faulty Java loop was not copied.
- `wh.l`/`l8`: the original `nWon` counts the human-side result (`wh.N`), including the native draw branch, rather than CPU victories. Existing v5 browser history is inverted on read into corrected v6 semantics; new results are recorded once. Finished Pyramid matches now participate too, and Pyramid scores feed the adaptive coefficient instead of both scores reading zero.

## Validation

Seven new pure Combo ranking tests cover absent candidates, negative-score clamping, interior/exterior deduplication, trick flags, crowding, eligibility and removal choice. The actual-script runtime harness covers multi-striker search, search immutability, eligibility, CPU striker binding, finite candidates, Pool/Pyramid separation, score weighting, colour imbalance, actual Combo removal choice, history migration/counter direction/deduplication/draw semantics and Pyramid score context. Earlier gesture, scoring, removal and shot-settlement regressions remain included.

The headless Chromium suite additionally exercises nine mode/difficulty CPU scenarios, testing search immutability, finite ratings, firing, correct striker binding and eventual settlement, alongside the prior 48 mode/speed/power combinations. The public fixture replaces original artwork with dimension-matched placeholders and omits audio; it tests the same gameplay script, not visual/audio fidelity.

## Reproduce

```sh
python3 research/phase25/apply_to_v20.py v20.html v21.html
node --test research/phase25/removal.test.cjs
node research/phase25/runtime.test.cjs v21.html
python3 research/phase23/make_fixture.py v21.html research/phase23/fixture.html
node research/phase23/headless.test.cjs research/phase23/fixture.html
```

This is not the complete original AI. Native safety/penalty placement planning, virtual-body simulation and execution error, exact geometry/shot-power mapping, CPU opening-break variation and native-versus-browser replay matching remain unfinished. Input and score equations have source references; browser candidate geometry still contains previously documented approximations. No full Android parity claim is made.
