# p2 — Object responses (fixation + choice)

**Goal:** study how the fly responds to a **vertical bar/object** — both when it
can **steer the object itself** (closed-loop fixation) and when it must **choose
between two objects** (A/B choice) — with and without optogenetic activation.

**Files:** `p2_object_tonic_short.yaml` / `p2_object_tonic_full.yaml` and
`p2_object_burst_short.yaml` / `p2_object_burst_full.yaml`. Fly-on-ball rig.
**Requires [FicTrac](../fictrac.md)** — this protocol uses **closed-loop**
control. Everyone should run a P2 version; the instructor will assign tonic,
burst, or both.

## Two optogenetic variants

Same visual design; they differ only in *how* the LED is delivered:

- **`burst`** — a **0.5 s LED pulse before each trial** (while the first frame
  is held), then LED off for the trial. Default LED level: **35%**.
- **`tonic`** — the LED is turned **on once and held** through the whole
  optogenetic phase. Default LED level: **15%**.

Pick the one your instructor specifies.

## Structure (in order)

1. **Start:** a gray background (3 s).
2. **No-opto, closed-loop stripe:** a dark vertical stripe is placed in front of
   the fly and **FicTrac-controlled** — the fly's turning moves the stripe, so
   it can "fixate" it. 3 × 20 s.
3. **No-opto sweeps (open-loop):** the bar sweeps ±90° across the front (CW
   starts at −90°, CCW at +90°, both pass through front midway), at 3 speeds
   (36 / 72 / 144 °/s), LED off.
4. **Opto sweeps:** the same sweep set, now with optogenetic light (burst or
   tonic).
5. **Opto closed-loop stripe:** the front-stripe fixation again, with light.
6. **Opto A/B choice (closed-loop):** two objects presented; the fly steers
   between them. 6 combinations, each repeated, ~15 s per trial. Each combo has
   B-left and B-right versions to balance side bias.

## What to watch

- **Fixation:** does the fly hold the stripe in front (keep it centered) when it
  controls it in closed loop?
- **Sweeps:** does it track/turn with the moving bar, and does light change that?
- **Choice:** does the fly prefer object A or B? Does optogenetic activation
  shift the preference? (Frame it neutrally — don't assume which object is
  "better"; let the data tell you.)

## Timing

| Version | Approximate runtime |
| --- | ---: |
| `p2_object_tonic_short` | 4.3 min |
| `p2_object_tonic_full` | 9.8 min |
| `p2_object_burst_short` | 4.5 min |
| `p2_object_burst_full` | 10.2 min |

Full runs contain ~1 min no-opto fixation, ~0.9 min no-opto sweeps, ~0.9 min
opto sweeps, ~1 min opto fixation, and ~6 min A/B choice, plus the per-trial LED
bursts in the burst version.

## Before you run

- **FicTrac must be connected** (bridge running) or the closed-loop blocks won't
  work — confirm the oscilloscope shows live motion first.
- Frame 0 of the bar is centered on the **calibrated front column** established
  in p1 — make sure the front calibration is current for this rig.
- Run the short version first. If the same fly then completes the full version,
  both can be pooled in analysis.

> ✍️ **Instructor to confirm:** the front-column calibration procedure and which
> genotypes run P2 tonic, P2 burst, or both.

---
*Last updated 2026-07-09. Source: `protocols/shared/p2_object_*.yaml`.*
