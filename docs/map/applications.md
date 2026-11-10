# Applications

The concept map shows how ideas connect. Applications show what those ideas help a person build.
The first application is an educational satellite model, reached from the hub's Applications link.
`?application=satellite&component=power#applications` opens a subsystem.

## A recipe is a reference and a how-to

Each subsystem recipe in `map/applications/satellite.js` holds:

- `concepts`: the foundations on the map. Each shows where the learner stands, from Today.
- `labs`: the Flux labs that teach those foundations.
- `method`: the steps to do the work, in order.
- `references`: sources read and chosen for the subsystem, each with our own reason.
- `checklist`: what a good result contains. It is also the review's rubric.
- `demonstrate`, `deliverable`, `interface`: the task, what to produce and what it passes on.
- `requires`: every subsystem whose numbers it uses. Communications needs the payload's data volume
  and Thermal needs its operating limits, so both require Payload. Components are listed and
  numbered in build order: working from 01 to 07 never needs a later one. A test keeps that order.
- `gap`: what Flux has not built for this step yet.

Existing courses, labs and notes stay where they are. Satellite-specific labs and the coupled
mission simulator remain visible gaps. A recipe does not imply those tools are built.

## Decisions: the Make side

A recipe sizes a subsystem. Its decisions turn that sizing into hardware, framed as one shop that
takes raw stock in and sends tested hardware out. Structure has the first four: material, process,
joints and finish. `?application=satellite&component=structure&decision=structure-material#applications`
opens one.

A decision is a card to read in a minute. It is one file in `map/applications/decisions/`:

- `question`, `lede` and two or three `drivers`: the requirements that decide it.
- `options`: the usual three to six. Each has a value for every column, the case `for` and
  `against`, and `own`: what the shop must have to run it in-house.
- `columns` and, where the figures allow, `derived` columns computed from them.
- `pick`: the usual pick and why. `changes`: what would change it. `watch`: what bites later.
- `links`: an option goes with, or rules out, options of the other decisions, each with a reason.
  Design, material and process are one choice. A link is written once and read from both ends.
- `concepts` on the map and `references`.

Every figure names its source. `map/applications/decisions/refs.js` lists each source with the
date it was read and our own reason. An option that states a figure must name a reference, and
`map/test/decisions.test.js` fails when one does not. The same test recomputes the derived columns
a second way, checks that the plate index ranks materials as the mass of a sized plate does, and
checks each claim the cards make about the numbers against the numbers in the table.

On the hub (`site/src/applications/make.js`) a pick in one card marks what it goes with and rules
out in the others, and `conflicts()` in `map/applications/decide.js` reports picks that cannot be
made together. Picks live in the page only. Each card builds a five-line decision record to copy
out: the choice, what drove it, what was rejected and why, the risk accepted, and what would change
it. The facts are filled in and the reasons are left to write. The subsystem's review brief asks
for the records, and the Project instructions say how to judge one.

To add a decision: write its file, add it to `decisions/index.js`, and list its id on the recipe's
`decisions` in the order the choices are made. Read every source before citing it.

Still to build: travelers, which follow one process station by station (machining from plate, metal
printing, friction stir welding), cases to practise on, and drills in a course app's problem bank.

## Review happens in a Claude Project

Flux teaches and refers; it does not grade the work. The learner makes one Claude Project for the
satellite and pastes the Project instructions into it once (the hub has a copy button). For each
subsystem, the hub builds a review brief: the task, its inputs, the method, the checklist, the
foundations with the learner's standing, the references, and a slot for the learner's numbers. The
learner opens a new chat in the Project, pastes the brief and attaches their work. A fresh chat
keeps each review on its own. The instructions ask the reviewer to recompute every number by a
second method, go through the checklist item by item, and name the next step.

`site/src/applications/brief.js` writes both texts as plain text. A test checks that each brief
carries the task, every checklist item, every reference and every input subsystem.

Orbit keeps a number check as a self-check. You give an altitude, a speed and a period; Flux
computes the speed and period from \(v=\sqrt{GM/r}\) and again by integrating the orbit
(`packages/subjects/src/mechanics/orbit-check.js`). Within 1% of both passes. It records nothing.

## Earlier records

Earlier versions kept capability records in the hub (studied, demonstrated, integrated) and linked
a separate design-review site for enclosure files. Both are gone from the page. Records already
saved stay in the browser at `flux.applications.satellite.v1` and in Progress backups, so an old
backup still restores; `site/src/applications/progress.js` keeps that format. Deleting them is the
owner's call.

`npm run map-gaps` adds 2 to a gap's score for each recipe that names it, and prints which recipes
use it. `npm run smoke` runs the applications browser check after the hub's: every subsystem's
brief, the copy buttons, the Orbit self-check, the Make side's cards, picks and records, and no
sideways scroll at 390 and 1280 px.
