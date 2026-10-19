# <CODE> <Title>

A spine is the plan for one course: what it covers, in what order, from which sources, and what
its labs and problems are. An agent builds from the spine and nothing else about the course. The
owner signs it off before any code is written (`.claude/skills/flux-new-course`).

Status: **draft** | **confirmed** (owner, date) | **building** | **standard** (owner reviewed, date)

| | |
|---|---|
| Folder and id | `courses/<id>` (the code in lowercase, no space) |
| Port | 51xx (next free; list in `AGENTS.md`) |
| Track, order | `<track>`, n |
| Shell | `math`, `engineering` or `physics`. A course writes no HUD of its own. |
| Subject libraries | existing modules it reuses; new modules it needs, each with a selftest |
| When the owner takes it | term, from Degree Works; "taken" for a review course |

## Sources

In this order of authority (D23):

1. **MIT OpenCourseWare: the program** (D15, D23). Course number, title, term and URL. What it
   has: lecture notes, problem sets, solutions, exams, videos. Its calendar sets the units and
   their order, its problem sets set the level-3 difficulty, and its posted solutions are the
   printed answers our worked cases reproduce (`docs/COURSE-STANDARD.md`, section 7).
2. **Textbook, cited by section** through `courses/<id>/src/data/textbook.js` (D7, D13, D14, D21).
   Open-licensed where one exists. Fills in what OCW does not cover. Nothing copied.
3. **UNF syllabus or course pack**, when available: exam dates, exam style, and any topic UNF
   covers that OCW does not, which is added. Nothing from it ships unless the instructor agrees
   in writing. Status: not seen / seen (date).

- **Another view.** A second OCW course or free text a notes section can link to.

## Exam style

What the UNF exams ask (closed or open book, formula sheet, calculator, how many problems, how
much is conceptual). Until the owner has seen one, write "unknown" and default to: four to six
multi-part numeric problems and a short conceptual part.

## Units

One block per unit, in the OCW counterpart's order.

**Unit n. Title** (OCW lectures, then text §§)

- Topics, in order.
- Labs. Each: `id`, the intuition it corrects ("Shows that …"), how it recomputes, and the second
  method that checks it.
- Application lab: a real, everyday or industrial device the unit's equations fully explain, with
  real numbers and a cited source for them.
- Problem families. Name the structure that varies (configuration, unknown, representation), not
  the number ranges.
- Traps to seed: the specific mistakes students make here, each with the wrong value it produces.
- Predictions to seed: two per lab.

## Prerequisite links

`prereqs` into earlier courses (built or not), so a section can point back to where an idea was
taught.

## Open questions

What the owner must answer before this spine is confirmed.
