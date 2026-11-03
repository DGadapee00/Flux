# Flux: rules for agents

Flux is one concept map that runs across the degree. Each concept is a node: a short idea in our
own words, its key equation, what it builds on, where it leads, two or three vetted sources, and the
Flux lab and notes that show it. Courses are paths through the map. The labs, notes and problems in
`courses/` are where the map leads, and they stay.

The map grows one concept, one thread or one lab at a time. A concept with no lab is a visible gap,
and gaps decide what gets built next.

- The data is in `map/` (`map/README.md` has the shape). `MAP.md` says what it covers.
- The hub (`site/`) opens on the map. The course apps are reached from it.
- The approved look and data shape are in `docs/map/prototype-flux-thread.html`.
- The old course-by-course plan is archived in `docs/history/guidance-2026-11-02/`. It is history.
  Do not follow it. Code comments that cite a decision number (D5, D23 …) or
  `docs/COURSE-STANDARD.md` refer to that archive.

## Rules that protect the repo

1. **Raw course files** (PDF, slides, docs) live only in `courses/<id>/incoming/`, with the
   instructor's permission recorded, and never ship. `packages/checks/raw.mjs` enforces this.
2. **No student names, grades or submissions** anywhere in the repo.
3. **Copy nothing** from textbooks, course packs or MIT OpenCourseWare: no text, figures or
   problem statements. Write our own and cite. MIT's name appears only as attribution. A concept's
   idea is written fresh; a source is a link with our own one-line reason.
4. **OCW reference material** is fetched with `npm run ocw -- <slug>` into the git-ignored
   `reference/` folder and is never committed. `docs/ocw/<slug>.md` is the index.
5. **`npm test` and `npm run build` pass before anything is pushed to `main`.** A push to `main`
   publishes the site (`DEPLOY.md`).
6. **Never delete `courses/phy2049/incoming/.canvas-state.json`.** The Canvas ingest needs it.
7. **Permanent deletions are the owner's to make.** Move or archive instead.
8. **The weekly PHY 2049 content drop continues** as `courses/phy2049/CLAUDE.md` and the
   `flux-content-drop` skill describe. Leave those files, `.github/workflows/canvas-ingest.yml` and
   everything under `courses/*/incoming/` alone unless the task is the content drop.
9. **Existing labs, notes, problems, libraries and shells are not rewritten, moved or deleted** to
   fit the map. Touch them only where the map must link in (a route, an id).
10. **Old-plan pull requests** stay as they are. Do not extend or merge them unless the owner asks.

## The map

`npm test` runs `map/check.mjs`. It fails on a duplicate id, a prerequisite that names no concept, a
cycle, a lab or notes section the course does not have, a missing field, a URL that is not https,
TeX KaTeX cannot parse, an em dash in our prose, a concept with no lab and no `candidate`, and a
course path that does not match its concepts.

| Command | What it does |
|---|---|
| `npm run map-audit` | Every lab and notes section that no concept references, by course. |
| `npm run map-gaps` | Concepts with no lab, ranked by how much a lab would serve. |
| `npm run map-sources` | Opens every source without a `checked` date and prints its status and title. |
| `npm run new-lab` | Scaffolds a lab inside a course app. |

### Add a concept

Use the `flux-add-concept` skill. In short: one file, `map/concepts/<id>.js`, with `id`, `title`,
`subject`, `courses`, `eq`, `idea`, `requires`, `sources`, and `labs` or a `candidate`. Open every
source link and read it before you cite it, then set `checked` to the date. If the concept is
taught in a course that has a path, add it to `map/paths/<course>.js`.

### Add a thread

A thread is a chain of `requires` that crosses lanes, like flux running from Calculus III through
Gauss's law to control volumes and heat transfer. To add one, add the concepts it needs and the
`requires` edges between them. Each concept's idea says, in a sentence, how it uses the one before.
Check the chain on the hub: choose its last concept and the solid lines should trace the thread.

### Add a lab

A lab is built for a gap on the map, not for a course checklist. Start from `npm run map-gaps` or a
concept's `candidate`. Use the `flux-add-lab` skill, which builds on `npm run new-lab`. When the lab
works, put it in the concept's `labs` and drop the `candidate` if the lab covers it.

**Every lab recomputes its numbers and checks them by a second method in its course's tests.** A
closed form against a numeric integration, a sum against an integral, one route through the
algebra against another. The course's `labs-check` runs both on every scenario. A lab whose numbers
are checked only one way is not done.

### Applications

An application is a project the map leads to, such as a satellite built subsystem by subsystem.
Its recipes are in `map/applications/` and name concepts and labs already on the map; they add no
new labs. A recipe's `gap` says what is still to build, and `npm run map-gaps` ranks a gap higher
when a recipe needs it. `docs/map/applications.md` has the rules for capability records.

### Audit a course

Use the `flux-audit-course` skill: read each lab and notes section `map-audit` lists, attach it to a
concept or write the concept it shows, and record anything broken or wrong in the PR. Do not fix a
lab in an audit PR.

## Voice

For idea text, notes, labels, docs and commit messages:

- Short plain sentences. One idea each.
- No em dashes. Use a full stop, a colon or a comma.
- No filler: no "simply", "just", "very", "basically", "it is important to note".
- Say what a thing does, not that it is powerful or elegant.
- Equations in TeX: `\( \)` inline, and `eq` for the concept's key equation.

## Checks before a pull request

`npm test`, `npm run build` and `node packages/checks/raw.mjs`. For any change a person sees, take
screenshots at 390×844 and 1280×800 in light and dark and look at every one: nothing overlaps,
clips or scrolls sideways. `npm run smoke` drives the hub and follows every map lab link.
