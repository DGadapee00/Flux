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

Dynamics covers what its mapped OCW lectures cover (D36, which puts D23 over the course pack's D11).
Two Hibbeler sections stay out, because neither 8.01SC's mapped weeks nor 2.003SC teaches them:

- central-force motion, §13.7
- steady flow of a mass system, §15.8

Polar coordinates (§12.8, §13.6) are in Unit 1, dependent motion (§12.9) and drag in Unit 2,
rotating axes (§16.8) in Unit 5, and Chapter 19 is Unit 8. The rocket, §15.9, is a Unit 3 lab
(id `u4`).

## Colours

The standard's meanings hold (docs/COURSE-STANDARD.md, section 2). In every lab:

- velocity is white; acceleration, and the kinetic diagram's \(m\vec a_G\) and \(I_G\alpha\), are purple;
- weight is grey, a normal or pin force teal, friction pink, and a tension, spring, push or thrust gold;
- the instantaneous centre and other marked points are yellow;
- two bodies compared side by side are red and blue.

A lab's legend line names only the colours it draws.

## Notes

Rewritten, one file per unit, structured as PHY 2049's notes (D32): eyebrow, h1, lede, legend,
a toc grouped by part, `div.part`, `section.topic`, and a source footer. Math uses `\( \)` and
`\[ \]` only. A dollar sign is never a delimiter in a notes file. Voice is short and declarative.
A common-mistake box names the mistake and the section.

Each result is derived before it is used. Every section but the formula sheet has at least one
worked example; notes-check enforces that and the structure. Boxes follow the content: a section
gets a `fix` for each mistake students make there, and a `box out` only where it uses an
idealisation worth naming (D30, D32). There is no word floor (D16).
