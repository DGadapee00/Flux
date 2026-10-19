# STARTER: the course to copy

This is the wiring of a Flux course on the engineering shell with one example unit: one lab, three
problem templates, one notes file and its lab setup. It names no real course. It is a workspace,
so `npm test` runs its checks, but it is not built into the site and not listed in the hub.

To start a course, follow `.claude/skills/flux-new-course`. In short:

1. Copy this folder to `courses/<id>/`.
2. Replace `starter` and `STARTER` everywhere (`src/manifest.js`, `src/storage.js`,
   `src/engine/router.js`, `index.html`, `package.json`), and set the port from `AGENTS.md`.
3. Replace everything marked EXAMPLE with the spine's content: the catalog, labs, bank, coaching,
   principles, notes, setups, `src/data/textbook.js`, `PROVENANCE.md`, `CONVENTIONS.md`.
4. Add the course to the root `package.json` build and to `packages/tracks/tracks.js`.

Content and its depth come from PHY 2049, the benchmark (DECISIONS.md, D32). This folder supplies
only the shape. Run the dev server with `npm run dev -w @flux/starter` (port 5199).
