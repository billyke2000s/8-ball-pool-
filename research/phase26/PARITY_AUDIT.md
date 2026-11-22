# Original Billiard app → HTML parity audit (updated for v23)

This inventory replaces the earlier emphasis on isolated physics tests with the app surface and systems still requiring conversion. **No category is certified 1:1.** A passing browser test establishes the described browser behaviour only. Source material is the user's v20 recovered Java/Smali/resources; original APK SHA-256 `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`.

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
| Pocket size | Partial | 10/20/30 selectable; native table geometry changes approximated |
| Power-bar location | Partial | v22 Left/Right setting moves strength bar, wheel and hit regions; original dimensions still fitted |
| First turn | Partial | v22 Human/Computer/Random-then-alternate; source first-install exception (`App.b`) not reproduced |
| Game rules | Partial | Free Pyramid / Combo Pyramid / Pool; outstanding flags below |
| Choose suit on break | Partial | Pocket-time suit callback translated; native flags still incomplete |
| Reset black on break | Partial | Source-guided respot search; exact Android geometry differs |
| Lose on scratch while on black | Partial | Event-time suit-clearance handling; complete native flags need replay |
| Pyramid foul penalty | Partial | Both penalty modes and contact-gated points translated |
| Navigation bar visibility | Missing | Android system-bar setting; browser adapter not provided |
| Game speed | Partial | Source velocity/damping expressions, different frame scheduler |
| Aiming lines | Partial | Browser line drawing and on/off option; all native line variants not recovered |
| Horizontal orientation | Missing | Fixed portrait world/layout; merely rotating CSS would not reproduce native landscape geometry |
| Fullscreen | Partial | v22 uses browser Fullscreen API; availability follows browser restrictions |

## Game systems

| System | Status in v22 | Specific gap |
|---|---|---|
| Pool / Free / Combo racks and ball identity | Partial | Native screen-dependent rack/ball sizing, startup flags |
| Cue animation / power mapping | Partial | Tick sequence translated; native scheduling and cue rendering differ |
| Ball-to-ball contact | Partial | Source normal transfer and sequential update mapped; reference-link semantics simplified |
| Cushions, lips and jaws | Partial | Source topology with fitted coordinates; exact native geometry missing |
| Pocket capture / fall / fade | Partial | Source formulas mapped; original event/render clock not identical |
| Side spin / english | Missing | Original `k7.u`, `ha`/control paths not fully traced or exposed |
| Free striker choice | Partial | Human and CPU candidate striker rebinding translated; gesture geometry differs |
| Combo selection/removal | Partial | Contact-qualified scoring, native ranking and delay; number-picker UI missing |
| Pool suit/black/scratch order | Partial | Event-time order translated; native player flags and PvC foul-placement exceptions remain |
| Turns / fouls / penalties | Partial | Corrected contact/no-contact logic; complete `ho`/`wh.W` state machine not yet translated |
| Ball-in-hand | Partial | Browser placement; native drag offsets, head-area restriction and mode-specific eligibility differ |
| AI direct/alternate candidates and ranking | Partial | `jo/lr` translated with mapped geometry; complete native candidate simulation absent |
| AI safety / penalty placement / bank planning | Missing / partial fallback | `x2.c`/`fm` large planning path remains a simple browser fallback |
| AI execution error and opening-break variation | Missing | Native simulated refinement and variation not reproduced |
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
