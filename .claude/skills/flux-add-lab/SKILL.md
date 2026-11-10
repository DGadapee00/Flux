---
name: flux-add-lab
description: Build a Flux lab inside a course app, scaffolded with npm run new-lab, with numbers checked by a second method. Use when asked to build or add a lab.
---

# Add a lab

A lab shows one idea. It lives in the course and the unit that teach that idea.

1. **Name the idea.** One sentence: what the learner changes and what they see follow from it. If
   two ideas are in play, that is two labs.
2. **Choose the course app and the unit.** Read the course's `src/data/catalog.js` for its units
   and the labs each already has.
3. **Scaffold.**
   `npm run new-lab -- <course> <lab-id> --kind plot|scene2d|scene3d --unit <unit> --title "Title"`
   It writes the lab file, its `LAB_META` entry, the loader entry and two prediction stubs.
4. **Write the physics or math** in the course's library (`packages/subjects/` when it is shared),
   not in the drawing code. Cite sources in comments; copy nothing.
5. **Check it two ways.** `recompute` returns the lab's numbers from the closed form. The course's
   `labs-check` must also compute them by a second method (numeric integration, a sum, a different
   route through the algebra) and require agreement on every scenario. Fill the predictions from
   the lab's own numbers.
6. **Check.** The course's own tests, `npm test`, `npm run build`, `node packages/checks/raw.mjs`,
   and screenshots of the lab at 390×844 and 1280×800, light and dark. Look at each one.
