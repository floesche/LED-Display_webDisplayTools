/**
 * runlog-replay.js — turn a recorded arena run-log (NDJSON) into a replayable
 * timeline: behavior_v1 SAMPLES (for the scope / offline analysis dashboard) plus
 * run-status EVENTS reshaped into the LIVE shape the scope's overlay code expects.
 *
 * WHY THIS EXISTS
 *   The live scope is fed by two streams that don't exist for a recorded run:
 *     - the FicTrac bridge's behavior_v1 samples (Scope.pushSample), and
 *     - the runner's run-status events (Scope.onRunStatus) that draw the trial
 *       boundaries / visual spans / LED band.
 *   A run-log has BOTH, but in on-disk form: full-log frames carry the raw 25-col
 *   FicTrac record, and runner events are SANITIZED (js/arena-session.js
 *   _sanitizeRunStatus) — e.g. `step.conditionName` is flattened to `condition`.
 *   This module reverses both so a log can be streamed back through the exact same
 *   scope code, and so the offline dashboard derives channels the same way as live.
 *
 * SHARED CONTRACT (keep in sync with fictrac-bridge/bridge.py + js/kinematics.js)
 *   - behavior_v1 sample = {ms, ft, x, y, hd, idx, fc}. `ft` is MILLISECONDS.
 *   - FicTrac col-22 is the camera hardware clock in NANOSECONDS on our rigs, so
 *     full-log frames divide col-22 by FT_TS_NS_PER_MS to get `ft` in ms (exactly
 *     what the bridge does live). behavior_v1 log rows already carry ms.
 *
 * LOADING: classic <script src> (window-global + CommonJS dual-export, no ES
 * `export`) — same pattern as kinematics.js, so it loads under Node for tests and
 * in the browser for the scope replay / dashboard.
 */
