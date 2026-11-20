# Original APK reverse-engineering baseline (native path)

**This is the actual supplied `Billiard.apk`, not the unrelated browser pool game.** The browser game on `main` is **not** a 1:1 reproduction. Do not ship it as one.

Original APK SHA-256: `d91843d6675d0787e65c4b089edca7e159c10694eb49692380dd4a5acea69f26`
Original size: 2,632,515 bytes.

## Confirmed from its compiled DEX

| Component | Evidence |
| --- | --- |
| Main activity | `Lcom/andregal/android/poolbilliard/GameActivity;` |
| Native rendering and touch view | `Lwh;` extends `android.view.View` |
| Touch entry | `Lwh;->onTouchEvent(MotionEvent)Z`, 12 Dalvik code units, dispatches to `Lwh;->n(MotionEvent)V` |
| Touch handler | `Lwh;->n(MotionEvent)V`, **1,953 code units**, calls `MotionEvent.getX`, `getY`, `getAction` |
| Draw handler | `Lwh;->onDraw(Canvas)V`, 415 code units |
| Additional large game routines | `Lwh;->l()`, 1,533 code units; `Lwh;->s()`, 834 code units (exact responsibilities **not yet established**) |

The archive includes the original bitmaps `ball00`–`ball15`, `ball_red`, `ball_yellow`, `ball_black`, `ball_white`, `table_field_blue.jpg`, `rail1.jpg`, `rail2.jpg`, `rail4.jpg`, `rail_wood.jpg`, `pocket_corner.png`, `pocket_middle.png` and `cue.png`. Original audio includes `cue_strike.mp3`, `balls_collide.mp3`, `ball_in_pocket.wav` and `applause.wav`.

## Engineering requirement

**Preserve** the original compiled game implementation and resources as the base. Trace obfuscated game-state transitions, legal turn changes, input dispatch, and rendering before adding a Bluetooth transport. For remote internet play, use a separate online transport; Bluetooth alone is nearby-only.

Do **not** substitute handwritten Canvas rendering or newly simulated pool physics and call it a port. Retain the original input scheme, graphics, rack, audio, rules, and physics. Add networking by integrating with real control/turn/state hooks.

## Current status

- Direct APK extraction and DEX class/method map: **completed**.
- Exact implementation of opaque method bodies, native multiplayer integration, signed modified APK, and physical device testing: **not completed**.
- The user-provided proprietary APK and assets have **not** been uploaded to this public branch.
