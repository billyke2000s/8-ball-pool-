# Real headless Chromium verification

Workflow: `.github/workflows/html-port-headless.yml`, on the native reverse-engineering branch. The workflow executes browser checks automatically when its test fixture, test script or workflow changes. It tests the existing code; it does not run an AI conversion worker.

Pinned Node 22, Playwright 1.58.2 and Ubuntu 24.04. The initial Ubuntu-latest run failed during Playwright installation because the runner had moved to Ubuntu 26.04. Pinning Ubuntu 24.04 resolved that setup problem.

Verified passing expanded run: https://github.com/billyke2000s/8-ball-pool-/actions/runs/44976739605 , commit `acebbd58f3a749c954fa51f82f73ac73b7493bd1`.

- 32 pure selection/power/contact-rule tests.
- Actual-script runtime regressions.
- Real Chromium pointer input, removal delay/cancellation, Free striker switching, both dialog actions, power-bar shooting and felt-tap rejection.
- 48 rule-set/speed/power combinations, plus three standard breaks; all settled with finite state.
- Three viewport sizes and no page errors.

`fixture.html` is a test fixture, not a playable fidelity release. All original images are replaced by dimension-matched solid SVGs and audio is omitted. `make_fixture.py` reproduces it from a private standalone HTML (requires Pillow). The private v20 and fixture gameplay script is byte-identical; see its hash below. This proves which logic was tested, not visual/audio equivalence.

To reproduce:

```sh
python3 research/phase23/make_fixture.py /path/to/v20.html research/phase23/fixture.html
npm install --no-save playwright@1.58.2
npx playwright install --with-deps chromium
node research/phase23/headless.test.cjs research/phase23/fixture.html
```

No claim of full 1:1 Android parity is made. Original AI, platform lifecycle, exact geometry and native-versus-browser replay equivalence remain incomplete.

Gameplay-script SHA-256: `fa91e52ef5ca82696e1c60841bc26546ff6a3dd75f3e1b202c89a01cb9736085`.
