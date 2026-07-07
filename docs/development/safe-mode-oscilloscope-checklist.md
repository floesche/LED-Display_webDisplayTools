# Safe mode + Live oscilloscope — review & bench checklist

Work-through checklist for the two features (+ two follow-ups) built this session.
Delete this file once merged — it's a working handoff doc, not a permanent reference.

**Where it lives:** branch `claude/distracted-bardeen-51d651`, 3 commits on top of `main`
(`408ce10`), **not pushed** (your E2E-before-main workflow):

- `b524cef` — safe mode (v0.14)
- `8608e4f` — live oscilloscope (v0.15)
- `a41972e` — full-width scope + behavior_v1 logging default + plugin field (v0.16)

---

## 0. Decision for you (non-blocking — a sensible default is in place)

- [ ] **Log-level authority.** The web runner currently *asserts* `behavior_v1` to the bridge
  at run start, so it wins even if the bridge was launched with `--log-frames`. Keep this
  (recommended — guarantees compact course logs), **or** switch to "CLI flag wins" (one-line
  change: drop the `bridge.setLogLevel(logLevel)` call at run start). Tell me if you want the
  latter.

## 1. Automated (should already be green)

- [ ] `pixi run test` → all suites pass (includes new `test-kinematics.js` 39/39,
  `test-fictrac-bridge-client.js` 42/42, `test-studio-url-state.js` 109/109).
- [ ] `pixi run format-check` → clean **except** a pre-existing `tests/test-protocol-roundtrip-v3.js`
  warning that is **not** from this work (it was nonconformant on `main`). Leave it.

## 2. Safe mode — browser only, no hardware

Load `arena_studio.html` (a plain load). Toggle localStorage between checks with the
browser console: `localStorage.removeItem('studio_advanced_unlocked')` resets to safe.

- [ ] Plain load shows a **🛡 Safe mode** chip; mode is locked to **▶ Run**.
- [ ] **✎ Edit** and **⛭ Console** tabs are dimmed with a 🔒; the session-rig selector has no
  unlock padlock; **File ▾** shows Open items but no GitHub settings block / Save / Promote.
- [ ] **Open a protocol** from each source (local file / Library / Repo) → it loads **read-only
  in Run** (does not jump to Edit). ▶ Test and ▶ Run behave normally.
- [ ] Click the 🛡 chip (or a locked Edit/Console tab) → password prompt. Wrong password →
  stays safe with a banner. Correct password (**`reiser`**) → Edit/Console/rig/GitHub unlock;
  chip becomes **🔓 Advanced · lock**.
- [ ] Reload → still advanced (remembered), and the URL is clean (no `?advanced=1`).
- [ ] Load `arena_studio.html?advanced=1` on a *fresh* browser (clear the localStorage key
  first) → it prompts; on success the URL keeps `advanced=1`.
- [ ] Click **🔓 Advanced · lock** → returns to safe mode and forces the view to Run.
- [ ] **Run-lock (all modes):** during an active run, the Edit/Console tabs are disabled — you
  must STOP before switching views. (Test with a Test run, or a real/sim run in §4.)
- [ ] **Per-bench password:** in advanced mode set `localStorage['studio_advanced_pw'] = 'yourpw'`,
  lock, then unlock with the new password (the built-in `reiser` still works as a fallback only
  if the custom one is unset).

## 3. Oscilloscope — browser with the simulator (no arena needed)

Terminal 1: `pixi run bridge`  · Terminal 2: `pixi run sim`  (start the bridge first).
In Arena Studio → Console → FicTrac, **Connect** the bridge (ws://localhost:8765).

- [ ] Run-view dock shows a **Log | Scope | —** switch; pick **Scope**.
- [ ] The scope spans the **full width** of the Run view (edge to edge, matching the
  AUTO-CAPTURED / metadata column's right edge) — not just the sequence column.
- [ ] Three rows populate live: **turning** (°/s), **forward** (mm/s), **heading** (°), newest
  data at the right edge; status line shows the FicTrac rate + sample count + ball ⌀.
- [ ] Controls work: **win** (smoothing window), **span** (10 s / 30 s / 1 min / 5 min),
  **ball ⌀** (mm), **auto-Y**, **clear**.
- [ ] Drag the dock's top handle to resize; **—** collapses it; the choice is remembered.
- [ ] Run a protocol with ≥2 conditions and a `trialParams` + an LED command
  (`ledDrive`/`setAnalogOut`): condition **boundaries** (dashed lines + labels), the **visual**
  interval (green band) and the **LED** interval (red band under the traces) all line up with
  the traces on the shared time axis.
- [ ] In **safe mode**, the scope is visible and works (read-only) — students can watch.

## 4. Logging — inspect the bridge JSONL

The bridge writes `arena-log-*.jsonl` in its CWD (or `--log-dir`).

- [ ] A default run's log starts with `{"type":"frame_schema","level":"behavior_v1",
  "cols":["ms","fc","idx","ft","x","y","hd"]}` then positional arrays `[ms,fc,idx,ft,x,y,hd]`
  (compact separators, `ft` relative from 0).
- [ ] Full-mode override (v0.17): in **advanced mode**, File ▾ → **Run logging** → pick
  **full 25-column**. Reload/run → that run logs `{"type":"fictrac_frame", ..., "fictrac":[…25…]}`
  instead of the compact array. It's a runtime setting (remembered on the browser), asserted at
  run start so it overrides the Console `log` toggle.
- [ ] Safe mode hides it: as a student (safe mode), File ▾ shows no Run-logging control — the
  stored level still applies, so students always get the compact default.
- [ ] Console `log` toggle still works for ad-hoc (no-protocol) capture, and shows the level
  read-only next to it.
- [ ] (Optional, tests the assertion) launch `pixi run bridge -- --log-frames` and run a
  default protocol → the log is **still behavior_v1** (the runner overrides the flag). See §0.

## 5. Bench — real arena + real FicTrac (the confirmable items)

- [ ] **Turning sign:** confirm CW turning reads **positive** on the scope. If inverted, it's a
  one-place flip (`turningSign:-1` in `js/kinematics.js`) — ping me and I'll wire it as a rig/
  scope setting rather than a constant.
- [ ] **`ft` (FicTrac col 22) is populated** on the course FicTrac build (the scope + dashboard
  difference it for velocity). If it's zeros/unpopulated, the scope falls back to the bridge
  `ms` clock — tell me and I'll confirm the fallback path on real data.
- [ ] **Forward mm/s sanity:** the fly-on-ball rig declares `ball_diameter_mm: 9`
  (`configs/rigs/cshl_g6_2x10_ball.yaml` + `index.json`). Adjust if your ball differs; the
  scope's **ball ⌀** field overrides per session.
- [ ] **Closed-loop unaffected:** a Mode-3 FicTrac run still drives the arena correctly (the
  scope only *reads* the bridge; the frame-apply path is unchanged).
- [ ] A committed course runlog is behavior_v1 and parses cleanly for the (future) dashboard.

## 6. Docs to skim

- [ ] `docs/development/arena-studio-release-notes.md` — v0.14 / v0.15 / v0.16 entries read right.
- [ ] `docs/development/safe-mode-spec.md` + `oscilloscope-view-spec.md` — "implemented" notes.
- [ ] `docs/development/analysis-dashboard-plan.md` §6 + `fictrac-bridge/README.md` — the
  `behavior_v1` contract, so the analysis-dashboard session inherits it.

## 7. Merge

- [ ] Review the three diffs.
- [ ] Push the branch + open a PR (or merge to `main`). Not done automatically — your call.
