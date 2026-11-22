# Phase 21 — Resume HTML translation: Combo ball selection

Continues the standalone v17 HTML, rather than the unrelated game on main. The resulting private artifact is `Billiard_Native_Combo_Selection_v18_Single_File.html`. Source-recovery archives v18–v20 use a separate version sequence.

## Reference and change

Inspected v20 recovered `wh.java` against original `wh.smali`, especially `e(FFDZ)`, the Combo-selection branch in `n(MotionEvent)`, `u(k7)` and the draw path. Original APK hash: `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`.

- `wh.e` searches all live eligible balls for the shortest squared distance, excludes the striker unless requested, and uses strict comparisons (ties retain list order).
- Combo touch selection calls that search with `2 * mt.H`, a broad table-sized radius. v17 used the first array entry within `2.3 * BALL_R`, which could choose the wrong neighbour or ignore a tap. The HTML maps mt.H to its felt width; exact Android-to-browser geometry remains unverified.
- `wh.u` captures the nearest pocket before a 1200 ms delay. The port now stores that pocket when selecting, draws the selected-ball-to-pocket guide, and uses the same captured pocket for removal. It clears the guide after removal and carries the pocket index in network snapshots.
- Completed games reject removal commands. Restart retains its existing cancellation of the pending removal timer.
- An empty tap with no eligible candidate is safely ignored; the native decompiled `u(null)` path is not intentionally reproduced as a crash.

## Reproduce

```sh
python3 research/phase21/apply_to_v17.py /path/to/v17.html /path/to/v18.html
node --test research/phase21/selection.test.cjs
node research/phase21/runtime.test.cjs /path/to/v18.html
# Optional, requires Playwright and a runnable Chromium:
CHROMIUM_PATH=/usr/bin/chromium node research/phase21/browser.test.cjs /path/to/v18.html
```

Eight selection unit tests passed. The actual HTML scripts also passed a Node VM runtime harness covering pointer selection, duplicate rejection, guide drawing, delayed pot, cleanup, restart cancellation, finished-game guard and three 70% opening-break simulations (Pool, Free Pyramid, Combo Pyramid), all settled with finite coordinates. DOM, canvas and timers are mocked in that harness.

Chromium rendering tests were attempted but could not run: this execution environment rejected Chromium's socket creation at startup. The browser suite is included for reproduction, **not reported as passing**. JavaScript syntax checks passed for both embedded script blocks. Native-versus-browser replay equivalence, exact line appearance, on-device rendering and networking interoperability remain unverified. This is an incremental port, not completed 1:1 parity.

The asset-bearing HTML stays in the private downloadable artifact. Public changes contain the selection translation, patch generator, tests and this evidence record; no APK or extracted assets are added.
