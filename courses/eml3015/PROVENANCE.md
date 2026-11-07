# Provenance

EML 3015 Fluids lives in this folder. There is no earlier repo to snapshot. The course is written
here, unit by unit. Units 1 to 3 are in.

## Textbook

| Book | Licence | Used for |
|---|---|---|
| Olivier Cleynen, *Fluid Dynamics for Engineers*, 2021 (fluidmech.ninja) | CC BY-SA, stated on the book's site | the course order, cited by chapter |

Nothing is copied from the book: no prose, figures, tables, worked examples or problems. Flux
writes its own text. The book appears only as citations, chapter numbers and titles, all in one
map, `src/data/textbook.js`.

## Property data

Viscosity and density of water, mercury, glycerol, olive oil and air are in
`packages/subjects/src/mechanics/couette.js`, from Wikipedia's List of viscosities and Density
pages, read on 6 November 2026.

## What course material is here

Unit 1 is viscosity and shear. The lab is plane Couette flow started from rest. The series solution
is our own derivation, and the second method is an explicit finite-difference march of the same
equation.

Unit 2 is pressure: a rectangular gate (closed form against a slice sum) and a liquid moving as
one body (surface by symmetry against a volume balance). Unit 3 is following the flow: a
one-dimensional nozzle (closed-form particle path against RK4 tracking) and a free vortex in a
bend (closed form against Simpson's rule). All are our own derivations. Liquid densities are round
handbook values.

No UNF syllabus or course pack was used.
