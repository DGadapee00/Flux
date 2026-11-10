# The concept map

One map of concepts that runs across the degree. A concept is a node. Courses are paths through
the map. The labs, notes and problems in `courses/` are where a concept leads.

The approved prototype is `docs/map/prototype-flux-thread.html`. Its 15 concepts are the seed.

## Files

| File | What it holds |
|---|---|
| `subjects.js` | The lanes, top to bottom: id, label, colour token, and its value in each theme. A lane is a subject, not a course. |
| `courses.js` | Each course's code, title, where the owner stands in it (`taken`, `taking now`, `next term`, `later`) and its folder on the hub. A personal project has `kind: 'project'` and no status. |
| `concepts/<id>.js` | One concept per file. The file name is the id. |
| `catalog.js` | Every Flux course's labs, read from that course's own catalog. |
| `applications/` | Projects the map leads to. Each recipe names concepts and labs on the map (`docs/map/applications.md`). |
| `applications/travelers/` | One part followed through the shop, station by station: what the engineer decides, what goes wrong, the paper, and the part's own numbers (`dome-numbers.js`). The first is a friction stir welded tank dome. |
| `applications/decisions/` | A subsystem's Make side: the choices of material, process, joints and finish, one file each, with every figure tied to a source in `refs.js`. `applications/decide.js` computes derived columns and finds picks that rule each other out. |
| `routes.js` | The link from a concept into a course app. |
| `graph.js` | What a concept leads to, its depth and its closure. Shared by the hub and the check. |
| `problems.mjs` | Which practice problems belong to which lab, read from each course's bank. The hub's build ships it for Today. |
| `check.mjs` | The check. `npm test` runs it. |

## A concept

```js
export default {
  id: 'gauss-law',
  title: 'Gauss’s law',
  label: ['Gauss’s law'], // optional: one or two short lines for the map's box
  subject: 'em', // a lane in subjects.js
  courses: ['phy2049'], // where it is taught
  eq: String.raw`\oint \mathbf E\cdot d\mathbf A = \frac{q_\text{enc}}{\varepsilon_0}`,
  idea: String.raw`Fresh text in our own words. Inline TeX as \(E\).`,
  requires: ['surface-flux'], // concept ids
  sources: [
    { title: '…', url: 'https://…', kind: 'Open textbook', level: 'Intro', why: 'Our one-line reason.' },
  ],
  related: [{ id: 'em-waves', note: 'One line on what the two share.' }], // optional: parallels, not prerequisites
  labs: [{ course: 'phy2049', lab: 'gauss', notes: 's11', note: 'One line on what the lab shows.' }],
  // candidate: 'A lab idea.', // required when labs is empty
};
```

- `sources`: two or three. `level` is `Intro`, `Course level` or `Deeper`. Every URL is https.
- `labs[].lab` is an id in that course's `LAB_META`. `labs[].notes` is a section id in the notes
  set for the lab's unit.
- No em dashes in `idea`, `note`, `candidate`, `why`, `title` or `label`.
- A concept with no lab is a gap. Its `candidate` says what lab would fill it.
- `related`: optional. A parallel that is not a prerequisite, such as diffusion and the heat
  equation. `note` says in one line what the two share. Write a pair on one of its two concepts;
  the hub lists it on both, in the reading panel's Parallels row. It draws no line on the map and
  changes no depth, path or gap score. A pair joined by `requires` is not also `related`.

## The check

`node map/check.mjs` (or `npm test -w @flux/map`) fails on a duplicate id, a `requires` that names
no concept, a cycle, a lab or notes section the course does not have, a missing field, a URL that
is not https, TeX that KaTeX cannot parse, an em dash in our prose, and a concept with no lab and no
`candidate`, and a `related` link to no concept, to itself, to a concept it already requires or is
required by, or written twice. It also keeps `courses.js` in step with `packages/tracks/tracks.js`.
