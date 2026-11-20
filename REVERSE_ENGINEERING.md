# Reverse-engineering record — supplied Billiard.apk

This record comes from **direct inspection of the uploaded APK archive and its DEX tables**, not a search for downloadable source code.

## Container and implementation

- APK size: approximately 2.6 MB.
- One Dalvik executable: `classes.dex` (1,329,668 bytes).
- The DEX file contains approximately 1,282 class definitions, 9,905 method identifiers, and 9,299 strings, largely Android and Google library code.
- No `lib/*.so` compiled native physics engine in the APK.
- Non-obfuscated app entry: `com.andregal.android.poolbilliard.GameActivity`.
- The custom Android View `Lwh;` extends `android.view.View`. Its method table includes `onDraw`, `onTouchEvent`, `onSizeChanged`, `getActivePlayerColor`, `getBlack8`, `getNumBalls`, `getDurBeforeEndTurn`, `setMode`, `setDifficulty`.
- Other gameplay-related code and fields are obfuscated to short names. **The original numeric physics constants and exact state machine have not been recovered or verified.** The new physics and rules are an original implementation, not an exact decompilation or claim of one-to-one mechanical fidelity.

## Extracted resource inventory (for inspection only)

The APK includes `res/drawable-nodpi-v4/` images: `ball00.png` through `ball15.png`, `ball_red.png`, `ball_yellow.png`, `ball_black.png`, `ball_white.png`, `ball_shadow.png`, `cue.png`, `table_field.jpg`, `table_field_blue.jpg`, multiple rail textures, six-pocket elements, aiming arrows and turn buttons. Each numbered ball image is 96×96, the original cue image is 1400×64, and `table_field.jpg` is 532×340.

Sounds appear under `res/raw/`: `cue_strike.mp3`, `balls_collide.mp3`, `ball_in_pocket.wav`, `applause.wav` and `entertainer.mid`.

The compiled strings identify settings / rule switches such as `aiming_lines`, `aiming_wheel`, `tap_to_aim`, `game_speed`, `pocket_size`, `game_rules`, `lose_if_scratch_on_black`, `reset_black_on_break`, `penalty_on_foul_ru`, `is_sound_on` and `music_volume`.

The APK has custom layouts named `dlg_choose_game_type`, `dlg_adjust_rules`, `dlg_aim_or_choose_ball`, `dlg_game_won`, `dlg_records`, `dlg_more_settings` and `main`.

## Reconstruction mapping

| Evidence from APK | Current new implementation |
| --- | --- |
| Custom Canvas-like Android view with `onDraw` and `onTouchEvent` | Touch-enabled HTML Canvas renderer in `docs/game.js` |
| Numbered balls and coloured blackball assets | Switchable 8-ball solids/stripes and red/yellow game modes |
| Dedicated cue, table, pocket and rail art | Original procedurally drawn table, cue and balls |
| Separate cue, collision and pocket sounds | Separately synthesised cue, collision, pocket and win sounds |
| Active player, ball count and black-ball methods | Turns, groups, fouls, ball in hand, black-ball victory |
| Local-device game modes | Web local two-player plus new Bluetooth and internet transports |

## Networking extensions

Bluetooth RFCOMM in the Android wrapper and internet WebSocket rooms are **new features**, not recovered features of the APK. The APK was inspected as a behavioural/structural reference, not modified or bundled.

## What remains to reach exact parity

Recover and trace individual obfuscated method bodies for precise collision constants, original aiming-wheel interaction, spin effects, all settings, AI difficulty, game records and complete rule variants; verify on-device against the reference. No extracted proprietary code, images or audio is committed to this repository.
