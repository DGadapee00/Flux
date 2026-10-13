# Errata

Places where the app's answer differs from a printed value in the textbook's tables. Each is recomputed; the practice problem's solution says the same thing where it applies.

## Textbook tables (Appendix A)

`scripts/stats-check.mjs` compares every printed t, χ² and F entry with the exact value. Entries off
by more than one unit in the last printed place:

- Table A.4, t₀.₀₀₀₅ with ν = 1: printed 636.578, exact 636.619.
- Table A.5, α = 0.001 column, ν = 13, 19, 21, 27, 30, 40: each off by a little over one unit in the
  last place (for example ν = 13: printed 34.527, exact 34.528).

The grader accepts the printed value and the exact value.
