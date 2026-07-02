/**
 * studio-github.js — Arena Studio "Save as Pull Request" request builder.
 *
 * A PURE request-descriptor builder: every function returns a plain
 * {method, url, headers, body} object with NO network I/O, so the whole save
 * pipeline is Node-unit-testable (assert URLs, headers, base64 body, create-vs-
 * update sha, branch namespacing, path allowlist) without hitting the API. A
 * thin `run(fetchImpl, req)` executes one descriptor; the HTML orchestrates the
 * sequence and does the token storage / UI.
 *
 * Client-side flow (api.github.com is CORS-friendly for token auth — no server):
 *   1. GET  /repos/{o}/{r}                      → default_branch
 *   2. GET  /repos/{o}/{r}/git/ref/heads/{b}    → base commit sha
 *   3. POST /repos/{o}/{r}/git/refs             → create studio/<slug>-<runId>
 *   4. GET  /repos/{o}/{r}/contents/{path}?ref  → existing blob sha (or 404)
 *      PUT  /repos/{o}/{r}/contents/{path}      → create/update file on the branch
 *   5. POST /repos/{o}/{r}/pulls                → open the PR
 *
 * Security: the token lives ONLY in the Authorization header — never in a URL,
 * never in the body. Writable paths are allowlisted to protocols/ and
 * configs/metadata/ (mirrors the URL-state path-traversal guard).
 *
 * LOADING: classic <script src> (window-global + CommonJS dual-export, no ES `export`).
 */
(function (global) {
    'use strict';

    const API = 'https://api.github.com';
    const API_VERSION = '2022-11-28';
    const WRITABLE_PREFIXES = ['protocols/', 'configs/metadata/'];

    // UTF-8-safe base64 (Node Buffer or browser btoa+encodeURIComponent).
    function b64(text) {
        const s = String(text == null ? '' : text);
        if (typeof Buffer !== 'undefined') return Buffer.from(s, 'utf8').toString('base64');
        return btoa(unescape(encodeURIComponent(s)));
    }

    function isAllowedPath(path) {
        if (typeof path !== 'string' || !path) return false;
        if (path.includes('..') || path.startsWith('/') || path.includes('\\')) return false;
        return WRITABLE_PREFIXES.some((p) => path.startsWith(p));
    }

    // Filesystem-safe slug for a branch segment.
    function slug(s) {
        return (
            String(s || '')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '') || 'protocol'
        );
    }

    function branchName(name, runId) {
        return 'studio/' + slug(name) + '-' + (runId || 'run');
    }

    function headers(token) {
        return {
            Authorization: 'Bearer ' + token,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': API_VERSION
        };
    }

    function enc(seg) {
        return encodeURIComponent(seg);
    }

    function reqGetRepo(o, r, token) {
        return {
            method: 'GET',
            url: API + '/repos/' + enc(o) + '/' + enc(r),
            headers: headers(token)
        };
    }
    function reqGetRef(o, r, branch, token) {
        return {
            method: 'GET',
            url:
                API +
                '/repos/' +
                enc(o) +
                '/' +
                enc(r) +
                '/git/ref/heads/' +
                branch.split('/').map(enc).join('/'),
            headers: headers(token)
        };
    }
    function reqCreateRef(o, r, newBranch, baseSha, token) {
        return {
            method: 'POST',
            url: API + '/repos/' + enc(o) + '/' + enc(r) + '/git/refs',
            headers: headers(token),
            body: { ref: 'refs/heads/' + newBranch, sha: baseSha }
        };
    }
    function reqGetContents(o, r, path, ref, token) {
        if (!isAllowedPath(path)) throw new Error('Refusing to read disallowed path: ' + path);
        const base =
            API +
            '/repos/' +
            enc(o) +
            '/' +
            enc(r) +
            '/contents/' +
            path.split('/').map(enc).join('/');
        return {
            method: 'GET',
            url: base + (ref ? '?ref=' + enc(ref) : ''),
            headers: headers(token)
        };
    }
    /**
     * @param {object} a {message, contentText, branch, sha?} — sha present ⇒ update, absent ⇒ create
     */
    function reqPutContents(o, r, path, a, token) {
        if (!isAllowedPath(path)) throw new Error('Refusing to write disallowed path: ' + path);
        const body = {
            message: a.message,
            content: b64(a.contentText),
            branch: a.branch
        };
        if (a.sha) body.sha = a.sha; // update; omit to create
        return {
            method: 'PUT',
            url:
                API +
                '/repos/' +
                enc(o) +
                '/' +
                enc(r) +
                '/contents/' +
                path.split('/').map(enc).join('/'),
            headers: headers(token),
            body: body
        };
    }
    function reqCreatePull(o, r, a, token) {
        return {
            method: 'POST',
            url: API + '/repos/' + enc(o) + '/' + enc(r) + '/pulls',
            headers: headers(token),
            body: { title: a.title, head: a.head, base: a.base, body: a.body || '' }
        };
    }

    // Thin executor: run one descriptor with an injected fetch. Returns
    // {ok, status, data}. Never logs the token. Kept tiny so the builders stay
    // the tested surface.
    async function run(fetchImpl, req) {
        const res = await fetchImpl(req.url, {
            method: req.method,
            headers: req.headers,
            body: req.body != null ? JSON.stringify(req.body) : undefined
        });
        let data = null;
        try {
            data = await res.json();
        } catch (_) {
            data = null;
        }
        return { ok: res.ok, status: res.status, data: data };
    }

    const StudioGitHub = {
        API,
        API_VERSION,
        WRITABLE_PREFIXES,
        b64,
        isAllowedPath,
        slug,
        branchName,
        headers,
        reqGetRepo,
        reqGetRef,
        reqCreateRef,
        reqGetContents,
        reqPutContents,
        reqCreatePull,
        run
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = StudioGitHub;
    }
    if (typeof global !== 'undefined') {
        global.StudioGitHub = StudioGitHub;
    }
})(typeof window !== 'undefined' ? window : this);
