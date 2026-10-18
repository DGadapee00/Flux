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
| Shell | `math` or `engineering` (or `physics` after Phase 2b). A course writes no HUD of its own. |
| Subject libraries | existing modules it reuses; new modules it needs, each with a selftest |
| When the owner takes it | term, from Degree Works; "taken" for a review course |

## Sources

- **UNF syllabus or course pack.** Sets coverage and order only (D11). Nothing from it ships unless
  the instructor agrees in writing (rule 8). Status: not seen / seen (date).
- **Textbook, cited by section** through `courses/<id>/src/data/textbook.js` (D7, D13, D14).
  Open-licensed where one exists. Nothing copied.
- **MIT OpenCourseWare: the standard** (D15). Course number, title, term and URL. What it has:
  lecture notes, problem sets, solutions, exams, videos. How Flux uses it: the coverage check for
  each unit, the difficulty bar for level-3 problems, and the source of cited worked cases whose
  printed answers our templates reproduce (`docs/COURSE-STANDARD.md`, section 7).
- **Another view.** A second OCW course or free text a notes section can link to.

## Exam style

What the UNF exams ask (closed or open book, formula sheet, calculator, how many problems, how
much is conceptual). Until the owner has seen one, write "unknown" and default to: four to six
multi-part numeric problems and a short conceptual part.

## Units

One block per unit, in the course's order.

**Unit n. Title** (text §§, OCW lectures or unit)

- Topics, in order.
- Labs. Each: `id`, the intuition it corrects ("Shows that …"), how it recomputes, and the second
  method that checks it.
- Application lab: a real device the unit's equations fully explain, with real numbers. Prefer the
  25 lbf engine and its stand (`ROADMAP.md`, Applications).
- Problem families. Name the structure that varies (configuration, unknown, representation), not
  the number ranges.
- Traps to seed: the specific mistakes students make here, each with the wrong value it produces.
- Predictions to seed: two per lab.

## Prerequisite links

`prereqs` into earlier courses (built or not), so a section can point back to where an idea was
taught.

## Applications hooks

Which rocket component pages this course teaches (`teaches` links), and which of its labs they
open.

## Open questions

What the owner must answer before this spine is confirmed.
