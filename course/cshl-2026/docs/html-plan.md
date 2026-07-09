# Plan: markdown → stylish HTML pages

These `docs/*.md` files are the **single source of truth**. This plan turns them
into a student-friendly website that matches the Arena Studio look, without
making the markdown any harder to edit.

The page map is intentionally inspired by the Modular LED Display G3 user guide:
brief introduction, fly preparation, hardware overview, software operation,
example experiments, and technical appendices. The CSHL version should be much
shorter and more procedural.

## Goals

- **One source, two renderings.** Instructors edit markdown; students read
  styled pages. Never maintain content twice.
- **On-brand, but readable.** Use Arena Studio's dark/cyan visual language for
  navigation and code, but keep the reading surface light enough for students to
  skim on laptops and phones.
- **Low-friction hosting.** Ideally free (GitHub Pages), ideally no heavy build.
- **Course-first structure.** The site should expose six top-level entry points:
  tethering, FicTrac, Rig 101, protocols, GitHub, and Arena Studio.

## The theme

```
Ink:        #17212b    Paper:     #fffdf7   Line:   #d7ddd4
Cyan:       #0e8f9e    Coral:    #df5b43   Gold:   #c9941a
Leaf:       #378b54    Plum:     #6c4b8e
Mono/code:  JetBrains Mono or IBM Plex Mono
Body:       Inter, system sans
```

Layout: a compact top bar with the course name and links back to Arena Studio
and the repo; a left sidebar from the [index](README.md) on desktop; a single
column on phones; protocol cards for p0-p3; tables for run gates and QC.

## Option A — client-side reader (fast MVP, no build)

A single `guide.html` page that fetches a markdown file and renders it in the
browser with [marked.js](https://marked.js.org/) (CDN) + the theme above.

- URL: `guide.html?doc=fictrac` → fetches `docs/fictrac.md`, renders it.
- Sidebar is a small hardcoded list (or generated from `README.md`).
- **Pros:** zero build step; edit a `.md`, refresh, done. ~1 file to write.
- **Cons:** needs the `.md` files reachable over HTTP from the page's origin
  (see hosting), and renders on the client (fine for docs).

This is the fastest path to "stylish pages for students" and can be done in an
hour. It is acceptable for a same-day mockup.

## Option B — static build (polished, later)

A tiny build script (Node, run via `pixi`) converts every `docs/**/*.md` into a
standalone `.html` using one template, with a generated nav and search.

- **Pros:** real pages (fast, indexable, work offline), pretty URLs, link
  checking at build time.
- **Cons:** a build step to run whenever docs change (can be a GitHub Action).
- Off-the-shelf alternatives that would also work: MkDocs (Material theme),
  Docusaurus, or Astro — but a ~100-line custom builder keeps the exact
  Arena Studio styling and avoids a framework.

**Recommendation:** ship Option A for the course-day mockup; graduate to Option
B (or MkDocs Material skinned to the theme) if the guide will be reused after
the course.

## Hosting decision

The course repo is **private**, but the student-facing guide can be hosted as an
unlisted page on the public webDisplayTools GitHub Pages site:

<https://reiserlab.github.io/webDisplayTools/course/cshl-2026/guide.html>

Important constraints:

- The page is public if someone has the exact URL.
- It should **not** be linked from public webDisplayTools navigation while the
  content is still a rough draft.
- The private `cshl-2026-course` README can link to it for instructors.
- Michael can send direct links to students after proofreading and updates.
- Do not publish roster-specific or private student information in the public
  copy.

## Suggested next steps

1. Keep `guide.html` unlinked from public webDisplayTools pages.
2. Link to the guide only from the private course repo README until proofreading
   is complete.
3. Refresh the public Markdown copy whenever the private `docs/` draft changes.
4. Later, add a static builder or GitHub Action if the guide will be reused.

Option A is the chosen course-day approach.

---
*Last updated 2026-07-09.*
