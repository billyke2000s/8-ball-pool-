# Original Billiard app → HTML parity audit (updated for v24)

This inventory replaces the earlier emphasis on isolated physics tests with the app surface and systems still requiring conversion. **Since v24 the ball physics (contacts, cushions, jaws, pockets, racks, strike velocity) is verified bit-exact against the original bytecode (phase 28). Everything not marked Verified is still unverified.** A passing browser test establishes the described browser behaviour only. Source material is the user's v20 recovered Java/Smali/resources; original APK SHA-256 `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`.

Status meanings: **Partial** = usable translation with known differences; **Missing** = identified original capability not implemented; **Needs trace** = original code identified, exact behaviour not yet established. Browser-only networking, keyboard controls and accessibility labels are extensions, not original app parity.

## Screens and navigation

| Original surface / evidence | HTML v22 status | Remaining work |
|---|---|---|
| Game-mode chooser: `dlg_choose_game_type.xml` (Single / PvC / PvP), `zb.d/c`, `lb` 0–2, 6–8 | Partial: v23 shows Select Game Type on launch (vh.UNKNOWN), PvC → Select Difficulty, back from difficulty → game type | Native dialog styling/dimensions; menu selector retained as a browser extension |
| Main game view: `main.xml`, `wh.onDraw` | Partial: fitted portrait Canvas table | Native layout, player strips, landscape composition and geometry |
| Preferences: `pref_dialog.xml`, `zb` | Partial: rules, difficulty, speed, sound, aiming, pockets, power-bar side, first turn | Original presentation, music, navigation visibility, conditional setting visibility |
| Rule adjustment: `dlg_adjust_rules.xml` | Partial: Pool and Pyramid options functional in menu | Dedicated native dialog and exact conditional layout |
| Records: `dlg_records.xml` | Partial: v22 adds Easy/Normal/Hard played/won table from persisted history | Native typography/layout and Android SharedPreferences data migration |
| Match result: `dlg_game_won.xml`, `wh.l`, `oh` | Partial: result dialog with result/time/shots/solo score; v23 OK and back restart the game (`xb(1)` → `y()`) | Exact timing, native field conditions, complete player statistics, high-score presentation, rate-game variant |
| More settings: `dlg_more_settings.xml` | Partial: aiming lines, browser full-screen action | Horizontal-screen mode, native fullscreen/navigation behaviour, dedicated screen |
| Aim-or-choose-ball: `dlg_aim_or_choose_ball.xml`, `wh.n` | Partial: correct selection/aim branches | Original image buttons, positioning and touch dispatch |
| Combo removal picker: `number_picker.xml`, `q6`, `wh.u/r` | Partial: table tap selection and delayed guide | Original numbered chooser overlay and all picker interactions |
| Quit-game confirmation: `dlg_quit_game.xml`, `nn`, `GameActivity.w/z` | Partial: v23 Yes / No / Restart; Escape and browser back act as Android back (quit dialog → Yes, difficulty → game type, result → restart, game type → leave page); network game disconnects on Yes | Native styling; ad/interstitial side effects deliberately omitted |
| Privacy/advertising/store/rating dialogs | Android service surfaces, outside gameplay port | Do not reproduce nonfunctional Android buttons or pretend service integration exists |

## Every preference exposed by the recovered preference layouts

| Preference | HTML v22 | Evidence / limitation |
|---|---|---|
| Aiming wheel | Partial | `pref_dialog`, `wh.n`, `b3`; derivative translated, fitted geometry |
| Tap to aim | Partial | Tap/choice branches translated; native motion/density not replay matched |
| Tap to shoot | Partial | Vertical power-control scope and ratio translated |
| Sounds | Partial | Embedded original cue/collision/pocket/applause playback; mixing/timing differs |
| Music | Partial | v23 plays original `entertainer.mid` notes/tempo, looping, default off, volume 35/100, resumes position only after < 5 s interruption (`km`, `v3`). Timbre is a Web Audio piano voice, not Android's MIDI synth; browsers need a first tap before audio starts |
| Pocket size | **Physics verified (v24)** | Small = −18 (`t40.Q`, this app version), Normal 20, Large 30. Cushions, jaws, rack and pocket capture are exported from the original `mt`/`ei` code for each size, and the engine is bit-exact against the original (phase 28). Artwork is sized from that geometry but not yet render-verified |
| Power-bar location | Partial | v22 Left/Right setting moves strength bar, wheel and hit regions; original dimensions still fitted |
| First turn | Partial | v22 Human/Computer/Random-then-alternate; source first-install exception (`App.b`) not reproduced |
| Game rules | Partial | Free Pyramid / Combo Pyramid / Pool; outstanding flags below |
| Choose suit on break | Partial | Pocket-time suit callback translated; native flags still incomplete |
| Reset black on break | Partial | Source-guided respot search; exact Android geometry differs |
| Lose on scratch while on black | Partial | Event-time suit-clearance handling; complete native flags need replay |
| Pyramid foul penalty | Partial | Both penalty modes and contact-gated points translated |
| Navigation bar visibility | Missing | Android system-bar setting; browser adapter not provided |
| Game speed | **Physics verified (v24)** | Default 1. Speed applies only in 1 Player; other modes use min(speed, 1) (`t40.y`). One engine pass per drawn frame with the original frame-time step (phase 28) |
| Aiming lines | Partial | Browser line drawing and on/off option; all native line variants not recovered |
| Horizontal orientation | Missing | Fixed portrait world/layout; merely rotating CSS would not reproduce native landscape geometry |
| Fullscreen | Partial | v22 uses browser Fullscreen API; availability follows browser restrictions |

