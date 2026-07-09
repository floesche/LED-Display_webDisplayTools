# Vision In Flies — Course Guide

Welcome! These pages are your reference for running fly-on-ball experiments on
the G6 LED-arena rigs. Read them in roughly this order; each page is short and
practical.

> ⚠️ **Draft (AI-assisted).** These pages were drafted from the rig configs,
> the shipped protocols, and the July 8 setup meeting. Anything marked
> **✍️ Instructor to confirm** needs a human check before students rely on it.

## Start here

1. **[Tethering basics](tethering.md)** — gluing a fly to a pin and getting it on the ball.
2. **[Rig 101](rig-101.md)** — what's on the bench and what each part does.
3. **[FicTrac basics & config](fictrac.md)** — the ball tracker: what it does and how to set it up.
4. **[Arena Studio](arena-studio.md)** — the web app you run experiments from (getting started + links).
5. **[GitHub for the course](github-overview.md)** — where protocols and data live, and how they get there.

## The experiments

- **[Protocol overview](protocols/README.md)** — the p0–p3 series at a glance.
  - [p0 — Optogenetic intensity](protocols/p0-opto-intensity.md)
  - [p1 — Visual motion (optomotor + looming)](protocols/p1-motion.md)
  - [p2 — Object responses (bar, choice)](protocols/p2-object.md)
  - [p3 — Conditioning / bonus experiment](protocols/p3.md) *(coming soon)*

## Course strategy

- **P0 is the intro/calibration protocol.** It is useful to run once per line,
  but it is not intended to be the main high-N dataset.
- **Everyone should run P1 and P2.** Start with the short version to verify the
  fly, rig, tracking, and optogenetic timing; then run the matching full
  version when the fly looks good.
- **The plan is flexible.** If one genotype is inactive and another looks
  excellent, teams may rotate or rebalance during the session rather than
  grinding through a bad fly.
- **By the end of the day, every team should make at least one pattern** and may
  modify an experiment after completing the core runs.

## Reference

- **[Genotype shorthand](genotypes.md)** — the fly lines and their dropdown labels.
- **Further reading:** Loesche & Reiser (2021), *An inexpensive, high-precision
  fly-on-ball setup* — [doi:10.3389/fnbeh.2021.689573](https://doi.org/10.3389/fnbeh.2021.689573).
  The tethering and fly-on-ball pages here are adapted from it and the lab's CSHL
  tethering protocol.

## For maintainers

- **[Plan: markdown → stylish HTML pages](html-plan.md)** — how these pages become
  a student-friendly website.

---
*Last updated 2026-07-09.*
