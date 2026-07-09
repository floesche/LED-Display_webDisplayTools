# Protocols — the p0–p3 series

The course experiments are numbered **p0 → p3**. Each one is a self-contained
Arena Studio protocol; most come in a **short** and a **full** version.

**Workflow:** run the **short** version first to check that the fly, tracking,
visual display, and optogenetic timing make sense. If it looks good, run the
matching **full** version. If short and full were run on the same fly, the
analysis can pool them.

P0 is the intro/calibration protocol and is worth running once per line when
possible. P1 and P2 are the core student protocols. P3 is planned as a bonus or
conditioning experiment but is not built yet.

| # | Name | What it probes | Closed-loop / FicTrac? | Short | Full |
| --- | --- | --- | --- | --- | --- |
| **[p0](p0-opto-intensity.md)** | Optogenetic intensity | Which LED level drives the fly | No (open-loop) | ~2.6 min | ~10.3 min |
| **[p1](p1-motion.md)** | Visual motion | Optomotor turning + looming response | No (open-loop) | ~2.7 min | ~7.9 min |
| **[p2](p2-object.md)** | Object responses | Bar fixation + A/B choice | **Yes** (needs FicTrac) | ~4.3-4.5 min | ~9.8-10.2 min |
| **[p3](p3.md)** | Conditioning / bonus | Planned open-loop conditioning then closed-loop test | TBD | TBD | TBD |

## Also on the rigs

- **`p100_rig_test`** — a 60-second, controller-only checkout (no fly, no
  FicTrac): full-field brightness, panel map, a moving bar, and LED levels
  2/5/10/20/40%. Use it to confirm a rig works after setup.
- **`fictrac_direction_test`** — open-loop motion then a closed-loop block, to
  confirm the [FicTrac](../fictrac.md) bridge is working.
- **`optomotor_led_test`** — a slow grating with the LED switched on for the
  last few seconds; the reference example of "fire a command partway through a
  trial."

## How to read a protocol page

Each page tells you: **what the fly sees**, **what the LED does**, **how the
trials are organized**, and **roughly how long it takes**. The authoritative
source is always the protocol's YAML file (in `protocols/shared/`), whose header
comment describes it in full detail.

> ✍️ **Instructor to confirm:** which genotypes pair with which protocol, and
> the intended order for the course sessions. Current strategy is flexible group
> assignment across genotypes, with short runs used as go/no-go checks.

---
*Last updated 2026-07-09.*
