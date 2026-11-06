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
brief, the copy buttons, the Orbit self-check, and no sideways scroll at 390 and 1280 px.
