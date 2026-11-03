---
name: flux-add-concept
description: Add one concept to the Flux concept map (map/concepts/<id>.js), with fresh idea text, checked sources and its lab or a lab candidate. Use when asked to add, write or fill in a concept on the map.
---

# Add a concept to the map

1. **Pick the place.** Read `map/README.md`. Choose the `subject` lane in `map/subjects.js` and the
   concepts it `requires`. Check that it is not already there: `ls map/concepts`.
2. **Write the file** `map/concepts/<id>.js`. The id is kebab-case and is the file name.
   - `idea`: three to five short sentences in our own words. What it is, why it is true, where it
     is used. No em dashes, no filler. Inline TeX as `\( \)`.
   - `eq`: the key equation in TeX.
   - `courses`: every course id in `map/courses.js` that teaches it.
   - `label`: optional, one or two short lines for the map box.
3. **Sources: two or three.** Open each link and read the page before citing it. Prefer free,
   stable material: OpenStax, MIT OCW (the `docs/ocw/*.md` indexes list real pages), PhET, free
   textbooks. Give `kind`, `level` (`Intro`, `Course level`, `Deeper`), our own one-line `why`, and
   `checked: 'YYYY-MM-DD'`. Never copy text from a source.
4. **Labs.** For each Flux lab that shows it: `{ course, lab, notes, note }`. `lab` is an id in that
   course's `LAB_META`; `notes` is a section id (or a list) from its notes index, `unit/sN` for a
   section in another unit. With no lab, write a `candidate`: one or two sentences on the lab that
   would show it, and what it would check.
5. **Paths.** If a course in `courses` has `map/paths/<course>.js`, add the id in teaching order,
   after its prerequisites.
6. **Check.** `node map/check.mjs`, `npm run map-sources` (your new links must load), then open the
   hub (`npm start`) at `#<id>` and read the panel. Before a PR: `npm test`, `npm run build`,
   `node packages/checks/raw.mjs`, and the screenshots in `AGENTS.md`.
