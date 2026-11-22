# Phase 26 — Whole-app gap inventory and missing UI/settings

The user correctly identified that previous physics/AI progress did not cover the original app surface. `PARITY_AUDIT.md` now inventories recovered screen layouts, every setting exposed in the preference layouts and major gameplay/platform systems, with Partial/Missing/Needs trace status. None is declared verified 1:1.

## Actual v22 additions

- Records dialog: native `dlg_records.xml` difficulty/played/won columns, connected to the corrected persisted CPU history. No invented game results or record values.
- Match-result dialog: recovered `dlg_game_won.xml` concept with the result and currently available time/shot/solo score or Pyramid score counters. It appears once per completed match; dismissal does not reopen it; restarting cancels a pending result. Its browser 350 ms delay and statistics selection are explicitly approximate.
- First-turn preference: `first_move_array` and `wh.s` branches for Human, Computer and Random. The random branch alternates after its initial choice, as in native `wh.P/Q`. The native first-install `App.b` exception is not reproduced. The computer-start option schedules the actual CPU stroke.
- Power-bar placement: native `loc_array` Left/Right preference, persistent browser option, moved power-control drawing, corresponding pointer region, and precision wheel on the opposite side. Existing ratio and source-derived colour bands remain intact.
- Full-screen control: browser Fullscreen API adapter for the recovered fullscreen option, with a visible unavailable message when the browser refuses it. This is not Android system-bar parity.
- Removed the long engineering-status paragraph from the gameplay menu; kept engineering status in the audit. Updated the stale v16 page title to v22.

## Validation

The expanded actual-script Node harness covers populated Records, input blocking while a modal is open, first-turn assignment/alternation, right-hand strength input, result content/dismissal, duplicate suppression and restart cancellation, alongside all prior game/AI regressions.

Headless Chromium additionally exercises Records through actual menu clicks, selecting Computer first, shooting through the right-hand strength bar, and the displayed result/OK flow. The previous 39 pure tests, three standard breaks, 48 mode/speed/power combinations, nine CPU scenarios and viewport/error checks remain in the workflow.

Public headless fixtures use 43 generated dimension-matched SVG placeholders and omit original audio. Private HTML retains its asset package; gameplay script SHA-256 is identical in both: `4235f05b4fd572488e1e3f1b6d190ef636dc53f272536348e79d274b3c3df151`.

Reproduce:

```sh
python3 research/phase26/apply_to_v21.py v21.html v22.html
node research/phase26/runtime.test.cjs v22.html
python3 research/phase23/make_fixture.py v22.html research/phase23/fixture.html
node research/phase23/headless.test.cjs research/phase23/fixture.html
```

Remaining app conversion is detailed in `PARITY_AUDIT.md`: dedicated original chooser/rule/more-settings screens, numbered removal picker, quit/resume flow, landscape, music, spin, native flags/geometry, AI simulation/safety and reference replays are not finished. Browser screens are functional translations, not a pixel-perfect Android UI port.

## Confirmed final result

Headless run https://github.com/billyke2000s/8-ball-pool-/actions/runs/44979106347 passed at commit `c5969f0ef6e938b53394bf1f95cd1f593f3d691a`: all 39 pure tests, expanded actual-script runtime checks and the real Chromium suite, including the new screen/settings flows, passed. No original-art/audio equivalence is claimed.

Private v22 HTML: 1,176,761 bytes; SHA-256 `5db909305924e2046c92f2e3bd2a05624a935ee62c861bdfaacc9861d0d93245`.
