# Phase 27 — Native navigation, quit flow and music (v23)

Translated from the recovered app; none of it is claimed to be pixel-identical or verified on a device.

## Added in v23

- **Startup game-type chooser.** `GameActivity` starts in `vh.UNKNOWN` and `onResume` calls `zb.d()`: *Select Game Type* → 1 Player / Human vs Computer / 2 Players (`lb` 0/1/2). Human vs Computer opens *Select Difficulty* → Easy / Normal / Hard (`zb.c()`, `lb` 6/7/8).
- **Quit dialog** (`dlg_quit_game.xml`). It shows *Quit this game?* with Yes / No / Restart. Yes (`GameActivity.w`) goes to the difficulty chooser in PvC and to the game-type chooser otherwise. No (`z`) resumes the game unchanged. Restart (`xb` 0 → `y`) starts a new game in the same mode.
- **Android back** (`nn`). Escape and the browser/phone back gesture follow the native order:
  - quit dialog → Yes
  - difficulty chooser → game-type chooser
  - result dialog → restart
  - settings menu → close
  - game-type chooser → leave the page
  - during play → quit dialog
- **Result OK restarts** (`oh` sets `zb.p` = `xb(1)` → `y()`). v22 only closed the dialog.
- **Music** (`km`, `mb`, `v3`, `t40`).
  - Plays the original `res/raw/entertainer.mid`, looped. It is off by default (`music_track` defaults to `"off"`) at volume 35/100 (`music_volume`).
  - After an interruption shorter than 5 s it resumes from the same point; after a longer one it restarts from the beginning.
  - Browsers cannot play MIDI, so `music.js` parses the file and plays its notes and tempo with a small Web Audio piano voice. **The timbre differs from Android's synthesiser.** Browsers also need one tap before any audio can start.
- **Network games** are disconnected when Yes is chosen on the quit dialog.

Not ported: interstitial ads and analytics calls in the same code paths, the native dialog styling, and the rate-game variant of the result dialog.

## Rebuilding the playable file

The private playable HTML no longer lives only in a chat. Anyone with the APK can rebuild it:

```sh
python3 scripts/build-private-html.py /path/to/Billiard.apk Billiards.html
```

The script embeds the original art, sounds and music into the public fixture (`research/phase23/fixture.html`). It warns if the APK hash differs from `d91843d6…`. The v23 file built this way is byte-identical to the one produced by `apply_to_v22.py`.

## Reproduce and test

```sh
python3 research/phase27/apply_to_v22.py v22.html v23.html path/to/res/raw/entertainer.mid
node research/phase26/runtime.test.cjs v23.html
node research/phase27/runtime.test.cjs v23.html path/to/res/raw/entertainer.mid
python3 research/phase23/make_fixture.py v23.html research/phase23/fixture.html
node research/phase23/headless.test.cjs research/phase23/fixture.html
node research/phase27/headless.test.cjs research/phase23/fixture.html
```

Local results, 2026-11-22:

| Check | Result |
| --- | --- |
| 39 unit tests | pass |
| Phase 26 runtime harness on v23 | pass |
| Phase 27 runtime checks | pass; original MIDI parses to 2,550 notes, 216.7 s |
| Phase 23 Chromium suite on the v23 fixture | pass |
| Phase 27 Chromium, private v23 and fixture | pass; real clicks, Escape, history back, music scheduling, no page errors |

The phase 26 harness only gained `document.addEventListener` and `history.pushState` stubs in its mock.
