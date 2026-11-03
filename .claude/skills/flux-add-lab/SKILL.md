---
name: flux-add-lab
description: Build a Flux lab for a gap on the concept map, scaffolded with npm run new-lab, with numbers checked by a second method, then linked from its concept. Use when asked to build or add a lab.
---

# Add a lab for a gap

A lab is built for a gap on the map, not for a course checklist.

1. **Pick the gap.** `npm run map-gaps` ranks concepts with no lab. Read the concept file and its
   `candidate`. The lab must show that concept's idea; if it would show something else, add or
   change the concept first (`flux-add-concept`).
2. **Choose the course app.** The course in the concept's `courses` the owner is taking now or
   next, if it has an app (`app` in `map/courses.js`). Pick the unit it belongs in.
3. **Scaffold.**
   `npm run new-lab -- <course> <lab-id> --kind plot|scene2d|scene3d --unit <unit> --title "Title"`
   It writes the lab file, its `LAB_META` entry, the loader entry and two prediction stubs.
4. **Write the physics or math** in the course's library (`packages/subjects/` when it is shared),
   not in the drawing code. Cite sources in comments; copy nothing.
5. **Check it two ways.** `recompute` returns the lab's numbers from the closed form. The course's
   `labs-check` must also compute them by a second method (numeric integration, a sum, a different
   route through the algebra) and require agreement on every scenario. Fill the predictions from
   the lab's own numbers.
6. **Link it.** In `map/concepts/<id>.js`, add `{ course, lab, notes, note }` to `labs`. Remove the
   `candidate` if the lab covers it.
7. **Check.** The course's own tests, `npm test`, `npm run build`, `node packages/checks/raw.mjs`,
   `npm run smoke`, and screenshots of the lab and of the concept on the hub at 390×844 and
   1280×800, light and dark. Look at each one.
