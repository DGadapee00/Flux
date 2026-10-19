---
name: flux-new-course
description: Start a new Flux course from its spine in docs/courses/<id>.md, through the first slice (skeleton plus Unit 1 to the standard). Use when ROADMAP.md says a course is next and its folder does not exist yet.
---

# Start a new Flux course

A new course is the same app as PHY 2049 and Dynamics with different content. This procedure gets
it there without inventing a new shape.

## 0. Gate

- The course is the first unchecked item in `ROADMAP.md`'s build list, or the owner asked for it.
- `docs/courses/<id>.md` exists and its status is **confirmed** by the owner. If it is **draft**, do
  step 1 only, open a PR with the completed spine, and stop.
- Fewer than two other courses have units in progress (DECISIONS.md, D18).

## 1. Complete the spine (a docs-only PR)

Fill every section of `docs/courses/TEMPLATE.md` that the draft leaves open:

1. **OCW program first** (D23). Open the counterpart's syllabus and calendar. Set the units and
   their order from it. For each unit, name the OCW lectures, problem sets and exams, and which
   have posted solutions. Note what OCW covers past the UNF course.
2. **Textbook second.** List the candidates with their licences, verified on the publisher's page.
   The owner chooses (D21). Prefer open texts. Map each unit to its sections.
3. **UNF syllabus third,** if the owner has given one (in `courses/<id>/incoming/` or the
   conversation): exam dates, exam style, and any topic OCW lacks, added to the right unit.
4. **Labs.** For each unit: the labs (each with "Shows that …", how it recomputes, and its second
   method), one application lab on a real everyday or industrial device, two predictions per lab,
   the problem families by structure, and the traps.
5. **Libraries.** Which `subjects` modules exist already (search before you plan a new one), and which
   new ones are needed.
6. **Open questions** for the owner.

Open the PR, ask the owner to confirm, and stop.

## 2. First slice (after the owner confirms)

Copy the shape of `courses/egn3321` (engineering shell) or `courses/mac2311` (math shell). Do not
copy their content.

1. `courses/<id>/` with `package.json`, `vite.config.js` (port from `AGENTS.md`), `index.html`,
   `src/manifest.js` (`standard: false`, `track`, `order`, `prereqs`), `src/data/catalog.js` with
   **every** unit (unbuilt labs in `coming`), `src/data/textbook.js` (the citation map; nothing
   copied), the two shell wrappers in `src/ui/`, `src/storage.js` with `flux.<id>.*` keys.
2. `PROVENANCE.md`: what the course contains, the sources and their licences (OCW program, then
   textbook, then any UNF syllabus), and that nothing is copied. `CONVENTIONS.md`: significant
   figures, units, sign conventions, sections left out.
3. Scripts copied from EGN 3321 and pointed at this course: tex-check, problems-check, labs-check,
   notes-check, route test, layout.
4. The root `package.json` build gains the course; `packages/tracks/tracks.js` gains it with its
   `href`; the hub backup includes its storage keys.
5. **Unit 1 to the standard**, by the `flux-build-unit` skill.
6. `npm test`, `npm run build`, the course's layout script at 380×820 and 1280×800, and
   `npm run scorecard -- --units`. Look at every screenshot.
7. Self-review with `flux-review-unit`. PR with the scorecard table and the screenshots. Tick the
   roadmap and set the spine's status to **building**.
