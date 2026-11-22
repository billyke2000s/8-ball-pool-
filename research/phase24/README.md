# Phase 24 — Contact-gated scoring and native foul rules

Input: private v19 HTML. Output: private `Billiard_Native_Contact_Rules_v20_Single_File.html`. Android decompilation v20 is a separately versioned archive.

## Original methods traced

`k7.q()` (pocket callback) first checks `k7.t`. A missing contact link invokes `wh.m(true)` and skips the scoring/terminal callbacks. In Pyramid, linked striker pots increment `ho.c`; linked object pots increment `ho.b`, except deliberate Combo removal (`k7.q` flag). `wh.l()` independently marks no striker contact (`!ho.z`) as a foul. All original Smali calls to `wh.m(Z)` were enumerated: they occur in `wh.l`, `k7.e` and `k7.q`. There is no generic cushion-or-pot requirement in those callbacks.

## Browser corrections

- Record contact-qualified pots separately from all physical pots. Unlinked pots mark an event foul and earn no Pyramid point.
- An unlinked Combo striker pot does not earn an additional remove-ball selection.
- Remove the invented no-cushion/no-pot foul in both Pool and Pyramid.
- Preserve the suit at shot start for first-contact legality. Choosing a red suit by potting red later in an initially open-table shot no longer retroactively makes an earlier yellow first contact illegal.
- The first-break flag no longer erases wrong first-contact fouls; first contact with black remains illegal on an open table.
- An unlinked black pot follows the nonterminal foul/respot path, rather than invoking a black-ball win/loss callback that native `k7.q` never reaches.
- Combo removal guide now uses native yellow (`-256`) rather than the previous white line.

## Verification

Six new pure-rule tests pass. The actual-script runtime harness additionally exercises unlinked point suppression, Combo selection suppression, post-contact no-rail shots, open-table suit timing, assigned-suit illegal contact, black first contact on break and unlinked black respot. Previous selection/power regressions and three 70% opening breaks pass.

The expanded **real headless Chromium** workflow passed at commit `acebbd58f3a749c954fa51f82f73ac73b7493bd1`, run https://github.com/billyke2000s/8-ball-pool-/actions/runs/44976739605 . It runs 32 pure tests, actual-script runtime checks, real pointer/dialog/power-control interactions, three viewports, three opening breaks, and 48 mode/speed/power combinations with finite state and settlement assertions. No browser page errors were recorded.

The public headless fixture replaces all 43 original images with dimension-matched solid SVGs and omits original audio. Its gameplay script is byte-identical to the private v20 HTML (SHA-256 recorded in phase23). These tests exercise actual browser DOM/Canvas/game logic; **they do not verify original artwork, audio or visual parity**.

## Remaining barriers to 1:1

Native AI safety/bank planning and candidate simulation are still incomplete. Exact Android geometry, all player/foul flags, side-spin effects, lifecycle timing and deterministic native-versus-browser replays remain outstanding. No Android emulator is available in the local execution environment; the original Android app has not been run side by side. The passing headless browser job is not a parity certificate and does not autonomously implement missing game features.

Reproduce:

```sh
python3 research/phase24/apply_to_v19.py v19.html v20.html
node --test research/phase24/pocket_rules.test.cjs
node research/phase24/runtime.test.cjs v20.html
```
