# Prompt: build PHY 2048 Unit 2 (Motion in two and three dimensions)

Paste everything below the line into a fresh Claude Code session on the Flux repo
(`DGadapee00/Flux`). It stands alone.

---

You are building **Unit 2 of PHY 2048 Physics I** in the Flux study platform, to the platform's
standard. Unit 1 is finished and is your model. Work on branch `claude/sharp-lovelace-iv2atn`
(create it from `origin/claude/sharp-lovelace-iv2atn` if it is not checked out). Do not push to
another branch. Do not open a pull request unless asked. Never set `standard: true`; the owner does.

## Read first, in this order

1. `AGENTS.md` (the rules bind every change) and `DECISIONS.md` (do not reopen settled decisions;
   D33 says PHY 2048 is built from OpenStax *University Physics Volume 1* alone, no MIT OCW).
2. `docs/course-plans/phy2048.md`, the **Unit 2** block. It is the spine and the plan. If the spine
   and the code disagree, stop and say so.
3. `docs/COURSE-STANDARD.md`, in full.
4. `courses/phy2048/CONVENTIONS.md` and `courses/phy2048/src/data/textbook.js`.
5. `.claude/skills/flux-build-unit/SKILL.md` and `.claude/skills/flux-review-unit/SKILL.md`. Their
   OCW steps do not apply here (D33): the OpenStax book is the only source.
6. Unit 1 as the template. Read these and copy their shape, not their content:
   - labs: `courses/phy2048/src/labs/{kinematics-graphs,stopping-distance,vectors}.js`,
     `src/labs/define.js`, `src/scene/kit.js`, `src/engine/pointer.js`
   - problems: `src/problems/bank/{ch1,ch2,ch3}.js`, `src/problems/coaching/u1.js`,
     `src/problems/kit.js`, `src/problems/simbridge.js`
   - notes: `src/notes/{index.js,setups.js}`, `src/notes/units/u1.js`, `src/notes/setups/u1.js`,
     `src/notes/content/u1-units-vectors-and-motion.html`
   - checks: `scripts/{labs-check,problems-check,notes-check,smoke}.mjs`
   - physics: `packages/subjects/src/mechanics/{kinematics,vectors}.js` and
     `motion-selftest.js`

## Where the book is

`openstax.org` is blocked in this sandbox. The book's source is public on GitHub:
`openstax/osbooks-university-physics-bundle`. Use the `add_repo` tool to attach it (owner
`openstax`, repo `osbooks-university-physics-bundle`), clone it shallowly, and read Chapter 4 from
`modules/m58288` to `modules/m58293` (`index.cnxml`). Strip tags to read the text. Read the full
solution of every worked example you cite. The licence is CC BY-NC-SA 4.0. **Copy nothing:** write
fresh statements, fresh figures and fresh prose, and cite by section and example title.

## What Unit 2 is

Chapter 4, sections §4.1 to §4.5 (5 sections, 14 worked examples). Topics: displacement, velocity
and acceleration vectors; projectile motion; uniform and nonuniform circular motion; relative
motion in one and two dimensions.

Catalog: the unit is `u2`. It lists the existing `projectile` lab and these coming labs:
`circular-motion`, `relative-motion` and the application lab `wind-triangle`. Move these from
`coming` to `labs` as you build them, and register each in `LAB_META` (`app: true` for the
application lab), in `src/labs/load.js`, and in `src/data/quantities.js` for the units panel.

## Deliverables

### 1. Physics (only if the library lacks it)

Search `packages/subjects` before writing anything. Anything a second course could use goes in
`packages/subjects/src/mechanics/` as a pure function, with a comment deriving it, and a selftest in
`motion-selftest.js` that checks it by a second method and by a scaling (double an input, predict
the factor). Likely needs: uniform and nonuniform circular motion (centripetal and tangential
acceleration from ω, α, r), and a relative-velocity solver for a heading that reaches a point in a
wind or current. `projectile`, `relativeVelocity` and `centripetalAccel` already exist; extend them
rather than duplicating. Keep every unit conversion going through `convert.js`.

### 2. Labs (to the standard)

