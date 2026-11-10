# Archived concept map (10 November 2026)

From 2 to 10 November 2026 Flux was organised around one concept map: 280 concepts, each with an
idea, an equation, prerequisites, sources and the labs that show it. The hub had four tabs: Today
(reviews and the next concept), Map, Build (the satellite recipes and a traveler) and Courses.

The owner retired that layout on 10 November 2026. The hub is now one page of courses grouped by
subject, and all material lives in the course apps. The two projects on the Build tab became
courses in the Projects group: the satellite's recipes moved into `courses/satellite/` and the
tank dome traveler into `courses/dome/`.

Nothing was deleted. Everything the map layer was made of is in this folder, and the last commit
with it working is `9d5e9c5`, tagged `map-2026-11-10`.

These files are history, not instructions. Do not follow them. They are kept so the map can be
brought back, and so a comment in a course that mentions a concept, a lane or `map/paths/…` can be
looked up.

| Was at | Now at |
|---|---|
| `map/` | `map/` (concepts, paths, applications, checks and tests) |
| `MAP.md` | `MAP.md` |
| `docs/map/` | `docs-map/` (the approved prototypes and `applications.md`) |
| `AGENTS.md` | `AGENTS.md` (the map-era rulebook; a replacement sits at the repo root) |
| `README.md` | `README-repo.md` |
| `site/src/map.js`, `find.js`, `layout.js`, `tabs.js` | `site/src/` |
| `site/src/learner/` (Today) | `site/src/learner/` |
| `site/src/applications/` (Build) | `site/src/applications/` |
| `site/index.html`, `site/src/main.js`, `site/src/styles.css`, `site/vite.config.js`, `site/package.json` | `site/` (copies as they were; the live files were cut down) |
| `site/test/` map, find, learner, tabs and applications tests | `site/test/` |
| `site/scripts/smoke.mjs`, `applications-smoke.mjs` | `site/scripts/` |
| `.claude/skills/flux-add-concept`, `flux-audit-course` | `skills/` |
| `.claude/skills/flux-add-lab` | `skills/flux-add-lab` (the map-era copy; a shorter one is still in use) |

## What still runs

Nothing in this folder is an npm workspace, so `npm test` and `npm run build` do not run it. The
imports in these files still point at the old locations (`@flux/map`, `../map/…`).

## Bringing it back

To look at the hub as it was, check out the tag in a second working tree:

```bash
git worktree add ../flux-map map-2026-11-10
cd ../flux-map && npm ci && npm start
```

To restore it in place:

1. Move `map/` back to the repo root. Add `"map"` to `workspaces` in the root `package.json`, and
   the `map-audit`, `map-sources` and `map-gaps` scripts (see `git show map-2026-11-10:package.json`).
2. Move `site/src/`, `site/test/` and `site/scripts/` from here back into `site/`. The copies of
   `index.html`, `main.js`, `styles.css`, `vite.config.js` and `package.json` are the versions the
   tabs need. Merge them with what the hub has now.
3. Give the `map` layer back to `packages/checks/deps.mjs`
   (`git show map-2026-11-10:packages/checks/deps.mjs`).
4. Run `node map/check.mjs`. Labs added or renamed in the course apps since this date are not on
   the map, and `npm run map-audit` lists them.

The satellite recipes, the Structure decisions and the dome traveler here are the originals. The
copies in `courses/satellite/` and `courses/dome/` are the ones kept up to date.
