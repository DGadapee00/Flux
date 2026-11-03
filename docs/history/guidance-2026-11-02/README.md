# Archived guidance (2 November 2026)

Everything in this folder told agents how to build Flux under the old plan: every course built
separately, in order, to one standard. The owner retired that plan on 2 November 2026. Flux is
being refactored around a single map of concepts that runs across courses.

These files are history, not instructions. Do not follow them. They are kept so the reasoning
behind the existing material can be looked up: why a unit is ordered as it is, which source it
cites, what a decision number in a code comment refers to.

| Was at | Now at |
|---|---|
| `AGENTS.md` | `AGENTS.md` (the old rulebook; a short replacement sits at the repo root) |
| `ROADMAP.md` | `ROADMAP.md` |
| `DECISIONS.md` | `DECISIONS.md` (D1–D36; code comments cite these numbers) |
| `docs/COURSE-STANDARD.md` | `docs/COURSE-STANDARD.md` |
| `docs/INVENTORY.md` | `docs/INVENTORY.md` |
| `docs/course-plans/` | `docs/course-plans/` (one plan per course) |
| `docs/prompts/` | `docs/prompts/` |
| `docs/superpowers/` | `docs/superpowers/` (Phase 2b plan and design) |
| `.claude/skills/flux-build-unit`, `flux-new-course`, `flux-review-unit` | `skills/` |
| `.cursor/rules/flux.mdc` | `cursor/flux.mdc` |
| `courses/sta3032/CLAUDE.md`, `courses/sta3032/PLAN.md` | `courses/sta3032/` |

Not archived, because they are still in use: `courses/phy2049/CLAUDE.md` and the
`flux-content-drop` skill run the weekly PHY 2049 content drop while the owner is in that class.
Each course's `PROVENANCE.md`, `CONVENTIONS.md`, `ERRATA.md` and `README.md` describe material that
exists, so they stay with their course.
