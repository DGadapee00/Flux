# FLUX

Course apps for a mechanical engineering degree. Each course holds its own labs, notes and
practice problems. The hub is one page: every course, grouped by subject, and one backup file for
the progress the courses keep. Projects, such as the satellite, are courses in the Projects group.

| Where | What |
|---|---|
| `site/` | The hub. |
| `courses/<id>/` | Each course app: labs, notes and problems. |
| `packages/` | Shared core, subject libraries, shells, the track list and checks. |
| `docs/ocw/` | Indexes of the MIT OpenCourseWare material the courses cite. |
| `docs/history/` | Retired plans, kept for the reasoning behind existing material. The concept map and the hub's Today, Map and Build tabs are in `docs/history/map-2026-11-10/`. |

The hub publishes to https://flux-study.pages.dev. `flux.pages.dev` is an unrelated site, so this
project does not use that hostname.

```bash
npm install
npm start               # http://localhost:5173
npm test                # every workspace and the dependency-direction check
npm run smoke           # the hub at 380, 720 and 1280px, every course link
npm run build
```

[DEPLOY.md](DEPLOY.md) covers publishing. [AGENTS.md](AGENTS.md) is the rules, including how to add
a lab.
