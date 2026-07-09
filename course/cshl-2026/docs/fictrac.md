# FicTrac basics & configuration

**FicTrac** watches the air-supported ball with a camera and turns its rotation
into the fly's locomotion — **turning**, **forward** walking, and **sideways**
motion. That signal drives the live oscilloscope in Arena Studio and powers
**closed-loop** experiments, where the fly's own turning steers the visual scene.

*Background: [Loesche & Reiser 2021](https://doi.org/10.3389/fnbeh.2021.689573)*
*describes the low-cost fly-on-ball setup this rig is based on.*

## The mental model

- The camera sees a patterned ball. FicTrac builds a **map** of the ball's
  surface, then each frame figures out how the ball rotated since the last frame.
- Rotation → the fly's movement (because a walking tethered fly spins the ball
  underneath it).
- A small **bridge** program passes that movement to Arena Studio.

## Coordinate convention (important)

FicTrac's axes are set relative to the lab frame during calibration:

- **X** points at the ball center (toward the camera / down the optical axis),
- **Y** points to the **right**,
- **Z** points **below**.

Get this right in calibration or the turning/forward signals will be swapped or
flipped.

## Per-rig config: one folder per rig, never overwrite

FicTrac is **very** sensitive to the camera's field of view and the ball's
position, so **each rig has its own tuned config file** — you can't share one
config across rigs.

**The rule: never overwrite an existing config. Make a new folder instead.**

1. Create a **new folder** for this rig (or this config change).
2. Drag the config file into it.
3. Open PowerShell **in that folder** and run FicTrac from there.
4. Data writes into that folder, per trial.

Keeping one folder per config means you never lose a working setup. A shared
"starter" config is a good starting point but will **not** work as-is on every
rig — you must tune it per rig.

> 📎 The current working config is shared on the course Slack — start from that.

## Calibrating with `configGUI`

Run the config GUI (`configGUI.bat`) and work through its steps:

1. **Define the ball circle** — click points around the ball's perimeter to
   outline it. Right-click removes a point.
2. **Set ignore regions** — mask out things that aren't the ball (the pedestal,
   the fly). Then set the corner arrangement (e.g. top-left, top-right,
   bottom-right) — which corners depends on the camera position.
3. **Coordinate transform** — set the axes to the lab frame (X center, Y right,
   Z below), using corner points ~10 px apart (an approximately orthographic
   assumption). The square/plane step mostly affects output columns we don't use
   for ball tracking — **what matters is that X, Y, Z come out correct.**

## The ball map & staying tracked

- On the first run FicTrac **learns a texture map** of the ball. Watch it "close
  on itself" cleanly — a good map wraps the whole ball without seams/confusion.
- Once you have a good map, you can **turn off map re-learning** so it stays
  stable, and instead watch the **reprojection error** — a spike there means the
  map has gone stale.
- The ball pattern needs **distinctive, asymmetric features**. Similar-looking
  blobs confuse tracking; if that happens, add asymmetry (e.g. a hand-drawn
  L-shape or a lopsided star with a Sharpie).

> Long-term the lab wants engineered, identical balls so one map works
> everywhere — for now, per-rig maps are normal.

## Connecting FicTrac to Arena Studio (the bridge)

Closed-loop and the live scope need the **bridge** running on the rig computer:

- Start it with **`pixi run bridge`** (from the webDisplayTools checkout).
- Arena Studio connects to it at **`ws://localhost:8765`**; FicTrac talks to the
  bridge on port **60000** (these are the rig-config defaults).
- In Arena Studio, the oscilloscope switches from *"waiting for FicTrac
  bridge"* to a live trace once data flows. Closed-loop trials show a green
  **CLOSED LOOP** tag.

**Quick check:** load [`fictrac_direction_test`](protocols/README.md) — it runs
open-loop motion first, then a closed-loop block that the fly steers. If the
closed-loop block responds to nudging the ball, the bridge is working.

> ✍️ **Instructor to confirm:** exact camera model / lens, the Windows path to
> `configGUI.bat`, and any per-rig gain/offset defaults.

## Common problems

| Symptom | Likely cause / fix |
| --- | --- |
| Scope stuck on "waiting for FicTrac bridge" | Bridge not running, or FicTrac not started. Start `pixi run bridge` and FicTrac. |
| Turning and forward look swapped/flipped | Coordinate transform wrong — redo the X-center / Y-right / Z-below step. |
| Tracking jumps or drifts | Stale/!confused map — re-learn the map, or add asymmetric marks to the ball. |
| Ball jittery or stuck | Air flow too high/low — adjust the roller clamp for a gentle, stable float. |

---
*Last updated 2026-07-09.*
