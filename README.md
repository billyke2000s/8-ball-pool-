# 8 Ball Pool

An original, touch-friendly pool game reconstructed from technical analysis of the supplied **Billiard.apk**, with an HTML5 Canvas frontend, local Bluetooth play through an Android wrapper, and internet multiplayer through a lightweight WebSocket relay.

> Status: working source implementation; Android build, Bluetooth device pairing and online deployments still require device / server testing. No APK or hosted relay is claimed here.

## Play
- Open `docs/index.html` in a modern desktop or mobile browser for local two-player play.
- Switch between **8-ball (solids/stripes)** and **Blackball (red/yellow)**; aim by dragging on the table and set power using the slider, then release or tap **Shoot**.
- With a configured WebSocket server, create a room on one device and join with the same code on a second device.
- For Bluetooth, build/install `android/` on both Android phones. Pair devices in Android settings first, then choose **Host Bluetooth** on one and **Join Bluetooth** on the other. Bluetooth is *nearby*, not internet access.

## Internet relay
```bash
cd server
npm install
npm start
```
The relay listens on port 8080 by default (`PORT` can override). Use `ws://HOST:8080` on local networks, or configure TLS reverse proxy and `wss://YOUR-DOMAIN` for internet play / HTTPS GitHub Pages. A public relay is **not** bundled or deployed. Two clients use the same room code. No account system is included.

## Android project
Open `android/` in Android Studio (JDK 17) and build the app. Android's WebView runs the same frontend from `docs/`. The native bridge uses paired Bluetooth Classic RFCOMM sockets and requests BLUETOOTH_CONNECT permission where required. Both devices must run the Android version for Bluetooth mode. Web Bluetooth in a normal browser cannot act as an arbitrary phone-to-phone RFCOMM listener.

## APK reverse-engineering notes
Examined the user-supplied APK locally, not an online source repository:
- A single `classes.dex` (1,329,668 bytes), no embedded `lib/*.so` engine.
- Game entry is `com.andregal.android.poolbilliard.GameActivity`, and custom `Lwh;` is an `android.view.View` with `onDraw`, `onTouchEvent`, `setMode`, `setDifficulty`, player colour / ball count / black-ball queries.
- APK resources include numbered 0–15 ball art, alternate red/yellow/black ball art, rails/pockets/cue, aiming controls, and sound effects; confirms standard numbered pool and blackball-style visuals.
- Gameplay implementation is heavily name-obfuscated. The independent rewrite includes ball dynamics, collisions, cushions, pockets, turns, fouls and a responsive control system. It is **not a byte-for-byte port**, and does not claim identical physical constants or rule variations.

The publicly committed code and artwork are independently written/generated and **do not include** the proprietary APK, decompiled game code, or extracted artwork/audio.

## Limitations and testing
- The local HTML game has been designed for modern browsers. Test on target devices before publishing an APK.
- Internet multiplayer depends on a running relay and reliable connectivity; the sample relay has no accounts, matchmaking, persistent rooms, anti-cheat or TURN infrastructure.
- Bluetooth is paired-device multiplayer in the native Android wrapper only, not a way to reach remote devices over the internet.
- This is an initial implementation, not a claim of exact physics fidelity to the original binary.

## Repository
`docs/` browser game and GitHub Pages source; `server/` multiplayer relay; `android/` Android WebView + Bluetooth Classic wrapper.
