# Retired project courses (17 November 2026)

The owner retired Bench and Tank Dome on 17 November 2026.

Why: Flux is for understanding. Breadboard skill is learned with real parts on a real bench, and a
shop traveler is a build log, not a course. Neither served a project the owner was building, so
neither would be used when it was needed. They added weight to the hub.

Nothing was deleted. The last commit with both courses on the hub is `e95485e`.

| Was at | Now at |
|---|---|
| `courses/bench/` | `bench/` |
| `courses/dome/` | `dome/` |
| `site/src/applications/` (dome re-exports) | `site-applications/` |
| `site/test/dome-*.test.js`, `equipment-state.test.js` | `site-test/` |
| `site/scripts/project-courses-smoke.mjs` | `site-test/` |

Still in place:

- `site/src/backup.js` keeps a `bench` and a `dome` store with the old keys, so progress stays and
  older backup files still restore.
- `packages/subjects/src/em/breadboard.js` and `packages/subjects/src/mechanics/tank-dome.js` and
  their tests.

To bring a course back, move its folder to `courses/<id>/` and follow "Add a course" in the root
`AGENTS.md`.

These files are history, not instructions. Do not follow them.
