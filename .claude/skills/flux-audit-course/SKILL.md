---
name: flux-audit-course
description: Audit one course onto the Flux concept map, so every lab and notes section map-audit lists is attached to a concept, with the course's path written. Use when asked to audit a course or put a course on the map.
---

# Audit a course onto the map

One course per pull request.

1. **List.** `npm run map-audit -- --course <id>` lists that course's labs and notes sections that
   no concept references.
2. **Read each one.** For a lab: its header comment, scenarios and `recompute`. For a notes
   section: the section in `src/notes/content/`. Note what idea it actually shows.
3. **Attach or write.** Add the lab to an existing concept's `labs`, with the notes sections that
   teach it, or write the concept it shows with `flux-add-concept`. Formula sheets and reviews are
   not concepts and are not counted.
4. **Look for breakage.** Open every lab from the hub's map link on the built site
   (`npm run build`, then serve `site/dist`) and watch for errors or empty scenes. Check a few of
   its numbers against a closed form you work out yourself. **Record** anything broken or wrong in
   the PR. Do not fix a lab in an audit PR.
5. **Write the path.** `map/paths/<id>.js`: every concept that lists the course, in teaching order,
   under the app's unit titles. Concepts the app does not teach yet go last, under a heading that
   says so; they are the course's gaps.
6. **Finish when** `map-audit` lists nothing for the course. Run `npm test`, `npm run build`,
   `node packages/checks/raw.mjs`, `npm run smoke` and `npm run map-sources`, and take the
   screenshots in `AGENTS.md` with the course's path chosen.
7. **Report** in the PR: the concepts added and changed, the path, every lab checked and how, and
   anything broken or wrong.
