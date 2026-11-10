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

Still to build: drills in a course app's problem bank, and decisions for the other subsystems.

## Travelers: how a process is run

A decision says which process to pick. A traveler shows how that process is run, by following one
part through the shop. Build has two views, and a switch between them: the satellite, and Follow a
part. `?traveler=fsw-dome&station=schedule#applications` opens a station. The Welded option on the
Joints decision links to the traveler.

The first traveler is a friction stir welded tank dome: the 5.5 m dome NASA built at Marshall from
eight gore panels, a ring and a fitting in alloy 2195. It is one file,
`map/applications/travelers/fsw-dome.js`, with eleven stations from requirement to design. Every
station holds the same things:

- `what` happens, and what the engineer `decides`.
- `wrong`: what goes wrong, why, and how it is found.
- `paper`: the documents the station produces, such as the weld procedure and its qualification
  record, the nonconformance report and the data package.
- `ask`: what to ask on the floor.
- `concepts` on the map, and `sources`.
- `numbers`: optional, a block of the part's own numbers. `part`: what the drawing lights.

The dome's numbers follow it (`travelers/dome-numbers.js`). The learner sets the design pressure
and the diameter at the first station. From those come the load in each seam, the weld land that
neither breaks at 1.4 times pressure nor yields at proof, the crack each standard inspection is
counted on to find as a share of that land, what each repair kept of the weld's strength, and the
stress at proof. Everything but the two inputs is a figure a source states. The tests check the
seam loads against a force balance by integration, check the land against both strength checks
the other way round, and check each claim a station makes against the numbers.

A traveler carries `cases`: a situation at a station, what is known, a task and a rubric. The page
builds a case brief, with the dome as set, to take to the Claude Project. The Project instructions
say how to judge one. Flux keeps nothing.

Sources are NASA reports and standards, TWI and reference articles, each read on its `checked`
date. A station that states a figure must name a source. Standards that are sold, such as AWS
D17.3, are named and not reproduced. To add a traveler: write its file, add it to
`travelers/index.js`, and give `site/src/applications/traveler.js` a drawing of its part.

Still to build: travelers for machining from plate and metal printing.

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
brief, the copy buttons, the Orbit self-check, the Make side's cards, picks and records, every
station of the traveler, its numbers and a case brief, and no sideways scroll at 390 and 1280 px.

## Guided tank dome course

The Projects tab layers a beginner course over the original dome traveler. Its lesson data lives
in `site/src/applications/dome-course.js`. Requirements come first, then design, material
characterization, panel fabrication, fit-up, qualification, production welding, inspection,
nonconformance, proof and acceptance. Existing station URLs still work. The sourced traveler
and its checked sizing model remain the shop reference below each lesson.

Each lesson defines an outcome, plain-language vocabulary, a walkthrough, equipment and output
interpretation, a knowledge check with feedback, and a build-note prompt. Instrument diagrams
are qualitative schematics, not recorded data, machine settings or acceptance thresholds.
Completion needs a correct check and a written note. It records learning, not hardware approval.
The acceptance lesson asks for a full build plan and a teach-back of failure modes and evidence.

`dome-course-ui.js` keeps checks, notes, completion and entered sizing inputs in browser storage
at `flux.projects.dome-course.v1`. Continue learning opens the first incomplete lesson. Export
build plan downloads a Markdown learning record with station references. Storage failures leave
the course usable in memory and prompt export. These records are local to this browser; they
are not yet included in the Courses progress backup or synchronized between devices.

### Applied practice and build records

Each dome lesson now has four steps: Learn, Worked example, Practise and Build record.
`site/src/applications/dome-workshop.js` holds original worked reasoning, fictional training
records, calculation models, evidence-based decisions, four record prompts, four self-review
criteria and a transfer challenge for every station. It includes route costing, coupon stress,
tolerances, fit-up, qualification, sampled weld controls, coverage, repairs, unloading and
acceptance. Numerical training inputs and limits are explicitly fictional, not specifications
for the NASA article or actual hardware. Unit tests check each calculation independently.

The fit-up and weld exercises pair their data with a sampled plot. Learners can inspect each
location and compare it with the fictional band. A correct calculation alone does not pass:
the learner must also select the decision supported by the evidence. Inputs changing after a
check invalidate that check. A worked solution is available for self-study.

Completion now requires the knowledge check, applied practice, a written build note and all
four record criteria self-reviewed. Written reasoning is not automatically assessed. Editing
a note clears its self-review. Changing project sizing keeps notes and applied practice but
reopens build-record review. Older saved notes remain intact; earlier completion cannot bypass
the new practice. The capability view reports evidence by area without assigning a literacy
percentage. The final transfer challenge is a changed-pressure capstone; the Markdown export
contains practice results, written records, self-review criteria, references and a mentor
review brief for checking calculations and challenging the learner's explanation.
