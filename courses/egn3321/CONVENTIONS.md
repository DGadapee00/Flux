# EGN 3321 conventions

These stay in this course. They are not copied into `packages/core`.

## Numbers

Answers use three significant figures. When the first significant digit is 1, use four.
The practice panel prints that way (`leadingOne` on this course's engine). Grading
accepts the exact value and the three-figure rounding, within 2%.

Kinematics uses \(g = 9.81\,\mathrm{m/s^2}\). The pound-force uses standard gravity,
9.80665 m/s², through `subjects/src/convert.js`. Those two constants are not interchangeable.
A note that mixes them says so.

Both SI and US customary appear. Conversion factors come from `convert.js`. A worked
answer in one system is checked by converting in the other direction.

## Citations

Generated numbers, cited by textbook section (Hibbeler Dynamics, and Hibbeler Statics
for the units sections). No textbook example number is copied or invented.

## Sections left out

The course pack does not name these, so they stay out (D11):

- cylindrical coordinates, §12.8 and §13.6
- dependent motion, §12.9
- central-force motion, §13.7
- steady flow of a mass system, §15.8
- rotating axes, §16.8

The rocket, §15.9, is kept. It is a Unit 3 lab (id `u4`), not part of Unit 1.

## Notes

Rewritten, one file per unit, in the notes-panel structure: eyebrow, h1, lede, toc,
`section.topic`. Math uses `\( \)` and `\[ \]` only. A dollar sign is never a delimiter
in a notes file. Voice is short and declarative. A common-mistake box names the mistake and the section.

Each result is derived before it is used. Every section but the formula sheet has at least one
worked example and ends with a `box out`, "What the model leaves out". A unit runs to at least
3,000 words. notes-check enforces all three.
