#!/usr/bin/env node
/**
 * Validates the committed registries Arena Studio reads:
 *   - protocols/index.json  (shape, unique keys, safe paths, files exist on disk)
 *   - configs/metadata/people.yaml + genotypes.yaml  (present, non-empty, expected keys)
 *
 * Mirrors the spirit of the rig-index. Uses the URL-state path guard so a
 * malformed committed path can't slip a traversal past the fetcher.
 *
 * Run: node tests/test-studio-protocols-index.js   (wired into `pixi run test`)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const U = require('../js/studio-url-state.js');

const ROOT = path.join(__dirname, '..');
let totalChecks = 0;
let failures = 0;
function checkBool(name, ok, info) {
    totalChecks++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${info ? ' — ' + info : ''}`);
    if (!ok) failures++;
}

// ── protocols/index.json ─────────────────────────────────────────────────────
console.log('=== protocols/index.json ===');
const idxPath = path.join(ROOT, 'protocols', 'index.json');
checkBool('index exists', fs.existsSync(idxPath), idxPath);
let idx = null;
try {
    idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
    checkBool('parses as JSON', true);
} catch (e) {
    checkBool('parses as JSON', false, e.message);
}
if (idx) {
    checkBool('tool tag', idx.tool === 'webDisplayTools/protocol-index', idx.tool);
    checkBool('version present', typeof idx.version === 'number', String(idx.version));
    checkBool('protocols is array', Array.isArray(idx.protocols), typeof idx.protocols);
    const keys = new Set();
    (idx.protocols || []).forEach((p, i) => {
        checkBool(`[${i}] has key`, U.isSafeKey(p.key), p.key);
        checkBool(`[${i}] key unique`, !keys.has(p.key), p.key);
        keys.add(p.key);
        checkBool(`[${i}] has label`, typeof p.label === 'string' && p.label.length > 0, p.label);
        checkBool(`[${i}] path is safe`, U.isSafePath(p.path), p.path);
        const abs = path.join(ROOT, p.path);
        checkBool(`[${i}] file exists`, fs.existsSync(abs), p.path);
        // The referenced protocol should look like a v3 YAML.
        if (fs.existsSync(abs)) {
            const txt = fs.readFileSync(abs, 'utf8');
            checkBool(`[${i}] is v3 (version: 3)`, /(^|\n)version:\s*3\b/.test(txt), p.key);
        }
    });
}

// ── configs/metadata/*.yaml ──────────────────────────────────────────────────
console.log('=== configs/metadata ===');
const people = path.join(ROOT, 'configs', 'metadata', 'people.yaml');
const genos = path.join(ROOT, 'configs', 'metadata', 'genotypes.yaml');
checkBool('people.yaml exists', fs.existsSync(people), people);
checkBool('genotypes.yaml exists', fs.existsSync(genos), genos);
if (fs.existsSync(people)) {
    const t = fs.readFileSync(people, 'utf8');
    checkBool('people.yaml has people:', /(^|\n)people:/.test(t), 'people:');
    checkBool('people.yaml has ids', /\bid:\s*\w+/.test(t), 'id:');
}
if (fs.existsSync(genos)) {
    const t = fs.readFileSync(genos, 'utf8');
    checkBool('genotypes.yaml has genotypes:', /(^|\n)genotypes:/.test(t), 'genotypes:');
}

console.log('\n=== Summary ===');
console.log(`${totalChecks - failures} / ${totalChecks} checks passed`);
process.exit(failures ? 1 : 0);