- `projectile` (exists, logic only): draw it. Shows that complementary angles give the same range on
  level ground and not from a height, and that the horizontal and vertical motions do not affect
  each other. Recompute closed form with the quadratic landing time; check by step integration.
  Drag is left out and the lab says so.
- `circular-motion`: a particle on a circle, speed set by the student, steady or changing. Shows that
  the acceleration of steady circular motion points at the centre, scales as v²/r, and gains a
  tangential part when the speed changes. Recompute a_c = ω²r and a_t = αr; check with the numerical
  second derivative of x(t) and y(t) projected on the radius and the tangent.
- `relative-motion`: a boat across a river, a plane in a wind, a car seen from a truck. Shows that
  the velocity you see depends on the frame, that heading and track differ, and that to reach a point
  you aim upstream. Recompute v_ground = v_air + v_wind by components; check with the polygon and
  the heading from the sine rule.
- Application lab `wind-triangle`: a plane that must fly due north in a wind. Shows the heading that
  cancels the sideways drift and the ground speed that results. Numbers come from §4.5, "Flying a
  Plane in a Wind" (300 km/h in still air, a 90 km/h wind from the northeast); read that example's
  solution and reproduce its printed answers by our own computation. The explainer ends with a
  specific **What the course model leaves out.** (D30).

For every lab: the "Shows that …" line first in its doc comment; 2 or 3 scenarios with real numbers;
sliders; a `readoutCells` readout and a `law()` in TeX lines; a `second()` method that the labs-check
verifies; 2 to 4 predictions whose outcomes the lab computes (the spine names them: `projectile`:
30° to 60° at one speed, range the same and height larger, and doubling the speed gives range ×4 and
time ×2; `circular-motion`: doubling the speed at one radius gives a ×4; `relative-motion`: a faster
current against the same crossing time). Each prediction must be one a student could get wrong.

Draw with `src/scene/kit.js` and the core scene helpers. Set `fit: { w, h }` on each lab so it fills
the free space on a laptop and the band above the bottom sheet on a phone. Note that the label
renderer centres every label on its point and overrides CSS transforms, so place labels by position.
Colours keep their meanings (position blue, velocity white, acceleration pink, a marked instant
yellow); add Unit 2's own colours to `CONVENTIONS.md` if you need any.

### 3. Problems

Add `ch4` templates to `src/problems/bank/ch4.js` (there are 5 now) and put their traps, hints and
option explanations in a new `src/problems/coaching/u2.js`, merged in `coaching/index.js`. Add `'u2'`
to `STANDARD_UNITS` in `scripts/problems-check.mjs`. Meet every rule in the standard, section 5:

- at least 25% conceptual (every option, the correct one included, with a `why`); numeric templates
  at levels 1, 2 and 3; variety from structure, declared in `variety` or by a `choice` variable;
  designed numbers (choose the answer first and back-solve).
- every numeric part has at least two traps in the template, each the value a named mistake gives,
  and every trap must be able to fire (the check enforces it); at least two staged hints that stop
  short of the answer.
- every template has a case citing the book (`'OpenStax University Physics Vol. 1 §4.x, "Example
  title": inputs'`) that reproduces the printed answer by our own computation. Recompute every case
  value; the book uses g = 9.8 and rounds early, and the case `note` says where our number differs.
- every problem with a physical setup has `lab` and `sim`, so it opens its lab at the setup; the
  `sim.read` values must match the template's answers (problems-check runs this).
- families the spine lists: range, height and time of flight; a launch to or from a height; a launch
  at an angle up or down a slope; speed and acceleration in uniform circular motion from rpm or
  period; a total acceleration in nonuniform circular motion; a heading to reach a point in a wind
  or current. Conceptual: the direction of **a** at several points; a projectile at its top.
- traps the spine names: the level-ground range formula used for a launch from a height; v² taken as
  vₓ² only at the top; **a** pointing along the velocity in circular motion; degrees in ω; the wind
  added to the heading and not to the velocity.
- worked cases from §4.3 "A Fireworks Projectile Explodes High and Away" and "Comparing Golf Shots",
  §4.4 "Creating an Acceleration of 1 g", and §4.5 "Motion of a Car Relative to a Truck" and "Flying
  a Plane in a Wind".

