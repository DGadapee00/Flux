# Build a satellite

A project, listed under Projects in the hub. It has two pages.

- **The guide** (`guide.html`, `src/guide/`) is the front page. It takes the satellite one subsystem
  at a time: the foundations and the course that teaches each, the Flux labs to explore, a method,
  references and a checklist. Structure also has a Make side: four decisions on material, process,
  joints and finish. The work is reviewed in a Claude Project from a brief the page builds. Flux
  keeps none of it.
- **The labs** (`index.html`) are the course app on the engineering shell: the aerospace ideas the
  subsystems need that no degree course teaches.

The guide was the hub's Build tab until 10 November 2026. Its data moved here from
`map/applications/` (archived in `docs/history/map-2026-11-10/`).

| In `src/guide/` | What |
|---|---|
| `recipes.js` | The seven subsystems and the integration step. |
| `decisions/` | The Structure decisions. Every figure names a source that was read (`refs.js`). |
| `foundations.js` | The ideas the recipes rest on, and the lab in a course that teaches each. |
| `brief.js` | The Project instructions, the review brief and the decision record, as plain text. |
| `view.js`, `make.js` | The page. |

`scripts/guide.test.mjs` checks the data and the briefs. `packages/checks/test/project-links.test.js`
fails when a lab or notes section the guide links to is gone from its course.

Unit 1 is Orbit. Its first lab puts a craft on an elliptical orbit with a clock (`kepler`).

The math is in `packages/subjects/src/mechanics/kepler.js`. Each lab checks its numbers by a second
method on every scenario and slider stop (`npm test -w @flux/satellite`).

Run the dev server with `npm run dev -w @flux/satellite` (port 5191). The guide is at `/guide.html`.
