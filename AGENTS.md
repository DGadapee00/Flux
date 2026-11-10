# Flux: rules for agents

Flux is a set of course apps. Each course holds its own labs, notes and practice problems. The hub
(`site/`) is one page: every course, grouped by subject, and one backup of the progress the
courses keep. Projects, such as the satellite, are courses in the Projects group.

- A course is a folder, `courses/<id>/`. `courses/README.md` says what one is made of.
- The hub's groups are in `packages/tracks/tracks.js`. `site/courses.js` lists the course folders
  the hub serves.
- Two earlier plans are archived. They are history. Do not follow them.
  - `docs/history/guidance-2026-11-02/`: every course built in order to one standard. Code
    comments that cite a decision number (D5, D23 …) or `docs/COURSE-STANDARD.md` refer to it.
  - `docs/history/map-2026-11-10/`: one concept map across the degree, with the hub's Today, Map
    and Build tabs. Code comments that mention the map, a concept, a lane or `map/paths/…` refer
    to it. Its README says how to bring the map back.

## Rules that protect the repo

1. **Raw course files** (PDF, slides, docs) live only in `courses/<id>/incoming/`, with the
   instructor's permission recorded, and never ship. `packages/checks/raw.mjs` enforces this.
2. **No student names, grades or submissions** anywhere in the repo.
3. **Copy nothing** from textbooks, course packs or MIT OpenCourseWare: no text, figures or
   problem statements. Write our own and cite. MIT's name appears only as attribution. A source is
   a link with our own one-line reason, opened and read before it is cited.
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
   fit a new layout. Change one only when the task is about that material.
10. **Old-plan pull requests** stay as they are. Do not extend or merge them unless the owner asks.

## Courses

A course app is a manifest, a catalog of units, its labs, its notes and its problem bank. It
imports `@flux/core`, `@flux/subjects`, `@flux/shells` and `@flux/tracks`. `npm test` runs
`packages/checks/deps.mjs`, which fails when the direction is broken: courses → shells →
subjects → core.

| Command | What it does |
|---|---|
| `npm start` | The hub on port 5173, with every course served under `/<id>/`. |
| `npm run dev -w @flux/<id>` | One course on its own port. |
| `npm run new-lab` | Scaffolds a lab inside a course app. |
| `npm run scorecard` | Measures each course unit by unit. |
| `npm run smoke` | Drives the hub at three widths and follows every course link. |

### Add a course

A new course is a workspace in `courses/<id>/`. The hub finds it in four places:

1. `packages/tracks/tracks.js`: its group, code, title and `href`.
2. `site/courses.js`: the folders the hub serves and `scripts/assemble.mjs` copies.
3. The root `package.json` build script: `npm run build -w @flux/<id>`, before the site.
4. `site/test/tracks.test.js`: the lists the hub is checked against.

A course that keeps progress also goes in `site/src/backup.js`, and one with a manifest in
`packages/checks/scorecard.mjs` and `packages/checks/prereqs.mjs`.

### Add a lab

Use the `flux-add-lab` skill, which builds on `npm run new-lab`. A lab goes in the course and the
unit that teach its idea.

**Every lab recomputes its numbers and checks them by a second method in its course's tests.** A
closed form against a numeric integration, a sum against an integral, one route through the
algebra against another. The course's `labs-check` runs both on every scenario. A lab whose numbers
are checked only one way is not done.

### Projects

A project is a course in the Projects group of `packages/tracks/tracks.js`.

- **Build a satellite** (`courses/satellite/`) has two pages. The guide (`guide.html`) is its front
  page: seven subsystems, each a how-to with a method, references and a checklist, reviewed in a
  Claude Project from a brief the page builds. Structure also has decisions on material, process,
  joints and finish. The labs (`index.html`) show the aerospace ideas no degree course teaches.
- **A tank dome through the shop** (`courses/dome/`) is one page: a traveler, which follows one
  part through the shop, station by station, to show how a process is run. It shows what the
  engineer decides, what goes wrong and the paper each step leaves. The satellite's Joints decision
  links to it.
- **Electronics on the bench** (`courses/bench/`) and **Design practice** (`courses/design/`).

A project page reads as a document, not a lab stage. It uses the project shell
(`packages/shells/project/`) and keeps none of the learner's work.

Every figure a project quotes names a source that was read, and the project's tests check it. A
project links into other courses' labs as plain data: course, unit, lab and title.
`packages/checks/test/project-links.test.js` fails when a linked lab or notes section is gone.

## Voice

For notes, labels, docs and commit messages:

- Short plain sentences. One idea each.
- No em dashes. Use a full stop, a colon or a comma.
- No filler: no "simply", "just", "very", "basically", "it is important to note".
- Say what a thing does, not that it is powerful or elegant.
- Equations in TeX: `\( \)` inline.

## Checks before a pull request

`npm test`, `npm run build` and `node packages/checks/raw.mjs`. For any change a person sees, take
screenshots at 390×844 and 1280×800 in light and dark and look at every one: nothing overlaps,
clips or scrolls sideways. `npm run smoke` drives the hub and follows every course link.
