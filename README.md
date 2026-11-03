# FLUX

One concept map for the degree. Each concept is a node: a short idea, its key equation, what it
builds on, where it leads, sources worth your time, and the Flux lab and notes that show it.
Courses are paths through the map. A concept with no lab is a visible gap.

The hub opens on a local view of the map: the chosen concept, what it builds on and what it leads
to, one step each way, beside its reading panel. Widen it to two steps or the full map, or choose a
course to see its path in teaching order. The find box (press `/`) opens a concept, a subject or a
course by name. Show only some subjects, zoom out to see the whole map, and move between boxes
with the arrow keys. The course apps below the map open each course as it is today.

| Where | What |
|---|---|
| `map/` | The map's data and its check: subjects, courses, concepts, course paths. See `map/README.md`. |
| `MAP.md` | What the map covers and which gaps are most worth a lab. |
| `site/` | The hub. |
| `courses/<id>/` | Each course app: labs, notes and problems. The map links into them. |
| `packages/` | Shared core, subject libraries, shells, track list and checks. |
| `docs/map/` | The approved prototype the hub is drawn from. |
| `docs/history/` | Retired plans, kept for the reasoning behind existing material. |

The hub publishes to https://flux-study.pages.dev. `flux.pages.dev` is an unrelated site, so this
project does not use that hostname.

```bash
npm install
npm start               # http://localhost:5173
npm test                # every workspace, the map check and the dependency-direction check
npm run smoke           # the hub at 380, 720 and 1280px, every map lab link
npm run build
npm run map-audit       # labs and notes sections no concept references
npm run map-gaps        # concepts with no lab, most worth building first
npm run map-sources     # open every unchecked source link
```

[DEPLOY.md](DEPLOY.md) covers publishing. [AGENTS.md](AGENTS.md) is the rules, including how to add
a concept, a thread and a lab.
