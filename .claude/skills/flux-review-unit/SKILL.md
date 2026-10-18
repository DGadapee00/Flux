---
name: flux-review-unit
description: Self-review one unit of a Flux course against PHY 2049's exemplars and the standard before opening its PR. Use at the end of flux-build-unit, or when asked to review a unit.
---

# Review a unit before its PR

The scorecard counts things. This review asks whether they are any good. Be as hard on your own work
as PHY 2049's content-drop protocol is on a source.

## Does it look like Flux?

- Open the unit beside PHY 2049 and Dynamics at 380×820 and 1280×800. Same header, same unit row,
  same lab tabs, same practice panel, same notes panel. Any screen that looks like a different app
  is a bug.
- Colours keep their meanings (docs/COURSE-STANDARD.md, section 2).

## Labs

- Read each lab's "Shows that …" line. Would a student who skipped the lab get that wrong? If not,
  the lab is decoration.
- Would anyone get each prediction wrong? A prediction everyone gets right teaches nothing.
- Does the application lab use a real device with real numbers, explained fully by this unit's
  equations? Is "What the model leaves out" specific?

## Problems

- Pick five templates at random and generate five versions each. Do they differ in structure, or
  only in numbers? Are the numbers ones a student can estimate?
- For each trap: is it a mistake students make? Does the value match what that mistake gives?
- Do the hints stop short of the answer?
- Does every worked case reproduce its cited printed answer? Recompute one by hand.
- Compare a level-3 template with the OCW counterpart's problem set. Is it as hard?

## Notes

- Hunt for errors the way `courses/phy2049/CLAUDE.md` describes: physics, signs and directions,
  labels, units, overstatements. Then do the same to your own text.
- Every topic in the spine's unit block appears. Every example is recomputed.
- Average sentence length near 15 words; no em dashes; no filler.
- Every "Section N" reference and every setup points at something that exists.

## Sources

- Nothing copied from a textbook, a course pack or OCW. Statements rewritten; figures your own.
- Every citation goes through `src/data/textbook.js` or names the OCW course, term and problem.

Report what you found and fixed in the PR body. List anything you could not fix.