Move the old bank's `ch4` templates onto the standard rather than leaving a second tier beside them.

### 4. Notes

Write `src/notes/content/u2-motion-in-two-and-three-dimensions.html`, register it in
`src/notes/units/u2.js` and `src/notes/index.js` (`NOTES = { u1, u2 }`), and its lab setups in
`src/notes/setups/u2.js` and `setups.js`. Structure exactly as Unit 1's file (header.top with a
legend and toc, `div.part` groups, numbered `section.topic`, boxes `ex`, `why`, `fix`, `key`, `out`
placed where the content needs them, a formula sheet last, a footer naming the source).

- Derive every result (projectile equations from the independent motions, v²/r from the geometry of
  the velocity change, the relative-velocity rule). Recompute every worked example; run a script to
  check each number before it goes in.
- At least six worked examples, each with a **Show this in the lab** setup where a lab can show it.
  `notes-check` runs every setup in the real lab within 2%. The tag after "Worked example · " must
  match the setup's `tag` exactly.
- A `box fix` for each mistake students make here (your traps are the list), and for any error in the
  book that you can prove by recomputing (Unit 1 found a rounding one). Do not invent corrections.
- A `box out` in each section with an idealisation (no drag; flat Earth; point mass).
- Voice: short declarative sentences, about 15 words. No em dashes. No "simply", "just", "actually".
  Derive, do not list. Say a thing once. Math is `\( \)` and `\[ \]`; a dollar sign is never a
  delimiter in a notes file. No raw `<` before a letter in the file.
- Cover §4.1 to §4.5 fully: every topic in the spine's block appears.

### 5. Checks and wiring

- `npm test` passes at the repo root (it runs the course's tex, labs, problems and notes checks, the
  storage and deps checks, the shells' tests and the scorecard). `npm run build` succeeds.
- Extend `courses/phy2048/scripts/catalog.test.mjs` (the unit's labs list) and `smoke.mjs` if needed.
  With the dev server on port 5180 (`npx vite --port 5180 --strictPort` from `courses/phy2048`),
  `npm run smoke -w @flux/phy2048` must pass at 380×820 and 1280×800.
- Look at every screenshot yourself at both sizes (Playwright is borrowed from a global install; see
  `scripts/playwright.mjs`): nothing covered, clipped or off screen; axis units right; text boxes at
  least 16 px on a phone. Fix what you see.
- Update `ROADMAP.md` (R5 progress), `CONVENTIONS.md`, `PROVENANCE.md` and the spine's status line.

### 6. Review and hand-off

Run `.claude/skills/flux-review-unit/SKILL.md` on the unit and fix what it finds. Spot-check five
templates by generating five versions each. Recompute one case by hand. Count the average sentence
length and em dashes in the notes.

Commit in logical steps (physics, labs, problems, notes, wiring) with this trailer on each message:

```
Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: <your session URL, if you have one>
```

Push with `git push -u origin claude/sharp-lovelace-iv2atn`. Finish with a short report: what you
built, the scorecard facts for Unit 2 (labs, minimum predictions, application labs, conceptual share,
lab examples), every `box fix` quoted, anything you could not fix, and anything you left out and why.

## Hard rules, in case you skim

- One unit per PR; Unit 2 only. Do not touch Unit 1's content except to fix a bug you can prove.
- A course writes no UI of its own: use the physics shell through the thin wrappers. A missing
  control becomes a shell hook behind a flag, with a test on the shell's fixture course
  (`packages/shells/test`). Shells name no course and no chapter. Imports run one way:
  courses → shells → subjects → core, and a course never imports another course.
- Every number on screen is computed, then checked a second way, in the course's tests.
- Storage keys are `flux.phy2048.<key>.v<n>`; do not add any without the storage check passing.
- Raw course files never ship; student data never enters the repo.
- Use heredocs with a quoted delimiter (or the Write tool) for JavaScript that contains backslashes;
  a Python non-raw string turns `\t` and `\r` in `\tfrac` and `\right` into control characters.
- Never kill processes with `pkill -f` or `pgrep -f` on a pattern that appears in your own command
  line; it kills your shell. Kill by pid.
- Do not claim a check passes without running it, and say so plainly when one fails.
