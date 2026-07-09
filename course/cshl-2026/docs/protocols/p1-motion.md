# p1 — Visual motion (optomotor + looming)

**Goal:** measure how the fly responds to **wide-field motion** (optomotor
turning) and to **looming** stimuli (approaching objects that trigger
avoidance/escape). Each trial also starts with a brief optogenetic pulse.

**Files:** use the revised `p1_motion_v2_short.yaml` (~2.7 min) and
`p1_motion_v2_full.yaml` (~7.9 min). Fly-on-ball rig; **open-loop** visual
stimulation. FicTrac is still recorded for behavior, but the fly does not steer
the display in this protocol.

## The optogenetic prestim

Every visual trial begins with a **0.5 s LED pulse at 25%** while the pattern is
held on its first frame. The LED then turns **off** for the moving stimulus. So
each trial is "brief light, then motion."

## What the fly sees

- **Optomotor gratings** — drifting gratings at **2 spatial periods** and
  several speeds, in both directions (CW/CCW). A fly tends to turn *with* the
  motion. In v2, each spatial period includes a static (0 Hz) condition plus
  moving conditions paired at matched temporal frequencies.
- **Looming** — expanding dark stimuli that simulate an approaching object, at
  **3 classes × 5 positions × 2 speeds**. These probe avoidance/escape-like
  behavior. (The
  loom files include a few duplicated final frames so the image holds steady at
  the end instead of rolling over.)

## Trial counts (v2 full)

| Component | Design |
| --- | --- |
| Optomotor | 2 spatial periods × (1 static + 5 temporal frequencies × 2 directions) × 3 reps = **66** trials |
| Looming | 3 stimulus classes × 5 positions × 2 speeds × 3 reps = **90** trials |

Trials run in a fixed, paired order: opposite-direction optomotor trials and
left/right looms are adjacent. A static gray background is shown between trials
instead of blanking the arena.

## What to watch

- **Optomotor:** does the fly turn in the direction of grating motion? Does the
  strength depend on speed / spatial period?
- **Looming:** does the fly react (turn away, freeze, or attempt escape) as the
  object expands? Does position matter?

## Timing

Short version ≈ **2.7 min**. Full version ≈ **7.9 min** before setup/metadata
overhead.

Run short first. If the fly is walking and the responses look interpretable, run
the full version on the same fly. If both are usable, they can be pooled in
analysis.

> ✍️ **Instructor to confirm:** which genotypes run P1 first and which P1 runs
> count toward the class aggregate.

---
*Last updated 2026-07-09. Source: `protocols/shared/p1_motion_v2_*.yaml`.*
