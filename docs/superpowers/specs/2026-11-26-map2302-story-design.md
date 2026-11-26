# MAP 2302 notes: the story between parts and sections

## Why

The owner gets lost in where the notes are going. Each section is clear on its own. The notes
never say why one section follows the last, what the earlier tool could not do, or what the new
idea lets you do.

## Goal

A reader can tell at any point in a unit where they came from, what question is open now, and
what they will be able to do once it is answered.

- Non-goal: changing the math, the worked examples, the labs or the problems.
- Anti-goal: framing text that repeats the section's first paragraph, uses filler, or tells the
  reader something is powerful. It must give a reason or a payoff.

## Approaches

- **A. Prose bridges (chosen).** A short paragraph under each Part heading and at the top of each
  section. It reads as a story and flows into the math.
- B. A signpost box with From, Question and Unlocks lines. It is easier to scan but reads like a
  form, and it adds a box type to the legend.
- C. A roadmap only at the top of each unit. Dropped: the owner gets lost between sections, so one
  map up front does not fix it.

The owner chose A.

## Design

In each of the four files in `courses/map2302/src/notes/content/`:

1. **Unit route.** The header's `.lede` grows from a summary into a route. It says what the last
   unit left open, then names the Parts in order and why each comes next. Three to five sentences.
2. **Part bridges.** A `<p>` inside each `div.part`, after its `h2`. Two to four sentences: the
   question this Part answers, why it follows the last Part, and what it unlocks. The Reference part
   gets one sentence or none.
3. **Section openers.** A `<p>` placed first in each `section.topic`, after its `h2`. One to three
   sentences: what the last section left unanswered, what this one adds, what you can then do.
   The formula sheet sections get none.

Rules:

- The Voice rules in `AGENTS.md` apply. Short plain sentences, no em dashes, no filler.
- The text is original. No numbers are added, so no lab or notes setup checks change.
- Existing paragraphs stay. If an opener makes an existing first sentence redundant, keep the
  existing sentence and adjust the opener.
- Payoffs name the course's own devices and labs where possible: the coffee server, the
  suspension, the RLC circuit, the radio tuner and the pendulum clock.
- No CSS changes. The shared `notes.css` already styles a `<p>` inside `.part`.

## Left to the builder

- The wording of every bridge, read against the full section it introduces.
- Whether a Part bridge and its first section's opener both need to exist, or whether one carries
  both.

## Checks

`npm test`, `npm run build`, `node packages/checks/raw.mjs`. Screenshots of one notes page at
390×844 and 1280×800, light and dark.
