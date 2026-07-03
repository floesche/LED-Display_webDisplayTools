# Studio → GitHub save: lean proposal (for review)

**Status: PROPOSAL (2026-07-03) — not scheduled. Review + edit before any build.**
Requested during the #107 write-side session ("our eventual plan is to be able
to merge onto a github repo … a per-user repo, which would hold all the YAML,
patterns, etc."). Related: parity-doc Direction note, issue #107 (URL state),
issue #135 (session rig).

## Where we are today

- File ▾ / 💾 Save already has a GitHub path: sign in with a fine-grained PAT →
  "Save → Pull Request" commits to a branch of `reiserlab/webDisplayTools` and
  opens a PR (`js/studio-github.js` — pure request builders: repo → ref →
  create-branch → PUT (create-vs-update sha) → PR; path allowlist `protocols/`
  + `configs/metadata/`; token lives only in the Authorization header,
  session/localStorage).
- Save is the run-gate **provenance anchor**: `markSaved` records the content
  sha; run logs pair with the saved artifact. Export YAML is NOT save (it's a
  regenerated roundtrip copy for diffing).
- Limitations: target repo is hardcoded; writes only `protocols/`; sharing
  (`?p=`) resolves only against this site's own `protocols/index.json`.

## Goal

Associate a Studio session with a **per-user (or per-lab) GitHub repo** that
holds that user's protocol YAMLs, pattern sets, and rig configs. Save =
commit/PR there; later, load and share from there.

## Proposal — three thin phases (plus a v0 that needs no GitHub at all)

### v0 — "Open from library…" picker (site-only; the missing registry door)

Today the URL is the **only** way to load a registry protocol — File ▾ Open and
the Run view's button are local-file pickers, so even a byte-identical local
copy loads as `local` with no provenance. Fix: an **Open from library…** entry
(File ▾ + beside Run's "Open protocol") listing `protocols/index.json` by
`label`, loading via the same path `initFromUrl` uses —
`Studio.loadProtocol(text, name, 'committed', {key})` — so `?p=` and the
provenance key follow automatically. The Edit view's demo fixtures join the
same list (either promoted into the registry or shown as a second "demos"
group), which also closes the "editing a demo shows no `?p=`" seam. This
picker is the UI slot v2 later re-points at a user repo's index — build it
once against the site registry, parameterize it later.

### v1 — save to *my* repo (one focused session)

- Settings gains **"GitHub repo: `owner/name`"** (validated via `GET /repos/…`;
  stored in localStorage per browser) next to the existing PAT sign-in.
- `saveViaPR` parameterized on that repo (today's `GH_OWNER`/`GH_REPO`
  constants become session values). Add a **"commit directly to default
  branch"** checkbox for solo repos; branch+PR stays the default (right for
  shared/lab repos).
- A **template repo** (e.g. `reiserlab/arena-protocols-template`, "Use this
  template") defines the expected layout so the load side (v2) has a contract:

  ```
  protocols/        *.yaml + index.json   (same schema as this site's registry)
  patterns/         *.pat (+ MANIFEST.txt)
  configs/rigs/     *.yaml + index.json
  ```

- Provenance unchanged: sha over the exact uploaded text; run-log `meta` gains
  `repo` + `path`.

### v2 — load + share (the `?p=` repo dimension)

- **`?repo=owner/name&p=key`**: fetch that repo's `protocols/index.json`
  (GitHub contents API or raw.githubusercontent — both CORS-enabled), validate
  the key against it, fetch the protocol. Public repo → the link works for
  anyone. Private repo → works only for someone holding their own token —
  documented boundary; the **token is never part of the URL**.
- Codec: `repo` param validated as an `owner/name` slug; `encodeApp` grows a
  `repo` field (the #107 write side was built for this — one chokepoint).
- In-app **"Open from repo"** picker listing the index keys — also closes the
  current gap where `?p=` is the *only* way to open a registry protocol.

### v3 — patterns + rigs

- Pattern-set builder ZIP → commit `.pat` files via the git blob/tree API (the
  contents API caps ~1 MB per file and one-file-per-request; batches want a
  tree commit anyway).
- Rig configs in the user repo feed the session-rig selector + `?rig=` (#135).

## Auth — the one real decision

- **v1 keeps fine-grained PATs** (client-side; scoped to Contents + Pull
  requests on the one repo). Zero infrastructure; the cost is a one-time token
  paste per browser.
- OAuth sign-in (nicer UX) requires a token-exchange **secret**, i.e. *some*
  server: a ~20-line Cloudflare Worker, or a GitHub App with device flow.
  Defer until PAT friction is demonstrated to matter. Explicitly out: any
  server that ever sees repo *content* — exchange tokens only.

## Security boundaries (carry-overs from today)

- Token: Authorization header only — never in URLs, logs, or run-log exports;
  session-vs-local storage stays a visible user choice.
- Per-repo path allowlist (`protocols/`, `patterns/`, `configs/`) — no
  arbitrary-path writes, ever.
- Everything fetched still passes `parseV3Protocol` validation + the v2-reject
  guard; `repo`/`p`/`rig` params validated by shape and by registry membership
  (same belt-and-suspenders as `isSafePath` today).

## Portability: protocols ↔ pattern sets must be matched (unsolved — decide early)

A protocol alone is **not portable**. v3 protocols reference patterns **by
filename** (`pattern:` in trialParams), and at run time the Studio resolves
name → SD index from the live SD listing (SD-first picker). So a shared
protocol only runs — and only runs *correctly* — if the target arena's SD card
holds pattern files with the same names **and the same content**. The failure
modes differ in severity: a missing name refuses to run (annoying); a same-name
file with different content **silently shows the wrong stimulus** (worse —
invalidates the experiment without any error).

What needs figuring out during review (it shapes the v1 template layout, so it
can't wait for v3):

- **A durable protocol → pattern-set link.** The template repo co-locates
  `patterns/`, but nothing records *which* set a protocol needs. Candidates: a
  `pattern_set:` reference in the protocol (or in `protocols/index.json`)
  naming a set whose manifest carries **per-file sha256** (grow the existing
  `MANIFEST.txt` or a sidecar `manifest.json`).
- **A Studio preflight check.** Before the run gate opens on a
  registry/repo-loaded protocol: compare the SD listing + per-pattern 0x88
  info (frame count / grayscale / size) against the manifest; full content
  verification is possible via 0x84 bulk download + hash (slow — maybe
  spot-check or on-demand). Mismatch → visible warning naming the files.
- **A "fix it" flow.** The Console already batch-uploads folders to SD — so
  the remedy can be one action: fetch the set from the repo, batch-upload,
  re-verify. (Run-log meta should record the verified set hash alongside the
  protocol sha — the run log then certifies the *pair*.)

## Open questions (answer during review)

1. Default mental model: **per-user** repo or **per-lab** repo? (changes the
   template/fork story and whether PRs are the norm)
2. Own repo: direct commit or always-PR?
3. Does this site's built-in registry stay the demo/curriculum home while user
   work lives in user repos? (assumed yes)
4. Is the repo association per-browser (localStorage) only, or encoded into
   shared URLs by default (`?repo=` on every share)?
5. Pattern-set linkage: reference per-protocol or per-index-entry? Hash
   granularity (per-file vs per-set)? How strict is the preflight before a
   *recorded* run — warn or block?
