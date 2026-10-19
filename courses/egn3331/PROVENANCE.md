# Provenance

EGN 3331 Mechanics of Materials lives in this folder. There is no earlier repo to snapshot. The
course is written here. Unit 1 is in; Phase R stopped the course at that first slice.

## Textbook (DECISIONS.md, D14)

| Source | Licence | Used for |
|---|---|---|
| David Roylance, *Mechanics of Materials*, MIT OpenCourseWare, course 3.11, Fall 1999 (ocw.mit.edu/courses/3-11-mechanics-of-materials-fall-1999) | CC BY-NC-SA 4.0 | the readings, cited by section |

Nothing is copied from the modules: no prose, figures, tables, worked examples or problems. Flux
writes its own text. The modules appear only as citations: section numbers and titles, all in one
map, `src/data/textbook.js`. OpenCourseWare posts the modules as unnumbered files; the numbers are
the collected Engineering LibreTexts edition's, which keeps the same titles and order.

Topics the modules do not treat (bearing stress, the factor of safety, statically indeterminate
axial members, thermal stress, combined loading, column buckling) are cited by topic only.

The course pack sets which topics are covered and in what order (D11). Nothing from the pack ships.

## What course material is here

Unit 1 is stress. The labs are an axially loaded bar cut on an inclined plane (`cut`), a Pratt
truss with member areas the student sets (`truss-stress`), and a pinned lap joint or clevis
(`pins`). The problems cover internal loads by the method of sections, average normal stress in SI
and English units, stress on an inclined plane, a glued scarf joint, truss member stress and
sizing, pins in double shear, shear against bearing, and the factor of safety.

All numbers in the problems are generated. Worked cases use numbers computed for this bank and
cite the section their method comes from. No textbook example or problem number is copied or
invented.

## Notes

`src/notes/content/u1-stress.html` is written for Flux. It cites Roylance by section through the
same map; `scripts/notes-check.mjs` fails on a citation the map does not give.

## Instructor material

None. No instructor notes, slides, homework or exams are in this folder.
