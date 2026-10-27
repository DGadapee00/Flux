# Provenance

BENCH is a personal-projects module with no UNF course behind it. Its plan,
`docs/course-plans/bench.md`, sets the units and their order (DECISIONS.md, D35). Nothing in it is
copied from any source: the notes, labs and problems are written for this course and cite what they
rest on through `src/data/textbook.js`.

## Sources

1. **Textbook:** Tony R. Kuphaldt, *Lessons in Electric Circuits*, volumes I–VI, free online at
   ibiblio.org. Its licence is the Design Science License, as the book states; confirm it on the
   publisher page before quoting it anywhere. Cited by volume and chapter only. The chapter numbers
   in `src/data/textbook.js` were written from the book's table of contents and should be checked
   against the edition read.
2. **Specifications:** USB 2.0 (USB-IF, 2000), §7.2, for a port's voltage window (4.75 to 5.25 V) and
   its 500 mA limit; USB Battery Charging 1.2 (USB-IF, 2010) for a charging port's 1.5 A. Figures
   only.
3. **Wire table:** the American Wire Gauge resistance of copper at 20 °C: 28 AWG 0.2129 Ω/m, 26 AWG
   0.1339, 24 AWG 0.0842, 22 AWG 0.0530.
4. **Another view:** MIT 6.091, *Hands-On Introduction to EE Lab Skills* (IAP 2008). The owner shared
   its handouts on 27 Oct 2026; they were read, not stored, and nothing from them is copied.

## Illustrative values

Each lab says which of its numbers are illustrative rather than measured or specified:

- The multimeter's 10 MΩ on volts, 0.5 Ω and 200 mA fuse on the mA jack, and its 1 V, 10 kΩ ohms
  source are typical of a handheld meter, not one maker's.
- The 9 V battery's 1.5 Ω internal resistance is a typical figure for a fresh alkaline cell.
- The power bank's 5.10 V, 0.1 Ω output, 2.1 A port and 85% conversion efficiency, and the laptop
  port's 5.05 V and 0.15 Ω, are illustrative. The bank's 10,000 mAh at 3.7 V (37 Wh) follows how
  banks are labelled.

## Shared code

The circuit solver (`packages/subjects/src/em/mna.js`) came from PHY 2049. The breadboard model
(`packages/subjects/src/em/breadboard.js`) was written for this course and has its own tests.
