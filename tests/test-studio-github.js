#!/usr/bin/env node
/**
 * Tests for js/studio-github.js — the "Save as Pull Request" request builder.
 * No network: asserts the {method,url,headers,body} descriptors, base64 body,
 * create-vs-update sha, branch namespacing, path allowlist, and that the token
 * lives only in the Authorization header (never in a URL).
 *
 * Run: node tests/test-studio-github.js   (wired into `pixi run test`)
 */
'use strict';

const G = require('../js/studio-github.js');

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
function checkBool(name, ok, info) {
    totalChecks++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}${info ? ' — ' + info : ''}`);
    if (!ok) failures++;
}

const TOKEN = 'github_pat_SECRET123';
const O = 'reiserlab';
const R = 'webDisplayTools';

// ── base64 (UTF-8 safe) ──────────────────────────────────────────────────────
console.log('=== b64 ===');
check('ascii', G.b64('hello'), 'aGVsbG8=');
check('utf8 snowman', G.b64('☃'), '4piD');
check('empty', G.b64(''), '');

// ── path allowlist ───────────────────────────────────────────────────────────
console.log('=== isAllowedPath ===');
check('protocols ok', G.isAllowedPath('protocols/looming_v3.yaml'), true);
check('metadata ok', G.isAllowedPath('configs/metadata/people.yaml'), true);
check('rejects other dir', G.isAllowedPath('js/evil.js'), false);
check('rejects traversal', G.isAllowedPath('protocols/../js/evil.js'), false);
check('rejects abs', G.isAllowedPath('/etc/passwd'), false);
check('rejects backslash', G.isAllowedPath('protocols\\x.yaml'), false);

// ── branch naming ────────────────────────────────────────────────────────────
console.log('=== branchName ===');
check('namespaced + slugged', G.branchName('Looming v3!', 'ab12cd'), 'studio/looming-v3-ab12cd');
check('empty name → protocol', G.branchName('', 'x'), 'studio/protocol-x');

// ── headers ──────────────────────────────────────────────────────────────────
console.log('=== headers ===');
const h = G.headers(TOKEN);
check('bearer token', h.Authorization, 'Bearer ' + TOKEN);
check('api version', h['X-GitHub-Api-Version'], '2022-11-28');
check('accept', h.Accept, 'application/vnd.github+json');

// ── request builders ─────────────────────────────────────────────────────────
console.log('=== reqGetRepo ===');
let req = G.reqGetRepo(O, R, TOKEN);
check('method', req.method, 'GET');
check('url', req.url, 'https://api.github.com/repos/reiserlab/webDisplayTools');
checkBool('token not in url', !req.url.includes(TOKEN), req.url);
checkBool('token in header', req.headers.Authorization.includes(TOKEN), 'auth');

console.log('=== reqGetRef ===');
req = G.reqGetRef(O, R, 'main', TOKEN);
check(
    'ref url',
    req.url,
    'https://api.github.com/repos/reiserlab/webDisplayTools/git/ref/heads/main'
);

console.log('=== reqCreateRef ===');
req = G.reqCreateRef(O, R, 'studio/looming-x', 'BASESHA', TOKEN);
check('create ref method', req.method, 'POST');
check('create ref body', req.body, { ref: 'refs/heads/studio/looming-x', sha: 'BASESHA' });

console.log('=== reqPutContents (create) ===');
req = G.reqPutContents(
    O,
    R,
    'protocols/looming_v3.yaml',
    {
        message: 'add looming_v3',
        contentText: 'version: 3\n',
        branch: 'studio/looming-x'
    },
    TOKEN
);
check('put method', req.method, 'PUT');
check(
    'put url',
    req.url,
    'https://api.github.com/repos/reiserlab/webDisplayTools/contents/protocols/looming_v3.yaml'
);
check('create omits sha', req.body.sha, undefined);
check('content is base64', req.body.content, G.b64('version: 3\n'));
check('branch in body', req.body.branch, 'studio/looming-x');

console.log('=== reqPutContents (update includes sha) ===');
req = G.reqPutContents(
    O,
    R,
    'configs/metadata/people.yaml',
    {
        message: 'add person',
        contentText: 'people: []\n',
        branch: 'studio/x',
        sha: 'EXISTINGBLOB'
    },
    TOKEN
);
check('update includes sha', req.body.sha, 'EXISTINGBLOB');

console.log('=== reqPutContents rejects disallowed path ===');
let threw = false;
try {
    G.reqPutContents(O, R, 'js/evil.js', { message: 'x', contentText: 'y', branch: 'b' }, TOKEN);
} catch (e) {
    threw = true;
}
checkBool('throws on disallowed path', threw, 'js/evil.js');

console.log('=== reqCreatePull ===');
req = G.reqCreatePull(
    O,
    R,
    { title: 'Add looming', head: 'studio/x', base: 'main', body: 'via Studio' },
    TOKEN
);
check('pull method', req.method, 'POST');
check('pull url', req.url, 'https://api.github.com/repos/reiserlab/webDisplayTools/pulls');
check('pull body', req.body, {
    title: 'Add looming',
    head: 'studio/x',
    base: 'main',
    body: 'via Studio'
});

// ── token never leaks into any URL ───────────────────────────────────────────
console.log('=== token containment ===');
const allReqs = [
    G.reqGetRepo(O, R, TOKEN),
    G.reqGetRef(O, R, 'main', TOKEN),
    G.reqCreateRef(O, R, 'b', 's', TOKEN),
    G.reqGetContents(O, R, 'protocols/x.yaml', 'b', TOKEN),
    G.reqPutContents(
        O,
        R,
        'protocols/x.yaml',
        { message: 'm', contentText: 't', branch: 'b' },
        TOKEN
    ),
    G.reqCreatePull(O, R, { title: 't', head: 'h', base: 'main' }, TOKEN)
];
checkBool(
    'no token in any url',
    allReqs.every((q) => !q.url.includes(TOKEN)),
    'urls clean'
);
checkBool(
    'no token in any body',
    allReqs.every((q) => JSON.stringify(q.body || {}).indexOf(TOKEN) === -1),
    'bodies clean'
);

// ── run() executor with an injected fetch ────────────────────────────────────
console.log('=== run (injected fetch) ===');
(async () => {
    let seenUrl = null;
    let seenAuth = null;
    const fakeFetch = async (url, init) => {
        seenUrl = url;
        seenAuth = init.headers.Authorization;
        return { ok: true, status: 200, json: async () => ({ default_branch: 'main' }) };
    };
    const res = await G.run(fakeFetch, G.reqGetRepo(O, R, TOKEN));
    check('run returns data', res.data.default_branch, 'main');
    check('run ok+status', [res.ok, res.status], [true, 200]);
    checkBool('run passed auth header', seenAuth === 'Bearer ' + TOKEN, seenAuth);
    checkBool('run hit repo url', seenUrl.endsWith('/repos/reiserlab/webDisplayTools'), seenUrl);

    console.log('\n=== Summary ===');
    console.log(`${totalChecks - failures} / ${totalChecks} checks passed`);
    process.exit(failures ? 1 : 0);
})();
