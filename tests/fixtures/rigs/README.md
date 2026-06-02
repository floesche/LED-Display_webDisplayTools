# Rig YAML fixtures

Verbatim copies of real rig config files from **maDisplayTools** (`main` @ `4592cea`,
`configs/rigs/`). Not hand-written — do not edit; re-copy from upstream if they drift.

Provided as ready test inputs for the rig-aware plugin work
([#91](https://github.com/reiserlab/webDisplayTools/issues/91) /
[#89](https://github.com/reiserlab/webDisplayTools/issues/89)): parsing a rig's
`plugins:` block to derive the plugins a rig supports.

| File | Why it's here |
|---|---|
| `test_rig_1.yaml` | **Richest case** — `backlight` + `camera` *enabled* with full config; `type: "LED Controller"` / `"Bias"`, `port`, `config_path`. The happy path for "derive enabled plugins + their classes." |
| `example_rig.yaml` | **Schema-variation case** — `backlight` has *no* `type` and uses `com_port` / `ir_power`…; camera `type: "BIAS"` (different casing). Exercises the tolerant rig→`matlab.class` mapping called out in #91. |
| `test_rig_2.yaml` | **Minimal case** — all plugins `enabled: false`, no config. Exercises the "rig supports nothing enabled" path. |

Canonical rig plugin names are `backlight`, `camera`, `temperature` — these are the
names an experiment YAML's `plugins:` must use to inherit the rig's config (the crux
of #89).