(function (global) {
    'use strict';

    // Keep in sync with fictrac-bridge/bridge.py FT_TS_NS_PER_MS.
    const FT_TS_NS_PER_MS = 1e6;
    // FicTrac 0-based column indices used by behavior_v1.
    const COL_FC = 0; // col 1  frame counter
    const COL_X = 14; // col 15 integrated x (rad)
    const COL_Y = 15; // col 16 integrated y (rad)
    const COL_HD = 16; // col 17 integrated heading (rad)
    const COL_TS = 21; // col 22 timestamp (camera hardware clock; ns on our rigs)

    /**
     * Reshape ONE sanitized run-log runner event into the live run-status object
     * the scope's onRunStatus consumes ({phase, index?, op?, value?, step?}).
     * Returns null for events with no phase.
     *
     * Two log vintages are normalized to the CURRENT runner shape:
     *  - `condition` (flattened by _sanitizeRunStatus) → `step.conditionName`.
     *  - v0.5's `phase:"trial-running"` (+ durationSec) → the current
     *    `phase:"command", op:"trialParams", value:durationSec`, so the scope draws
     *    the visual (green) span identically for old and new logs.
     */
    function adaptRunnerEvent(ev) {
        if (!ev || typeof ev !== 'object' || !ev.phase) return null;
        const cond = ev.condition != null ? ev.condition : ev.conditionName;
        if (ev.phase === 'trial-running') {
            const out = { phase: 'command', op: 'trialParams' };
            if (ev.durationSec != null) out.value = ev.durationSec;
            if (cond != null) out.step = { conditionName: cond };
            return out;
        }
        const s = { phase: ev.phase };
        if (ev.index != null) s.index = ev.index;
        if (ev.total != null) s.total = ev.total;
        if (ev.op != null) s.op = ev.op;
        if (ev.value !== undefined) s.value = ev.value;
        if (cond != null) s.step = { conditionName: cond };
        return s;
    }

    // Bridge wall-clock ms for a line: frames carry `t`, runner events `rx_ms`,
    // session lines `ms`. All are the bridge's now_ms() on one clock.
    function _wallMs(o) {
        if (typeof o.t === 'number') return o.t;
        if (typeof o.rx_ms === 'number') return o.rx_ms;
        if (typeof o.ms === 'number') return o.ms;
        return null;
    }

    /**
     * Parse a whole run-log into { samples, events, format }.
     *   samples: [{ms, ft, x, y, hd, idx, fc}]  (ms = display axis; ft = ms, velocity base)
     *   events:  [{ms, status}]                  (status = live run-status shape)
     * `ms` on both is bridge-relative (subtracting the first wall-clock seen), so
     * samples and overlay events share one axis for replay.
     * @param {string} text  NDJSON run-log
     * @param {object} [opts] {tsNsPerMs} override the col-22 unit (default ns)
     */
    function parseRunLog(text, opts) {
        opts = opts || {};
        const nsPerMs = opts.tsNsPerMs > 0 ? opts.tsNsPerMs : FT_TS_NS_PER_MS;
        const lines = String(text).split('\n');
        const samples = [];
        const events = [];
        let t0 = null; // first bridge wall-clock ms
        let ft0 = null; // first col-22 value (native units)
        let sawBehaviorV1 = false;

        for (let i = 0; i < lines.length; i++) {
            const ln = lines[i].trim();
            if (!ln) continue;
            let o;
            try {
                o = JSON.parse(ln);
            } catch (e) {
                continue; // tolerate a torn final line / stray text
            }

            // behavior_v1 positional row: [ms, fc, idx, ft, x, y, hd] (ft already ms)
            if (Array.isArray(o)) {
                sawBehaviorV1 = true;
                samples.push({
                    ms: o[0],
                    ft: o[3],
                    x: o[4],
                    y: o[5],
                    hd: o[6],
                    idx: o[2],
                    fc: o[1]
                });
                continue;
            }
            if (o.type === 'frame_schema') {
                sawBehaviorV1 = true;
                continue;
            }

            // full-log frame: raw 25-col FicTrac record under `fictrac`.
            if (o.type === 'fictrac_frame' && Array.isArray(o.fictrac)) {
                const f = o.fictrac;
                const wall = _wallMs(o);
                if (t0 === null && wall !== null) t0 = wall;
                const col22 = f[COL_TS];
                if (ft0 === null && typeof col22 === 'number') ft0 = col22;
                samples.push({
                    ms:
                        wall !== null && t0 !== null
                            ? wall - t0
                            : samples.length
                              ? samples[samples.length - 1].ms + 8
                              : 0,
                    ft: typeof col22 === 'number' && ft0 !== null ? (col22 - ft0) / nsPerMs : null,
                    x: f[COL_X],
                    y: f[COL_Y],
                    hd: f[COL_HD],
                    idx: o.index,
                    fc: typeof f[COL_FC] === 'number' ? Math.round(f[COL_FC]) : o.seq
                });
                continue;
            }

            // runner run-status event.
            if (o.event === 'runner') {
                const wall = _wallMs(o);
                if (t0 === null && wall !== null) t0 = wall;
                const status = adaptRunnerEvent(o);
                if (status) {
                    events.push({
                        ms: wall !== null && t0 !== null ? wall - t0 : 0,
                        status: status
                    });
                }
                continue;
            }
            // session / log_control / arena_command / plain log → not needed for replay
        }

        return { samples: samples, events: events, format: sawBehaviorV1 ? 'behavior_v1' : 'full' };
    }

    /**
     * Merge samples + events into ONE time-ordered replay timeline:
     *   [{ms, kind:'sample', sample} | {ms, kind:'status', status}]
     * A driver walks this in order, calling Scope.pushSample / Scope.onRunStatus,
     * so an overlay event is stamped right after the sample at its own `ms`.
     * Events sort before samples at an equal ms (a boundary belongs at the frame).
     */
    function buildTimeline(parsed) {
        const items = [];
        parsed.samples.forEach((s) => items.push({ ms: s.ms, kind: 'sample', sample: s }));
        parsed.events.forEach((e) => items.push({ ms: e.ms, kind: 'status', status: e.status }));
        items.sort((a, b) => a.ms - b.ms || (a.kind === 'status' ? -1 : 1));
        return items;
    }

    const RunlogReplay = {
        FT_TS_NS_PER_MS,
        adaptRunnerEvent,
        parseRunLog,
        buildTimeline
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RunlogReplay;
    }
    if (typeof global !== 'undefined') {
        global.RunlogReplay = RunlogReplay;
    }
})(typeof window !== 'undefined' ? window : this);
