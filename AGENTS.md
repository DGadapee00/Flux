# Flux: rules for agents

Flux is between plans. The old course-by-course guidance (roadmap, standard, course plans, build
skills) was retired on 2 November 2026 and moved to `docs/history/guidance-2026-11-02/`. Those
files are history. Do not follow them. Flux is about to be refactored around a single concept map
that runs across courses; new guidance comes with that refactor.

Until then:

- **Do not start new course, unit or lab work,** and do not continue the old roadmap. The open
  pull requests from the old plan stay open; do not extend or merge them unless the owner asks.
- **The weekly PHY 2049 content drop continues** as `courses/phy2049/CLAUDE.md` and the
  `flux-content-drop` skill describe.
- Code comments that cite a decision number (D5, D23 …) or `docs/COURSE-STANDARD.md` refer to the
  archive.

## Rules that still hold

1. **Raw course files** (PDF, slides, docs) live only in `courses/<id>/incoming/`, with the
   instructor's permission recorded, and never ship. `packages/checks/raw.mjs` enforces this.
2. **No student names, grades or submissions** anywhere in the repo.
3. **Copy nothing** from textbooks, course packs or MIT OpenCourseWare: no text, figures or
   problem statements. Write our own and cite. MIT's name appears only as attribution.
4. **OCW reference material** is fetched with `npm run ocw -- <slug>` into the git-ignored
   `reference/` folder and is never committed. `docs/ocw/<slug>.md` is the index.
5. **`npm test` and `npm run build` pass before anything is pushed to `main`.** A push to `main`
   publishes the site (`DEPLOY.md`).
6. **Never delete `courses/phy2049/incoming/.canvas-state.json`.** The Canvas ingest needs it.
7. **Permanent deletions are the owner's to make.** Move or archive instead.
