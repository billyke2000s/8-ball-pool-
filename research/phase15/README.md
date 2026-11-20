# Phase 15 — Pocket-event ordering and Blackball legality

This phase works from the same user-provided original `Billiard.apk`, specifically `k7.q()` and `wh.m(boolean)`, rather than a generic 8-ball rulebook.

## What was wrong in the HTML v14 port

It processed fouls and black-ball legality only after every ball stopped. A shot could pocket the black **before** the player's last red/yellow and then pocket that colour later, incorrectly turning the early black pot into a legal win. Conversely, the port could penalise the correct first contact with the last colour because it checked the *final* number of remaining colour balls instead of those at the beginning of the shot. The original APK has event-time pocket/foul callbacks.

## Changes in the one-file HTML v15

- Records `ownBallsAtStart` with the selected striker/active player's group when firing a shot.
- When a black ball enters the pocket, records whether the player's colour balls are **still active at that moment** (`blackEarly`).
- When a cue ball enters the pocket, records whether the player had already cleared their suit **at the moment of the scratch** (`scratchAfterCleared`).
- Win/foul settlement uses these recorded events, not the table's eventual ball counts. Injected state fixtures without historical fields use a reconstruction based on active balls plus balls potted this shot.
- Retains v14's source-mapped Free Pyramid striker transfer, Combo Pyramid white-ball selection/removal, `ho.h()` scoring options and `wh.n()` three-sample touch aim.

The native code fires more callbacks during shots than the current browser version, so this is a **partial recovery of chronological rule handling** rather than a guarantee of perfectly equivalent state transitions.

## Test evidence

- 4 new Chromium tests with real `pocket()` events:
  - Black drops before final red, then red drops: **loss**
  - Final red drops before black: **legal win**
  - Cue scratches before final red is cleared: no retroactive lose-on-black
  - Cue scratches after red cleared: lose-on-black option applies
- 13 v13 game-state/regression checks all passed on v15.
- 9 stress tests at 40/70/100% break power across Free Pyramid, Combo Pyramid and Pool (8-Ball) all passed.
- 4 Chromium pointer/wheel/removal-delay tests passed.
- JavaScript `node --check` passed without syntax errors; tests reported no browser page errors.

**30 browser checks** including four event-order tests passed in v15's suite (4+13+9+4). The prior viewport validations were run on v14, and the rendered visuals have not changed in v15.

## Distribution and remaining requirements

The single HTML file, `Billiard_Native_Pocket_Event_Rules_v15_Single_File.html`, embeds the original private APK artwork and sounds, so is shared with the user as a downloadable conversation artifact rather than committed to this public repository.

**Still not verified 1:1:** Android-specific table/jaw coordinates, exact frame pacing and collision replay, every native `wh.m` special case, full AI bank/safety and level adaptation, and a native Android-vs-HTML replay test. Exact original pre-obfuscation source isn't recoverable from an APK.
