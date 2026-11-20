# Phase 16 — Native Pool target eligibility and pocket-time suit/foul callbacks

Recovered directly from the user-provided original `Billiard.apk` (original SHA-256 `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`). This is research into an independently executable browser translation; **it is not certified as an exact 1:1 port**.

## Decompiled source references

- `defpackage/ho.java`, `ho.b()`, `ho.c()`, `ho.g()`: when `t40.p()` indicates Pool, the computer initially targets live non-white, non-black balls. When the player has a chosen suit, it targets only that suit. When `a <= 0` (own suit cleared), it targets the black ball (native `k7.B`). The prior HTML incorrectly excluded the black from normal target filtering and relied on a separate fallback.
- `defpackage/k7.java`, `k7.q()`: a colour pot can select the active player's suit immediately, and a later opponent-colour pot causes an immediate `wh.m(false)` foul. Pocket order matters, including in multiple pots from one shot. This was partly missed by the previous settle-only HTML.
- `defpackage/wh.java`, `wh.m(boolean)`: foul is marked once per active player via `ho.f`. The browser v16 records an event-time flag; it does not claim to reproduce all native player flags or rendering delays.
- `GameActivity` / `t40.n`: 'choose suit on first strike' changes whether an opening-break colour pot can immediately assign a suit. The v16 port keeps the table open if this option is disabled.

## What changed in the one-file HTML

- New native-target filter mirrors the `ho.b()` branches, including *black only* after suit clearance. The CPU candidate generator and fallback now use the same legal-target set.
- Coloured-ball pocket callbacks now assign suit immediately when allowed and mark wrong-colour fouls at the pocket event.
- The first-break exception no longer clears a previously recorded wrong-colour foul, including when 'choose suit on first strike' is enabled.
- Existing Pool black timing, scratch timing, Pyramid modes, striker selection, touch controls and original APK art/audio remain intact.

## Tests (actual Chromium runs)

- **13** new checks: open/suited/cleared target sets, CPU black candidates, first-colour suit assignment, mixed-colour foul, first-break suit-on/off and foul persistence, early-black loss, and 82% opening break.
- **13** prior Pyramid and game-state regression checks.
- **4** prior black-ball/scratch chronological checks.
- **4** real pointer/wheel/Combo removal checks.
- **9** break stress checks: Free Pyramid, Combo Pyramid, Pool × 40%, 70%, 100%.
- **2** mobile layouts at 412×915 and 700×1400 without document overflow.
- 45 checks in all. JavaScript syntax and each suite passed with no recorded browser page errors; HTML contains 43 data-URI images and 5 data-URI audio assets and zero external JS imports.

## Limitations

Some original rule flags and callbacks in `wh.l()`, `wh.m()`, `k7.q()` are still simplified in browser code, while Android-only frame pacing, native jaw geometry, bank/safety AI and side-spin outcomes have not been matched by a deterministic Android-to-browser replay. The original APK was not run in an emulator side by side with this build.

The playable artifact is named `Billiard_Native_Pool_Event_Targeting_v16_Single_File.html` in the conversation. Because it embeds unverified-licence third-party art/audio, it is **not** added to this public GitHub branch.