## Game systems

| System | Status in v22 | Specific gap |
|---|---|---|
| Pool / Free / Combo racks and ball identity | **Verified (v24)** | Original `wh.s` order and `mt.m0` positions per rule set and pocket size, `x00.d` list order, Pool colour mirroring (`d1 % 3`, `n_games_won`). The win counter uses a browser storage key |
| Cue animation / power mapping | Partial | Strike velocity (`ia.a`: power^1.12 · 2^(speed−1) · 400 · W, ×1.2 full-screen break) and the human break wobble are now original. The pull-back tick timing and cue drawing are still v23's |
| Ball-to-ball contact | **Verified bit-exact (v24)** | `k7.b/r/e/a` incl. the break spread; 1000/1000 random shots identical to the original bytecode (phase 28) |
| Cushions, lips and jaws | **Verified bit-exact (v24)** | The original's 24 `ex` segments and 12 `ea` jaw points per table; `l30.m` contact search machine-translated incl. its retry loop (phase 28) |
| Pocket capture / fall / fade | **Capture verified (v24)**; animation translated | Capture radii per size/difficulty/speed, legal-ball wider radius (`k7.k`, `ei`) bit-exact. Slide path and fade (`k7.q` path, `k7.h` drawing) are translated, but drawing is not render-verified |
| Side spin / english | **Not in the original** | `k7` has no spin state; `k7.u` only sets velocity from speed and angle. The bit-exact engine has no spin and matches the original, so nothing is missing |
| Free striker choice | Partial | Human and CPU candidate striker rebinding translated; gesture geometry differs |
| Combo selection/removal | Partial | Contact-qualified scoring, native ranking and delay; number-picker UI missing |
| Pool suit/black/scratch order | Partial | Event-time order translated; native player flags and PvC foul-placement exceptions remain |
| Turns / fouls / penalties | Partial | Corrected contact/no-contact logic; complete `ho`/`wh.W` state machine not yet translated |
| Ball-in-hand | Partial | Browser placement; native drag offsets, head-area restriction and mode-specific eligibility differ |
| AI direct/alternate candidates and ranking | Partial | `jo/lr` translated with mapped geometry; complete native candidate simulation absent |
| AI safety / penalty placement / bank planning | Missing / partial fallback | `x2.c`/`fm` large planning path remains a simple browser fallback |
| AI execution error and opening-break variation | Partial | The human break wobble (`ia.a`) is ported (v24). The AI's own execution error and refinement are still missing |
| Adaptive AI / records | Partial | History direction/migration/score context translated; native bookkeeping not fully replay verified |
| Solo victory scoring / highscores | Partial | Formula translated; app-clock lifecycle and exact high-score screen conditions differ |
| Game-result timing / complete statistics | Partial | v22 result screen uses a 350 ms browser delay and available counters; exact native conditional delay not reproduced |
| Android lifecycle / pause / resume / interruption | Needs trace / missing adapter | No native app-versus-browser lifecycle comparison; no pause-parity claim |
| Game-state persistence / restart lifecycle | Needs trace | Options/history stored; complete in-progress native restoration not established |
| Original graphics | Partial | Embedded asset subset; composition, buttons, orientation and dimensions not matched |
| Original audio/music | Partial | Four sound effects plus v23 MIDI music; synthesiser timbre and full Android audio focus behaviour differ |
| Native-versus-browser deterministic replay | Missing | Original Android app has not run side by side in this environment |

## Conversion order

1. Fill missing app screens/settings and verify the browser flows (v22–v23; still open: dedicated rules / more-settings dialogs, numbered removal picker, navigation-bar and horizontal settings).
2. Translate native touch/placement restrictions and the remaining turn/foul/player flags.
3. Finish AI simulation, safety planning and execution error.
4. Replace fitted geometry/rendering with native screen/orientation calculations; port spin and music.
5. Run original Android reference replays and compare state, event order, images, audio and lifecycle.

Do not use test counts as a completion percentage. Headless fixtures use placeholder images with the same dimensions, so their screenshots cannot verify original art. Public reports/code exclude the original APK and extracted binary assets; private playable HTML retains the embedded assets.
