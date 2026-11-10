# A tank dome through the shop

A project, listed under Projects in the hub. It is one page: a traveler, which follows one
manufactured part through the shop, station by station. The part is a friction stir welded
propellant tank dome, the development article NASA built at Marshall.

Every station shows the same things in the same places: what the engineer decides, what goes
wrong (why, and how it is found), the paper it leaves, what to ask on the floor, the foundations
behind it and its sources. The dome's own numbers follow it. Set the design pressure and the
diameter at the first station and they return at the panels, the inspection, the repairs and the
proof test. Four cases give a shop-floor situation to judge. A case is reviewed in a Claude Project
from a brief the page builds. Flux keeps none of it.

The satellite guide's Joints decision links here from its Welded option, to show how the process
is run.

This page was on the hub's Build tab until 10 November 2026. Its data moved here from
`map/applications/travelers/` (archived in `docs/history/map-2026-11-10/`).

| In `src/` | What |
|---|---|
| `traveler.js` | The eleven stations, the four cases and the references. |
| `dome-numbers.js` | The dome's numbers from the pressure and the diameter. |
| `text.js` | How the numbers read at a station. |
| `foundations.js` | The ideas behind the stations, and the lab in a course that teaches each. |
| `brief.js` | The Project instructions and the case brief, as plain text. |
| `view.js` | The page. It uses the project shell (`packages/shells/project/`). |

`npm test -w @flux/dome` checks the data and the briefs, and every number a second way: the seam
loads against a force balance by integration, the weld land against the stress it then carries.
`packages/checks/test/project-links.test.js` fails when a lab or notes section the page links to is
gone from its course.

Run the dev server with `npm run dev -w @flux/dome` (port 5193).
