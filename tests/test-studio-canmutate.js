#!/usr/bin/env node
/**
 * Contract test for the read-only chokepoint (design §6). The real guard lives
 * inside arena_studio.html's Edit IIFE (pushUndo() returns canMutate() and every
 * mutation site does `if (!pushUndo()) return;`). This test proves the CONTRACT
 * that wiring depends on, using studio-meta.canMutate + a faithful mini-model of
 * pushUndo: when canMutate() is false, pushUndo() returns false, the model write
 * is skipped, and a __mutationAttempts counter increments.
 *
 * Run: node tests/test-studio-canmutate.js   (wired into `pixi run test`)
 */
'use strict';

const M = require('../js/studio-meta.js');

let totalChecks = 0;
let failures = 0;
function check(name, got, expected) {
    totalChecks++;
    const ok = JSON.stringify(got) === JSON.stringify(expected);
    console.log(
        `  ${ok ? 'PASS' : 'FAIL'}  ${name}: got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}`
    );
    if (!ok) failures++;
}

// Faithful mini-model of the arena_studio.html chokepoint.
function makeModel() {
    const Studio = { mode: 'run', importMode: false, __mutationAttempts: 0 };
    Studio.canMutate = () => M.canMutate(Studio);
    const state = { doc: 'v0' }; // stand-in for experiment._doc.toString()
    let _restoring = false;

    // pushUndo mirrors the planned implementation exactly.
    function pushUndo() {
        if (!Studio.canMutate()) {
            Studio.__mutationAttempts++;
            return false;
        }
        if (_restoring) return false;
        return true;
    }
    // A representative mutation handler: `if (!pushUndo()) return;` then write.
    function onEdit(newDoc) {
        if (!pushUndo()) return;
        state.doc = newDoc;
    }
    return { Studio, state, onEdit };
}

// ── canMutate truth table ────────────────────────────────────────────────────
console.log('=== canMutate truth table ===');
check('run → false', M.canMutate({ mode: 'run', importMode: false }), false);
check('console → false', M.canMutate({ mode: 'console', importMode: false }), false);
check('edit → true', M.canMutate({ mode: 'edit', importMode: false }), true);
check('edit + import → false', M.canMutate({ mode: 'edit', importMode: true }), false);

// ── mutations blocked outside Edit ───────────────────────────────────────────
console.log('=== mutation blocked in Run/Console ===');
let m = makeModel();
m.Studio.mode = 'run';
m.onEdit('v1');
check('run: doc unchanged', m.state.doc, 'v0');
check('run: attempt counted', m.Studio.__mutationAttempts, 1);

m.Studio.mode = 'console';
m.onEdit('v2');
check('console: doc unchanged', m.state.doc, 'v0');
check('console: attempts=2', m.Studio.__mutationAttempts, 2);

// ── mutations allowed in Edit, blocked during import ─────────────────────────
console.log('=== mutation in Edit ===');
m.Studio.mode = 'edit';
m.onEdit('v3');
check('edit: doc written', m.state.doc, 'v3');
check('edit: no new attempt', m.Studio.__mutationAttempts, 2);

m.Studio.importMode = true;
m.onEdit('v4');
check('import: doc unchanged', m.state.doc, 'v3');
check('import: attempt counted', m.Studio.__mutationAttempts, 3);

console.log('\n=== Summary ===');
console.log(`${totalChecks - failures} / ${totalChecks} checks passed`);
process.exit(failures ? 1 : 0);
