# Phase 12 — Recover the original rule sets and scoring

This phase uses the **actual recovered APK source and Android XML resources**, not an invented pool-game rulebook. The v12 self-contained HTML is available in the originating ChatGPT conversation as `Billiard_Native_Game_Rules_v12_Single_File.html`, but **not committed to this public repository** because it contains extracted APK images and sounds.

## Correct original mode taxonomy

The original `res/values/arrays.xml` has the precise three-item `game_rules_array`:

| Native value | Display name | Actual rack / rule family |
| --- | --- | --- |
| `t40.V=0` | **Free Pyramid** | Numbered balls `ball00`–`ball15` |
| `t40.V=1` | **Combo Pyramid** | Numbered balls `ball00`–`ball15` |
| `t40.V=2` | **Pool (8-Ball)** | Red, yellow, black and white |

Previously, the HTML incorrectly treated the numbered balls as American solids/stripes eight-ball. That's now corrected. The public old `docs/` app remains a separate non-1:1 prototype; do not conflate it with the private HTML port.

## Direct native source mapping

- `t40.p()` is true **only for V=2**, i.e., Pool (8-Ball). `t40.q()` is true for V=0 or 1 (Pyramid).
- `wh.s()`: Pool uses the 15-ID insertion list `[1,9,2,3,8,10,11,4,12,5,6,13,14,7,15]` combined with 4 bitmap classes `u7.d` (white/red/yellow/black). Free/Combo Pyramid builds original IDs **1 through 15 in order**, using numbered `u7.e` bitmaps. The browser now follows this distinction.
- `k7.q()`: when a ball is pocketed, the selected striker (`m`) increments the current player's `c`, and ordinary balls increment `b`; after a Pool colour is potted, the native code assigns suit or flags a wrong-colour pocket according to state.
- `ho.h()`: Pyramid `V=0` score is `b+c-e` when `penalty_on_foul_ru=0`, otherwise `opponent.e+b+c`. For `V=1`, score is `opponent.e+b+c`. Pool `V=2` tracks `7-a` colour-ball progress instead.
- `wh.i()`: Two-player Pyramid finishes once either side reaches **8 points**, with other end conditions for solo and cue-selection states.
- `GameActivity` defaults: `can_choose_suit_on_first_strike` defaults **false** in this APK (`App.n=true`); `penalty_on_foul_ru` defaults **0** and offers `Player loses 1 point` or `Opponent gets 1 point`. The original `reset_black_on_break` and `lose_if_scratch_on_black` preferences are Pool-specific; earlier HTML accidentally applied them to the numbered mode.
- `k7.q()` and `wh.m()`: pocketing a colour belonging to the other player after suit assignment is a foul in the recovered Pool branch. The HTML now accounts for this, including a multi-pot shot that also pockets one's own colour.

## What v12 implements

1. Exact three-mode names and selection, with native rack ID order and appropriate bitmap families.
2. Pool (8-Ball) black-ball re-spot and scratch-loss rules applied to the correct mode.
3. Pool can-choose-suit-on-break switch, reflecting `t40.n` instead of always deferring.
4. Pool wrong-colour pocket foul check.
5. Free Pyramid points and both original foul-penalty choices.
6. Combo Pyramid points and opponent-foul bonus.
7. Pyramid first-to-eight win condition and score display in the settings menu.
8. Exported multiplayer state includes Pyramid scores and foul counters.

## What is **still not 1:1**

- The Android-specific **Combo Pyramid striker selection** following a pocketed cue ball (`ha.f`, `wh.k0`) is not translated to the browser; v12 re-spots the cue and allows placement as an approximation.
- The `wh.m` foul criteria and `k7.q` callbacks occur **during the native shot**, whereas the browser currently reconciles them after balls settle, so certain multiple-ball interactions may differ.
- The original Pyramid distinction between selected striker and other white balls cannot be represented by the browser's fixed-ID-0 cue architecture without a larger refactor.
- Native CPU strategy, gesture timing, and frame-by-frame Android/table geometry are still not verified for equivalence.

## Tests performed

- **16** targeted Chromium checks for the three modes, correct racks, Pool rules, Pyramid scoring, victory and state fields, and an 80% break.
- **9** further stress checks: Free, Combo and Pool each at 40%, 70% and 100% power, checking settled state, finite coordinates and no overlaps.
- **25 tests passed** in these two runs with no browser JavaScript errors.
- The HTML is **one file** (1,148,970 bytes) with **43 embedded images and 5 embedded audio resources**, no external scripts.
- Native-to-browser side-by-side input trace equivalence was **not performed**.

This phase corrects several substantive errors from v11 but it is **not a complete 1:1 port**.
