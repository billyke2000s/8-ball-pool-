# 8 Ball Pool v0.1.0 — Android preview

Installable Android **debug-signed preview APK** built from the original 8 Ball Pool project.

## Included
- Touch-controlled eight-ball and red/yellow blackball modes
- Ball/cue/table rendering, basic physics and local two-player turns
- Distinct synthesized cue strike, collision and pocket sounds
- Nearby Bluetooth Classic paired-phone multiplayer
- Internet multiplayer via shared room codes and your own WebSocket relay
- Fullscreen-friendly landscape play and custom app icon

## Before testing
- This is a **preview**, not a tested production build. Test gameplay and Bluetooth on two physical Android devices before advertising multiplayer as stable.
- Internet rooms **need a running relay**. Start the server in `server/`, and set its wss:// address in the game's multiplayer settings. No public relay is hosted by this release.
- Both Android devices need Bluetooth enabled and must be paired beforehand. Bluetooth is for nearby play, internet is WebSocket.
- This APK is signed with GitHub Actions' *temporary debug key*. Future separately built APKs may have a different signing certificate and require uninstalling this preview before reinstalling. Game progress isn't persisted.
- Android 7.0 and newer (minSdk 24), though actual device compatibility is not verified.
- Do not confuse this original reconstruction with the third-party APK analysed during development.

Source and technical reverse-engineering record are in this repository.
